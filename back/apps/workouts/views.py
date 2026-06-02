import json
import time

from django.db import close_old_connections
from django.db.models import Count, Max, Q
from django.http import StreamingHttpResponse
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ExerciseReaction, Workout
from .serializers import WorkoutSerializer

# View-классы принимают HTTP-запросы от frontend и решают, что делать:
# вернуть список тренировок, создать тренировку, удалить тренировку или обработать реакции.
# URL-адреса, которые ведут к этим view, описаны в `urls.py`.


def serialize_exercise_reactions(user):
    """Собирает реакции на упражнения в формат, удобный фронтенду.

    На вход получает Django-пользователя. Сначала отдельным запросом строит
    словарь реакций этого пользователя, затем агрегирует все лайки и дизлайки
    через `Count(..., filter=Q(...))`. Возвращает JSON-совместимый словарь,
    который используют обычный endpoint и SSE-поток.
    """
    user_reactions = dict(
        ExerciseReaction.objects
        .filter(user=user)
        .values_list('exercise_name', 'value')
    )

    rows = (
        ExerciseReaction.objects
        .values('exercise_name')
        .annotate(
            likes=Count('id', filter=Q(value=ExerciseReaction.LIKE)),
            dislikes=Count('id', filter=Q(value=ExerciseReaction.DISLIKE)),
        )
        .order_by('exercise_name')
    )

    reactions = []
    for row in rows:
        exercise_name = row['exercise_name']
        reactions.append({
            'exercise_name': exercise_name,
            'likes': row['likes'],
            'dislikes': row['dislikes'],
            'user_reaction': user_reactions.get(exercise_name),
        })

    return {'reactions': reactions}


def get_exercise_reaction_version():
    """Возвращает короткую версию состояния реакций.

    Версия состоит из общего количества записей и последнего `updated_at`.
    SSE-поток сравнивает это значение с предыдущим и отправляет данные
    только когда реакции реально изменились.
    """
    aggregate = ExerciseReaction.objects.aggregate(
        total=Count('id'),
        latest=Max('updated_at'),
    )
    latest = aggregate['latest'].isoformat() if aggregate['latest'] else ''
    return f"{aggregate['total']}:{latest}"


def format_sse(data, event='message'):
    """Упаковывает Python-словарь в текстовый формат Server-Sent Events.

    `data` сериализуется в JSON, `event` становится именем события.
    Фронтенд получает это через `EventSource` и слушает событие `reactions`.
    """
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


class WorkoutListCreateView(generics.ListCreateAPIView): #ListCreateAPIView - это встроенный класс DRF, который реализует GET для списка и POST для создания.
    """API для списка тренировок и создания новой тренировки.

    GET `/api/workouts/` берет тренировки текущего пользователя.
    POST `/api/workouts/` принимает JSON из формы добавления и передает его
    в `WorkoutSerializer`, который создает Workout, ExerciseEntry и SetEntry.
    """
    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticated] #только авторизованные пользователи могут использовать этот API. DRF проверяет авторизацию до входа в методы get/post, и если пользователь не авторизован, возвращает 401 ошибку.

    def get_queryset(self):
        """Возвращает только тренировки текущего пользователя.

        `prefetch_related('exercises__sets')` заранее подгружает вложенные
        упражнения и подходы, чтобы сериализатор не делал лишние запросы к базе.
        """
        return Workout.objects.filter(user=self.request.user).prefetch_related('exercises__sets')

    def perform_create(self, serializer):
        """Сохраняет новую тренировку от имени текущего пользователя.

        `user` не доверяем фронтенду и не принимаем из JSON: берем его
        из `self.request.user`, то есть из Django-сессии.
        """
        serializer.save(user=self.request.user) #Сохраняем тренировку, передавая текущего пользователя 


class WorkoutDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API для просмотра, изменения и удаления одной тренировки по id."""
    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Workout.objects.prefetch_related('exercises__sets')#Здесь мы заранее подгружаем упражнения и подходы, чтобы при запросе конкретной тренировки не было лишних запросов к базе данных. DRF будет использовать этот queryset в методе get_object(), который вызывается для получения объекта по id из URL. В get_object() мы дополнительно проверяем, что тренировка принадлежит текущему пользователю, чтобы никто не мог получить или изменить чужую тренировку.

    def get_object(self):
        """Берет объект стандартным методом DRF и проверяет владельца.

        Если id существует, но тренировка принадлежит другому пользователю,
        выбрасывается `PermissionDenied`, чтобы чужие записи нельзя было читать,
        редактировать или удалять.
        """
        obj = super().get_object()#Сначала получаем объект тренировки по id через стандартный метод DRF. Этот метод уже учитывает фильтрацию по текущему пользователю, но мы дополнительно проверяем, что найденная тренировка действительно принадлежит этому пользователю, на всякий случай.
        if obj.user_id != self.request.user.id:
            raise PermissionDenied('Это не ваша тренировка.')
        return obj


class ExerciseReactionListView(APIView):
    """GET endpoint для начальной загрузки лайков/дизлайков упражнений."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Возвращает агрегированные реакции через `serialize_exercise_reactions()`."""
        return Response(serialize_exercise_reactions(request.user))


class ExerciseReactionStreamView(APIView):
    """SSE endpoint для живого обновления реакций на странице справочника."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Открывает поток `text/event-stream` и держит соединение с браузером."""
        user = request.user

        def event_stream():
            """Генератор SSE-событий.

            Каждую секунду проверяет версию реакций. Если данные изменились,
            отправляет событие `reactions`; если нет, отправляет keep-alive,
            чтобы соединение не закрылось из-за простоя.
            """
            last_version = None

            while True:
                close_old_connections()
                current_version = get_exercise_reaction_version()

                if current_version != last_version:
                    last_version = current_version
                    yield format_sse(serialize_exercise_reactions(user), event='reactions')
                else:
                    yield ': keep-alive\n\n'

                time.sleep(1)

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class ExerciseReactionVoteView(APIView):
    """POST endpoint для лайка или дизлайка упражнения."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Сохраняет реакцию пользователя и возвращает новые счетчики.

        Принимает `exercise_name` и `value` из JSON. `update_or_create()`
        обеспечивает правило: у одного пользователя может быть только одна
        реакция на конкретное упражнение.
        """
        exercise_name = str(request.data.get('exercise_name', '')).strip()
        value = request.data.get('value')

        if not exercise_name:
            return Response({'error': 'Exercise name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if value not in {ExerciseReaction.LIKE, ExerciseReaction.DISLIKE}:
            return Response({'error': 'Reaction must be like or dislike.'}, status=status.HTTP_400_BAD_REQUEST)

        ExerciseReaction.objects.update_or_create(
            user=request.user,
            exercise_name=exercise_name,
            defaults={'value': value},
        )

        counts = ExerciseReaction.objects.filter(exercise_name=exercise_name).aggregate(
            likes=Count('id', filter=Q(value=ExerciseReaction.LIKE)),
            dislikes=Count('id', filter=Q(value=ExerciseReaction.DISLIKE)),
        )

        return Response({
            'exercise_name': exercise_name,
            'likes': counts['likes'],
            'dislikes': counts['dislikes'],
            'user_reaction': value,
        })

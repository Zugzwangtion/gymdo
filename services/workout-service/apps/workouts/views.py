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


def serialize_exercise_reactions(user):
    user_reactions = dict(
        ExerciseReaction.objects
        .filter(user_id=user.id)
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
    aggregate = ExerciseReaction.objects.aggregate(
        total=Count('id'),
        latest=Max('updated_at'),
    )
    latest = aggregate['latest'].isoformat() if aggregate['latest'] else ''
    return f"{aggregate['total']}:{latest}"


def format_sse(data, event='message'):
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


class WorkoutListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Пользователь видит только свои тренировки, чужие записи не попадают в ответ API.
        return Workout.objects.filter(user_id=self.request.user.id).prefetch_related('exercises__sets')

    def perform_create(self, serializer):
        # user не приходит с фронтенда: мы берем его из текущей сессии.
        serializer.save(user_id=self.request.user.id)


class WorkoutDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Workout.objects.prefetch_related('exercises__sets')

    def get_object(self):
        obj = super().get_object()
        if obj.user_id != self.request.user.id:
            raise PermissionDenied('Это не ваша тренировка.')
        return obj


class ExerciseReactionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(serialize_exercise_reactions(request.user))


class ExerciseReactionStreamView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        def event_stream():
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
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        exercise_name = str(request.data.get('exercise_name', '')).strip()
        value = request.data.get('value')

        if not exercise_name:
            return Response({'error': 'Exercise name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if value not in {ExerciseReaction.LIKE, ExerciseReaction.DISLIKE}:
            return Response({'error': 'Reaction must be like or dislike.'}, status=status.HTTP_400_BAD_REQUEST)

        ExerciseReaction.objects.update_or_create(
            user_id=request.user.id,
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

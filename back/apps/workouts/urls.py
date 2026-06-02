from django.urls import path
from .views import (
    ExerciseReactionListView,
    ExerciseReactionStreamView,
    ExerciseReactionVoteView,
    WorkoutDetailView,
    WorkoutListCreateView,
)

# Этот файл связывает URL-адреса приложения workouts с view-классами.
# Когда frontend делает запрос на `/api/workouts/...`, Django сначала попадает сюда,
# находит подходящий `path(...)`, а потом вызывает нужный класс из `views.py`.
urlpatterns = [
    # GET /api/workouts/exercise-reactions/
    # Возвращает текущие лайки/дизлайки упражнений для справочника.
    path('exercise-reactions/', ExerciseReactionListView.as_view(), name='exercise-reaction-list'),

    # GET /api/workouts/exercise-reactions/stream/
    # Открывает SSE-поток, чтобы справочник получал обновления реакций без перезагрузки страницы.
    path('exercise-reactions/stream/', ExerciseReactionStreamView.as_view(), name='exercise-reaction-stream'),

    # POST /api/workouts/exercise-reactions/vote/
    # Сохраняет лайк или дизлайк пользователя на конкретное упражнение.
    path('exercise-reactions/vote/', ExerciseReactionVoteView.as_view(), name='exercise-reaction-vote'),

    # GET /api/workouts/ - список тренировок текущего пользователя.
    # POST /api/workouts/ - создание новой тренировки вместе с упражнениями и подходами.
    path('', WorkoutListCreateView.as_view(), name='workout-list-create'),

    # GET /api/workouts/<id>/ - получить одну тренировку.
    # PUT/PATCH /api/workouts/<id>/ - обновить тренировку.
    # DELETE /api/workouts/<id>/ - удалить тренировку.
    path('<int:pk>/', WorkoutDetailView.as_view(), name='workout-detail'), # Позволяет получать, обновлять или удалять конкретную тренировку по её ID.
]

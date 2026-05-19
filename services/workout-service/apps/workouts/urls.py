from django.urls import path
from .views import (
    ExerciseReactionListView,
    ExerciseReactionStreamView,
    ExerciseReactionVoteView,
    WorkoutDetailView,
    WorkoutListCreateView,
)

urlpatterns = [
    path('exercise-reactions/', ExerciseReactionListView.as_view(), name='exercise-reaction-list'),
    path('exercise-reactions/stream/', ExerciseReactionStreamView.as_view(), name='exercise-reaction-stream'),
    path('exercise-reactions/vote/', ExerciseReactionVoteView.as_view(), name='exercise-reaction-vote'),
    path('', WorkoutListCreateView.as_view(), name='workout-list-create'),
    path('<int:pk>/', WorkoutDetailView.as_view(), name='workout-detail'),
]

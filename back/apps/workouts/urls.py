from django.urls import path
from .views import WorkoutDetailView, WorkoutListCreateView

urlpatterns = [
    path('', WorkoutListCreateView.as_view(), name='workout-list-create'),
    path('<int:pk>/', WorkoutDetailView.as_view(), name='workout-detail'),
]

from django.urls import path

from . import views

app_name = 'pages'

urlpatterns = [
    path('', views.home_view, name='home'),
    path('login/', views.login_page_view, name='login'),
    path('register/', views.register_page_view, name='register'),
    path('add/', views.add_workout_page_view, name='add'),
    path('workouts/<int:workout_id>/', views.workout_detail_page_view, name='workout_detail'),
    path('guide/', views.guide_page_view, name='guide'),
]

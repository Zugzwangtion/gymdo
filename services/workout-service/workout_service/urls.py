from django.urls import include, path

urlpatterns = [
    path('api/workouts/', include('apps.workouts.urls')),
]

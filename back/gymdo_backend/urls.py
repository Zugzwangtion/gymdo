from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Обычные страницы сайта: главная, вход, регистрация, добавление тренировки.
    path('', include('apps.pages.urls')),
    path('admin/', admin.site.urls),
    # API, с которым общается JavaScript на страницах.
    path('api/auth/', include('apps.accounts.urls')),
    path('api/workouts/', include('apps.workouts.urls')),
    path('api/support/', include('apps.support.urls')),
]

from django.conf import settings
from django.db import models


class TelegramProfile(models.Model):
    """Дополнительный профиль для пользователя, вошедшего через Telegram.

    Основной пользователь все равно хранится в стандартной Django-модели User.
    Эта модель связывает User с `telegram_id` и хранит данные, которые пришли
    из Telegram Login Widget: username, имя, фамилию, фото и дату авторизации.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='telegram_profile')
    telegram_id = models.BigIntegerField(unique=True)
    telegram_username = models.CharField(max_length=255, blank=True)
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    photo_url = models.URLField(blank=True)
    auth_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """Показывает связь Django-пользователя и Telegram id в админке."""
        return f'{self.user.username} ({self.telegram_id})'

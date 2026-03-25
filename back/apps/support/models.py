from django.conf import settings
from django.db import models


class SupportMessage(models.Model):
    TYPE_BUG = 'Баг'
    TYPE_FEATURE = 'Предложение'
    TYPE_QUESTION = 'Вопрос'

    TYPE_CHOICES = [
        (TYPE_BUG, 'Сообщить о баге'),
        (TYPE_FEATURE, 'Предложить функцию'),
        (TYPE_QUESTION, 'Задать вопрос'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_messages')
    type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    message = models.TextField()
    telegram_delivery_ok = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username}: {self.type}'

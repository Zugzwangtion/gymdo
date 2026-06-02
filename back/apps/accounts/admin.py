from django.contrib import admin
from .models import TelegramProfile


@admin.register(TelegramProfile)
class TelegramProfileAdmin(admin.ModelAdmin):
    """Настройки Django admin для TelegramProfile.

    `list_display` задает колонки в таблице, `search_fields` позволяет быстро
    найти профиль по Django username, Telegram username или telegram_id.
    """
    list_display = ('user', 'telegram_id', 'telegram_username', 'updated_at')
    search_fields = ('user__username', 'telegram_username', 'telegram_id')

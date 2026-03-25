from django.contrib import admin
from .models import TelegramProfile


@admin.register(TelegramProfile)
class TelegramProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'telegram_id', 'telegram_username', 'updated_at')
    search_fields = ('user__username', 'telegram_username', 'telegram_id')

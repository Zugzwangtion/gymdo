from django.contrib import admin
from .models import SupportMessage


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'type', 'telegram_delivery_ok', 'created_at')
    list_filter = ('type', 'telegram_delivery_ok')
    search_fields = ('user__username', 'message')

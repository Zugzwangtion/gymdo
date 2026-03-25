from rest_framework import serializers
from .models import SupportMessage


class SupportMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportMessage
        fields = ('type', 'message')

    def validate_message(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Сообщение не должно быть пустым.')
        if len(value) > 4000:
            raise serializers.ValidationError('Сообщение слишком длинное.')
        return value

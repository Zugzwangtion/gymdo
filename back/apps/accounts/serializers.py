from rest_framework import serializers


class CurrentUserSerializer(serializers.Serializer):
    """Описывает JSON текущего пользователя для frontend.

    Это не ModelSerializer, потому что данные собираются из нескольких мест:
    стандартного Django User, признака авторизации и связанного TelegramProfile.
    Serializer фиксирует форму ответа, чтобы фронтенд всегда получал одинаковые
    поля.
    """
    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField(allow_blank=True)
    last_name = serializers.CharField(allow_blank=True)
    is_authenticated = serializers.BooleanField()
    telegram_id = serializers.IntegerField(allow_null=True)
    telegram_username = serializers.CharField(allow_blank=True, allow_null=True)

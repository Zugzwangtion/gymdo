from rest_framework import serializers


class CurrentUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField(allow_blank=True)
    last_name = serializers.CharField(allow_blank=True)
    is_authenticated = serializers.BooleanField()
    telegram_id = serializers.IntegerField(allow_null=True)
    telegram_username = serializers.CharField(allow_blank=True, allow_null=True)

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import SupportMessageCreateSerializer
from .services import TelegramSupportError, send_support_message
from .models import SupportMessage


class SupportCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SupportMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        support_message = SupportMessage.objects.create(
            user=request.user,
            type=serializer.validated_data['type'],
            message=serializer.validated_data['message'],
        )

        try:
            send_support_message(request.user.username, support_message.type, support_message.message)
            support_message.telegram_delivery_ok = True
            support_message.save(update_fields=['telegram_delivery_ok'])
        except TelegramSupportError as exc:
            return Response(
                {
                    'ok': False,
                    'error': 'Не удалось отправить сообщение в Telegram.',
                    'details': str(exc),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({'ok': True, 'message': 'Сообщение отправлено.'})

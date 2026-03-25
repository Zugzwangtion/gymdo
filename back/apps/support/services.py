import requests
from django.conf import settings


class TelegramSupportError(Exception):
    pass


def send_support_message(username: str, issue_type: str, message: str):
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_SUPPORT_CHAT_ID:
        raise TelegramSupportError('Telegram support credentials are not configured')

    text = (
        '📩 Новое обращение в поддержку\n\n'
        f'Пользователь: {username}\n'
        f'Тип: {issue_type}\n\n'
        f'Сообщение:\n{message}'
    )

    response = requests.post(
        f'https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage',
        json={
            'chat_id': settings.TELEGRAM_SUPPORT_CHAT_ID,
            'text': text,
        },
        timeout=10,
    )
    if not response.ok:
        raise TelegramSupportError(f'Telegram API error: {response.text}')
    return response.json()

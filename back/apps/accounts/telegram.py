import hashlib
import hmac
from datetime import datetime, timezone
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.http import HttpRequest

from .models import TelegramProfile


class TelegramAuthError(Exception):
    """Ошибка авторизации через Telegram Login Widget."""
    pass


def _secret_key() -> bytes:
    """Готовит секретный ключ для проверки подписи Telegram.

    Telegram требует использовать SHA256 от токена бота. Если токен не задан
    в настройках, авторизация через Telegram считается неправильно настроенной.
    """
    token = settings.TELEGRAM_BOT_TOKEN
    if not token:
        raise TelegramAuthError('TELEGRAM_BOT_TOKEN is not configured')
    return hashlib.sha256(token.encode()).digest()


def verify_telegram_widget_payload(payload: dict) -> dict:
    """Проверяет, что данные действительно подписаны Telegram, а не подделаны.

    На вход получает словарь query-параметров от Telegram. Функция достает
    `hash`, строит `data_check_string`, считает HMAC-SHA256 и сравнивает
    подписи через `hmac.compare_digest()`. Дополнительно проверяет свежесть
    `auth_date`, чтобы старые данные нельзя было переиспользовать.
    """
    payload = {k: v for k, v in payload.items() if v not in (None, '')}
    their_hash = payload.pop('hash', None)
    if not their_hash:
        raise TelegramAuthError('Missing hash from Telegram payload')

    data_check_string = '\n'.join(f'{k}={payload[k]}' for k in sorted(payload.keys()))
    expected_hash = hmac.new(_secret_key(), data_check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_hash, their_hash):
        raise TelegramAuthError('Invalid Telegram signature')

    auth_ts = int(payload.get('auth_date', 0))
    if auth_ts:
        auth_dt = datetime.fromtimestamp(auth_ts, tz=timezone.utc)
        max_age_seconds = 3600
        if (datetime.now(timezone.utc) - auth_dt).total_seconds() > max_age_seconds:
            raise TelegramAuthError('Telegram auth payload is too old')
        payload['auth_datetime'] = auth_dt

    return payload


def get_or_create_user_from_telegram(payload: dict, request: HttpRequest):
    """Находит пользователя по telegram_id или создает нового Django-пользователя.

    `payload` уже должен быть проверен через `verify_telegram_widget_payload()`.
    Функция ищет `TelegramProfile`, при отсутствии создает User и профиль,
    обновляет имя/фото из Telegram и вызывает `login(request, user)`, чтобы
    создать обычную Django-сессию.
    """
    User = get_user_model()
    telegram_id = int(payload['id'])
    username_base = payload.get('username') or f'tg_{telegram_id}'
    username = username_base[:150]

    profile = TelegramProfile.objects.select_related('user').filter(telegram_id=telegram_id).first()
    if profile:
        user = profile.user
    else:
        suffix = 1
        candidate = username
        while User.objects.filter(username=candidate).exists():
            suffix += 1
            candidate = f'{username[:145]}_{suffix}'
        user = User.objects.create(username=candidate, first_name=payload.get('first_name', ''), last_name=payload.get('last_name', ''))
        profile = TelegramProfile.objects.create(user=user, telegram_id=telegram_id)

    user.first_name = payload.get('first_name', user.first_name)
    user.last_name = payload.get('last_name', user.last_name)
    user.save(update_fields=['first_name', 'last_name'])

    profile.telegram_username = payload.get('username', '')
    profile.first_name = payload.get('first_name', '')
    profile.last_name = payload.get('last_name', '')
    profile.photo_url = payload.get('photo_url', '')
    profile.auth_date = payload.get('auth_datetime')
    profile.save()

    login(request, user)
    return user


def logout_telegram_user(request: HttpRequest):
    """Выходит из Telegram-авторизации так же, как из обычной Django-сессии."""
    logout(request)


def telegram_login_widget_script(origin: str) -> str:
    """Собирает HTML script для Telegram Login Widget.

    `origin` нужен, чтобы построить callback URL, куда Telegram вернет
    подписанные данные пользователя после нажатия кнопки входа.
    """
    bot_name = settings.TELEGRAM_LOGIN_BOT_USERNAME
    if not bot_name:
        raise TelegramAuthError('TELEGRAM_LOGIN_BOT_USERNAME is not configured')
    callback = f"{origin.rstrip('/')}/api/auth/telegram/callback/"
    return (
        '<script async src="https://telegram.org/js/telegram-widget.js?22" '
        f'data-telegram-login="{bot_name}" '
        'data-size="large" '
        'data-userpic="false" '
        'data-request-access="write" '
        f'data-auth-url="{callback}"></script>'
    )

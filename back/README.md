# GymDo Django backend starter

Этот каркас переводит проект с localStorage на Django + Django REST Framework + SQLite.

## Что уже заложено
- session-based auth через Django
- заготовка входа через Telegram Login Widget
- модели тренировок: Workout -> ExerciseEntry -> SetEntry
- endpoint поддержки с отправкой в Telegram Bot API
- admin для пользователей, Telegram-профилей, тренировок и поддержки

## Структура API
- `GET /api/auth/me/`
- `POST /api/auth/logout/`
- `GET /api/auth/telegram/start/?origin=http://localhost:8000`
- `GET /api/auth/telegram/callback/`
- `POST /api/auth/telegram/verify-widget/`
- `GET /api/workouts/`
- `POST /api/workouts/`
- `GET /api/workouts/<id>/`
- `PUT /api/workouts/<id>/`
- `DELETE /api/workouts/<id>/`
- `POST /api/support/`

## Быстрый старт
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py makemigrations accounts workouts support
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Что подключить на фронте дальше
1. Убрать `auth.js` с localStorage.
2. Кнопку входа заменить на `Войти через Telegram`.
3. После логина спрашивать `GET /api/auth/me/`.
4. Главную страницу перевести с localStorage на `GET /api/workouts/`.
5. Форму добавления тренировки перевести на `POST /api/workouts/`.
6. Удаление тренировки перевести на `DELETE /api/workouts/<id>/`.

## Telegram auth
В этом стартере добавлен серверный verify для payload от Telegram Login Widget.
Для работы нужно:
- создать бота в BotFather
- прописать домен/allowed URLs у Telegram Login
- указать `TELEGRAM_BOT_TOKEN`
- указать `TELEGRAM_LOGIN_BOT_USERNAME`

Если захочешь перейти на новый Telegram Login flow / OIDC, backend-слой auth уже выделен отдельно, так что его можно будет заменить без переписывания workout API.

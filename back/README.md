# GymDo

GymDo - учебное веб-приложение для учета тренировок.

Проект работает как единое Django-приложение: страницы лежат в `apps.pages/templates`, а CSS, JavaScript и изображения подключаются через Django static files из `apps.pages/static`.

## Что умеет проект

- регистрация и вход по логину и паролю;
- хранение сессии пользователя через Django;
- добавление тренировок с упражнениями и подходами;
- расчет тоннажа тренировки;
- календарь тренировок;
- простая статистика и график;
- справочник упражнений;
- карта мышц по нагрузке за последние 7 дней.

## Быстрый запуск

```bash
cd back
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Запуск через Docker

```bash
cd ..
docker compose up --build
```

После запуска открой:

```text
http://127.0.0.1:8000/
```

Остановить контейнеры:

```bash
docker compose down
```

Микросервисная версия описана в `../MICROSERVICES.md`.

После запуска открой:

```text
http://127.0.0.1:8000/
```

## Основные страницы

- `/` - главная страница с календарем, статистикой и картой мышц.
- `/login/` - вход.
- `/register/` - регистрация.
- `/add/` - добавление тренировки.
- `/guide/` - справочник упражнений.
- `/admin/` - стандартная Django-админка.

## Основные API

- `GET /api/auth/me/` - узнать, вошел ли пользователь.
- `POST /api/auth/register/` - зарегистрироваться.
- `POST /api/auth/login/` - войти.
- `POST /api/auth/logout/` - выйти.
- `GET /api/workouts/` - получить тренировки текущего пользователя.
- `POST /api/workouts/` - создать тренировку.
- `GET /api/workouts/<id>/` - получить одну тренировку.
- `PUT /api/workouts/<id>/` - обновить тренировку.
- `DELETE /api/workouts/<id>/` - удалить тренировку.

Подробное объяснение структуры смотри в `../PROJECT_DOCUMENTATION.md`.

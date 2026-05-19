# GymDo microservices

Проект разделен на учебную микросервисную схему рядом с исходным монолитом.

```text
Browser
  |
  v
gateway :8080
  |
  +-- frontend-service
  +-- auth-service
  |     +-- auth SQLite volume
  +-- workout-service
        +-- workout SQLite volume
```

## Сервисы

- `services/auth-service` - регистрация, вход, выход, текущий пользователь, выдача подписанного токена.
- `services/workout-service` - тренировки, упражнения, подходы, реакции на упражнения.
- `services/frontend-service` - HTML/CSS/JS страницы.
- `services/gateway` - nginx, единая точка входа и маршрутизация API.

## Важное отличие от монолита

В монолите `Workout` ссылался на Django `User` через `ForeignKey`.

В микросервисной версии `workout-service` не хранит пользователя из `auth-service` и не подключается к его базе. Он хранит только:

```python
user_id = models.PositiveIntegerField(db_index=True)
```

`auth-service` выдает подписанный токен, а `workout-service` читает `user_id` из заголовка:

```text
Authorization: Bearer <token>
```

## Запуск

Сначала убедись, что Docker Desktop запущен.

```bash
cd D:\GymDo
docker compose -f docker-compose.microservices.yml up --build
```

После запуска открой:

```text
http://127.0.0.1:8080/
```

Остановить:

```bash
docker compose -f docker-compose.microservices.yml down
```

## Маршрутизация gateway

```text
/api/auth/      -> auth-service
/api/workouts/  -> workout-service
/               -> frontend-service
```

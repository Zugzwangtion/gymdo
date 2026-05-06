# Простая документация GymDo

Этот документ написан как карта проекта: куда смотреть, если ты заблудился в коде.

## 1. Общая идея

GymDo - приложение для учета тренировок. Пользователь регистрируется, входит в аккаунт, добавляет тренировку, выбирает упражнения и подходы. Потом главная страница показывает календарь, статистику, график и карту мышц.

Проект сейчас работает как Django-приложение:

- Django отдает HTML-страницы;
- JavaScript на этих страницах общается с Django API;
- данные хранятся в SQLite базе `back/db.sqlite3`;
- авторизация работает через обычные Django-сессии.

## 2. Главные папки

```text
GymDo/
  back/                  Django-проект
    gymdo_backend/       настройки и главные urls
    apps/
      accounts/          регистрация, вход, выход, текущий пользователь
      workouts/          тренировки, упражнения, подходы
      support/           сообщения в поддержку
      pages/             HTML-страницы и static-файлы
```

Основная рабочая версия фронтенда сейчас находится здесь:

```text
back/apps/pages/templates/pages/
back/apps/pages/static/pages/
```

## 3. Как Django принимает запрос

Главный файл маршрутов:

```text
back/gymdo_backend/urls.py
```

Он подключает несколько частей:

- `apps.pages.urls` - обычные страницы сайта;
- `apps.accounts.urls` - API авторизации;
- `apps.workouts.urls` - API тренировок;
- `apps.support.urls` - API поддержки.

Если открыть `/add/`, Django найдет view в `apps.pages.views` и отдаст HTML-шаблон `add.html`.

Если JavaScript отправит `POST /api/workouts/`, Django попадет в `apps.workouts.views.WorkoutListCreateView`.

## 4. Бэкенд по приложениям

### accounts

Путь:

```text
back/apps/accounts/
```

За что отвечает:

- регистрация пользователя;
- вход;
- выход;
- проверка текущего пользователя;
- заготовка для Telegram-авторизации.

Самый важный файл:

```text
views.py
```

Там находятся функции:

- `me_view` - говорит фронтенду, кто сейчас вошел;
- `register_view` - создает пользователя;
- `login_view` - проверяет логин и пароль;
- `logout_view` - очищает сессию.

### workouts

Путь:

```text
back/apps/workouts/
```

Это ядро проекта. Здесь лежат модели:

- `Workout` - тренировка;
- `ExerciseEntry` - упражнение внутри тренировки;
- `SetEntry` - подход упражнения.

Связь такая:

```text
User
  -> Workout
      -> ExerciseEntry
          -> SetEntry
```

Например:

```text
Иван
  -> тренировка 2026-04-26
      -> жим лежа
          -> 60 кг x 10
          -> 70 кг x 8
```

Файл `serializers.py` превращает JSON с фронтенда в записи базы данных. Там же считается тоннаж:

```text
tonnage = сумма всех weight * reps
```

### support

Путь:

```text
back/apps/support/
```

Сохраняет обращение пользователя в базу и пытается отправить его в Telegram.

Если Telegram не настроен, эта часть может вернуть ошибку, но остальные функции проекта от нее не зависят.

### pages

Путь:

```text
back/apps/pages/
```

Это связка HTML + CSS + JS:

- `templates/pages/*.html` - страницы;
- `static/pages/*.js` - логика страниц;
- `static/pages/style.css` - стили;
- `static/pages/images/` - картинки упражнений;
- `static/pages/*.svg` - карты тела.

## 5. Главные JS-файлы

### api.js

Общий файл для запросов к API.

Он:

- добавляет cookie;
- получает CSRF-токен;
- отправляет `fetch`;
- парсит JSON;
- превращает плохие ответы API в `Error`.

Если нужно добавить новый endpoint, лучше добавить функцию сюда.

### auth.js

Логика страниц входа и регистрации.

Он слушает отправку формы и вызывает:

- `loginUser`;
- `registerUser`.

### script.js

Главная страница.

Он отвечает за:

- загрузку пользователя;
- загрузку тренировок;
- календарь;
- модальное окно тренировки;
- удаление тренировки;
- статистику;
- график;
- карту мышц.

### add.js

Страница добавления тренировки.

Главная идея: пока пользователь заполняет форму, данные живут в локальном объекте `state`. После нажатия "сохранить" этот `state` превращается в JSON и отправляется на `POST /api/workouts/`.

### guide.js

Справочник упражнений.

Он берет данные из `exercises.js`, группирует упражнения по категориям и показывает модальное окно с описанием.

### exercises.js

База упражнений на фронтенде.

Каждое упражнение описывается примерно так:

```js
"Жим лежа": {
    category: "Грудь",
    primaryMuscles: ["chest"],
    image: "/static/pages/images/bench-press.jpg",
    description: "Описание упражнения"
}
```

## 6. Что происходит при добавлении тренировки

1. Пользователь открывает `/add/`.
2. `add.js` проверяет через `getCurrentUser`, вошел ли пользователь.
3. Пользователь выбирает упражнения и заполняет подходы.
4. При отправке формы `collectExercisesPayload()` собирает данные.
5. `createWorkout(payload)` отправляет JSON на `/api/workouts/`.
6. `WorkoutSerializer` на бэкенде проверяет данные.
7. Бэкенд создает:
   - одну запись `Workout`;
   - несколько `ExerciseEntry`;
   - несколько `SetEntry`.
8. Пользователь возвращается на главную страницу.
9. Главная заново загружает тренировки через `GET /api/workouts/`.

## 7. Что происходит при входе

1. Пользователь открывает `/login/`.
2. `auth.js` отправляет логин и пароль на `/api/auth/login/`.
3. Django проверяет пароль через `authenticate`.
4. Django вызывает `login(request, user)`.
5. В браузере появляется session cookie.
6. Следующие API-запросы идут уже от имени этого пользователя.

## 8. Где чаще всего менять код

Если нужно добавить поле тренировки:

1. `back/apps/workouts/models.py`
2. `back/apps/workouts/serializers.py`
3. `back/apps/pages/static/pages/add.js`
4. HTML формы в `back/apps/pages/templates/pages/add.html`

Если нужно добавить новое упражнение:

1. `back/apps/pages/static/pages/exercises.js`
2. картинку положить в `back/apps/pages/static/pages/images/`

Если нужно изменить внешний вид:

1. `back/apps/pages/static/pages/style.css`

Если нужно добавить страницу:

1. создать HTML в `templates/pages/`;
2. добавить view в `apps/pages/views.py`;
3. добавить путь в `apps/pages/urls.py`.

## 9. Полезные команды

Запустить сервер:

```bash
cd back
python manage.py runserver
```

Проверить проект:

```bash
cd back
python manage.py check
```

Создать миграции после изменения моделей:

```bash
cd back
python manage.py makemigrations
python manage.py migrate
```

Создать администратора:

```bash
cd back
python manage.py createsuperuser
```

## 10. Что можно улучшить потом

- Добавить редактирование тренировки.
- Добавить тесты для API тренировок.
- Сделать нормальные сообщения ошибок на русском.
- Перенести базу упражнений из JS в базу данных Django.

Главное: проект уже можно понимать по слоям. Не пытайся держать в голове все сразу. Начинай с цепочки "страница -> JS -> API -> serializer -> model".

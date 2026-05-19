# GymDo: подробная документация простым языком

Этот документ написан для человека, который раньше не работал с JavaScript, CSS, JSON, API, Docker, Django и базами данных. Поэтому здесь много объяснений "что это такое", "зачем это нужно" и "что куда передается".

GymDo - учебное веб-приложение для учета тренировок. Пользователь может зарегистрироваться, войти в аккаунт, добавить тренировку, выбрать упражнения, записать подходы, посмотреть календарь, статистику, график, карту мышц и справочник упражнений с реакциями "нравится / не нравится".

## 1. Самая короткая картина проекта

Проект состоит из двух вариантов:

1. Основной монолитный вариант в папке `back/`.
2. Микросервисный учебный вариант в папке `services/`.

Монолитный вариант проще: один Django-проект делает сразу все:

- отдает HTML-страницы;
- отдает CSS, JavaScript, картинки и SVG;
- принимает API-запросы от JavaScript;
- хранит пользователей и тренировки в SQLite;
- проверяет, кто вошел в аккаунт.

Микросервисный вариант сложнее: там проект разделен на несколько сервисов:

- `auth-service` отвечает за регистрацию, вход и токены;
- `workout-service` отвечает за тренировки и реакции на упражнения;
- `frontend-service` отдает страницы и статические файлы;
- `gateway` на Nginx принимает запросы снаружи и пересылает их в нужный сервис.

Если ты только начинаешь разбираться, сначала изучай `back/`. Микросервисы нужны как демонстрация архитектуры "разделить одно приложение на части".

## 2. Что происходит, когда пользователь открывает сайт

Представим, пользователь открывает:

```text
http://127.0.0.1:8000/
```

Цепочка такая:

1. Браузер отправляет обычный HTTP-запрос на `/`.
2. Django получает этот запрос.
3. Главный файл маршрутов `back/gymdo_backend/urls.py` смотрит, кто должен обработать `/`.
4. Он подключает маршруты из `back/apps/pages/urls.py`.
5. В `pages/urls.py` путь `/` привязан к функции `home_view`.
6. `home_view` лежит в `back/apps/pages/views.py`.
7. `home_view` возвращает HTML-шаблон `back/apps/pages/templates/pages/home.html`.
8. Браузер получает HTML.
9. Внутри HTML подключаются CSS и JavaScript:

```html
<link rel="stylesheet" href="{% static 'pages/style.css' %}">
<script src="{% static 'pages/api.js' %}"></script>
<script src="{% static 'pages/exercises.js' %}"></script>
<script src="{% static 'pages/script.js' %}"></script>
```

10. CSS делает страницу красивой.
11. JavaScript начинает работать в браузере и делает дополнительные API-запросы, например:

```text
GET /api/auth/me/
GET /api/workouts/
```

То есть HTML - это "скелет страницы", CSS - "внешний вид", JavaScript - "поведение", API - "способ получить или отправить данные".

## 3. Структура папок

Главные файлы и папки:

```text
GymDo/
  PROJECT_DOCUMENTATION.md
  MICROSERVICES.md
  docker-compose.yml
  docker-compose.microservices.yml

  back/
    manage.py
    requirements.txt
    Dockerfile
    gymdo_backend/
      settings.py
      urls.py
      asgi.py
      wsgi.py
    apps/
      accounts/
      workouts/
      pages/

  services/
    auth-service/
    workout-service/
    frontend-service/
    gateway/
```

Что это значит:

- `PROJECT_DOCUMENTATION.md` - этот подробный документ.
- `MICROSERVICES.md` - отдельная документация про микросервисную версию.
- `docker-compose.yml` - запуск монолитного Django-приложения через Docker.
- `docker-compose.microservices.yml` - запуск микросервисной версии через Docker.
- `back/` - основной Django-проект.
- `services/` - версия, где приложение разделено на несколько сервисов.

## 4. Что такое Django в этом проекте

Django - это Python-фреймворк для веб-приложений. Он помогает:

- принимать запросы от браузера;
- выбирать, какая функция должна обработать запрос;
- возвращать HTML-страницы;
- работать с базой данных через модели;
- проверять логин и пароль пользователя;
- хранить сессию пользователя;
- создавать API.

В проекте есть файл:

```text
back/manage.py
```

Это командный файл Django. Через него запускают сервер, миграции и проверки:

```bash
python manage.py runserver
python manage.py migrate
python manage.py check
```

## 5. Главные настройки Django

Файл:

```text
back/gymdo_backend/settings.py
```

В нем находятся настройки всего Django-проекта.

### 5.1. SECRET_KEY, DEBUG, ALLOWED_HOSTS

```python
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'unsafe-dev-key')
DEBUG = os.getenv('DJANGO_DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS = [...]
```

Простыми словами:

- `SECRET_KEY` - секретная строка, которую Django использует для безопасности.
- `DEBUG` - режим разработки. Если `True`, Django показывает подробные ошибки.
- `ALLOWED_HOSTS` - список адресов, с которых Django разрешает открывать приложение.

Эти значения берутся из `.env`, если файл существует. Если `.env` нет, используются запасные значения.

### 5.2. INSTALLED_APPS

```python
INSTALLED_APPS = [
    ...
    'rest_framework',
    'apps.accounts',
    'apps.workouts',
    'apps.pages',
]
```

`INSTALLED_APPS` - список подключенных приложений.

Здесь есть системные приложения Django и три наших:

- `apps.accounts` - регистрация, вход, выход, текущий пользователь;
- `apps.workouts` - тренировки, упражнения, подходы, реакции;
- `apps.pages` - HTML-страницы и статические файлы.

`rest_framework` - библиотека Django REST Framework. Она помогает делать API, то есть endpoints, которые возвращают JSON.

### 5.3. MIDDLEWARE

`MIDDLEWARE` - это цепочка обработчиков, через которую проходит каждый запрос.

Например:

- `SessionMiddleware` дает Django сессии;
- `CsrfViewMiddleware` защищает POST-запросы от подделки;
- `AuthenticationMiddleware` добавляет к запросу `request.user`.

`request.user` потом используется во views, чтобы понять, кто сейчас вошел.

### 5.4. DATABASES

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.getenv('SQLITE_NAME', BASE_DIR / 'db.sqlite3'),
    }
}
```

База данных - SQLite. Это файл с данными.

Обычно он находится здесь:

```text
back/db.sqlite3
```

Если проект запущен в Docker, база может храниться в volume по пути:

```text
/data/db.sqlite3
```

SQLite удобен для учебного проекта, потому что не нужно отдельно ставить PostgreSQL или MySQL.

### 5.5. REST_FRAMEWORK

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
```

API использует обычную Django-сессию.

Сессия работает так:

1. Пользователь вводит логин и пароль.
2. Django проверяет их.
3. Если все хорошо, Django записывает в браузер cookie.
4. При следующих запросах браузер автоматически отправляет эту cookie.
5. Django по cookie понимает, какой пользователь делает запрос.

## 6. Главная система маршрутов

Файл:

```text
back/gymdo_backend/urls.py
```

Содержимое по смыслу:

```python
urlpatterns = [
    path('', include('apps.pages.urls')),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/workouts/', include('apps.workouts.urls')),
]
```

Это похоже на карту:

```text
/                  -> страницы сайта
/admin/            -> Django-админка
/api/auth/         -> API авторизации
/api/workouts/     -> API тренировок
```

Пример:

```text
POST /api/auth/login/
```

Django смотрит:

1. Путь начинается с `/api/auth/`.
2. Значит, нужно открыть `apps.accounts.urls`.
3. Остаток пути `login/`.
4. В `accounts/urls.py` `login/` привязан к `login_view`.

## 7. Приложение pages: HTML, CSS, JavaScript

Папка:

```text
back/apps/pages/
```

Она отвечает за обычные страницы, которые открываются в браузере.

### 7.1. Views страниц

Файл:

```text
back/apps/pages/views.py
```

Там есть функции:

- `home_view` - главная страница;
- `login_page_view` - страница входа;
- `register_page_view` - страница регистрации;
- `add_workout_page_view` - страница добавления тренировки;
- `guide_page_view` - справочник упражнений.

Пример:

```python
def home_view(request):
    return render(request, 'pages/home.html')
```

`render` означает: "возьми HTML-шаблон и верни его браузеру".

### 7.2. Маршруты страниц

Файл:

```text
back/apps/pages/urls.py
```

Маршруты:

```text
/           -> home_view             -> home.html
/login/     -> login_page_view       -> login.html
/register/  -> register_page_view    -> register.html
/add/       -> add_workout_page_view -> add.html
/guide/     -> guide_page_view       -> guide.html
```

### 7.3. HTML-шаблоны

Папка:

```text
back/apps/pages/templates/pages/
```

Файлы:

- `home.html` - главная страница;
- `login.html` - вход;
- `register.html` - регистрация;
- `add.html` - добавление тренировки;
- `guide.html` - справочник упражнений.

HTML описывает, какие элементы есть на странице: кнопки, формы, блоки, заголовки.

Например, в `add.html` есть форма:

```html
<form id="workoutForm" class="workout-form-card">
```

JavaScript потом находит эту форму по `id="workoutForm"` и добавляет обработчик отправки.

### 7.4. Static-файлы

Папка:

```text
back/apps/pages/static/pages/
```

Там лежат:

- `style.css` - стили;
- `api.js` - общие функции API-запросов;
- `auth.js` - логика входа и регистрации;
- `script.js` - логика главной страницы;
- `add.js` - логика страницы добавления тренировки;
- `guide.js` - логика справочника;
- `exercises.js` - база упражнений на фронтенде;
- `front-view.svg` и `back-view.svg` - карты тела;
- `images/` - картинки упражнений.

## 8. Что такое CSS в этом проекте

CSS - это файл, который описывает внешний вид.

Файл:

```text
back/apps/pages/static/pages/style.css
```

HTML говорит: "здесь кнопка", "здесь календарь", "здесь форма".

CSS говорит:

- какого цвета кнопка;
- какой размер у блока;
- какие отступы;
- как выглядит модальное окно;
- как выглядят карточки упражнений;
- как скрывать или показывать элементы.

Например, если в HTML есть:

```html
<div class="calendar">
```

то в CSS может быть стиль для `.calendar`. Точка перед названием означает "класс".

## 9. Что такое JavaScript в этом проекте

JavaScript работает в браузере пользователя. Он нужен, чтобы страница была интерактивной.

Например, JavaScript:

- реагирует на нажатие кнопки;
- открывает модальное окно;
- собирает данные из формы;
- отправляет JSON на API;
- получает список тренировок;
- рисует календарь;
- строит график через Chart.js;
- подсвечивает мышцы на SVG-карте.

Важно: Django создает и отдает страницу, а JavaScript уже внутри браузера делает ее живой.

## 10. Что такое JSON

JSON - это текстовый формат для передачи данных.

Например, тренировка может выглядеть так:

```json
{
  "date": "2026-05-15",
  "duration": 75,
  "exercises": [
    {
      "name": "Жим штанги лежа",
      "sets": [
        {
          "weight": 60,
          "reps": 10
        },
        {
          "weight": 70,
          "reps": 8
        }
      ]
    }
  ]
}
```

JavaScript умеет превращать объект в JSON:

```js
JSON.stringify(payload)
```

Django REST Framework умеет принять JSON и превратить его в Python-данные.

## 11. Общий файл API на фронтенде: api.js

Файл:

```text
back/apps/pages/static/pages/api.js
```

Это один из самых важных JavaScript-файлов. В нем собраны функции, которые отправляют запросы на backend.

### 11.1. API_BASE

```js
const API_BASE = "";
```

Пустая строка означает: запросы идут на тот же домен и порт, с которого открыта страница.

Если страница открыта на:

```text
http://127.0.0.1:8000/
```

то запрос:

```js
apiFetch("/api/workouts/")
```

уйдет на:

```text
http://127.0.0.1:8000/api/workouts/
```

### 11.2. getCookie

```js
function getCookie(name) { ... }
```

Эта функция достает cookie из браузера по имени.

Cookie - это маленькие данные, которые сайт хранит в браузере. Django использует cookie для сессии и CSRF-защиты.

### 11.3. ensureCsrfCookie

```js
async function ensureCsrfCookie() {
    await fetch(`${API_BASE}/api/auth/csrf/`, {
        method: "GET",
        credentials: "include"
    });
}
```

CSRF - защита от поддельных POST-запросов.

Перед опасными запросами (`POST`, `PUT`, `DELETE`) фронтенд просит Django выдать CSRF-cookie:

```text
GET /api/auth/csrf/
```

После этого `api.js` достает cookie `csrftoken` и кладет ее в заголовок:

```text
X-CSRFToken: ...
```

### 11.4. apiFetch

```js
async function apiFetch(path, options = {}) { ... }
```

Это главная функция для запросов.

Она делает несколько вещей:

1. Определяет HTTP-метод (`GET`, `POST`, `DELETE` и так далее).
2. Добавляет `Content-Type: application/json`, если отправляется JSON.
3. Для `POST`, `PUT`, `DELETE` добавляет CSRF-заголовок.
4. Вызывает `fetch`.
5. Просит браузер отправлять cookie через `credentials: "include"`.
6. Разбирает ответ как JSON или текст.
7. Если сервер вернул ошибку, создает `Error`.
8. Если все хорошо, возвращает данные.

Все остальные функции используют `apiFetch`.

### 11.5. Функции авторизации

```js
async function getCurrentUser()
async function loginUser(username, password)
async function registerUser(username, password, email = "")
async function logoutUser()
```

Что они делают:

- `getCurrentUser` отправляет `GET /api/auth/me/`;
- `loginUser` отправляет `POST /api/auth/login/`;
- `registerUser` отправляет `POST /api/auth/register/`;
- `logoutUser` отправляет `POST /api/auth/logout/`.

### 11.6. Функции тренировок

```js
async function getWorkouts()
async function createWorkout(payload)
async function deleteWorkoutById(id)
```

Что они делают:

- `getWorkouts` получает список тренировок текущего пользователя;
- `createWorkout` создает новую тренировку;
- `deleteWorkoutById` удаляет тренировку по id.

### 11.7. Функции реакций на упражнения

```js
async function getExerciseReactions()
function createExerciseReactionsStream()
async function voteExerciseReaction(exerciseName, value)
```

Что они делают:

- `getExerciseReactions` получает текущие лайки/дизлайки;
- `createExerciseReactionsStream` открывает постоянное SSE-соединение;
- `voteExerciseReaction` отправляет реакцию пользователя.

SSE - Server-Sent Events. Это способ держать соединение открытым, чтобы сервер мог присылать обновления сам.

## 12. Приложение accounts: регистрация и вход

Папка:

```text
back/apps/accounts/
```

Главные файлы:

- `urls.py` - маршруты API;
- `views.py` - функции, которые отвечают на API-запросы;
- `telegram.py` - заготовка под Telegram;
- `models.py` - сейчас отдельная модель пользователя не создается, используется стандартный Django User.

### 12.1. Маршруты accounts

Файл:

```text
back/apps/accounts/urls.py
```

Маршруты:

```text
GET  /api/auth/me/
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/logout/
GET  /api/auth/csrf/
```

### 12.2. csrf_view

```python
@ensure_csrf_cookie
def csrf_view(request):
    return JsonResponse({"detail": "CSRF cookie set"})
```

Эта view нужна для CSRF-cookie.

Когда JavaScript собирается отправлять `POST`, он сначала вызывает:

```text
GET /api/auth/csrf/
```

Django добавляет cookie `csrftoken`, а потом JavaScript использует ее в заголовке.

### 12.3. me_view

```python
@api_view(["GET"])
def me_view(request):
    if request.user.is_authenticated:
        return Response({
            "is_authenticated": True,
            "user": {
                "id": request.user.id,
                "username": request.user.username,
            }
        })

    return Response({
        "is_authenticated": False,
        "user": None,
    })
```

Зачем это нужно:

Фронтенд должен понять, вошел пользователь или нет.

Если пользователь вошел, ответ будет примерно:

```json
{
  "is_authenticated": true,
  "user": {
    "id": 1,
    "username": "ivan"
  }
}
```

Если не вошел:

```json
{
  "is_authenticated": false,
  "user": null
}
```

### 12.4. register_view

```python
@api_view(["POST"])
def register_view(request):
    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "").strip()
    ...
```

Эта view регистрирует пользователя.

Она делает:

1. Берет `username`, `email`, `password` из JSON.
2. Проверяет, что все поля заполнены.
3. Проверяет, нет ли уже пользователя с таким username.
4. Проверяет пароль через `validate_password`.
5. Создает пользователя через `User.objects.create_user`.
6. Сразу логинит пользователя через `login(request, user)`.
7. Возвращает JSON с `ok: true`.

Пример запроса:

```http
POST /api/auth/register/
Content-Type: application/json

{
  "username": "ivan",
  "email": "ivan@example.com",
  "password": "strong-password-123"
}
```

Пример ответа:

```json
{
  "ok": true,
  "message": "Пользователь создан",
  "user": {
    "id": 1,
    "username": "ivan",
    "email": "ivan@example.com"
  }
}
```

### 12.5. login_view

```python
user = authenticate(request, username=username, password=password)
```

`authenticate` проверяет логин и пароль.

Если пользователь найден и пароль правильный:

```python
login(request, user)
```

`login` записывает пользователя в сессию. После этого браузер хранит session cookie.

Пример запроса:

```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "ivan",
  "password": "strong-password-123"
}
```

### 12.6. logout_view

```python
logout(request)
```

`logout` очищает сессию. После этого Django больше не считает пользователя вошедшим.

## 13. Как работает вход на странице login.html

HTML-страница входа подключает:

```html
<script src="{% static 'pages/api.js' %}"></script>
<script src="{% static 'pages/auth.js' %}"></script>
```

Важный порядок:

1. Сначала подключается `api.js`, потому что в нем есть `loginUser`.
2. Потом подключается `auth.js`, который использует `loginUser`.

Файл:

```text
back/apps/pages/static/pages/auth.js
```

Главная цепочка:

1. `initAuthPage()` запускается при загрузке файла.
2. Она ищет форму `loginForm`.
3. Если форма есть, добавляет обработчик `submit`.
4. При отправке формы вызывается `handleLoginSubmit`.
5. `handleLoginSubmit` отменяет обычную отправку формы через `event.preventDefault()`.
6. Берет значения полей `login` и `password`.
7. Вызывает `loginUser(username, password)`.
8. `loginUser` из `api.js` отправляет `POST /api/auth/login/`.
9. Если backend отвечает успешно, браузер переходит на `/`.
10. Если ошибка, показывается `alert`.

То есть кнопка "Войти" не перезагружает страницу обычным HTML-способом. Она запускает JavaScript, а JavaScript отправляет API-запрос.

## 14. Приложение workouts: тренировки, упражнения, подходы, реакции

Папка:

```text
back/apps/workouts/
```

Главные файлы:

- `models.py` - структура таблиц базы данных;
- `serializers.py` - превращение моделей в JSON и JSON в модели;
- `views.py` - API-логика;
- `urls.py` - маршруты API.

## 15. Модели базы данных

Файл:

```text
back/apps/workouts/models.py
```

Модель - это Python-класс, который описывает таблицу в базе данных.

### 15.1. Workout

```python
class Workout(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='workouts')
    date = models.DateField()
    duration = models.PositiveIntegerField()
    tonnage = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

`Workout` - одна тренировка.

Поля:

- `user` - чей это объект, связь с пользователем;
- `date` - дата тренировки;
- `duration` - длительность в минутах;
- `tonnage` - общий тоннаж;
- `created_at` - когда запись создана;
- `updated_at` - когда запись обновлена.

`ForeignKey` означает "ссылка на другую таблицу".

`on_delete=models.CASCADE` означает: если удалить пользователя, его тренировки тоже удалятся.

### 15.2. ExerciseEntry

```python
class ExerciseEntry(models.Model):
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='exercises')
    name = models.CharField(max_length=255)
    sort_order = models.PositiveIntegerField(default=0)
```

`ExerciseEntry` - упражнение внутри конкретной тренировки.

Например:

```text
Тренировка 2026-05-15
  Упражнение: Жим штанги лежа
```

Поля:

- `workout` - к какой тренировке относится упражнение;
- `name` - название упражнения;
- `sort_order` - порядок отображения.

### 15.3. SetEntry

```python
class SetEntry(models.Model):
    exercise = models.ForeignKey(ExerciseEntry, on_delete=models.CASCADE, related_name='sets')
    weight = models.DecimalField(max_digits=7, decimal_places=2)
    reps = models.PositiveIntegerField()
    sort_order = models.PositiveIntegerField(default=0)
```

`SetEntry` - один подход упражнения.

Например:

```text
60 кг x 10 повторений
```

Поля:

- `exercise` - к какому упражнению относится подход;
- `weight` - вес;
- `reps` - количество повторений;
- `sort_order` - порядок отображения.

### 15.4. ExerciseReaction

```python
class ExerciseReaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exercise_reactions')
    exercise_name = models.CharField(max_length=255)
    value = models.CharField(max_length=8, choices=VALUE_CHOICES)
```

`ExerciseReaction` хранит реакцию пользователя на упражнение:

- `like`;
- `dislike`.

В модели есть ограничение:

```python
models.UniqueConstraint(fields=('user', 'exercise_name'), name='unique_user_exercise_reaction')
```

Это значит: один пользователь может иметь только одну реакцию на одно упражнение. Если пользователь сначала поставил `like`, а потом `dislike`, запись не дублируется, а обновляется.

## 16. Связь моделей

Связь выглядит так:

```text
User
  -> Workout
      -> ExerciseEntry
          -> SetEntry

User
  -> ExerciseReaction
```

Пример:

```text
Пользователь ivan
  -> Тренировка 2026-05-15, 75 минут, тоннаж 1160
      -> Жим штанги лежа
          -> 60 кг x 10
          -> 70 кг x 8
      -> Подтягивания
          -> 0 кг x 10
          -> 0 кг x 8

Пользователь ivan
  -> Реакция на "Жим штанги лежа": like
```

## 17. Serializers: как JSON превращается в записи базы

Файл:

```text
back/apps/workouts/serializers.py
```

Serializer - это переводчик между JSON и Django-моделями.

Он нужен в двух направлениях:

1. Когда backend отправляет данные на фронтенд: модель превращается в JSON.
2. Когда фронтенд отправляет JSON на backend: JSON проверяется и превращается в модель.

### 17.1. SetEntrySerializer

```python
class SetEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SetEntry
        fields = ('id', 'weight', 'reps', 'sort_order')
```

Описывает, какие поля подхода можно принимать и отдавать.

### 17.2. ExerciseEntrySerializer

```python
class ExerciseEntrySerializer(serializers.ModelSerializer):
    sets = SetEntrySerializer(many=True)
```

У упражнения есть много подходов. Поэтому `sets` описан как список:

```python
many=True
```

### 17.3. WorkoutSerializer

```python
class WorkoutSerializer(serializers.ModelSerializer):
    exercises = ExerciseEntrySerializer(many=True)
```

У тренировки есть много упражнений.

Поля:

```python
fields = ('id', 'date', 'duration', 'tonnage', 'created_at', 'updated_at', 'exercises')
```

`tonnage` read-only:

```python
read_only_fields = ('id', 'tonnage', 'created_at', 'updated_at')
```

Это важно: даже если фронтенд отправит `tonnage`, backend сам пересчитает тоннаж и не будет доверять фронтенду.

### 17.4. validate_exercises

```python
def validate_exercises(self, value):
    if not value:
        raise serializers.ValidationError('Добавьте хотя бы одно упражнение.')
```

Проверяет, что в тренировке есть хотя бы одно упражнение.

### 17.5. validate

```python
def validate(self, attrs):
    exercises = attrs.get('exercises', [])
    ...
```

Проверяет, что в каждом упражнении есть хотя бы один подход.

### 17.6. calculate_tonnage

```python
@staticmethod
def calculate_tonnage(exercises_data) -> int:
    total = Decimal('0')
    for exercise in exercises_data:
        for set_data in exercise.get('sets', []):
            total += Decimal(str(set_data['weight'])) * Decimal(set_data['reps'])
    return int(total)
```

Считает тоннаж:

```text
тоннаж = сумма всех weight * reps
```

Пример:

```text
60 кг x 10 = 600
70 кг x 8  = 560
Итого      = 1160
```

### 17.7. create

```python
def create(self, validated_data):
    exercises_data = validated_data.pop('exercises', [])
    validated_data['tonnage'] = self.calculate_tonnage(exercises_data)
    workout = Workout.objects.create(**validated_data)
    self._save_nested(workout, exercises_data)
    return workout
```

Что происходит:

1. Serializer берет данные тренировки.
2. Отдельно вытаскивает вложенные `exercises`.
3. Считает `tonnage`.
4. Создает запись `Workout`.
5. Создает вложенные `ExerciseEntry` и `SetEntry`.

### 17.8. _save_nested

```python
def _save_nested(self, workout, exercises_data):
    for exercise_index, exercise_data in enumerate(exercises_data):
        sets_data = exercise_data.pop('sets', [])
        exercise = ExerciseEntry.objects.create(...)
        for set_index, set_data in enumerate(sets_data):
            SetEntry.objects.create(...)
```

Эта функция сохраняет вложенные данные.

Фронтенд отправляет одну большую тренировку:

```text
Workout + exercises + sets
```

А база данных хранит это в трех таблицах:

```text
Workout
ExerciseEntry
SetEntry
```

`_save_nested` как раз раскладывает один JSON по разным таблицам.

## 18. API workouts

Файл маршрутов:

```text
back/apps/workouts/urls.py
```

Маршруты:

```text
GET    /api/workouts/
POST   /api/workouts/
GET    /api/workouts/<id>/
PUT    /api/workouts/<id>/
DELETE /api/workouts/<id>/

GET    /api/workouts/exercise-reactions/
GET    /api/workouts/exercise-reactions/stream/
POST   /api/workouts/exercise-reactions/vote/
```

### 18.1. WorkoutListCreateView

Файл:

```text
back/apps/workouts/views.py
```

```python
class WorkoutListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]
```

Эта view умеет:

- `GET /api/workouts/` - вернуть список тренировок;
- `POST /api/workouts/` - создать тренировку.

`IsAuthenticated` значит: только вошедший пользователь может пользоваться этим endpoint.

#### get_queryset

```python
def get_queryset(self):
    return Workout.objects.filter(user=self.request.user).prefetch_related('exercises__sets')
```

Backend возвращает только тренировки текущего пользователя.

Если в базе есть тренировки других пользователей, они не попадут в ответ.

`prefetch_related('exercises__sets')` заранее подгружает упражнения и подходы, чтобы не делать много лишних запросов к базе.

#### perform_create

```python
def perform_create(self, serializer):
    serializer.save(user=self.request.user)
```

Фронтенд не отправляет `user`.

Это правильно, потому что пользователь не должен иметь возможность сказать:

```json
{
  "user": 999
}
```

Backend сам берет пользователя из сессии:

```python
self.request.user
```

### 18.2. WorkoutDetailView

```python
class WorkoutDetailView(generics.RetrieveUpdateDestroyAPIView):
```

Эта view умеет:

- `GET /api/workouts/<id>/` - получить одну тренировку;
- `PUT /api/workouts/<id>/` - обновить тренировку;
- `DELETE /api/workouts/<id>/` - удалить тренировку.

Важная защита:

```python
def get_object(self):
    obj = super().get_object()
    if obj.user_id != self.request.user.id:
        raise PermissionDenied('Это не ваша тренировка.')
    return obj
```

Если пользователь пытается открыть или удалить чужую тренировку, backend запрещает это.

## 19. Как добавляется тренировка: полный путь данных

Это самая важная цепочка в проекте.

### 19.1. Пользователь открывает страницу

Пользователь открывает:

```text
/add/
```

Django:

1. Находит маршрут в `pages/urls.py`.
2. Вызывает `add_workout_page_view`.
3. Возвращает `add.html`.

`add.html` подключает:

```html
<script src="{% static 'pages/api.js' %}"></script>
<script src="{% static 'pages/exercises.js' %}"></script>
<script src="{% static 'pages/add.js' %}"></script>
```

### 19.2. add.js проверяет пользователя

В конце `add.js` вызывается:

```js
initAddPage();
```

Внутри:

```js
currentUser = await getCurrentUser();

if (!currentUser) {
    window.location.href = "/login/";
    return;
}
```

То есть страница добавления доступна только вошедшему пользователю.

Если пользователь не вошел, его перекинет на `/login/`.

### 19.3. Пользователь выбирает упражнения

Когда пользователь нажимает кнопку "Добавить упражнение":

```js
elements.openExercisePickerBtn?.addEventListener("click", openExercisePicker);
```

Вызывается `openExercisePicker`.

Она вызывает:

```js
renderExercisePicker();
```

`renderExercisePicker` берет упражнения из `exercises.js`, группирует их по категориям и рисует список в модальном окне.

Когда пользователь нажимает на упражнение:

```js
addExercise(exerciseName);
```

### 19.4. Состояние формы хранится в state

В `add.js` есть объект:

```js
const state = {
    exercises: [],
    expandedCategories: new Set()
};
```

`state.exercises` - это временная память страницы.

Пока пользователь заполняет тренировку, данные еще не в базе. Они живут в браузере в `state`.

Когда добавляется упражнение:

```js
state.exercises.push({
    id: generateId(),
    name: exerciseName,
    category: exerciseData?.category || "Упражнение",
    sets: [createDefaultSet()]
});
```

То есть в память добавляется объект:

```json
{
  "id": "временный-id",
  "name": "Жим штанги лежа",
  "category": "Грудь",
  "sets": [
    {
      "id": "временный-id-подхода",
      "reps": "",
      "weight": ""
    }
  ]
}
```

Временные `id` нужны только на фронтенде, чтобы JavaScript понимал, какую карточку или подход обновлять. В базу эти временные `id` не отправляются.

### 19.5. Пользователь заполняет подходы

Когда пользователь вводит вес или повторения, срабатывает:

```js
updateSetValue(exerciseId, setId, field, value)
```

Эта функция:

1. Находит упражнение в `state.exercises`.
2. Находит подход внутри упражнения.
3. Обновляет поле `reps` или `weight`.

### 19.6. Пользователь нажимает "Сохранить тренировку"

Форма слушает событие:

```js
elements.workoutForm?.addEventListener("submit", handleSubmit);
```

Вызывается:

```js
async function handleSubmit(event) { ... }
```

Она делает:

1. `event.preventDefault()` - отменяет обычную HTML-отправку формы.
2. Проверяет форму через `validateWorkoutForm`.
3. Собирает упражнения через `collectExercisesPayload`.
4. Создает объект `payload`.
5. Вызывает `createWorkout(payload)`.

### 19.7. collectExercisesPayload

```js
function collectExercisesPayload() {
    return state.exercises
        .map((exercise) => {
            const sets = exercise.sets
                .map((set) => ({
                    reps: normalizeSetValue(set.reps),
                    weight: normalizeSetValue(set.weight)
                }))
                .filter((set) => set.reps > 0 || set.weight > 0);

            return {
                name: exercise.name,
                sets
            };
        })
        .filter((exercise) => exercise.sets.length > 0);
}
```

Эта функция превращает внутренний `state` в чистый payload для API.

Она убирает:

- временные frontend-id;
- категорию, потому что backend ее не хранит в тренировке;
- пустые подходы.

На выходе получается примерно:

```json
[
  {
    "name": "Жим штанги лежа",
    "sets": [
      {
        "reps": 10,
        "weight": 60
      },
      {
        "reps": 8,
        "weight": 70
      }
    ]
  }
]
```

### 19.8. Payload тренировки

В `handleSubmit` создается:

```js
const payload = {
    date: elements.dateInput.value,
    duration: Number(elements.durationInput.value),
    tonnage: calculateTonnage(exercises),
    exercises
};
```

Пример:

```json
{
  "date": "2026-05-15",
  "duration": 75,
  "tonnage": 1160,
  "exercises": [
    {
      "name": "Жим штанги лежа",
      "sets": [
        {
          "reps": 10,
          "weight": 60
        },
        {
          "reps": 8,
          "weight": 70
        }
      ]
    }
  ]
}
```

Важно: фронтенд считает `tonnage` для себя, но backend все равно пересчитывает его сам в `WorkoutSerializer`.

### 19.9. createWorkout

Функция из `api.js`:

```js
async function createWorkout(payload) {
    return apiFetch("/api/workouts/", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}
```

Она отправляет:

```text
POST /api/workouts/
```

Тело запроса - JSON.

### 19.10. Backend принимает POST /api/workouts/

Запрос попадает в:

```text
back/apps/workouts/views.py
```

Класс:

```python
WorkoutListCreateView
```

Django REST Framework:

1. Проверяет, что пользователь вошел.
2. Передает JSON в `WorkoutSerializer`.
3. Serializer проверяет данные.
4. Serializer вызывает `create`.
5. `perform_create` добавляет `user=request.user`.
6. Создаются записи в базе.

### 19.11. Что создается в базе

Если пришел такой JSON:

```json
{
  "date": "2026-05-15",
  "duration": 75,
  "exercises": [
    {
      "name": "Жим штанги лежа",
      "sets": [
        { "weight": 60, "reps": 10 },
        { "weight": 70, "reps": 8 }
      ]
    }
  ]
}
```

То в базе создается:

```text
Workout:
  user = текущий пользователь
  date = 2026-05-15
  duration = 75
  tonnage = 1160

ExerciseEntry:
  workout = созданная Workout
  name = Жим штанги лежа
  sort_order = 0

SetEntry:
  exercise = созданная ExerciseEntry
  weight = 60
  reps = 10
  sort_order = 0

SetEntry:
  exercise = созданная ExerciseEntry
  weight = 70
  reps = 8
  sort_order = 1
```

### 19.12. После успешного сохранения

Фронтенд делает:

```js
alert("Тренировка сохранена");
window.location.href = "/";
```

Пользователь возвращается на главную страницу.

Главная страница снова загрузит список тренировок через:

```text
GET /api/workouts/
```

## 20. Главная страница: календарь, статистика, график, карта мышц

Файл:

```text
back/apps/pages/static/pages/script.js
```

Это основной JS-файл главной страницы.

### 20.1. state главной страницы

```js
const state = {
    currentUser: null,
    isAuthenticated: false,
    workouts: [],
    currentDate: new Date(),
    chartInstance: null
};
```

Что хранится:

- `currentUser` - текущий пользователь;
- `isAuthenticated` - вошел ли пользователь;
- `workouts` - список тренировок;
- `currentDate` - месяц, который сейчас показан в календаре;
- `chartInstance` - объект графика Chart.js.

### 20.2. initPage

В конце файла вызывается:

```js
initPage();
```

Цепочка:

1. `bindEvents()` - подключает обработчики кнопок.
2. `loadUserAndWorkouts()` - загружает пользователя и тренировки.
3. `updateAuthenticatedHeader()` - обновляет верхнее меню.
4. `renderCalendar()` - рисует календарь.
5. `updateStats()` - считает статистику.
6. `renderChart()` - рисует график.
7. `loadMuscleMaps()` - загружает SVG-карты тела и подсвечивает мышцы.

### 20.3. loadUserAndWorkouts

```js
state.currentUser = await getCurrentUser();
state.isAuthenticated = Boolean(state.currentUser);
```

Сначала фронтенд спрашивает:

```text
GET /api/auth/me/
```

Если пользователь не вошел:

```js
state.workouts = [];
return;
```

Если вошел:

```js
state.workouts = await getWorkouts();
```

То есть отправляется:

```text
GET /api/workouts/
```

### 20.4. renderCalendar

`renderCalendar` рисует дни месяца.

Она:

1. Берет год и месяц из `state.currentDate`.
2. Считает, какой день недели у первого числа.
3. Считает количество дней в месяце.
4. Создает ячейки календаря.
5. Для каждого дня ищет тренировки через `getDayWorkouts(dateString)`.
6. Если в день есть тренировки, добавляет индикатор.

Когда пользователь нажимает на день:

- если пользователь не вошел, показывается окно "Нужна авторизация";
- если в этот день есть тренировки, открывается список тренировок;
- если тренировок нет, пользователь переходит на `/add/?date=YYYY-MM-DD`.

### 20.5. showDayWorkouts и showWorkoutDetails

`showDayWorkouts` показывает список тренировок за день.

`showWorkoutDetails` показывает конкретную тренировку:

- дату;
- длительность;
- тоннаж;
- упражнения;
- подходы;
- кнопку удаления.

### 20.6. deleteWorkout

Когда пользователь удаляет тренировку:

```js
await deleteWorkoutById(id);
```

`api.js` отправляет:

```text
DELETE /api/workouts/<id>/
```

Backend проверяет:

1. Пользователь вошел.
2. Тренировка принадлежит этому пользователю.
3. Если да, удаляет ее.

После удаления фронтенд обновляет:

- `state.workouts`;
- статистику;
- календарь;
- график;
- карту мышц.

### 20.7. updateStats

`getStats` проходит по всем тренировкам и считает:

- количество тренировок;
- количество упражнений;
- количество подходов;
- количество повторений;
- общий тоннаж.

Потом `updateStats` вставляет эти числа в HTML.

### 20.8. renderChart

`renderChart` использует библиотеку Chart.js.

Chart.js подключается в `home.html`:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

График показывает:

- тоннаж по датам;
- длительность по датам.

### 20.9. Карта мышц

Карта мышц использует:

- `front-view.svg`;
- `back-view.svg`;
- `exercises.js`;
- список тренировок за последние 7 дней.

Цепочка:

1. `loadMuscleMaps()` загружает SVG-файлы через `fetch`.
2. `buildMuscleLoadMap()` смотрит последние тренировки.
3. Для каждого упражнения берет `primaryMuscles` из `exercises.js`.
4. Считает нагрузку по мышцам.
5. `applyMuscleLoadToSvg()` добавляет CSS-класс нужным частям SVG.
6. CSS подсвечивает активные мышцы.

Пример из `exercises.js`:

```js
"Жим штанги лежа": {
    category: "Грудь",
    primaryMuscles: ["chest"],
    image: "/static/pages/images/bench-press.jpg",
    description: "Базовое упражнение для развития грудных мышц.",
}
```

Если пользователь делал жим, карта подсветит грудь.

## 21. Справочник упражнений

Страница:

```text
/guide/
```

HTML:

```text
back/apps/pages/templates/pages/guide.html
```

JavaScript:

```text
back/apps/pages/static/pages/guide.js
```

База упражнений:

```text
back/apps/pages/static/pages/exercises.js
```

### 21.1. exercises.js

`exercises.js` хранит объект `exercisesDatabase`.

Пример:

```js
const exercisesDatabase = {
    "Жим штанги лежа": {
        category: "Грудь",
        primaryMuscles: ["chest"],
        secondaryMuscles: [],
        image: "/static/pages/images/bench-press.jpg",
        description: "Базовое упражнение для развития грудных мышц.",
    }
};
```

Каждое упражнение содержит:

- `category` - группа;
- `primaryMuscles` - основные мышцы;
- `secondaryMuscles` - дополнительные мышцы;
- `image` - путь к картинке;
- `description` - описание.

Внизу есть функции:

```js
function getExerciseByName(name)
function getExercisesGroupedByCategory()
function getAllExerciseNames()
```

Они помогают другим JS-файлам получать упражнения.

### 21.2. initGuidePage

В конце `guide.js` вызывается:

```js
initGuidePage();
```

Она:

1. Проверяет пользователя через `getCurrentUser`.
2. Если пользователь не вошел, отправляет на `/login/`.
3. Подключает меню пользователя.
4. Подключает модальное окно.
5. Проверяет базу упражнений.
6. Рисует группы упражнений.
7. Запускает поток реакций.

### 21.3. renderMuscleGroups

`renderMuscleGroups`:

1. Берет упражнения из `exercises.js`.
2. Группирует их по категориям.
3. Создает карточки групп.
4. Внутри каждой группы создает список упражнений.
5. Для каждого упражнения добавляет кнопки like/dislike.

### 21.4. Модальное окно упражнения

Когда пользователь нажимает на упражнение:

```js
openExerciseModal(exerciseName)
```

Функция:

1. Берет данные упражнения.
2. Вставляет название.
3. Вставляет картинку.
4. Вставляет описание.
5. Показывает модальное окно.

## 22. Реакции на упражнения: like/dislike

Реакции работают через три endpoint:

```text
GET  /api/workouts/exercise-reactions/
GET  /api/workouts/exercise-reactions/stream/
POST /api/workouts/exercise-reactions/vote/
```

### 22.1. ExerciseReactionListView

```python
class ExerciseReactionListView(APIView):
    def get(self, request):
        return Response(serialize_exercise_reactions(request.user))
```

Возвращает список всех реакций:

```json
{
  "reactions": [
    {
      "exercise_name": "Жим штанги лежа",
      "likes": 3,
      "dislikes": 1,
      "user_reaction": "like"
    }
  ]
}
```

`user_reaction` показывает реакцию текущего пользователя.

### 22.2. ExerciseReactionVoteView

Когда пользователь нажимает like или dislike, `guide.js` вызывает:

```js
voteExerciseReaction(exerciseName, value)
```

`api.js` отправляет:

```text
POST /api/workouts/exercise-reactions/vote/
```

JSON:

```json
{
  "exercise_name": "Жим штанги лежа",
  "value": "like"
}
```

Backend:

1. Проверяет название упражнения.
2. Проверяет, что `value` равно `like` или `dislike`.
3. Использует `update_or_create`.

```python
ExerciseReaction.objects.update_or_create(
    user=request.user,
    exercise_name=exercise_name,
    defaults={'value': value},
)
```

`update_or_create` означает:

- если реакция уже есть, обновить;
- если реакции нет, создать.

### 22.3. ExerciseReactionStreamView и SSE

SSE endpoint:

```text
GET /api/workouts/exercise-reactions/stream/
```

В `guide.js`:

```js
reactionEventSource = createExerciseReactionsStream();
```

Это создает `EventSource`.

`EventSource` держит соединение открытым. Backend раз в секунду проверяет, поменялись ли реакции.

Если поменялись, backend отправляет событие:

```text
event: reactions
data: {"reactions":[...]}
```

Фронтенд слушает:

```js
reactionEventSource.addEventListener("reactions", (event) => {
    applyExerciseReactions(JSON.parse(event.data));
});
```

Так лайки и дизлайки могут обновляться без перезагрузки страницы.

## 23. Таблица API монолитной версии

| Метод | URL | Кто вызывает | Что делает |
| --- | --- | --- | --- |
| `GET` | `/api/auth/csrf/` | `ensureCsrfCookie` | Выдает CSRF-cookie |
| `GET` | `/api/auth/me/` | `getCurrentUser` | Проверяет текущего пользователя |
| `POST` | `/api/auth/register/` | `registerUser` | Создает пользователя |
| `POST` | `/api/auth/login/` | `loginUser` | Выполняет вход |
| `POST` | `/api/auth/logout/` | `logoutUser` | Выполняет выход |
| `GET` | `/api/workouts/` | `getWorkouts` | Возвращает тренировки текущего пользователя |
| `POST` | `/api/workouts/` | `createWorkout` | Создает тренировку |
| `GET` | `/api/workouts/<id>/` | Сейчас напрямую почти не используется | Возвращает одну тренировку |
| `PUT` | `/api/workouts/<id>/` | Можно использовать для будущего редактирования | Обновляет тренировку |
| `DELETE` | `/api/workouts/<id>/` | `deleteWorkoutById` | Удаляет тренировку |
| `GET` | `/api/workouts/exercise-reactions/` | `getExerciseReactions` | Возвращает реакции |
| `GET` | `/api/workouts/exercise-reactions/stream/` | `createExerciseReactionsStream` | Открывает SSE-поток реакций |
| `POST` | `/api/workouts/exercise-reactions/vote/` | `voteExerciseReaction` | Сохраняет like/dislike |

## 24. Что такое Docker в проекте

Docker позволяет запускать проект в контейнере.

Контейнер можно представить как отдельную маленькую среду, где уже есть Python, зависимости и команда запуска.

### 24.1. Dockerfile монолита

Файл:

```text
back/Dockerfile
```

Что он делает:

```dockerfile
FROM python:3.13-slim
```

Берет готовый образ Python.

```dockerfile
WORKDIR /app
```

Создает рабочую папку `/app`.

```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
```

Копирует список зависимостей и устанавливает их.

```dockerfile
COPY . .
```

Копирует код проекта.

```dockerfile
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]
```

При запуске контейнера:

1. Выполняются миграции.
2. Запускается Django-сервер на `0.0.0.0:8000`.

`0.0.0.0` нужно, чтобы сервер был доступен снаружи контейнера.

### 24.2. docker-compose.yml

Файл:

```text
docker-compose.yml
```

Он описывает запуск монолитного приложения.

Главный сервис:

```yaml
services:
  web:
    build:
      context: ./back
    ports:
      - "8000:8000"
```

Это значит:

- собрать Docker-образ из папки `back`;
- внутри контейнера приложение слушает порт `8000`;
- снаружи на компьютере тоже открыть порт `8000`.

Переменные:

```yaml
environment:
  DJANGO_SECRET_KEY: unsafe-docker-dev-key
  DJANGO_DEBUG: "True"
  DJANGO_ALLOWED_HOSTS: "127.0.0.1,localhost,0.0.0.0"
  SQLITE_NAME: /data/db.sqlite3
```

Они попадают в `settings.py` через `os.getenv`.

Volume:

```yaml
volumes:
  - gymdo_sqlite_data:/data
```

Volume нужен, чтобы база SQLite не исчезала при пересоздании контейнера.

Запуск:

```bash
docker compose up --build
```

Открыть:

```text
http://127.0.0.1:8000/
```

Остановка:

```bash
docker compose down
```

## 25. Микросервисная версия

Микросервисная версия лежит в:

```text
services/
```

Она запускается через:

```bash
docker compose -f docker-compose.microservices.yml up --build
```

Открывать:

```text
http://127.0.0.1:8080/
```

### 25.1. Сервисы

```text
services/
  gateway/
    nginx.conf
  auth-service/
  workout-service/
  frontend-service/
```

### 25.2. gateway

`gateway` - это Nginx. Он принимает все запросы на `8080` и решает, куда их отправить.

Файл:

```text
services/gateway/nginx.conf
```

Правила:

```text
/api/auth/                       -> auth-service
/api/workouts/                   -> workout-service
/api/workouts/exercise-reactions/stream/ -> workout-service с отключенным buffering
/                                -> frontend-service
```

То есть браузер думает, что общается с одним сайтом:

```text
http://127.0.0.1:8080/
```

А внутри Nginx раздает запросы разным контейнерам.

### 25.3. auth-service

Папка:

```text
services/auth-service/
```

Отвечает за:

- регистрацию;
- вход;
- выход;
- текущего пользователя;
- создание подписанного токена.

В монолите workout API узнает пользователя по Django-сессии.

В микросервисной версии `workout-service` находится отдельно и не имеет общей таблицы пользователей с auth-service. Поэтому auth-service возвращает токен:

```python
def build_auth_token(user):
    return signing.dumps(
        {
            "user_id": user.id,
            "username": user.username,
        },
        key=settings.AUTH_TOKEN_SECRET,
        salt=settings.TOKEN_SIGNING_SALT,
    )
```

Токен - это подписанная строка, в которой зашиты `user_id` и `username`.

### 25.4. workout-service

Папка:

```text
services/workout-service/
```

Отвечает за:

- тренировки;
- упражнения внутри тренировок;
- подходы;
- реакции.

Там есть файл:

```text
services/workout-service/apps/workouts/authentication.py
```

Класс:

```python
class SignedTokenAuthentication(authentication.BaseAuthentication):
```

Он читает заголовок:

```text
Authorization: Bearer <token>
```

Потом проверяет подпись токена через те же:

- `AUTH_TOKEN_SECRET`;
- `TOKEN_SIGNING_SALT`.

Если подпись правильная, создается легкий объект `TokenUser`, у которого есть:

- `id`;
- `username`;
- `is_authenticated = True`.

Так workout-service понимает, от имени какого пользователя пришел запрос, даже не обращаясь к базе auth-service.

### 25.5. frontend-service

Папка:

```text
services/frontend-service/
```

Отдает:

- HTML;
- CSS;
- JavaScript;
- картинки;
- SVG.

Это почти копия frontend-части из `back/apps/pages`.

### 25.6. docker-compose.microservices.yml

Файл описывает четыре контейнера:

```text
gateway
auth-service
workout-service
frontend-service
```

Порт наружу открыт только у gateway:

```yaml
ports:
  - "8080:80"
```

Остальные сервисы доступны внутри Docker-сети по именам:

```text
auth-service:8000
workout-service:8000
frontend-service:8000
```

## 26. Миграции

Миграции - это файлы, которые описывают изменения базы данных.

Например:

```text
back/apps/workouts/migrations/0001_initial.py
back/apps/workouts/migrations/0003_exercisereaction.py
```

Если ты меняешь `models.py`, нужно создать миграцию:

```bash
python manage.py makemigrations
```

Потом применить:

```bash
python manage.py migrate
```

`makemigrations` создает инструкцию.

`migrate` применяет инструкцию к базе.

## 27. Как добавить новое упражнение

Сейчас база упражнений хранится на фронтенде в:

```text
back/apps/pages/static/pages/exercises.js
```

Чтобы добавить упражнение:

1. Добавь новую запись в `exercisesDatabase`.
2. Укажи категорию.
3. Укажи `primaryMuscles`.
4. Укажи картинку.
5. Укажи описание.

Пример:

```js
"Новое упражнение": {
    category: "Грудь",
    primaryMuscles: ["chest"],
    secondaryMuscles: [],
    image: "/static/pages/images/new-exercise.jpg",
    description: "Описание упражнения.",
}
```

Если нужна новая картинка, положи ее сюда:

```text
back/apps/pages/static/pages/images/
```

Если упражнение должно подсвечивать мышцы на карте, ключи из `primaryMuscles` должны совпадать с ключами в `muscleSvgMap` в `script.js`.

## 28. Как добавить новое поле тренировки

Например, нужно добавить поле "самочувствие".

Придется поменять несколько слоев.

### 28.1. Модель

Файл:

```text
back/apps/workouts/models.py
```

Добавить поле в `Workout`:

```python
mood = models.CharField(max_length=50, blank=True)
```

### 28.2. Миграции

```bash
python manage.py makemigrations
python manage.py migrate
```

### 28.3. Serializer

Файл:

```text
back/apps/workouts/serializers.py
```

Добавить `mood` в `fields`.

### 28.4. HTML

Файл:

```text
back/apps/pages/templates/pages/add.html
```

Добавить поле ввода.

### 28.5. JavaScript add.js

Файл:

```text
back/apps/pages/static/pages/add.js
```

Добавить элемент в `elements`, прочитать значение в `handleSubmit`, положить в `payload`.

### 28.6. Главная страница

Если поле нужно показывать в деталях тренировки, поменять:

```text
back/apps/pages/static/pages/script.js
```

Например, в `showWorkoutDetails`.

## 29. Как добавить новую страницу

Нужно пройти путь:

1. Создать HTML-файл в `back/apps/pages/templates/pages/`.
2. Добавить view в `back/apps/pages/views.py`.
3. Добавить route в `back/apps/pages/urls.py`.
4. Если нужен JS, создать файл в `back/apps/pages/static/pages/`.
5. Подключить JS в HTML через `{% static %}`.
6. Если нужны стили, добавить классы в `style.css`.

Пример:

```python
def profile_page_view(request):
    return render(request, 'pages/profile.html')
```

Маршрут:

```python
path('profile/', views.profile_page_view, name='profile')
```

## 30. Как добавить новый API endpoint

Допустим, нужен endpoint:

```text
GET /api/workouts/stats/
```

Шаги:

1. Добавить view в `back/apps/workouts/views.py`.
2. Добавить путь в `back/apps/workouts/urls.py`.
3. Добавить функцию в `api.js`.
4. Вызвать эту функцию из нужного JS-файла.

Пример frontend-функции:

```js
async function getWorkoutStats() {
    return apiFetch("/api/workouts/stats/");
}
```

## 31. Как читать проект, если ты новичок

Лучший порядок изучения:

1. Открой `back/gymdo_backend/urls.py`.
2. Посмотри, какие есть главные группы маршрутов.
3. Открой `back/apps/pages/urls.py`.
4. Посмотри, какие страницы есть.
5. Открой HTML нужной страницы.
6. Посмотри, какие JS-файлы она подключает.
7. Открой JS-файл и найди `init...` функцию в конце.
8. Проследи, какие API-функции вызываются.
9. Открой `api.js` и найди эту API-функцию.
10. По URL перейди в backend `urls.py`.
11. Найди view.
12. Если view работает с базой, открой serializer и model.

Главная цепочка мышления:

```text
страница -> JavaScript -> api.js -> URL -> view -> serializer -> model -> база данных
```

И обратно:

```text
база данных -> model -> serializer -> JSON -> api.js -> JavaScript -> HTML
```

## 32. Полезные команды

Запуск без Docker:

```bash
cd back
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Проверка Django-проекта:

```bash
cd back
python manage.py check
```

Миграции:

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

Запуск монолита через Docker:

```bash
docker compose up --build
```

Остановка Docker:

```bash
docker compose down
```

Запуск микросервисов:

```bash
docker compose -f docker-compose.microservices.yml up --build
```

## 33. Частые ошибки и куда смотреть

### 33.1. Страница открылась, но данные не загружаются

Смотреть:

- вкладку Network в браузере;
- `back/apps/pages/static/pages/api.js`;
- backend endpoint в `views.py`.

Часто причина:

- пользователь не вошел;
- API вернул 403;
- API вернул 500;
- JavaScript упал с ошибкой.

### 33.2. POST-запрос не проходит

Смотреть:

- есть ли CSRF-cookie;
- вызывается ли `/api/auth/csrf/`;
- добавлен ли заголовок `X-CSRFToken`;
- используется ли `credentials: "include"`.

В проекте это уже делает `apiFetch`.

### 33.3. Тренировка сохраняется, но не видна

Смотреть:

- вошел ли тот же пользователь;
- что возвращает `GET /api/workouts/`;
- создалась ли запись в базе;
- не отфильтровалась ли она по дате.

### 33.4. Карта мышц не подсвечивается

Смотреть:

- есть ли тренировки за последние 7 дней;
- совпадают ли названия упражнений с `exercisesDatabase`;
- есть ли `primaryMuscles`;
- есть ли такой ключ в `muscleSvgMap`;
- совпадают ли id внутри SVG.

### 33.5. Реакции не обновляются

Смотреть:

- открыт ли `/api/workouts/exercise-reactions/stream/`;
- нет ли ошибки авторизации;
- не блокирует ли Nginx buffering в микросервисной версии;
- вызывается ли `startReactionStream`.

## 34. Что сейчас можно улучшить

Идеи для развития:

- добавить редактирование тренировки;
- перенести упражнения из `exercises.js` в базу данных;
- добавить тесты для API тренировок;
- добавить нормальную страницу профиля;
- сделать более подробные сообщения ошибок;
- добавить фильтры статистики по периоду;
- добавить PostgreSQL вместо SQLite для production-версии;
- сделать токены и авторизацию в микросервисах более полноценными.

## 35. Главное, что нужно запомнить

Проект проще понимать слоями.

Первый слой - страницы:

```text
HTML + CSS + JS
```

Второй слой - API:

```text
/api/auth/...
/api/workouts/...
```

Третий слой - backend-логика:

```text
views.py
serializers.py
models.py
```

Четвертый слой - база данных:

```text
User
Workout
ExerciseEntry
SetEntry
ExerciseReaction
```

Когда пользователь делает действие на странице, почти всегда происходит такая история:

```text
клик или отправка формы
  -> JavaScript-функция
  -> функция из api.js
  -> HTTP-запрос
  -> Django URL
  -> Django view
  -> serializer
  -> model
  -> база данных
  -> JSON-ответ
  -> JavaScript обновляет страницу
```

Если держать в голове эту цепочку, проект становится намного понятнее.

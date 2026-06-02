# GymDo: шпаргалка перед защитой

Этот файл - повторение основных сценариев проекта простым языком. Его идея такая:
если преподаватель спрашивает "как это работает?", ты можешь идти по цепочке:
страница -> JS -> API -> Django view -> serializer/model -> база данных -> ответ назад.

## 1. Общая архитектура проекта

GymDo - это Django-проект с frontend-страницами на HTML/CSS/JS и backend API на Django REST Framework.

Главные части:

- `back/gymdo_backend/urls.py` - главный файл маршрутов проекта.
- `back/apps/pages/` - обычные страницы сайта: главная, логин, регистрация, добавление тренировки, просмотр тренировки, справочник.
- `back/apps/pages/static/pages/js/` - JavaScript frontend-логики.
- `back/apps/accounts/` - авторизация, регистрация, текущий пользователь, CSRF.
- `back/apps/workouts/` - тренировки, упражнения, подходы, реакции на упражнения.

Главная цепочка данных тренировки:

```text
Workout -> ExerciseEntry -> SetEntry
```

То есть:

- `Workout` - сама тренировка.
- `ExerciseEntry` - упражнение внутри тренировки.
- `SetEntry` - подход внутри упражнения.

Они связаны через `ForeignKey`.

## 2. Как frontend общается с backend

Основной файл API:

```text
back/apps/pages/static/pages/js/api.js
```

Там есть функция `apiFetch()`. Она оборачивает обычный `fetch()`:

- добавляет `credentials: "include"`, чтобы браузер отправлял session cookie;
- для POST/DELETE/PUT добавляет CSRF-токен;
- отправляет JSON;
- проверяет ошибки ответа.

Пример:

```js
createWorkout(payload)
```

делает:

```text
POST /api/workouts/
```

А дальше Django ведет запрос в:

```text
apps.workouts.urls -> WorkoutListCreateView -> WorkoutSerializer.create()
```

## 3. Авторизация

Сценарий входа:

```text
/login/
login.html
auth.js
loginUser()
POST /api/auth/login/
accounts.views.login_view
login(request, user)
session cookie
```

Что важно понять:

- пользователь вводит логин и пароль;
- JS отправляет их на backend;
- Django проверяет пользователя;
- если все хорошо, вызывается `login(request, user)`;
- Django создает сессию;
- браузер получает cookie;
- дальше при API-запросах cookie автоматически отправляется вместе с запросом.

После этого backend понимает текущего пользователя через:

```python
request.user
```

## 4. CSRF

CSRF нужен, чтобы защитить POST/DELETE/PUT-запросы от подделки.

В проекте это работает так:

```text
apiFetch()
attachCsrfHeader()
ensureCsrfCookie()
GET /api/auth/csrf/
cookie csrftoken
header X-CSRFToken
```

То есть перед опасным запросом frontend получает CSRF-cookie и добавляет токен в заголовок:

```text
X-CSRFToken
```

Простыми словами:

cookie доказывает, что браузер уже был на нашем сайте, а header доказывает, что запрос делает наш JS.

## 5. Добавление тренировки

Главная страница сценария:

```text
/add/
```

Основные JS-файлы:

- `form-state.js` - хранит состояние формы и ссылки на DOM-элементы.
- `form-render.js` - рисует упражнения, подходы, степперы, выбор упражнений.
- `previous-workouts.js` - ищет прошлые тренировки с таким же упражнением.
- `timers.js` - режим выполнения тренировки с таймером.
- `form-submit.js` - проверка формы и отправка тренировки.

## 6. Что такое `state` на странице добавления

`state` - это временная память страницы.

Пока пользователь заполняет форму, данные еще не в базе. Они лежат в JS:

```js
state.exercises
```

Примерно так:

```js
[
  {
    id: "temporary-id",
    name: "Жим лежа",
    sets: [
      { id: "temporary-id", weight: 60, reps: 10 }
    ]
  }
]
```

Важно:

- временные `id` нужны только frontend-у;
- в базу они не уходят;
- настоящие `id` создаст Django.

## 7. `getElementById`

Пример:

```js
dateInput: document.getElementById("date")
```

Как это работает:

- браузер уже построил DOM-дерево из HTML;
- `document` - это вся HTML-страница как объект;
- `getElementById("date")` ищет элемент с `id="date"`;
- если нашел, возвращает HTML-элемент;
- потом через него можно читать или менять значение:

```js
elements.dateInput.value
```

Простыми словами:

```text
getElementById - это "найди мне элемент на странице по id".
```

## 8. Главный сценарий сохранения тренировки

Функция:

```js
handleSubmit(event)
```

Она находится в:

```text
back/apps/pages/static/pages/js/workouts/form-render.js
```

Цепочка:

```text
submit формы
handleSubmit(event)
event.preventDefault()
validateWorkoutForm()
collectExercisesPayload()
calculateTonnage(exercises)
createWorkout(payload)
POST /api/workouts/
WorkoutListCreateView
WorkoutSerializer.create()
Workout.objects.create()
ExerciseEntry.objects.create()
SetEntry.objects.create()
redirect на /
```

Разбор по шагам:

1. `event.preventDefault()`

Останавливает стандартную отправку формы браузером. Без этого страница могла бы просто перезагрузиться.

2. `validateWorkoutForm()`

Проверяет:

- заполнены ли обязательные HTML-поля;
- есть ли хотя бы одно упражнение;
- есть ли хотя бы один заполненный подход.

Если форма плохая, сохранение не идет.

3. `collectExercisesPayload()`

Берет `state.exercises` и превращает его в чистый JSON для backend.

Убирает:

- временные frontend-id;
- пустые подходы;
- упражнения без заполненных подходов.

4. `payload`

Итоговый объект:

```js
const payload = {
    date: elements.dateInput.value,
    duration: getWorkoutDurationMinutes(),
    tonnage: calculateTonnage(exercises),
    exercises
};
```

5. `createWorkout(payload)`

Отправляет:

```text
POST /api/workouts/
```

6. После успеха:

```js
window.location.href = "/";
```

Пользователь возвращается на главную.

## 9. Как тренировка сохраняется в базе

Backend принимает POST:

```text
POST /api/workouts/
```

Маршрут:

```text
back/apps/workouts/urls.py
path('', WorkoutListCreateView.as_view())
```

View:

```text
WorkoutListCreateView
```

Serializer:

```text
WorkoutSerializer
```

Главная логика сохранения:

```python
def create(self, validated_data):
    exercises_data = validated_data.pop('exercises', [])
    validated_data['tonnage'] = self.calculate_tonnage(exercises_data)
    workout = Workout.objects.create(**validated_data)
    self._save_nested(workout, exercises_data)
    return workout
```

Что происходит:

- из JSON достают упражнения;
- backend сам пересчитывает тоннаж;
- создается `Workout`;
- потом создаются упражнения `ExerciseEntry`;
- потом создаются подходы `SetEntry`.

Важно для защиты:

```text
Упражнения и подходы хранятся отдельно от тренировки, но связаны с ней через id.
```

Связи:

```text
ExerciseEntry.workout_id -> Workout.id
SetEntry.exercise_id -> ExerciseEntry.id
```

При удалении тренировки упражнения и подходы удаляются автоматически из-за:

```python
on_delete=models.CASCADE
```

## 10. Главная страница

Страница:

```text
/
```

Главные JS-файлы:

- `dashboard/main.js` - стартовая логика главной.
- `dashboard/state.js` - состояние и DOM-элементы.
- `dashboard/calendar.js` - календарь.
- `dashboard/stats.js` - статистика.
- `dashboard/chart.js` - график.
- `dashboard/muscle-map.js` - карта мышц.

Старт:

```js
initPage()
```

Цепочка:

```text
bindEvents()
loadUserAndWorkouts()
updateAuthenticatedHeader()
renderCalendar()
updateStats()
renderChart()
loadMuscleMaps()
```

`loadUserAndWorkouts()`:

- проверяет текущего пользователя через `getCurrentUser()`;
- если пользователь вошел, загружает тренировки через `getWorkouts()`;
- результат кладет в `state.workouts`.

После этого почти вся главная страница строится из:

```js
state.workouts
```

## 11. Календарь

Функция:

```js
renderCalendar()
```

Файл:

```text
dashboard/calendar.js
```

Что делает:

- берет текущий месяц из `state.currentDate`;
- считает, сколько дней в месяце;
- рисует ячейки календаря;
- для каждого дня проверяет, есть ли тренировки;
- если тренировки есть, добавляет визуальную индикацию;
- на каждый день добавляет обработчик клика.

Как день становится интерактивным:

```js
button.addEventListener("click", ...)
```

Варианты клика:

- если в день нет тренировки - можно перейти на `/add/?date=...`;
- если одна тренировка - можно открыть ее;
- если несколько тренировок - открывается модальное окно со списком.

Как появляется индикация тренировки:

- дата дня форматируется в строку;
- функция ищет тренировки с такой же датой;
- если массив не пустой, день получает специальный CSS-класс или точки.

Простыми словами:

```text
Календарь не ходит в базу сам. Он берет уже загруженный state.workouts и рисует дни по этим данным.
```

## 12. Просмотр одной тренировки

Страница:

```text
/workouts/<id>/
```

Файл:

```text
workout-detail.js
```

Цепочка:

```text
HTML содержит data-workout-id
JS читает page.dataset.workoutId
getWorkoutById(id)
GET /api/workouts/<id>/
WorkoutDetailView
WorkoutSerializer
renderWorkout(workout)
```

`renderWorkout()`:

- показывает дату;
- показывает длительность;
- показывает тоннаж;
- рисует упражнения;
- внутри упражнений рисует подходы.

## 13. Удаление тренировки

Есть два места удаления:

- с главной страницы через модальное окно;
- со страницы просмотра одной тренировки.

API-функция:

```js
deleteWorkoutById(id)
```

Запрос:

```text
DELETE /api/workouts/<id>/
```

Backend:

```text
WorkoutDetailView
get_object()
permission check
delete()
```

Важная проверка:

```python
if obj.user_id != self.request.user.id:
    raise PermissionDenied('Это не ваша тренировка.')
```

То есть пользователь не может удалить чужую тренировку.

Что после DELETE:

- backend удаляет `Workout`;
- из-за `CASCADE` удаляются связанные `ExerciseEntry`;
- из-за `CASCADE` удаляются связанные `SetEntry`;
- frontend убирает тренировку из `state.workouts`;
- перерисовывает календарь, статистику, график и карту мышц.

## 14. Карта мышц

Файл:

```text
dashboard/muscle-map.js
```

Главная идея:

```text
Берем тренировки за последние 7 дней -> смотрим упражнения -> находим мышцы -> считаем нагрузку -> красим SVG.
```

Цепочка:

```text
loadMuscleMaps()
loadSvgIntoContainer()
buildMuscleLoadMap()
getLast7DaysWorkouts()
getExerciseByName(exercise.name)
primaryMuscles
calculateSetLoad(set)
applyMuscleLoadToSvg()
tryActivateSvgIds()
```

Что такое `loadMap`:

```js
{
  chest: 1200,
  biceps: 400,
  quads: 900
}
```

Ключи типа `chest`, `biceps`, `quads` потом ищутся в:

```js
muscleSvgMap
```

`muscleSvgMap` говорит, какие id внутри SVG надо покрасить для каждой мышцы.

Важно:

- карта смотрит не все тренировки, а последние 7 дней;
- упражнение берется из сохраненной тренировки;
- мышцы берутся из справочника упражнений;
- SVG красится через CSS-класс `muscle-map-active`.

## 15. Справочник упражнений

Страница:

```text
/guide/
```

Основные файлы:

- `guide/guide-render.js` - рисует группы и упражнения.
- `guide/modal.js` - открытие подробной информации об упражнении.
- `guide/reactions.js` - лайки/дизлайки и live-обновления.
- `exercises.js` - база упражнений на frontend.

Важно:

```text
Упражнения справочника не хранятся в базе как отдельная модель.
Они лежат в JS-справочнике.
```

В базе хранятся реакции:

```text
ExerciseReaction
```

## 16. Лайки и дизлайки упражнений

Модель:

```text
ExerciseReaction
```

Поля:

- `user` - кто поставил реакцию;
- `exercise_name` - название упражнения;
- `value` - `like` или `dislike`.

Ограничение:

```text
unique user + exercise_name
```

Это значит:

```text
один пользователь может иметь только одну реакцию на одно упражнение.
```

Методы frontend:

```text
loadExerciseReactions()
handleReactionClick()
startReactionStream()
stopReactionStream()
```

Запросы:

```text
GET /api/workouts/exercise-reactions/
POST /api/workouts/exercise-reactions/vote/
GET /api/workouts/exercise-reactions/stream/
```

## 17. SSE для реакций

SSE - Server-Sent Events.

Простыми словами:

```text
браузер открыл соединение, а сервер может отправлять обновления сам.
```

Frontend:

```js
new EventSource("/api/workouts/exercise-reactions/stream/")
```

Backend:

```text
ExerciseReactionStreamView
StreamingHttpResponse
event_stream()
```

Логика:

- сервер каждую секунду проверяет, изменились ли реакции;
- если изменились, отправляет событие `reactions`;
- если нет, отправляет keep-alive;
- frontend получает событие и обновляет счетчики лайков/дизлайков.

## 18. Что такое serializer

Serializer в DRF - это переводчик между JSON и Django-моделью.

Когда frontend отправляет JSON:

```text
JSON -> serializer -> model -> database
```

Когда backend отвечает:

```text
database -> model -> serializer -> JSON
```

В проекте:

- `SetEntrySerializer` - один подход;
- `ExerciseEntrySerializer` - упражнение с подходами;
- `WorkoutSerializer` - вся тренировка с упражнениями и подходами.

Почему `_save_nested()` написан вручную:

DRF сам не очень удобно сохраняет вложенные структуры. Поэтому проект вручную:

- создает тренировку;
- создает упражнения;
- создает подходы.

## 19. Что такое model

Model в Django - это описание таблицы базы данных в Python.

Например:

```python
class Workout(models.Model):
    date = models.DateField()
```

Django по модели понимает:

- какие поля есть в таблице;
- какие типы у полей;
- какие связи между таблицами.

## 20. Что такое view

View - это обработчик запроса.

Например:

```text
GET /api/workouts/
```

попадает в:

```text
WorkoutListCreateView
```

View решает:

- какие данные взять;
- можно ли пользователю это делать;
- какой serializer использовать;
- какой ответ вернуть.

## 21. Что такое URL route

URL route связывает адрес с view.

Пример:

```python
path('', WorkoutListCreateView.as_view())
```

Если приложение подключено как:

```text
/api/workouts/
```

то пустой path внутри `workouts/urls.py` означает:

```text
GET или POST /api/workouts/
```

## 22. Что говорить про безопасность

Можно сказать так:

```text
Проект использует Django-сессии. Пользователь определяется через request.user.
API тренировок закрыто permission_classes = [IsAuthenticated].
При получении, изменении и удалении одной тренировки дополнительно проверяется владелец записи.
Для POST/DELETE запросов используется CSRF-токен.
```

Главные места:

- `IsAuthenticated`;
- `request.user`;
- `get_object()` в `WorkoutDetailView`;
- `apiFetch()` и CSRF header.

## 23. Быстрый ответ: "как добавить тренировку?"

Говорить можно так:

```text
Пользователь открывает /add/. JS проверяет авторизацию, ставит дату, загружает прошлые тренировки.
Пользователь выбирает упражнения, они попадают во временный state.exercises.
При submit handleSubmit останавливает обычную отправку формы, валидирует данные,
собирает exercises payload, считает duration и tonnage, потом вызывает createWorkout().
createWorkout отправляет POST /api/workouts/.
На backend запрос попадает в WorkoutListCreateView, дальше в WorkoutSerializer.create().
Serializer создает Workout, потом ExerciseEntry и SetEntry.
После успешного ответа frontend возвращает пользователя на главную.
```

## 24. Быстрый ответ: "как главная показывает тренировки?"

```text
При загрузке главной initPage вызывает loadUserAndWorkouts.
Там через getCurrentUser проверяется пользователь, а через getWorkouts загружаются его тренировки.
Они сохраняются в state.workouts.
Потом из этого массива строятся календарь, статистика, график и карта мышц.
```

## 25. Быстрый ответ: "как удалить тренировку?"

```text
Пользователь нажимает удалить.
Frontend спрашивает confirm.
Если подтверждено, вызывается deleteWorkoutById(id).
Он делает DELETE /api/workouts/<id>/.
Backend через WorkoutDetailView находит тренировку и проверяет владельца.
Если это тренировка текущего пользователя, она удаляется.
Связанные упражнения и подходы удаляются каскадом.
Frontend убирает запись из state.workouts и перерисовывает интерфейс.
```

## 26. Быстрый ответ: "как работает карта мышц?"

```text
Карта мышц берет state.workouts, оставляет тренировки за последние 7 дней,
проходит по упражнениям, ищет каждое упражнение в справочнике exercises.js,
берет primaryMuscles, считает нагрузку подходов и собирает loadMap.
Потом applyMuscleLoadToSvg смотрит muscleSvgMap, находит нужные id внутри SVG
и добавляет CSS-класс подсветки.
```

## 27. Быстрый ответ: "как работают лайки в справочнике?"

```text
Справочник рисует упражнения из JS-базы exercises.js.
Реакции хранятся отдельно в базе в модели ExerciseReaction.
При загрузке страницы frontend делает GET /api/workouts/exercise-reactions/.
При клике на лайк или дизлайк делает POST /api/workouts/exercise-reactions/vote/.
Backend через update_or_create сохраняет одну реакцию пользователя на упражнение.
Для живого обновления открыт SSE-поток /api/workouts/exercise-reactions/stream/.
```

## 28. Где что искать в VS Code

Добавление тренировки:

```text
back/apps/pages/static/pages/js/workouts/form-submit.js
back/apps/pages/static/pages/js/workouts/form-render.js
back/apps/pages/static/pages/js/api.js
back/apps/workouts/views.py
back/apps/workouts/serializers.py
back/apps/workouts/models.py
```

Главная:

```text
back/apps/pages/static/pages/js/dashboard/main.js
back/apps/pages/static/pages/js/dashboard/calendar.js
back/apps/pages/static/pages/js/dashboard/stats.js
back/apps/pages/static/pages/js/dashboard/chart.js
back/apps/pages/static/pages/js/dashboard/muscle-map.js
```

Просмотр тренировки:

```text
back/apps/pages/static/pages/js/workout-detail.js
back/apps/workouts/views.py
```

Справочник:

```text
back/apps/pages/static/pages/js/guide/guide-render.js
back/apps/pages/static/pages/js/guide/modal.js
back/apps/pages/static/pages/js/guide/reactions.js
back/apps/workouts/views.py
```

Авторизация:

```text
back/apps/pages/static/pages/js/auth.js
back/apps/pages/static/pages/js/api.js
back/apps/accounts/views.py
```

## 29. Как искать определение функции в VS Code

Если видишь функцию, например:

```js
createWorkout(payload)
```

Способы перейти к определению:

1. Навести курсор на `createWorkout`.
2. Нажать `F12`.
3. Или `Ctrl + Click`.
4. Или `Ctrl + Shift + F` и ввести `function createWorkout` или `createWorkout`.

Если функция не импортируется явно, потому что JS подключен через `<script>`, `F12` иногда может не сработать. Тогда надежнее глобальный поиск `Ctrl + Shift + F`.

## 30. Самая короткая картина проекта

```text
Frontend:
HTML + JS рисуют страницы, собирают данные и отправляют API-запросы.

API:
api.js делает fetch-запросы к Django.

Backend:
views.py принимает запросы.
serializers.py проверяет и преобразует данные.
models.py описывает таблицы базы.

Database:
Workout, ExerciseEntry, SetEntry, ExerciseReaction.
```

Если совсем коротко на защите:

```text
Проект построен вокруг тренировок пользователя.
Frontend хранит временное состояние формы, отправляет его через API.
Backend проверяет пользователя, сохраняет данные через serializer и модели.
Главная страница загружает тренировки текущего пользователя и строит календарь, статистику, график и карту мышц.
```


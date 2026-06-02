# GymDo: сценарии работы проекта пошагово

Это не обзор файлов, а именно сценарии: что нажал пользователь, какая JS-функция сработала, что она передала дальше, какой API-запрос ушел, какой Django view его принял, какой serializer/model включился и что вернулось назад.

## 1. Сценарий: вход в аккаунт

### Что делает пользователь

Пользователь открывает страницу:

```text
/login/
```

Вводит username/password и нажимает кнопку входа.

### Что происходит на frontend

Форма логина обрабатывается в:

```text
back/apps/pages/static/pages/js/auth.js
```

Когда пользователь отправляет форму, JS отменяет обычную отправку браузера:

```js
event.preventDefault()
```

Это нужно, чтобы страница не перезагрузилась стандартным способом, а данные ушли через API.

Дальше JS собирает данные:

```js
username
password
```

И вызывает API-функцию:

```js
loginUser({ username, password })
```

### Где описан `loginUser`

Файл:

```text
back/apps/pages/static/pages/js/api.js
```

Функция делает запрос:

```text
POST /api/auth/login/
```

Тело запроса примерно такое:

```json
{
  "username": "user",
  "password": "password"
}
```

Запрос идет через `apiFetch()`.

`apiFetch()`:

- добавляет `Content-Type: application/json`;
- добавляет `credentials: "include"`;
- для POST-запроса добавляет CSRF-токен;
- превращает объект в JSON через `JSON.stringify()`;
- проверяет ответ backend.

### Куда попадает запрос на backend

Главный маршрут:

```text
back/gymdo_backend/urls.py
```

Там подключается:

```text
api/auth/ -> apps.accounts.urls
```

Дальше:

```text
back/apps/accounts/urls.py
```

Маршрут ведет во view логина:

```text
login_view
```

Файл:

```text
back/apps/accounts/views.py
```

### Что делает backend

Backend получает username/password из `request.data`.

Проверяет пользователя через Django:

```python
authenticate(...)
```

Если пароль правильный, вызывается:

```python
login(request, user)
```

Это очень важный момент:

```text
login(request, user) создает Django-сессию.
```

После этого браузеру отправляется session cookie.

### Что возвращается frontend

Backend возвращает JSON с данными пользователя.

Frontend понимает, что вход успешен, и переводит пользователя дальше, обычно на главную:

```text
/
```

### Главное объяснение на защите

```text
При входе frontend отправляет username/password на POST /api/auth/login/.
Django проверяет данные, вызывает login(request, user), создает session cookie.
После этого браузер автоматически отправляет cookie в следующих API-запросах,
а backend узнает пользователя через request.user.
```

## 2. Сценарий: проверка текущего пользователя

Этот сценарий используется на главной, на странице добавления тренировки и в справочнике.

### Что вызывает frontend

JS вызывает:

```js
getCurrentUser()
```

Файл:

```text
back/apps/pages/static/pages/js/api.js
```

### Какой запрос уходит

```text
GET /api/auth/me/
```

### Что передается

Тела запроса нет.

Но браузер отправляет cookie сессии, потому что в `apiFetch()` стоит:

```js
credentials: "include"
```

### Что делает backend

Запрос попадает в:

```text
back/apps/accounts/views.py
```

Во view:

```text
me_view
```

Backend смотрит:

```python
request.user
```

Если пользователь авторизован, возвращает его данные.

Если нет, возвращает информацию, что пользователя нет.

### Главное объяснение

```text
Frontend не хранит пользователя сам как истину. Он спрашивает backend через /api/auth/me/.
Backend смотрит session cookie, восстанавливает request.user и отвечает, кто сейчас вошел.
```

## 3. Сценарий: CSRF перед POST/DELETE

### Зачем нужен CSRF

CSRF защищает опасные запросы:

```text
POST
PUT
PATCH
DELETE
```

То есть все, что может изменить данные.

### Где это работает

Файл:

```text
back/apps/pages/static/pages/js/api.js
```

Главная функция:

```js
apiFetch()
```

Перед опасным запросом вызывается:

```js
attachCsrfHeader()
```

Если CSRF-cookie еще нет, вызывается:

```js
ensureCsrfCookie()
```

### Какой запрос получает CSRF

```text
GET /api/auth/csrf/
```

Backend ставит cookie:

```text
csrftoken
```

Frontend читает cookie и добавляет header:

```text
X-CSRFToken: <token>
```

### Главное объяснение

```text
Перед POST или DELETE frontend получает CSRF cookie и кладет токен в X-CSRFToken.
Django сверяет cookie и header. Так backend понимает, что запрос пришел со страницы проекта,
а не был подделан чужим сайтом.
```

## 4. Сценарий: открытие страницы добавления тренировки

### Что делает пользователь

Пользователь открывает:

```text
/add/
```

Иногда он приходит туда с календаря:

```text
/add/?date=2026-06-02
```

### Какая HTML-страница открывается

Django отдает страницу добавления через `pages`.

HTML подключает JS-файлы из:

```text
back/apps/pages/static/pages/js/workouts/
```

Главные файлы:

- `form-state.js`
- `previous-workouts.js`
- `timers.js`
- `form-render.js`
- `form-submit.js`

### Какая стартовая функция запускается

Файл:

```text
back/apps/pages/static/pages/js/workouts/form-submit.js
```

Функция:

```js
initAddPage()
```

Она запускается в конце файла:

```js
initAddPage()
```

### Что делает `initAddPage`

Шаги:

1. Проверяет авторизацию:

```js
currentUser = await getCurrentUser()
```

2. Если пользователя нет, перекидывает:

```js
window.location.href = "/login/"
```

3. Ставит дату:

```js
setDefaultDate()
```

4. Загружает прошлые тренировки:

```js
state.workouts = await getWorkouts()
```

5. Подключает события:

```js
bindEvents()
```

6. Ставит режим по умолчанию:

```js
setWorkoutMode("manual")
```

7. Рисует пустой список упражнений:

```js
renderExercises()
updateEmptyState()
```

### Что такое `state`

Файл:

```text
back/apps/pages/static/pages/js/workouts/form-state.js
```

`state` - временная память формы.

Пока пользователь не нажал "Сохранить", данные лежат не в базе, а здесь:

```js
state.exercises
```

Пример:

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

Важный момент:

```text
id в state - временные id для frontend. В базу они не отправляются.
```

## 5. Сценарий: выбор упражнения на странице добавления

### Что делает пользователь

Нажимает кнопку:

```text
Добавить упражнение
```

### Какая функция срабатывает

В `bindEvents()` подключено:

```js
elements.openExercisePickerBtn?.addEventListener("click", openExercisePicker)
```

Файл:

```text
back/apps/pages/static/pages/js/workouts/form-submit.js
```

Функция `openExercisePicker()` описана в:

```text
back/apps/pages/static/pages/js/workouts/form-render.js
```

### Что делает `openExercisePicker`

Она:

1. вызывает:

```js
renderExercisePicker()
```

2. показывает модальное окно:

```js
elements.exercisePickerModal.style.display = "flex"
```

### Как рисуется список упражнений

`renderExercisePicker()` получает упражнения:

```js
getExercisesGroupedSafe()
```

Файл:

```text
back/apps/pages/static/pages/js/workouts/previous-workouts.js
```

`getExercisesGroupedSafe()` берет данные из справочника:

```text
exercisesDatabase
```

или вызывает готовую функцию:

```js
getExercisesGroupedByCategory()
```

### Что происходит при клике на упражнение

Внутри `createCategoryBlock()` на каждую кнопку упражнения ставится обработчик:

```js
exerciseBtn.addEventListener("click", () => {
    addExercise(exerciseName)
    closeExercisePicker()
})
```

### Что делает `addExercise(exerciseName)`

Файл:

```text
back/apps/pages/static/pages/js/workouts/form-render.js
```

Шаги:

1. Берет данные упражнения из справочника:

```js
const exerciseData = getExerciseByNameSafe(exerciseName)
```

2. Ищет прошлое выполнение такого упражнения:

```js
const previous = getPreviousExercise(exerciseName)
```

3. Добавляет упражнение в `state.exercises`:

```js
state.exercises.push({
    id: generateId(),
    name: exerciseName,
    category: exerciseData?.category || "Упражнение",
    image: exerciseData?.image || "",
    previous,
    sets: createSetsFromPrevious(previous)
})
```

4. Перерисовывает список:

```js
renderExercises()
```

### Главное объяснение

```text
При выборе упражнения оно еще не сохраняется в базу.
Оно добавляется во временный массив state.exercises.
Потом renderExercises заново рисует карточки упражнений по этому массиву.
```

## 6. Сценарий: подсказки из прошлой тренировки

### Зачем это нужно

Когда пользователь добавляет упражнение, проект показывает прошлые веса/повторы, чтобы было удобнее повторять или улучшать результат.

### Где это описано

Файл:

```text
back/apps/pages/static/pages/js/workouts/previous-workouts.js
```

Главная функция:

```js
getPreviousExercise(exerciseName)
```

### Откуда берутся прошлые тренировки

При старте страницы добавления:

```js
state.workouts = await getWorkouts()
```

`getWorkouts()` описан в:

```text
back/apps/pages/static/pages/js/api.js
```

Он делает:

```text
GET /api/workouts/
```

Backend возвращает все тренировки текущего пользователя.

### Как ищется прошлое упражнение

`getPreviousExercise(exerciseName)`:

1. Берет текущую дату из поля:

```js
elements.dateInput?.value
```

2. Превращает ее в `Date`:

```js
parseWorkoutDate(...)
```

3. Сортирует `state.workouts` от новых к старым.

4. Пропускает тренировки, которые не раньше текущей даты.

5. В каждой прошлой тренировке ищет упражнение с таким же названием:

```js
(workout.exercises || []).find((exercise) => exercise.name === exerciseName)
```

6. Если нашло, возвращает:

```js
{ workout, exercise: match }
```

### Что потом с этим делается

В `addExercise()` результат кладется в поле:

```js
previous
```

Потом:

- `createSetsFromPrevious(previous)` создает столько пустых подходов, сколько было раньше;
- `getPreviousSet(exercise, index)` берет прошлый подход с таким же номером;
- `createInlineStepper()` показывает прошлое значение как placeholder;
- `getDelta()` и `createDeltaBadge()` показывают разницу.

### Главное объяснение

```text
Проект не делает отдельный API-запрос за прошлым упражнением.
Он заранее загружает все тренировки пользователя в state.workouts,
а потом на frontend ищет последнюю прошлую тренировку с таким же упражнением.
```

## 7. Сценарий: добавление подхода

### Что делает пользователь

В карточке упражнения нажимает:

```text
+
```

### Какая функция срабатывает

В `createExerciseCard()` на кнопку добавления подхода ставится:

```js
addSetButton.addEventListener("click", () => addSet(exercise.id))
```

Файл:

```text
back/apps/pages/static/pages/js/workouts/form-render.js
```

### Что делает `addSet(exerciseId)`

1. Находит упражнение в `state.exercises`:

```js
const exercise = state.exercises.find((item) => item.id === exerciseId)
```

2. Подбирает значения для нового подхода:

```js
getReusableSetValues(exercise)
```

3. Создает подход:

```js
createDefaultSet(...)
```

4. Добавляет его:

```js
exercise.sets.push(...)
```

5. Перерисовывает карточки:

```js
renderExercises()
```

### Что такое `createDefaultSet`

Она возвращает объект:

```js
{
    id: generateId(),
    reps: values.reps ?? "",
    weight: values.weight ?? ""
}
```

Это пока не база, а временный объект frontend.

## 8. Сценарий: изменение веса или повторов

### Что делает пользователь

В строке подхода нажимает плюс/минус или вводит число в input.

### Где создаются эти элементы

Функция:

```js
createInlineStepper(exercise, set, field, previousValue, step)
```

Файл:

```text
back/apps/pages/static/pages/js/workouts/form-render.js
```

### Что передается в функцию

Например для веса:

```js
createInlineStepper(exercise, set, "weight", previousSet?.weight, 0.5)
```

Для повторов:

```js
createInlineStepper(exercise, set, "reps", previousSet?.reps, 1)
```

`field` говорит, какое поле менять:

```text
weight или reps
```

### Что происходит при вводе

На input стоит обработчик:

```js
input.addEventListener("input", (event) => {
    updateSetValue(exercise.id, set.id, field, event.target.value)
})
```

`updateSetValue()`:

1. Находит упражнение по `exerciseId`;
2. Находит подход по `setId`;
3. Меняет поле:

```js
set[field] = value
```

### Главное объяснение

```text
Когда пользователь меняет вес или повторы, меняется не HTML сам по себе.
JS находит нужный объект подхода в state.exercises и меняет его.
Потом интерфейс перерисовывается из state.
```

## 9. Сценарий: режим выполнения тренировки с таймером

### Где хранится режим

Файл:

```text
back/apps/pages/static/pages/js/workouts/form-state.js
```

В `state`:

```js
mode: "manual"
```

Варианты:

```text
manual - пользователь сам вводит длительность
execution - тренировка идет с таймером
```

### Как пользователь переключает режим

В `bindEvents()`:

```js
elements.modeInputs?.forEach((input) => {
    input.addEventListener("change", (event) => {
        if (event.target.checked) setWorkoutMode(event.target.value)
    })
})
```

### Что делает `setWorkoutMode(mode)`

Файл:

```text
back/apps/pages/static/pages/js/workouts/timers.js
```

Она:

- записывает режим в `state.mode`;
- скрывает или показывает поле ручной длительности;
- скрывает или показывает панель таймера;
- меняет текст кнопки сохранения;
- запускает или останавливает таймер.

Если режим `execution`:

```js
startExecutionTimer()
```

Если режим `manual`:

```js
stopExecutionTimer()
```

### Как считается длительность при сохранении

Функция:

```js
getWorkoutDurationMinutes()
```

Если режим `execution`, длительность считается по таймеру:

```js
Math.ceil(state.elapsedSeconds / 60)
```

Если режим `manual`, берется значение из поля:

```js
elements.durationInput.value
```

### Главное объяснение

```text
В ручном режиме duration берется из input.
В режиме выполнения duration считается по секундомеру.
Но в payload в итоге всегда уходит одно поле duration в минутах.
```

## 10. Сценарий: сохранение тренировки

Это главный сценарий проекта.

### Что делает пользователь

На странице:

```text
/add/
```

нажимает:

```text
Сохранить тренировку
```

или в режиме таймера:

```text
Завершить тренировку
```

### Какая функция срабатывает

В `bindEvents()`:

```js
elements.workoutForm?.addEventListener("submit", handleSubmit)
```

Функция:

```js
handleSubmit(event)
```

Файл:

```text
back/apps/pages/static/pages/js/workouts/form-render.js
```

### Шаг 1. Остановить обычную отправку формы

```js
event.preventDefault()
```

Обычная HTML-форма сама умеет отправляться, но нам это не нужно. Мы хотим отправить JSON через API.

### Шаг 2. Проверить форму

```js
if (!validateWorkoutForm()) return
```

Файл:

```text
back/apps/pages/static/pages/js/workouts/form-submit.js
```

`validateWorkoutForm()`:

- вызывает стандартную проверку браузера:

```js
elements.workoutForm?.checkValidity()
```

- если плохо, показывает стандартные сообщения:

```js
elements.workoutForm?.reportValidity()
```

- отдельно проверяет, что есть хотя бы одно упражнение с заполненным подходом:

```js
collectExercisesPayload().length
```

### Шаг 3. Собрать упражнения для backend

```js
const exercises = collectExercisesPayload()
```

Файл:

```text
back/apps/pages/static/pages/js/workouts/form-submit.js
```

`collectExercisesPayload()` берет:

```js
state.exercises
```

и превращает в формат backend.

Из такого frontend-состояния:

```js
{
  id: "temporary-id",
  name: "Жим лежа",
  sets: [
    { id: "temporary-id", weight: "60", reps: "10" }
  ]
}
```

получается:

```js
{
  name: "Жим лежа",
  sets: [
    { weight: 60, reps: 10, sort_order: 0 }
  ]
}
```

Что убирается:

- временные `id`;
- пустые подходы;
- упражнения без подходов.

### Шаг 4. Собрать payload

```js
const payload = {
    date: elements.dateInput.value,
    duration: getWorkoutDurationMinutes(),
    tonnage: calculateTonnage(exercises),
    exercises
}
```

Что туда попадает:

- `date` - дата из input;
- `duration` - длительность из поля или таймера;
- `tonnage` - сумма вес * повторы;
- `exercises` - упражнения и подходы.

Пример payload:

```json
{
  "date": "2026-06-02",
  "duration": 60,
  "tonnage": 6000,
  "exercises": [
    {
      "name": "Жим лежа",
      "sets": [
        {
          "weight": 60,
          "reps": 10,
          "sort_order": 0
        }
      ]
    }
  ]
}
```

### Шаг 5. Если был таймер, остановить его

```js
if (state.mode === "execution") {
    stopExecutionTimer()
}
```

### Шаг 6. Отправить на backend

```js
await createWorkout(payload)
```

Файл:

```text
back/apps/pages/static/pages/js/api.js
```

`createWorkout(payload)` делает:

```text
POST /api/workouts/
```

### Шаг 7. Куда попадает POST на backend

Маршруты:

```text
back/gymdo_backend/urls.py
api/workouts/ -> apps.workouts.urls
```

Дальше:

```text
back/apps/workouts/urls.py
path('', WorkoutListCreateView.as_view())
```

View:

```text
back/apps/workouts/views.py
WorkoutListCreateView
```

Класс:

```python
class WorkoutListCreateView(generics.ListCreateAPIView)
```

DRF сам понимает:

- GET на этот view - список;
- POST на этот view - создание.

### Шаг 8. Проверка авторизации

В view указано:

```python
permission_classes = [permissions.IsAuthenticated]
```

Это значит:

```text
если пользователь не вошел, POST не пройдет.
```

### Шаг 9. Serializer

View использует:

```python
serializer_class = WorkoutSerializer
```

Файл:

```text
back/apps/workouts/serializers.py
```

Serializer проверяет данные:

- есть ли упражнения;
- есть ли подходы внутри упражнений;
- правильные ли типы данных.

### Шаг 10. Создание тренировки

DRF вызывает:

```python
WorkoutSerializer.create(validated_data)
```

Внутри:

```python
exercises_data = validated_data.pop('exercises', [])
validated_data['tonnage'] = self.calculate_tonnage(exercises_data)
workout = Workout.objects.create(**validated_data)
self._save_nested(workout, exercises_data)
return workout
```

Важно:

```text
backend не доверяет тоннажу с frontend и пересчитывает его сам.
```

### Шаг 11. Привязка пользователя

Во view есть:

```python
def perform_create(self, serializer):
    serializer.save(user=self.request.user)
```

То есть `user` не приходит с frontend.

Backend сам берет пользователя из:

```python
request.user
```

### Шаг 12. Сохранение вложенных данных

Метод:

```python
_save_nested(workout, exercises_data)
```

Он:

1. Проходит по упражнениям.
2. Создает `ExerciseEntry`:

```python
ExerciseEntry.objects.create(
    workout=workout,
    name=exercise_data['name'],
    sort_order=...
)
```

3. Для каждого подхода создает `SetEntry`:

```python
SetEntry.objects.create(
    exercise=exercise,
    weight=set_data['weight'],
    reps=set_data['reps'],
    sort_order=...
)
```

### Шаг 13. Как это лежит в базе

Таблицы связаны так:

```text
Workout.id
ExerciseEntry.workout_id -> Workout.id
SetEntry.exercise_id -> ExerciseEntry.id
```

То есть:

```text
тренировка отдельно,
упражнения отдельно,
подходы отдельно,
но они связаны id.
```

### Шаг 14. Ответ frontend-у

Serializer превращает созданный объект обратно в JSON.

Frontend получает успешный ответ.

### Шаг 15. Переход на главную

```js
alert("Тренировка сохранена")
window.location.href = "/"
```

### Главное объяснение на защите

```text
При сохранении тренировки frontend не отправляет HTML-форму напрямую.
handleSubmit собирает state.exercises в чистый payload и вызывает createWorkout.
createWorkout делает POST /api/workouts/.
На backend WorkoutListCreateView проверяет авторизацию, WorkoutSerializer валидирует данные,
создает Workout, потом ExerciseEntry и SetEntry.
Пользователь берется из request.user, а не из frontend.
```

## 11. Сценарий: загрузка главной страницы

### Что делает пользователь

Открывает:

```text
/
```

### Какие JS-файлы участвуют

```text
back/apps/pages/static/pages/js/dashboard/main.js
back/apps/pages/static/pages/js/dashboard/state.js
back/apps/pages/static/pages/js/dashboard/calendar.js
back/apps/pages/static/pages/js/dashboard/stats.js
back/apps/pages/static/pages/js/dashboard/chart.js
back/apps/pages/static/pages/js/dashboard/muscle-map.js
```

### Какая стартовая функция запускается

Файл:

```text
dashboard/main.js
```

Функция:

```js
initPage()
```

Она вызывается в конце файла:

```js
initPage()
```

### Что делает `initPage`

```js
bindEvents()
await loadUserAndWorkouts()
updateAuthenticatedHeader()
renderCalendar()
updateStats()
renderChart()
await loadMuscleMaps()
```

### Шаг 1. Подключение событий

```js
bindEvents()
```

Подключает:

- закрытие модальных окон;
- logout;
- проверку доступа к справочнику;
- меню пользователя;
- кнопки предыдущего/следующего месяца.

### Шаг 2. Загрузка пользователя и тренировок

```js
await loadUserAndWorkouts()
```

Сначала:

```js
state.currentUser = await getCurrentUser()
```

Потом, если пользователь авторизован:

```js
state.workouts = await getWorkouts()
```

`getWorkouts()`:

```text
GET /api/workouts/
```

### Куда попадает GET `/api/workouts/`

```text
apps.workouts.urls -> WorkoutListCreateView
```

Метод:

```python
get_queryset()
```

Он возвращает:

```python
Workout.objects
    .filter(user=self.request.user)
    .prefetch_related('exercises__sets')
```

Важно:

```text
Главная получает только тренировки текущего пользователя.
```

`prefetch_related('exercises__sets')` заранее подгружает упражнения и подходы, чтобы не делать много лишних SQL-запросов.

### Шаг 3. Обновление шапки

```js
updateAuthenticatedHeader()
```

Если пользователь вошел:

- скрывается кнопка входа;
- показывается бейдж пользователя;
- меняется подзаголовок.

Если не вошел:

- показывается приглашение войти.

### Шаг 4. Рисование блоков страницы

Все дальше строится из:

```js
state.workouts
```

Вызываются:

```js
renderCalendar()
updateStats()
renderChart()
loadMuscleMaps()
```

### Главное объяснение

```text
Главная страница при загрузке один раз получает тренировки текущего пользователя через GET /api/workouts/.
Ответ кладется в state.workouts.
Потом календарь, статистика, график и карта мышц не ходят каждый раз в backend,
а строятся из этого массива.
```

## 12. Сценарий: календарь на главной

### Где описан календарь

Файл:

```text
back/apps/pages/static/pages/js/dashboard/calendar.js
```

Главная функция:

```js
renderCalendar()
```

### Что ей нужно

Она использует:

```js
state.currentDate
state.workouts
elements.calendarDays
```

### Что делает `renderCalendar`

1. Берет месяц и год из:

```js
state.currentDate
```

2. Считает первый день месяца и количество дней.

3. Очищает старый календарь.

4. Создает пустые ячейки до первого дня месяца.

5. Для каждого дня месяца создает кнопку/ячейку.

6. Для каждого дня проверяет тренировки:

```js
getDayWorkouts(dateString)
```

7. Если тренировки есть, добавляет визуальную индикацию.

8. Добавляет обработчик клика.

### Как календарь понимает, что в день была тренировка

У каждой тренировки есть поле:

```text
date
```

Например:

```text
2026-06-02
```

Календарь для каждого дня тоже делает строку даты.

Потом сравнивает:

```text
workout.date === dateString
```

Если совпадения есть, значит в этот день была тренировка.

### Как кнопки становятся интерактивными

Через:

```js
addEventListener("click", ...)
```

Варианты:

- нет тренировок в день -> переход на добавление:

```text
/add/?date=YYYY-MM-DD
```

- одна тренировка -> открытие/просмотр тренировки;
- несколько тренировок -> модальное окно со списком.

### Как меняется месяц

В `dashboard/main.js` в `bindEvents()`:

```js
state.currentDate.setMonth(state.currentDate.getMonth() - 1)
renderCalendar()
```

и:

```js
state.currentDate.setMonth(state.currentDate.getMonth() + 1)
renderCalendar()
```

То есть кнопки месяца не загружают данные заново. Они меняют дату в `state` и перерисовывают календарь.

### Главное объяснение

```text
Календарь строится из state.workouts.
Для каждого дня он ищет тренировки с такой же датой.
Если нашел, добавляет индикацию.
Клики работают через addEventListener.
Переключение месяца меняет state.currentDate и заново вызывает renderCalendar.
```

## 13. Сценарий: просмотр одной тренировки

### Что делает пользователь

Открывает тренировку:

```text
/workouts/<id>/
```

Например:

```text
/workouts/5/
```

### Как frontend узнает id

HTML-страница содержит атрибут:

```html
data-workout-id="5"
```

JS читает его:

```js
const workoutId = page?.dataset.workoutId
```

Файл:

```text
back/apps/pages/static/pages/js/workout-detail.js
```

`dataset` - это способ читать `data-*` атрибуты из HTML.

### Какая функция запускается

```js
loadWorkout()
```

Она вызывается в конце файла.

### Что делает `loadWorkout`

1. Проверяет, есть ли `workoutId`.

2. Вызывает:

```js
const workout = await getWorkoutById(workoutId)
```

3. Передает результат в:

```js
renderWorkout(workout)
```

4. Подключает удаление на кнопку.

### Какой API-запрос идет

`getWorkoutById(id)` описан в:

```text
back/apps/pages/static/pages/js/api.js
```

Делает:

```text
GET /api/workouts/<id>/
```

### Куда попадает backend

```text
apps.workouts.urls
path('<int:pk>/', WorkoutDetailView.as_view())
```

View:

```text
WorkoutDetailView
```

Файл:

```text
back/apps/workouts/views.py
```

### Как проверяется владелец

В `WorkoutDetailView` есть:

```python
def get_object(self):
    obj = super().get_object()
    if obj.user_id != self.request.user.id:
        raise PermissionDenied('Это не ваша тренировка.')
    return obj
```

То есть даже если пользователь попробует вручную открыть чужой id, backend не отдаст чужую тренировку.

### Что рисует `renderWorkout`

Она получает объект:

```js
workout
```

Внутри:

- дата;
- длительность;
- тоннаж;
- упражнения;
- подходы каждого упражнения.

### Главное объяснение

```text
Страница просмотра получает id из data-workout-id.
По этому id frontend делает GET /api/workouts/<id>/.
Backend через WorkoutDetailView проверяет, что тренировка принадлежит request.user.
Если все хорошо, serializer возвращает тренировку с упражнениями и подходами,
а renderWorkout рисует ее на странице.
```

## 14. Сценарий: удаление тренировки

### Откуда можно удалить

Удаление есть:

- на главной странице из модального окна;
- на странице просмотра тренировки.

### Главная API-функция

```js
deleteWorkoutById(id)
```

Файл:

```text
back/apps/pages/static/pages/js/api.js
```

Она делает:

```text
DELETE /api/workouts/<id>/
```

### Удаление с главной

Файл:

```text
back/apps/pages/static/pages/js/dashboard/main.js
```

Функция:

```js
deleteWorkout(id, dateString)
```

Шаги:

1. Проверяет авторизацию.
2. Спрашивает подтверждение:

```js
confirm(...)
```

3. Вызывает:

```js
await deleteWorkoutById(id)
```

4. Убирает тренировку из локального массива:

```js
state.workouts = state.workouts.filter((workout) => workout.id !== id)
```

5. Перерисовывает:

```js
updateStats()
renderCalendar()
renderChart()
loadMuscleMaps()
closeModal()
```

### Удаление со страницы просмотра

Файл:

```text
back/apps/pages/static/pages/js/workout-detail.js
```

Кнопка вызывает:

```js
deleteWorkoutById(workoutId)
```

После успеха:

```js
window.location.href = "/"
```

### Что делает backend

Запрос:

```text
DELETE /api/workouts/<id>/
```

Попадает в:

```text
WorkoutDetailView
```

DRF вызывает удаление объекта.

Перед удалением `get_object()` проверяет владельца:

```python
obj.user_id == request.user.id
```

### Что удаляется из базы

Удаляется:

```text
Workout
```

А связанные записи удаляются автоматически:

```text
ExerciseEntry
SetEntry
```

потому что в моделях связи через:

```python
on_delete=models.CASCADE
```

### Главное объяснение

```text
Frontend делает DELETE /api/workouts/<id>/.
Backend через WorkoutDetailView проверяет владельца тренировки и удаляет Workout.
ExerciseEntry и SetEntry удаляются каскадом.
После успешного ответа frontend либо возвращает пользователя на главную,
либо убирает тренировку из state.workouts и перерисовывает главную.
```

## 15. Сценарий: статистика на главной

### Где описано

Файл:

```text
back/apps/pages/static/pages/js/dashboard/stats.js
```

### Какая функция запускается

```js
updateStats()
```

Она вызывается в:

```js
initPage()
```

и после удаления тренировки.

### Что делает `updateStats`

1. Вызывает:

```js
const stats = getStats()
```

2. Записывает значения в HTML:

```js
elements.totalWorkouts.textContent = ...
elements.totalExercises.textContent = ...
elements.totalSets.textContent = ...
elements.totalReps.textContent = ...
elements.totalTonnage.textContent = ...
```

### Что делает `getStats`

Проходит по:

```js
state.workouts
```

Считает:

- сколько тренировок;
- сколько упражнений;
- сколько подходов;
- сколько повторений;
- общий тоннаж.

### Главное объяснение

```text
Статистика не запрашивается отдельным API.
Она считается на frontend из уже загруженного массива state.workouts.
```

## 16. Сценарий: график на главной

### Где описано

Файл:

```text
back/apps/pages/static/pages/js/dashboard/chart.js
```

### Какая функция

```js
renderChart()
```

### Что делает

Берет:

```js
state.workouts
```

Сортирует тренировки по дате.

На ось X кладет даты.

В данные графика кладет:

- тоннаж;
- длительность.

### Главное объяснение

```text
График строится на frontend из state.workouts.
Backend отдельно график не считает.
```

## 17. Сценарий: карта мышц

### Где описано

Файл:

```text
back/apps/pages/static/pages/js/dashboard/muscle-map.js
```

### Главная функция

```js
loadMuscleMaps()
```

Она вызывается на главной в:

```js
initPage()
```

### Шаг 1. Загрузка SVG

```js
const frontSvg = await loadSvgIntoContainer(elements.frontMapContainer, "/static/pages/front-view.svg")
const backSvg = await loadSvgIntoContainer(elements.backMapContainer, "/static/pages/back-view.svg")
```

`loadSvgIntoContainer()`:

- делает `fetch()` SVG-файла;
- получает текст SVG;
- вставляет его в контейнер через `innerHTML`;
- возвращает сам элемент `<svg>`.

### Шаг 2. Сбор нагрузки

```js
const loadMap = buildMuscleLoadMap()
```

`buildMuscleLoadMap()`:

1. Берет тренировки за последние 7 дней:

```js
getLast7DaysWorkouts()
```

2. Проходит по упражнениям каждой тренировки.

3. По названию упражнения ищет данные в справочнике:

```js
getExerciseByName(exercise.name)
```

4. Берет основные мышцы:

```js
exerciseData?.primaryMuscles
```

5. Считает нагрузку упражнения по подходам:

```js
calculateSetLoad(set)
```

`calculateSetLoad()`:

```text
если есть вес: reps * weight
если веса нет: reps
если ничего нет: 1
```

6. Складывает нагрузку в объект:

```js
loadMap[muscleKey] = ...
```

Пример:

```js
{
  chest: 1200,
  biceps: 400
}
```

### Шаг 3. Подсветка SVG

```js
applyMuscleLoadToSvg(frontSvg, backSvg, loadMap)
```

Для каждой мышцы:

1. Берется настройка из:

```js
muscleSvgMap
```

2. Выбирается CSS-класс:

```js
getMuscleIntensityClass(value, maxValue)
```

Сейчас возвращается:

```text
muscle-map-active
```

3. По id находятся SVG-элементы:

```js
tryActivateSvgIds(...)
```

4. Им добавляется CSS-класс.

### Главное объяснение

```text
Карта мышц берет тренировки из state.workouts за последние 7 дней.
По названию упражнения находит его в справочнике exercises.js.
Из справочника берет primaryMuscles.
По подходам считает нагрузку и собирает loadMap.
Потом по muscleSvgMap находит id элементов внутри SVG и добавляет им CSS-класс подсветки.
```

## 18. Сценарий: открытие справочника упражнений

### Что делает пользователь

Открывает:

```text
/guide/
```

### Проверка доступа

На главной при клике на ссылку справочника проверяется:

```js
state.isAuthenticated
```

Если пользователь не вошел, открывается модальное окно с просьбой войти.

Если вошел, происходит переход.

### Какие JS-файлы справочника

```text
guide/guide-render.js
guide/modal.js
guide/reactions.js
```

### Откуда берутся упражнения

Упражнения берутся не из базы, а из JS-справочника:

```text
exercises.js
```

Там хранится:

- название;
- категория;
- мышцы;
- описание;
- картинка.

### Что происходит при загрузке

Стартовая логика справочника:

- проверяет пользователя;
- рисует группы упражнений;
- загружает реакции;
- запускает SSE-поток.

### Главное объяснение

```text
Справочник упражнений хранится на frontend в exercises.js.
Backend нужен не для самих упражнений, а для реакций пользователей: лайков и дизлайков.
```

## 19. Сценарий: лайк или дизлайк упражнения

### Что делает пользователь

В справочнике нажимает лайк или дизлайк у упражнения.

### Где frontend-логика

Файл:

```text
back/apps/pages/static/pages/js/guide/reactions.js
```

### Какая функция обрабатывает клик

```js
handleReactionClick(...)
```

Она вызывает:

```js
voteExerciseReaction(exerciseName, value)
```

### Где описан API-метод

Файл:

```text
back/apps/pages/static/pages/js/api.js
```

Функция:

```js
voteExerciseReaction(exerciseName, value)
```

### Какой запрос уходит

```text
POST /api/workouts/exercise-reactions/vote/
```

Тело:

```json
{
  "exercise_name": "Жим лежа",
  "value": "like"
}
```

или:

```json
{
  "exercise_name": "Жим лежа",
  "value": "dislike"
}
```

### Куда попадает backend

```text
back/apps/workouts/urls.py
path('exercise-reactions/vote/', ExerciseReactionVoteView.as_view())
```

View:

```text
ExerciseReactionVoteView
```

Файл:

```text
back/apps/workouts/views.py
```

### Что делает backend

1. Берет:

```python
exercise_name = request.data.get('exercise_name')
value = request.data.get('value')
```

2. Проверяет:

- есть ли название упражнения;
- value равен `like` или `dislike`.

3. Сохраняет реакцию:

```python
ExerciseReaction.objects.update_or_create(
    user=request.user,
    exercise_name=exercise_name,
    defaults={'value': value},
)
```

`update_or_create()` значит:

- если реакции еще нет, создать;
- если уже есть, обновить.

### Почему нельзя поставить две реакции

В модели `ExerciseReaction` есть ограничение:

```python
UniqueConstraint(fields=('user', 'exercise_name'))
```

То есть:

```text
один пользователь + одно упражнение = одна реакция.
```

### Что backend возвращает

Backend считает:

- likes;
- dislikes;
- user_reaction.

И возвращает JSON.

Frontend обновляет кнопки и счетчики.

### Главное объяснение

```text
При клике на лайк frontend отправляет exercise_name и value на POST /api/workouts/exercise-reactions/vote/.
Backend через update_or_create сохраняет одну реакцию текущего пользователя на упражнение,
потом пересчитывает лайки и дизлайки и возвращает их frontend-у.
```

## 20. Сценарий: live-обновление реакций через SSE

### Зачем нужно

Чтобы лайки/дизлайки могли обновляться без перезагрузки страницы.

### Где frontend

Файл:

```text
back/apps/pages/static/pages/js/guide/reactions.js
```

Функция:

```js
startReactionStream()
```

Она вызывает API:

```js
createExerciseReactionsStream()
```

### Какой запрос открывается

```text
GET /api/workouts/exercise-reactions/stream/
```

Это не обычный одноразовый запрос.

Это `EventSource`, то есть открытое соединение:

```js
new EventSource(...)
```

### Backend

Маршрут:

```text
exercise-reactions/stream/ -> ExerciseReactionStreamView
```

View:

```text
ExerciseReactionStreamView
```

Файл:

```text
back/apps/workouts/views.py
```

### Что делает view

Возвращает:

```python
StreamingHttpResponse(event_stream(), content_type='text/event-stream')
```

Внутри `event_stream()`:

1. Каждую секунду проверяет версию реакций:

```python
get_exercise_reaction_version()
```

2. Если реакции изменились, отправляет событие:

```text
event: reactions
data: {...}
```

3. Если не изменились, отправляет keep-alive:

```text
: keep-alive
```

### Что делает frontend

Frontend слушает событие `reactions`.

Когда событие пришло:

- парсит JSON;
- обновляет локальное состояние реакций;
- применяет реакции к кнопкам.

### Главное объяснение

```text
SSE работает как открытый канал от сервера к браузеру.
Frontend открывает EventSource на /api/workouts/exercise-reactions/stream/.
Backend держит StreamingHttpResponse и отправляет новое состояние реакций,
когда оно изменилось.
```

## 21. Самые важные цепочки для защиты

### Добавление тренировки

```text
/add/
initAddPage()
getCurrentUser()
getWorkouts()
state.exercises
handleSubmit()
validateWorkoutForm()
collectExercisesPayload()
payload
createWorkout(payload)
POST /api/workouts/
WorkoutListCreateView
WorkoutSerializer.create()
Workout.objects.create()
ExerciseEntry.objects.create()
SetEntry.objects.create()
/
```

### Главная страница

```text
/
initPage()
loadUserAndWorkouts()
getCurrentUser()
getWorkouts()
GET /api/workouts/
WorkoutListCreateView.get_queryset()
state.workouts
renderCalendar()
updateStats()
renderChart()
loadMuscleMaps()
```

### Удаление тренировки

```text
delete button
confirm()
deleteWorkoutById(id)
DELETE /api/workouts/<id>/
WorkoutDetailView.get_object()
owner check
delete Workout
CASCADE delete ExerciseEntry/SetEntry
frontend rerender
```

### Карта мышц

```text
state.workouts
getLast7DaysWorkouts()
buildMuscleLoadMap()
getExerciseByName()
primaryMuscles
calculateSetLoad()
loadMap
applyMuscleLoadToSvg()
muscleSvgMap
tryActivateSvgIds()
CSS class muscle-map-active
```

### Реакции

```text
guide page
loadExerciseReactions()
GET /api/workouts/exercise-reactions/
handleReactionClick()
voteExerciseReaction()
POST /api/workouts/exercise-reactions/vote/
ExerciseReactionVoteView
update_or_create()
return counts
SSE stream updates everyone
```


// API_BASE - базовый адрес backend API.
// Пустая строка значит, что запросы идут на тот же домен, где открыта страница.
const API_BASE = "";

// JSON_CONTENT_TYPE - тип тела запроса "JSON".
// Его кладем в заголовок Content-Type, когда отправляем объект на backend.
const JSON_CONTENT_TYPE = "application/json";

// CSRF_SAFE_METHODS - HTTP-методы, которые ничего не изменяют на сервере.
// Для них Django не требует CSRF-токен.
const CSRF_SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

// Мини-словарь английских слов из API-слоя:
// fetch - встроенная функция браузера для HTTP-запросов.
// request - запрос от браузера к backend.
// response - ответ backend браузеру.
// headers - заголовки запроса, служебная информация вроде Content-Type и X-CSRFToken.
// body - тело запроса, то есть данные, которые отправляются на backend.
// credentials - настройка, которая разрешает браузеру отправлять cookies вместе с запросом.
// payload - полезная нагрузка запроса, например JSON с новой тренировкой.

/**
 * Читает cookie по имени.
 * Используется, чтобы достать `csrftoken` перед POST/DELETE-запросами.
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }

    return null;
}

/**
 * Просит Django выдать CSRF-cookie перед небезопасными запросами.
 * Без этого POST/DELETE могут быть отклонены защитой Django.
 * Cookie потом читается в `getCookie()` и отправляется в заголовке `X-CSRFToken`.
 *
 * GET /api/auth/csrf/
 * Django route: apps.accounts.urls -> path("csrf/", csrf_view)
 * View: apps.accounts.views.csrf_view
 */
async function ensureCsrfCookie() {
    await fetch(`${API_BASE}/api/auth/csrf/`, {
        method: "GET",
        credentials: "include"
    });
}

/**
 * Проверяет, нужно ли считать тело запроса JSON-данными.
 */
function isJsonBody(body) {
    return body != null && !(body instanceof FormData);
}

/**
 * Собирает заголовки запроса и добавляет Content-Type для JSON.
 */
function buildHeaders(options) {
    const headers = { ...(options.headers || {}) };

    if (isJsonBody(options.body) && !headers["Content-Type"]) {
        headers["Content-Type"] = JSON_CONTENT_TYPE;
    }

    return headers;
}

/**
 * Добавляет CSRF-заголовок только там, где он нужен.
 * GET/HEAD/OPTIONS считаются безопасными, а для POST/PUT/PATCH/DELETE сначала запрашивается cookie.
 * Так все изменяющие запросы проходят стандартную CSRF-защиту Django.
 */
async function attachCsrfHeader(method, headers) {
    if (CSRF_SAFE_METHODS.includes(method)) {
        return headers;
    }

    await ensureCsrfCookie();

    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
        headers["X-CSRFToken"] = csrfToken;
    }

    return headers;
}

/**
 * Разбирает ответ backend после `fetch()`.
 * Если ответ JSON, возвращается объект; если тело пустое, возвращается `null`.
 * Это позволяет одинаково обрабатывать и обычные ответы, и DELETE без тела.
 */
async function parseResponse(response) {
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes(JSON_CONTENT_TYPE)) {
        return response.json();
    }

    return response.text();
}

/**
 * Достает понятный текст ошибки из ответа API.
 * Backend может вернуть `error`, `detail` или словарь ошибок по полям, поэтому здесь все приводится к одной строке.
 * Эту строку потом можно показать через `alert()` или в интерфейсе.
 */
function getErrorMessage(data) {
    return (
        data?.detail ||
        data?.error ||
        data?.message ||
        (typeof data === "string" ? data : "Ошибка запроса")
    );
}

/**
 * Моя общая обертка над `fetch()`, чтобы не повторять одни и те же настройки в каждом API-запросе.
 * Здесь добавляются cookies (`credentials: "include"`), CSRF-заголовок для POST/DELETE и единая обработка ошибок.
 * Все функции ниже (`loginUser`, `getWorkouts`, `createWorkout`) идут на backend именно через нее.
 */
async function apiFetch(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const headers = await attachCsrfHeader(method, buildHeaders(options));//buildHeaders добавляет Content-Type, attachCsrfHeader добавляет X-CSRFToken, если нужно.

    const response = await fetch(`${API_BASE}${path}`, {//credentials: "include" разрешает браузеру отправлять cookies вместе с запросом, что нужно для авторизации через сессии Django. Остальные настройки запроса (метод, тело, дополнительные заголовки) передаются через options.
        credentials: "include",
        ...options,
        method,
        headers
    });

    const data = await parseResponse(response);//parseResponse разбирает ответ: если JSON, возвращает объект, если тело пустое (204 No Content), возвращает null, иначе возвращает текст.

    if (!response.ok) {//Если HTTP-статус ответа не в диапазоне 200-299, считаем это ошибкой и выбрасываем исключение с текстом ошибки из getErrorMessage.
        throw new Error(getErrorMessage(data));
    }

    return data;
}

/**
 * Проверяет, кто сейчас авторизован в браузере.
 * Запрашивает `/api/auth/me/`; если backend ответил, что входа нет, возвращается `null`.
 * Эту функцию используют страницы, где нужно показать данные только своему пользователю.
 *
 * GET /api/auth/me/
 * Django route: apps.accounts.urls -> path("me/", me_view)
 * View: apps.accounts.views.me_view
 */
async function getCurrentUser() {
    const data = await apiFetch("/api/auth/me/");
    return data?.is_authenticated && data?.user ? data.user : null;
}

/**
 * Отправляет логин и пароль на backend.
 * После успешного ответа Django создает сессию, а браузер дальше автоматически прикладывает session cookie к запросам.
 * Функция не хранит пароль на фронтенде, она только передает его в момент входа.
 *
 * POST /api/auth/login/
 * Django route: apps.accounts.urls -> path("login/", login_view)
 * View: apps.accounts.views.login_view
 */
async function loginUser(username, password) {
    return apiFetch("/api/auth/login/", {
        method: "POST",
        // username - логин пользователя, password - пароль.
        // Эти имена совпадают с тем, что ожидает backend в `login_view`.
        body: JSON.stringify({ username, password })
    });
}

/**
 * Отправляет данные регистрации на backend.
 * Backend создает Django-пользователя, валидирует пароль и сразу выполняет вход через `login()`.
 * После этого фронтенд может перейти на главную уже как авторизованный пользователь.
 *
 * POST /api/auth/register/
 * Django route: apps.accounts.urls -> path("register/", register_view)
 * View: apps.accounts.views.register_view
 */
async function registerUser(username, password, email = "") {
    return apiFetch("/api/auth/register/", {
        method: "POST",
        // username - логин, password - пароль, email - почта.
        // JSON.stringify превращает обычный JS-объект в JSON-строку для Django.
        body: JSON.stringify({ username, password, email })
    });
}

/**
 * Выходит из аккаунта текущего пользователя.
 *
 * POST /api/auth/logout/
 * Django route: apps.accounts.urls -> path("logout/", logout_view)
 * View: apps.accounts.views.logout_view
 */
async function logoutUser() {
    return apiFetch("/api/auth/logout/", { method: "POST" });
}

/**
 * Получает список тренировок текущего пользователя.
 *
 * GET /api/workouts/
 * Django route: apps.workouts.urls -> path('', WorkoutListCreateView.as_view())
 * View: apps.workouts.views.WorkoutListCreateView
 * DRF method: ListCreateAPIView.get() -> get_queryset() -> WorkoutSerializer
 */
async function getWorkouts() {
    return apiFetch("/api/workouts/");
}
//после запроса переходим в бэкенд в workouts/views.py, там данные обрабатываются и возвращаются в виде JSON, который потом используется на фронтенде для отображения информации о тренировках пользователя.

/**
 * Получает одну тренировку по id.
 *
 * GET /api/workouts/<id>/
 * Django route: apps.workouts.urls -> path('<int:pk>/', WorkoutDetailView.as_view())
 * View: apps.workouts.views.WorkoutDetailView
 * DRF method: RetrieveUpdateDestroyAPIView.get() -> get_object() -> WorkoutSerializer
 */
async function getWorkoutById(id) {
    return apiFetch(`/api/workouts/${id}/`);
}

/**
 * Отправляет готовую тренировку на backend.
 * На вход приходит `payload` из формы добавления: дата, длительность, упражнения и подходы.
 * Внутри вызывается `apiFetch("/api/workouts/")`, а дальше Django передает данные в `WorkoutSerializer`.
 *
 * POST /api/workouts/
 * Django route: apps.workouts.urls -> path('', WorkoutListCreateView.as_view())
 * View: apps.workouts.views.WorkoutListCreateView
 * DRF method: ListCreateAPIView.post() -> WorkoutSerializer.create()
 */
async function createWorkout(payload) {
    return apiFetch("/api/workouts/", {
        method: "POST",
        // payload - готовая тренировка: date, duration, tonnage, exercises.
        // Backend получит это как `request.data`.
        body: JSON.stringify(payload)
    });
}

/**
 * Удаляет тренировку по id.
 *
 * DELETE /api/workouts/<id>/
 * Django route: apps.workouts.urls -> path('<int:pk>/', WorkoutDetailView.as_view())
 * View: apps.workouts.views.WorkoutDetailView
 * DRF method: RetrieveUpdateDestroyAPIView.delete() -> get_object() -> delete()
 */
async function deleteWorkoutById(id) {
    return apiFetch(`/api/workouts/${id}/`, {
        method: "DELETE"
    });
}

/**
 * Загружает текущие лайки/дизлайки упражнений.
 *
 * GET /api/workouts/exercise-reactions/
 * Django route: apps.workouts.urls -> path('exercise-reactions/', ExerciseReactionListView.as_view())
 * View: apps.workouts.views.ExerciseReactionListView
 * Method: ExerciseReactionListView.get()
 */
async function getExerciseReactions() {
    return apiFetch("/api/workouts/exercise-reactions/");
}

/**
 * Открывает SSE-поток для live-обновления лайков/дизлайков.
 *
 * GET /api/workouts/exercise-reactions/stream/
 * Django route: apps.workouts.urls -> path('exercise-reactions/stream/', ExerciseReactionStreamView.as_view())
 * View: apps.workouts.views.ExerciseReactionStreamView
 * Method: ExerciseReactionStreamView.get()
 */
function createExerciseReactionsStream() { //Это не обычный быстрый запрос. Это открытый поток. EventSource позволяет получать обновления от сервера в реальном времени. Когда на backend происходят изменения реакций, сервер отправляет новые данные всем подключенным клиентам, и они сразу обновляют интерфейс без необходимости перезагрузки страницы или ручного запроса.
    return new EventSource(`${API_BASE}/api/workouts/exercise-reactions/stream/`, {
        withCredentials: true
    });
}

/**
 * Сохраняет лайк или дизлайк текущего пользователя.
 *
 * POST /api/workouts/exercise-reactions/vote/
 * Django route: apps.workouts.urls -> path('exercise-reactions/vote/', ExerciseReactionVoteView.as_view())
 * View: apps.workouts.views.ExerciseReactionVoteView
 * Method: ExerciseReactionVoteView.post()
 */
async function voteExerciseReaction(exerciseName, value) {
    return apiFetch("/api/workouts/exercise-reactions/vote/", {
        method: "POST",
        body: JSON.stringify({
            // exercise_name - название упражнения для backend.
            // value - сама реакция: "like" или "dislike".
            exercise_name: exerciseName,
            value
        })
    });
}

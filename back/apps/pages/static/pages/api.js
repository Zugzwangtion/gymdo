const API_BASE = "";
const JSON_CONTENT_TYPE = "application/json";
const CSRF_SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }

    return null;
}

async function ensureCsrfCookie() {
    await fetch(`${API_BASE}/api/auth/csrf/`, {
        method: "GET",
        credentials: "include"
    });
}

function isJsonBody(body) {
    return body != null && !(body instanceof FormData);
}

function buildHeaders(options) {
    const headers = { ...(options.headers || {}) };

    if (isJsonBody(options.body) && !headers["Content-Type"]) {
        headers["Content-Type"] = JSON_CONTENT_TYPE;
    }

    return headers;
}

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

function getErrorMessage(data) {
    return (
        data?.detail ||
        data?.error ||
        data?.message ||
        (typeof data === "string" ? data : "Ошибка запроса")
    );
}

async function apiFetch(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const headers = await attachCsrfHeader(method, buildHeaders(options));

    const response = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
        ...options,
        method,
        headers
    });

    const data = await parseResponse(response);

    if (!response.ok) {
        throw new Error(getErrorMessage(data));
    }

    return data;
}

async function getCurrentUser() {
    const data = await apiFetch("/api/auth/me/");
    return data?.is_authenticated && data?.user ? data.user : null;
}

async function loginUser(username, password) {
    return apiFetch("/api/auth/login/", {
        method: "POST",
        body: JSON.stringify({ username, password })
    });
}

async function registerUser(username, password, email = "") {
    return apiFetch("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify({ username, password, email })
    });
}

async function logoutUser() {
    return apiFetch("/api/auth/logout/", { method: "POST" });
}

async function getWorkouts() {
    return apiFetch("/api/workouts/");
}

async function createWorkout(payload) {
    return apiFetch("/api/workouts/", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

async function deleteWorkoutById(id) {
    return apiFetch(`/api/workouts/${id}/`, {
        method: "DELETE"
    });
}

async function getExerciseReactions() {
    return apiFetch("/api/workouts/exercise-reactions/");
}

function createExerciseReactionsStream() {
    return new EventSource(`${API_BASE}/api/workouts/exercise-reactions/stream/`, {
        withCredentials: true
    });
}

async function voteExerciseReaction(exerciseName, value) {
    return apiFetch("/api/workouts/exercise-reactions/vote/", {
        method: "POST",
        body: JSON.stringify({
            exercise_name: exerciseName,
            value
        })
    });
}

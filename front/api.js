const API_BASE = "http://127.0.0.1:8000";

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

async function apiFetch(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const headers = {
        ...(options.headers || {})
    };

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        await ensureCsrfCookie();
        const csrfToken = getCookie("csrftoken");
        if (csrfToken) {
            headers["X-CSRFToken"] = csrfToken;
        }
    }

    const response = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
        ...options,
        headers
    });

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        const message =
            data?.detail ||
            data?.error ||
            data?.message ||
            (typeof data === "string" ? data : "Ошибка запроса");

        throw new Error(message);
    }

    return data;
}

async function getCurrentUser() {
    const data = await apiFetch("/api/auth/me/");

    if (data?.is_authenticated === true && data?.user) {
        return data.user;
    }

    return null;
}

async function loginUser(username, password) {
    return apiFetch("/api/auth/login/", {
        method: "POST",
        body: JSON.stringify({ username, password })
    });
}

async function registerUser(username, password) {
    return apiFetch("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify({ username, password })
    });
}

async function logoutUser() {
    return apiFetch("/api/auth/logout/", {
        method: "POST"
    });
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
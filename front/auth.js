function goRegister() {
    window.location.href = "register.html";
}

function getFieldValue(id) {
    const field = document.getElementById(id);
    return field ? field.value.trim() : "";
}

function validateForm(form) {
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }

    return true;
}

async function handleLoginSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!validateForm(form)) {
        return;
    }

    const username = getFieldValue("login");
    const password = getFieldValue("password");

    if (!username || !password) {
        alert("Заполни логин и пароль");
        return;
    }

    try {
        await loginUser(username, password);
        window.location.href = "index.html";
    } catch (error) {
        alert(error.message || "Неверный логин или пароль");
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!validateForm(form)) {
        return;
    }

    const username = getFieldValue("login");
    const email = getFieldValue("email");
    const password = getFieldValue("password");

    if (!username || !password || !email) {
        alert("Заполни логин, email и пароль");
        return;
    }

    try {
        await registerUser(username, password, email);
        window.location.href = "index.html";
    } catch (error) {
        alert(error.message || "Ошибка регистрации");
    }
}

function initAuthPage() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.addEventListener("submit", handleLoginSubmit);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", handleRegisterSubmit);
    }
}

initAuthPage();

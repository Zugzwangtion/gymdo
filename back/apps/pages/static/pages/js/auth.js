/**
 * goRegister - вспомогательная функция этого экрана.
 * Использует данные, которые уже лежат в состоянии страницы или DOM.
 * Нужна, чтобы основной обработчик страницы оставался короче и читался по шагам.
 */
function goRegister() {
    window.location.href = "/register/";
}

/**
 * getFieldValue - вспомогательная функция этого экрана.
 * На вход получает: id. По ним выполняет нужный шаг сценария.
 * Нужна, чтобы основной обработчик страницы оставался короче и читался по шагам.
 */
function getFieldValue(id) {
    const field = document.getElementById(id);
    return field ? field.value.trim() : "";
}

/**
 * validateForm - вспомогательная функция этого экрана.
 * На вход получает: form. По ним выполняет нужный шаг сценария.
 * Нужна, чтобы основной обработчик страницы оставался короче и читался по шагам.
 */
function validateForm(form) {
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }

    return true;
}

/**
 * handleLoginSubmit - вспомогательная функция этого экрана.
 * На вход получает: event. По ним выполняет нужный шаг сценария.
 * Нужна, чтобы основной обработчик страницы оставался короче и читался по шагам.
 */
async function handleLoginSubmit(event) {
    event.preventDefault();

    // form - форма входа, которую отправил пользователь.
    const form = event.currentTarget;
    if (!validateForm(form)) {
        return;
    }

    // username - логин, password - пароль.
    const username = getFieldValue("login");
    const password = getFieldValue("password");

    if (!username || !password) {
        alert("Заполни логин и пароль");
        return;
    }

    try {
        await loginUser(username, password);
        window.location.href = "/";
    } catch (error) {
        alert(error.message || "Неверный логин или пароль");
    }
}

/**
 * handleRegisterSubmit - вспомогательная функция этого экрана.
 * На вход получает: event. По ним выполняет нужный шаг сценария.
 * Нужна, чтобы основной обработчик страницы оставался короче и читался по шагам.
 */
async function handleRegisterSubmit(event) {
    event.preventDefault();

    // form - форма регистрации.
    const form = event.currentTarget;
    if (!validateForm(form)) {
        return;
    }

    // username - логин, email - почта, password - пароль.
    const username = getFieldValue("login");
    const email = getFieldValue("email");
    const password = getFieldValue("password");

    if (!username || !password || !email) {
        alert("Заполни логин, email и пароль");
        return;
    }

    try {
        await registerUser(username, password, email);
        window.location.href = "/";
    } catch (error) {
        alert(error.message || "Ошибка регистрации");
    }
}

/**
 * initAuthPage - вспомогательная функция этого экрана.
 * Использует данные, которые уже лежат в состоянии страницы или DOM.
 * Нужна, чтобы основной обработчик страницы оставался короче и читался по шагам.
 */
function initAuthPage() {
    // loginForm - форма входа, registerForm - форма регистрации.
    // На странице обычно есть только одна из них.
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
// Словарь терминов в этом файле:
// auth - authentication, авторизация/вход в аккаунт.
// login - логин или вход.
// register - регистрация.
// submit - отправка формы.
// username - имя пользователя/логин.
// password - пароль.
// email - почта.

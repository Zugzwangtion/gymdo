function goRegister() {
    window.location.href = "/register/";
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
        alert("Р—Р°РїРѕР»РЅРё Р»РѕРіРёРЅ Рё РїР°СЂРѕР»СЊ");
        return;
    }

    try {
        await loginUser(username, password);
        window.location.href = "/";
    } catch (error) {
        alert(error.message || "РќРµРІРµСЂРЅС‹Р№ Р»РѕРіРёРЅ РёР»Рё РїР°СЂРѕР»СЊ");
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
        alert("Р—Р°РїРѕР»РЅРё Р»РѕРіРёРЅ, email Рё РїР°СЂРѕР»СЊ");
        return;
    }

    try {
        await registerUser(username, password, email);
        window.location.href = "/";
    } catch (error) {
        alert(error.message || "РћС€РёР±РєР° СЂРµРіРёСЃС‚СЂР°С†РёРё");
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

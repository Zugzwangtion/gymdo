function goRegister() {
    window.location.href = "register.html";
}

function validateForm(form) {
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }
    return true;
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

        if (!validateForm(loginForm)) return;

        const username = document.getElementById("login").value.trim();
        const password = document.getElementById("password").value.trim();

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
    });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

        if (!validateForm(registerForm)) return;

        const username = document.getElementById("login").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!username || !password) {
            alert("Заполни логин и пароль");
            return;
        }

        try {
            await registerUser(username, password);
            window.location.href = "index.html";
        } catch (error) {
            alert(error.message || "Ошибка регистрации");
        }
    });
}
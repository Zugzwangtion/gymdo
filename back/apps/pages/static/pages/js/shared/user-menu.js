/**
 * bindUserMenu - общий helper, который нужен разным страницам.
 * На вход получает: userDropdown, profileLogoutBtn, userBadge. Возвращает готовое значение или DOM-элемент, который можно использовать в любом модуле.
 * Такие функции вынесены отдельно, чтобы форматирование и мелкие DOM-операции были одинаковыми во всем проекте.
 */
function bindUserMenu(userDropdown, profileLogoutBtn, userBadge) {
    if (userBadge && currentUser?.username) {
        userBadge.textContent = currentUser.username[0].toUpperCase();

        userBadge.addEventListener("click", (event) => {
            event.stopPropagation();
            userDropdown?.classList.toggle("show");
        });
    }

    profileLogoutBtn?.addEventListener("click", async () => {
        const confirmed = confirm("Выйти из аккаунта?");
        if (!confirmed) {
            return;
        }

        try {
            await logoutUser();
            window.location.href = "/login/";
        } catch (error) {
            alert(error.message || "Не удалось выйти из аккаунта");
        }
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest("#userMenuWrap")) {
            userDropdown?.classList.remove("show");
        }
    });
}


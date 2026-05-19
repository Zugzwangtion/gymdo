async function deleteWorkout(id, dateString) {
    if (!state.isAuthenticated) {
        return;
    }

    if (!confirm(`Удалить тренировку за ${dateString}?`)) {
        return;
    }

    try {
        await deleteWorkoutById(id);
        state.workouts = state.workouts.filter((workout) => workout.id !== id);
        updateStats();
        renderCalendar();
        renderChart();
        await loadMuscleMaps();
        closeModal();
    } catch (error) {
        alert(error.message || "Ошибка удаления тренировки");
    }
}

function updateAuthenticatedHeader() {
    if (elements.loginBtn) {
        elements.loginBtn.style.display = state.isAuthenticated ? "none" : "inline-flex";
    }

    if (elements.userBadge) {
        elements.userBadge.style.display = state.isAuthenticated ? "flex" : "none";

        if (state.isAuthenticated && state.currentUser) {
            elements.userBadge.textContent = state.currentUser.username[0].toUpperCase();
        }
    }

    if (elements.pageSubtitle) {
        elements.pageSubtitle.textContent = state.isAuthenticated
            ? "Следи за прогрессом, добавляй тренировки в календарь и анализируй свои результаты."
            : "Это главная страница GymDo. Чтобы сохранять тренировки, открывать справочник и пользоваться функциями приложения, войдите в аккаунт.";
    }
}

function bindEvents() {
    elements.closeModalButton?.addEventListener("click", closeModal);
    elements.closeAuthPrompt?.addEventListener("click", closeAuthModal);

    elements.profileLogoutBtn?.addEventListener("click", async () => {
        const confirmed = confirm("Выйти из аккаунта?");
        if (!confirmed) {
            return;
        }

        try {
            await logoutUser();
            state.currentUser = null;
            state.isAuthenticated = false;
            location.href = "/login/";
        } catch (error) {
            alert(error.message || "Не удалось выйти из аккаунта");
        }
    });

    elements.guideLink?.addEventListener("click", (event) => {
        if (!state.isAuthenticated) {
            event.preventDefault();
            requireAuth("Чтобы открыть справочник, войдите в аккаунт.");
        }
    });

    elements.userBadge?.addEventListener("click", (event) => {
        event.stopPropagation();
        if (state.isAuthenticated) {
            elements.userDropdown?.classList.toggle("show");
        }
    });

    elements.prevMonth?.addEventListener("click", () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderCalendar();
    });

    elements.nextMonth?.addEventListener("click", () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderCalendar();
    });

    window.addEventListener("click", (event) => {
        if (event.target === elements.modal) {
            closeModal();
        }

        if (event.target === elements.authPromptModal) {
            closeAuthModal();
        }

        if (!event.target.closest("#userMenuWrap")) {
            elements.userDropdown?.classList.remove("show");
        }
    });
}

async function loadUserAndWorkouts() {
    try {
        state.currentUser = await getCurrentUser();
        state.isAuthenticated = Boolean(state.currentUser);
    } catch {
        state.currentUser = null;
        state.isAuthenticated = false;
    }

    if (!state.isAuthenticated) {
        state.workouts = [];
        return;
    }

    try {
        state.workouts = await getWorkouts();
    } catch (error) {
        state.workouts = [];
        alert(error.message || "Не удалось загрузить тренировки");
    }
}

async function initPage() {
    bindEvents();
    await loadUserAndWorkouts();
    updateAuthenticatedHeader();
    renderCalendar();
    updateStats();
    renderChart();
    await loadMuscleMaps();
}


initPage();

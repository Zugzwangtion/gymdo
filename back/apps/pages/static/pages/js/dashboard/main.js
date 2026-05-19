async function deleteWorkout(id, dateString) {
    if (!state.isAuthenticated) {
        return;
    }

    if (!confirm(`РЈРґР°Р»РёС‚СЊ С‚СЂРµРЅРёСЂРѕРІРєСѓ Р·Р° ${dateString}?`)) {
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
        alert(error.message || "РћС€РёР±РєР° СѓРґР°Р»РµРЅРёСЏ С‚СЂРµРЅРёСЂРѕРІРєРё");
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
            ? "РЎР»РµРґРё Р·Р° РїСЂРѕРіСЂРµСЃСЃРѕРј, РґРѕР±Р°РІР»СЏР№ С‚СЂРµРЅРёСЂРѕРІРєРё РІ РєР°Р»РµРЅРґР°СЂСЊ Рё Р°РЅР°Р»РёР·РёСЂСѓР№ СЃРІРѕРё СЂРµР·СѓР»СЊС‚Р°С‚С‹."
            : "Р­С‚Рѕ РіР»Р°РІРЅР°СЏ СЃС‚СЂР°РЅРёС†Р° GymDo. Р§С‚РѕР±С‹ СЃРѕС…СЂР°РЅСЏС‚СЊ С‚СЂРµРЅРёСЂРѕРІРєРё, РѕС‚РєСЂС‹РІР°С‚СЊ СЃРїСЂР°РІРѕС‡РЅРёРє Рё РїРѕР»СЊР·РѕРІР°С‚СЊСЃСЏ С„СѓРЅРєС†РёСЏРјРё РїСЂРёР»РѕР¶РµРЅРёСЏ, РІРѕР№РґРёС‚Рµ РІ Р°РєРєР°СѓРЅС‚.";
    }
}

function bindEvents() {
    elements.closeModalButton?.addEventListener("click", closeModal);
    elements.closeAuthPrompt?.addEventListener("click", closeAuthModal);

    elements.profileLogoutBtn?.addEventListener("click", async () => {
        const confirmed = confirm("Р’С‹Р№С‚Рё РёР· Р°РєРєР°СѓРЅС‚Р°?");
        if (!confirmed) {
            return;
        }

        try {
            await logoutUser();
            state.currentUser = null;
            state.isAuthenticated = false;
            location.href = "/login/";
        } catch (error) {
            alert(error.message || "РќРµ СѓРґР°Р»РѕСЃСЊ РІС‹Р№С‚Рё РёР· Р°РєРєР°СѓРЅС‚Р°");
        }
    });

    elements.guideLink?.addEventListener("click", (event) => {
        if (!state.isAuthenticated) {
            event.preventDefault();
            requireAuth("Р§С‚РѕР±С‹ РѕС‚РєСЂС‹С‚СЊ СЃРїСЂР°РІРѕС‡РЅРёРє, РІРѕР№РґРёС‚Рµ РІ Р°РєРєР°СѓРЅС‚.");
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
        alert(error.message || "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С‚СЂРµРЅРёСЂРѕРІРєРё");
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

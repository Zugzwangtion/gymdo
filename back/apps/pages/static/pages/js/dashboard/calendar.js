function formatDate(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function requireAuth(message = "Р§С‚РѕР±С‹ РїРѕР»СЊР·РѕРІР°С‚СЊСЃСЏ СЌС‚РѕР№ С„СѓРЅРєС†РёРµР№, РІРѕР№РґРёС‚Рµ РІ Р°РєРєР°СѓРЅС‚.") {
    if (!elements.authPromptModal || !elements.authPromptText) {
        alert(message);
        return;
    }

    elements.authPromptText.textContent = message;
    elements.authPromptModal.style.display = "flex";
}

function closeAuthModal() {
    if (elements.authPromptModal) {
        elements.authPromptModal.style.display = "none";
    }
}

function closeModal() {
    if (elements.modal) {
        elements.modal.style.display = "none";
    }
}

function openModal() {
    if (elements.modal) {
        elements.modal.style.display = "flex";
    }
}

function goToAddPage(date = "") {
    if (!state.isAuthenticated) {
        requireAuth("Р§С‚РѕР±С‹ РґРѕР±Р°РІРёС‚СЊ С‚СЂРµРЅРёСЂРѕРІРєСѓ, РІРѕР№РґРёС‚Рµ РІ Р°РєРєР°СѓРЅС‚.");
        return;
    }

    location.href = date ? `/add/?date=${date}` : "/add/";
}

function getDayWorkouts(dateString) {
    return state.workouts.filter((workout) => workout.date === dateString);
}

function createWorkoutIndicator() {
    const dot = document.createElement("span");
    dot.className = "day-indicator-dot";
    return dot;
}

function createCalendarDay(day, dateString, dayWorkouts) {
    const dayCell = document.createElement("div");
    dayCell.className = `day${dayWorkouts.length ? " workout" : ""}`;
    dayCell.textContent = String(day);

    if (dayWorkouts.length > 0) {
        const indicators = document.createElement("div");
        indicators.className = "day-indicators";
        dayWorkouts.forEach(() => indicators.appendChild(createWorkoutIndicator()));
        dayCell.appendChild(indicators);
    }

    dayCell.addEventListener("click", () => {
        if (!state.isAuthenticated) {
            requireAuth("Р§С‚РѕР±С‹ РѕС‚РєСЂС‹С‚СЊ РєР°Р»РµРЅРґР°СЂСЊ С‚СЂРµРЅРёСЂРѕРІРѕРє Рё РґРѕР±Р°РІР»СЏС‚СЊ Р·Р°РЅСЏС‚РёСЏ, РІРѕР№РґРёС‚Рµ РІ Р°РєРєР°СѓРЅС‚.");
            return;
        }

        if (dayWorkouts.length > 0) {
            showDayWorkouts(dateString, dayWorkouts);
            return;
        }

        goToAddPage(dateString);
    });

    return dayCell;
}

function renderCalendar() {
    const { calendarGrid, monthTitle } = elements;
    if (!calendarGrid || !monthTitle) {
        return;
    }

    calendarGrid.innerHTML = "";

    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    monthTitle.textContent = state.currentDate.toLocaleString("ru", {
        month: "long",
        year: "numeric"
    });

    for (let i = 0; i < offset; i += 1) {
        calendarGrid.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const dateString = formatDate(year, month + 1, day);
        const dayWorkouts = getDayWorkouts(dateString);
        calendarGrid.appendChild(createCalendarDay(day, dateString, dayWorkouts));
    }
}

function showDayWorkouts(dateString, dayWorkouts) {
    if (!elements.modalContent) {
        return;
    }

    elements.modalContent.innerHTML = "";

    const title = document.createElement("h2");
    title.textContent = `${dateString} вЂ” С‚СЂРµРЅРёСЂРѕРІРѕРє: ${dayWorkouts.length}`;
    elements.modalContent.appendChild(title);

    dayWorkouts.forEach((workout, index) => {
        const card = document.createElement("div");
        card.className = "day-workout-card";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.textContent = "РћС‚РєСЂС‹С‚СЊ";
        openButton.addEventListener("click", () => showWorkoutDetails(workout));

        card.append(
            Object.assign(document.createElement("h3"), {
                textContent: `РўСЂРµРЅРёСЂРѕРІРєР° ${index + 1}`
            }),
            createInfoParagraph(`Р”Р»РёС‚РµР»СЊРЅРѕСЃС‚СЊ: ${workout.duration ?? 0} РјРёРЅ`),
            createInfoParagraph(`РўРѕРЅРЅР°Р¶: ${workout.tonnage ?? 0}`),
            openButton
        );

        elements.modalContent.appendChild(card);
    });

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "+ Р”РѕР±Р°РІРёС‚СЊ РµС‰С‘ С‚СЂРµРЅРёСЂРѕРІРєСѓ";
    addButton.style.marginTop = "16px";
    addButton.addEventListener("click", () => goToAddPage(dateString));

    elements.modalContent.appendChild(addButton);
    openModal();
}


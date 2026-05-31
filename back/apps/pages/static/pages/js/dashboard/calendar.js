function formatDate(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function requireAuth(message = "Чтобы пользоваться этой функцией, войдите в аккаунт.") {
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
        requireAuth("Чтобы добавить тренировку, войдите в аккаунт.");
        return;
    }

    location.href = date ? `/add/?date=${date}` : "/add/";
}

function goToWorkoutPage(workoutId) {
    if (!workoutId) return;
    location.href = `/workouts/${workoutId}/`;
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
            requireAuth("Чтобы открыть календарь тренировок и добавлять занятия, войдите в аккаунт.");
            return;
        }

        if (dayWorkouts.length === 1) {
            goToWorkoutPage(dayWorkouts[0].id);
            return;
        }

        if (dayWorkouts.length > 1) {
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
    title.textContent = `${dateString} — тренировок: ${dayWorkouts.length}`;
    elements.modalContent.appendChild(title);

    dayWorkouts.forEach((workout, index) => {
        const card = document.createElement("div");
        card.className = "day-workout-card";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.textContent = "Открыть";
        openButton.addEventListener("click", () => goToWorkoutPage(workout.id));

        card.append(
            Object.assign(document.createElement("h3"), {
                textContent: `Тренировка ${index + 1}`
            }),
            createInfoParagraph(`Длительность: ${workout.duration ?? 0} мин`),
            createInfoParagraph(`Тоннаж: ${formatTonnage(workout.tonnage)}`),
            openButton
        );

        elements.modalContent.appendChild(card);
    });

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "+ Добавить ещё тренировку";
    addButton.style.marginTop = "16px";
    addButton.addEventListener("click", () => goToAddPage(dateString));

    elements.modalContent.appendChild(addButton);
    openModal();
}

function showWorkoutDetails(workout) {
    if (!elements.modalContent) {
        return;
    }

    elements.modalContent.innerHTML = "";

    const title = document.createElement("h2");
    title.textContent = workout.date || "Без даты";

    elements.modalContent.append(
        title,
        createInfoParagraph(`Длительность: ${workout.duration ?? 0} мин`),
        createInfoParagraph(`Тоннаж: ${formatTonnage(workout.tonnage)}`)
    );

    const exercises = workout.exercises || [];

    if (!exercises.length) {
        elements.modalContent.appendChild(createInfoParagraph("В этой тренировке пока нет упражнений."));
    }

    exercises.forEach((exercise) => {
        const exerciseTitle = document.createElement("h3");
        exerciseTitle.textContent = exercise.name || "Без названия";
        elements.modalContent.appendChild(exerciseTitle);

        (exercise.sets || []).forEach((set, index) => {
            const setDiv = document.createElement("div");
            setDiv.className = "workout-set";
            setDiv.textContent = `Подход ${index + 1}: ${set.weight ?? 0} кг × ${set.reps ?? 0}`;
            elements.modalContent.appendChild(setDiv);
        });
    });

    const spacer = document.createElement("br");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Удалить тренировку";
    deleteButton.addEventListener("click", () => deleteWorkout(workout.id, workout.date));

    elements.modalContent.append(spacer, deleteButton);
    openModal();
}


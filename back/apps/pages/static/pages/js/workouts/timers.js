/**
 * Форматирует количество секунд в строку таймера `HH:MM:SS`.
 * Таймеры хранят время как число секунд, а пользователю удобнее видеть нормальный формат,
 * например `00:12:35`.
 */
function formatElapsedTime(totalSeconds) {
    // hours/minutes/seconds - часы, минуты и секунды для отображения в формате 00:00:00.
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
        .map((part) => String(part).padStart(2, "0"))
        .join(":");
}

/**
 * Обновляет все таймеры на странице выполнения тренировки.
 * Считает общее время тренировки, время после завершения упражнения и время отдыха после подхода,
 * а потом записывает готовые строки в элементы интерфейса.
 */
function updateTimerDisplay() {
    if (state.timerStartedAt) {
        state.elapsedSeconds = Math.max(0, Math.floor((Date.now() - state.timerStartedAt) / 1000));
    }

    // now - текущий момент времени в миллисекундах.
    const now = Date.now();

    // exerciseSeconds - сколько прошло после завершения упражнения.
    const exerciseSeconds = state.lastExerciseFinishedAt
        ? Math.max(0, Math.floor((now - state.lastExerciseFinishedAt) / 1000))
        : 0;
    // restSeconds - сколько прошло после завершения подхода.
    const restSeconds = state.lastSetFinishedAt
        ? Math.max(0, Math.floor((now - state.lastSetFinishedAt) / 1000))
        : 0;

    if (elements.totalTimerDisplay) elements.totalTimerDisplay.textContent = formatElapsedTime(state.elapsedSeconds);
    if (elements.exerciseTimerDisplay) elements.exerciseTimerDisplay.textContent = formatElapsedTime(exerciseSeconds);
    if (elements.restTimerDisplay) elements.restTimerDisplay.textContent = formatElapsedTime(restSeconds);
}

/**
 * Запускает таймер выполнения тренировки.
 * Раз в секунду обновляется прошедшее время, время текущего упражнения и отдых.
 * id интервала сохраняется, чтобы потом его можно было остановить через `stopExecutionTimer()`.
 */
function startExecutionTimer() {
    if (!state.timerStartedAt) {
        state.timerStartedAt = Date.now() - state.elapsedSeconds * 1000;
    }

    if (!state.timerIntervalId) {
        state.timerIntervalId = window.setInterval(updateTimerDisplay, 1000);
    }

    updateTimerDisplay();
}

/**
 * Останавливает общий таймер выполнения тренировки.
 * Перед остановкой обновляет отображение, затем очищает `setInterval`, чтобы браузер больше
 * не вызывал `updateTimerDisplay()` каждую секунду.
 */
function stopExecutionTimer() {
    updateTimerDisplay();

    if (state.timerIntervalId) {
        window.clearInterval(state.timerIntervalId);
        state.timerIntervalId = null;
    }

    state.timerStartedAt = null;
}

/**
 * Возвращает длительность тренировки для сохранения.
 * Если выбран ручной режим, берется значение из поля `duration`; если режим выполнения, считается прошедшее время таймера.
 * Именно это число попадает в `payload.duration`.
 */
function getWorkoutDurationMinutes() {
    if (state.mode === "execution") {
        updateTimerDisplay();
        return Math.max(1, Math.ceil(state.elapsedSeconds / 60));
    }

    return Number(elements.durationInput?.value || 0);
}

/**
 * Переключает режим добавления тренировки.
 * В ручном режиме пользователь сам вводит длительность, а в режиме выполнения включается таймер.
 * Функция меняет видимость блоков формы и запускает/останавливает таймер при необходимости.
 */
function setWorkoutMode(mode) {
    // mode - выбранный режим: "manual" или "execution".
    state.mode = mode === "execution" ? "execution" : "manual";

    // isExecution - true, если включен режим выполнения с таймером.
    const isExecution = state.mode === "execution";

    elements.manualDurationGroup?.classList.toggle("hidden", isExecution);
    elements.executionTimerPanel?.classList.toggle("hidden", !isExecution);
    if (elements.durationInput) {
        elements.durationInput.required = !isExecution;
    }
    if (elements.submitWorkoutButton) {
        elements.submitWorkoutButton.textContent = isExecution ? "Завершить тренировку" : "Сохранить тренировку";
    }

    if (isExecution) {
        startExecutionTimer();
    } else {
        stopExecutionTimer();
        state.elapsedSeconds = 0;
        state.lastExerciseFinishedAt = null;
        state.lastSetFinishedAt = null;
        updateTimerDisplay();
    }

    renderExercises();
}

/**
 * Отмечает упражнение как завершенное в режиме выполнения.
 * По временному `exerciseId` находит упражнение в `state.exercises`, сворачивает его карточку,
 * запоминает время завершения и запускает отсчет времени после упражнения.
 */
function finishExercise(exerciseId) {
    // exerciseId - временный id упражнения на фронтенде.
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;

    exercise.isCollapsed = true;
    exercise.finishedAt = Date.now();
    state.lastExerciseFinishedAt = exercise.finishedAt;
    state.lastSetFinishedAt = null;
    updateTimerDisplay();
    renderExercises();
}

/**
 * Снова раскрывает завершенное упражнение.
 * Используется, если пользователь нажал на свернутую карточку и хочет посмотреть или изменить подходы.
 */
function reopenExercise(exerciseId) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;

    exercise.isCollapsed = false;
    renderExercises();
}

/**
 * Отмечает конкретный подход как завершенный.
 * По `exerciseId` и `setId` находит подход, ставит ему `completedAt`,
 * обновляет таймер отдыха и перерисовывает карточки.
 */
function finishSet(exerciseId, setId) {
    // exerciseId - id упражнения, setId - id подхода.
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    const set = exercise?.sets.find((item) => item.id === setId);
    if (!set) return;

    set.completedAt = Date.now();
    state.lastSetFinishedAt = set.completedAt;
    updateTimerDisplay();
    renderExercises();
}

// Словарь терминов в этом файле:
// timer - таймер.
// elapsed - прошедшее время.
// totalSeconds - общее количество секунд.
// execution - режим выполнения тренировки с таймером.
// manual - ручной режим, когда длительность вводится самому.
// finishedAt/completedAt - время завершения, хранится как Date.now().

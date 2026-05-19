function formatElapsedTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
        .map((part) => String(part).padStart(2, "0"))
        .join(":");
}

function updateTimerDisplay() {
    if (state.timerStartedAt) {
        state.elapsedSeconds = Math.max(0, Math.floor((Date.now() - state.timerStartedAt) / 1000));
    }

    const now = Date.now();
    const exerciseSeconds = state.lastExerciseFinishedAt
        ? Math.max(0, Math.floor((now - state.lastExerciseFinishedAt) / 1000))
        : 0;
    const restSeconds = state.lastSetFinishedAt
        ? Math.max(0, Math.floor((now - state.lastSetFinishedAt) / 1000))
        : 0;

    if (elements.totalTimerDisplay) elements.totalTimerDisplay.textContent = formatElapsedTime(state.elapsedSeconds);
    if (elements.exerciseTimerDisplay) elements.exerciseTimerDisplay.textContent = formatElapsedTime(exerciseSeconds);
    if (elements.restTimerDisplay) elements.restTimerDisplay.textContent = formatElapsedTime(restSeconds);
}

function startExecutionTimer() {
    if (!state.timerStartedAt) {
        state.timerStartedAt = Date.now() - state.elapsedSeconds * 1000;
    }

    if (!state.timerIntervalId) {
        state.timerIntervalId = window.setInterval(updateTimerDisplay, 1000);
    }

    updateTimerDisplay();
}

function stopExecutionTimer() {
    updateTimerDisplay();

    if (state.timerIntervalId) {
        window.clearInterval(state.timerIntervalId);
        state.timerIntervalId = null;
    }

    state.timerStartedAt = null;
}

function getWorkoutDurationMinutes() {
    if (state.mode === "execution") {
        updateTimerDisplay();
        return Math.max(1, Math.ceil(state.elapsedSeconds / 60));
    }

    return Number(elements.durationInput?.value || 0);
}

function setWorkoutMode(mode) {
    state.mode = mode === "execution" ? "execution" : "manual";
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

function finishExercise(exerciseId) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;

    exercise.isCollapsed = true;
    exercise.finishedAt = Date.now();
    state.lastExerciseFinishedAt = exercise.finishedAt;
    state.lastSetFinishedAt = null;
    updateTimerDisplay();
    renderExercises();
}

function reopenExercise(exerciseId) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;

    exercise.isCollapsed = false;
    renderExercises();
}

function finishSet(exerciseId, setId) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    const set = exercise?.sets.find((item) => item.id === setId);
    if (!set) return;

    set.completedAt = Date.now();
    state.lastSetFinishedAt = set.completedAt;
    updateTimerDisplay();
    renderExercises();
}


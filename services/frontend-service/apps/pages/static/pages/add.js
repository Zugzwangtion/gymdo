let currentUser = null;

const effortOptions = [
    { value: "", label: "Не выбрано", tone: "neutral" },
    { value: "warmup", label: "Размин.", tone: "warmup" },
    { value: "low", label: "Низкое", tone: "low" },
    { value: "medium", label: "Среднее", tone: "medium" },
    { value: "high", label: "Высокое", tone: "high" },
    { value: "max", label: "Максим.", tone: "max" }
];

const state = {
    exercises: [],
    workouts: [],
    expandedCategories: new Set(),
    editing: null,
    mode: "manual",
    timerStartedAt: null,
    lastExerciseFinishedAt: null,
    lastSetFinishedAt: null,
    elapsedSeconds: 0,
    timerIntervalId: null
};

const elements = {
    exercisesContainer: document.getElementById("exercisesContainer"),
    workoutForm: document.getElementById("workoutForm"),
    dateInput: document.getElementById("date"),
    durationInput: document.getElementById("duration"),
    modeInputs: document.querySelectorAll('input[name="workoutMode"]'),
    manualDurationGroup: document.getElementById("manualDurationGroup"),
    executionTimerPanel: document.getElementById("executionTimerPanel"),
    totalTimerDisplay: document.getElementById("totalTimerDisplay"),
    exerciseTimerDisplay: document.getElementById("exerciseTimerDisplay"),
    restTimerDisplay: document.getElementById("restTimerDisplay"),
    submitWorkoutButton: document.getElementById("submitWorkoutButton"),
    openExercisePickerBtn: document.getElementById("openExercisePickerBtn"),
    exercisePickerModal: document.getElementById("exercisePickerModal"),
    exercisePickerBody: document.getElementById("exercisePickerBody"),
    pickerTitle: document.getElementById("pickerTitle"),
    pickerSubtitle: document.getElementById("pickerSubtitle"),
    closeExercisePickerBtn: document.getElementById("closeExercisePicker"),
    emptyExercisesState: document.getElementById("emptyExercisesState")
};

function goBack() {
    window.location.href = "/";
}

function generateId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getExercisesGroupedSafe() {
    if (typeof getExercisesGroupedByCategory === "function") {
        return getExercisesGroupedByCategory();
    }

    const grouped = {};
    if (typeof exercisesDatabase !== "object" || !exercisesDatabase) return grouped;

    Object.entries(exercisesDatabase).forEach(([name, exercise]) => {
        const category = exercise?.category || "Без категории";
        grouped[category] = grouped[category] || [];
        grouped[category].push(name);
    });

    return grouped;
}

function getExerciseByNameSafe(name) {
    if (typeof getExerciseByName === "function") return getExerciseByName(name);
    if (typeof exercisesDatabase !== "object" || !exercisesDatabase) return null;
    return exercisesDatabase[name] || null;
}

function setDefaultDate() {
    if (!elements.dateInput) return;

    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    if (dateParam) {
        elements.dateInput.value = dateParam;
        return;
    }

    const today = new Date();
    elements.dateInput.value = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");
}

function parseWorkoutDate(dateString) {
    if (!dateString) return null;
    const date = new Date(`${dateString}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getPreviousExercise(exerciseName) {
    const currentDate = parseWorkoutDate(elements.dateInput?.value);
    const sorted = [...state.workouts].sort((a, b) => {
        return parseWorkoutDate(b.date) - parseWorkoutDate(a.date);
    });

    for (const workout of sorted) {
        const workoutDate = parseWorkoutDate(workout.date);
        if (currentDate && workoutDate && workoutDate >= currentDate) continue;

        const match = (workout.exercises || []).find((exercise) => exercise.name === exerciseName);
        if (match) {
            return { workout, exercise: match };
        }
    }

    return null;
}

function getPreviousSet(exercise, index) {
    return exercise.previous?.exercise?.sets?.[index] || null;
}

function formatNumber(value) {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) return "0";
    return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(2)));
}

function formatWeight(value) {
    return formatNumber(value);
}

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

function getDelta(current, previous) {
    const a = Number(current || 0);
    const b = Number(previous || 0);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !a || !b) return null;
    const delta = Number((a - b).toFixed(2));
    return delta === 0 ? null : delta;
}

function createDeltaBadge(delta) {
    if (delta == null) return document.createTextNode("");
    const badge = document.createElement("span");
    badge.className = `set-delta ${delta > 0 ? "positive" : "negative"}`;
    badge.textContent = `${delta > 0 ? "+" : ""}${formatNumber(delta)}`;
    return badge;
}

function getEffortConfig(value) {
    return effortOptions.find((option) => option.value === value) || effortOptions[0];
}

function updateEmptyState() {
    if (elements.emptyExercisesState) {
        elements.emptyExercisesState.style.display = state.exercises.length > 0 ? "none" : "flex";
    }
}

function openExercisePicker() {
    if (!elements.exercisePickerModal) return;
    renderExercisePicker();
    elements.exercisePickerModal.style.display = "flex";
}

function closeExercisePicker() {
    if (elements.exercisePickerModal) {
        elements.exercisePickerModal.style.display = "none";
    }
}

function toggleCategory(categoryName) {
    if (state.expandedCategories.has(categoryName)) {
        state.expandedCategories.delete(categoryName);
    } else {
        state.expandedCategories.add(categoryName);
    }
    renderExercisePicker();
}

function createCategoryBlock(categoryName, exercises) {
    const groupBlock = document.createElement("div");
    groupBlock.className = "picker-group-card";

    const isOpen = state.expandedCategories.has(categoryName);
    const headerBtn = document.createElement("button");
    headerBtn.type = "button";
    headerBtn.className = `picker-group-toggle${isOpen ? " open" : ""}`;

    const groupName = document.createElement("span");
    groupName.textContent = categoryName;

    const arrow = document.createElement("span");
    arrow.className = "picker-group-arrow";
    arrow.textContent = "⌄";

    headerBtn.append(groupName, arrow);
    headerBtn.addEventListener("click", () => toggleCategory(categoryName));

    const exercisesList = document.createElement("div");
    exercisesList.className = "picker-exercises-list";
    exercisesList.style.display = isOpen ? "block" : "none";

    exercises.slice().sort((a, b) => a.localeCompare(b, "ru")).forEach((exerciseName) => {
        const exerciseBtn = document.createElement("button");
        exerciseBtn.type = "button";
        exerciseBtn.className = "picker-exercise-btn";
        exerciseBtn.textContent = exerciseName;
        exerciseBtn.addEventListener("click", () => {
            addExercise(exerciseName);
            closeExercisePicker();
        });
        exercisesList.appendChild(exerciseBtn);
    });

    groupBlock.append(headerBtn, exercisesList);
    return groupBlock;
}

function renderExercisePicker() {
    if (!elements.exercisePickerBody || !elements.pickerTitle || !elements.pickerSubtitle) return;

    elements.pickerTitle.textContent = "Выбери группу мышц";
    elements.pickerSubtitle.textContent = "Нажми на категорию, чтобы раскрыть упражнения.";
    elements.exercisePickerBody.innerHTML = "";

    Object.entries(getExercisesGroupedSafe())
        .sort(([a], [b]) => a.localeCompare(b, "ru"))
        .forEach(([categoryName, exercises]) => {
            elements.exercisePickerBody.appendChild(createCategoryBlock(categoryName, exercises));
        });
}

function createDefaultSet(values = {}) {
    return {
        id: generateId(),
        reps: values.reps ?? "",
        weight: values.weight ?? "",
        effort: values.effort ?? ""
    };
}

function createSetsFromPrevious(previous) {
    const previousSets = previous?.exercise?.sets || [];
    if (!previousSets.length) return [createDefaultSet()];
    return previousSets.map(() => createDefaultSet());
}

function addExercise(exerciseName) {
    const exerciseData = getExerciseByNameSafe(exerciseName);
    const previous = getPreviousExercise(exerciseName);

    state.exercises.push({
        id: generateId(),
        name: exerciseName,
        category: exerciseData?.category || "Упражнение",
        image: exerciseData?.image || "",
        previous,
        sets: createSetsFromPrevious(previous)
    });

    renderExercises();
}

function removeExercise(exerciseId) {
    state.exercises = state.exercises.filter((exercise) => exercise.id !== exerciseId);
    renderExercises();
}

function addSet(exerciseId) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;
    exercise.sets.push(createDefaultSet());
    renderExercises();
}

function removeSet(exerciseId, setId) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;

    if (exercise.sets.length === 1) {
        exercise.sets = [createDefaultSet()];
    } else {
        exercise.sets = exercise.sets.filter((set) => set.id !== setId);
    }

    renderExercises();
}

function updateSetValue(exerciseId, setId, field, value) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    const set = exercise?.sets.find((item) => item.id === setId);
    if (!set) return;
    set[field] = value;
}

function oldCreateValueCell(currentValue, previousValue, delta) {
    const cell = document.createElement("div");
    cell.className = currentValue === "" || currentValue == null ? "set-value muted" : "set-value";

    const main = document.createElement("span");
    main.textContent = currentValue === "" || currentValue == null
        ? formatNumber(previousValue || 0)
        : formatNumber(currentValue);

    cell.append(main, createDeltaBadge(delta));
    return cell;
}

function oldOpenSetEditor(exerciseId, setId) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    const setIndex = exercise?.sets.findIndex((item) => item.id === setId) ?? -1;
    if (!exercise || setIndex < 0) return;

    state.editing = { exerciseId, setId };
    renderSetEditor(exercise, exercise.sets[setIndex], setIndex);
}

function stepSetValue(exerciseId, setId, field, delta) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    const set = exercise?.sets.find((item) => item.id === setId);
    if (!set) return;

    const current = Number(set[field] || 0);
    const nextValue = Math.max(0, Number((current + delta).toFixed(2)));
    set[field] = nextValue === 0 ? "" : String(nextValue);
    renderExercises();
}

function createInlineStepper(exercise, set, field, previousValue, step) {
    const wrap = document.createElement("div");
    wrap.className = "inline-set-stepper";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.className = "inline-step-button";
    minus.textContent = "-";
    minus.addEventListener("click", () => stepSetValue(exercise.id, set.id, field, -step));

    const inputWrap = document.createElement("label");
    inputWrap.className = set[field] === "" || set[field] == null ? "inline-set-value muted" : "inline-set-value";

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = String(step);
    input.value = set[field];
    input.placeholder = previousValue ? formatNumber(previousValue) : "0";
    input.addEventListener("input", (event) => {
        updateSetValue(exercise.id, set.id, field, event.target.value);
        inputWrap.classList.toggle("muted", !event.target.value);
    });
    input.addEventListener("change", renderExercises);

    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "inline-step-button";
    plus.textContent = "+";
    plus.addEventListener("click", () => stepSetValue(exercise.id, set.id, field, step));

    inputWrap.append(minus, input, createDeltaBadge(getDelta(set[field], previousValue)), plus);
    wrap.append(inputWrap);
    return wrap;
}

function createSetBadge(set, index) {
    const effort = getEffortConfig(set.effort);
    const badge = document.createElement("div");
    badge.className = "set-badge";
    badge.textContent = String(index + 1);
    badge.title = effort.label;
    return badge;
}

function createEffortStrip(exercise, set) {
    const strip = document.createElement("div");
    strip.className = "effort-strip";

    effortOptions.slice(1).forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `effort-strip-segment effort-${option.tone}${set.effort === option.value ? " active" : ""}`;
        button.title = option.label;
        button.setAttribute("aria-label", option.label);
        button.addEventListener("click", () => {
            updateSetValue(exercise.id, set.id, "effort", set.effort === option.value ? "" : option.value);
            renderExercises();
        });
        strip.appendChild(button);
    });

    return strip;
}

function createSetRow(exercise, set, index) {
    const previousSet = getPreviousSet(exercise, index);
    const row = document.createElement("div");
    row.className = `set-row live-set-row${set.completedAt ? " completed" : ""}`;

    const badge = createSetBadge(set, index);
    const weightCell = createInlineStepper(exercise, set, "weight", previousSet?.weight, 0.5);
    const repsCell = createInlineStepper(exercise, set, "reps", previousSet?.reps, 1);
    const effortStrip = createEffortStrip(exercise, set);

    const setActions = document.createElement("div");
    setActions.className = "set-row-actions";

    const doneButton = document.createElement("button");
    doneButton.type = "button";
    doneButton.className = "finish-set-button";
    doneButton.textContent = "✓";
    doneButton.title = "Завершить подход";
    doneButton.addEventListener("click", () => finishSet(exercise.id, set.id));

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "remove-set-inline";
    editButton.textContent = "×";
    editButton.title = "Удалить подход";
    editButton.addEventListener("click", () => removeSet(exercise.id, set.id));

    if (state.mode === "execution") {
        setActions.append(doneButton);
    }
    setActions.append(editButton);
    row.append(badge, weightCell, repsCell, setActions, effortStrip);
    return row;
}

function calculateExerciseStats(exercise) {
    const sets = exercise.sets.filter((set) => Number(set.weight || 0) > 0 || Number(set.reps || 0) > 0);
    const tonnage = sets.reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0);
    const reps = sets.reduce((sum, set) => sum + Number(set.reps || 0), 0);
    const previousSets = exercise.previous?.exercise?.sets || [];
    const previousTonnage = previousSets.reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0);

    return { sets: sets.length, totalSets: exercise.sets.length, tonnage, reps, previousTonnage };
}

function createExerciseCard(exercise) {
    const card = document.createElement("div");
    card.className = "exercise-card tracking-exercise-card";

    const header = document.createElement("div");
    header.className = "tracking-exercise-header";

    const image = document.createElement("div");
    image.className = "exercise-thumb";
    if (exercise.image) image.style.backgroundImage = `url("${exercise.image}")`;

    const titleWrap = document.createElement("div");
    titleWrap.className = "tracking-title-wrap";

    const title = document.createElement("h3");
    title.textContent = exercise.name;

    const subtitle = document.createElement("p");
    subtitle.textContent = exercise.previous?.workout?.date
        ? `Предыдущая: ${exercise.previous.workout.date}`
        : "Раньше не выполнялось";

    titleWrap.append(title, subtitle);

    const removeExerciseButton = document.createElement("button");
    removeExerciseButton.type = "button";
    removeExerciseButton.className = "remove-exercise-button compact";
    removeExerciseButton.textContent = "⋮";
    removeExerciseButton.title = "Удалить упражнение";
    removeExerciseButton.addEventListener("click", (event) => {
        event.stopPropagation();
        removeExercise(exercise.id);
    });

    header.append(image, titleWrap, removeExerciseButton);

    if (exercise.isCollapsed) {
        card.classList.add("collapsed-exercise-card");
        header.addEventListener("click", () => reopenExercise(exercise.id));
        card.append(header);
        return card;
    }

    const setsTitle = document.createElement("div");
    setsTitle.className = "sets-title";
    setsTitle.textContent = "Подходы";

    const setsHeader = document.createElement("div");
    setsHeader.className = "setsHeader tracking-sets-header";
    setsHeader.innerHTML = `
        <span>№</span>
        <span>Вес, кг</span>
        <span>Повторения</span>
        <span></span>
    `;

    const setsContainer = document.createElement("div");
    setsContainer.className = "setsContainer tracking-sets-container";
    exercise.sets.forEach((set, index) => {
        setsContainer.appendChild(createSetRow(exercise, set, index));
    });

    const stats = calculateExerciseStats(exercise);
    const statsBlock = document.createElement("div");
    statsBlock.className = "exercise-live-stats";
    statsBlock.innerHTML = `
        <span>${formatWeight(stats.tonnage / 1000)} т • ${stats.sets} / ${stats.totalSets} • ${stats.reps}</span>
        <span class="${stats.previousTonnage ? "muted-red" : ""}">${stats.previousTonnage ? `${formatWeight(stats.previousTonnage / 1000)} т пред.` : "нет истории"}</span>
    `;

    const actions = document.createElement("div");
    actions.className = "tracking-actions";

    const finishExerciseButton = document.createElement("button");
    finishExerciseButton.type = "button";
    finishExerciseButton.className = "finish-exercise-button";
    finishExerciseButton.textContent = "Завершить упражнение";
    finishExerciseButton.addEventListener("click", () => finishExercise(exercise.id));

    const addSetButton = document.createElement("button");
    addSetButton.type = "button";
    addSetButton.className = "add-set-button compact-add-set";
    addSetButton.textContent = "+";
    addSetButton.title = "Добавить подход";
    addSetButton.addEventListener("click", () => addSet(exercise.id));

    if (state.mode === "execution") {
        actions.append(finishExerciseButton);
    }
    actions.append(addSetButton);
    card.append(header, setsTitle, setsHeader, setsContainer, statsBlock, actions);
    return card;
}

function renderExercises() {
    if (!elements.exercisesContainer) return;
    elements.exercisesContainer.innerHTML = "";
    state.exercises.forEach((exercise) => {
        elements.exercisesContainer.appendChild(createExerciseCard(exercise));
    });
    updateEmptyState();
}

function normalizeSetValue(value) {
    if (value === "" || value == null) return 0;
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function collectExercisesPayload() {
    return state.exercises
        .map((exercise) => {
            const sets = exercise.sets
                .map((set, index) => ({
                    reps: normalizeSetValue(set.reps),
                    weight: normalizeSetValue(set.weight),
                    effort: set.effort || "",
                    sort_order: index
                }))
                .filter((set) => set.reps > 0 || set.weight > 0);

            return { name: exercise.name, sets };
        })
        .filter((exercise) => exercise.sets.length > 0);
}

function calculateTonnage(exercises) {
    return exercises.reduce((total, exercise) => {
        return total + exercise.sets.reduce((sum, set) => {
            return sum + Number(set.reps || 0) * Number(set.weight || 0);
        }, 0);
    }, 0);
}

function validateWorkoutForm() {
    if (!elements.workoutForm?.checkValidity()) {
        elements.workoutForm?.reportValidity();
        return false;
    }

    if (!collectExercisesPayload().length) {
        alert("Добавь хотя бы одно упражнение и заполни хотя бы один подход.");
        return false;
    }

    return true;
}

function createEditorIfNeeded() {
    let editor = document.getElementById("setEditorModal");
    if (editor) return editor;

    editor = document.createElement("div");
    editor.id = "setEditorModal";
    editor.className = "set-editor-modal";
    document.body.appendChild(editor);
    return editor;
}

function closeSetEditor() {
    const editor = document.getElementById("setEditorModal");
    if (editor) editor.style.display = "none";
    state.editing = null;
}

function stepNumber(value, delta, min = 0) {
    const current = Number(value || 0);
    return Math.max(min, Number((current + delta).toFixed(2)));
}

function renderSetEditor(exercise, set, index) {
    const previousSet = getPreviousSet(exercise, index);
    const editor = createEditorIfNeeded();
    editor.innerHTML = "";
    editor.style.display = "flex";

    const panel = document.createElement("div");
    panel.className = "set-editor-panel";

    const header = document.createElement("div");
    header.className = "set-editor-header";

    const titleBlock = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = `Подход ${index + 1}`;
    const subtitle = document.createElement("p");
    subtitle.textContent = exercise.name;
    titleBlock.append(title, subtitle);

    const doneButton = document.createElement("button");
    doneButton.type = "button";
    doneButton.className = "set-editor-done";
    doneButton.textContent = "✓";
    doneButton.addEventListener("click", closeSetEditor);
    header.append(titleBlock, doneButton);

    const makeStepper = (label, field, step, fullText = "") => {
        const section = document.createElement("section");
        section.className = "set-editor-section";

        const sectionLabel = document.createElement("div");
        sectionLabel.className = "set-editor-label";
        sectionLabel.textContent = label;

        const controls = document.createElement("div");
        controls.className = "stepper";

        const minus = document.createElement("button");
        minus.type = "button";
        minus.textContent = "−";

        const value = document.createElement("input");
        value.type = "number";
        value.min = "0";
        value.step = String(step);
        value.value = set[field] || "";
        value.placeholder = previousSet?.[field] ? formatNumber(previousSet[field]) : "0";

        const plus = document.createElement("button");
        plus.type = "button";
        plus.textContent = "+";

        const sync = (newValue) => {
            updateSetValue(exercise.id, set.id, field, newValue === "" ? "" : String(newValue));
            renderExercises();
            renderSetEditor(exercise, set, index);
        };

        minus.addEventListener("click", () => sync(stepNumber(set[field], -step)));
        plus.addEventListener("click", () => sync(stepNumber(set[field], step)));
        value.addEventListener("input", (event) => {
            updateSetValue(exercise.id, set.id, field, event.target.value);
            renderExercises();
        });

        controls.append(minus, value, plus);
        section.append(sectionLabel, controls);

        if (fullText) {
            const hint = document.createElement("p");
            hint.className = "set-editor-hint";
            hint.textContent = fullText;
            section.appendChild(hint);
        }

        return section;
    };

    const effortSection = document.createElement("section");
    effortSection.className = "set-editor-section";

    const effortLabel = document.createElement("div");
    effortLabel.className = "set-editor-label";
    effortLabel.textContent = "Усилие";

    const effortGrid = document.createElement("div");
    effortGrid.className = "effort-grid";
    effortOptions.slice(1).forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `effort-choice effort-${option.tone}${set.effort === option.value ? " active" : ""}`;
        button.textContent = option.label;
        button.addEventListener("click", () => {
            updateSetValue(exercise.id, set.id, "effort", option.value);
            renderExercises();
            renderSetEditor(exercise, set, index);
        });
        effortGrid.appendChild(button);
    });
    effortSection.append(effortLabel, effortGrid);

    const stats = document.createElement("section");
    stats.className = "set-editor-section editor-stats";
    const tonnage = Number(set.weight || 0) * Number(set.reps || 0);
    stats.innerHTML = `<strong>Статистика</strong><span>Тоннаж: ${formatWeight(tonnage / 1000)} т</span>`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "editor-remove-set";
    removeButton.textContent = "Удалить подход";
    removeButton.addEventListener("click", () => {
        removeSet(exercise.id, set.id);
        closeSetEditor();
    });

    panel.append(
        header,
        makeStepper("Вес, кг", "weight", 0.5, previousSet?.weight ? `Прошлый вес: ${formatWeight(previousSet.weight)} кг` : ""),
        makeStepper("Повторения", "reps", 1, previousSet?.reps ? `Прошлые повторы: ${formatNumber(previousSet.reps)}` : ""),
        effortSection,
        stats,
        removeButton
    );

    editor.appendChild(panel);
    editor.addEventListener("click", (event) => {
        if (event.target === editor) closeSetEditor();
    }, { once: true });
}

async function handleSubmit(event) {
    event.preventDefault();
    if (!validateWorkoutForm()) return;

    const exercises = collectExercisesPayload();
    const payload = {
        date: elements.dateInput.value,
        duration: getWorkoutDurationMinutes(),
        tonnage: calculateTonnage(exercises),
        exercises
    };

    try {
        if (state.mode === "execution") {
            stopExecutionTimer();
        }
        await createWorkout(payload);
        alert("Тренировка сохранена");
        window.location.href = "/";
    } catch (error) {
        if (state.mode === "execution") {
            startExecutionTimer();
        }
        alert(error.message || "Ошибка сохранения тренировки");
    }
}

function bindEvents() {
    elements.modeInputs?.forEach((input) => {
        input.addEventListener("change", (event) => {
            if (event.target.checked) setWorkoutMode(event.target.value);
        });
    });
    elements.openExercisePickerBtn?.addEventListener("click", openExercisePicker);
    elements.closeExercisePickerBtn?.addEventListener("click", closeExercisePicker);
    elements.workoutForm?.addEventListener("submit", handleSubmit);
    elements.dateInput?.addEventListener("change", () => {
        state.exercises.forEach((exercise) => {
            exercise.previous = getPreviousExercise(exercise.name);
            if (!exercise.sets.length) exercise.sets = createSetsFromPrevious(exercise.previous);
        });
        renderExercises();
    });

    elements.exercisePickerModal?.addEventListener("click", (event) => {
        if (event.target === elements.exercisePickerModal) closeExercisePicker();
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeExercisePicker();
            closeSetEditor();
        }
    });
    window.addEventListener("beforeunload", stopExecutionTimer);
}

async function initAddPage() {
    try {
        currentUser = await getCurrentUser();
        if (!currentUser) {
            window.location.href = "/login/";
            return;
        }
    } catch {
        window.location.href = "/login/";
        return;
    }

    setDefaultDate();

    try {
        state.workouts = await getWorkouts();
    } catch {
        state.workouts = [];
    }

    bindEvents();
    setWorkoutMode("manual");
    renderExercises();
    updateEmptyState();
}

initAddPage();

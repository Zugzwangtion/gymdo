let currentUser = null;

const state = {
    exercises: [],
    expandedCategories: new Set()
};

const elements = {
    exercisesContainer: document.getElementById("exercisesContainer"),
    workoutForm: document.getElementById("workoutForm"),
    dateInput: document.getElementById("date"),
    durationInput: document.getElementById("duration"),
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

    if (typeof exercisesDatabase !== "object" || !exercisesDatabase) {
        return grouped;
    }

    Object.entries(exercisesDatabase).forEach(([name, exercise]) => {
        const category = exercise?.category || "Без категории";

        if (!grouped[category]) {
            grouped[category] = [];
        }

        grouped[category].push(name);
    });

    return grouped;
}

function getExerciseByNameSafe(name) {
    if (typeof getExerciseByName === "function") {
        return getExerciseByName(name);
    }

    if (typeof exercisesDatabase !== "object" || !exercisesDatabase) {
        return null;
    }

    return exercisesDatabase[name] || null;
}

function setDefaultDate() {
    if (!elements.dateInput) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");

    if (dateParam) {
        elements.dateInput.value = dateParam;
        return;
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    elements.dateInput.value = `${yyyy}-${mm}-${dd}`;
}

function updateEmptyState() {
    if (!elements.emptyExercisesState) {
        return;
    }

    elements.emptyExercisesState.style.display = state.exercises.length > 0 ? "none" : "flex";
}

function openExercisePicker() {
    if (!elements.exercisePickerModal) {
        return;
    }

    renderExercisePicker();
    elements.exercisePickerModal.style.display = "flex";
}

function closeExercisePicker() {
    if (!elements.exercisePickerModal) {
        return;
    }

    elements.exercisePickerModal.style.display = "none";
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

    const exercisesList = document.createElement("div");
    exercisesList.className = "picker-exercises-list";
    exercisesList.style.display = isOpen ? "block" : "none";

    exercises
        .slice()
        .sort((a, b) => a.localeCompare(b, "ru"))
        .forEach((exerciseName) => {
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

    headerBtn.addEventListener("click", () => {
        toggleCategory(categoryName);
    });

    groupBlock.append(headerBtn, exercisesList);
    return groupBlock;
}

function renderExercisePicker() {
    if (!elements.exercisePickerBody || !elements.pickerTitle || !elements.pickerSubtitle) {
        return;
    }

    const grouped = getExercisesGroupedSafe();

    elements.pickerTitle.textContent = "Выбери группу мышц";
    elements.pickerSubtitle.textContent = "Нажми на категорию, чтобы раскрыть упражнения.";
    elements.exercisePickerBody.innerHTML = "";

    Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b, "ru"))
        .forEach(([categoryName, exercises]) => {
            const block = createCategoryBlock(categoryName, exercises);
            elements.exercisePickerBody.appendChild(block);
        });
}

function createDefaultSet(values = {}) {
    return {
        id: generateId(),
        reps: values.reps ?? "",
        weight: values.weight ?? ""
    };
}

function addExercise(exerciseName) {
    const exerciseData = getExerciseByNameSafe(exerciseName);

    state.exercises.push({
        id: generateId(),
        name: exerciseName,
        category: exerciseData?.category || "Упражнение",
        sets: [createDefaultSet()]
    });

    renderExercises();
}

function removeExercise(exerciseId) {
    state.exercises = state.exercises.filter((exercise) => exercise.id !== exerciseId);
    renderExercises();
}

function addSet(exerciseId) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise) {
        return;
    }

    const previousSet = exercise.sets[exercise.sets.length - 1];

    exercise.sets.push(
        createDefaultSet({
            reps: previousSet?.reps ?? "",
            weight: previousSet?.weight ?? ""
        })
    );

    renderExercises();
}

function removeSet(exerciseId, setId) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise) {
        return;
    }

    if (exercise.sets.length === 1) {
        exercise.sets = [createDefaultSet()];
        renderExercises();
        return;
    }

    exercise.sets = exercise.sets.filter((set) => set.id !== setId);
    renderExercises();
}

function updateSetValue(exerciseId, setId, field, value) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise) {
        return;
    }

    const set = exercise.sets.find((item) => item.id === setId);
    if (!set) {
        return;
    }

    set[field] = value;
}

function createSetRow(exerciseId, set, index) {
    const row = document.createElement("div");
    row.className = "set-row";

    const badge = document.createElement("div");
    badge.className = "set-badge";
    badge.textContent = String(index + 1);

    const repsInput = document.createElement("input");
    repsInput.type = "number";
    repsInput.min = "0";
    repsInput.step = "1";
    repsInput.placeholder = "Повторения";
    repsInput.className = "reps";
    repsInput.value = set.reps;
    repsInput.addEventListener("input", (event) => {
        updateSetValue(exerciseId, set.id, "reps", event.target.value);
    });

    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.min = "0";
    weightInput.step = "0.25";
    weightInput.placeholder = "Вес, кг";
    weightInput.className = "weight";
    weightInput.value = set.weight;
    weightInput.addEventListener("input", (event) => {
        updateSetValue(exerciseId, set.id, "weight", event.target.value);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-set-button";
    removeButton.textContent = "✖";
    removeButton.addEventListener("click", () => {
        removeSet(exerciseId, set.id);
    });

    row.append(badge, repsInput, weightInput, removeButton);
    return row;
}

function createExerciseCard(exercise) {
    const card = document.createElement("div");
    card.className = "exercise-card";

    const header = document.createElement("div");
    header.className = "exercise-card-header";

    const titleWrap = document.createElement("div");

    const kicker = document.createElement("p");
    kicker.className = "exercise-card-kicker";
    kicker.textContent = exercise.category;

    const title = document.createElement("h3");
    title.textContent = exercise.name;

    titleWrap.append(kicker, title);

    const removeExerciseButton = document.createElement("button");
    removeExerciseButton.type = "button";
    removeExerciseButton.className = "remove-exercise-button";
    removeExerciseButton.textContent = "Удалить";
    removeExerciseButton.addEventListener("click", () => {
        removeExercise(exercise.id);
    });

    header.append(titleWrap, removeExerciseButton);

    const setsHeader = document.createElement("div");
    setsHeader.className = "setsHeader";
    setsHeader.innerHTML = `
        <span>#</span>
        <span>Повторения</span>
        <span>Вес (кг)</span>
        <span></span>
    `;

    const setsContainer = document.createElement("div");
    setsContainer.className = "setsContainer";

    exercise.sets.forEach((set, index) => {
        setsContainer.appendChild(createSetRow(exercise.id, set, index));
    });

    const addSetButton = document.createElement("button");
    addSetButton.type = "button";
    addSetButton.className = "add-set-button";
    addSetButton.textContent = "+ Добавить подход";
    addSetButton.addEventListener("click", () => {
        addSet(exercise.id);
    });

    card.append(header, setsHeader, setsContainer, addSetButton);
    return card;
}

function renderExercises() {
    if (!elements.exercisesContainer) {
        return;
    }

    elements.exercisesContainer.innerHTML = "";

    state.exercises.forEach((exercise) => {
        elements.exercisesContainer.appendChild(createExerciseCard(exercise));
    });

    updateEmptyState();
}

function normalizeSetValue(value) {
    if (value === "" || value == null) {
        return 0;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function collectExercisesPayload() {
    return state.exercises
        .map((exercise) => {
            const sets = exercise.sets
                .map((set) => ({
                    reps: normalizeSetValue(set.reps),
                    weight: normalizeSetValue(set.weight)
                }))
                .filter((set) => set.reps > 0 || set.weight > 0);

            return {
                name: exercise.name,
                sets
            };
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

    const exercises = collectExercisesPayload();

    if (!exercises.length) {
        alert("Добавь хотя бы одно упражнение и заполни хотя бы один подход.");
        return false;
    }

    return true;
}

async function handleSubmit(event) {
    event.preventDefault();

    if (!validateWorkoutForm()) {
        return;
    }

    const exercises = collectExercisesPayload();

    const payload = {
        date: elements.dateInput.value,
        duration: Number(elements.durationInput.value),
        tonnage: calculateTonnage(exercises),
        exercises
    };

    try {
        await createWorkout(payload);
        alert("Тренировка сохранена");
        window.location.href = "/";
    } catch (error) {
        alert(error.message || "Ошибка сохранения тренировки");
    }
}

function bindEvents() {
    elements.openExercisePickerBtn?.addEventListener("click", openExercisePicker);
    elements.closeExercisePickerBtn?.addEventListener("click", closeExercisePicker);
    elements.workoutForm?.addEventListener("submit", handleSubmit);

    elements.exercisePickerModal?.addEventListener("click", (event) => {
        if (event.target === elements.exercisePickerModal) {
            closeExercisePicker();
        }
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeExercisePicker();
        }
    });
}

async function initAddPage() {
    try {
        currentUser = await getCurrentUser();

        if (!currentUser) {
            window.location.href = "/login/";
            return;
        }
    } catch (error) {
        window.location.href = "/login/";
        return;
    }

    setDefaultDate();
    bindEvents();
    renderExercises();
    updateEmptyState();
}

initAddPage();
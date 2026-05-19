let currentUser = null;
let reactionEventSource = null;
const exerciseReactions = new Map();

const guideContainer = document.getElementById("guideContainer");
const modal = createExerciseModal();

function getExerciseByNameSafe(name) {
    if (typeof getExerciseByName === "function") {
        return getExerciseByName(name);
    }

    if (typeof exercisesDatabase !== "object" || !exercisesDatabase) {
        return null;
    }

    return exercisesDatabase[name] || null;
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

function createReactionControls(exerciseName) {
    const controls = document.createElement("div");
    controls.className = "exercise-reactions";
    controls.append(
        createReactionButton(exerciseName, "like", "Нравится"),
        createReactionButton(exerciseName, "dislike", "Не нравится")
    );
    return controls;
}

function createExerciseItem(exerciseName) {
    const item = document.createElement("li");
    item.dataset.exerciseName = exerciseName;

    const name = document.createElement("span");
    name.className = "exercise-name";
    name.textContent = exerciseName;

    item.append(name, createReactionControls(exerciseName));
    item.addEventListener("click", () => openExerciseModal(exerciseName));
    return item;
}

function createGroupCard(groupName, exercises) {
    const card = document.createElement("div");
    card.className = "muscle-card";

    const title = document.createElement("h2");
    title.textContent = groupName;

    const list = document.createElement("ul");
    list.className = "exercise-list";

    exercises
        .slice()
        .sort((a, b) => a.localeCompare(b, "ru"))
        .forEach((exerciseName) => {
            list.appendChild(createExerciseItem(exerciseName));
        });

    card.append(title, list);
    return card;
}

function renderMuscleGroups() {
    if (!guideContainer) {
        return;
    }

    guideContainer.innerHTML = "";

    const groupedExercises = getExercisesGroupedSafe();

    Object.entries(groupedExercises)
        .sort(([a], [b]) => a.localeCompare(b, "ru"))
        .forEach(([groupName, exercises]) => {
            guideContainer.appendChild(createGroupCard(groupName, exercises));
        });

    applyAllReactionStates();
}

function validateExercisesDatabase() {
    if (typeof exercisesDatabase !== "object" || !exercisesDatabase) {
        console.warn("База exercisesDatabase не найдена");
        return;
    }

    Object.entries(exercisesDatabase).forEach(([name, exercise]) => {
        if (!exercise.category) {
            console.warn(`У упражнения "${name}" не указана категория`);
        }

        if (!exercise.description) {
            console.warn(`У упражнения "${name}" не указано описание`);
        }

        if (!exercise.image) {
            console.warn(`У упражнения "${name}" не указана картинка`);
        }
    });
}

async function initGuidePage() {
    try {
        currentUser = await getCurrentUser();

        if (!currentUser) {
            redirectToLogin();
            return;
        }
    } catch {
        redirectToLogin();
        return;
    }

    bindUserMenu(
        document.getElementById("userDropdown"),
        document.getElementById("profileLogoutBtn"),
        document.getElementById("userBadge")
    );

    bindModalEvents();
    validateExercisesDatabase();
    renderMuscleGroups();
    await loadExerciseReactions();
    startReactionStream();

    window.addEventListener("beforeunload", stopReactionStream);
}

initGuidePage();

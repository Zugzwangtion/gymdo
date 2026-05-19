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
        const category = exercise?.category || "Р‘РµР· РєР°С‚РµРіРѕСЂРёРё";

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
        createReactionButton(exerciseName, "like", "РќСЂР°РІРёС‚СЃСЏ"),
        createReactionButton(exerciseName, "dislike", "РќРµ РЅСЂР°РІРёС‚СЃСЏ")
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
        console.warn("Р‘Р°Р·Р° exercisesDatabase РЅРµ РЅР°Р№РґРµРЅР°");
        return;
    }

    Object.entries(exercisesDatabase).forEach(([name, exercise]) => {
        if (!exercise.category) {
            console.warn(`РЈ СѓРїСЂР°Р¶РЅРµРЅРёСЏ "${name}" РЅРµ СѓРєР°Р·Р°РЅР° РєР°С‚РµРіРѕСЂРёСЏ`);
        }

        if (!exercise.description) {
            console.warn(`РЈ СѓРїСЂР°Р¶РЅРµРЅРёСЏ "${name}" РЅРµ СѓРєР°Р·Р°РЅРѕ РѕРїРёСЃР°РЅРёРµ`);
        }

        if (!exercise.image) {
            console.warn(`РЈ СѓРїСЂР°Р¶РЅРµРЅРёСЏ "${name}" РЅРµ СѓРєР°Р·Р°РЅР° РєР°СЂС‚РёРЅРєР°`);
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

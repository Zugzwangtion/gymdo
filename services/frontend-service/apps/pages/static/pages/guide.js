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

function redirectToLogin() {
    window.location.href = "/login/";
}

function createExerciseModal() {
    const modalElement = document.createElement("div");
    modalElement.className = "exercise-modal";
    modalElement.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" type="button">✖</button>
            <h2 id="modalExerciseTitle"></h2>
            <img id="modalExerciseImage" src="" alt="Упражнение">
            <p id="modalExerciseDescription"></p>
        </div>
    `;

    document.body.appendChild(modalElement);
    return modalElement;
}

function closeModal() {
    modal.style.display = "none";
}

function openExerciseModal(exerciseName) {
    const details = getExerciseByNameSafe(exerciseName) || {};
    const image = details.image || "/static/pages/images/placeholder.jpg";
    const description = details.description || "Описание пока не добавлено";

    document.getElementById("modalExerciseTitle").textContent = exerciseName;
    document.getElementById("modalExerciseImage").src = image;
    document.getElementById("modalExerciseImage").alt = exerciseName;
    document.getElementById("modalExerciseDescription").textContent = description;

    modal.style.display = "flex";
}

function getReactionState(exerciseName) {
    return exerciseReactions.get(exerciseName) || {
        likes: 0,
        dislikes: 0,
        user_reaction: null
    };
}

function setReactionState(reaction) {
    if (!reaction?.exercise_name) {
        return;
    }

    exerciseReactions.set(reaction.exercise_name, {
        likes: reaction.likes || 0,
        dislikes: reaction.dislikes || 0,
        user_reaction: reaction.user_reaction || null
    });
}

function applyReactionState(exerciseName) {
    const state = getReactionState(exerciseName);
    const item = Array.from(guideContainer?.querySelectorAll("[data-exercise-name]") || [])
        .find((element) => element.dataset.exerciseName === exerciseName);

    if (!item) {
        return;
    }

    const likeButton = item.querySelector('[data-reaction-value="like"]');
    const dislikeButton = item.querySelector('[data-reaction-value="dislike"]');
    const likeCount = item.querySelector('[data-reaction-count="like"]');
    const dislikeCount = item.querySelector('[data-reaction-count="dislike"]');

    if (likeCount) {
        likeCount.textContent = String(state.likes);
    }

    if (dislikeCount) {
        dislikeCount.textContent = String(state.dislikes);
    }

    likeButton?.classList.toggle("active", state.user_reaction === "like");
    dislikeButton?.classList.toggle("active", state.user_reaction === "dislike");
}

function applyAllReactionStates() {
    exerciseReactions.forEach((_, exerciseName) => applyReactionState(exerciseName));
}

function applyExerciseReactions(data) {
    exerciseReactions.clear();

    (data?.reactions || []).forEach(setReactionState);
    applyAllReactionStates();
}

async function loadExerciseReactions() {
    try {
        applyExerciseReactions(await getExerciseReactions());
    } catch (error) {
        console.warn(error.message || "Не удалось загрузить реакции");
    }
}

async function handleReactionClick(exerciseName, value) {
    try {
        const reaction = await voteExerciseReaction(exerciseName, value);
        setReactionState(reaction);
        applyReactionState(exerciseName);
    } catch (error) {
        alert(error.message || "Не удалось сохранить реакцию");
    }
}

function createReactionButton(exerciseName, value, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reaction-btn";
    button.dataset.reactionValue = value;
    button.setAttribute("aria-label", label);

    const icon = document.createElement("span");
    icon.className = "reaction-icon";
    icon.textContent = value === "like" ? "👍" : "👎";

    const count = document.createElement("span");
    count.className = "reaction-count";
    count.dataset.reactionCount = value;
    count.textContent = "0";

    button.append(icon, count);
    button.addEventListener("click", (event) => {
        event.stopPropagation();
        handleReactionClick(exerciseName, value);
    });

    return button;
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

function stopReactionStream() {
    if (reactionEventSource) {
        reactionEventSource.close();
        reactionEventSource = null;
    }
}

function startReactionStream() {
    stopReactionStream();

    if (typeof EventSource !== "function") {
        console.warn("Браузер не поддерживает SSE");
        return;
    }

    reactionEventSource = createExerciseReactionsStream();

    reactionEventSource.addEventListener("reactions", (event) => {
        try {
            applyExerciseReactions(JSON.parse(event.data));
        } catch (error) {
            console.warn(error.message || "Не удалось разобрать обновление реакций");
        }
    });

    reactionEventSource.addEventListener("error", () => {
        console.warn("SSE-соединение реакций временно недоступно");
    });
}

function bindModalEvents() {
    modal.querySelector(".modal-close")?.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModal();
        }
    });
}

function bindUserMenu(userDropdown, profileLogoutBtn, userBadge) {
    if (userBadge && currentUser?.username) {
        userBadge.textContent = currentUser.username[0].toUpperCase();

        userBadge.addEventListener("click", (event) => {
            event.stopPropagation();
            userDropdown?.classList.toggle("show");
        });
    }

    profileLogoutBtn?.addEventListener("click", async () => {
        const confirmed = confirm("Выйти из аккаунта?");
        if (!confirmed) {
            return;
        }

        try {
            await logoutUser();
            window.location.href = "/login/";
        } catch (error) {
            alert(error.message || "Не удалось выйти из аккаунта");
        }
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest("#userMenuWrap")) {
            userDropdown?.classList.remove("show");
        }
    });
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

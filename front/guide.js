let currentUser = null;

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
    window.location.href = "login.html";
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
    const image = details.image || "images/placeholder.jpg";
    const description = details.description || "Описание пока не добавлено";

    document.getElementById("modalExerciseTitle").textContent = exerciseName;
    document.getElementById("modalExerciseImage").src = image;
    document.getElementById("modalExerciseImage").alt = exerciseName;
    document.getElementById("modalExerciseDescription").textContent = description;

    modal.style.display = "flex";
}

function createExerciseItem(exerciseName) {
    const item = document.createElement("li");
    item.textContent = exerciseName;
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
            window.location.href = "login.html";
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
}

initGuidePage();
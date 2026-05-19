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


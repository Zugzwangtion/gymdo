/**
 * Перенаправляет неавторизованного пользователя на страницу входа.
 */
function redirectToLogin() {
    window.location.href = "/login/";
}

/**
 * Создает DOM-разметку модального окна упражнения и добавляет ее в body.
 */
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

/**
 * Скрывает модальное окно упражнения.
 */
function closeModal() {
    modal.style.display = "none";
}

/**
 * Открывает карточку упражнения в справочнике.
 * По названию упражнение ищется в `exercisesDatabase`, затем в модальное окно подставляются картинка и описание.
 * Если данных нет, показываются безопасные запасные значения.
 */
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

/**
 * Подключает закрытие модального окна по кнопке, клику по фону и Escape.
 */
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


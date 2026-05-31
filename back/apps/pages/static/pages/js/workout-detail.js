const page = document.querySelector(".workout-detail-page");
const workoutId = page?.dataset.workoutId;
const titleElement = document.getElementById("workoutTitle");
const durationElement = document.getElementById("workoutDuration");
const tonnageElement = document.getElementById("workoutTonnage");
const contentElement = document.getElementById("workoutContent");
const deleteButton = document.getElementById("deleteWorkoutBtn");

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    element.textContent = text;
    return element;
}

function renderWorkout(workout) {
    titleElement.textContent = workout.date || "Тренировка";
    durationElement.textContent = `Длительность: ${workout.duration ?? 0} мин`;
    tonnageElement.textContent = `Тоннаж: ${formatTonnage(workout.tonnage)}`;
    contentElement.innerHTML = "";

    const exercises = workout.exercises || [];
    if (!exercises.length) {
        contentElement.appendChild(createTextElement("p", "workout-detail-muted", "В этой тренировке пока нет упражнений."));
        return;
    }

    exercises.forEach((exercise) => {
        const card = document.createElement("article");
        card.className = "workout-exercise-card";
        card.appendChild(createTextElement("h2", "", exercise.name || "Без названия"));

        (exercise.sets || []).forEach((set, index) => {
            const row = document.createElement("div");
            row.className = "workout-set-row";
            row.append(
                createTextElement("span", "workout-set-label", `Подход ${index + 1}`),
                createTextElement("span", "", `${formatWeight(set.weight)} кг`),
                createTextElement("span", "", `${set.reps ?? 0} повторений`)
            );
            card.appendChild(row);
        });

        contentElement.appendChild(card);
    });
}

async function loadWorkout() {
    if (!workoutId) {
        contentElement.textContent = "Не найден id тренировки.";
        return;
    }

    try {
        const workout = await getWorkoutById(workoutId);
        renderWorkout(workout);
    } catch (error) {
        contentElement.textContent = error.message || "Не удалось загрузить тренировку.";
    }
}

deleteButton?.addEventListener("click", async () => {
    if (!workoutId || !confirm("Удалить эту тренировку?")) {
        return;
    }

    try {
        await deleteWorkoutById(workoutId);
        location.href = "/";
    } catch (error) {
        alert(error.message || "Не удалось удалить тренировку");
    }
});

loadWorkout();

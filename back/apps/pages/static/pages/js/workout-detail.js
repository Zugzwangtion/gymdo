// page - основной блок страницы просмотра одной тренировки.
const page = document.querySelector(".workout-detail-page"); 

// workoutId - id тренировки из HTML-атрибута data-workout-id.
// По этому id потом делается запрос `GET /api/workouts/<id>/`.
const workoutId = page?.dataset.workoutId; //dataset — это способ читать data-* атрибуты из HTML.

// titleElement - заголовок страницы с датой тренировки.
const titleElement = document.getElementById("workoutTitle");

// durationElement - место, где показывается длительность тренировки.
const durationElement = document.getElementById("workoutDuration");

// tonnageElement - место, где показывается тоннаж/нагрузка тренировки.
const tonnageElement = document.getElementById("workoutTonnage");

// contentElement - контейнер, куда вставляются упражнения и подходы.
const contentElement = document.getElementById("workoutContent");

// deleteButton - кнопка удаления тренировки.
const deleteButton = document.getElementById("deleteWorkoutBtn");

/**
 * createTextElement - вспомогательная функция этого экрана.
 * На вход получает: tagName, className, text. По ним выполняет нужный шаг сценария.
 * Нужна, чтобы основной обработчик страницы оставался короче и читался по шагам.
 */
function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    element.textContent = text;
    return element;
}

/**
 * Рисует подробную страницу одной тренировки.
 * Получает объект тренировки с backend: дату, длительность, тоннаж, упражнения и подходы.
 * Все элементы создаются через DOM, чтобы не собирать HTML строками.
 */
function renderWorkout(workout) {
    // workout - объект тренировки, который backend вернул из API.
    // Внутри есть date, duration, tonnage, exercises.
    titleElement.textContent = workout.date || "Тренировка";
    durationElement.textContent = `Длительность: ${workout.duration ?? 0} мин`;
    tonnageElement.textContent = `Тоннаж: ${formatTonnage(workout.tonnage)}`;
    contentElement.innerHTML = "";

    // exercises - упражнения внутри тренировки.
    const exercises = workout.exercises || [];
    if (!exercises.length) {
        contentElement.appendChild(createTextElement("p", "workout-detail-muted", "В этой тренировке пока нет упражнений."));
        return;
    }

    exercises.forEach((exercise) => { //Создание карточек упражнений
        // exercise - одно упражнение внутри тренировки.
        const card = document.createElement("article");
        card.className = "workout-exercise-card";
        card.appendChild(createTextElement("h2", "", exercise.name || "Без названия"));

        (exercise.sets || []).forEach((set, index) => {
            // set - один подход упражнения.
            // index - номер подхода в массиве, с нуля; поэтому на экране показываем index + 1.
            const row = document.createElement("div"); // Создаем строку для каждого подхода, показывая его номер, вес и повторения. Если данных нет, показываем 0 или "Без данных". Она создается не HTML-строкой, а через DOM, чтобы было безопасно и удобно.
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

/**
 * Загружает одну тренировку на странице детального просмотра.
 * id берется из `data-workout-id` в HTML, затем вызывается `getWorkoutById()`.
 * После загрузки данные передаются в `renderWorkout()`, а кнопка удаления получает свой обработчик.
 */
async function loadWorkout() {
    if (!workoutId) {
        contentElement.textContent = "Не найден id тренировки.";
        return;
    }

    try {
        const workout = await getWorkoutById(workoutId); //getWorkoutById() делает запрос к backend по id тренировки и возвращает объект тренировки. Если что-то пошло не так, выбрасывается ошибка, которая ловится в catch.
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

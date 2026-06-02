/**
 * Безопасно получает упражнения, сгруппированные по категориям.
 * Если в справочнике уже есть функция `getExercisesGroupedByCategory()`, используется она.
 * Если функции нет, группировка строится вручную из `exercisesDatabase`, чтобы окно выбора упражнения
 * все равно могло отрисоваться.
 */
function getExercisesGroupedSafe() {
    if (typeof getExercisesGroupedByCategory === "function") {
        return getExercisesGroupedByCategory();
    }

    // grouped - объект, где ключ это категория, а значение это список упражнений.
    const grouped = {};
    if (typeof exercisesDatabase !== "object" || !exercisesDatabase) return grouped;

    Object.entries(exercisesDatabase).forEach(([name, exercise]) => {
        const category = exercise?.category || "Без категории";
        grouped[category] = grouped[category] || [];
        grouped[category].push(name);
    });

    return grouped;
}

/**
 * Безопасно получает данные упражнения по названию.
 * Сначала пробует готовую функцию `getExerciseByName()`, а если ее нет, напрямую ищет запись
 * в `exercisesDatabase`. Возвращает `null`, если справочник недоступен или упражнения нет.
 */
function getExerciseByNameSafe(name) {
    if (typeof getExerciseByName === "function") return getExerciseByName(name);
    if (typeof exercisesDatabase !== "object" || !exercisesDatabase) return null;
    return exercisesDatabase[name] || null;
}

/**
 * Ставит дату по умолчанию в поле даты тренировки.
 * Если пользователь пришел с календаря по ссылке `/add/?date=...`, берется дата из URL.
 * Если даты в URL нет, в поле ставится сегодняшняя дата в формате `YYYY-MM-DD`.
 */
function setDefaultDate() {
    if (!elements.dateInput) return;

    // params - параметры из адресной строки, например /add/?date=2026-06-01.
    const params = new URLSearchParams(window.location.search);

    // dateParam - дата, переданная с календаря.
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

/**
 * Превращает строку даты тренировки в объект `Date`.
 * Это нужно, чтобы сравнивать даты прошлых тренировок с датой, которую пользователь выбрал в форме.
 * Если строка пустая или некорректная, возвращается `null`.
 */
function parseWorkoutDate(dateString) {
    if (!dateString) return null;
    const date = new Date(`${dateString}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Ищет прошлую тренировку с таким же упражнением.
 * Использует уже загруженный список `state.workouts` и выбранную дату, чтобы не брать будущие тренировки.
 * Нужно для подсказок: можно сравнить текущий вес/повторы с прошлым разом.
 */
function getPreviousExercise(exerciseName) {
    // currentDate - дата текущей тренировки, которую сейчас заполняет пользователь.
    const currentDate = parseWorkoutDate(elements.dateInput?.value);

    // sorted - прошлые тренировки, отсортированные от новых к старым.
    const sorted = [...state.workouts].sort((a, b) => {
        return parseWorkoutDate(b.date) - parseWorkoutDate(a.date);
    });

    for (const workout of sorted) {
        // workoutDate - дата очередной прошлой тренировки.
        const workoutDate = parseWorkoutDate(workout.date);
        if (currentDate && workoutDate && workoutDate >= currentDate) continue;

        // match - упражнение с таким же названием внутри прошлой тренировки.
        const match = (workout.exercises || []).find((exercise) => exercise.name === exerciseName);
        if (match) {
            return { workout, exercise: match };
        }
    }

    return null;
}

/**
 * Берет подход с тем же номером из прошлого выполнения упражнения.
 * На вход приходит упражнение и индекс подхода; возвращается старый подход или `null`.
 * Эти данные используются для маленьких подсказок прогресса рядом с текущими значениями.
 */
function getPreviousSet(exercise, index) {
    return exercise.previous?.exercise?.sets?.[index] || null;
}

// Словарь терминов в этом файле:
// previous - предыдущий/прошлый.
// workout - тренировка.
// exercise - упражнение.
// set - подход.
// dateString - дата строкой, например "2026-06-01".

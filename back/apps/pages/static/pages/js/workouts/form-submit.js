/**
 * Приводит значение веса или повторов к числу.
 * Пустая строка, `null` или некорректный ввод превращаются в 0, чтобы в payload не уходил мусор.
 * Это важно перед подсчетом тоннажа и перед отправкой подходов на backend.
 */
function normalizeSetValue(value) {
    if (value === "" || value == null) return 0;
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

/**
 * Собирает упражнения из `state.exercises` в формат, который ожидает backend.
 * Из внутреннего состояния формы убираются временные `id`, пустые подходы и строки превращаются в числа.
 * Именно результат этой функции уходит в поле `exercises` внутри POST-запроса создания тренировки.
 */
function collectExercisesPayload() {
    return state.exercises
        .map((exercise) => { //map проходит по каждому упражнению и превращает его в другой вид.
            // exercise - одно упражнение в тренировке.
            // sets - подходы этого упражнения, которые уйдут на backend.
            const sets = exercise.sets
                .map((set, index) => ({
                    // reps - repetitions, количество повторений.
                    reps: normalizeSetValue(set.reps),

                    // weight - вес в килограммах.
                    weight: normalizeSetValue(set.weight),

                    // sort_order - порядок подхода внутри упражнения.
                    // Нужен, чтобы backend потом вернул подходы в том же порядке.
                    sort_order: index
                }))
                .filter((set) => set.reps > 0 || set.weight > 0); //Это выкидывает пустые подходы

            // name - название упражнения.
            // sets - список подходов после очистки пустых строк.
            return { name: exercise.name, sets };
        })
        .filter((exercise) => exercise.sets.length > 0); //сли у упражнения нет ни одного заполненного подхода, упражнение тоже выкидывается.
}

/**
 * Считает общий тоннаж на фронтенде: сумма `weight * reps` по всем подходам.
 * Это значение удобно показать или передать вместе с формой, но окончательно backend все равно пересчитывает тоннаж сам.
 * Так сервер не зависит от честности или ошибок браузера.
 */
function calculateTonnage(exercises) {
    return exercises.reduce((total, exercise) => {
        return total + exercise.sets.reduce((sum, set) => {
            return sum + Number(set.reps || 0) * Number(set.weight || 0);
        }, 0);
    }, 0);
}

/**
 * Проверяет форму перед сохранением.
 * Сначала используется стандартная HTML-валидация (`required`, `min`, `max`), потом отдельно проверяется, что есть хотя бы один заполненный подход.
 * Если проверка не прошла, POST-запрос вообще не отправляется.
 */
function validateWorkoutForm() {
    if (!elements.workoutForm?.checkValidity()) { //checkValidity() это встроенная проверка HTML-формы.
        elements.workoutForm?.reportValidity();  //reportValidity() показывает стандартное сообщение браузера, например “Заполните это поле”.
        return false;
    }

    if (!collectExercisesPayload().length) { //collectExercisesPayload() собирает упражнения, которые реально можно отправить на сервер.
        alert("Добавь хотя бы одно упражнение и заполни хотя бы один подход.");
        return false;
    }

    return true;
}


/**
 * Подключает обработчики событий на странице добавления тренировки.
 * Здесь форма становится интерактивной: переключается режим ручного ввода/таймера,
 * открывается выбор упражнения, запускается `handleSubmit()` при сохранении,
 * а при смене даты пересчитываются подсказки по прошлым тренировкам.
 */
function bindEvents() {
    elements.modeInputs?.forEach((input) => {
        input.addEventListener("change", (event) => {
            if (event.target.checked) setWorkoutMode(event.target.value);
        });
    });
    elements.openExercisePickerBtn?.addEventListener("click", openExercisePicker);
    elements.closeExercisePickerBtn?.addEventListener("click", closeExercisePicker);
    elements.workoutForm?.addEventListener("submit", handleSubmit); //Отправляет форму, которая вызывает handleSubmit
    elements.dateInput?.addEventListener("change", () => {
        state.exercises.forEach((exercise) => {
            exercise.previous = getPreviousExercise(exercise.name);
            if (!exercise.sets.length) exercise.sets = createSetsFromPrevious(exercise.previous);
        });
        renderExercises();
    });

    elements.exercisePickerModal?.addEventListener("click", (event) => {
        if (event.target === elements.exercisePickerModal) closeExercisePicker();
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeExercisePicker();
            closeSetEditor();
        }
    });
    window.addEventListener("beforeunload", stopExecutionTimer);
}

/**
 * Стартовая функция страницы добавления тренировки.
 * Сначала проверяется авторизация через `getCurrentUser()`, потом ставится дата, загружаются прошлые тренировки и подключаются события.
 * Если пользователь не вошел, здесь же происходит переход на `/login/`.
 */
async function initAddPage() {
    try {
        currentUser = await getCurrentUser(); //Проверяет авторизацию через getCurrentUser()
        if (!currentUser) {
            window.location.href = "/login/"; //Если пользователь не вошел, кидает на /login/
            return;
        }
    } catch {
        window.location.href = "/login/";
        return;
    }

    setDefaultDate();

    try {
        state.workouts = await getWorkouts(); //Загружает прошлые тренировки через getWorkouts()
    } catch {
        state.workouts = [];
    }

    bindEvents();
    setWorkoutMode("manual");
    renderExercises();
    updateEmptyState();
}

initAddPage();

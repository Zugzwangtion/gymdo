// currentUser - текущий пользователь, который вошел в аккаунт.
// Сначала тут null, потом `initAddPage()` кладет сюда результат `getCurrentUser()`.
let currentUser = null;

// effortOptions - варианты субъективной тяжести подхода.
// value - английское значение, которое удобно хранить в коде/базе.
// label - русский текст для кнопки или подписи на странице.
// tone - CSS-ключ для цвета/стиля выбранной тяжести.
const effortOptions = [
    { value: "", label: "Не выбрано", tone: "neutral" },
    { value: "warmup", label: "Размин.", tone: "warmup" },
    { value: "low", label: "Низкое", tone: "low" },
    { value: "medium", label: "Среднее", tone: "medium" },
    { value: "high", label: "Высокое", tone: "high" },
    { value: "max", label: "Максим.", tone: "max" }
];

// state - временная память страницы добавления тренировки.
// Все, что пользователь вводит до нажатия "Сохранить", сначала лежит здесь,
// а уже потом превращается в JSON и отправляется на backend.
const state = {
    // exercises - упражнения, выбранные в текущей тренировке.
    // Каждый объект внутри - одно упражнение: название, картинка, прошлые данные и список подходов.
    exercises: [],

    // workouts - прошлые тренировки пользователя, загруженные с backend.
    // Они нужны, чтобы показывать прошлые веса/повторы для такого же упражнения.
    workouts: [],

    // expandedCategories - раскрытые категории в окне выбора упражнения.
    // Set хранит уникальные названия категорий, например "Грудь" или "Спина".
    expandedCategories: new Set(),

    // editing - какой подход сейчас открыт в отдельном редакторе.
    // null значит, что редактор подхода сейчас не открыт.
    editing: null,

    // mode - режим добавления тренировки:
    // "manual" - вручную указываем длительность,
    // "execution" - выполняем тренировку с таймером.
    mode: "manual",

    // timerStartedAt - момент запуска общего таймера тренировки.
    // Хранится как число Date.now(), то есть миллисекунды.
    timerStartedAt: null,

    // lastExerciseFinishedAt - когда было завершено последнее упражнение.
    // Нужно для таймера "после упражнения".
    lastExerciseFinishedAt: null,

    // lastSetFinishedAt - когда был завершен последний подход.
    // Нужно для таймера отдыха между подходами.
    lastSetFinishedAt: null,

    // elapsedSeconds - сколько секунд уже идет тренировка.
    elapsedSeconds: 0,

    // timerIntervalId - id интервала `setInterval`, который обновляет таймер.
    // Нужен, чтобы потом остановить таймер через `clearInterval`.
    timerIntervalId: null
};

// elements - ссылки на HTML-элементы страницы.
// Я один раз нахожу их через document.getElementById(), а дальше обращаюсь коротко:
// `elements.dateInput`, `elements.exercisesContainer` и т.д.
const elements = {
    // exercisesContainer - контейнер упражнений: сюда JS вставляет карточки выбранных упражнений.
    exercisesContainer: document.getElementById("exercisesContainer"),

    // workoutForm - вся форма добавления тренировки.
    workoutForm: document.getElementById("workoutForm"),

    // dateInput - поле даты тренировки.
    dateInput: document.getElementById("date"),

    // durationInput - поле длительности тренировки в минутах.
    durationInput: document.getElementById("duration"),

    // modeInputs - переключатели режима: ручное внесение или выполнение с таймером.
    modeInputs: document.querySelectorAll('input[name="workoutMode"]'),

    // manualDurationGroup - блок ручного ввода длительности.
    manualDurationGroup: document.getElementById("manualDurationGroup"),

    // executionTimerPanel - панель таймеров в режиме выполнения тренировки.
    executionTimerPanel: document.getElementById("executionTimerPanel"),

    // totalTimerDisplay - текст общего таймера тренировки.
    totalTimerDisplay: document.getElementById("totalTimerDisplay"),

    // exerciseTimerDisplay - текст таймера после завершения упражнения.
    exerciseTimerDisplay: document.getElementById("exerciseTimerDisplay"),

    // restTimerDisplay - текст таймера отдыха после подхода.
    restTimerDisplay: document.getElementById("restTimerDisplay"),

    // submitWorkoutButton - кнопка сохранения/завершения тренировки.
    submitWorkoutButton: document.getElementById("submitWorkoutButton"),

    // openExercisePickerBtn - кнопка "Добавить упражнение".
    openExercisePickerBtn: document.getElementById("openExercisePickerBtn"),

    // exercisePickerModal - модальное окно выбора упражнения.
    exercisePickerModal: document.getElementById("exercisePickerModal"),

    // exercisePickerBody - внутренняя часть окна, куда вставляются группы упражнений.
    exercisePickerBody: document.getElementById("exercisePickerBody"),

    // pickerTitle - заголовок окна выбора упражнения.
    pickerTitle: document.getElementById("pickerTitle"),

    // pickerSubtitle - поясняющий текст под заголовком окна выбора.
    pickerSubtitle: document.getElementById("pickerSubtitle"),

    // closeExercisePickerBtn - кнопка закрытия окна выбора упражнения.
    closeExercisePickerBtn: document.getElementById("closeExercisePicker"),

    // emptyExercisesState - блок "Пока пусто", который показывается без упражнений.
    emptyExercisesState: document.getElementById("emptyExercisesState")
};

/**
 * Возвращает пользователя с формы добавления на главную страницу.
 * Используется как простая навигационная функция: данные формы не сохраняются,
 * браузер просто переходит на `/`.
 */
function goBack() {
    window.location.href = "/";
}

/**
 * Создает временный id для объектов на фронтенде.
 * Он нужен только пока пользователь заполняет форму: по нему JS находит конкретное упражнение
 * или подход в `state.exercises`. В базу этот id не отправляется, там Django создаст свои id.
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}


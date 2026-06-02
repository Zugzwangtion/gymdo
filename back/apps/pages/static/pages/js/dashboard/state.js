// state - общее состояние главной страницы.
// Это данные, от которых зависят календарь, статистика, график и карта мышц.
const state = { 
    // currentUser - текущий пользователь. null значит, что пользователь не вошел.
    currentUser: null,

    // isAuthenticated - вошел ли пользователь в аккаунт.
    // По этому флагу показываются/скрываются кнопки и защищенные действия.
    isAuthenticated: false,

    
    workouts: [], //После запроса к backend туда попадут тренировки:

    // currentDate - дата, по которой строится текущий месяц календаря.
    currentDate: new Date(),

    // chartInstance - объект графика Chart.js.
    // Его нужно хранить, чтобы перед новой отрисовкой удалить старый график.
    chartInstance: null
};

// elements - HTML-элементы главной страницы.
// Вместо постоянного `document.getElementById(...)` ниже используется короткая запись `elements.*`.
// JS заранее находит HTML-элементы, куда потом будет вставлять данные.
const elements = {
    // modal - большое всплывающее окно с тренировками выбранного дня.
    modal: document.getElementById("workoutModal"),

    // modalContent - место внутри modal, куда вставляется текст/карточки тренировок.
    modalContent: document.getElementById("modalContent"),

    // closeModalButton - кнопка закрытия модального окна.
    closeModalButton: document.getElementById("closeModal"),

    // userBadge - кружок/бейдж пользователя в правой части меню.
    userBadge: document.getElementById("userBadge"),

    // userDropdown - выпадающее меню пользователя.
    userDropdown: document.getElementById("userDropdown"),

    // profileLogoutBtn - кнопка выхода из аккаунта.
    profileLogoutBtn: document.getElementById("profileLogoutBtn"),

    // loginBtn - кнопка перехода на страницу входа.
    loginBtn: document.getElementById("loginBtn"),

    // guideLink - ссылка на справочник упражнений.
    guideLink: document.getElementById("guideLink"),

    // pageSubtitle - подзаголовок под главным заголовком страницы.
    pageSubtitle: document.getElementById("pageSubtitle"),

    // authPromptModal - окно "нужна авторизация".
    authPromptModal: document.getElementById("authPromptModal"),

    // authPromptText - текст внутри окна авторизации.
    authPromptText: document.getElementById("authPromptText"),

    // closeAuthPrompt - кнопка закрытия окна авторизации.
    closeAuthPrompt: document.getElementById("closeAuthPrompt"),

    // calendarGrid - сетка календаря, куда JS вставляет дни месяца.
    calendarGrid: document.getElementById("calendarGrid"),

    // monthTitle - название текущего месяца над календарем.
    monthTitle: document.getElementById("monthTitle"),

    // chartCanvas - canvas, на котором Chart.js рисует график.
    chartCanvas: document.getElementById("chart"),

    // totalWorkouts - счетчик общего количества тренировок.
    totalWorkouts: document.getElementById("totalWorkouts"),

    // totalExercises - счетчик упражнений.
    totalExercises: document.getElementById("totalExercises"),

    // totalSets - счетчик подходов.
    totalSets: document.getElementById("totalSets"),

    // totalReps - счетчик повторений.
    totalReps: document.getElementById("totalReps"),

    // totalTonnage - общий тоннаж/нагрузка.
    totalTonnage: document.getElementById("totalTonnage"),

    // prevMonth - кнопка предыдущего месяца.
    prevMonth: document.getElementById("prevMonth"),

    // nextMonth - кнопка следующего месяца.
    nextMonth: document.getElementById("nextMonth"),

    // frontMapContainer - контейнер SVG-карты мышц спереди.
    frontMapContainer: document.getElementById("frontMapContainer"),

    // backMapContainer - контейнер SVG-карты мышц сзади.
    backMapContainer: document.getElementById("backMapContainer"),

    // muscleLegend - легенда карты мышц: какие цвета что значат.
    muscleLegend: document.getElementById("muscleLegend"),
};

// exerciseMuscleMap - ручная карта "упражнение -> какие мышцы работают".
// Английские ключи мышц нужны, чтобы потом найти соответствующие части SVG-карты.
const exerciseMuscleMap = {
    "Жим штанги лежа": ["chest", "front-shoulders", "triceps"],
    "Жим гантелей лежа": ["chest", "front-shoulders", "triceps"],
    "Жим штанги лежа на наклонной скамье": ["upper-chest", "front-shoulders", "triceps"],
    "Жим гантелей лежа на наклонной скамье": ["upper-chest", "front-shoulders", "triceps"],

    "Тяга хамера": ["lats", "mid-back", "rear-shoulders", "biceps"],
    "Подтягивания": ["lats", "biceps", "forearms"],
    "Тяга верхнего блока": ["lats", "biceps", "forearms"],
    "Тяга нижнего блока": ["mid-back", "lats", "biceps"],

    "Жим гантелей сидя": ["front-shoulders", "side-shoulders", "triceps"],
    "Армейский жим": ["front-shoulders", "side-shoulders", "triceps"],
    "Махи гантелями": ["side-shoulders"],

    "Подъем штанги на бицепс": ["biceps", "forearms"],
    "Подъем гантелей на бицепс": ["biceps", "forearms"],
    "Французский жим": ["triceps"],
    "Разгибание рук в кроссовере": ["triceps"],

    "Жим ногами": ["quads", "glutes", "hamstrings"],
    "Разгибание ног в тренажере": ["quads"],
    "Сгибание ног в тренажере": ["hamstrings"],
    "Подъем на носки с утяжелением": ["calves"],

    "Скручивания в тренажере": ["abs"],
    "Скручивания на скамье": ["abs"]
};

// muscleSvgMap - карта "английский ключ мышцы -> id частей SVG + русская подпись".
// front - id элементов на SVG вида спереди, back - id элементов вида сзади.
// label - русский текст для легенды.
const muscleSvgMap = {
    chest: {
        front: ["chest-left", "chest-right"],
        label: "Грудь"
    },

    abs: {
        front: ["abs-upper", "abs-lower"],
        label: "Пресс"
    },

    obliques: {
        front: ["oblique-left", "oblique-right"],
        label: "Косые мышцы живота"
    },

    biceps: {
        front: ["bicep-left", "bicep-right "], // у правого id с пробелом в конце
        label: "Бицепс"
    },

    triceps: {
        back: ["triceps-left", "triceps-right"],
        label: "Трицепс"
    },

    forearms: {
        front: ["forearm-left", "forearm-right"],
        back: ["forearms-back-left", "forearms-back-right"],
        label: "Предплечья"
    },

    shoulders: {
        front: ["shoulder-left ", "shoulder-right"], // у левого id с пробелом в конце
        back: ["shoulder-left", "shoulder-right", "shoulder"],
        label: "Плечи"
    },


    traps: {
        front: ["trap-front-left", "trap-front-right"],
        back: ["traps"],
        label: "Трапеции"
    },

    lats: {
        back: ["lat-left", "lat-right"],
        label: "Широчайшие"
    },


    upperBack: {
        back: ["up-medium-back"],
        label: "Верх спины"
    },

    lowerBack: {
        back: ["down-medium-back"],
        label: "Низ спины"
    },

    glutes: {
        back: ["glutes-left", "glutes-right"],
        label: "Ягодицы"
    },

    quads: {
        front: ["quad-left ", "quad-right"], // у левого id с пробелом в конце
        label: "Квадрицепсы"
    },

    hamstrings: {
        back: ["hamstring-left", "hamstring-right"],
        label: "Бицепс бедра"
    },

    calves: {
        front: ["calf-front-left", "calf-front-right"],
        back: ["calf-left", "calf-right"],
        label: "Икры"
    },

    adductors: {
        front: ["adductor-left", "adductor-right"],
        back: ["adduktor-left", "adduktor-right"],
        label: "Приводящие мышцы"
    },

    neck: {
        front: ["neck-front"],
        back: ["neck-back"],
        label: "Шея"
    }
};


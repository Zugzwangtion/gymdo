const state = {
    currentUser: null,
    isAuthenticated: false,
    workouts: [],
    currentDate: new Date(),
    chartInstance: null
};

const elements = {
    modal: document.getElementById("workoutModal"),
    modalContent: document.getElementById("modalContent"),
    closeModalButton: document.getElementById("closeModal"),
    userBadge: document.getElementById("userBadge"),
    userDropdown: document.getElementById("userDropdown"),
    profileLogoutBtn: document.getElementById("profileLogoutBtn"),
    loginBtn: document.getElementById("loginBtn"),
    guideLink: document.getElementById("guideLink"),
    pageSubtitle: document.getElementById("pageSubtitle"),
    authPromptModal: document.getElementById("authPromptModal"),
    authPromptText: document.getElementById("authPromptText"),
    closeAuthPrompt: document.getElementById("closeAuthPrompt"),
    calendarGrid: document.getElementById("calendarGrid"),
    monthTitle: document.getElementById("monthTitle"),
    chartCanvas: document.getElementById("chart"),
    totalWorkouts: document.getElementById("totalWorkouts"),
    totalExercises: document.getElementById("totalExercises"),
    totalSets: document.getElementById("totalSets"),
    totalReps: document.getElementById("totalReps"),
    totalTonnage: document.getElementById("totalTonnage"),
    prevMonth: document.getElementById("prevMonth"),
    nextMonth: document.getElementById("nextMonth"),
    frontMapContainer: document.getElementById("frontMapContainer"),
    backMapContainer: document.getElementById("backMapContainer"),
    muscleLegend: document.getElementById("muscleLegend"),
};

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


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
    "Р–РёРј С€С‚Р°РЅРіРё Р»РµР¶Р°": ["chest", "front-shoulders", "triceps"],
    "Р–РёРј РіР°РЅС‚РµР»РµР№ Р»РµР¶Р°": ["chest", "front-shoulders", "triceps"],
    "Р–РёРј С€С‚Р°РЅРіРё Р»РµР¶Р° РЅР° РЅР°РєР»РѕРЅРЅРѕР№ СЃРєР°РјСЊРµ": ["upper-chest", "front-shoulders", "triceps"],
    "Р–РёРј РіР°РЅС‚РµР»РµР№ Р»РµР¶Р° РЅР° РЅР°РєР»РѕРЅРЅРѕР№ СЃРєР°РјСЊРµ": ["upper-chest", "front-shoulders", "triceps"],

    "РўСЏРіР° С…Р°РјРµСЂР°": ["lats", "mid-back", "rear-shoulders", "biceps"],
    "РџРѕРґС‚СЏРіРёРІР°РЅРёСЏ": ["lats", "biceps", "forearms"],
    "РўСЏРіР° РІРµСЂС…РЅРµРіРѕ Р±Р»РѕРєР°": ["lats", "biceps", "forearms"],
    "РўСЏРіР° РЅРёР¶РЅРµРіРѕ Р±Р»РѕРєР°": ["mid-back", "lats", "biceps"],

    "Р–РёРј РіР°РЅС‚РµР»РµР№ СЃРёРґСЏ": ["front-shoulders", "side-shoulders", "triceps"],
    "РђСЂРјРµР№СЃРєРёР№ Р¶РёРј": ["front-shoulders", "side-shoulders", "triceps"],
    "РњР°С…Рё РіР°РЅС‚РµР»СЏРјРё": ["side-shoulders"],

    "РџРѕРґСЉРµРј С€С‚Р°РЅРіРё РЅР° Р±РёС†РµРїСЃ": ["biceps", "forearms"],
    "РџРѕРґСЉРµРј РіР°РЅС‚РµР»РµР№ РЅР° Р±РёС†РµРїСЃ": ["biceps", "forearms"],
    "Р¤СЂР°РЅС†СѓР·СЃРєРёР№ Р¶РёРј": ["triceps"],
    "Р Р°Р·РіРёР±Р°РЅРёРµ СЂСѓРє РІ РєСЂРѕСЃСЃРѕРІРµСЂРµ": ["triceps"],

    "Р–РёРј РЅРѕРіР°РјРё": ["quads", "glutes", "hamstrings"],
    "Р Р°Р·РіРёР±Р°РЅРёРµ РЅРѕРі РІ С‚СЂРµРЅР°Р¶РµСЂРµ": ["quads"],
    "РЎРіРёР±Р°РЅРёРµ РЅРѕРі РІ С‚СЂРµРЅР°Р¶РµСЂРµ": ["hamstrings"],
    "РџРѕРґСЉРµРј РЅР° РЅРѕСЃРєРё СЃ СѓС‚СЏР¶РµР»РµРЅРёРµРј": ["calves"],

    "РЎРєСЂСѓС‡РёРІР°РЅРёСЏ РІ С‚СЂРµРЅР°Р¶РµСЂРµ": ["abs"],
    "РЎРєСЂСѓС‡РёРІР°РЅРёСЏ РЅР° СЃРєР°РјСЊРµ": ["abs"]
};

const muscleSvgMap = {
    chest: {
        front: ["chest-left", "chest-right"],
        label: "Р“СЂСѓРґСЊ"
    },

    abs: {
        front: ["abs-upper", "abs-lower"],
        label: "РџСЂРµСЃСЃ"
    },

    obliques: {
        front: ["oblique-left", "oblique-right"],
        label: "РљРѕСЃС‹Рµ РјС‹С€С†С‹ Р¶РёРІРѕС‚Р°"
    },

    biceps: {
        front: ["bicep-left", "bicep-right "], // Сѓ РїСЂР°РІРѕРіРѕ id СЃ РїСЂРѕР±РµР»РѕРј РІ РєРѕРЅС†Рµ
        label: "Р‘РёС†РµРїСЃ"
    },

    triceps: {
        back: ["triceps-left", "triceps-right"],
        label: "РўСЂРёС†РµРїСЃ"
    },

    forearms: {
        front: ["forearm-left", "forearm-right"],
        back: ["forearms-back-left", "forearms-back-right"],
        label: "РџСЂРµРґРїР»РµС‡СЊСЏ"
    },

    shoulders: {
        front: ["shoulder-left ", "shoulder-right"], // Сѓ Р»РµРІРѕРіРѕ id СЃ РїСЂРѕР±РµР»РѕРј РІ РєРѕРЅС†Рµ
        back: ["shoulder-left", "shoulder-right", "shoulder"],
        label: "РџР»РµС‡Рё"
    },


    traps: {
        front: ["trap-front-left", "trap-front-right"],
        back: ["traps"],
        label: "РўСЂР°РїРµС†РёРё"
    },

    lats: {
        back: ["lat-left", "lat-right"],
        label: "РЁРёСЂРѕС‡Р°Р№С€РёРµ"
    },


    upperBack: {
        back: ["up-medium-back"],
        label: "Р’РµСЂС… СЃРїРёРЅС‹"
    },

    lowerBack: {
        back: ["down-medium-back"],
        label: "РќРёР· СЃРїРёРЅС‹"
    },

    glutes: {
        back: ["glutes-left", "glutes-right"],
        label: "РЇРіРѕРґРёС†С‹"
    },

    quads: {
        front: ["quad-left ", "quad-right"], // Сѓ Р»РµРІРѕРіРѕ id СЃ РїСЂРѕР±РµР»РѕРј РІ РєРѕРЅС†Рµ
        label: "РљРІР°РґСЂРёС†РµРїСЃС‹"
    },

    hamstrings: {
        back: ["hamstring-left", "hamstring-right"],
        label: "Р‘РёС†РµРїСЃ Р±РµРґСЂР°"
    },

    calves: {
        front: ["calf-front-left", "calf-front-right"],
        back: ["calf-left", "calf-right"],
        label: "РРєСЂС‹"
    },

    adductors: {
        front: ["adductor-left", "adductor-right"],
        back: ["adduktor-left", "adduktor-right"],
        label: "РџСЂРёРІРѕРґСЏС‰РёРµ РјС‹С€С†С‹"
    },

    neck: {
        front: ["neck-front"],
        back: ["neck-back"],
        label: "РЁРµСЏ"
    }
};


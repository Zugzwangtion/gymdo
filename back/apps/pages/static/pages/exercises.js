const exercisesDatabase = {
    "Жим штанги лежа": {
        category: "Грудь",
        primaryMuscles: ["chest"],
        secondaryMuscles: [],
        image: "/static/pages/images/barbell-bench-press.png",
        description: "Базовое упражнение для развития грудных мышц.",
    },

    "Жим гантелей лежа": {
        category: "Грудь",
        primaryMuscles: ["chest"],
        secondaryMuscles: [],
        image: "/static/pages/images/dumbbell-chest-press.png",
        description: "Базовое упражнение для развития грудных мышц.",
    },

    "Жим штанги лежа на наклонной скамье": {
        category: "Грудь",
        primaryMuscles: ["chest"],
        secondaryMuscles: [],
        image: "/static/pages/images/incline-barbell-bench-press.png",
        description: "Базовое упражнение для развития грудных мышц.",
    },

    "Жим гантелей лежа на наклонной скамье": {
        category: "Грудь",
        primaryMuscles: ["chest"],
        secondaryMuscles: [],
        image: "/static/pages/images/incline-dumbbell-bench-press.png",
        description: "Базовое упражнение для развития грудных мышц.",
    },





    "Вертикальная тяга хамера": {
        category: "Спина",
        primaryMuscles: ["lats"],
        secondaryMuscles: [],
        image: "/static/pages/images/vertical-thrust-hummer.png",
        description: "Упражнение для широчайших мышц спины.",
    },

    "Горизонтальная тяга хамера": {
        category: "Спина",
        primaryMuscles: ["mid-back"],
        secondaryMuscles: [],
        image: "/static/pages/images/horizontal-thrust-hummer.png",
        description: "Упражнение для мышц серидины спины.",
    },

    "Тяга верхнего блока": {
        category: "Спина",
        primaryMuscles: ["lats"],
        secondaryMuscles: [],
        image: "/static/pages/images/lat-pulldown.png",
        description: "Упражнение для широчайших мышц спины.",
    },

    "Тяга нижнего блока": {
        category: "Спина",
        primaryMuscles: ["mid-back"],
        secondaryMuscles: [],
        image: "/static/pages/images/seated-cable-row.png",
        description: "Упражнение для мышц серидины спины.",
    },

    "Подтягивания": {
        category: "Спина",
        primaryMuscles: ["lats"],
        secondaryMuscles: [],
        image: "/static/pages/images/pull-ups.png",
        description: "Упражнение для широчайших мышц спины.",
    },






    "Жим гантелей сидя": {
        category: "Плечи",
        primaryMuscles: ["shoulders"],
        secondaryMuscles: [],
        image: "/static/pages/images/seated-dumbell-shoulder-press.png",
        description: "Базовое упражнение на плечи.",
    },

    "Армейский жим": {
        category: "Плечи",
        primaryMuscles: ["shoulders"],
        secondaryMuscles: [],
        image: "/static/pages/images/military-press.png",
        description: "Базовое упражнение на плечи.",
    },

    "Махи гантелями": {
        category: "Плечи",
        primaryMuscles: ["shoulders"],
        secondaryMuscles: [],
        image: "/static/pages/images/dumbbell-lateral-raise.png",
        description: "Базовое упражнение на плечи.",
    },

    


    "Подъем штанги на бицепс": {
        category: "Бицепсы",
        primaryMuscles: ["biceps"],
        secondaryMuscles: [],
        image: "/static/pages/images/ez-bar-bicep-curl.png",
        description: "Базовое упражнение на бицепс.",
    },
    "Подъем гентелей на бицепс": {
        category: "Бицепсы",
        primaryMuscles: ["biceps"],
        secondaryMuscles: [],
        image: "/static/pages/images/dumbbell-bicep-curl.png",
        description: "Базовое упражнение на бицепс.",
    },


    "Французкий жим": {
        category: "Трицепсы",
        primaryMuscles: ["triceps"],
        secondaryMuscles: [],
        image: "/static/pages/images/french-bench-press.png",
        description: "Базовое упражнение на трицепс.",
    },
    "Разгибание рук в кроссовере": {
        category: "Трицепсы",
        primaryMuscles: ["triceps"],
        secondaryMuscles: [],
        image: "/static/pages/images/cable-triceps-pushdown.png",
        description: "Базовое упражнение на трицепс.",
    },


    "Жим ногами": {
        category: "Квадрицкпсы",
        primaryMuscles: ["quads"],
        secondaryMuscles: [],
        image: "/static/pages/images/leg-press.png",
        description: "Базовое упражнение на ноги.",
    },
    "Разгибание ног в тренажере": {
        category: "Квадрицкпсы",
        primaryMuscles: ["quads"],
        secondaryMuscles: [],
        image: "/static/pages/images/leg-extension.png",
        description: "Базовое упражнение на ноги.",
    },
    "Сгибание ног в тренажере сидя": {
        category: "Бицепсы бедра",
        primaryMuscles: ["hamstrings"],
        secondaryMuscles: [],
        image: "/static/pages/images/bending-legs-sitting-machine.jpg",
        description: "Базовое упражнение на ноги.",
    },
    "Сгибание ног в тренажере лежа": {
        category: "Бицепсы бедра",
        primaryMuscles: ["hamstrings"],
        secondaryMuscles: [],
        image: "/static/pages/images/lying-leg-curl.png",
        description: "Базовое упражнение на ноги.",
    },



    "Подъем на носки в тренажере": {
        category: "Икры",
        primaryMuscles: ["calves"],
        secondaryMuscles: [],
        image: "/static/pages/images/machine-calf-paise.png",
        description: "Базовое упражнение на ноги.",
    },


    "Скручивания": {
        category: "Пресс",
        primaryMuscles: ["abs"],
        secondaryMuscles: [],
        image: "/static/pages/images/crunch.png",
        description: "Базовое упражнение на укрепление мышц кора.",
    },

    "Скручивания на наклонной скамье": {
        category: "Пресс",
        primaryMuscles: ["abs"],
        secondaryMuscles: [],
        image: "/static/pages/images/decline-bench-crunch.png",
        description: "Базовое упражнение на укрепление мышц кора.",
    },

    "Скручивания в тренажере": {
        category: "Пресс",
        primaryMuscles: ["abs"],
        secondaryMuscles: [],
        image: "/static/pages/images/crunch.png",
        description: "Базовое упражнение на укрепление мышц кора.",
    },
};

function getExerciseByName(name) {
    return exercisesDatabase[name] || null;
}

function getExercisesGroupedByCategory() {
    const grouped = {};

    Object.entries(exercisesDatabase).forEach(([name, exercise]) => {
        const category = exercise.category || "Без категории";

        if (!grouped[category]) {
            grouped[category] = [];
        }

        grouped[category].push(name);
    });

    return grouped;
}

function getAllExerciseNames() {
    return Object.keys(exercisesDatabase);
}

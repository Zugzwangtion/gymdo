let currentUser = null;

async function initGuidePage() {
    try {
        currentUser = await getCurrentUser();

        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }
    } catch {
        window.location.href = "login.html";
        return;
    }

    const userBadge = document.getElementById("userBadge");
    if (userBadge) {
        userBadge.textContent = currentUser.username[0].toUpperCase();

        userBadge.onclick = async () => {
            const confirmExit = confirm("Выйти из аккаунта?");
            if (!confirmExit) return;

            try {
                await logoutUser();
            } catch (_) {}

            location.href = "login.html";
        };
    }

    renderMuscleGroups();
}

const exerciseDatabase = {
    "Грудь": [
        "Жим штанги лежа",
        "Жим гантелей лежа",
        "Жим штанги лежа на наклонной скамье",
        "Жим гантелей лежа на наклонной скамье"
    ],
    "Спина": [
        "Тяга хамера",
        "Подтягивания",
        "Тяга верхнего блока",
        "Тяга нижнего блока"
    ],
    "Плечи": [
        "Жим гантелей сидя",
        "Армейский жим",
        "Махи гантелями"
    ],
    "Руки": [
        "Подъем штанги на бицепс",
        "Подъем гантелей на бицепс",
        "Французский жим",
        "Разгибание рук в кроссовере"
    ],
    "Ноги": [
        "Жим ногами",
        "Разгибание ног в тренажере",
        "Сгибание ног в тренажере",
        "Подъем на носки с утяжелением"
    ],
    "Пресс": [
        "Скручивания в тренажере",
        "Скручивания на скамье"
    ]
};

const exerciseDetails = {
    "Жим штанги лежа": {
        image: "images/bench-press.jpg",
        description: "Базовое упражнение для развития грудных мышц, трицепсов и передних дельт. Выполняется лежа на скамье."
    },
    "Жим гантелей лежа": {
        image: "images/dumbbell-bench-press.jpg",
        description: "Упражнение на грудные мышцы с большей амплитудой движения, чем в жиме штанги."
    },
    "Жим штанги лежа на наклонной скамье": {
        image: "images/incline-barbell-press.jpg",
        description: "Смещает нагрузку на верхнюю часть грудных мышц и передние дельты."
    },
    "Жим гантелей лежа на наклонной скамье": {
        image: "images/incline-dumbbell-press.jpg",
        description: "Упражнение для верхней части грудных мышц с хорошей амплитудой и контролем."
    },

    "Тяга хамера": {
        image: "images/hammer-row.jpg",
        description: "Тяговое упражнение для широчайших и средней части спины. Позволяет изолированно нагрузить спину."
    },
    "Подтягивания": {
        image: "images/pull-ups.jpg",
        description: "Базовое упражнение с собственным весом для развития широчайших мышц спины и бицепса."
    },
    "Тяга верхнего блока": {
        image: "images/lat-pulldown.jpg",
        description: "Альтернатива подтягиваниям в тренажере. Развивает широчайшие мышцы спины."
    },
    "Тяга нижнего блока": {
        image: "images/seated-row.jpg",
        description: "Упражнение для средней части спины, ромбовидных и трапециевидных мышц."
    },

    "Жим гантелей сидя": {
        image: "images/seated-dumbbell-press.jpg",
        description: "Базовое упражнение для развития дельтовидных мышц, особенно переднего пучка."
    },
    "Армейский жим": {
        image: "images/military-press.jpg",
        description: "Жим штанги стоя. Развивает все пучки дельтовидных мышц и трицепсы."
    },
    "Махи гантелями": {
        image: "images/lateral-raises.jpg",
        description: "Изолированное упражнение для среднего пучка дельтовидных мышц."
    },

    "Подъем штанги на бицепс": {
        image: "images/barbell-curl.jpg",
        description: "Базовое упражнение для развития бицепса. Работает вся длина мышцы."
    },
    "Подъем гантелей на бицепс": {
        image: "images/dumbbell-curl.jpg",
        description: "Упражнение для бицепса с возможностью супинации кисти."
    },
    "Французский жим": {
        image: "images/french-press.jpg",
        description: "Упражнение для трицепса. Выполняется лежа со штангой или гантелями."
    },
    "Разгибание рук в кроссовере": {
        image: "images/triceps-pushdown.jpg",
        description: "Изолированное упражнение для трицепса в блочном тренажере."
    },

    "Жим ногами": {
        image: "images/leg-press.jpg",
        description: "Упражнение в тренажере для развития квадрицепсов, бицепса бедра и ягодиц."
    },
    "Разгибание ног в тренажере": {
        image: "images/leg-extension.jpg",
        description: "Изолированное упражнение для квадрицепсов."
    },
    "Сгибание ног в тренажере": {
        image: "images/leg-curl.jpg",
        description: "Изолированное упражнение для бицепса бедра."
    },
    "Подъем на носки с утяжелением": {
        image: "images/calf-raises.jpg",
        description: "Упражнение для развития икроножных мышц."
    },

    "Скручивания в тренажере": {
        image: "images/crunch-machine.jpg",
        description: "Упражнение для прямой мышцы живота в специальном тренажере."
    },
    "Скручивания на скамье": {
        image: "images/decline-crunches.jpg",
        description: "Классическое упражнение для пресса на наклонной скамье."
    }
};

const guideContainer = document.getElementById("guideContainer");

const modal = document.createElement("div");
modal.className = "exercise-modal";
modal.innerHTML = `
    <div class="modal-content">
        <button class="modal-close">✖</button>
        <h2 id="modalExerciseTitle"></h2>
        <img id="modalExerciseImage" src="" alt="Упражнение" style="max-width: 100%; border-radius: 8px; margin: 15px 0;">
        <p id="modalExerciseDescription" style="color: #ccc; line-height: 1.6;"></p>
    </div>
`;
document.body.appendChild(modal);

function openExerciseModal(exerciseName) {
    const details = exerciseDetails[exerciseName];

    if (details) {
        document.getElementById("modalExerciseTitle").textContent = exerciseName;
        document.getElementById("modalExerciseImage").src = details.image;
        document.getElementById("modalExerciseDescription").textContent = details.description;
    } else {
        document.getElementById("modalExerciseTitle").textContent = exerciseName;
        document.getElementById("modalExerciseImage").src = "images/placeholder.jpg";
        document.getElementById("modalExerciseDescription").textContent = "Описание пока не добавлено";
    }

    modal.style.display = "flex";
}

modal.querySelector(".modal-close").onclick = () => {
    modal.style.display = "none";
};

modal.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
};

function renderMuscleGroups() {
    guideContainer.innerHTML = "";

    for (const group in exerciseDatabase) {
        const card = document.createElement("div");
        card.className = "muscle-card";

        const title = document.createElement("h2");
        title.textContent = group;
        card.appendChild(title);

        const list = document.createElement("ul");
        list.className = "exercise-list";

        exerciseDatabase[group].forEach(exercise => {
            const item = document.createElement("li");
            item.textContent = exercise;
            item.onclick = () => openExerciseModal(exercise);
            list.appendChild(item);
        });

        card.appendChild(list);
        guideContainer.appendChild(card);
    }
}

initGuidePage();
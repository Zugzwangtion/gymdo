let currentUser = null;

async function initAddPage() {
    try {
        currentUser = await getCurrentUser();

        if (!currentUser) {
            location.href = "login.html";
            return;
        }
    } catch {
        location.href = "login.html";
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");

    if (dateParam) {
        document.getElementById("date").value = dateParam;
    } else {
        document.getElementById("date").valueAsDate = new Date();
    }
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

const exercisesContainer = document.getElementById("exercisesContainer");

function showMuscleGroups() {
    const selector = document.createElement("div");
    selector.className = "selector";

    for (const group in exerciseDatabase) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerText = group;
        btn.onclick = () => showExercises(group, selector);
        selector.appendChild(btn);
    }

    exercisesContainer.appendChild(selector);
}

function showExercises(group, selectorDiv) {
    selectorDiv.innerHTML = "";

    exerciseDatabase[group].forEach(exercise => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerText = exercise;
        btn.onclick = () => {
            addExercise(exercise);
            selectorDiv.remove();
        };
        selectorDiv.appendChild(btn);
    });

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.innerText = "Назад";
    backBtn.onclick = () => {
        selectorDiv.remove();
        showMuscleGroups();
    };
    selectorDiv.appendChild(backBtn);
}

function addExercise(name) {
    const exerciseDiv = document.createElement("div");
    exerciseDiv.className = "exercise";

    exerciseDiv.innerHTML = `
        <h3>${name}</h3>
        <div class="setsContainer"></div>
        <button type="button" onclick="addSet(this)">+ Подход</button>
        <button type="button" onclick="this.parentElement.remove()">Удалить упражнение</button>
    `;

    exercisesContainer.appendChild(exerciseDiv);
    addSet(exerciseDiv.querySelector("button"));
}

function addSet(button) {
    const exerciseDiv = button.closest(".exercise");
    const setsContainer = exerciseDiv.querySelector(".setsContainer");

    const lastSet = setsContainer.querySelector(".set:last-child");
    let weightValue = "";
    let repsValue = "";

    if (lastSet) {
        weightValue = lastSet.querySelector(".weight").value;
        repsValue = lastSet.querySelector(".reps").value;
    }

    const setDiv = document.createElement("div");
    setDiv.className = "set";

    setDiv.innerHTML = `
        <input type="number" step="0.25" min="0" placeholder="Вес" class="weight" value="${weightValue}" required>
        <input type="number" min="1" placeholder="Повторения" class="reps" value="${repsValue}" required>
        <button type="button" onclick="this.parentElement.remove()">✖</button>
    `;

    setsContainer.appendChild(setDiv);
}

document.getElementById("workoutForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const date = document.getElementById("date").value;
    const duration = parseInt(document.getElementById("duration").value, 10);

    const exercises = [];
    let totalTonnage = 0;

    document.querySelectorAll(".exercise").forEach(exDiv => {
        const name = exDiv.querySelector("h3").innerText;
        const sets = [];

        exDiv.querySelectorAll(".set").forEach(setDiv => {
            const weight = parseFloat(setDiv.querySelector(".weight").value);
            const reps = parseInt(setDiv.querySelector(".reps").value, 10);

            totalTonnage += weight * reps;
            sets.push({ weight, reps });
        });

        exercises.push({ name, sets });
    });

    if (exercises.length === 0) {
        alert("Добавь хотя бы одно упражнение");
        return;
    }

    const payload = {
        date,
        duration,
        tonnage: totalTonnage,
        exercises
    };

    try {
        await createWorkout(payload);
        window.location.href = "index.html";
    } catch (error) {
        alert(error.message || "Ошибка сохранения тренировки");
    }
});

function goBack() {
    window.location.href = "index.html";
}

initAddPage();
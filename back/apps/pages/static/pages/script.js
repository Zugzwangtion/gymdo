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

function formatNumber(value) {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) return "0";
    return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(2)));
}

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

function formatDate(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function requireAuth(message = "Чтобы пользоваться этой функцией, войдите в аккаунт.") {
    if (!elements.authPromptModal || !elements.authPromptText) {
        alert(message);
        return;
    }

    elements.authPromptText.textContent = message;
    elements.authPromptModal.style.display = "flex";
}

function closeAuthModal() {
    if (elements.authPromptModal) {
        elements.authPromptModal.style.display = "none";
    }
}

function closeModal() {
    if (elements.modal) {
        elements.modal.style.display = "none";
    }
}

function openModal() {
    if (elements.modal) {
        elements.modal.style.display = "flex";
    }
}

function goToAddPage(date = "") {
    if (!state.isAuthenticated) {
        requireAuth("Чтобы добавить тренировку, войдите в аккаунт.");
        return;
    }

    location.href = date ? `/add/?date=${date}` : "/add/";
}

function getDayWorkouts(dateString) {
    return state.workouts.filter((workout) => workout.date === dateString);
}

function createWorkoutIndicator() {
    const dot = document.createElement("span");
    dot.className = "day-indicator-dot";
    return dot;
}

function createCalendarDay(day, dateString, dayWorkouts) {
    const dayCell = document.createElement("div");
    dayCell.className = `day${dayWorkouts.length ? " workout" : ""}`;
    dayCell.textContent = String(day);

    if (dayWorkouts.length > 0) {
        const indicators = document.createElement("div");
        indicators.className = "day-indicators";
        dayWorkouts.forEach(() => indicators.appendChild(createWorkoutIndicator()));
        dayCell.appendChild(indicators);
    }

    dayCell.addEventListener("click", () => {
        if (!state.isAuthenticated) {
            requireAuth("Чтобы открыть календарь тренировок и добавлять занятия, войдите в аккаунт.");
            return;
        }

        if (dayWorkouts.length > 0) {
            showDayWorkouts(dateString, dayWorkouts);
            return;
        }

        goToAddPage(dateString);
    });

    return dayCell;
}

function renderCalendar() {
    const { calendarGrid, monthTitle } = elements;
    if (!calendarGrid || !monthTitle) {
        return;
    }

    calendarGrid.innerHTML = "";

    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    monthTitle.textContent = state.currentDate.toLocaleString("ru", {
        month: "long",
        year: "numeric"
    });

    for (let i = 0; i < offset; i += 1) {
        calendarGrid.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const dateString = formatDate(year, month + 1, day);
        const dayWorkouts = getDayWorkouts(dateString);
        calendarGrid.appendChild(createCalendarDay(day, dateString, dayWorkouts));
    }
}

function createInfoParagraph(text) {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
}

function showWorkoutDetails(workout) {
    if (!elements.modalContent) {
        return;
    }

    elements.modalContent.innerHTML = "";

    const title = document.createElement("h2");
    title.textContent = workout.date || "Без даты";

    elements.modalContent.append(
        title,
        createInfoParagraph(`Длительность: ${workout.duration ?? 0} мин`),
        createInfoParagraph(`Тоннаж: ${formatNumber(Number(workout.tonnage || 0) / 1000)} т`)
    );

    (workout.exercises || []).forEach((exercise) => {
        const exerciseTitle = document.createElement("h3");
        exerciseTitle.textContent = exercise.name || "Без названия";
        elements.modalContent.appendChild(exerciseTitle);

        (exercise.sets || []).forEach((set, index) => {
            const setDiv = document.createElement("div");
            setDiv.className = "workout-set";
            setDiv.textContent = `Подход ${index + 1}: ${set.weight ?? 0} кг × ${set.reps ?? 0}`;
            elements.modalContent.appendChild(setDiv);
        });
    });

    const spacer = document.createElement("br");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Удалить тренировку";
    deleteButton.addEventListener("click", () => deleteWorkout(workout.id, workout.date));

    elements.modalContent.append(spacer, deleteButton);
    openModal();
}

function showDayWorkouts(dateString, dayWorkouts) {
    if (!elements.modalContent) {
        return;
    }

    elements.modalContent.innerHTML = "";

    const title = document.createElement("h2");
    title.textContent = `${dateString} — тренировок: ${dayWorkouts.length}`;
    elements.modalContent.appendChild(title);

    dayWorkouts.forEach((workout, index) => {
        const card = document.createElement("div");
        card.className = "day-workout-card";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.textContent = "Открыть";
        openButton.addEventListener("click", () => showWorkoutDetails(workout));

        card.append(
            Object.assign(document.createElement("h3"), {
                textContent: `Тренировка ${index + 1}`
            }),
            createInfoParagraph(`Длительность: ${workout.duration ?? 0} мин`),
            createInfoParagraph(`Тоннаж: ${formatNumber(Number(workout.tonnage || 0) / 1000)} т`),
            openButton
        );

        elements.modalContent.appendChild(card);
    });

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "+ Добавить ещё тренировку";
    addButton.style.marginTop = "16px";
    addButton.addEventListener("click", () => goToAddPage(dateString));

    elements.modalContent.appendChild(addButton);
    openModal();
}

function getStats() {
    return state.workouts.reduce(
        (stats, workout) => {
            stats.totalWorkouts += 1;
            stats.totalTonnage += Number(workout.tonnage || 0);

            (workout.exercises || []).forEach((exercise) => {
                stats.totalExercises += 1;
                stats.totalSets += (exercise.sets || []).length;

                (exercise.sets || []).forEach((set) => {
                    stats.totalReps += Number(set.reps || 0);
                });
            });

            return stats;
        },
        {
            totalWorkouts: 0,
            totalExercises: 0,
            totalSets: 0,
            totalReps: 0,
            totalTonnage: 0
        }
    );
}

function updateStats() {
    const stats = getStats();

    if (elements.totalWorkouts) elements.totalWorkouts.textContent = String(stats.totalWorkouts);
    if (elements.totalExercises) elements.totalExercises.textContent = String(stats.totalExercises);
    if (elements.totalSets) elements.totalSets.textContent = String(stats.totalSets);
    if (elements.totalReps) elements.totalReps.textContent = String(stats.totalReps);
    if (elements.totalTonnage) elements.totalTonnage.textContent = `${formatNumber(stats.totalTonnage / 1000)} т`;
}

function renderChart() {
    if (!elements.chartCanvas || typeof Chart === "undefined") {
        return;
    }

    if (state.chartInstance) {
        state.chartInstance.destroy();
    }

    const sortedWorkouts = [...state.workouts].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    state.chartInstance = new Chart(elements.chartCanvas, {
        type: "line",
        data: {
            labels: sortedWorkouts.map((workout) => workout.date),
            datasets: [
                {
                    label: "Тоннаж, т",
                    data: sortedWorkouts.map((workout) => Number(workout.tonnage || 0) / 1000),
                    borderColor: "#4caf50",
                    tension: 0.3,
                    yAxisID: "yTonnage"
                },
                {
                    label: "Длительность (мин)",
                    data: sortedWorkouts.map((workout) => Number(workout.duration || 0)),
                    borderColor: "#ffeb3b",
                    tension: 0.3,
                    yAxisID: "yDuration"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    labels: {
                        color: "white"
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: "white"
                    }
                },
                yTonnage: {
                    type: "linear",
                    position: "left",
                    ticks: {
                        color: "#4caf50"
                    },
                    title: {
                        display: true,
                        text: "Тоннаж, т",
                        color: "#4caf50"
                    }
                },
                yDuration: {
                    type: "linear",
                    position: "right",
                    ticks: {
                        color: "#ffeb3b"
                    },
                    title: {
                        display: true,
                        text: "Минуты",
                        color: "#ffeb3b"
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

async function deleteWorkout(id, dateString) {
    if (!state.isAuthenticated) {
        return;
    }

    if (!confirm(`Удалить тренировку за ${dateString}?`)) {
        return;
    }

    try {
        await deleteWorkoutById(id);
        state.workouts = state.workouts.filter((workout) => workout.id !== id);
        updateStats();
        renderCalendar();
        renderChart();
        await loadMuscleMaps();
        closeModal();
    } catch (error) {
        alert(error.message || "Ошибка удаления тренировки");
    }
}

function updateAuthenticatedHeader() {
    if (elements.loginBtn) {
        elements.loginBtn.style.display = state.isAuthenticated ? "none" : "inline-flex";
    }

    if (elements.userBadge) {
        elements.userBadge.style.display = state.isAuthenticated ? "flex" : "none";

        if (state.isAuthenticated && state.currentUser) {
            elements.userBadge.textContent = state.currentUser.username[0].toUpperCase();
        }
    }

    if (elements.pageSubtitle) {
        elements.pageSubtitle.textContent = state.isAuthenticated
            ? "Следи за прогрессом, добавляй тренировки в календарь и анализируй свои результаты."
            : "Это главная страница GymDo. Чтобы сохранять тренировки, открывать справочник и пользоваться функциями приложения, войдите в аккаунт.";
    }
}

function bindEvents() {
    elements.closeModalButton?.addEventListener("click", closeModal);
    elements.closeAuthPrompt?.addEventListener("click", closeAuthModal);

    elements.profileLogoutBtn?.addEventListener("click", async () => {
        const confirmed = confirm("Выйти из аккаунта?");
        if (!confirmed) {
            return;
        }

        try {
            await logoutUser();
            state.currentUser = null;
            state.isAuthenticated = false;
            location.href = "/login/";
        } catch (error) {
            alert(error.message || "Не удалось выйти из аккаунта");
        }
    });

    elements.guideLink?.addEventListener("click", (event) => {
        if (!state.isAuthenticated) {
            event.preventDefault();
            requireAuth("Чтобы открыть справочник, войдите в аккаунт.");
        }
    });

    elements.userBadge?.addEventListener("click", (event) => {
        event.stopPropagation();
        if (state.isAuthenticated) {
            elements.userDropdown?.classList.toggle("show");
        }
    });

    elements.prevMonth?.addEventListener("click", () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderCalendar();
    });

    elements.nextMonth?.addEventListener("click", () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderCalendar();
    });

    window.addEventListener("click", (event) => {
        if (event.target === elements.modal) {
            closeModal();
        }

        if (event.target === elements.authPromptModal) {
            closeAuthModal();
        }

        if (!event.target.closest("#userMenuWrap")) {
            elements.userDropdown?.classList.remove("show");
        }
    });
}

async function loadUserAndWorkouts() {
    try {
        state.currentUser = await getCurrentUser();
        state.isAuthenticated = Boolean(state.currentUser);
    } catch {
        state.currentUser = null;
        state.isAuthenticated = false;
    }

    if (!state.isAuthenticated) {
        state.workouts = [];
        return;
    }

    try {
        state.workouts = await getWorkouts();
    } catch (error) {
        state.workouts = [];
        alert(error.message || "Не удалось загрузить тренировки");
    }
}

async function initPage() {
    bindEvents();
    await loadUserAndWorkouts();
    updateAuthenticatedHeader();
    renderCalendar();
    updateStats();
    renderChart();
    await loadMuscleMaps();
}

function parseWorkoutDate(dateString) {
    if (!dateString) return null;
    const date = new Date(`${dateString}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getLast7DaysWorkouts() {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    return state.workouts.filter((workout) => {
        const workoutDate = parseWorkoutDate(workout.date);
        return workoutDate && workoutDate >= start && workoutDate <= now;
    });
}

function calculateSetLoad(set) {
    const reps = Number(set?.reps || 0);
    const weight = Number(set?.weight || 0);

    if (weight > 0) {
        return reps * weight;
    }

    return reps || 1;
}

function normalizeMuscleKey(muscleKey) {
    const aliases = {
        "midback": "upperBack",
        "mid-back": "upperBack",
        "middle-back": "upperBack",
        "upper-back": "upperBack",
        "lower-back": "lowerBack"
    };

    return aliases[muscleKey] || muscleKey;
}

function buildMuscleLoadMap() {
    const loadMap = {};
    const recentWorkouts = getLast7DaysWorkouts();

    recentWorkouts.forEach((workout) => {
        (workout.exercises || []).forEach((exercise) => {
            const exerciseData = getExerciseByName(exercise.name);
            const muscles = exerciseData?.primaryMuscles || [];

            if (!muscles.length) {
                return;
            }

            const exerciseLoad = (exercise.sets || []).reduce((sum, set) => {
                return sum + calculateSetLoad(set);
            }, 0) || 1;

            muscles.forEach((rawMuscleKey) => {
                const muscleKey = normalizeMuscleKey(rawMuscleKey);

                if (!muscleSvgMap[muscleKey]) {
                    console.warn(`Нет muscleSvgMap для ключа: ${muscleKey}`);
                    return;
                }

                loadMap[muscleKey] = (loadMap[muscleKey] || 0) + exerciseLoad;
            });
        });
    });

    return loadMap;
}

function getMuscleIntensityClass(value, maxValue) {
    if (!value || !maxValue) return "";
    return "muscle-map-active";
}

function tryActivateSvgIds(svg, ids, className) {
    if (!svg || !ids?.length || !className) return;

    ids.forEach((id) => {
        const safeId = String(id).trim();
        const el = Array.from(svg.querySelectorAll("[id]"))
            .find((candidate) => candidate.id === id || candidate.id.trim() === safeId);

        if (el) {
            el.classList.add(className);
        }
    });
}

function renderLegend(loadMap) {
    if (!elements.muscleLegend) return;
    elements.muscleLegend.innerHTML = "";
}

function applyMuscleLoadToSvg(frontSvg, backSvg, loadMap) {
    const values = Object.values(loadMap);
    const maxValue = values.length ? Math.max(...values) : 0;

    Object.entries(loadMap).forEach(([muscleKey, value]) => {
        const config = muscleSvgMap[muscleKey];
        if (!config) return;

        const className = getMuscleIntensityClass(value, maxValue);

        if (config.front) {
            tryActivateSvgIds(frontSvg, config.front, className);
        }

        if (config.back) {
            tryActivateSvgIds(backSvg, config.back, className);
        }
    });
}

async function loadSvgIntoContainer(container, fileName) {
    if (!container) return null;

    try {
        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(`Не удалось загрузить ${fileName}`);
        }

        const svgText = await response.text();
        container.innerHTML = svgText;

        return container.querySelector("svg");
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="color:#f66;">Ошибка загрузки SVG</p>`;
        return null;
    }
}

async function loadMuscleMaps() {
    const frontSvg = await loadSvgIntoContainer(elements.frontMapContainer, "/static/pages/front-view.svg");
    const backSvg = await loadSvgIntoContainer(elements.backMapContainer, "/static/pages/back-view.svg");

    const loadMap = buildMuscleLoadMap();
    applyMuscleLoadToSvg(frontSvg, backSvg, loadMap);
    renderLegend(loadMap);
}

initPage();

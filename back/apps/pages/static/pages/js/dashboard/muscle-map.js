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


// Словарь терминов в этом файле:
// muscle - мышца.
// muscleKey - английский ключ мышцы, например chest, biceps, quads.
// load - нагрузка на мышцу.
// loadMap - объект "мышца -> нагрузка".
// frontSvg/backSvg - SVG-картинки тела спереди и сзади.
// intensity - интенсивность подсветки мышцы.

/**
 * Превращает дату тренировки из строки API в объект `Date`.
 * Backend отдает дату в формате `YYYY-MM-DD`, а для проверки "попадает ли тренировка в последние 7 дней"
 * удобнее работать с объектом даты. Если строка пустая или сломанная, возвращается `null`.
 */
function parseWorkoutDate(dateString) {
    if (!dateString) return null;
    const date = new Date(`${dateString}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Возвращает только тренировки за последние 7 дней.
 * Берет общий список из `state.workouts`, преобразует дату каждой тренировки через `parseWorkoutDate()`
 * и оставляет только те записи, которые находятся в диапазоне от начала шестого дня назад до текущего момента.
 * Именно этот список потом используется для карты мышечной нагрузки.
 */
function getLast7DaysWorkouts() {
    // Берем только последние 7 дней, потому что карта мышц показывает свежую нагрузку.
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    return state.workouts.filter((workout) => {
        const workoutDate = parseWorkoutDate(workout.date);
        return workoutDate && workoutDate >= start && workoutDate <= now;
    });
}

/**
 * Считает нагрузку одного подхода для карты мышц.
 * Если в подходе есть вес, нагрузка считается как `повторы * вес`. Если веса нет, используется количество
 * повторений, чтобы упражнения с собственным весом тоже влияли на подсветку. Если даже повторов нет,
 * возвращается `1`, чтобы упражнение не исчезало полностью из расчета.
 */
function calculateSetLoad(set) {
    // set - подход упражнения.
    // Если есть вес, нагрузка = повторы * вес.
    // Если веса нет, считаем хотя бы повторы, чтобы упражнение не пропало с карты.
    const reps = Number(set?.reps || 0);
    const weight = Number(set?.weight || 0);

    if (weight > 0) {
        return reps * weight;
    }

    return reps || 1;
}

/**
 * Приводит ключ мышцы к виду, который понимает SVG-карта.
 * В справочнике упражнения могут хранить похожие названия мышц разными ключами, например `mid-back`
 * и `upper-back`. Эта функция сводит такие варианты к одному ключу из `muscleSvgMap`, чтобы подсветка
 * нашла нужные элементы на SVG.
 */
function normalizeMuscleKey(muscleKey) {
    // aliases - словарь синонимов.
    // Например, mid-back и upper-back в итоге считаются одной зоной upperBack.
    const aliases = {
        "midback": "upperBack",
        "mid-back": "upperBack",
        "middle-back": "upperBack",
        "upper-back": "upperBack",
        "lower-back": "lowerBack"
    };

    return aliases[muscleKey] || muscleKey;
}

/**
 * Собирает нагрузку по мышцам для карты тела.
 * Берутся тренировки за последние 7 дней, каждое упражнение ищется в `exercisesDatabase`, а нагрузка подходов добавляется к основным мышцам.
 * Результат - объект вида `мышца -> нагрузка`, который потом применяется к SVG.
 */
function buildMuscleLoadMap() {
    // loadMap - итоговая карта нагрузки: ключ мышцы -> число нагрузки.
    const loadMap = {};

    // recentWorkouts - тренировки за последние 7 дней.
    const recentWorkouts = getLast7DaysWorkouts();

    recentWorkouts.forEach((workout) => {
        // workout - одна тренировка.
        (workout.exercises || []).forEach((exercise) => {
            // exerciseData - информация об упражнении из справочника exercises.js.
            const exerciseData = getExerciseByName(exercise.name);

            // muscles - основные мышцы, которые работают в этом упражнении.
            const muscles = exerciseData?.primaryMuscles || [];

            if (!muscles.length) {
                return;
            }

            // exerciseLoad - суммарная нагрузка одного упражнения по всем его подходам.
            const exerciseLoad = (exercise.sets || []).reduce((sum, set) => {
                return sum + calculateSetLoad(set);
            }, 0) || 1;

            muscles.forEach((rawMuscleKey) => {
                // rawMuscleKey - ключ мышцы как он записан в справочнике.
                // muscleKey - нормализованный ключ, который есть в muscleSvgMap.
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

/**
 * Выбирает CSS-класс подсветки для мышцы.
 * Сейчас логика простая: если у мышцы есть любая нагрузка, возвращается `muscle-map-active`.
 * Параметр `maxValue` уже передается сюда на будущее, чтобы можно было сделать разные уровни цвета
 * в зависимости от силы нагрузки.
 */
function getMuscleIntensityClass(value, maxValue) {
    if (!value || !maxValue) return "";
    return "muscle-map-active";
}

/**
 * Находит элементы внутри SVG по id и добавляет им CSS-класс подсветки.
 * `muscleSvgMap` хранит список id для каждой мышцы, а эта функция проходит по этим id и ищет реальные
 * SVG-элементы. `trim()` нужен как страховка, если в SVG у id случайно есть лишний пробел.
 */
function tryActivateSvgIds(svg, ids, className) { // svg - элемент SVG, внутри которого нужно найти элементы по id. ids - массив id, которые нужно подсветить. className - CSS-класс для подсветки.
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

/**
 * Обновляет легенду карты мышц.
 * Сейчас легенда просто очищается, потому что на странице используется только сама подсветка SVG.
 * Параметр `loadMap` оставлен для будущего варианта, где рядом с картой можно вывести список мышц
 * и численную нагрузку по каждой из них.
 */
function renderLegend(loadMap) {
    if (!elements.muscleLegend) return;
    elements.muscleLegend.innerHTML = "";
}

/**
 * Подсвечивает мышцы на SVG-картах.
 * Получает передний SVG, задний SVG и рассчитанную карту нагрузки.
 * Для каждой мышцы выбирается CSS-класс интенсивности, после чего нужные SVG-элементы получают этот класс.
 */
function applyMuscleLoadToSvg(frontSvg, backSvg, loadMap) {
    // values - все значения нагрузки, чтобы найти максимум.
    // maxValue нужен, если захочется делать разные уровни подсветки.
    const values = Object.values(loadMap);
    const maxValue = values.length ? Math.max(...values) : 0;

    Object.entries(loadMap).forEach(([muscleKey, value]) => {
        // config - настройки конкретной мышцы: какие id подсветить на SVG и как подписать.
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

/**
 * Загружает SVG-файл карты тела и вставляет его в нужный контейнер на странице.
 * Через `fetch()` получает текст SVG, кладет его в `container.innerHTML`, а затем возвращает сам элемент `<svg>`.
 * Это нужно, потому что подсветка работает не с картинкой целиком, а с внутренними SVG-элементами по id.
 * Если файл не загрузился, в контейнер выводится короткое сообщение об ошибке.
 */
async function loadSvgIntoContainer(container, fileName) { // container - HTML-элемент, куда нужно загрузить SVG. fileName - путь к SVG-файлу.
    if (!container) return null;

    try {
        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(`Не удалось загрузить ${fileName}`);
        }

        const svgText = await response.text();
        container.innerHTML = svgText; // Вставляем SVG внутрь контейнера. Это безопасно, потому что мы контролируем эти файлы и не вставляем произвольный HTML.

        return container.querySelector("svg");// Возвращаем сам элемент <svg>, чтобы потом работать с его содержимым.
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="color:#f66;">Ошибка загрузки SVG</p>`;
        return null;
    }
}

/**
 * Загружает и обновляет карту мышц на главной.
 * Сначала через `fetch()` вставляются SVG-файлы, потом считается нагрузка и применяется подсветка.
 * Если SVG не загрузился, ошибка логируется, а остальная страница продолжает работать.
 */
async function loadMuscleMaps() {
    const frontSvg = await loadSvgIntoContainer(elements.frontMapContainer, "/static/pages/front-view.svg");
    const backSvg = await loadSvgIntoContainer(elements.backMapContainer, "/static/pages/back-view.svg");

    const loadMap = buildMuscleLoadMap();
    applyMuscleLoadToSvg(frontSvg, backSvg, loadMap);
    renderLegend(loadMap);
}


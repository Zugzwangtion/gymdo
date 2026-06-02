// Словарь терминов в этом файле:
// guide - справочник упражнений.
// group - группа/категория упражнений.
// exerciseName - название упражнения.
// controls - элементы управления, например кнопки лайк/дизлайк.
// render - отрисовать/показать на странице.

let currentUser = null;

// reactionEventSource - SSE-соединение для live-обновления реакций.
let reactionEventSource = null;

// exerciseReactions - Map, где ключ это название упражнения, а значение это его лайки/дизлайки.
const exerciseReactions = new Map();

// guideContainer - контейнер, куда вставляются группы упражнений.
const guideContainer = document.getElementById("guideContainer");

// modal - модальное окно с картинкой и описанием упражнения.
const modal = createExerciseModal();

/**
 * Находит упражнение по названию в базе `exercises.js`.
 * Если helper `getExerciseByName()` недоступен, читает `exercisesDatabase` напрямую.
 */
function getExerciseByNameSafe(name) {
    if (typeof getExerciseByName === "function") {
        return getExerciseByName(name);
    }

    if (typeof exercisesDatabase !== "object" || !exercisesDatabase) {
        return null;
    }

    return exercisesDatabase[name] || null;
}

/**
 * Возвращает упражнения, сгруппированные по категориям.
 * Нужен для отрисовки карточек справочника.
 */
function getExercisesGroupedSafe() {
    if (typeof getExercisesGroupedByCategory === "function") {// Если функция для получения упражнений по категориям уже определена, используем ее. Это позволяет переопределить логику группировки, если это нужно, например, для сортировки или фильтрации.
        return getExercisesGroupedByCategory();// Если функции нет, пытаемся построить группировку на основе базы exercisesDatabase. Это обеспечивает базовую функциональность даже если более продвинутые функции не определены, и позволяет работать с данными в любом случае.
    }

    // grouped - объект "категория -> список упражнений".
    const grouped = {};

    if (typeof exercisesDatabase !== "object" || !exercisesDatabase) {// Если база упражнений недоступна, возвращаем пустой объект. Это предотвращает ошибки при попытке доступа к данным и позволяет странице работать даже без данных.
        return grouped;
    }

    Object.entries(exercisesDatabase).forEach(([name, exercise]) => {// Проходим по всем упражнениям в базе и группируем их по категории. Это создает структуру данных, которая потом используется для отображения упражнений на странице, сгруппированных по категориям.
        const category = exercise?.category || "Без категории";

        if (!grouped[category]) {// Если для категории еще нет списка упражнений, создаем его. Это гарантирует, что у каждой категории будет свой массив для хранения упражнений, и позволяет добавлять упражнения в правильные группы.
            grouped[category] = [];
        }

        grouped[category].push(name);// Добавляем название упражнения в соответствующую категорию. Это формирует итоговую структуру данных, которая потом используется для рендеринга справочника упражнений на странице.
    });

    return grouped;
}

/**
 * Создает блок кнопок лайка и дизлайка для одного упражнения.
 */
function createReactionControls(exerciseName) {// exerciseName - название упражнения. Эта функция создает HTML-элемент, содержащий кнопки для лайка и дизлайка упражнения. Эти кнопки позволяют пользователю взаимодействовать с упражнением, выражая свое отношение к нему, и отображают текущее состояние реакций.
    // controls - блок с двумя кнопками: нравится и не нравится.
    const controls = document.createElement("div");
    controls.className = "exercise-reactions";
    controls.append(
        createReactionButton(exerciseName, "like", "Нравится"),
        createReactionButton(exerciseName, "dislike", "Не нравится")
    );
    return controls;
}

/**
 * Создает строку упражнения в списке справочника.
 * По клику на строку открывается модальное окно с описанием.
 */
function createExerciseItem(exerciseName) {// exerciseName - название упражнения. Эта функция создает HTML-элемент для одного упражнения в списке, включая его название и кнопки реакций. Также добавляет обработчик клика для открытия модального окна с подробной информацией об упражнении.
    // item - один пункт списка упражнений.
    const item = document.createElement("li");
    item.dataset.exerciseName = exerciseName;

    const name = document.createElement("span");
    name.className = "exercise-name";
    name.textContent = exerciseName;

    item.append(name, createReactionControls(exerciseName));// Добавляем название упражнения и блок с кнопками реакций в элемент списка. Это формирует визуальное представление одного упражнения в списке, позволяя пользователю видеть его название и взаимодействовать с реакциями.
    item.addEventListener("click", () => openExerciseModal(exerciseName));
    return item;
}

/**
 * Создает карточку категории: заголовок группы и список упражнений внутри нее.
 */
function createGroupCard(groupName, exercises) {// groupName - название группы мышц/категории, exercises - список названий упражнений в этой группе. Эта функция создает HTML-структуру для отображения одной категории упражнений, включая заголовок и список упражнений с кнопками реакций.
    // groupName - название группы мышц/категории.
    // exercises - список названий упражнений в этой группе.
    const card = document.createElement("div");
    card.className = "muscle-card";

    const title = document.createElement("h2");
    title.textContent = groupName;

    const list = document.createElement("ul");
    list.className = "exercise-list";

    exercises
        .slice()
        .sort((a, b) => a.localeCompare(b, "ru"))
        .forEach((exerciseName) => {
            list.appendChild(createExerciseItem(exerciseName));// Для каждого упражнения в группе создаем пункт списка с кнопками реакций и добавляем его в общий список. Это формирует визуальное представление всех упражнений в данной категории, позволяя пользователю видеть их и взаимодействовать с ними.
        });

    card.append(title, list);
    return card;
}

/**
 * Рисует справочник упражнений по группам мышц.
 * Категории и упражнения берутся из `getExercisesGroupedSafe()`, затем каждая группа превращается в отдельный блок.
 * Внутри каждого упражнения добавляются кнопки реакций.
 */
function renderMuscleGroups() {
    if (!guideContainer) {
        return;
    }

    guideContainer.innerHTML = "";// guideContainer - это элемент на странице, куда мы вставляем все группы упражнений. Сначала очищаем его, чтобы не было дубликатов при повторном рендеринге.

    // groupedExercises - упражнения, разложенные по группам.
    const groupedExercises = getExercisesGroupedSafe();// getExercisesGroupedSafe() возвращает объект, где ключ это категория упражнения, а значение это массив названий упражнений в этой категории. Если функция недоступна, она пытается построить этот объект на основе exercisesDatabase. Если и его нет, возвращает пустой объект.

    Object.entries(groupedExercises)// Проходим по каждой категории и ее упражнениям, сортируем упражнения в алфавитном порядке и создаем для каждой категории отдельный блок на странице. Это формирует структуру справочника упражнений, где упражнения сгруппированы по категориям и отсортированы внутри каждой категории.
        .sort(([a], [b]) => a.localeCompare(b, "ru"))
        .forEach(([groupName, exercises]) => {
            guideContainer.appendChild(createGroupCard(groupName, exercises));// createGroupCard() создает HTML-структуру для одной категории упражнений, включая заголовок и список упражнений с кнопками реакций. Этот блок затем добавляется в общий контейнер guideContainer на странице.
        });

    applyAllReactionStates();// После рендеринга всех упражнений, применяем сохраненные состояния реакций (лайки/дизлайки) к соответствующим кнопкам. Это гарантирует, что при загрузке страницы пользователь увидит свои предыдущие реакции на упражнения.
}

/**
 * Проверяет, что у упражнений в `exercises.js` заполнены ключевые поля.
 * Ошибки выводятся в консоль, страницу эта проверка не блокирует.
 */
function validateExercisesDatabase() {
    if (typeof exercisesDatabase !== "object" || !exercisesDatabase) {
        console.warn("База exercisesDatabase не найдена");
        return;
    }

    Object.entries(exercisesDatabase).forEach(([name, exercise]) => {
        if (!exercise.category) {
            console.warn(`У упражнения "${name}" не указана категория`);
        }

        if (!exercise.description) {
            console.warn(`У упражнения "${name}" не указано описание`);
        }

        if (!exercise.image) {
            console.warn(`У упражнения "${name}" не указана картинка`);
        }
    });
}

/**
 * Стартовая функция справочника.
 * Проверяет авторизацию, рисует упражнения, загружает реакции и открывает SSE-поток.
 */
async function initGuidePage() {
    try {
        currentUser = await getCurrentUser();

        if (!currentUser) {
            redirectToLogin();
            return;
        }
    } catch {
        redirectToLogin();
        return;
    }

    bindUserMenu( //Инициализация пользовательского меню, передаем элементы для управления отображением и взаимодействием. Это позволяет показывать имя пользователя, управлять видимостью выпадающего меню и обрабатывать выход из аккаунта.
        document.getElementById("userDropdown"),
        document.getElementById("profileLogoutBtn"),
        document.getElementById("userBadge")
    );

    bindModalEvents();// Инициализация событий для модального окна упражнений. Это позволяет открывать окно с информацией об упражнении при клике на него и закрывать его при клике вне области или на кнопку закрытия.
    validateExercisesDatabase();// Проверка базы упражнений на наличие всех необходимых полей. Это помогает выявить ошибки в данных и гарантирует, что при отображении информации об упражнении будет достаточно данных для показа пользователю.
    renderMuscleGroups();// Рендеринг справочника упражнений по группам мышц. Это отображает на странице все упражнения, сгруппированные по категориям, и добавляет к каждому упражнению кнопки для лайков и дизлайков.
    await loadExerciseReactions();// Загрузка реакций на упражнения для текущего пользователя. Это позволяет отобразить, какие упражнения пользователь уже лайкнул или дизлайкнул, и установить правильное состояние кнопок реакций при рендеринге.
    startReactionStream();// Запуск SSE-соединения для получения live-обновлений реакций на упражнения. Это обеспечивает, что если другой пользователь изменит реакцию на упражнение, текущий пользователь увидит это изменение в реальном времени без необходимости обновлять страницу.

    window.addEventListener("beforeunload", stopReactionStream);// Добавление обработчика события для закрытия SSE-соединения при уходе со страницы. Это предотвращает утечки ресурсов и гарантирует, что соединение будет корректно закрыто, когда пользователь покинет страницу справочника упражнений.
}

initGuidePage();

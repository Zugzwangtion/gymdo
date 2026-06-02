/**
 * Считает разницу между текущим значением и прошлым значением.
 * Используется для подсказок прогресса: например, если сейчас вес больше, чем в прошлой тренировке,
 * рядом можно показать `+2.5`. Если сравнивать нечего или разницы нет, возвращается `null`.
 */
function getDelta(current, previous) {
    const a = Number(current || 0);
    const b = Number(previous || 0);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !a || !b) return null;
    const delta = Number((a - b).toFixed(2));
    return delta === 0 ? null : delta;
}

/**
 * Создает маленькую визуальную метку разницы с прошлой тренировкой.
 * Положительная разница получает класс `positive`, отрицательная - `negative`.
 * Если разницы нет, возвращается пустой текстовый узел, чтобы верстка не ломалась.
 */
function createDeltaBadge(delta) {
    if (delta == null) return document.createTextNode("");
    const badge = document.createElement("span");
    badge.className = `set-delta ${delta > 0 ? "positive" : "negative"}`;
    badge.textContent = `${delta > 0 ? "+" : ""}${formatNumber(delta)}`;
    return badge;
}

/**
 * Показывает или скрывает пустое состояние списка упражнений.
 * Если в `state.exercises` еще нет упражнений, пользователь видит блок-подсказку.
 * Как только упражнение добавлено, этот блок скрывается.
 */
function updateEmptyState() {
    if (elements.emptyExercisesState) {
        elements.emptyExercisesState.style.display = state.exercises.length > 0 ? "none" : "flex";
    }
}

/**
 * Открывает модальное окно выбора упражнения.
 * Перед показом вызывает `renderExercisePicker()`, чтобы список категорий и упражнений был свежим.
 */
function openExercisePicker() {
    if (!elements.exercisePickerModal) return;
    renderExercisePicker();
    elements.exercisePickerModal.style.display = "flex";
}

/**
 * Закрывает модальное окно выбора упражнения.
 * Состояние выбранных упражнений при этом не меняется, скрывается только HTML-модалка.
 */
function closeExercisePicker() {
    if (elements.exercisePickerModal) {
        elements.exercisePickerModal.style.display = "none";
    }
}

/**
 * Раскрывает или сворачивает категорию в окне выбора упражнения.
 * Названия раскрытых категорий хранятся в `state.expandedCategories`, поэтому после перерисовки
 * окно помнит, какие группы были открыты.
 */
function toggleCategory(categoryName) {
    if (state.expandedCategories.has(categoryName)) {
        state.expandedCategories.delete(categoryName);
    } else {
        state.expandedCategories.add(categoryName);
    }
    renderExercisePicker();
}

/**
 * Создает DOM-блок одной категории в выборе упражнения.
 * Внутри есть кнопка-заголовок категории и список упражнений. Клик по упражнению вызывает
 * `addExercise(exerciseName)`, после чего окно выбора закрывается.
 */
function createCategoryBlock(categoryName, exercises) {
    const groupBlock = document.createElement("div");
    groupBlock.className = "picker-group-card";

    const isOpen = state.expandedCategories.has(categoryName);
    const headerBtn = document.createElement("button");
    headerBtn.type = "button";
    headerBtn.className = `picker-group-toggle${isOpen ? " open" : ""}`;

    const groupName = document.createElement("span");
    groupName.textContent = categoryName;

    const arrow = document.createElement("span");
    arrow.className = "picker-group-arrow";
    arrow.textContent = "⌄";

    headerBtn.append(groupName, arrow);
    headerBtn.addEventListener("click", () => toggleCategory(categoryName));

    const exercisesList = document.createElement("div");
    exercisesList.className = "picker-exercises-list";
    exercisesList.style.display = isOpen ? "block" : "none";

    exercises.slice().sort((a, b) => a.localeCompare(b, "ru")).forEach((exerciseName) => {
        const exerciseBtn = document.createElement("button");
        exerciseBtn.type = "button";
        exerciseBtn.className = "picker-exercise-btn";
        exerciseBtn.textContent = exerciseName;
        exerciseBtn.addEventListener("click", () => {
            addExercise(exerciseName);
            closeExercisePicker();
        });
        exercisesList.appendChild(exerciseBtn);
    });

    groupBlock.append(headerBtn, exercisesList);
    return groupBlock;
}

/**
 * Перерисовывает содержимое модального окна выбора упражнения.
 * Берет упражнения из справочника через `getExercisesGroupedSafe()`, сортирует категории
 * и для каждой категории создает блок через `createCategoryBlock()`.
 */
function renderExercisePicker() {
    if (!elements.exercisePickerBody || !elements.pickerTitle || !elements.pickerSubtitle) return;

    elements.pickerTitle.textContent = "Выбери группу мышц";
    elements.pickerSubtitle.textContent = "Нажми на категорию, чтобы раскрыть упражнения.";
    elements.exercisePickerBody.innerHTML = "";

    Object.entries(getExercisesGroupedSafe())
        .sort(([a], [b]) => a.localeCompare(b, "ru"))
        .forEach(([categoryName, exercises]) => {
            elements.exercisePickerBody.appendChild(createCategoryBlock(categoryName, exercises));
        });
}

/**
 * Создает новый пустой подход для упражнения.
 * Можно передать стартовые значения веса и повторов, например из прошлого подхода.
 * Id создается временный, только для управления подходом на фронтенде.
 */
function createDefaultSet(values = {}) {
    return {
        // id - временный id подхода только для фронтенда.
        // В базе данных потом появится другой id, который создаст Django.
        id: generateId(),

        // reps - количество повторений.
        reps: values.reps ?? "",

        // weight - вес в килограммах.
        weight: values.weight ?? ""
    };
}

/**
 * Создает стартовый список подходов для нового упражнения.
 * Если такое упражнение уже выполнялось раньше, создается столько пустых подходов,
 * сколько было в прошлый раз. Если истории нет, создается один пустой подход.
 */
function createSetsFromPrevious(previous) {
    const previousSets = previous?.exercise?.sets || [];
    if (!previousSets.length) return [createDefaultSet()];
    return previousSets.map(() => createDefaultSet());
}

/**
 * Подбирает значения, которые можно подставить в новый подход.
 * Сначала берет последний уже заполненный подход текущего упражнения. Если его нет,
 * смотрит прошлую тренировку с этим упражнением и берет подход с тем же номером или последний прошлый подход.
 */
function getReusableSetValues(exercise) {
    const filledCurrentSets = exercise.sets.filter((set) => {
        return set.weight !== "" || set.reps !== "";
    });
    const lastCurrentSet = filledCurrentSets[filledCurrentSets.length - 1];

    if (lastCurrentSet) {
        return {
            weight: lastCurrentSet.weight,
            reps: lastCurrentSet.reps
        };
    }

    const previousSets = exercise.previous?.exercise?.sets || [];
    const sameIndexPreviousSet = previousSets[exercise.sets.length];
    const lastPreviousSet = previousSets[previousSets.length - 1];
    const source = sameIndexPreviousSet || lastPreviousSet;

    if (!source) {
        return {};
    }

    return {
        weight: source.weight ?? "",
        reps: source.reps ?? ""
    };
}

/**
 * Добавляет выбранное упражнение в текущее состояние формы.
 * Название приходит из окна выбора, затем создается объект упражнения с временным `id` и стартовыми подходами.
 * После изменения `state.exercises` вызывается перерисовка карточек.
 */
function addExercise(exerciseName) {
    const exerciseData = getExerciseByNameSafe(exerciseName);
    const previous = getPreviousExercise(exerciseName);

    state.exercises.push({
        // id - временный id упражнения на странице.
        id: generateId(),

        // name - название упражнения, например "Жим штанги лежа".
        name: exerciseName,

        // category - группа/категория упражнения, например "Грудь".
        category: exerciseData?.category || "Упражнение",

        // image - картинка упражнения из справочника.
        image: exerciseData?.image || "",

        // previous - предыдущая тренировка с таким же упражнением.
        // Нужна для подсказок "какой вес/повторы были в прошлый раз".
        previous,

        // sets - подходы упражнения.
        sets: createSetsFromPrevious(previous)
    });

    renderExercises();
}

/**
 * Удаляет упражнение из текущей формы.
 * По временному `exerciseId` фильтрует `state.exercises`, оставляя все остальные упражнения,
 * затем перерисовывает список карточек.
 */
function removeExercise(exerciseId) {
    state.exercises = state.exercises.filter((exercise) => exercise.id !== exerciseId);
    renderExercises();
}

/**
 * Добавляет новый подход к конкретному упражнению.
 * Упражнение ищется по `exerciseId`, а значения нового подхода по возможности копируются из предыдущего подхода или прошлой тренировки.
 * Так пользователю не нужно каждый раз заново вводить похожие веса и повторы.
 */
function addSet(exerciseId) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;
    exercise.sets.push(createDefaultSet(getReusableSetValues(exercise)));
    renderExercises();
}

/**
 * Удаляет подход из конкретного упражнения.
 * Если подход был последним, вместо полного удаления создается новый пустой подход,
 * чтобы карточка упражнения не осталась вообще без строк для ввода.
 */
function removeSet(exerciseId, setId) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;

    if (exercise.sets.length === 1) {
        exercise.sets = [createDefaultSet()];
    } else {
        exercise.sets = exercise.sets.filter((set) => set.id !== setId);
    }

    renderExercises();
}

/**
 * Обновляет одно поле подхода в `state.exercises`.
 * По `exerciseId` и `setId` находится нужный подход, а `field` показывает, что меняем: вес, повторы или усилие.
 * После изменения состояние снова отрисовывается на странице.
 */
function updateSetValue(exerciseId, setId, field, value) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    const set = exercise?.sets.find((item) => item.id === setId);
    if (!set) return;
    set[field] = value;
}

/**
 * Создает старый вариант ячейки значения подхода.
 * Функция оставлена как вспомогательная/резервная: она показывает текущее значение,
 * а если оно пустое, подставляет прошлое значение и рядом добавляет delta-бейдж.
 */
function oldCreateValueCell(currentValue, previousValue, delta) {
    const cell = document.createElement("div");
    cell.className = currentValue === "" || currentValue == null ? "set-value muted" : "set-value";

    const main = document.createElement("span");
    main.textContent = currentValue === "" || currentValue == null
        ? formatNumber(previousValue || 0)
        : formatNumber(currentValue);

    cell.append(main, createDeltaBadge(delta));
    return cell;
}

/**
 * Открывает старый модальный редактор подхода.
 * По id упражнения и подхода находит нужные данные в `state.exercises`,
 * записывает их в `state.editing` и вызывает `renderSetEditor()`.
 */
function oldOpenSetEditor(exerciseId, setId) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    const setIndex = exercise?.sets.findIndex((item) => item.id === setId) ?? -1;
    if (!exercise || setIndex < 0) return;

    state.editing = { exerciseId, setId };
    renderSetEditor(exercise, exercise.sets[setIndex], setIndex);
}

/**
 * Изменяет числовое поле подхода на шаг вверх или вниз.
 * `field` выбирает, что меняем: `weight` или `reps`, а `delta` задает величину шага.
 * После изменения карточки перерисовываются, чтобы новое значение сразу появилось в интерфейсе.
 */
function stepSetValue(exerciseId, setId, field, delta) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    const set = exercise?.sets.find((item) => item.id === setId);
    if (!set) return;

    const current = Number(set[field] || 0);
    const nextValue = Math.max(0, Number((current + delta).toFixed(2)));
    set[field] = nextValue === 0 ? "" : String(nextValue);
    renderExercises();
}

/**
 * Создает компактный степпер прямо в строке подхода.
 * Внутри есть кнопка минус, input, delta-подсказка и кнопка плюс.
 * Любое изменение записывается обратно в `state.exercises` через `updateSetValue()` или `stepSetValue()`.
 */
function createInlineStepper(exercise, set, field, previousValue, step) {
    const wrap = document.createElement("div");
    wrap.className = "inline-set-stepper";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.className = "inline-step-button";
    minus.textContent = "-";
    minus.addEventListener("click", () => stepSetValue(exercise.id, set.id, field, -step));

    const inputWrap = document.createElement("label");
    inputWrap.className = set[field] === "" || set[field] == null ? "inline-set-value muted" : "inline-set-value";

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = String(step);
    input.value = set[field];
    input.placeholder = previousValue ? formatNumber(previousValue) : "0";
    input.addEventListener("input", (event) => {
        updateSetValue(exercise.id, set.id, field, event.target.value);
        inputWrap.classList.toggle("muted", !event.target.value);
    });
    input.addEventListener("change", renderExercises);

    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "inline-step-button";
    plus.textContent = "+";
    plus.addEventListener("click", () => stepSetValue(exercise.id, set.id, field, step));

    inputWrap.append(minus, input, createDeltaBadge(getDelta(set[field], previousValue)), plus);
    wrap.append(inputWrap);
    return wrap;
}

/**
 * Создает маленький номер подхода в строке упражнения.
 * Номер берется из индекса подхода в массиве, поэтому первый подход отображается как `1`.
 */
function createSetBadge(set, index) {
    const badge = document.createElement("div");
    badge.className = "set-badge";
    badge.textContent = String(index + 1);
    return badge;
}

/**
 * Создает строку одного подхода внутри карточки упражнения.
 * Здесь появляются степперы веса/повторов, отметка выполнения и кнопки редактирования/удаления.
 * Функция связывает визуальные кнопки с изменением данных через `updateSetValue()` и другие обработчики.
 */
function createSetRow(exercise, set, index) {
    const previousSet = getPreviousSet(exercise, index);
    const row = document.createElement("div");
    row.className = `set-row live-set-row${set.completedAt ? " completed" : ""}`;

    const badge = createSetBadge(set, index);
    const weightCell = createInlineStepper(exercise, set, "weight", previousSet?.weight, 0.5);
    const repsCell = createInlineStepper(exercise, set, "reps", previousSet?.reps, 1);

    const setActions = document.createElement("div");
    setActions.className = "set-row-actions";

    const doneButton = document.createElement("button");
    doneButton.type = "button";
    doneButton.className = "finish-set-button";
    doneButton.textContent = "✓";
    doneButton.title = "Завершить подход";
    doneButton.addEventListener("click", () => finishSet(exercise.id, set.id));

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "remove-set-inline";
    editButton.textContent = "×";
    editButton.title = "Удалить подход";
    editButton.addEventListener("click", () => removeSet(exercise.id, set.id));

    if (state.mode === "execution") {
        setActions.append(doneButton);
    }
    setActions.append(editButton);
    row.append(badge, weightCell, repsCell, setActions);
    return row;
}

/**
 * Считает краткую статистику по одному упражнению.
 * Возвращает количество заполненных подходов, общее количество подходов, тоннаж, повторы
 * и тоннаж прошлого выполнения упражнения, чтобы карточка могла показать текущий прогресс.
 */
function calculateExerciseStats(exercise) {
    const sets = exercise.sets.filter((set) => Number(set.weight || 0) > 0 || Number(set.reps || 0) > 0);
    const tonnage = sets.reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0);
    const reps = sets.reduce((sum, set) => sum + Number(set.reps || 0), 0);
    const previousSets = exercise.previous?.exercise?.sets || [];
    const previousTonnage = previousSets.reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0);

    return { sets: sets.length, totalSets: exercise.sets.length, tonnage, reps, previousTonnage };
}

/**
 * Создает DOM-карточку одного упражнения.
 * Внутри собираются заголовок, статистика, список подходов и кнопки управления.
 * На вход приходит объект упражнения из `state.exercises`, поэтому карточка всегда отражает текущее состояние формы.
 */
function createExerciseCard(exercise) {
    const card = document.createElement("div");
    card.className = "exercise-card tracking-exercise-card";

    const header = document.createElement("div");
    header.className = "tracking-exercise-header";

    const image = document.createElement("div");
    image.className = "exercise-thumb";
    if (exercise.image) image.style.backgroundImage = `url("${exercise.image}")`;

    const titleWrap = document.createElement("div");
    titleWrap.className = "tracking-title-wrap";

    const title = document.createElement("h3");
    title.textContent = exercise.name;

    const subtitle = document.createElement("p");
    subtitle.textContent = exercise.previous?.workout?.date
        ? `Предыдущая: ${exercise.previous.workout.date}`
        : "Раньше не выполнялось";

    titleWrap.append(title, subtitle);

    const removeExerciseButton = document.createElement("button");
    removeExerciseButton.type = "button";
    removeExerciseButton.className = "remove-exercise-button compact";
    removeExerciseButton.textContent = "в‹®";
    removeExerciseButton.title = "Удалить упражнение";
    removeExerciseButton.addEventListener("click", (event) => {
        event.stopPropagation();
        removeExercise(exercise.id);
    });

    header.append(image, titleWrap, removeExerciseButton);

    if (exercise.isCollapsed) {
        card.classList.add("collapsed-exercise-card");
        header.addEventListener("click", () => reopenExercise(exercise.id));
        card.append(header);
        return card;
    }

    const setsTitle = document.createElement("div");
    setsTitle.className = "sets-title";
    setsTitle.textContent = "Подходы";

    const setsHeader = document.createElement("div");
    setsHeader.className = "setsHeader tracking-sets-header";
    setsHeader.innerHTML = `
        <span>№</span>
        <span>Вес, кг</span>
        <span>Повторения</span>
        <span></span>
    `;

    const setsContainer = document.createElement("div");
    setsContainer.className = "setsContainer tracking-sets-container";
    exercise.sets.forEach((set, index) => {
        setsContainer.appendChild(createSetRow(exercise, set, index));
    });

    const stats = calculateExerciseStats(exercise);
    const statsBlock = document.createElement("div");
    statsBlock.className = "exercise-live-stats";
    statsBlock.innerHTML = `
        <span>${formatWeight(stats.tonnage / 1000)} т • ${stats.sets} / ${stats.totalSets} • ${stats.reps}</span>
        <span class="${stats.previousTonnage ? "muted-red" : ""}">${stats.previousTonnage ? `${formatWeight(stats.previousTonnage / 1000)} т пред.` : "нет истории"}</span>
    `;

    const actions = document.createElement("div");
    actions.className = "tracking-actions";

    const finishExerciseButton = document.createElement("button");
    finishExerciseButton.type = "button";
    finishExerciseButton.className = "finish-exercise-button";
    finishExerciseButton.textContent = "Завершить упражнение";
    finishExerciseButton.addEventListener("click", () => finishExercise(exercise.id));

    const addSetButton = document.createElement("button");
    addSetButton.type = "button";
    addSetButton.className = "add-set-button compact-add-set";
    addSetButton.textContent = "+";
    addSetButton.title = "Добавить подход";
    addSetButton.addEventListener("click", () => addSet(exercise.id));

    if (state.mode === "execution") {
        actions.append(finishExerciseButton);
    }
    actions.append(addSetButton);
    card.append(header, setsTitle, setsHeader, setsContainer, statsBlock, actions);
    return card;
}

/**
 * Перерисовывает весь список упражнений на странице добавления.
 * Берет данные из `state.exercises`, создает карточки через `createExerciseCard()` и вставляет их в контейнер.
 * Это основной способ синхронизировать состояние JavaScript с тем, что видит пользователь.
 */
function renderExercises() {
    if (!elements.exercisesContainer) return;
    elements.exercisesContainer.innerHTML = "";
    state.exercises.forEach((exercise) => {
        elements.exercisesContainer.appendChild(createExerciseCard(exercise));
    });
    updateEmptyState();
}

/**
 * Создает DOM-элемент модального редактора подхода, если его еще нет.
 * Редактор добавляется в `document.body` один раз, а дальше переиспользуется,
 * чтобы не создавать новую модалку при каждом открытии.
 */
function createEditorIfNeeded() {
    let editor = document.getElementById("setEditorModal");
    if (editor) return editor;

    editor = document.createElement("div");
    editor.id = "setEditorModal";
    editor.className = "set-editor-modal";
    document.body.appendChild(editor);
    return editor;
}

/**
 * Закрывает модальный редактор подхода.
 * Скрывает HTML-элемент редактора и очищает `state.editing`, чтобы приложение больше
 * не считало какой-то подход открытым для редактирования.
 */
function closeSetEditor() {
    const editor = document.getElementById("setEditorModal");
    if (editor) editor.style.display = "none";
    state.editing = null;
}

/**
 * Возвращает число после изменения на заданный шаг.
 * Используется в модальном редакторе подхода для кнопок плюс/минус.
 * Значение не может стать меньше `min`.
 */
function stepNumber(value, delta, min = 0) {
    const current = Number(value || 0);
    return Math.max(min, Number((current + delta).toFixed(2)));
}

/**
 * Рисует модальный редактор одного подхода.
 * Внутри создаются степперы веса и повторов, подсказки из прошлого подхода,
 * текущая статистика подхода и кнопка удаления. Все изменения сразу пишутся в `state.exercises`.
 */
function renderSetEditor(exercise, set, index) {
    const previousSet = getPreviousSet(exercise, index);
    const editor = createEditorIfNeeded();
    editor.innerHTML = "";
    editor.style.display = "flex";

    const panel = document.createElement("div");
    panel.className = "set-editor-panel";

    const header = document.createElement("div");
    header.className = "set-editor-header";

    const titleBlock = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = `Подход ${index + 1}`;
    const subtitle = document.createElement("p");
    subtitle.textContent = exercise.name;
    titleBlock.append(title, subtitle);

    const doneButton = document.createElement("button");
    doneButton.type = "button";
    doneButton.className = "set-editor-done";
    doneButton.textContent = "✓";
    doneButton.addEventListener("click", closeSetEditor);
    header.append(titleBlock, doneButton);

    const makeStepper = (label, field, step, fullText = "") => {
        const section = document.createElement("section");
        section.className = "set-editor-section";

        const sectionLabel = document.createElement("div");
        sectionLabel.className = "set-editor-label";
        sectionLabel.textContent = label;

        const controls = document.createElement("div");
        controls.className = "stepper";

        const minus = document.createElement("button");
        minus.type = "button";
        minus.textContent = "−";

        const value = document.createElement("input");
        value.type = "number";
        value.min = "0";
        value.step = String(step);
        value.value = set[field] || "";
        value.placeholder = previousSet?.[field] ? formatNumber(previousSet[field]) : "0";

        const plus = document.createElement("button");
        plus.type = "button";
        plus.textContent = "+";

        const sync = (newValue) => {
            updateSetValue(exercise.id, set.id, field, newValue === "" ? "" : String(newValue));
            renderExercises();
            renderSetEditor(exercise, set, index);
        };

        minus.addEventListener("click", () => sync(stepNumber(set[field], -step)));
        plus.addEventListener("click", () => sync(stepNumber(set[field], step)));
        value.addEventListener("input", (event) => {
            updateSetValue(exercise.id, set.id, field, event.target.value);
            renderExercises();
        });

        controls.append(minus, value, plus);
        section.append(sectionLabel, controls);

        if (fullText) {
            const hint = document.createElement("p");
            hint.className = "set-editor-hint";
            hint.textContent = fullText;
            section.appendChild(hint);
        }

        return section;
    };

    const stats = document.createElement("section");
    stats.className = "set-editor-section editor-stats";
    const tonnage = Number(set.weight || 0) * Number(set.reps || 0);
    stats.innerHTML = `<strong>Статистика</strong><span>Тоннаж: ${formatWeight(tonnage / 1000)} т</span>`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "editor-remove-set";
    removeButton.textContent = "Удалить подход";
    removeButton.addEventListener("click", () => {
        removeSet(exercise.id, set.id);
        closeSetEditor();
    });

    panel.append(
        header,
        makeStepper("Вес, кг", "weight", 0.5, previousSet?.weight ? `Прошлый вес: ${formatWeight(previousSet.weight)} кг` : ""),
        makeStepper("Повторения", "reps", 1, previousSet?.reps ? `Прошлые повторы: ${formatNumber(previousSet.reps)}` : ""),
        stats,
        removeButton
    );

    editor.appendChild(panel);
    editor.addEventListener("click", (event) => {
        if (event.target === editor) closeSetEditor();
    }, { once: true });
}

/**
 * Главная функция сохранения тренировки.
 * Она отменяет обычную отправку формы, проверяет поля, собирает payload, вызывает `createWorkout()` и после успеха возвращает пользователя на главную.
 * Это точка, где данные из браузера впервые уходят на backend.
 */
async function handleSubmit(event) {
    event.preventDefault();//останавливаем стандартную отправку формы
    if (!validateWorkoutForm()) return; //проверяем что форма заполнена правильно

    // берет внутреннее состояние формы и делает из него чистые данные для сервера.
    const exercises = collectExercisesPayload();
    
    //собираем тренировку в json 
    // payload - итоговый объект тренировки, который отправляется в `createWorkout()`.
    // date - дата тренировки.
    // duration - длительность в минутах.
    // tonnage - общий тоннаж: вес * повторы по всем подходам.
    // exercises - упражнения с подходами.
    const payload = {
        date: elements.dateInput.value, //elements.dateInput это ссылка на HTML-поле даты. Она задана в form-state.js
        duration: getWorkoutDurationMinutes(),
        tonnage: calculateTonnage(exercises),
        exercises
    };

    try {
        if (state.mode === "execution") {
            stopExecutionTimer(); //Если тренировка была в режиме выполнения с таймером, таймер надо остановить перед сохранением
        }
        await createWorkout(payload); //отправляем данные на сервер через createWorkout()
        alert("Тренировка сохранена");
        window.location.href = "/"; //после успешного сохранения возвращаемся на главную страницу
    } catch (error) {
        if (state.mode === "execution") {
            startExecutionTimer();
        }
        alert(error.message || "Ошибка сохранения тренировки");
    }
}

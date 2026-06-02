// Словарь терминов в этом файле:
// reaction - реакция пользователя на упражнение.
// like - нравится.
// dislike - не нравится.
// user_reaction - какую реакцию поставил текущий пользователь.
// likes/dislikes - общее количество лайков/дизлайков.
// EventSource/SSE - постоянное соединение, через которое backend присылает обновления без перезагрузки страницы.

/**
 * Возвращает реакцию упражнения из frontend-хранилища.
 * Если реакции еще нет, возвращает нули и `user_reaction: null`.
 */
function getReactionState(exerciseName) {
    // exerciseName - название упражнения.
    // Если реакции еще нет, возвращаем пустое состояние с нулевыми счетчиками.
    return exerciseReactions.get(exerciseName) || {
        likes: 0,
        dislikes: 0,
        user_reaction: null
    };
}

/**
 * Сохраняет одну реакцию в `exerciseReactions`.
 * Ключ Map - название упражнения, значение - лайки, дизлайки и реакция пользователя.
 */
function setReactionState(reaction) {
    // reaction - объект с backend.
    // Обычно внутри: exercise_name, likes, dislikes, user_reaction.
    if (!reaction?.exercise_name) {
        return;
    }

    exerciseReactions.set(reaction.exercise_name, {
        // likes - сколько пользователей поставили "нравится".
        likes: reaction.likes || 0,

        // dislikes - сколько пользователей поставили "не нравится".
        dislikes: reaction.dislikes || 0,

        // user_reaction - реакция текущего пользователя: like, dislike или null.
        user_reaction: reaction.user_reaction || null
    });
}

/**
 * Обновляет кнопки лайка/дизлайка у одного упражнения:
 * счетчики и активное состояние выбранной реакции.
 */
function applyReactionState(exerciseName) {
    // state здесь - не общий state страницы, а состояние реакций конкретного упражнения.
    const state = getReactionState(exerciseName);// Получаем текущее состояние реакций для данного упражнения из локального словаря. Это включает в себя количество лайков, дизлайков и реакцию текущего пользователя.
    const item = Array.from(guideContainer?.querySelectorAll("[data-exercise-name]") || [])
        .find((element) => element.dataset.exerciseName === exerciseName);

    if (!item) {
        return;
    }

    const likeButton = item.querySelector('[data-reaction-value="like"]');
    const dislikeButton = item.querySelector('[data-reaction-value="dislike"]');
    const likeCount = item.querySelector('[data-reaction-count="like"]');
    const dislikeCount = item.querySelector('[data-reaction-count="dislike"]');

    if (likeCount) {
        likeCount.textContent = String(state.likes);
    }

    if (dislikeCount) {
        dislikeCount.textContent = String(state.dislikes);
    }

    likeButton?.classList.toggle("active", state.user_reaction === "like");
    dislikeButton?.classList.toggle("active", state.user_reaction === "dislike");
}

/**
 * Применяет все сохраненные реакции к кнопкам на странице.
 */
function applyAllReactionStates() {
    exerciseReactions.forEach((_, exerciseName) => applyReactionState(exerciseName));
}

/**
 * Принимает ответ backend с реакциями, обновляет Map и перерисовывает кнопки.
 */
function applyExerciseReactions(data) {
    exerciseReactions.clear();

    (data?.reactions || []).forEach(setReactionState);
    applyAllReactionStates();
}

/**
 * GET /api/workouts/exercise-reactions/
 * Загружает счетчики лайков/дизлайков при открытии справочника.
 */
async function loadExerciseReactions() {
    try {
        applyExerciseReactions(await getExerciseReactions());
    } catch (error) {
        console.warn(error.message || "Не удалось загрузить реакции");
    }
}

/**
 * POST /api/workouts/exercise-reactions/vote/
 * Отправляет выбранный лайк/дизлайк и применяет ответ backend к кнопкам.
 */
async function handleReactionClick(exerciseName, value) {
    try {
        const reaction = await voteExerciseReaction(exerciseName, value);// voteExerciseReaction() отправляет POST-запрос на backend с названием упражнения и типом реакции, получает обновленные данные по реакциям и возвращает их. Эти данные затем сохраняются в локальном состоянии и применяются к кнопкам на странице.
        setReactionState(reaction);// Обновляем локальное состояние реакций для данного упражнения на основе ответа от backend. Это гарантирует, что после клика пользователя, отображаемые счетчики и активные кнопки будут соответствовать текущему состоянию на сервере.
        applyReactionState(exerciseName);// Применяем обновленное состояние реакций к кнопкам на странице, чтобы визуально отразить изменения после клика пользователя. Это позволяет пользователю сразу видеть результат своего действия, а также обновленные счетчики лайков и дизлайков.
    } catch (error) {
        alert(error.message || "Не удалось сохранить реакцию");
    }
}

/**
 * Создает кнопку лайка или дизлайка.
 * Сама запрос не делает: по клику вызывает `handleReactionClick()`.
 */
function createReactionButton(exerciseName, value, label) {
    // value - тип реакции: "like" или "dislike".
    // label - текстовое описание кнопки для доступности.
    const button = document.createElement("button");// Создаем кнопку для реакции, устанавливаем ее тип, класс и дата-атрибуты для идентификации. Внутри кнопки будет иконка и счетчик.
    button.type = "button";
    button.className = "reaction-btn";// Класс для стилизации кнопки.
    button.dataset.reactionValue = value;// Дата-атрибут для определения типа реакции при клике.


    const icon = document.createElement("span");// Иконка для визуального обозначения типа реакции: 👍 для лайка и 👎 для дизлайка. Это делает интерфейс более интуитивным и привлекательным для пользователя.
    icon.className = "reaction-icon";
    icon.textContent = value === "like" ? "👍" : "👎";

    const count = document.createElement("span");// Счетчик для отображения количества лайков или дизлайков. Изначально показывает 0, но будет обновляться при загрузке данных и при кликах пользователя.
    count.className = "reaction-count";
    count.dataset.reactionCount = value;
    count.textContent = "0";

    button.append(icon, count);// Добавляем иконку и счетчик внутрь кнопки.
    button.addEventListener("click", (event) => {// При клике на кнопку реакции, останавливаем всплытие события, чтобы не открывалось модальное окно упражнения. Затем вызываем функцию обработки клика, передавая название упражнения и тип реакции. Это позволяет пользователю выразить свое отношение к упражнению, а изменения сразу сохраняются на backend и отображаются на странице.
        event.stopPropagation();
        handleReactionClick(exerciseName, value);// handleReactionClick() отправляет запрос на backend с названием упражнения и выбранной реакцией, получает обновленные данные по реакциям и обновляет состояние и внешний вид кнопок на странице.
    });

    return button;
}

/**
 * Закрывает SSE-соединение реакций.
 */
function stopReactionStream() {
    if (reactionEventSource) {
        reactionEventSource.close();
        reactionEventSource = null;
    }
}

/**
 * GET /api/workouts/exercise-reactions/stream/
 * Открывает SSE-поток, который присылает обновления счетчиков без перезагрузки.
 */
function startReactionStream() { // Перед открытием нового соединения, закрываем старое, если оно есть. Это предотвращает утечки ресурсов и дублирование обновлений, если функция вызывается несколько раз.
    stopReactionStream();

    if (typeof EventSource !== "function") {
        console.warn("Браузер не поддерживает SSE");
        return;
    }

    reactionEventSource = createExerciseReactionsStream();

    reactionEventSource.addEventListener("reactions", (event) => {
        try {
            applyExerciseReactions(JSON.parse(event.data));
        } catch (error) {
            console.warn(error.message || "Не удалось разобрать обновление реакций");
        }
    });

    reactionEventSource.addEventListener("error", () => {
        console.warn("SSE-соединение реакций временно недоступно");
    });
}


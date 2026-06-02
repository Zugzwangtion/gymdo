// Словарь терминов в этом файле:
// workout - тренировка.
// dayWorkouts - тренировки за конкретный день календаря.
// dateString - дата строкой в формате YYYY-MM-DD, например "2026-06-01".
// modal - всплывающее окно.
// indicator - маленькая точка/метка на дне календаря, что в этот день есть тренировка.

/**
 * Собирает дату в формате YYYY-MM-DD.
 *
 * Эта функция нужна не для красивого вывода даты пользователю, а для технического
 * сравнения дат. Календарь для каждого дня месяца сам собирает строку даты,
 * а потом ищет тренировки с точно такой же строкой.
 *
 * Почему это важно:
 * backend возвращает дату тренировки именно строкой такого вида, например "2026-06-01".
 * Чтобы календарь мог понять, есть ли тренировка в конкретный день, дата ячейки
 * календаря должна выглядеть точно так же, как `workout.date` из API.
 *
 * `padStart(2, "0")` добавляет ведущий ноль:
 * 6 -> "06", 1 -> "01".
 * Без этого получилось бы "2026-6-1", и сравнение с "2026-06-01" не сработало бы.
 */
function formatDate(year, month, day) {
    // String(month) превращает число месяца в строку.
    // Например, 6 становится "6".
    //
    // padStart(2, "0") говорит: если строка короче 2 символов,
    // добавь слева "0". Поэтому "6" становится "06".
    //
    // Итоговая строка собирается через template string:
    // year = 2026, month = 6, day = 1 -> "2026-06-01".
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Показывает окно "нужна авторизация".
 *
 * Эта функция используется, когда пользователь пытается сделать действие,
 * которое доступно только после входа: добавить тренировку, открыть календарь
 * тренировок или перейти в защищенную часть приложения.
 */
function requireAuth(message = "Чтобы пользоваться этой функцией, войдите в аккаунт.") {
    // Если модального окна авторизации нет в HTML, показываем обычный alert.
    // Это запасной вариант, чтобы пользователь все равно увидел сообщение.
    if (!elements.authPromptModal || !elements.authPromptText) {
        alert(message);
        return;
    }

    // Вставляем переданный текст в модальное окно и показываем его.
    elements.authPromptText.textContent = message;
    elements.authPromptModal.style.display = "flex";
}

/**
 * Закрывает окно "нужна авторизация".
 */
function closeAuthModal() {
    if (elements.authPromptModal) {
        elements.authPromptModal.style.display = "none";
    }
}

/**
 * Закрывает модальное окно с тренировками выбранного дня.
 */
function closeModal() {
    if (elements.modal) {
        elements.modal.style.display = "none";
    }
}

/**
 * Открывает модальное окно с тренировками выбранного дня.
 */
function openModal() {
    if (elements.modal) {
        elements.modal.style.display = "flex";
    }
}

/**
 * Переводит пользователя на страницу добавления тренировки.
 *
 * Если пользователь не вошел, мы не пускаем его на добавление и показываем окно авторизации.
 * Если дата передана, она добавляется в URL как query-параметр:
 * `/add/?date=2026-06-01`.
 * Это нужно, когда пользователь нажал на пустой день календаря и хочет добавить
 * тренировку именно на эту дату.
 */
function goToAddPage(date = "") {
    // state.isAuthenticated заполняется при старте главной страницы в main.js.
    // Если пользователь не авторизован, мы показываем понятное окно вместо
    // перехода на страницу, где все равно нельзя будет сохранить тренировку.
    if (!state.isAuthenticated) {
        requireAuth("Чтобы добавить тренировку, войдите в аккаунт.");
        return;
    }

    // Тернарный оператор здесь выбирает один из двух URL:
    // если date есть, идем на `/add/?date=...`;
    // если date пустая строка, идем просто на `/add/`.
    //
    // Query-параметр `?date=...` не создает тренировку сам. Он просто передает
    // странице добавления подсказку, какую дату можно поставить в поле даты.
    location.href = date ? `/add/?date=${date}` : "/add/";
}

/**
 * Переводит пользователя на страницу конкретной тренировки.
 *
 * Например, если workoutId = 12, откроется `/workouts/12/`.
 * На этой странице другой JavaScript уже загрузит подробности этой тренировки
 * через `GET /api/workouts/12/`.
 */
function goToWorkoutPage(workoutId) {
    // Если id не передали, переходить некуда.
    // Такая защита не дает собрать URL вида `/workouts/undefined/`.
    if (!workoutId) return;

    // location.href меняет адрес текущей страницы.
    // После этого браузер загружает Django-страницу просмотра тренировки.
    location.href = `/workouts/${workoutId}/`;
}

/**
 * Возвращает все тренировки за конкретную дату.
 *
 * `state.workouts` - это список тренировок, который главная страница получила
 * с backend через `GET /api/workouts/`.
 *
 * Здесь мы не обращаемся к backend заново. Календарь просто фильтрует уже
 * загруженный массив и оставляет только тренировки, у которых `workout.date`
 * совпадает с датой ячейки календаря.
 *
 * Пример:
 * dateString = "2026-06-01"
 * state.workouts = [
 *   { id: 1, date: "2026-06-01" },
 *   { id: 2, date: "2026-06-05" }
 * ]
 * результат: [{ id: 1, date: "2026-06-01" }]
 */
function getDayWorkouts(dateString) {
    // filter проходит по всем тренировкам и возвращает новый массив.
    // В новый массив попадут только те элементы, для которых условие вернуло true.
    //
    // Здесь условие такое:
    // дата тренировки из backend (`workout.date`) должна совпасть с датой ячейки календаря.
    //
    // Если совпадений нет, filter вернет пустой массив [].
    // Если в этот день было несколько тренировок, вернется массив из нескольких объектов.
    return state.workouts.filter((workout) => workout.date === dateString);
}

/**
 * Создает маленькую точку-индикатор для дня с тренировкой.
 *
 * Если в одном дне две тренировки, `createCalendarDay()` вызовет эту функцию
 * два раза, и в ячейке появятся две точки.
 */
function createWorkoutIndicator() {
    // document.createElement("span") создает новый HTML-элемент <span>.
    // Он пока существует только в памяти JavaScript и появится на странице
    // только после appendChild(...) в createCalendarDay().
    const dot = document.createElement("span");

    // CSS-класс отвечает за внешний вид точки: размер, цвет, отступы.
    dot.className = "day-indicator-dot";

    // Возвращаем готовый элемент, чтобы другая функция могла вставить его в ячейку дня.
    return dot;
}

/**
 * Создает одну ячейку календаря.
 * На вход приходит число дня, строка даты и список тренировок за этот день.
 * По клику либо открываются тренировки дня, либо предлагается добавить новую запись.
 */
function createCalendarDay(day, dateString, dayWorkouts) {
    // day - число месяца.
    // dateString - дата этого дня строкой.
    // dayWorkouts - массив тренировок, которые сохранены на эту дату.
    //
    // Пример входных данных:
    // day = 1
    // dateString = "2026-06-01"
    // dayWorkouts = [{ id: 12, date: "2026-06-01", duration: 75, ... }]
    //
    // Результат функции:
    // HTML-элемент <div class="day workout">1 ...точки...</div>,
    // на который повешен обработчик клика.

    // Создаем новый HTML-элемент дня. Его не было в `home.html`;
    // календарь полностью строится JavaScript-ом после загрузки тренировок.
    const dayCell = document.createElement("div");

    // Если в этот день есть хотя бы одна тренировка, добавляем класс `workout`.
    // CSS по этому классу может подсветить день иначе, чем обычный пустой день.
    //
    // Шаблонная строка работает так:
    // dayWorkouts.length ? " workout" : ""
    // если тренировок больше 0 -> добавить строку " workout";
    // если тренировок 0 -> добавить пустую строку.
    dayCell.className = `day${dayWorkouts.length ? " workout" : ""}`;

    // Внутрь ячейки кладем само число дня: 1, 2, 3 и так далее.
    // textContent заменяет текстовое содержимое элемента.
    // String(day) превращает число в строку, потому что DOM хранит текст как строку.
    dayCell.textContent = String(day);

    if (dayWorkouts.length > 0) {
        // В дне с тренировками рисуем блок точек-индикаторов.
        // Количество точек равно количеству тренировок в этот день.
        const indicators = document.createElement("div");
        indicators.className = "day-indicators";

        // Нам не важны сами объекты тренировок в этом цикле, важно только их количество.
        // Поэтому параметр внутри forEach не используется: на каждую тренировку
        // создается одна точка.
        dayWorkouts.forEach(() => indicators.appendChild(createWorkoutIndicator()));

        // appendChild вставляет блок с точками внутрь ячейки дня.
        // До этой строки indicators существовал только в памяти JS.
        dayCell.appendChild(indicators);
    }

    // addEventListener добавляет реакцию на событие.
    // Здесь событие - click, то есть нажатие пользователя на ячейку дня.
    //
    // Важно: функция внутри addEventListener не выполняется сразу при создании календаря.
    // Она выполнится позже, только когда пользователь реально нажмет на день.
    dayCell.addEventListener("click", () => {
        // Календарь виден всем, но действия с тренировками доступны только
        // авторизованному пользователю. Это проверка на фронтенде для удобства;
        // настоящая защита все равно стоит на backend через IsAuthenticated.
        if (!state.isAuthenticated) {
            requireAuth("Чтобы открыть календарь тренировок и добавлять занятия, войдите в аккаунт.");

            // return останавливает обработчик клика.
            // Без return код пошел бы дальше и мог бы попытаться открыть тренировку
            // или страницу добавления даже для неавторизованного пользователя.
            return;
        }

        // Если в дне ровно одна тренировка, сразу открываем ее страницу.
        // Пользователю не нужно выбирать из списка из одного элемента.
        if (dayWorkouts.length === 1) {
            // dayWorkouts[0] - первая и единственная тренировка в массиве.
            // Берем ее id, чтобы открыть страницу конкретной тренировки.
            goToWorkoutPage(dayWorkouts[0].id);
            return;
        }

        // Если тренировок несколько, показываем модальное окно со списком.
        // Там пользователь сможет выбрать конкретную тренировку или добавить еще одну.
        if (dayWorkouts.length > 1) {
            // Если тренировок несколько, сразу перейти нельзя: непонятно, какую
            // именно тренировку пользователь хочет открыть. Поэтому показываем список.
            showDayWorkouts(dateString, dayWorkouts);
            return;
        }

        // Если тренировок в этот день нет, клик по дню воспринимается как
        // желание добавить новую тренировку на эту дату.
        goToAddPage(dateString);
    });

    return dayCell;
}

/**
 * Полностью строит календарь за выбранный месяц.
 * Использует `state.currentDate` для месяца и `state.workouts` для отметок дней с тренировками.
 * Каждая ячейка создается через `createCalendarDay()`.
 */
function renderCalendar() {
    // renderCalendar вызывается:
    // 1) при первой загрузке главной страницы после получения тренировок;
    // 2) при переключении месяца кнопками "назад" и "вперед";
    // 3) после удаления тренировки, чтобы календарь обновил отметки.
    //
    // Эта функция не ходит на backend. Она работает только с тем, что уже лежит
    // в `state.workouts`.

    // Достаем из `elements` два HTML-элемента:
    // calendarGrid - контейнер, куда будут вставляться дни месяца;
    // monthTitle - заголовок месяца над календарем.
    const { calendarGrid, monthTitle } = elements;

    // Если HTML-элементов нет, останавливаем функцию, чтобы не получить ошибку
    // вроде "Cannot set properties of null".
    if (!calendarGrid || !monthTitle) {
        return;
    }

    // Перед новой отрисовкой очищаем старый календарь.
    // Это нужно при переключении месяца: старые дни удаляются, новые рисуются заново.
    calendarGrid.innerHTML = "";

    // state.currentDate - это объект Date, который хранит "какой месяц сейчас показываем".
    // Он не обязательно равен сегодняшнему дню: если пользователь нажал стрелку
    // следующего месяца, currentDate тоже сдвигается.
    //
    // year - год, например 2026.
    // month - месяц с нуля, потому что так работает Date в JavaScript:
    // 0 = январь, 1 = февраль, ..., 5 = июнь, ..., 11 = декабрь.
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();

    // firstDay - день недели первого числа месяца.
    // getDay() возвращает 0 для воскресенья, 1 для понедельника, ..., 6 для субботы.
    //
    // daysInMonth - сколько дней в текущем месяце.
    // new Date(year, month + 1, 0) - это "нулевой день следующего месяца",
    // то есть последний день текущего месяца.
    //
    // offset - сколько пустых клеток нужно поставить перед первым числом,
    // чтобы календарь начинался с понедельника.
    // Если первое число в понедельник, offset = 0.
    // Если первое число во вторник, offset = 1.
    // Если первое число в воскресенье, offset = 6.
    //
    // Пример:
    // если 1 июня выпало на среду, то перед "1" надо поставить две пустые клетки:
    // понедельник и вторник. Тогда offset будет 2.
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    // Показываем название месяца и год по-русски, например "июнь 2026 г.".
    monthTitle.textContent = state.currentDate.toLocaleString("ru", {
        month: "long",
        year: "numeric"
    });

    // Добавляем пустые клетки перед первым днем месяца.
    // Например, если 1-е число в среду, перед ним нужны пустые клетки под понедельник и вторник.
    for (let i = 0; i < offset; i += 1) {
        // Пустой div занимает место в CSS-grid, но не содержит числа дня.
        // Благодаря этому первое число месяца попадает под правильный день недели.
        calendarGrid.appendChild(document.createElement("div"));
    }

    // Главный цикл: создаем ячейку для каждого дня текущего месяца.
    for (let day = 1; day <= daysInMonth; day += 1) {
        // day начинается с 1 и идет до daysInMonth включительно.
        // Если в месяце 30 дней, цикл создаст 30 ячеек с числами от 1 до 30.

        // Собираем дату дня в том же формате, в котором backend возвращает `workout.date`.
        // month + 1 нужен потому, что Date.getMonth() вернул месяц с нуля:
        // июнь в Date это 5, а в строке даты должен быть 06.
        const dateString = formatDate(year, month + 1, day);

        // Берем из `state.workouts` только тренировки за этот конкретный день.
        const dayWorkouts = getDayWorkouts(dateString);

        // Создаем HTML-ячейку дня и вставляем ее в сетку календаря.
        // createCalendarDay возвращает готовый div со всем нужным:
        // числом дня, CSS-классами, точками тренировок и обработчиком клика.
        calendarGrid.appendChild(createCalendarDay(day, dateString, dayWorkouts));
    }
}

/**
 * Показывает модальное окно со всеми тренировками выбранного дня.
 * Если тренировки есть, рисуются карточки и кнопки перехода к деталям.
 * Отсюда пользователь может открыть тренировку или добавить новую на эту дату.
 */
function showDayWorkouts(dateString, dayWorkouts) {
    // dateString - дата, по которой пользователь кликнул в календаре.
    // dayWorkouts - все тренировки, найденные в `state.workouts` за эту дату.
    //
    // Эта функция вызывается только если в выбранный день больше одной тренировки.
    // Если тренировка одна, createCalendarDay сразу открывает ее страницу.
    if (!elements.modalContent) {
        return;
    }

    // Очищаем старое содержимое модального окна.
    // Например, до этого пользователь мог открыть другой день, и там уже были карточки.
    elements.modalContent.innerHTML = "";

    // Создаем заголовок модального окна: дата и количество тренировок за эту дату.
    const title = document.createElement("h2");
    title.textContent = `${dateString} — тренировок: ${dayWorkouts.length}`;
    elements.modalContent.appendChild(title);

    // Для каждой тренировки выбранного дня создаем отдельную карточку.
    dayWorkouts.forEach((workout, index) => {
        const card = document.createElement("div");
        card.className = "day-workout-card";

        // Кнопка "Открыть" ведет на страницу конкретной тренировки.
        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.textContent = "Открыть";
        openButton.addEventListener("click", () => goToWorkoutPage(workout.id));

        // card.append(...) добавляет внутрь карточки сразу несколько элементов:
        // заголовок, длительность, тоннаж и кнопку открытия.
        card.append(
            Object.assign(document.createElement("h3"), {
                textContent: `Тренировка ${index + 1}`
            }),
            createInfoParagraph(`Длительность: ${workout.duration ?? 0} мин`),
            createInfoParagraph(`Тоннаж: ${formatTonnage(workout.tonnage)}`),
            openButton
        );

        elements.modalContent.appendChild(card);
    });

    // После списка тренировок добавляем кнопку, которая позволяет создать
    // еще одну тренировку на эту же дату.
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "+ Добавить ещё тренировку";
    addButton.style.marginTop = "16px";
    addButton.addEventListener("click", () => goToAddPage(dateString));

    // Вставляем кнопку в модальное окно и показываем само окно.
    elements.modalContent.appendChild(addButton);
    openModal();
}

/**
 * Показывает подробности одной тренировки в модальном окне.
 *
 * Сейчас основной переход к одной тренировке идет через `/workouts/<id>/`,
 * но эта функция оставлена как способ показать данные тренировки прямо на главной.
 */
function showWorkoutDetails(workout) {
    // workout - одна тренировка: дата, длительность, тоннаж, упражнения и подходы.
    if (!elements.modalContent) {
        return;
    }

    elements.modalContent.innerHTML = "";

    const title = document.createElement("h2");
    title.textContent = workout.date || "Без даты";

    elements.modalContent.append(
        title,
        createInfoParagraph(`Длительность: ${workout.duration ?? 0} мин`),
        createInfoParagraph(`Тоннаж: ${formatTonnage(workout.tonnage)}`)
    );

    const exercises = workout.exercises || [];
    // exercises - упражнения внутри этой тренировки.

    if (!exercises.length) {
        elements.modalContent.appendChild(createInfoParagraph("В этой тренировке пока нет упражнений."));
    }

    exercises.forEach((exercise) => {
        // exercise - одно упражнение, например "Жим штанги лежа".
        const exerciseTitle = document.createElement("h3");
        exerciseTitle.textContent = exercise.name || "Без названия";
        elements.modalContent.appendChild(exerciseTitle);

        (exercise.sets || []).forEach((set, index) => {
            // set - один подход упражнения.
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

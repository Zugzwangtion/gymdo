/**
 * Удаляет тренировку с главной страницы.
 * Сначала спрашивается подтверждение, потом вызывается `deleteWorkoutById()`, после чего локальный список тренировок обновляется.
 * После удаления перерисовываются календарь, статистика, график и карта мышц.
 */
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

/**
 * Обновляет шапку главной страницы под текущее состояние авторизации.
 * Если пользователь вошел в аккаунт, кнопка входа скрывается, показывается бейдж пользователя,
 * а подзаголовок говорит про работу с прогрессом. Если пользователь не вошел, шапка показывает
 * приглашение авторизоваться, потому что тренировки и справочник требуют аккаунт.
 */
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

/**
 * Подключает обработчики событий для главной страницы.
 * Здесь кнопки и ссылки становятся интерактивными: закрываются модальные окна, выполняется logout,
 * проверяется доступ к справочнику, открывается меню пользователя и переключаются месяцы календаря.
 * Эта функция не рисует интерфейс сама, она только говорит браузеру, какие функции вызывать при кликах.
 */
function bindEvents() {
    elements.closeModalButton?.addEventListener("click", closeModal);
    elements.closeAuthPrompt?.addEventListener("click", closeAuthModal);

    elements.profileLogoutBtn?.addEventListener("click", async () => { //При клике на кнопку выхода из аккаунта появляется подтверждение. Если пользователь подтверждает, вызывается `logoutUser()`, состояние страницы обновляется, и происходит переход на страницу логина. Если возникает ошибка при выходе, показывается сообщение об ошибке.
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

    elements.guideLink?.addEventListener("click", (event) => {// При клике на ссылку "Справочник упражнений" проверяется, авторизован ли пользователь. Если не авторизован, открывается модальное окно с приглашением войти в аккаунт. Если авторизован, происходит переход по ссылке. Это предотвращает доступ к справочнику без авторизации и мотивирует пользователей войти в аккаунт для использования всех функций приложения.
        if (!state.isAuthenticated) {
            event.preventDefault();
            requireAuth("Чтобы открыть справочник, войдите в аккаунт.");
        }
    });

    elements.userBadge?.addEventListener("click", (event) => {// При клике на бейдж с первой буквой имени пользователя открывается выпадающее меню. Если клик происходит вне этого меню, оно закрывается. Это обеспечивает удобный доступ к функциям профиля и выхода из аккаунта, а также улучшает пользовательский интерфейс.
        event.stopPropagation();
        if (state.isAuthenticated) {
            elements.userDropdown?.classList.toggle("show");
        }
    });

    elements.prevMonth?.addEventListener("click", () => {// При клике на кнопку "Предыдущий месяц" в календаре текущая дата в состоянии страницы изменяется на предыдущий месяц, и календарь перерисовывается. Это позволяет пользователям просматривать свои тренировки в разные месяцы и анализировать прогресс с течением времени.
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderCalendar();
    });

    elements.nextMonth?.addEventListener("click", () => {// При клике на кнопку "Следующий месяц" в календаре текущая дата в состоянии страницы изменяется на следующий месяц, и календарь перерисовывается. Это позволяет пользователям просматривать свои тренировки в разные месяцы и анализировать прогресс с течением времени.
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderCalendar();
    });

    window.addEventListener("click", (event) => {// При клике в любом месте окна проверяется, был ли клик по модальному окну или по элементу с id "userMenuWrap". Если клик был по модальному окну, оно закрывается. Если клик был вне элемента "userMenuWrap", выпадающее меню пользователя закрывается. Это обеспечивает удобное взаимодействие с модальными окнами и меню, позволяя пользователям легко закрывать их кликом вне области.
        if (event.target === elements.modal) {
            closeModal();
        }

        if (event.target === elements.authPromptModal) {// Если клик был по модальному окну с приглашением войти в аккаунт, оно закрывается. Это позволяет пользователям легко закрывать это окно, если они не хотят или не могут войти в аккаунт в данный момент.
            closeAuthModal();
        }

        if (!event.target.closest("#userMenuWrap")) {
            elements.userDropdown?.classList.remove("show");
        }
    });
}

/**
 * Загружает данные для главной страницы.
 * Сначала узнаем текущего пользователя, потом получаем его тренировки через `getWorkouts()`.
 * После загрузки все блоки страницы обновляются из одного состояния `state.workouts`.
 */
async function loadUserAndWorkouts() {
    try {
        state.currentUser = await getCurrentUser();
        state.isAuthenticated = Boolean(state.currentUser);
    } catch {
        state.currentUser = null;
        state.isAuthenticated = false;
    }

    if (!state.isAuthenticated) { //Если пользователь не авторизован, тренировки не загружаются, и в `state.workouts` остается пустой массив. 
        return;
    }

    try {
        state.workouts = await getWorkouts(); //Если пользователь авторизован, делаем запрос к backend через `getWorkouts()`, и результат сохраняется в `state.workouts`. Это массив тренировок, который потом используется для отображения данных на странице.
    } catch (error) {
        state.workouts = [];
        alert(error.message || "Не удалось загрузить тренировки");
    }
}

/**
 * Главная точка входа dashboard-страницы.
 * Выполняет стартовый сценарий сверху вниз: подключает события, загружает пользователя и тренировки,
 * обновляет шапку, календарь, статистику, график и карту мышц. То есть именно отсюда начинается
 * работа главной страницы после загрузки JS-файла.
 */

/**
 * подключи события
 * загрузи пользователя и тренировки
 * обнови шапку
 * нарисуй календарь
 * обнови статистику
 * нарисуй график
 * обнови карту мышц*/
async function initPage() {
    bindEvents();
    await loadUserAndWorkouts();
    updateAuthenticatedHeader();//Обновляет видимость кнопок и текста в шапке страницы в зависимости от того, авторизован пользователь или нет. Если пользователь авторизован, показывает его имя на бейдже и отображает кнопки для авторизованных пользователей. Если не авторизован, показывает приглашение войти в аккаунт.
    renderCalendar();//Рисует календарь на странице, используя данные из `state.workouts` для отображения количества тренировок в каждом дне. Также устанавливает обработчики кликов на дни, чтобы открывать модальное окно с деталями тренировок.
    updateStats();
    renderChart();//Рисует график с прогрессом тренировок, используя данные из `state.workouts`. 
    await loadMuscleMaps();
}


initPage();

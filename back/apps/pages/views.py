from django.shortcuts import render


def home_view(request):
    """Отдает главную страницу с календарем, статистикой, графиком и картой мышц.

    Здесь Django возвращает только HTML-шаблон `home.html`. Сами тренировки
    страница потом догружает через JavaScript-функции `getCurrentUser()`
    и `getWorkouts()` из `api.js`.
    """
    return render(request, 'pages/home.html')


def login_page_view(request):
    """Отдает HTML-страницу входа; submit формы обрабатывает `auth.js`."""
    return render(request, 'pages/login.html')


def register_page_view(request):
    """Отдает HTML-страницу регистрации; данные отправляются через `registerUser()`."""
    return render(request, 'pages/register.html')


def add_workout_page_view(request):
    """Отдает страницу добавления тренировки.
    """
    return render(request, 'pages/add.html')


def workout_detail_page_view(request, workout_id):
    """Отдает страницу просмотра одной тренировки.

    `workout_id` приходит из URL и передается в шаблон. JavaScript читает его
    из `data-workout-id`, затем вызывает `getWorkoutById(workout_id)`.
    """
    return render(request, 'pages/workout_detail.html', {'workout_id': workout_id})


def guide_page_view(request):
    """Отдает справочник упражнений.

    Список упражнений берется из `exercises.js`, а лайки/дизлайки догружаются
    через API реакций и SSE-поток.
    """
    return render(request, 'pages/guide.html')

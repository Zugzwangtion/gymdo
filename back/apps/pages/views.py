from django.shortcuts import render


def home_view(request):
    # Django отдает HTML-страницу, а данные для нее потом догружает JavaScript через API.
    return render(request, 'pages/home.html')


def login_page_view(request):
    return render(request, 'pages/login.html')


def register_page_view(request):
    return render(request, 'pages/register.html')


def add_workout_page_view(request):
    return render(request, 'pages/add.html')


def workout_detail_page_view(request, workout_id):
    return render(request, 'pages/workout_detail.html', {'workout_id': workout_id})


def guide_page_view(request):
    return render(request, 'pages/guide.html')

from functools import wraps

from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.middleware.csrf import CsrfViewMiddleware
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def csrf_view(request):
    """Выдает браузеру CSRF-cookie перед POST-запросами.

    Фронтенд вызывает этот endpoint из `ensureCsrfCookie()` в `api.js`.
    Django кладет cookie в ответ, а JavaScript потом передает ее обратно
    в заголовке `X-CSRFToken`.
    """
    return JsonResponse({"detail": "CSRF cookie set"})

def enforce_csrf(view_func):
    """Декоратор, который вручную запускает Django CSRF-проверку для API-view.

    На вход получает view-функцию, возвращает `wrapped_view`.
    `wrapped_view` принимает обычные аргументы Django: `request`, `*args`,
    `**kwargs`. Если CSRF-проверка не прошла, возвращает ошибку Django;
    если прошла, передает управление исходной view-функции.
    """
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        """Проверяет CSRF для конкретного запроса и вызывает исходный view."""
        middleware = CsrfViewMiddleware(lambda req: None)
        middleware.process_request(request)
        failure_response = middleware.process_view(request, lambda req: None, args, kwargs)

        if failure_response:
            return failure_response

        return view_func(request, *args, **kwargs)

    return wrapped_view


User = get_user_model()


@api_view(["GET"])
@permission_classes([AllowAny])
def me_view(request):
    """Возвращает состояние авторизации текущего браузера.

    Использует `request.user`, который Django добавляет через middleware
    сессий и авторизации. Фронтенд вызывает эту функцию через `getCurrentUser()`
    и по ответу решает, показывать личные данные или отправлять на страницу входа.
    """
    if request.user.is_authenticated:
        return Response({
            "is_authenticated": True,
            "user": {
                "id": request.user.id,
                "username": request.user.username,
            }
        })

    return Response({
        "is_authenticated": False,
        "user": None,
    })


@enforce_csrf
@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    """Регистрирует пользователя по username, email и password.

    Данные приходят из `registerUser()` в `api.js` как JSON. Функция проверяет
    наличие полей, уникальность username, запускает Django-валидацию пароля,
    создает пользователя через `User.objects.create_user()` и сразу вызывает
    `login(request, user)`, чтобы сохранить пользователя в сессии.
    """
    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "").strip()

    if not username or not email or not password:
        return Response(
            {"error": "Введите username, email и password"},
            status=400
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Пользователь уже существует"},
            status=400
        )

    try:
        validate_password(password)
    except ValidationError as error:
        return Response(
            {"error": " ".join(error.messages)},
            status=400
        )

    user = User.objects.create_user(username=username, email=email, password=password)

    login(request, user)

    return Response({
        "ok": True,
        "message": "Пользователь создан",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        }
    })


@enforce_csrf
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """Авторизует пользователя по username и password.

    Принимает JSON из `loginUser()` на фронтенде. `authenticate()` сверяет
    пароль с хешем в базе, а `login()` записывает id пользователя в Django-сессию,
    после чего браузер считается вошедшим в аккаунт.
    """
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "").strip()

    if not username or not password:
        return Response(
            {"error": "Введите username и password"},
            status=400
        )

    user = authenticate(request, username=username, password=password) #authenticate - это функция Django, которая проверяет, есть ли пользователь с таким username и совпадает ли пароль. Если все ок, возвращает объект пользователя, если нет - None.

    if user is None:
        return Response(
            {"error": "Неверный логин или пароль"},
            status=400
        )

    login(request, user)#login - это функция Django, которая сохраняет пользователя в сессии. После этого request.user будет возвращать этого пользователя, и браузер будет считаться авторизованным.
    #то есть дальше когда браузер будет делать api запросы, он вместе с запросамит будет отправлять сессионные куки, и Django будет понимать, что это тот же пользователь, который только что вошел в аккаунт.
    #все запросы идут через apiFetch() в api.js, и там мы неявно передаем куки, поэтому Django видит, что это тот же пользователь, который только что вошел в аккаунт, и request.user возвращает этого пользователя.
    return Response({
        "ok": True,
        "message": "Вход выполнен",
        "user": {
            "id": user.id,
            "username": user.username,
        }
    })
#Django понимает пользователя из cookie потому что это подключено в настройках проекта есть middleware: gymdo_backend_settings.py
#запрос пришел
#↓
#SessionMiddleware смотрит cookie sessionid
#↓
#находит сессию в базе
#↓
#AuthenticationMiddleware достает пользователя из сессии
#↓
#кладет его в request.user




@enforce_csrf
@api_view(["POST"])
def logout_view(request):
    """Выходит из аккаунта в текущем браузере.

    Фронтенд вызывает `logoutUser()`, а Django `logout()` очищает сессионные
    данные. Пользователь в базе при этом не удаляется.
    """
    logout(request)
    return Response({
        "ok": True,
        "message": "Вы вышли из аккаунта"
    })

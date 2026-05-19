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
    # Перед POST-запросами JavaScript просит Django выдать CSRF-cookie.
    return JsonResponse({"detail": "CSRF cookie set"})

def enforce_csrf(view_func):
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
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
    # Этот endpoint помогает фронтенду понять, вошел ли пользователь в аккаунт.
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
    # Простая регистрация по username/password для учебной версии проекта.
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
    # authenticate проверяет пароль, login сохраняет пользователя в Django-сессию.
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "").strip()

    if not username or not password:
        return Response(
            {"error": "Введите username и password"},
            status=400
        )

    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response(
            {"error": "Неверный логин или пароль"},
            status=400
        )

    login(request, user)

    return Response({
        "ok": True,
        "message": "Вход выполнен",
        "user": {
            "id": user.id,
            "username": user.username,
        }
    })


@enforce_csrf
@api_view(["POST"])
def logout_view(request):
    # Удаляем данные пользователя из текущей сессии браузера.
    logout(request)
    return Response({
        "ok": True,
        "message": "Вы вышли из аккаунта"
    })

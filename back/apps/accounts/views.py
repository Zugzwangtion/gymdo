from django.contrib.auth import authenticate, login, logout, get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def csrf_view(request):
    return JsonResponse({"detail": "CSRF cookie set"})

User = get_user_model()


@api_view(["GET"])
@permission_classes([AllowAny])
def me_view(request):
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


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "").strip()

    if not username or not password:
        return Response(
            {"error": "Введите username и password"},
            status=400
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Пользователь уже существует"},
            status=400
        )

    user = User.objects.create_user(username=username, password=password)

    login(request, user)

    return Response({
        "ok": True,
        "message": "Пользователь создан",
        "user": {
            "id": user.id,
            "username": user.username,
        }
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
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


@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({
        "ok": True,
        "message": "Вы вышли из аккаунта"
    })
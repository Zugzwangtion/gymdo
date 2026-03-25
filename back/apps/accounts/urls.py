from django.urls import path
from .views import me_view, register_view, login_view, logout_view, csrf_view


urlpatterns = [
    path("me/", me_view, name="auth-me"),
    path("register/", register_view, name="auth-register"),
    path("login/", login_view, name="auth-login"),
    path("logout/", logout_view, name="auth-logout"),
    path("csrf/", csrf_view),
]
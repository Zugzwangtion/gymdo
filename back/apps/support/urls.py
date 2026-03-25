from django.urls import path
from .views import SupportCreateView

urlpatterns = [
    path('', SupportCreateView.as_view(), name='support-create'),
]

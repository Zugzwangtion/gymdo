from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient


@override_settings(ALLOWED_HOSTS=["testserver"])
class RegistrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.User = get_user_model()

    def test_register_creates_user_with_hashed_password(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "lab5_user",
                "email": "lab5@example.com",
                "password": "StrongPass123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        user = self.User.objects.get(username="lab5_user")
        self.assertEqual(user.email, "lab5@example.com")
        self.assertNotEqual(user.password, "StrongPass123")
        self.assertTrue(user.password.startswith("pbkdf2_sha256$"))
        self.assertTrue(user.check_password("StrongPass123"))

    def test_register_rejects_short_password(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "short_password_user",
                "email": "short@example.com",
                "password": "1234567",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(self.User.objects.filter(username="short_password_user").exists())

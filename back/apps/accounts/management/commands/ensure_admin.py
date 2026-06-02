import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Django management command для создания администратора из переменных окружения.

    Запускается как `python manage.py ensure_admin`. Команда нужна для Docker
    и учебного запуска: можно заранее задать ADMIN_USERNAME, ADMIN_EMAIL,
    ADMIN_PASSWORD и получить готовый аккаунт администратора без ручного ввода.
    """
    help = 'Create or update a superuser from ADMIN_* environment variables.'

    def handle(self, *args, **options):
        """Читает ADMIN_* переменные, создает или обновляет superuser.

        `get_or_create()` ищет пользователя по username. Если пользователь уже
        есть, команда обновляет email, права администратора и пароль.
        """
        username = os.getenv('ADMIN_USERNAME')
        email = os.getenv('ADMIN_EMAIL', '')
        password = os.getenv('ADMIN_PASSWORD')

        if not username or not password:
            self.stdout.write(
                self.style.WARNING(
                    'ADMIN_USERNAME or ADMIN_PASSWORD is empty; admin user was not changed.'
                )
            )
            return

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_staff': True,
                'is_superuser': True,
            },
        )

        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        action = 'Created' if created else 'Updated'
        self.stdout.write(self.style.SUCCESS(f'{action} superuser: {username}'))

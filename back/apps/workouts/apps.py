from django.apps import AppConfig


class WorkoutsConfig(AppConfig):
    """Конфигурация Django-приложения workouts.

    Django использует этот класс, чтобы подключить приложение с тренировками
    к проекту. Здесь задается техническое имя приложения и тип id, который
    Django будет автоматически создавать для новых моделей.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.workouts'

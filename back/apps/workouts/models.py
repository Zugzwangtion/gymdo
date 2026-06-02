from django.conf import settings
from django.db import models

# Модели описывают, какие таблицы есть в базе данных для приложения workouts.
# Главная цепочка такая: Workout -> ExerciseEntry -> SetEntry.
# Отдельно хранится ExerciseReaction, потому что лайки/дизлайки относятся не к тренировке,
# а к упражнениям из справочника.


class Workout(models.Model):
    """Одна тренировка пользователя за конкретную дату.

    Это верхний уровень данных: к тренировке через `related_name='exercises'`
    привязаны упражнения, а к упражнениям привязаны подходы. При удалении
    пользователя тренировки удалятся автоматически из-за `on_delete=CASCADE`.
    """

    # user - пользователь, которому принадлежит тренировка.
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='workouts')

    # date - дата тренировки.
    date = models.DateField()

    # duration - длительность тренировки в минутах.
    duration = models.PositiveIntegerField(help_text='Duration in minutes')

    # tonnage - общий тоннаж/нагрузка: сумма weight * reps по всем подходам.
    tonnage = models.PositiveIntegerField(default=0)

    # created_at - когда запись создана, updated_at - когда изменена.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        """Текстовое представление записи в админке и Django shell."""
        return f'{self.user.username} - {self.date}'


class ExerciseEntry(models.Model):
    """Одно упражнение внутри тренировки, например "жим лежа".

    `workout` связывает упражнение с конкретной тренировкой. `sort_order`
    хранит порядок на фронтенде, чтобы после сохранения упражнения выводились
    так же, как пользователь их добавил.
    """

    # workout - тренировка, внутри которой находится это упражнение.
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='exercises')#Связываем упражнение с тренировкой через foreign key. related_name='exercises' позволяет нам из тренировки получить все упражнения через workout.exercises.all().

    # name - название упражнения.
    name = models.CharField(max_length=255)

    # sort_order - порядок упражнения внутри тренировки.
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        """Возвращает название упражнения для админки и отладки."""
        return self.name


class SetEntry(models.Model):
    """Один подход упражнения: вес, повторы и субъективная тяжесть.

    `exercise` связывает подход с ExerciseEntry. `weight` хранится как Decimal,
    потому что вес может быть дробным, например 22.5 кг.
    """

    EFFORT_WARMUP = 'warmup'
    EFFORT_LOW = 'low'
    EFFORT_MEDIUM = 'medium'
    EFFORT_HIGH = 'high'
    EFFORT_MAX = 'max'

    EFFORT_CHOICES = [
        (EFFORT_WARMUP, 'Warm-up'),
        (EFFORT_LOW, 'Low'),
        (EFFORT_MEDIUM, 'Medium'),
        (EFFORT_HIGH, 'High'),
        (EFFORT_MAX, 'Max'),
    ]

    # exercise - упражнение, которому принадлежит этот подход.
    exercise = models.ForeignKey(ExerciseEntry, on_delete=models.CASCADE, related_name='sets')

    # weight - вес в килограммах.
    weight = models.DecimalField(max_digits=7, decimal_places=2)

    # reps - repetitions, количество повторений.
    reps = models.PositiveIntegerField()

    # effort - субъективная тяжесть подхода: разминка, низкая, средняя, высокая, максимум.
    effort = models.CharField(max_length=12, choices=EFFORT_CHOICES, blank=True, default='')

    # sort_order - порядок подхода внутри упражнения.
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        """Показывает подход в коротком виде: вес x повторы."""
        return f'{self.weight} x {self.reps}'


class ExerciseReaction(models.Model):
    """Лайк или дизлайк пользователя на упражнение из справочника.

    В базе хранится не само упражнение как отдельная модель, а его название.
    Ограничение `unique_user_exercise_reaction` не дает одному пользователю
    поставить две реакции на одно и то же упражнение.
    """
    LIKE = 'like'
    DISLIKE = 'dislike'

    VALUE_CHOICES = [
        (LIKE, 'Like'),
        (DISLIKE, 'Dislike'),
    ]

    # user - пользователь, который поставил реакцию.
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exercise_reactions')

    # exercise_name - название упражнения из справочника.
    exercise_name = models.CharField(max_length=255)

    # value - сама реакция: like или dislike.
    value = models.CharField(max_length=8, choices=VALUE_CHOICES)

    # created_at/updated_at - когда реакция создана и когда последний раз изменена.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['exercise_name']
        constraints = [
            models.UniqueConstraint(fields=('user', 'exercise_name'), name='unique_user_exercise_reaction'),
        ]
        indexes = [
            models.Index(fields=('exercise_name', 'value'), name='exercise_reaction_counts_idx'),
        ]

    def __str__(self):
        """Показывает, какой пользователь какую реакцию поставил упражнению."""
        return f'{self.user.username}: {self.exercise_name} - {self.value}'

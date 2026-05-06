from django.conf import settings
from django.db import models


class Workout(models.Model):
    """Одна тренировка пользователя за конкретную дату."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='workouts')
    date = models.DateField()
    duration = models.PositiveIntegerField(help_text='Duration in minutes')
    tonnage = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
    def __str__(self):
        return f'{self.user.username} - {self.date}'


class ExerciseEntry(models.Model):
    """Одно упражнение внутри тренировки, например "жим лежа"."""

    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='exercises')
    name = models.CharField(max_length=255)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.name


class SetEntry(models.Model):
    """Один подход упражнения: вес и количество повторений."""

    exercise = models.ForeignKey(ExerciseEntry, on_delete=models.CASCADE, related_name='sets')
    weight = models.DecimalField(max_digits=7, decimal_places=2)
    reps = models.PositiveIntegerField()
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f'{self.weight} x {self.reps}'


class ExerciseReaction(models.Model):
    LIKE = 'like'
    DISLIKE = 'dislike'

    VALUE_CHOICES = [
        (LIKE, 'Like'),
        (DISLIKE, 'Dislike'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exercise_reactions')
    exercise_name = models.CharField(max_length=255)
    value = models.CharField(max_length=8, choices=VALUE_CHOICES)
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
        return f'{self.user.username}: {self.exercise_name} - {self.value}'

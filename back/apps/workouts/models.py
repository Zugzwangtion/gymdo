from django.conf import settings
from django.db import models


class Workout(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='workouts')
    date = models.DateField()
    duration = models.PositiveIntegerField(help_text='Duration in minutes')
    tonnage = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['user', 'date'], name='unique_workout_per_user_per_date')
        ]

    def __str__(self):
        return f'{self.user.username} - {self.date}'


class ExerciseEntry(models.Model):
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='exercises')
    name = models.CharField(max_length=255)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.name


class SetEntry(models.Model):
    exercise = models.ForeignKey(ExerciseEntry, on_delete=models.CASCADE, related_name='sets')
    weight = models.DecimalField(max_digits=7, decimal_places=2)
    reps = models.PositiveIntegerField()
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f'{self.weight} x {self.reps}'

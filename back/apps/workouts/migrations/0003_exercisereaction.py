import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0002_remove_workout_unique_workout_per_user_per_date'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ExerciseReaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('exercise_name', models.CharField(max_length=255)),
                ('value', models.CharField(choices=[('like', 'Like'), ('dislike', 'Dislike')], max_length=8)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='exercise_reactions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['exercise_name'],
            },
        ),
        migrations.AddIndex(
            model_name='exercisereaction',
            index=models.Index(fields=['exercise_name', 'value'], name='exercise_reaction_counts_idx'),
        ),
        migrations.AddConstraint(
            model_name='exercisereaction',
            constraint=models.UniqueConstraint(fields=('user', 'exercise_name'), name='unique_user_exercise_reaction'),
        ),
    ]

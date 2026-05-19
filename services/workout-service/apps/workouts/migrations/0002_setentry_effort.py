from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='setentry',
            name='effort',
            field=models.CharField(
                blank=True,
                choices=[
                    ('warmup', 'Warm-up'),
                    ('low', 'Low'),
                    ('medium', 'Medium'),
                    ('high', 'High'),
                    ('max', 'Max'),
                ],
                default='',
                max_length=12,
            ),
        ),
    ]

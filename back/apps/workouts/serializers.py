from decimal import Decimal
from rest_framework import serializers

from .models import ExerciseEntry, SetEntry, Workout

# Serializer в DRF отвечает за перевод между Python/Django-моделями и JSON.
# Когда frontend отправляет тренировку, serializer проверяет данные и создает модели.
# Когда frontend запрашивает тренировку, serializer превращает модели обратно в JSON.


class SetEntrySerializer(serializers.ModelSerializer):
    """Преобразует один подход упражнения между моделью SetEntry и JSON.

    Фронтенд передает `weight`, `reps`, `effort`, `sort_order`.
    Поле `id` только читается: его создает база данных.
    """
    class Meta:
        model = SetEntry
        fields = ('id', 'weight', 'reps', 'effort', 'sort_order')
        read_only_fields = ('id',)


class ExerciseEntrySerializer(serializers.ModelSerializer):
    """Преобразует одно упражнение внутри тренировки вместе с подходами."""
    sets = SetEntrySerializer(many=True)

    class Meta:
        model = ExerciseEntry
        fields = ('id', 'name', 'sort_order', 'sets')
        read_only_fields = ('id',)


class WorkoutSerializer(serializers.ModelSerializer):
    """Главный serializer тренировки.

    Он принимает один большой JSON от формы добавления: данные тренировки,
    список упражнений и список подходов внутри каждого упражнения. DRF сам
    проверяет простые типы полей, а методы ниже добавляют правила проекта.
    """
    # exercises -> sets являются вложенными данными: фронтенд отправляет всю тренировку одним JSON.
    exercises = ExerciseEntrySerializer(many=True)

    class Meta: #Указываем, что этот serializer работает с моделью Workout и перечисляем поля, которые будут в JSON. Поля id, tonnage, created_at и updated_at только читаются, их нельзя отправить в POST или PUT запросе, потому что они генерируются базой данных или вычисляются автоматически. Остальные поля можно отправлять при создании или обновлении тренировки. DRF будет использовать этот serializer в WorkoutListView и WorkoutDetailView для преобразования между JSON и моделями. В методах create() и update() мы вручную обрабатываем вложенные упражнения и подходы, потому что DRF не умеет сохранять вложенные структуры из коробки.
        model = Workout
        fields = ('id', 'date', 'duration', 'tonnage', 'created_at', 'updated_at', 'exercises')
        read_only_fields = ('id', 'tonnage', 'created_at', 'updated_at')

    def validate_exercises(self, value):#
        """Проверяет, что в тренировке есть хотя бы одно упражнение."""
        if not value:
            raise serializers.ValidationError('Добавьте хотя бы одно упражнение.')
        return value

    def validate(self, attrs):
        """Проверяет вложенную структуру тренировки целиком.

        На вход получает уже частично проверенные данные `attrs`.
        Здесь важно убедиться, что у каждого упражнения есть хотя бы один подход.
        """
        exercises = attrs.get('exercises', [])
        if not exercises:
            return attrs
        for exercise in exercises:
            sets = exercise.get('sets') or []
            if not sets:
                raise serializers.ValidationError({'exercises': 'В каждом упражнении должен быть хотя бы один подход.'})
        return attrs

    @staticmethod
    def calculate_tonnage(exercises_data) -> int:
        """Считает общий тоннаж: сумма weight * reps по всем подходам.

        На вход получает список упражнений из JSON. Использует `Decimal`,
        чтобы вес с дробной частью считался аккуратнее, чем через float.
        Возвращает целое число, которое сохраняется в `Workout.tonnage`.
        """
        total = Decimal('0')
        for exercise in exercises_data:
            for set_data in exercise.get('sets', []):
                total += Decimal(str(set_data['weight'])) * Decimal(set_data['reps'])
        return int(total)

    def create(self, validated_data):
        """Создает Workout и вложенные ExerciseEntry/SetEntry.

        DRF вызывает этот метод при POST `/api/workouts/`. Из `validated_data`
        достается `exercises`, отдельно считается тоннаж, затем создается
        основная тренировка и вызывается `_save_nested()`.
        """
        exercises_data = validated_data.pop('exercises', []) #убираем упражнения из validated_data, чтобы создать Workout без них. Упражнения мы создадим вручную ниже через _save_nested()
        validated_data['tonnage'] = self.calculate_tonnage(exercises_data)#Считаем тоннаж и добавляем его в validated_data, чтобы он сохранился в Workout
        workout = Workout.objects.create(**validated_data)#Создаем Workout без упражнений, передавая остальные поля из validated_data
        #Workout.objects.create(...) это Django ORM. ORM — штука, которая позволяет писать Python вместо SQL.
        self._save_nested(workout, exercises_data)#Сохраняем упражнения и подходы, передавая созданный workout и данные упражнений

        return workout#Возвращаем созданный workout, чтобы DRF мог отдать его в ответе на POST-запрос

    def update(self, instance, validated_data):
        """Обновляет тренировку и при необходимости пересоздает вложенные записи.

        `instance` - существующий Workout из базы. Если пришли новые exercises,
        старые упражнения и подходы удаляются и создаются заново через
        `_save_nested()`. Для учебного проекта это проще и надежнее, чем
        сопоставлять каждую вложенную запись по id.
        """
        exercises_data = validated_data.pop('exercises', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if exercises_data is not None:
            instance.tonnage = self.calculate_tonnage(exercises_data)
        instance.save()

        if exercises_data is not None:
            instance.exercises.all().delete()
            self._save_nested(instance, exercises_data)
        return instance

    def _save_nested(self, workout, exercises_data):
        """Сохраняет упражнения и подходы, которые пришли внутри одной тренировки.

        На вход получает уже созданный `workout` и список `exercises_data`.
        Для каждого упражнения создает `ExerciseEntry`, а для каждого подхода
        внутри него создает `SetEntry`, связывая записи через foreign key.
        """
        for exercise_index, exercise_data in enumerate(exercises_data): #проходим по каждому упражнению в списке упражнений, который пришел из JSON. enumerate дает нам и индекс упражнения, который нужен для sort_order
            sets_data = exercise_data.pop('sets', [])#убираем подходы из данных упражнения, чтобы создать ExerciseEntry без них. Подходы мы создадим вручную ниже через SetEntry
            exercise = ExerciseEntry.objects.create( 
                workout=workout,
                name=exercise_data['name'],
                sort_order=exercise_data.get('sort_order', exercise_index),
            )
            for set_index, set_data in enumerate(sets_data):#проходим по каждому подходу в списке подходов упражнения. enumerate дает нам индекс подхода, который нужен для sort_order
                SetEntry.objects.create(
                    exercise=exercise,
                    weight=set_data['weight'],
                    reps=set_data['reps'],
                    sort_order=set_data.get('sort_order', set_index),
                )

from decimal import Decimal
from rest_framework import serializers

from .models import ExerciseEntry, SetEntry, Workout


class SetEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SetEntry
        fields = ('id', 'weight', 'reps', 'sort_order')
        read_only_fields = ('id',)


class ExerciseEntrySerializer(serializers.ModelSerializer):
    sets = SetEntrySerializer(many=True)

    class Meta:
        model = ExerciseEntry
        fields = ('id', 'name', 'sort_order', 'sets')
        read_only_fields = ('id',)


class WorkoutSerializer(serializers.ModelSerializer):
    exercises = ExerciseEntrySerializer(many=True)

    class Meta:
        model = Workout
        fields = ('id', 'date', 'duration', 'tonnage', 'created_at', 'updated_at', 'exercises')
        read_only_fields = ('id', 'tonnage', 'created_at', 'updated_at')

    def validate_exercises(self, value):
        if not value:
            raise serializers.ValidationError('Добавьте хотя бы одно упражнение.')
        return value

    def validate(self, attrs):
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
        total = Decimal('0')
        for exercise in exercises_data:
            for set_data in exercise.get('sets', []):
                total += Decimal(str(set_data['weight'])) * Decimal(set_data['reps'])
        return int(total)

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        validated_data['tonnage'] = self.calculate_tonnage(exercises_data)
        workout = Workout.objects.create(**validated_data)
        self._save_nested(workout, exercises_data)
        return workout

    def update(self, instance, validated_data):
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
        for exercise_index, exercise_data in enumerate(exercises_data):
            sets_data = exercise_data.pop('sets', [])
            exercise = ExerciseEntry.objects.create(
                workout=workout,
                name=exercise_data['name'],
                sort_order=exercise_data.get('sort_order', exercise_index),
            )
            for set_index, set_data in enumerate(sets_data):
                SetEntry.objects.create(
                    exercise=exercise,
                    weight=set_data['weight'],
                    reps=set_data['reps'],
                    sort_order=set_data.get('sort_order', set_index),
                )

from django.contrib import admin
from .models import ExerciseEntry, ExerciseReaction, SetEntry, Workout

# Этот файл отвечает только за Django admin.
# Он не участвует напрямую в пользовательском сценарии на сайте, но позволяет
# администратору смотреть и редактировать тренировки, упражнения, подходы и реакции через админ-панель.


class SetEntryInline(admin.TabularInline):
    """Показывает подходы прямо внутри упражнения в Django admin.

    `TabularInline` выводит связанные SetEntry в виде компактной таблицы.
    Это удобно, потому что подходы принадлежат упражнению и их можно редактировать рядом с ним.
    """
    model = SetEntry
    extra = 0


class ExerciseEntryInline(admin.StackedInline):
    """Показывает упражнения внутри тренировки в Django admin.

    `StackedInline` выводит связанные ExerciseEntry внутри формы Workout.
    Связь берется из foreign key `ExerciseEntry.workout`.
    """
    model = ExerciseEntry
    extra = 0


@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    """Настройки админки для тренировок.

    `list_display` задает колонки в списке, `list_filter` добавляет фильтр по дате,
    а `search_fields` позволяет искать тренировки по username владельца.
    """
    list_display = ('id', 'user', 'date', 'duration', 'tonnage', 'updated_at')
    list_filter = ('date',)
    search_fields = ('user__username',)


@admin.register(ExerciseEntry)
class ExerciseEntryAdmin(admin.ModelAdmin):
    """Админка упражнений внутри тренировок.

    В списке видно, к какой тренировке относится упражнение, его название и порядок.
    `inlines = [SetEntryInline]` добавляет редактирование подходов прямо на странице упражнения.
    """
    list_display = ('id', 'workout', 'name', 'sort_order')
    inlines = [SetEntryInline]


@admin.register(SetEntry)
class SetEntryAdmin(admin.ModelAdmin):
    """Админка отдельных подходов.

    Нужна для проверки данных на самом нижнем уровне: вес, повторы и порядок подхода
    внутри конкретного упражнения.
    """
    list_display = ('id', 'exercise', 'weight', 'reps', 'sort_order')


@admin.register(ExerciseReaction)
class ExerciseReactionAdmin(admin.ModelAdmin):
    """Админка реакций на упражнения.

    Здесь можно увидеть, какой пользователь поставил like/dislike какому упражнению.
    Фильтр по `value` быстро отделяет лайки от дизлайков, а поиск работает по пользователю и названию.
    """
    list_display = ('id', 'user', 'exercise_name', 'value', 'updated_at')
    list_filter = ('value',)
    search_fields = ('user__username', 'exercise_name')

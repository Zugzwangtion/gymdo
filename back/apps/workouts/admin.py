from django.contrib import admin
from .models import ExerciseEntry, SetEntry, Workout


class SetEntryInline(admin.TabularInline):
    model = SetEntry
    extra = 0


class ExerciseEntryInline(admin.StackedInline):
    model = ExerciseEntry
    extra = 0


@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'date', 'duration', 'tonnage', 'updated_at')
    list_filter = ('date',)
    search_fields = ('user__username',)


@admin.register(ExerciseEntry)
class ExerciseEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'workout', 'name', 'sort_order')
    inlines = [SetEntryInline]


@admin.register(SetEntry)
class SetEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'exercise', 'weight', 'reps', 'sort_order')

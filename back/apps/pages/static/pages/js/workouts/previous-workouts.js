function getExercisesGroupedSafe() {
    if (typeof getExercisesGroupedByCategory === "function") {
        return getExercisesGroupedByCategory();
    }

    const grouped = {};
    if (typeof exercisesDatabase !== "object" || !exercisesDatabase) return grouped;

    Object.entries(exercisesDatabase).forEach(([name, exercise]) => {
        const category = exercise?.category || "Без категории";
        grouped[category] = grouped[category] || [];
        grouped[category].push(name);
    });

    return grouped;
}

function getExerciseByNameSafe(name) {
    if (typeof getExerciseByName === "function") return getExerciseByName(name);
    if (typeof exercisesDatabase !== "object" || !exercisesDatabase) return null;
    return exercisesDatabase[name] || null;
}

function setDefaultDate() {
    if (!elements.dateInput) return;

    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    if (dateParam) {
        elements.dateInput.value = dateParam;
        return;
    }

    const today = new Date();
    elements.dateInput.value = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");
}

function parseWorkoutDate(dateString) {
    if (!dateString) return null;
    const date = new Date(`${dateString}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getPreviousExercise(exerciseName) {
    const currentDate = parseWorkoutDate(elements.dateInput?.value);
    const sorted = [...state.workouts].sort((a, b) => {
        return parseWorkoutDate(b.date) - parseWorkoutDate(a.date);
    });

    for (const workout of sorted) {
        const workoutDate = parseWorkoutDate(workout.date);
        if (currentDate && workoutDate && workoutDate >= currentDate) continue;

        const match = (workout.exercises || []).find((exercise) => exercise.name === exerciseName);
        if (match) {
            return { workout, exercise: match };
        }
    }

    return null;
}

function getPreviousSet(exercise, index) {
    return exercise.previous?.exercise?.sets?.[index] || null;
}


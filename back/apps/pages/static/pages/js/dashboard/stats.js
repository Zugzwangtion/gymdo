function getStats() {
    return state.workouts.reduce(
        (stats, workout) => {
            stats.totalWorkouts += 1;
            stats.totalTonnage += Number(workout.tonnage || 0);

            (workout.exercises || []).forEach((exercise) => {
                stats.totalExercises += 1;
                stats.totalSets += (exercise.sets || []).length;

                (exercise.sets || []).forEach((set) => {
                    stats.totalReps += Number(set.reps || 0);
                });
            });

            return stats;
        },
        {
            totalWorkouts: 0,
            totalExercises: 0,
            totalSets: 0,
            totalReps: 0,
            totalTonnage: 0
        }
    );
}

function updateStats() {
    const stats = getStats();

    if (elements.totalWorkouts) elements.totalWorkouts.textContent = String(stats.totalWorkouts);
    if (elements.totalExercises) elements.totalExercises.textContent = String(stats.totalExercises);
    if (elements.totalSets) elements.totalSets.textContent = String(stats.totalSets);
    if (elements.totalReps) elements.totalReps.textContent = String(stats.totalReps);
    if (elements.totalTonnage) elements.totalTonnage.textContent = formatTonnage(stats.totalTonnage);
}


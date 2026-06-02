// Словарь терминов в этом файле:
// stats - статистика, то есть итоговые числа по всем тренировкам.
// totalWorkouts - всего тренировок.
// totalExercises - всего упражнений.
// totalSets - всего подходов.
// totalReps - всего повторений.
// totalTonnage - общий тоннаж/нагрузка: сумма веса * повторения.

/**
 * Считает общую статистику по загруженным тренировкам.
 * Проходит по `state.workouts`, упражнениям и подходам, суммируя тренировки, повторы, подходы и тоннаж.
 * Возвращает обычный объект, который потом выводит `updateStats()`.
 */
function getStats() {
    return state.workouts.reduce(
        (stats, workout) => {
            // workout - одна тренировка из списка `state.workouts`.
            stats.totalWorkouts += 1;
            stats.totalTonnage += Number(workout.tonnage || 0);

            (workout.exercises || []).forEach((exercise) => {
                // exercise - одно упражнение внутри тренировки.
                stats.totalExercises += 1;
                stats.totalSets += (exercise.sets || []).length;

                (exercise.sets || []).forEach((set) => {
                    // set - один подход; reps - количество повторений.
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

/**
 * Выводит рассчитанную статистику в HTML главной страницы.
 * Сначала берет готовые числа из `getStats()`, затем записывает их в элементы счетчиков:
 * количество тренировок, упражнений, подходов, повторений и общий тоннаж. Если какого-то элемента
 * нет на странице, проверка `if (elements...)` не дает коду упасть.
 */
function updateStats() {
    const stats = getStats(); //getStats() проходит по state.workouts и считает общую статистику по тренировкам, упражнениям, подходам, повторениям и тоннажу. Результат сохраняется в объекте stats.

    if (elements.totalWorkouts) elements.totalWorkouts.textContent = String(stats.totalWorkouts);
    if (elements.totalExercises) elements.totalExercises.textContent = String(stats.totalExercises);
    if (elements.totalSets) elements.totalSets.textContent = String(stats.totalSets);
    if (elements.totalReps) elements.totalReps.textContent = String(stats.totalReps);
    if (elements.totalTonnage) elements.totalTonnage.textContent = formatTonnage(stats.totalTonnage);
}


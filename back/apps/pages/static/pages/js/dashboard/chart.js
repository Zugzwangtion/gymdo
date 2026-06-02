/**
 * Рисует график прогресса через Chart.js.
 * Данные берутся из `state.workouts`: по датам откладывается тоннаж тренировок.
 * Если график уже был создан раньше, он уничтожается и строится заново, чтобы не было наложения.
 */
function renderChart() {
    if (!elements.chartCanvas || typeof Chart === "undefined") {// Если элемент для графика не найден или библиотека Chart.js не загружена, функция просто возвращает и не пытается рисовать график. Это предотвращает ошибки в случае отсутствия необходимых ресурсов.
        return;
    }

    if (state.chartInstance) { // Если график уже был создан, уничтожаем его перед созданием нового. Это предотвращает наложение нескольких графиков друг на друга при обновлении данных или перерисовке страницы.
        state.chartInstance.destroy();
    }

    const sortedWorkouts = [...state.workouts].sort(// Сортируем тренировки по дате от старых к новым, чтобы график отображал прогресс во времени. Это важно для правильного отображения данных на оси X, которая представляет даты тренировок.
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    state.chartInstance = new Chart(elements.chartCanvas, {// Создаем новый экземпляр графика Chart.js, используя элемент canvas и передавая ему конфигурацию. Конфигурация включает тип графика, данные для осей и настройки отображения.
        type: "line",
        data: {
            labels: sortedWorkouts.map((workout) => workout.date),// На оси X откладываем даты тренировок, чтобы видеть прогресс по времени. Это позволяет пользователям анализировать свои тренировки и видеть, как они развивались с течением времени.
            datasets: [
                {
                    label: "Тоннаж, т",
                    data: sortedWorkouts.map((workout) => Number(workout.tonnage || 0) / 1000),
                    borderColor: "#4caf50",
                    tension: 0.3,
                    yAxisID: "yTonnage"
                },
                {
                    label: "Длительность (мин)",
                    data: sortedWorkouts.map((workout) => Number(workout.duration || 0)),
                    borderColor: "#ffeb3b",
                    tension: 0.3,
                    yAxisID: "yDuration"
                }
            ]
        },
        options: {// Настройки графика включают адаптивность, взаимодействие с данными, стили для легенды и осей. Это обеспечивает удобное отображение информации и улучшает визуальное восприятие данных на графике.
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    labels: {
                        color: "white"
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: "white"
                    }
                },
                yTonnage: {
                    type: "linear",
                    position: "left",
                    ticks: {
                        color: "#4caf50"
                    },
                    title: {
                        display: true,
                        text: "Тоннаж, т",
                        color: "#4caf50"
                    }
                },
                yDuration: {
                    type: "linear",
                    position: "right",
                    ticks: {
                        color: "#ffeb3b"
                    },
                    title: {
                        display: true,
                        text: "Минуты",
                        color: "#ffeb3b"
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}


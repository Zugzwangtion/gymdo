function renderChart() {
    if (!elements.chartCanvas || typeof Chart === "undefined") {
        return;
    }

    if (state.chartInstance) {
        state.chartInstance.destroy();
    }

    const sortedWorkouts = [...state.workouts].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    state.chartInstance = new Chart(elements.chartCanvas, {
        type: "line",
        data: {
            labels: sortedWorkouts.map((workout) => workout.date),
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
        options: {
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


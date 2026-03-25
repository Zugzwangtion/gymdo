let currentUser = null;
let isAuthenticated = false;
let workouts = [];

let currentDate = new Date();
let chartInstance = null;

// Элементы интерфейса
const modal = document.getElementById("workoutModal");
const closeBtn = document.getElementById("closeModal");

const userBadge = document.getElementById("userBadge");
const loginBtn = document.getElementById("loginBtn");
const guideLink = document.getElementById("guideLink");
const pageSubtitle = document.getElementById("pageSubtitle");

const authPromptModal = document.getElementById("authPromptModal");
const authPromptText = document.getElementById("authPromptText");
const closeAuthPrompt = document.getElementById("closeAuthPrompt");

const supportBtn = document.getElementById("supportBtn");
const supportModal = document.getElementById("supportModal");
const closeSupport = document.getElementById("closeSupport");
const sendSupport = document.getElementById("sendSupport");

// ===== АВТОРИЗАЦИЯ =====
function requireAuth(message = "Чтобы пользоваться этой функцией, войдите в аккаунт.") {
    if (authPromptText && authPromptModal) {
        authPromptText.textContent = message;
        authPromptModal.style.display = "flex";
    } else {
        alert(message);
    }
}

function closeAuthModal() {
    if (authPromptModal) {
        authPromptModal.style.display = "none";
    }
}

// ===== ПЕРЕХОД НА СТРАНИЦУ ДОБАВЛЕНИЯ =====
function goToAddPage(date = "") {
    if (!isAuthenticated) {
        requireAuth("Чтобы добавить тренировку, войдите в аккаунт.");
        return;
    }

    location.href = date ? `add.html?date=${date}` : "add.html";
}

// ===== УДАЛЕНИЕ ТРЕНИРОВКИ =====
async function deleteWorkout(id, dateStr) {
    if (!isAuthenticated) return;

    if (!confirm("Удалить тренировку за " + dateStr + "?")) return;

    try {
        await deleteWorkoutById(id);
        workouts = workouts.filter(w => w.id !== id);

        updateStats();
        renderCalendar();
        renderChart();
        closeModal();
    } catch (error) {
        alert(error.message || "Ошибка удаления тренировки");
    }
}

// ===== КАЛЕНДАРЬ =====
function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    const title = document.getElementById("monthTitle");

    if (!grid || !title) return;

    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    title.textContent = currentDate.toLocaleString("ru", {
        month: "long",
        year: "numeric"
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < offset; i++) {
        grid.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDate(year, month + 1, day);
        const workout = workouts.find(w => w.date === dateStr);

        const div = document.createElement("div");
        div.className = "day" + (workout ? " workout" : "");
        div.textContent = day;

        div.onclick = () => {
            if (!isAuthenticated) {
                requireAuth("Чтобы открыть календарь тренировок и добавлять занятия, войдите в аккаунт.");
                return;
            }

            if (workout) {
                showWorkoutDetails(workout);
            } else {
                goToAddPage(dateStr);
            }
        };

        grid.appendChild(div);
    }
}

// ===== СТАТИСТИКА =====
function updateStats() {
    let totalExercises = 0;
    let totalSets = 0;
    let totalReps = 0;
    let totalTonnage = 0;

    workouts.forEach(w => {
        totalTonnage += Number(w.tonnage || 0);

        (w.exercises || []).forEach(ex => {
            totalExercises++;
            totalSets += (ex.sets || []).length;

            (ex.sets || []).forEach(s => {
                totalReps += Number(s.reps || 0);
            });
        });
    });

    document.getElementById("totalWorkouts").textContent = workouts.length;
    document.getElementById("totalExercises").textContent = totalExercises;
    document.getElementById("totalSets").textContent = totalSets;
    document.getElementById("totalReps").textContent = totalReps;
    document.getElementById("totalTonnage").textContent = totalTonnage;
}

// ===== ГРАФИК =====
function renderChart() {
    const ctx = document.getElementById("chart");
    if (!ctx || typeof Chart === "undefined") return;

    if (chartInstance) {
        chartInstance.destroy();
    }

    const sorted = [...workouts].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: sorted.map(w => w.date),
            datasets: [
                {
                    label: "Тоннаж",
                    data: sorted.map(w => Number(w.tonnage || 0)),
                    borderColor: "#4caf50",
                    tension: 0.3,
                    yAxisID: "yTonnage"
                },
                {
                    label: "Длительность (мин)",
                    data: sorted.map(w => Number(w.duration || 0)),
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
                        text: "Тоннаж",
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

// ===== МОДАЛКА ТРЕНИРОВКИ =====
function showWorkoutDetails(workout) {
    const content = document.getElementById("modalContent");
    if (!content || !modal) return;

    let html = `
        <h2>${workout.date}</h2>
        <p>Длительность: ${workout.duration} мин</p>
        <p>Тоннаж: ${workout.tonnage}</p>
    `;

    (workout.exercises || []).forEach(ex => {
        html += `<h3>${ex.name}</h3>`;

        (ex.sets || []).forEach((set, i) => {
            html += `
                <div class="workout-set">
                    Подход ${i + 1}: ${set.weight} кг × ${set.reps}
                </div>
            `;
        });
    });

    html += `
        <br>
        <button onclick="deleteWorkout(${workout.id}, '${workout.date}')">
            Удалить тренировку
        </button>
    `;

    content.innerHTML = html;
    modal.style.display = "flex";
}

function closeModal() {
    if (modal) {
        modal.style.display = "none";
    }
}

if (closeBtn) {
    closeBtn.onclick = closeModal;
}

if (closeAuthPrompt) {
    closeAuthPrompt.onclick = closeAuthModal;
}

// ===== КНОПКА СПРАВОЧНИКА ДЛЯ ГОСТЯ =====
if (guideLink) {
    guideLink.onclick = (event) => {
        if (!isAuthenticated) {
            event.preventDefault();
            requireAuth("Чтобы открыть справочник, войдите в аккаунт.");
        }
    };
}

// ===== ПЕРЕКЛЮЧЕНИЕ МЕСЯЦЕВ =====
document.getElementById("prevMonth").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};

document.getElementById("nextMonth").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

// ===== ФОРМАТ ДАТЫ =====
function formatDate(y, m, d) {
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ===== ПОДДЕРЖКА =====
if (supportBtn) {
    supportBtn.onclick = () => {
        if (!isAuthenticated) {
            requireAuth("Чтобы обратиться в поддержку, войдите в аккаунт.");
            return;
        }

        if (supportModal) {
            supportModal.style.display = "flex";
        }
    };
}

if (closeSupport) {
    closeSupport.onclick = () => {
        if (supportModal) {
            supportModal.style.display = "none";
        }
    };
}

if (sendSupport) {
    sendSupport.onclick = async () => {
        if (!isAuthenticated) {
            requireAuth("Чтобы отправить сообщение в поддержку, войдите в аккаунт.");
            return;
        }

        const type = document.getElementById("supportType").value;
        const message = document.getElementById("supportMessage").value.trim();

        if (!message) {
            alert("Введите сообщение");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/support", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: currentUser?.username || "Неизвестно",
                    type,
                    message
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Сообщение отправлено!");
                document.getElementById("supportMessage").value = "";
                supportModal.style.display = "none";
            } else {
                alert(data.error || "Ошибка отправки");
            }
        } catch (error) {
            alert("Не удалось отправить сообщение. Проверь, запущен ли support server.");
        }
    };
}

// ===== ЗАКРЫТИЕ ПО КЛИКУ ВНЕ ОКНА =====
window.onclick = (event) => {
    if (event.target === modal) {
        closeModal();
    }

    if (event.target === supportModal) {
        supportModal.style.display = "none";
    }

    if (event.target === authPromptModal) {
        closeAuthModal();
    }
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
async function initPage() {
    try {
        currentUser = await getCurrentUser();
        isAuthenticated = !!currentUser;;
    } catch {
        currentUser = null;
        isAuthenticated = false;
    }

    if (isAuthenticated) {
        if (loginBtn) loginBtn.style.display = "none";
        if (userBadge) {
            userBadge.style.display = "flex";
            userBadge.textContent = currentUser.username[0].toUpperCase();

            userBadge.onclick = async () => {
                const confirmExit = confirm("Выйти из аккаунта?");
                if (!confirmExit) return;

                try {
                    await logoutUser();
                } catch (_) {}

                location.href = "index.html";
            };
        }

        if (pageSubtitle) {
            pageSubtitle.textContent = "Следи за прогрессом, добавляй тренировки в календарь и анализируй свои результаты.";
        }

        try {
            workouts = await getWorkouts();
        } catch (error) {
            workouts = [];
            alert(error.message || "Не удалось загрузить тренировки");
        }
    } else {
        if (userBadge) userBadge.style.display = "none";
        if (loginBtn) loginBtn.style.display = "inline-flex";

        if (pageSubtitle) {
            pageSubtitle.textContent = "Это главная страница GymDo. Чтобы сохранять тренировки, открывать справочник и пользоваться функциями приложения, войдите в аккаунт.";
        }

        workouts = [];
    }

    renderCalendar();
    updateStats();
    renderChart();
}

initPage();
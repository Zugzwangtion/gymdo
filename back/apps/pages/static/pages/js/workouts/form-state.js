let currentUser = null;

const effortOptions = [
    { value: "", label: "Не выбрано", tone: "neutral" },
    { value: "warmup", label: "Размин.", tone: "warmup" },
    { value: "low", label: "Низкое", tone: "low" },
    { value: "medium", label: "Среднее", tone: "medium" },
    { value: "high", label: "Высокое", tone: "high" },
    { value: "max", label: "Максим.", tone: "max" }
];

const state = {
    exercises: [],
    workouts: [],
    expandedCategories: new Set(),
    editing: null,
    mode: "manual",
    timerStartedAt: null,
    lastExerciseFinishedAt: null,
    lastSetFinishedAt: null,
    elapsedSeconds: 0,
    timerIntervalId: null
};

const elements = {
    exercisesContainer: document.getElementById("exercisesContainer"),
    workoutForm: document.getElementById("workoutForm"),
    dateInput: document.getElementById("date"),
    durationInput: document.getElementById("duration"),
    modeInputs: document.querySelectorAll('input[name="workoutMode"]'),
    manualDurationGroup: document.getElementById("manualDurationGroup"),
    executionTimerPanel: document.getElementById("executionTimerPanel"),
    totalTimerDisplay: document.getElementById("totalTimerDisplay"),
    exerciseTimerDisplay: document.getElementById("exerciseTimerDisplay"),
    restTimerDisplay: document.getElementById("restTimerDisplay"),
    submitWorkoutButton: document.getElementById("submitWorkoutButton"),
    openExercisePickerBtn: document.getElementById("openExercisePickerBtn"),
    exercisePickerModal: document.getElementById("exercisePickerModal"),
    exercisePickerBody: document.getElementById("exercisePickerBody"),
    pickerTitle: document.getElementById("pickerTitle"),
    pickerSubtitle: document.getElementById("pickerSubtitle"),
    closeExercisePickerBtn: document.getElementById("closeExercisePicker"),
    emptyExercisesState: document.getElementById("emptyExercisesState")
};

function goBack() {
    window.location.href = "/";
}

function generateId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}


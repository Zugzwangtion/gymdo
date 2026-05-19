function normalizeSetValue(value) {
    if (value === "" || value == null) return 0;
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function collectExercisesPayload() {
    return state.exercises
        .map((exercise) => {
            const sets = exercise.sets
                .map((set, index) => ({
                    reps: normalizeSetValue(set.reps),
                    weight: normalizeSetValue(set.weight),
                    effort: set.effort || "",
                    sort_order: index
                }))
                .filter((set) => set.reps > 0 || set.weight > 0);

            return { name: exercise.name, sets };
        })
        .filter((exercise) => exercise.sets.length > 0);
}

function calculateTonnage(exercises) {
    return exercises.reduce((total, exercise) => {
        return total + exercise.sets.reduce((sum, set) => {
            return sum + Number(set.reps || 0) * Number(set.weight || 0);
        }, 0);
    }, 0);
}

function validateWorkoutForm() {
    if (!elements.workoutForm?.checkValidity()) {
        elements.workoutForm?.reportValidity();
        return false;
    }

    if (!collectExercisesPayload().length) {
        alert("Р”РѕР±Р°РІСЊ С…РѕС‚СЏ Р±С‹ РѕРґРЅРѕ СѓРїСЂР°Р¶РЅРµРЅРёРµ Рё Р·Р°РїРѕР»РЅРё С…РѕС‚СЏ Р±С‹ РѕРґРёРЅ РїРѕРґС…РѕРґ.");
        return false;
    }

    return true;
}


function bindEvents() {
    elements.modeInputs?.forEach((input) => {
        input.addEventListener("change", (event) => {
            if (event.target.checked) setWorkoutMode(event.target.value);
        });
    });
    elements.openExercisePickerBtn?.addEventListener("click", openExercisePicker);
    elements.closeExercisePickerBtn?.addEventListener("click", closeExercisePicker);
    elements.workoutForm?.addEventListener("submit", handleSubmit);
    elements.dateInput?.addEventListener("change", () => {
        state.exercises.forEach((exercise) => {
            exercise.previous = getPreviousExercise(exercise.name);
            if (!exercise.sets.length) exercise.sets = createSetsFromPrevious(exercise.previous);
        });
        renderExercises();
    });

    elements.exercisePickerModal?.addEventListener("click", (event) => {
        if (event.target === elements.exercisePickerModal) closeExercisePicker();
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeExercisePicker();
            closeSetEditor();
        }
    });
    window.addEventListener("beforeunload", stopExecutionTimer);
}

async function initAddPage() {
    try {
        currentUser = await getCurrentUser();
        if (!currentUser) {
            window.location.href = "/login/";
            return;
        }
    } catch {
        window.location.href = "/login/";
        return;
    }

    setDefaultDate();

    try {
        state.workouts = await getWorkouts();
    } catch {
        state.workouts = [];
    }

    bindEvents();
    setWorkoutMode("manual");
    renderExercises();
    updateEmptyState();
}

initAddPage();

function getReactionState(exerciseName) {
    return exerciseReactions.get(exerciseName) || {
        likes: 0,
        dislikes: 0,
        user_reaction: null
    };
}

function setReactionState(reaction) {
    if (!reaction?.exercise_name) {
        return;
    }

    exerciseReactions.set(reaction.exercise_name, {
        likes: reaction.likes || 0,
        dislikes: reaction.dislikes || 0,
        user_reaction: reaction.user_reaction || null
    });
}

function applyReactionState(exerciseName) {
    const state = getReactionState(exerciseName);
    const item = Array.from(guideContainer?.querySelectorAll("[data-exercise-name]") || [])
        .find((element) => element.dataset.exerciseName === exerciseName);

    if (!item) {
        return;
    }

    const likeButton = item.querySelector('[data-reaction-value="like"]');
    const dislikeButton = item.querySelector('[data-reaction-value="dislike"]');
    const likeCount = item.querySelector('[data-reaction-count="like"]');
    const dislikeCount = item.querySelector('[data-reaction-count="dislike"]');

    if (likeCount) {
        likeCount.textContent = String(state.likes);
    }

    if (dislikeCount) {
        dislikeCount.textContent = String(state.dislikes);
    }

    likeButton?.classList.toggle("active", state.user_reaction === "like");
    dislikeButton?.classList.toggle("active", state.user_reaction === "dislike");
}

function applyAllReactionStates() {
    exerciseReactions.forEach((_, exerciseName) => applyReactionState(exerciseName));
}

function applyExerciseReactions(data) {
    exerciseReactions.clear();

    (data?.reactions || []).forEach(setReactionState);
    applyAllReactionStates();
}

async function loadExerciseReactions() {
    try {
        applyExerciseReactions(await getExerciseReactions());
    } catch (error) {
        console.warn(error.message || "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЂРµР°РєС†РёРё");
    }
}

async function handleReactionClick(exerciseName, value) {
    try {
        const reaction = await voteExerciseReaction(exerciseName, value);
        setReactionState(reaction);
        applyReactionState(exerciseName);
    } catch (error) {
        alert(error.message || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ СЂРµР°РєС†РёСЋ");
    }
}

function createReactionButton(exerciseName, value, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reaction-btn";
    button.dataset.reactionValue = value;
    button.setAttribute("aria-label", label);

    const icon = document.createElement("span");
    icon.className = "reaction-icon";
    icon.textContent = value === "like" ? "рџ‘Ќ" : "рџ‘Ћ";

    const count = document.createElement("span");
    count.className = "reaction-count";
    count.dataset.reactionCount = value;
    count.textContent = "0";

    button.append(icon, count);
    button.addEventListener("click", (event) => {
        event.stopPropagation();
        handleReactionClick(exerciseName, value);
    });

    return button;
}

function stopReactionStream() {
    if (reactionEventSource) {
        reactionEventSource.close();
        reactionEventSource = null;
    }
}

function startReactionStream() {
    stopReactionStream();

    if (typeof EventSource !== "function") {
        console.warn("Р‘СЂР°СѓР·РµСЂ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ SSE");
        return;
    }

    reactionEventSource = createExerciseReactionsStream();

    reactionEventSource.addEventListener("reactions", (event) => {
        try {
            applyExerciseReactions(JSON.parse(event.data));
        } catch (error) {
            console.warn(error.message || "РќРµ СѓРґР°Р»РѕСЃСЊ СЂР°Р·РѕР±СЂР°С‚СЊ РѕР±РЅРѕРІР»РµРЅРёРµ СЂРµР°РєС†РёР№");
        }
    });

    reactionEventSource.addEventListener("error", () => {
        console.warn("SSE-СЃРѕРµРґРёРЅРµРЅРёРµ СЂРµР°РєС†РёР№ РІСЂРµРјРµРЅРЅРѕ РЅРµРґРѕСЃС‚СѓРїРЅРѕ");
    });
}


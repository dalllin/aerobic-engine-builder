const PDFJS_VERSION = "6.5.438";
const PDFJS_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.mjs`;
const PDFJS_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 30;

const form = document.getElementById("planner-form");
const output = document.getElementById("plan-output");
const summary = document.getElementById("plan-summary");
const metrics = document.getElementById("metrics");
const weeksElement = document.getElementById("weeks");
const progressionNote = document.getElementById("progression-note");
const pdfInput = document.getElementById("previous-pdf");
const pdfStatus = document.getElementById("pdf-status");
const fileName = document.getElementById("file-name");
const appStatus = document.getElementById("app-status");
const exerciseTooltip = document.getElementById("exercise-tooltip");

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const levelSettings = {
    beginner: {
        label: "New or returning",
        weeklyAerobicStart: 90,
        sets: 2,
        reps: "8–12",
        reserve: "3–4 good reps left",
        rest: "60–90 sec",
        exerciseCount: 4
    },
    intermediate: {
        label: "Consistent training",
        weeklyAerobicStart: 150,
        sets: 2,
        reps: "8–12",
        reserve: "2–3 good reps left",
        rest: "60–90 sec",
        exerciseCount: 5
    },
    advanced: {
        label: "Experienced",
        weeklyAerobicStart: 180,
        sets: 3,
        reps: "6–12",
        reserve: "2–3 good reps left",
        rest: "90–120 sec",
        exerciseCount: 6
    }
};

const cardioModes = {
    run: { label: "run or run-walk", title: "Running / run-walk" },
    walk: { label: "brisk walk or hike", title: "Walking / hiking" },
    cycle: { label: "bike", title: "Cycling" },
    row: { label: "rower", title: "Rowing" },
    swim: { label: "swim", title: "Swimming" },
    elliptical: { label: "elliptical", title: "Elliptical" }
};

const equipmentModes = ["bodyweight", "bands", "weights", "machines"];
const favoriteLabels = {
    run: "running / run-walk",
    walk: "walking / hiking",
    cycle: "cycling",
    row: "rowing",
    swim: "swimming",
    elliptical: "elliptical",
    bodyweight: "bodyweight strength",
    bands: "resistance bands",
    weights: "dumbbells / weights",
    machines: "gym machines",
    mobility: "mobility / balance",
    hills: "hills / short strides",
    tempo: "tempo / threshold workouts",
    intervals: "VO₂-style intervals",
    long: "long easy endurance"
};

const jointLabels = {
    knee: "knee-support work",
    ankle: "ankle-support work",
    hip: "hip-support work",
    shoulder: "shoulder-support work",
    wrist: "wrist / elbow-support work"
};

const movementLibrary = {
    squat: [
        { name: "chair squat", gear: "bodyweight", joints: ["knee", "hip"] },
        { name: "box squat", gear: "bodyweight", joints: ["knee", "hip"] },
        { name: "banded squat", gear: "bands", joints: ["knee", "hip"] },
        { name: "goblet squat", gear: "weights", joints: ["knee", "hip"] },
        { name: "leg press", gear: "machines", joints: ["knee", "hip"] }
    ],
    hinge: [
        { name: "glute bridge", gear: "bodyweight", joints: ["hip", "knee"] },
        { name: "hip hinge", gear: "bodyweight", joints: ["hip"] },
        { name: "band pull-through", gear: "bands", joints: ["hip"] },
        { name: "dumbbell Romanian deadlift", gear: "weights", joints: ["hip"] },
        { name: "hamstring curl", gear: "machines", joints: ["knee", "hip"] }
    ],
    singleLeg: [
        { name: "supported split squat", gear: "bodyweight", joints: ["knee", "hip", "ankle"] },
        { name: "low step-up", gear: "bodyweight", joints: ["knee", "hip", "ankle"] },
        { name: "band-resisted step-up", gear: "bands", joints: ["knee", "hip"] },
        { name: "supported reverse lunge", gear: "weights", joints: ["knee", "hip"] },
        { name: "single-leg press", gear: "machines", joints: ["knee", "hip"] }
    ],
    push: [
        { name: "wall or incline push-up", gear: "bodyweight", joints: ["shoulder", "wrist"] },
        { name: "band chest press", gear: "bands", joints: ["shoulder"] },
        { name: "dumbbell floor press", gear: "weights", joints: ["shoulder", "wrist"] },
        { name: "chest press", gear: "machines", joints: ["shoulder"] }
    ],
    pull: [
        { name: "prone W raise", gear: "bodyweight", joints: ["shoulder"] },
        { name: "band row", gear: "bands", joints: ["shoulder", "wrist"] },
        { name: "one-arm dumbbell row", gear: "weights", joints: ["shoulder", "wrist"] },
        { name: "seated row", gear: "machines", joints: ["shoulder"] }
    ],
    core: [
        { name: "dead bug", gear: "bodyweight", joints: ["hip"] },
        { name: "bird dog", gear: "bodyweight", joints: ["hip", "shoulder"] },
        { name: "Pallof press", gear: "bands", joints: ["hip", "shoulder"] },
        { name: "suitcase carry", gear: "weights", joints: ["wrist", "shoulder"] }
    ]
};

const patternGuides = {
    squat: {
        description: "Lower your hips by bending at the hips and knees, then stand at a controlled pace.",
        focus: "Quadriceps and glutes, with controlled knee and hip alignment.",
        cue: "Keep your whole foot grounded and let your knees track in the same direction as your toes."
    },
    hinge: {
        description: "Push your hips back with a soft knee bend, then return by bringing your hips forward.",
        focus: "Glutes and hamstrings.",
        cue: "Keep your trunk steady and use a comfortable range; do not force a deep stretch."
    },
    singleLeg: {
        description: "Use a small step or split stance and lower only as far as you can control.",
        focus: "Quads, glutes, and single-leg balance.",
        cue: "Hold a stable support if needed; keep the front foot planted and knee controlled."
    },
    push: {
        description: "Press the resistance away from your body, then return slowly.",
        focus: "Chest, shoulders, and triceps.",
        cue: "Keep wrists comfortable and shoulders away from your ears."
    },
    pull: {
        description: "Draw the resistance toward your ribs, then let your arms return with control.",
        focus: "Upper back, lats, and biceps.",
        cue: "Keep your trunk steady; avoid shrugging or swinging to finish the rep."
    },
    core: {
        description: "Move an arm or leg while keeping your trunk steady and breathing smoothly.",
        focus: "Abdominal and trunk muscles that resist unwanted movement.",
        cue: "Use a smaller range if your lower back arches or your breathing becomes strained."
    }
};

const jointGuides = {
    knee: {
        description: "Use a light, controlled range for this knee-support variation.",
        focus: "Quadriceps and the muscles that help control the knee during bending and straightening.",
        cue: "Keep the movement smooth and pain-free; avoid forcing the knee into a locked position."
    },
    ankle: {
        description: "Move slowly through a comfortable ankle range or hold a steady balance position.",
        focus: "Calves, shin muscles, foot control, and balance.",
        cue: "Use a wall or rail for support and keep pressure spread across the foot."
    },
    hip: {
        description: "Move the leg from the hip while keeping your pelvis and trunk steady.",
        focus: "Gluteal and hip muscles that support single-leg control.",
        cue: "Use a small range and avoid twisting your trunk to create movement."
    },
    shoulder: {
        description: "Move the arm with light resistance while keeping the shoulder relaxed.",
        focus: "Rotator cuff and upper-back muscles that help control the shoulder blade and arm.",
        cue: "Keep the effort light and smooth; do not shrug or force the arm through discomfort."
    },
    wrist: {
        description: "Use light resistance to move the wrist or forearm slowly through a comfortable range.",
        focus: "Forearm muscles that support wrist and elbow movement.",
        cue: "Keep the motion small and pain-free; stop if tingling or sharp pain occurs."
    }
};

const defaultSupportGuides = {
    "standing calf raise": {
        description: "Rise onto the balls of your feet, pause briefly, then lower with control.",
        focus: "Calves and ankle control.",
        cue: "Use a wall or rail for balance and avoid rolling the ankles outward."
    },
    "single-leg balance near support": {
        description: "Stand near a stable support and hold a comfortable single-leg position.",
        focus: "Foot, ankle, hip stabilizers, and balance.",
        cue: "Keep the standing foot grounded and use the support before balance becomes unstable."
    },
    "90/90 hip switches": {
        description: "Sit with both knees bent and gently rotate them from side to side.",
        focus: "Hip rotation and comfortable mobility.",
        cue: "Move slowly within a relaxed range; do not press the knees down."
    },
    "wall slides": {
        description: "Slide your arms up a wall and back down while keeping the movement comfortable.",
        focus: "Shoulder-blade control and shoulder mobility.",
        cue: "Keep ribs relaxed and stop before the shoulders shrug or pinch."
    }
};

const jointSupportLibrary = {
    knee: [
        { name: "low step-down", gear: "bodyweight", dose: "8–10 each side" },
        { name: "band terminal knee extension", gear: "bands", dose: "10–15 each side" },
        { name: "light leg extension", gear: "machines", dose: "10–12 reps" }
    ],
    ankle: [
        { name: "standing calf raise", gear: "bodyweight", dose: "10–15 reps" },
        { name: "tibialis raise against a wall", gear: "bodyweight", dose: "10–15 reps" },
        { name: "single-leg balance near support", gear: "bodyweight", dose: "20–30 sec each side" }
    ],
    hip: [
        { name: "side-lying clamshell", gear: "bodyweight", dose: "10–15 each side" },
        { name: "lateral band walk", gear: "bands", dose: "8–12 steps each way" },
        { name: "standing hip abduction", gear: "machines", dose: "10–12 each side" }
    ],
    shoulder: [
        { name: "band external rotation", gear: "bands", dose: "10–15 each side" },
        { name: "band pull-apart", gear: "bands", dose: "10–15 reps" },
        { name: "light cable face pull", gear: "machines", dose: "10–15 reps" }
    ],
    wrist: [
        { name: "light wrist extension", gear: "weights", dose: "10–12 each side" },
        { name: "gentle forearm rotation", gear: "bodyweight", dose: "8–10 each side" },
        { name: "light band wrist extension", gear: "bands", dose: "10–12 each side" }
    ]
};

let previousPlanContext = null;
let latestPlan = null;

function selectedValues(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function normalizeProfile() {
    const level = Object.hasOwn(levelSettings, document.getElementById("fitness").value)
        ? document.getElementById("fitness").value
        : "beginner";
    const days = Number(document.getElementById("days").value);
    const allowedDays = [3, 4, 5, 6, 7].includes(days) ? days : 5;
    const time = Number(document.getElementById("time-limit").value);
    const allowedTime = [20, 30, 45, 60, 90].includes(time) ? time : 45;
    const responses = ["new", "manageable", "too-easy", "too-hard", "missed"];
    const responseValue = document.getElementById("previous-response").value;

    return {
        level,
        days: allowedDays,
        time: allowedTime,
        response: responses.includes(responseValue) ? responseValue : "new",
        favorites: selectedValues("favorites"),
        joints: selectedValues("joints")
    };
}

function chooseCardioMode(profile, salt = 0) {
    const favorites = profile.favorites.filter((value) => Object.hasOwn(cardioModes, value));
    if (favorites.length) return favorites[salt % favorites.length];
    return profile.level === "beginner" ? "walk" : "run";
}

function chooseEquipment(profile, salt = 0) {
    const preferred = profile.favorites.filter((value) => equipmentModes.includes(value));
    if (preferred.length) return preferred[salt % preferred.length];
    return "bodyweight";
}

function chooseMovement(pattern, profile, salt = 0) {
    const options = movementLibrary[pattern];
    const equipment = chooseEquipment(profile, salt);
    const ranked = options.map((item, index) => {
        let score = item.gear === equipment ? 4 : 0;
        if (profile.joints.some((joint) => item.joints.includes(joint))) score += 2;
        score -= Math.abs(index - salt) * 0.03;
        return { item, score };
    }).sort((a, b) => b.score - a.score);
    return ranked[0].item;
}

function chooseJointAccessory(joint, profile, salt = 0) {
    const options = jointSupportLibrary[joint] || [];
    if (!options.length) return null;
    const preferredGear = chooseEquipment(profile, salt);
    const ranked = [...options].sort((a, b) => Number(b.gear === preferredGear) - Number(a.gear === preferredGear));
    return ranked[0];
}

function getStrengthTargets(profile, availableMinutes = profile.time) {
    const settings = levelSettings[profile.level];
    const sets = profile.level === "beginner" || availableMinutes <= 30 ? 2 : settings.sets;
    return {
        sets,
        reps: settings.reps,
        reserve: settings.reserve,
        rest: availableMinutes <= 15 ? "30–60 sec as needed" : settings.rest,
        count: availableMinutes <= 20 ? 4 : availableMinutes <= 30 ? 4 : availableMinutes <= 45 ? 5 : 6
    };
}

function strengthBlock(which, profile, weekIndex, availableMinutes = profile.time) {
    const focusedJoint = profile.joints.length
        ? profile.joints[(weekIndex + (which === "B" ? 1 : 0)) % profile.joints.length]
        : null;
    const targets = getStrengthTargets(profile, availableMinutes);
    const mobilityAccessory = which === "A"
        ? { name: "90/90 hip switches", dose: "6–8 controlled each side" }
        : { name: "wall slides", dose: "8–10 controlled reps" };
    const defaultAccessory = which === "A"
        ? { name: "standing calf raise", dose: "10–15 reps" }
        : { name: "single-leg balance near support", dose: "20–30 sec each side" };
    const accessory = focusedJoint
        ? chooseJointAccessory(focusedJoint, profile, weekIndex)
        : profile.favorites.includes("mobility") ? mobilityAccessory : defaultAccessory;
    const patterns = which === "A"
        ? ["squat", "push", "core", "pull", "hinge"]
        : ["hinge", "pull", "core", "singleLeg", "push"];
    const baseCount = Math.max(3, targets.count - (accessory ? 1 : 0));
    const selectedPatterns = patterns.slice(0, baseCount);
    if (baseCount >= 4 && !selectedPatterns.includes("core")) selectedPatterns[baseCount - 1] = "core";
    const moves = selectedPatterns.map((pattern, index) => ({
        ...chooseMovement(pattern, profile, weekIndex + index + (which === "B" ? 2 : 0)),
        pattern,
        dose: pattern === "core" ? "20–30 sec each side" : `${targets.reps} reps`,
        guide: patternGuides[pattern]
    }));

    if (accessory && moves.length < targets.count) {
        moves.push({
            name: accessory.name,
            dose: accessory.dose,
            guide: focusedJoint ? jointGuides[focusedJoint] : defaultSupportGuides[accessory.name] || {
                description: "Move gently and stay within a comfortable range.",
                focus: "Mobility and movement control.",
                cue: "Keep the movement smooth and relaxed."
            }
        });
    }

    const focusNote = focusedJoint
        ? accessory ? ` Added ${jointLabels[focusedJoint]}.` : ` Exercise choices prioritize ${jointLabels[focusedJoint]}.`
        : profile.favorites.includes("mobility")
            ? " Includes a mobility accessory."
            : which === "A" ? " Includes calf/ankle support." : " Includes balance support.";

    return {
        type: "strength",
        title: `Strength & stability ${which}`,
        minutes: availableMinutes,
        exercises: moves,
        target: `${targets.sets} sets each · ${targets.reserve} in reserve · ${targets.rest} between sets.${focusNote}`
    };
}

function intervalDetails(kind, profile, minutes, feedback) {
    const warm = minutes <= 30 ? 3 : 6;
    const cool = minutes <= 30 ? 2 : 4;
    const mainBudget = Math.max(2, minutes - warm - cool);
    const easier = feedback === "too-hard" || feedback === "missed";

    if (kind === "threshold" || profile.level === "beginner" || easier) {
        const rep = profile.level === "beginner" ? 2 : 4;
        const recovery = 2;
        const repetitions = Math.max(1, Math.min(4, Math.floor((mainBudget + recovery) / (rep + recovery))));
        return {
            title: easier ? "Controlled tempo" : "Threshold intervals",
            details: `${warm} min easy warm-up; ${repetitions} × ${rep} min comfortably hard (RPE 6/10), with ${recovery} min easy between; ${cool} min easy cool-down.`,
            target: "Controlled effort: speak in short phrases; finish feeling you could do one more repeat."
        };
    }

    const rep = profile.level === "advanced" ? 3 : 2;
    const recovery = rep;
    const repetitions = Math.max(1, Math.min(5, Math.floor((mainBudget + recovery) / (rep + recovery))));
    return {
        title: "VO₂-style intervals",
        details: `${warm} min easy warm-up; ${repetitions} × ${rep} min hard but repeatable (RPE 7–8/10), with ${recovery} min easy between; ${cool} min easy cool-down.`,
        target: "Keep the pace even. End a repeat early if form or control breaks down."
    };
}

function cardioBlock(kind, profile, minutes, weekIndex, salt = 0) {
    const mode = cardioModes[chooseCardioMode(profile, salt)].label;

    if (kind === "quality") {
        if (minutes < 10) {
            return {
                type: "easy",
                title: `Short easy aerobic · ${mode}`,
                minutes,
                details: `${minutes} min at an easy, conversational effort. The previous workload and session cap are kept ahead of intervals.`,
                target: "Build time gradually before adding faster work."
            };
        }
        const prefersTempo = profile.favorites.includes("tempo") && !profile.favorites.includes("intervals");
        const qualityKind = weekIndex === 0 || prefersTempo ? "threshold" : "vo2";
        const prescription = intervalDetails(qualityKind, profile, minutes, profile.response);
        return {
            type: "quality",
            title: `${prescription.title} · ${mode}`,
            minutes,
            details: prescription.details,
            target: prescription.target
        };
    }

    if (kind === "speed") {
        if (profile.level === "beginner" || profile.response === "too-hard" || profile.response === "missed") {
            return {
                type: "easy",
                title: `Easy aerobic · ${mode}`,
                minutes,
                details: `Stay easy at RPE 3–4/10 for ${minutes} min. Skip fast efforts while building consistency.`,
                target: "Full-sentence conversation; this should feel comfortable."
            };
        }
        const hasCardioFavorite = profile.favorites.some((favorite) => Object.hasOwn(cardioModes, favorite));
        const hillChoice = profile.favorites.includes("hills") && (!hasCardioFavorite || profile.favorites.includes("run"));
        return {
            type: "speed",
            title: hillChoice ? "Short relaxed hill strides" : `Short relaxed efforts · ${mode}`,
            minutes,
            details: `After an easy warm-up, do 4–6 × 10 sec fast but relaxed, with at least 60–90 sec easy recovery. Use the remaining time easily.`,
            target: "Only if fast movement is familiar and pain-free; no all-out sprinting."
        };
    }

    const isLong = kind === "long";
    return {
        type: isLong ? "long" : "easy",
        title: `${isLong ? "Long easy aerobic" : "Easy aerobic"} · ${mode}`,
        minutes,
        details: `${minutes} min at an easy, conversational effort. For a walk or hike, keep the pace comfortable; for a run, use run-walk intervals if useful.`,
        target: "RPE 3–4/10; you should be able to speak in full sentences."
    };
}

function blankDay() {
    return { kind: "rest", title: "Rest day", blocks: [] };
}

function buildWeekSpecs(daysAvailable, weekIndex) {
    const days = Array.from({ length: 7 }, blankDay);
    const quality = { kind: "quality" };
    const easy = { kind: "easy" };
    const long = { kind: "long" };
    const strengthA = { kind: "strengthA" };
    const strengthB = { kind: "strengthB" };

    if (daysAvailable === 3) {
        days[0] = { kind: "combo", parts: [easy, strengthA] };
        days[2] = quality;
        days[5] = { kind: "combo", parts: [long, strengthB] };
    } else if (daysAvailable === 4) {
        days[0] = strengthA;
        days[1] = easy;
        days[3] = quality;
        days[5] = { kind: "combo", parts: [long, strengthB] };
    } else if (daysAvailable === 5) {
        days[0] = easy;
        days[1] = strengthA;
        days[3] = quality;
        days[4] = strengthB;
        days[6] = long;
    } else {
        days[0] = strengthA;
        days[1] = quality;
        days[2] = easy;
        days[3] = strengthB;
        days[4] = { kind: "speed" };
        days[6] = long;
        if (daysAvailable === 7) {
            days[5] = { kind: "optional-recovery" };
        }
    }

    return days;
}

function getAerobicCapacity(spec, profile) {
    const cardioLimit = Math.max(8, profile.time - 8);
    if (spec.kind === "combo") return Math.max(6, Math.floor((profile.time - 4) * 0.42));
    if (["easy", "long", "quality", "speed"].includes(spec.kind)) return cardioLimit;
    return 0;
}

function distributeMinutes(target, capacities) {
    const values = capacities.map(() => 0);
    let remaining = Math.max(0, Math.min(target, capacities.reduce((sum, item) => sum + item, 0)));
    let active = capacities.map((_, index) => index).filter((index) => capacities[index] > 0);

    while (remaining > 0 && active.length) {
        const share = Math.max(1, Math.ceil(remaining / active.length));
        const nextActive = [];
        for (const index of active) {
            const room = capacities[index] - values[index];
            const add = Math.min(room, share, remaining);
            values[index] += add;
            remaining -= add;
            if (values[index] < capacities[index]) nextActive.push(index);
        }
        if (nextActive.length === active.length && share === 0) break;
        active = nextActive;
    }

    return values;
}

function requestedWeeklyMinutes(profile, weekIndex) {
    let target = levelSettings[profile.level].weeklyAerobicStart;
    const previousMinutes = previousPlanContext?.weeklyMinutes;

    if (Number.isFinite(previousMinutes) && previousMinutes > 0) {
        if (profile.response === "manageable") {
            target = weekIndex === 0 ? previousMinutes : previousMinutes * 1.05;
        } else if (profile.response === "too-easy") {
            target = weekIndex === 0 ? previousMinutes : previousMinutes * 1.1;
        } else if (profile.response === "too-hard") {
            target = previousMinutes * 0.8;
        } else if (profile.response === "missed") {
            target = previousMinutes * 0.75;
        }
    } else if (profile.response === "too-hard") {
        target *= 0.8;
    } else if (profile.response === "missed") {
        target *= 0.75;
    }

    return Math.max(1, Math.round(Math.min(300, target)));
}

function buildStrength(profile, which, weekIndex, availableMinutes = profile.time) {
    const block = strengthBlock(which, profile, weekIndex, availableMinutes);
    return { ...block, duration: availableMinutes };
}

function buildDay(spec, profile, weekIndex, dayIndex, cardioMinutes) {
    if (spec.kind === "rest") {
        return {
            category: "rest",
            title: "Rest & reset",
            totalMinutes: 0,
            blocks: [{ title: "Full rest", details: "Rest fully. If it feels good, take a gentle walk or do a few minutes of relaxed mobility." }]
        };
    }

    if (spec.kind === "optional-recovery") {
        return {
            category: "recovery",
            title: "Optional recovery",
            totalMinutes: 0,
            blocks: [{ title: "Walk, mobility, or rest", details: "Choose an easy 10–20 minute walk and gentle mobility, or take a full rest day." }]
        };
    }

    if (spec.kind === "weekend-option") {
        const mode = cardioModes[chooseCardioMode(profile, dayIndex)].label;
        const title = profile.favorites.includes("run") || !profile.favorites.some((favorite) => Object.hasOwn(cardioModes, favorite))
            ? "Optional longer run"
            : `Optional longer easy session · ${mode}`;
        const scheduledDay = weekdays[spec.scheduledLongDay];
        return {
            category: "recovery",
            title: "Weekend long-session option",
            totalMinutes: 0,
            blocks: [{
                title,
                details: `Move this week's scheduled long easy session from ${scheduledDay} to ${weekdays[dayIndex]} if that suits your week. Choose Saturday or Sunday, not both; keep the other day for rest.`,
                target: "Easy conversational effort. This is an alternative, not an extra workout."
            }]
        };
    }

    const strengthType = (kind) => kind === "strengthA" ? "A" : kind === "strengthB" ? "B" : null;

    if (spec.kind === "combo") {
        const [aerobicSpec, strengthSpec] = spec.parts;
        const aerobic = cardioBlock(aerobicSpec.kind, profile, cardioMinutes, weekIndex, dayIndex);
        const strengthMinutes = Math.max(8, profile.time - cardioMinutes - 4);
        const strength = buildStrength(profile, strengthType(strengthSpec.kind), weekIndex, strengthMinutes);
        return {
            category: "combo",
            title: "Aerobic + strength",
            totalMinutes: profile.time,
            blocks: [
                { ...aerobic, details: `${aerobic.minutes} min. ${aerobic.details}` },
                { ...strength, duration: strengthMinutes, details: `${strengthMinutes} min block. ${strength.details}` }
            ]
        };
    }

    if (spec.kind === "strengthA" || spec.kind === "strengthB") {
        const strength = buildStrength(profile, strengthType(spec.kind), weekIndex);
        return { category: "strength", title: strength.title, totalMinutes: strength.duration, blocks: [strength] };
    }

    const cardio = cardioBlock(spec.kind, profile, cardioMinutes, weekIndex, dayIndex);
    const category = cardio.type === "quality" ? "quality" : cardio.type === "speed" ? "speed" : cardio.type === "long" ? "long" : "easy";
    return {
        category,
        title: cardio.title,
        totalMinutes: cardio.minutes,
        blocks: [cardio]
    };
}

function buildWeek(profile, weekIndex) {
    const specs = buildWeekSpecs(profile.days, weekIndex);
    const scheduledLongDay = specs.findIndex((spec) => spec.kind === "long" || (spec.kind === "combo" && spec.parts.some((part) => part.kind === "long")));
    if (scheduledLongDay === 5 || scheduledLongDay === 6) {
        const alternateWeekendDay = scheduledLongDay === 5 ? 6 : 5;
        specs[alternateWeekendDay] = { kind: "weekend-option", scheduledLongDay };
    }
    const capacities = specs.map((spec) => getAerobicCapacity(spec, profile));
    const requested = requestedWeeklyMinutes(profile, weekIndex);
    const allocated = distributeMinutes(requested, capacities);
    const days = specs.map((spec, dayIndex) => buildDay(spec, profile, weekIndex, dayIndex, allocated[dayIndex]));
    const cardioMinutes = days.reduce((sum, day) => sum + day.blocks.reduce((blockSum, block) => blockSum + (block.type === "strength" ? 0 : (block.minutes || 0)), 0), 0);
    const strengthDays = days.filter((day) => day.blocks.some((block) => block.type === "strength")).length;

    return { days, cardioMinutes, strengthDays };
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function renderExerciseItem(exercise) {
    const guide = exercise.guide || {
        description: "Use a controlled, comfortable range of motion.",
        focus: "The muscles involved in this movement pattern.",
        cue: "Move smoothly and stop if the movement causes sharp or increasing pain."
    };
    return `
        <li class="exercise-item"
            data-exercise-name="${escapeHTML(exercise.name)}"
            data-exercise-description="${escapeHTML(guide.description)}"
            data-exercise-focus="${escapeHTML(guide.focus)}"
            data-exercise-cue="${escapeHTML(guide.cue)}">
            <div class="exercise-line">
                <span class="exercise-name">${escapeHTML(exercise.name)}</span>
                <span class="exercise-dose">${escapeHTML(exercise.dose)}</span>
                <button class="exercise-info" type="button" aria-label="Technique notes for ${escapeHTML(exercise.name)}" aria-describedby="exercise-tooltip">i</button>
            </div>
        </li>
    `;
}

function renderBlock(block, dayTitle = "") {
    const safeTitle = escapeHTML(block.title || "Workout");
    const safeDetails = escapeHTML(block.details || "");
    const safeTarget = block.target ? `<span class="session-target">${escapeHTML(block.target)}</span>` : "";
    const heading = block.title && block.title !== dayTitle ? `<h4>${safeTitle}</h4>` : "";
    const content = Array.isArray(block.exercises)
        ? `<ul class="exercise-list">${block.exercises.map(renderExerciseItem).join("")}</ul>`
        : safeDetails ? `<p class="session-detail">${safeDetails}</p>` : "";
    return `
        <div class="session-block">
            ${heading}
            ${(block.duration || block.minutes) ? `<span class="duration">Up to ${block.duration || block.minutes} min</span>` : ""}
            ${content}
            ${safeTarget}
        </div>
    `;
}

function renderDay(day, dayIndex, weekIndex) {
    const dayNumber = weekIndex * 7 + dayIndex + 1;
    const safeTitle = escapeHTML(day.title);
    const blocks = day.blocks.map((block) => renderBlock(block, day.title)).join("");
    const tag = day.category === "rest" ? "RECOVERY" : day.category === "strength" ? "STRENGTH" : day.category === "quality" ? "QUALITY" : day.category === "speed" ? "SHORT EFFORTS" : day.category === "combo" ? "MIXED SESSION" : day.category === "recovery" ? "OPTIONAL" : day.category.toUpperCase();
    const totalTime = day.totalMinutes ? `<span class="day-total">≤ ${day.totalMinutes} min total</span>` : "";

    return `
        <article class="day-card day-card--${escapeHTML(day.category)}">
            <div class="day-card-top">
                <p class="day-name"><span class="day-count">DAY ${dayNumber}</span><span>${weekdays[dayIndex]}</span></p>
                <span class="tag">${tag}</span>
                ${day.category === "combo" ? totalTime : ""}
            </div>
            <h3>${safeTitle}</h3>
            ${blocks}
        </article>
    `;
}

function renderWeek(week, weekIndex) {
    const weekTitle = weekIndex === 0 ? "Build the foundation" : "Rotate the aerobic focus";
    return `
        <section class="week-section" aria-labelledby="week-${weekIndex + 1}-title">
            <div class="week-heading">
                <p class="eyebrow">WEEK ${weekIndex + 1}</p>
                <h3 id="week-${weekIndex + 1}-title">${weekTitle}</h3>
            </div>
            <div class="week-grid-scroll" tabindex="0" aria-label="Week ${weekIndex + 1}, seven day plan. Scroll horizontally on narrow screens.">
                <div class="day-grid">${week.days.map((day, dayIndex) => renderDay(day, dayIndex, weekIndex)).join("")}</div>
            </div>
        </section>
    `;
}

function metricCard(label, value, detail) {
    return `<div class="metric"><span class="metric-label">${escapeHTML(label)}</span><strong class="metric-value">${escapeHTML(value)}</strong><span class="metric-detail">${escapeHTML(detail)}</span></div>`;
}

function profileDescription(profile) {
    const favoriteValues = profile.favorites.map((value) => favoriteLabels[value]).filter(Boolean);
    const focusValues = profile.joints.map((value) => jointLabels[value]).filter(Boolean);
    const modalityText = favoriteValues.length ? favoriteValues.join(", ") : "a balanced activity mix";
    const focusText = focusValues.length ? focusValues.join(", ") : "general full-body support";
    return `${levelSettings[profile.level].label} · ${profile.days} available days/week · ${profile.time} min/session · Favorites: ${modalityText} · Focus: ${focusText}`;
}

function progressionText(profile, weeks) {
    if (profile.response === "too-hard") {
        return "The plan reduces the starting aerobic target and keeps faster work controlled. Leave extra rest if recovery still feels poor.";
    }
    if (profile.response === "missed") {
        return "The plan starts lighter so it is easier to complete. If a day is missed, continue with the next planned session rather than doubling up.";
    }
    if (previousPlanContext?.weeklyMinutes && profile.response === "manageable") {
        return `The PDF included about ${previousPlanContext.weeklyMinutes} aerobic minutes/week. Week 1 uses that as context; Week 2 increases by no more than 5%, subject to your time cap.`;
    }
    if (previousPlanContext?.weeklyMinutes && profile.response === "too-easy") {
        return `The PDF included about ${previousPlanContext.weeklyMinutes} aerobic minutes/week. Week 2 may add up to 10%, while staying within your session limit.`;
    }
    if (profile.response === "too-easy") {
        return "The plan starts from your experience level. If every session feels comfortable and recovery is good, next cycle add a small amount of time or one set—not both at once.";
    }
    return "Week 2 rotates the quality session. Keep total effort controlled; without a previous completed-plan record, the planner does not assume you are ready for a volume jump.";
}

function renderMetrics(profile, weeks) {
    const week1 = weeks[0];
    const week2 = weeks[1];
    const targetText = `${week1.cardioMinutes} / ${week2.cardioMinutes} min`;
    const strengthText = `${week1.strengthDays} / ${week2.strengthDays} days`;
    const experience = levelSettings[profile.level];
    const setText = `${profile.level === "advanced" && profile.time > 30 ? "2–3" : "2"} sets · ${experience.reps} reps`;

    metrics.innerHTML = [
        metricCard("Aerobic minutes", targetText, "Week 1 / Week 2; time-capped estimate"),
        metricCard("Strength exposure", strengthText, "Whole-body patterns each week"),
        metricCard("Strength target", setText, `${experience.reserve} · ${experience.rest} rest; short combo blocks may use 2 sets`)
    ].join("");
}

function showExerciseTooltip(item) {
    exerciseTooltip.innerHTML = `
        <strong class="tooltip-title">${escapeHTML(item.dataset.exerciseName)}</strong>
        <p>${escapeHTML(item.dataset.exerciseDescription)}</p>
        <p><strong>Key focus:</strong> ${escapeHTML(item.dataset.exerciseFocus)}</p>
        <p><strong>Form cue:</strong> ${escapeHTML(item.dataset.exerciseCue)}</p>
    `;
    exerciseTooltip.hidden = false;

    const itemRect = item.getBoundingClientRect();
    const tooltipRect = exerciseTooltip.getBoundingClientRect();
    const margin = 12;
    const left = Math.max(margin, Math.min(itemRect.left, window.innerWidth - tooltipRect.width - margin));
    let top = itemRect.bottom + 8;
    if (top + tooltipRect.height > window.innerHeight - margin) {
        top = itemRect.top - tooltipRect.height - 8;
    }
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));
    exerciseTooltip.style.left = `${left}px`;
    exerciseTooltip.style.top = `${top}px`;
}

function hideExerciseTooltip() {
    exerciseTooltip.hidden = true;
}

weeksElement.addEventListener("pointerover", (event) => {
    const item = event.target.closest(".exercise-item");
    if (item && (!event.relatedTarget || !item.contains(event.relatedTarget))) showExerciseTooltip(item);
});

weeksElement.addEventListener("pointerout", (event) => {
    const item = event.target.closest(".exercise-item");
    if (item && (!event.relatedTarget || !item.contains(event.relatedTarget))) hideExerciseTooltip();
});

weeksElement.addEventListener("focusin", (event) => {
    const item = event.target.closest(".exercise-item");
    if (item) showExerciseTooltip(item);
});

weeksElement.addEventListener("focusout", (event) => {
    const item = event.target.closest(".exercise-item");
    if (item && (!event.relatedTarget || !item.contains(event.relatedTarget))) hideExerciseTooltip();
});

window.addEventListener("scroll", hideExerciseTooltip, true);
window.addEventListener("resize", hideExerciseTooltip);

function updatePrintRecord(profile, weeks) {
    const favorites = profile.favorites.join(",") || "none";
    const joints = profile.joints.join(",") || "none";
    const record = `AERO_PLAN_RECORD_V1 level=${profile.level} days=${profile.days} time=${profile.time} aerobic=${weeks[0].cardioMinutes} preferred=${favorites} focus=${joints}`;
    document.getElementById("print-record").textContent = `PLAN RECORD FOR FUTURE IMPORT: ${record}`;
}

function generatePlan() {
    const profile = normalizeProfile();
    const weeks = [buildWeek(profile, 0), buildWeek(profile, 1)];
    latestPlan = { profile, weeks };

    summary.textContent = profileDescription(profile);
    renderMetrics(profile, weeks);
    progressionNote.textContent = progressionText(profile, weeks);
    weeksElement.innerHTML = weeks.map(renderWeek).join("");
    updatePrintRecord(profile, weeks);
    output.hidden = false;
    output.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setPdfStatus(message, state = "") {
    pdfStatus.textContent = message;
    if (state) pdfStatus.dataset.state = state;
    else delete pdfStatus.dataset.state;
}

function parsePlannerRecord(text) {
    const match = text.match(/AERO_PLAN_RECORD_V1\s+level=(beginner|intermediate|advanced)\s+days=(3|4|5|6|7)\s+time=(20|30|45|60|90)\s+aerobic=(\d+)\s+preferred=([a-z,]*)\s+focus=([a-z,]*)/i);
    if (!match) return null;

    const validModes = Object.keys(cardioModes);
    return {
        source: "planner",
        level: match[1].toLowerCase(),
        days: Number(match[2]),
        time: Number(match[3]),
        weeklyMinutes: Number(match[4]),
        favorites: match[5].split(",").filter((value) => Object.hasOwn(favoriteLabels, value)),
        modalities: match[5].split(",").filter((value) => validModes.includes(value)),
        focus: match[6].split(",").filter((value) => Object.hasOwn(jointLabels, value))
    };
}

function parseOtherPdf(text) {
    const modePatterns = {
        run: /\b(run|running|jog|jogging)\b/i,
        walk: /\b(walk|walking|hike|hiking)\b/i,
        cycle: /\b(cycling|cycle|bike|biking|bicycle)\b/i,
        row: /\b(rowing|rower|rowing machine)\b/i,
        swim: /\b(swim|swimming)\b/i,
        elliptical: /\belliptical\b/i
    };
    const detectedModes = Object.entries(modePatterns)
        .filter(([, pattern]) => pattern.test(text))
        .map(([key]) => key);
    const workoutTerms = ["threshold", "tempo", "interval", "strength", "long run", "hill", "rowing", "cycling", "swimming"]
        .filter((term) => new RegExp(term, "i").test(text));
    return {
        source: "other-pdf",
        favorites: detectedModes,
        modalities: detectedModes,
        terms: workoutTerms,
        weeklyMinutes: null
    };
}

function applyImportedChoices(context) {
    const values = new Set([...(context.favorites || []), ...(context.modalities || []), ...(context.focus || [])]);
    for (const value of values) {
        const favorite = form.querySelector(`input[name="favorites"][value="${value}"]`);
        const joint = form.querySelector(`input[name="joints"][value="${value}"]`);
        if (favorite) favorite.checked = true;
        if (joint) joint.checked = true;
    }
}

async function readPreviousPdf(file) {
    previousPlanContext = null;
    if (!file) {
        fileName.textContent = "No file selected";
        setPdfStatus("The file is read in this browser and is not uploaded or saved.");
        return;
    }

    fileName.textContent = file.name;
    if (file.size > MAX_PDF_BYTES) {
        setPdfStatus("That PDF is larger than 10 MB. Choose a smaller file or generate a plan without importing it.", "error");
        return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setPdfStatus("Choose a PDF file.", "error");
        return;
    }

    setPdfStatus("Reading PDF text locally…");

    let documentTask = null;
    try {
        const pdfjs = await import(PDFJS_URL);
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        const data = new Uint8Array(await file.arrayBuffer());
        documentTask = pdfjs.getDocument({ data });
        const pdf = await documentTask.promise;

        if (pdf.numPages > MAX_PDF_PAGES) {
            const pageCount = pdf.numPages;
            await documentTask.destroy();
            setPdfStatus(`This file has ${pageCount} pages. For privacy and speed, choose a PDF with ${MAX_PDF_PAGES} pages or fewer.`, "error");
            return;
        }

        const pages = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            pages.push(content.items.map((item) => item.str).join(" "));
            if (pages.join(" ").length > 200000) break;
        }
        await documentTask.destroy();

        const text = pages.join(" ").replace(/\s+/g, " ").slice(0, 200000);
        if (!text.trim()) {
            setPdfStatus("No selectable text was found. Scanned or image-only PDFs cannot be read; you can still use your preferences and prior-plan feedback.", "error");
            return;
        }

        previousPlanContext = parsePlannerRecord(text) || parseOtherPdf(text);
        applyImportedChoices(previousPlanContext);
        if (previousPlanContext.source === "planner") {
            setPdfStatus(`Recognized a previous planner PDF: about ${previousPlanContext.weeklyMinutes} aerobic minutes/week, ${previousPlanContext.days} available days, ${previousPlanContext.time} min/session. Prior activity and joint-focus choices are checked below; you can edit them. Tell the planner how it felt above. The file stays on this device.`, "success");
        } else {
            const detected = previousPlanContext.modalities.length
                ? `Possible activities found: ${previousPlanContext.modalities.map((mode) => cardioModes[mode].title.toLowerCase()).join(", ")}. `
                : "No clear aerobic activity was detected. ";
            setPdfStatus(`${detected}Detected activities are checked below as starting preferences. This PDF does not confirm what you completed or how it felt.`, "success");
        }
    } catch (error) {
        if (documentTask) {
            try {
                await documentTask.destroy();
            } catch {
                // The PDF worker may already be closed.
            }
        }
        previousPlanContext = null;
        setPdfStatus("The PDF reader could not open this file. The planner still works without an import; PDF reading needs an internet connection to load its reader library.", "error");
    }
}

pdfInput.addEventListener("change", (event) => {
    readPreviousPdf(event.target.files?.[0]);
});

form.addEventListener("submit", (event) => {
    event.preventDefault();
    appStatus.textContent = "Building your two-week plan…";
    try {
        generatePlan();
        appStatus.textContent = "Your plan is ready below.";
    } catch (error) {
        console.error(error);
        appStatus.textContent = "The plan could not be generated. Reload the page and make sure index.html and script.js are in the same folder.";
    }
});

document.getElementById("export-pdf").addEventListener("click", () => {
    if (!latestPlan) return;
    window.print();
});

appStatus.textContent = "Planner ready. Choose your options and generate a plan.";

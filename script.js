// This file contains the planner's rules and interactive behavior. A constant (const) is a named value the program does not reassign.
// PDF.js is an outside library: a package of ready-made code used here to read text from PDF files.
const PDFJS_VERSION = "6.5.438";
const PDFJS_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.mjs`;
const PDFJS_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 30;
const MAX_PDF_TEXT_CHARS = 200000;
const MAX_PDF_PARSE_MS = 20000;
const PLANNER_STORAGE_KEY = "aerobic-engine-builder-v1";

// Find the HTML elements JavaScript will read or update. The DOM (Document Object Model) is the browser's in-memory version of the page.
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
const storageStatus = document.getElementById("storage-status");
const exerciseTooltip = document.getElementById("exercise-tooltip");

// These arrays (ordered lists) and objects (named groups of related values) are the planner's reference data.
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Default weekly workload and strength targets for each experience level.
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

// Maps short option values from the form to readable activity names.
const cardioModes = {
    run: { label: "run or run-walk", title: "Running / run-walk" },
    walk: { label: "brisk walk or hike", title: "Walking / hiking" },
    cycle: { label: "bike", title: "Cycling" },
    row: { label: "rower", title: "Rowing" },
    swim: { label: "swim", title: "Swimming" },
    elliptical: { label: "elliptical", title: "Elliptical" }
};

// Labels used to match a person's preferences to exercise equipment and display text.
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

// Exercise library organized by movement pattern (the basic action, such as squat or push).
// Each entry says which equipment it needs and which selected support areas it relates to.
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

// General instructions for each movement pattern; used when an exercise has no more specific note.
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

// Default descriptions, muscle focus, and form reminders for support exercises.
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

// Instructions for mobility and balance exercises that can appear as extra support work.
const defaultSupportGuides = {
    "standing calf raise": {
        description: "Stand with feet hip-width apart and fingertips near a wall or rail. Rise straight up onto the balls of both feet, pause, then lower your heels slowly.",
        focus: "Calves and ankle control.",
        cue: "Use a wall or rail for balance and avoid rolling the ankles outward."
    },
    "single-leg balance near support": {
        description: "Stand beside a stable counter or rail. Shift weight onto one foot and lift the other slightly; hold steady for the planned time, then switch sides.",
        focus: "Foot, ankle, hip stabilizers, and balance.",
        cue: "Keep the standing foot grounded and use the support before balance becomes unstable."
    },
    "90/90 hip switches": {
        description: "Sit on the floor with knees bent and feet wider than hips. Let both knees fall gently to one side, return through center, and move them to the other side.",
        focus: "Hip rotation and comfortable mobility.",
        cue: "Move slowly within a relaxed range; do not press the knees down."
    },
    "wall slides": {
        description: "Stand facing a wall with forearms resting against it. Gently slide your arms upward as far as comfortable, then lower them slowly while keeping light contact.",
        focus: "Shoulder-blade control and shoulder mobility.",
        cue: "Keep ribs relaxed and stop before the shoulders shrug or pinch."
    }
};

// Exercise-specific instructions: setup and movement are described separately from
// the muscle focus and form cue so users can understand unfamiliar variations.
// More detailed instructions for each named exercise variation, shown in its popup.
const exerciseGuides = {
    "chair squat": { description: "Stand in front of a sturdy chair with feet about hip-to-shoulder width apart. Send your hips back, bend your knees to lightly touch the chair, then stand.", focus: "Quadriceps and glutes, with controlled knee and hip alignment.", cue: "Keep your whole foot grounded and let your knees track in the same direction as your toes." },
    "box squat": { description: "Stand just in front of a stable box or bench. Push your hips back to sit lightly, keep your trunk steady, then press through your feet to stand.", focus: "Quadriceps and glutes, with controlled knee and hip alignment.", cue: "Touch the box softly; do not drop onto it or rock forward to stand." },
    "banded squat": { description: "Stand on the middle of a resistance band and hold its ends at your shoulders. Sit your hips down and back, then stand while keeping the band secure.", focus: "Quadriceps and glutes, with controlled knee and hip alignment.", cue: "Use a band light enough to keep the movement smooth; keep knees in line with toes." },
    "goblet squat": { description: "Hold one dumbbell close to your chest with both hands. Sit your hips down between your feet, then push through the floor to stand.", focus: "Quadriceps and glutes, with trunk bracing.", cue: "Keep the weight close and your heels grounded; use a depth you can control." },
    "leg press": { description: "Sit with your back supported and feet on the platform. Unlock the sled, lower it until your knees bend comfortably, then press the platform away without locking your knees.", focus: "Quadriceps and glutes.", cue: "Keep hips and back against the pad; use a controlled range and follow the machine instructions." },
    "glute bridge": { description: "Lie on your back with knees bent and feet flat. Brace gently, press through your feet, and lift your hips until your body forms a comfortable line from shoulders to knees; lower slowly.", focus: "Glutes and hamstrings.", cue: "Finish by squeezing your glutes, not by arching your lower back." },
    "hip hinge": { description: "Stand tall with soft knees. Push your hips backward while your trunk tips forward as one steady unit, then drive your hips forward to stand.", focus: "Glutes and hamstrings.", cue: "Keep your back long and stop when you feel a gentle hamstring stretch." },
    "band pull-through": { description: "Anchor a band low behind you and hold it between your legs. Step forward to create light tension, hinge your hips back, then squeeze your glutes to stand.", focus: "Glutes and hamstrings.", cue: "Keep arms relaxed; the hips move the band, and the spine stays steady." },
    "dumbbell Romanian deadlift": { description: "Hold dumbbells in front of your thighs. With knees softly bent, push hips back and lower the weights close to your legs; stand by bringing hips forward.", focus: "Glutes and hamstrings.", cue: "Keep weights close and stop the descent before your back rounds." },
    "hamstring curl": { description: "Set up on the curl machine with its pad just above your heels. Bend your knees to bring the pad toward you, pause, then return slowly.", focus: "Hamstrings at the back of the thighs.", cue: "Align your knees with the machine pivot and avoid lifting your hips off the pad." },
    "supported split squat": { description: "Stand in a staggered stance beside a wall or rail. Hold support lightly, bend both knees to lower straight down, then press through the front foot to rise.", focus: "Quadriceps, glutes, and single-leg balance.", cue: "Keep the front foot planted and use support to make balance easy." },
    "low step-up": { description: "Face a low, stable step. Place one whole foot on it, lean slightly forward, and step up; lower slowly with control and repeat on that side.", focus: "Quadriceps, glutes, and single-leg balance.", cue: "Choose a step height that lets you rise without pushing off strongly with the trailing foot." },
    "band-resisted step-up": { description: "Secure a light band around your thighs or to a safe anchor as instructed. Step onto a low platform, stand tall, then step down slowly.", focus: "Quadriceps, glutes, and hip control.", cue: "Keep the knee tracking over the foot; stop if the band shifts or the anchor is unstable." },
    "supported reverse lunge": { description: "Hold a stable support and stand tall. Step one foot backward, bend both knees only as far as comfortable, then push through the front foot to return.", focus: "Quadriceps, glutes, and single-leg balance.", cue: "Keep most pressure through the front foot and avoid wobbling or forcing depth." },
    "single-leg press": { description: "Use the leg-press machine with one foot centered on the platform. Lower the sled a short, comfortable distance, then press back up without locking the knee.", focus: "Quadriceps and glutes on one side at a time.", cue: "Keep your pelvis level and use a light load; follow the machine setup instructions." },
    "wall or incline push-up": { description: "Place hands on a wall or sturdy raised surface, slightly wider than shoulders. Keep your body in a straight line, bend elbows to bring your chest toward your hands, then press away.", focus: "Chest, shoulders, and triceps.", cue: "Keep wrists comfortable and elbows angled slightly back rather than straight out." },
    "band chest press": { description: "Anchor a band behind you at chest height and hold an end in each hand. Start with hands near your chest, press forward, then return slowly.", focus: "Chest, shoulders, and triceps.", cue: "Stand in a stable stance and keep shoulders relaxed; make sure the anchor is secure." },
    "dumbbell floor press": { description: "Lie on your back with knees bent and a dumbbell in each hand. Start with elbows resting lightly on the floor, press weights over your chest, then lower until elbows touch down softly.", focus: "Chest, shoulders, and triceps.", cue: "Keep wrists stacked over elbows and use a load you can lower quietly." },
    "chest press": { description: "Adjust the machine so handles begin around mid-chest. Press forward until arms are nearly straight, then return slowly without letting the weight stack slam.", focus: "Chest, shoulders, and triceps.", cue: "Keep your back supported and wrists straight; follow the machine instructions." },
    "prone W raise": { description: "Lie face down with forehead supported and elbows bent to make a W shape. Gently lift hands and elbows a little, squeeze shoulder blades down and back, then lower.", focus: "Upper back and shoulder-blade control.", cue: "Use a tiny lift; keep your neck relaxed and do not arch your lower back." },
    "band row": { description: "Anchor a band in front of you at about chest height. Hold it with arms extended, draw elbows back toward your ribs, then straighten arms slowly.", focus: "Upper back, lats, and biceps.", cue: "Keep shoulders away from ears and avoid leaning backward to finish." },
    "one-arm dumbbell row": { description: "Support one hand on a bench or sturdy surface, hinge forward, and hold a dumbbell in the other hand. Pull it toward your hip, then lower until the arm is straight.", focus: "Upper back, lats, and biceps.", cue: "Keep your trunk still and avoid twisting to lift the weight." },
    "seated row": { description: "Sit tall at the row machine with feet supported. Pull the handle toward your lower ribs by drawing elbows back, then extend arms slowly.", focus: "Upper back, lats, and biceps.", cue: "Keep chest relaxed and torso steady; follow the machine instructions." },
    "dead bug": { description: "Lie on your back with arms up and hips and knees bent. Gently brace your trunk; slowly lower one arm and the opposite leg, return, then switch sides.", focus: "Abdominal muscles that resist lower-back arching.", cue: "Only lower as far as you can while keeping your back comfortably steady and breathing." },
    "bird dog": { description: "Start on hands and knees. Reach one arm forward and the opposite leg backward, pause without rotating your hips, return, then switch sides.", focus: "Trunk, glutes, and shoulder stabilizers.", cue: "Reach long rather than high; keep your back level and move slowly." },
    "Pallof press": { description: "Stand sideways to a band anchored at chest height and hold it at your chest with both hands. Press hands forward, resist the band pulling you around, then bring hands back.", focus: "Abdominal and trunk muscles resisting rotation.", cue: "Keep hips and shoulders facing forward; step closer to the anchor to make it easier." },
    "suitcase carry": { description: "Hold one weight at your side and walk slowly for the planned time or distance. Turn carefully, switch hands, and walk back.", focus: "Grip, trunk, and side-of-hip stabilizers.", cue: "Walk tall without leaning toward or away from the weight; use a clear path." },
    "low step-down": { description: "Stand on a low step with one foot near its edge. Slowly bend the standing knee to tap the other heel to the floor, then straighten back up.", focus: "Quadriceps and hip muscles controlling the knee.", cue: "Keep the standing knee tracking over the foot and use a rail for balance." },
    "band terminal knee extension": { description: "Loop a band behind one knee and stand facing its anchor. Start with the knee slightly bent, then gently straighten it against the band and return.", focus: "Quadriceps that straighten and control the knee.", cue: "Keep the movement small and smooth; do not snap or force the knee backward." },
    "light leg extension": { description: "Sit at the leg-extension machine with the pad above your ankles. Straighten your knees smoothly, pause briefly, and lower the weight slowly.", focus: "Quadriceps at the front of the thighs.", cue: "Use a light load and comfortable range; follow the machine instructions." },
    "tibialis raise against a wall": { description: "Lean your back against a wall with heels on the floor and feet slightly forward. Lift your toes toward your shins, then lower them slowly.", focus: "Tibialis anterior and other muscles along the front of the shin.", cue: "Keep heels planted and use a small range that stays controlled." },
    "side-lying clamshell": { description: "Lie on your side with knees bent and feet together. Keeping your hips stacked, lift the top knee without rolling your pelvis, then lower slowly.", focus: "Gluteal muscles at the side of the hip.", cue: "Keep feet touching and make the motion small; avoid rolling backward." },
    "lateral band walk": { description: "Place a light loop band above your knees or around your ankles. Bend slightly at hips and knees, step sideways, then follow with the other foot while keeping band tension.", focus: "Side glutes and hip stabilizers.", cue: "Keep toes mostly forward and avoid letting the knees collapse inward." },
    "standing hip abduction": { description: "At the hip-abduction machine, position the pads as directed. Press your knees outward against light resistance, pause, then return slowly.", focus: "Gluteal muscles on the outside of the hips.", cue: "Keep your back supported and do not bounce; follow the machine instructions." },
    "band external rotation": { description: "Stand or sit with a light band held between your hands, elbows bent and tucked at your sides. Rotate hands outward, then return slowly.", focus: "Rotator cuff muscles that help control the shoulder.", cue: "Keep elbows against your sides and use very light tension without shrugging." },
    "band pull-apart": { description: "Hold a light band at shoulder height with arms extended. Pull hands apart by squeezing shoulder blades gently, then return slowly.", focus: "Rear shoulders and upper-back muscles.", cue: "Keep ribs relaxed and shoulders down; stop before arms move behind your body." },
    "light cable face pull": { description: "Set a cable rope near face height. Pull it toward your forehead with elbows out and hands separating, then extend arms slowly.", focus: "Rear shoulders, upper back, and shoulder-blade control.", cue: "Use light weight, keep neck relaxed, and follow the machine instructions." },
    "light wrist extension": { description: "Rest your forearm on a table or thigh with palm facing down and hand over the edge. Lift the hand gently at the wrist, then lower slowly.", focus: "Wrist extensor muscles on the back of the forearm.", cue: "Use a very light weight and keep the forearm supported and still." },
    "gentle forearm rotation": { description: "Sit with your elbow bent and tucked close to your side. Slowly turn your palm up, then down, through a comfortable range.", focus: "Forearm muscles that rotate the wrist and hand.", cue: "Keep the elbow still and do not force the end of either direction." },
    "light band wrist extension": { description: "Anchor a light band below your hand and sit with the forearm supported, palm down. Lift the back of your hand against the band, then return slowly.", focus: "Wrist extensor muscles on the back of the forearm.", cue: "Keep the forearm still and tension light; use a comfortable range." }
};

// Small accessory exercise lists for the body areas a person selected in the form.
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

// Temporary working data for this page visit. `let` marks a value that can change; the uploaded PDF itself is never stored.
let previousPlanContext = null;
let latestPlan = null;

// Read the checked boxes in one group and return their values as a list.
function selectedValues(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

// Read form answers and replace any unexpected values with safe defaults before planning.
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

// Pick a cardio activity from the user's preferences, or use a sensible default.
function chooseCardioMode(profile, salt = 0) {
    const favorites = profile.favorites.filter((value) => Object.hasOwn(cardioModes, value));
    if (favorites.length) return favorites[salt % favorites.length];
    return profile.level === "beginner" ? "walk" : "run";
}

// Pick preferred strength equipment, defaulting to bodyweight if none was selected.
function chooseEquipment(profile, salt = 0) {
    const preferred = profile.favorites.filter((value) => equipmentModes.includes(value));
    if (preferred.length) return preferred[salt % preferred.length];
    return "bodyweight";
}

// Rank exercise choices by equipment and support-area match, then return the best match.
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

// Choose one accessory exercise for a selected support area.
function chooseJointAccessory(joint, profile, salt = 0) {
    const options = jointSupportLibrary[joint] || [];
    if (!options.length) return null;
    const preferredGear = chooseEquipment(profile, salt);
    const ranked = [...options].sort((a, b) => Number(b.gear === preferredGear) - Number(a.gear === preferredGear));
    return ranked[0];
}

// Set workout volume and effort targets based on experience and the time available.
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

// Build one full-body strength session (A or B), including optional support work.
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

// Describe the interval structure and intensity for a cardio quality session.
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

// Build an aerobic session such as easy endurance, threshold work, or short intervals.
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

// Create an empty recovery day for the weekly schedule.
function blankDay() {
    return { kind: "rest", title: "Rest day", blocks: [] };
}

// Choose a weekly pattern of cardio, strength, combined sessions, and recovery.
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

// Estimate the most aerobic time that can fit into one session without exceeding its time cap.
function getAerobicCapacity(spec, profile) {
    const cardioLimit = Math.max(8, profile.time - 8);
    if (spec.kind === "combo") return Math.max(6, Math.floor((profile.time - 4) * 0.42));
    if (["easy", "long", "quality", "speed"].includes(spec.kind)) return cardioLimit;
    return 0;
}

// Spread a weekly aerobic-minute target across sessions, staying within each session's capacity.
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

// Adjust the starting weekly aerobic target using experience and prior-plan feedback.
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

// Wrap the strength session in the data format used by the day cards.
function buildStrength(profile, which, weekIndex, availableMinutes = profile.time) {
    const block = strengthBlock(which, profile, weekIndex, availableMinutes);
    return { ...block, duration: availableMinutes };
}

// Turn a schedule entry into a complete day, including optional weekend endurance choices.
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

// Assemble seven days and calculate the week's aerobic and strength totals.
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

// Replace special HTML characters before putting text inside generated page markup.
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Turn exercise data into one safe list item with details stored for its popup.
function renderExerciseItem(exercise) {
    const guide = exerciseGuides[exercise.name] || exercise.guide || {
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

// Build the HTML for one activity block, such as cardio or strength, within a day.
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

// Build one calendar card and its activities from the generated day data.
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

// Build a titled row containing the seven day cards for one week.
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

// Build a small summary card for weekly totals or strength targets.
function metricCard(label, value, detail) {
    return `<div class="metric"><span class="metric-label">${escapeHTML(label)}</span><strong class="metric-value">${escapeHTML(value)}</strong><span class="metric-detail">${escapeHTML(detail)}</span></div>`;
}

// Convert the selected settings into a short plain-language summary.
function profileDescription(profile) {
    const favoriteValues = profile.favorites.map((value) => favoriteLabels[value]).filter(Boolean);
    const focusValues = profile.joints.map((value) => jointLabels[value]).filter(Boolean);
    const modalityText = favoriteValues.length ? favoriteValues.join(", ") : "a balanced activity mix";
    const focusText = focusValues.length ? focusValues.join(", ") : "general full-body support";
    return `${levelSettings[profile.level].label} · ${profile.days} available days/week · ${profile.time} min/session · Favorites: ${modalityText} · Focus: ${focusText}`;
}

// Explain how the second week changes based on previous feedback or an imported plan.
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

// Display the plan's aerobic minutes, strength days, and strength targets.
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

// Fill the shared tooltip with the selected exercise's description and place it on screen.
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

// Hide the shared exercise popup when the pointer or keyboard focus moves away.
function hideExerciseTooltip() {
    exerciseTooltip.hidden = true;
}

// Event listeners are instructions that run when a user action happens, such as pointing or focusing.
// These listeners support mouse, touch-pointer, and keyboard access to the exercise details.
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

// Put a compact text record in the printout so a future PDF import can recognize this planner's output.
function updatePrintRecord(profile, weeks) {
    const favorites = profile.favorites.join(",") || "none";
    const joints = profile.joints.join(",") || "none";
    const record = `AERO_PLAN_RECORD_V1 level=${profile.level} days=${profile.days} time=${profile.time} aerobic=${weeks[0].cardioMinutes} preferred=${favorites} focus=${joints}`;
    document.getElementById("print-record").textContent = `PLAN RECORD FOR FUTURE IMPORT: ${record}`;
}

// Run the planning steps, update the page, and save the chosen settings for the next visit.
function generatePlan({ scroll = true } = {}) {
    const profile = normalizeProfile();
    const weeks = [buildWeek(profile, 0), buildWeek(profile, 1)];
    latestPlan = { profile, weeks };

    summary.textContent = profileDescription(profile);
    renderMetrics(profile, weeks);
    progressionNote.textContent = progressionText(profile, weeks);
    weeksElement.innerHTML = weeks.map(renderWeek).join("");
    updatePrintRecord(profile, weeks);
    output.hidden = false;
    savePlannerState(true);
    if (scroll) output.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Save only the form choices in this browser's local storage; the uploaded PDF is excluded.
// Local storage is a small browser-managed area that keeps text data between visits on this device.
// JSON (JavaScript Object Notation) turns the settings into text so the browser can store them together.
function savePlannerState(hasGeneratedPlan = false) {
    try {
        const allowedFavorites = [...document.querySelectorAll('input[name="favorites"]')];
        const allowedJoints = [...document.querySelectorAll('input[name="joints"]')];
        const saved = {
            version: 1,
            fitness: document.getElementById("fitness").value,
            days: document.getElementById("days").value,
            time: document.getElementById("time-limit").value,
            response: document.getElementById("previous-response").value,
            favorites: allowedFavorites.filter((item) => item.checked).map((item) => item.value),
            joints: allowedJoints.filter((item) => item.checked).map((item) => item.value),
            hasGeneratedPlan
        };
        localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(saved));
        storageStatus.textContent = "Your selections are saved on this device; a generated plan will be rebuilt from them when you return. Uploaded PDFs are never saved.";
        return true;
    } catch {
        storageStatus.textContent = "Browser storage is unavailable here. Your plan will work, but selections won’t persist after closing the page.";
        return false;
    }
}

// Check that storage can be written, restore saved choices, and rebuild a previous plan if needed.
function restorePlannerState() {
    try {
        const probeKey = `${PLANNER_STORAGE_KEY}-availability-check`;
        localStorage.setItem(probeKey, "ok");
        localStorage.removeItem(probeKey);
        const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
        if (!raw) {
            storageStatus.textContent = "Browser storage is available. Your selections are saved here, and a generated plan will be rebuilt when you return.";
            return;
        }
        const saved = JSON.parse(raw);
        if (!saved || saved.version !== 1) throw new Error("Unsupported saved planner data");

        const setIfValid = (id, value, allowed) => {
            if (allowed.includes(String(value))) document.getElementById(id).value = String(value);
        };
        setIfValid("fitness", saved.fitness, ["beginner", "intermediate", "advanced"]);
        setIfValid("days", saved.days, ["3", "4", "5", "6", "7"]);
        setIfValid("time-limit", saved.time, ["20", "30", "45", "60", "90"]);
        setIfValid("previous-response", saved.response, ["new", "manageable", "too-easy", "too-hard", "missed"]);
        const favorites = new Set(Array.isArray(saved.favorites) ? saved.favorites : []);
        const joints = new Set(Array.isArray(saved.joints) ? saved.joints : []);
        document.querySelectorAll('input[name="favorites"]').forEach((item) => { item.checked = favorites.has(item.value); });
        document.querySelectorAll('input[name="joints"]').forEach((item) => { item.checked = joints.has(item.value); });

        storageStatus.textContent = "Saved selections restored from this browser. A plan is rebuilt from those choices; uploaded PDFs are not saved and must be imported again.";
        if (saved.hasGeneratedPlan === true) {
            generatePlan({ scroll: false });
            appStatus.textContent = "Your saved two-week plan is ready below.";
        }
    } catch {
        storageStatus.textContent = "Browser storage is unavailable or its saved data could not be read. You can still build a plan.";
    }
}

// Show a readable status message after a PDF is selected or processed.
function setPdfStatus(message, state = "") {
    pdfStatus.textContent = message;
    if (state) pdfStatus.dataset.state = state;
    else delete pdfStatus.dataset.state;
}

// A regular expression (regex) is a text pattern; this one finds the planner's compact record in PDF text.
// Only recognized values are accepted, so arbitrary PDF text is not treated as a setting.
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

// For other workout PDFs, look for common activity words without displaying their raw text.
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

// Check the activity and support-area boxes identified in an imported PDF.
function applyImportedChoices(context) {
    const values = new Set([...(context.favorites || []), ...(context.modalities || []), ...(context.focus || [])]);
    for (const value of values) {
        const favorite = form.querySelector(`input[name="favorites"][value="${value}"]`);
        const joint = form.querySelector(`input[name="joints"][value="${value}"]`);
        if (favorite) favorite.checked = true;
        if (joint) joint.checked = true;
    }
}

// Read a selected PDF locally, with limits on file size, pages, extracted text, and time.
// async means this function can wait for file and PDF operations without freezing the page.
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
    let timeoutId = null;
    try {
        const pdfjs = await import(PDFJS_URL);
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        const data = new Uint8Array(await file.arrayBuffer());
        documentTask = pdfjs.getDocument({ data });
        timeoutId = setTimeout(() => {
            documentTask?.destroy().catch(() => {});
        }, MAX_PDF_PARSE_MS);
        const pdf = await documentTask.promise;

        if (pdf.numPages > MAX_PDF_PAGES) {
            const pageCount = pdf.numPages;
            clearTimeout(timeoutId);
            await documentTask.destroy();
            setPdfStatus(`This file has ${pageCount} pages. For privacy and speed, choose a PDF with ${MAX_PDF_PAGES} pages or fewer.`, "error");
            return;
        }

        const pages = [];
        let extractedCharacters = 0;
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            const pageText = content.items.map((item) => item.str).join(" ");
            const remaining = MAX_PDF_TEXT_CHARS - extractedCharacters;
            pages.push(pageText.slice(0, remaining));
            extractedCharacters += Math.min(pageText.length, remaining);
            if (extractedCharacters >= MAX_PDF_TEXT_CHARS) break;
        }
        clearTimeout(timeoutId);
        await documentTask.destroy();

        const text = pages.join(" ").replace(/\s+/g, " ").slice(0, MAX_PDF_TEXT_CHARS);
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
        clearTimeout(timeoutId);
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

// Connect the file picker, form submit button, and PDF export button to their actions.
pdfInput.addEventListener("change", (event) => {
    readPreviousPdf(event.target.files?.[0]);
});

// When the user submits the form, prevent a full page reload and build the two-week plan.
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

// Save updated choices as the user changes them; changing a choice marks the old plan as out of date.
form.addEventListener("input", () => savePlannerState(false));
form.addEventListener("change", () => savePlannerState(false));

// The browser's print dialog can save the visible plan as a PDF file.
document.getElementById("export-pdf").addEventListener("click", () => {
    if (!latestPlan) return;
    window.print();
});

// Start the page, then restore this browser's saved choices if storage is available.
appStatus.textContent = "Planner ready. Choose your options and generate a plan.";
restorePlannerState();

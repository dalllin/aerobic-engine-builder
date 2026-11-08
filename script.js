const form = document.getElementById("planner-form");
const summary = document.getElementById("plan-summary");
const results = document.getElementById("results");

const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];

const fitnessLabels = {
    beginner: "Beginner or returning",
    intermediate: "Intermediate",
    advanced: "Advanced"
};

function workout(category, title, details, tag) {
    return { category, title, details, tag };
}

function restDay() {
    return workout(
        "rest",
        "Rest day",
        "Rest fully, or take a relaxed walk and do gentle mobility if that helps you feel fresh.",
        "RECOVERY"
    );
}

function easyAerobic() {
    return workout(
        "easy",
        "Easy aerobic session",
        "About 20–40 minutes at a conversational effort. A run, run-walk, bike, or brisk walk works.",
        "EASY"
    );
}

function longAerobic(level) {
    let details;

    if (level === "beginner") {
        details =
            "Keep it conversational. Start with a duration you already tolerate; aim for 60+ minutes only if that feels familiar.";
    } else if (level === "advanced") {
        details = "60–90 minutes at an easy, conversational effort.";
    } else {
        details = "About 60–75 minutes at an easy, conversational effort.";
    }

    return workout("long", "Long aerobic session", details, "ENDURANCE");
}

function thresholdSession(level) {
    let details;

    if (level === "beginner") {
        details =
            "Use short, controlled intervals at a comfortably hard effort, with easy recovery. If intervals are new, swap this for easy cardio.";
    } else if (level === "advanced") {
        details =
            "One example is 5 × 6 minutes at a comfortably hard effort, with easy recovery between repeats.";
    } else {
        details =
            "One example is 3 × 10 minutes at a comfortably hard effort, with easy recovery between repeats.";
    }

    return workout("quality", "Threshold session", details, "QUALITY");
}

function vo2Session(level) {
    let details;

    if (level === "beginner") {
        details =
            "Keep faster efforts short and controlled. If hard intervals are new, replace this with easy cardio and build gradually.";
    } else {
        details =
            "One example is 4 × 4 minutes hard, with easy recovery between repeats. Keep the effort repeatable.";
    }

    return workout("quality", "VO₂-max intervals", details, "QUALITY");
}

function strengthSession(which, level) {
    const rounds = level === "advanced" ? "2–3 controlled rounds" : "2 controlled rounds";

    if (which === "A") {
        return workout(
            "strength",
            "Full-body strength A",
            `Squat or chair sit-to-stand • glute bridge • incline push-up • band or backpack row • dead bug • calf raises and single-leg balance. Aim for ${rounds}.`,
            "STRENGTH + STABILITY"
        );
    }

    return workout(
        "strength",
        "Full-body strength B",
        `Supported split squat • hip hinge • light overhead press • row • side plank • lateral band walk • bent-knee calf raise. Aim for ${rounds}.`,
        "STRENGTH + STABILITY"
    );
}

function speedSession(level, weekIndex) {
    if (level === "beginner") {
        return workout(
            "recovery",
            "Easy cross-training or mobility",
            "Take a comfortable walk or bike ride, or do gentle mobility. Skip this session if you need rest.",
            "OPTIONAL"
        );
    }

    const title = weekIndex === 0
        ? "Short hill strides"
        : "Short hill sprints";

    const details = level === "advanced"
        ? "Try 6 × 10–20 seconds fast uphill, with a full walk-back recovery. Skip these if you are not accustomed to fast running."
        : "Try 4 × 10 seconds fast but relaxed uphill, with a full walk-back recovery. Skip these if you are not accustomed to fast running.";

    return workout("speed", title, details, "SHORT EFFORTS");
}

function optionalRecovery() {
    return workout(
        "recovery",
        "Optional recovery movement",
        "Choose a gentle walk and light mobility, or take a full rest day.",
        "OPTIONAL"
    );
}

function buildWeek(level, daysAvailable, weekIndex) {
    const days = Array.from({ length: 7 }, () => restDay());
    const quality = weekIndex === 0
        ? thresholdSession(level)
        : vo2Session(level);

    if (daysAvailable === 3) {
        days[1] = quality;
        days[3] = strengthSession(weekIndex === 0 ? "A" : "B", level);
        days[5] = longAerobic(level);
    } else if (daysAvailable === 4) {
        days[0] = strengthSession("A", level);
        days[2] = quality;
        days[4] = strengthSession("B", level);
        days[6] = longAerobic(level);
    } else if (daysAvailable === 5) {
        days[0] = strengthSession("A", level);
        days[1] = quality;
        days[3] = easyAerobic();
        days[4] = strengthSession("B", level);
        days[6] = longAerobic(level);
    } else {
        days[0] = strengthSession("A", level);
        days[1] = quality;
        days[2] = easyAerobic();
        days[3] = strengthSession("B", level);
        days[4] = speedSession(level, weekIndex);
        days[6] = longAerobic(level);

        if (daysAvailable === 7) {
            days[5] = optionalRecovery();
        }
    }

    return days;
}

function renderDay(day, dayIndex, weekIndex) {
    const dayNumber = weekIndex * 7 + dayIndex + 1;

    return `
        <article class="day-card day-card--${day.category}">
            <div class="day-card-top">
                <p class="day-name">
                    <span class="day-count">DAY ${dayNumber}</span>
                    <span>${weekdays[dayIndex]}</span>
                </p>
                <span class="tag">${day.tag}</span>
            </div>
            <h3>${day.title}</h3>
            <p>${day.details}</p>
        </article>
    `;
}

function renderWeek(days, weekIndex) {
    const weekTitle = weekIndex === 0 ? "Build the foundation" : "Rotate the focus";

    return `
        <section class="week-section" aria-labelledby="week-${weekIndex + 1}-title">
            <div class="week-heading">
                <p class="eyebrow">WEEK ${weekIndex + 1}</p>
                <h2 id="week-${weekIndex + 1}-title">${weekTitle}</h2>
            </div>
            <div class="week-grid-scroll">
                <div class="day-grid">
                    ${days.map((day, dayIndex) => renderDay(day, dayIndex, weekIndex)).join("")}
                </div>
            </div>
        </section>
    `;
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const level = document.getElementById("fitness").value;
    const daysAvailable = Number(document.getElementById("days").value);

    const plan = [
        buildWeek(level, daysAvailable, 0),
        buildWeek(level, daysAvailable, 1)
    ];

    summary.textContent =
        `${fitnessLabels[level]} plan · Up to ${daysAvailable} available days per week · 14 days`;
    summary.hidden = false;

    results.innerHTML = plan
        .map((week, weekIndex) => renderWeek(week, weekIndex))
        .join("");
});

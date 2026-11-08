function generatePlan() {

    const workouts = [

        {
            title: "Zone 2 + Core Stability",
            details:
                "30-45 minute easy cardio + Bird Dogs + Side Planks"
        },

        {
            title: "Upper Body + Shoulder Stability",
            details:
                "Pushups, Rows, Face Pulls, External Rotations"
        },

        {
            title: "Threshold Session",
            details:
                "3 x 10 minutes comfortably hard effort"
        },

        {
            title: "Recovery Day",
            details:
                "Easy walk and mobility work"
        },

        {
            title: "Lower Body + Hip Stability",
            details:
                "Squats, Split Squats, Clamshells, Monster Walks"
        },

        {
            title: "Long Aerobic Session",
            details:
                "60-90 minute Zone 2 session"
        },

        {
            title: "Recovery Day",
            details:
                "Stretching and mobility"
        },

        {
            title: "VO2 Max Session",
            details:
                "4 x 4 minute hard intervals"
        },

        {
            title: "Upper Body Strength",
            details:
                "Pushups, Rows, Presses"
        },

        {
            title: "Recovery Day",
            details:
                "Easy walk"
        },

        {
            title: "Sprint Session",
            details:
                "6 x 15 second hill sprints"
        },

        {
            title: "Lower Body + Ankle Stability",
            details:
                "Lunges, Calf Raises, Single Leg Balance"
        },

        {
            title: "Long Aerobic Session",
            details:
                "60-90 minute Zone 2 workout"
        },

        {
            title: "Rest Day",
            details:
                "Complete recovery"
        }
    ];

    const results = document.getElementById("results");

    let html = "<h2>Your 14-Day Plan</h2>";

    workouts.forEach((workout, index) => {

        html += `
        <div class="day-card">
            <h3>Day ${index + 1}</h3>
            <strong>${workout.title}</strong>
            <p>${workout.details}</p>
        </div>
        `;

    });

    results.innerHTML = html;
}
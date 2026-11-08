const cardioOptions = [
    "Brisk Walk",
    "Cycling",
    "Jogging",
    "Rowing",
    "Elliptical"
];

const strengthWorkouts = [

{
title:"Lower Body + Stability",

exercises:[
"Goblet Squat",
"Reverse Lunge",
"Single-Leg Deadlift",
"Calf Raise",
"Tibialis Raise"
]
},

{
title:"Upper Body Push",

exercises:[
"Pushups",
"Dumbbell Press",
"Shoulder Press",
"Band External Rotation",
"Wall Slides"
]
},

{
title:"Upper Body Pull",

exercises:[
"Rows",
"Band Pull Apart",
"Face Pull",
"Farmer Carry",
"Rear Delt Fly"
]
},

{
title:"Core + Stabilizers",

exercises:[
"Bird Dog",
"Dead Bug",
"Side Plank",
"Pallof Press",
"Glute Bridge"
]
}
];

const mobilityExercises = [
"Hip Flexor Stretch",
"Thoracic Rotation",
"Ankle Mobility",
"Hamstring Stretch",
"Cat Cow"
];

function getCardioDuration(level){

    if(level === "Beginner") return 30;
    if(level === "Intermediate") return 45;
    return 60;
}

function generatePlan(){

    const level =
        document.getElementById("fitnessLevel").value;

    const daysPerWeek =
        Number(document.getElementById("daysPerWeek").value);

    let output = "";

    for(let day=1; day<=14; day++){

        const dayOfWeek =
            ((day-1)%7)+1;

        const workout =
            strengthWorkouts[
                (day-1)%strengthWorkouts.length
            ];

        const cardio =
            cardioOptions[
                Math.floor(
                    Math.random()*cardioOptions.length
                )
            ];

        const mobility =
            mobilityExercises[
                (day-1)%mobilityExercises.length
            ];

        const trainingDay =
            dayOfWeek <= daysPerWeek;

        if(trainingDay){

            output += `
            <div class="day-card">

                <h2>Day ${day}</h2>

                <h3>Aerobic Training</h3>

                <p>
                ${cardio}
                -
                ${getCardioDuration(level)} min Zone 2
                </p>

                <h3>${workout.title}</h3>

                <ul>
                    ${workout.exercises
                        .map(e=>`<li>${e}</li>`)
                        .join("")}
                </ul>

                <h3>Mobility</h3>

                <p>${mobility}</p>

            </div>
            `;
        }
        else{

            output += `
            <div class="day-card">

                <h2>Day ${day}</h2>

                <h3>Recovery Day</h3>

                <p>
                Easy walk, mobility work,
                and full recovery.
                </p>

            </div>
            `;
        }
    }

    document.getElementById("plan").innerHTML =
        output;
}

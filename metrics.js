/*********************************************************
 * 1. AUTH & DATA INITIALIZATION
 *********************************************************/
const currentAuthUser = localStorage.getItem("authUser");
const allUsers = JSON.parse(localStorage.getItem("users")) || {};

// If the user isn't logged in, the HTML script already redirects,
// but we add this here to prevent the rest of the script from breaking.
const currentMetricsData = currentAuthUser ? (allUsers[currentAuthUser] || {}) : {};

/*********************************************************
 * 2. ELEMENT DEFINITIONS
 *********************************************************/
const mForm = document.getElementById("metricsForm");

// Inputs
const hInput = document.getElementById("height");
const wInput = document.getElementById("weight");
const ageInput = document.getElementById("age");
const genInput = document.getElementById("gender");
const actInput = document.getElementById("activity");

// Display Spans
const bmiVal = document.getElementById("bmiValue");
const bmiCat = document.getElementById("bmiCategory");
const bmrVal = document.getElementById("bmrValue");
const calVal = document.getElementById("calorieValue");

/*********************************************************
 * 3. LOAD SAVED DATA ON PAGE LOAD
 *********************************************************/
if (currentMetricsData.metrics && hInput) {
    const m = currentMetricsData.metrics;
    hInput.value = m.height || "";
    wInput.value = m.weight || "";
    ageInput.value = m.age || "";
    genInput.value = m.gender || "male";
    actInput.value = m.activity || "1.2";

    showResults(m);
}

/*********************************************************
 * 4. CALCULATION LOGIC
 *********************************************************/
if (mForm) {
    mForm.addEventListener("submit", e => {
        e.preventDefault();

        // Convert inputs to numbers
        const h = parseFloat(hInput.value);
        const w = parseFloat(wInput.value);
        const a = parseInt(ageInput.value);
        const g = genInput.value;
        const act = parseFloat(actInput.value);

        // BMI Calculation: w / (h/100)^2
        const bmi = w / ((h / 100) ** 2);

        let category = "Normal";
        if (bmi < 18.5) category = "Underweight";
        else if (bmi >= 25 && bmi < 30) category = "Overweight";
        else if (bmi >= 30) category = "Obese";

        // BMR Calculation (Mifflin-St Jeor Equation)
        // Men: 10w + 6.25h - 5a + 5
        // Women: 10w + 6.25h - 5a - 161
        const bmr = (g === "male")
            ? (10 * w) + (6.25 * h) - (5 * a) + 5
            : (10 * w) + (6.25 * h) - (5 * a) - 161;

        const calories = bmr * act;

        const metricsResults = {
            height: h,
            weight: w,
            age: a,
            gender: g,
            activity: act,
            bmi: bmi,
            category: category,
            bmr: bmr,
            calories: calories
        };

        // Save back to LocalStorage
        if (currentAuthUser) {
            allUsers[currentAuthUser] = {
                ...allUsers[currentAuthUser],
                metrics: metricsResults
            };
            localStorage.setItem("users", JSON.stringify(allUsers));
        }

        showResults(metricsResults);
    });
}

/*********************************************************
 * 5. UI DISPLAY FUNCTION
 *********************************************************/
function showResults(m) {
    if (bmiVal) bmiVal.textContent = m.bmi.toFixed(1);
    if (bmiCat) bmiCat.textContent = m.category;
    if (bmrVal) bmrVal.textContent = Math.round(m.bmr);
    if (calVal) calVal.textContent = Math.round(m.calories);
}
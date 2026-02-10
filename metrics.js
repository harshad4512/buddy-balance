document.addEventListener("DOMContentLoaded", () => {
    // 1. AUTH & STORAGE
    const currentAuthUser = localStorage.getItem("authUser");
    if (!currentAuthUser) { window.location.href = "auth.html"; return; }

    const allUsers = JSON.parse(localStorage.getItem("users")) || {};
    const userData = allUsers[currentAuthUser] || { habits: [], checks: {}, metrics: {} };

    const el = {
        mForm: document.getElementById("metricsForm"),
        hInput: document.getElementById("height"),
        wInput: document.getElementById("weight"),
        ageInput: document.getElementById("age"),
        genInput: document.getElementById("gender"),
        actInput: document.getElementById("activity"),
        bmiVal: document.getElementById("bmiValue"),
        bmiCat: document.getElementById("bmiCategory"),
        fatVal: document.getElementById("fatValue"), // New selector
        bmrVal: document.getElementById("bmrValue"),
        calVal: document.getElementById("calorieValue"),
        dailyPercent: document.getElementById("dailyPercent")
    };

    // 2. TOP CORNER SYNC
    function updateDailyLabel() {
        const today = new Date();
        const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
        let done = 0;
        const habits = userData.habits || [];
        habits.forEach((_, i) => {
            if (userData.checks[`${y}-${m}-${d}-${i}`]) done++;
        });
        const pct = habits.length ? Math.round((done / habits.length) * 100) : 0;
        if (el.dailyPercent) el.dailyPercent.textContent = pct + "%";
    }

    // 3. LOAD DATA
    if (userData.metrics && el.hInput) {
        const m = userData.metrics;
        el.hInput.value = m.height || "";
        el.wInput.value = m.weight || "";
        el.ageInput.value = m.age || "";
        el.genInput.value = m.gender || "male";
        el.actInput.value = m.activity || "1.2";
        showResults(m);
    }

    // 4. CALCULATION
    if (el.mForm) {
        el.mForm.addEventListener("submit", e => {
            e.preventDefault();

            const h = parseFloat(el.hInput.value);
            const w = parseFloat(el.wInput.value);
            const a = parseInt(el.ageInput.value);
            const g = el.genInput.value;
            const act = parseFloat(el.actInput.value);

            // BMI
            const bmi = w / ((h / 100) ** 2);
            let category = "Normal";
            if (bmi < 18.5) category = "Underweight";
            else if (bmi >= 25 && bmi < 30) category = "Overweight";
            else if (bmi >= 30) category = "Obese";

            // BMR (Mifflin-St Jeor)
            const bmr = (g === "male")
                ? (10 * w) + (6.25 * h) - (5 * a) + 5
                : (10 * w) + (6.25 * h) - (5 * a) - 161;

            const calories = bmr * act;

            // BODY FAT % (BMI-based Adult formula)
            // Men: 1.20 * BMI + 0.23 * Age - 16.2
            // Women: 1.20 * BMI + 0.23 * Age - 5.4
            const fat = (g === "male")
                ? (1.20 * bmi) + (0.23 * a) - 16.2
                : (1.20 * bmi) + (0.23 * a) - 5.4;

            const results = { height: h, weight: w, age: a, gender: g, activity: act, bmi, category, bmr, calories, fat };

            userData.metrics = results;
            allUsers[currentAuthUser] = userData;
            localStorage.setItem("users", JSON.stringify(allUsers));

            showResults(results);
        });
    }

    function showResults(m) {
        if (el.bmiVal) el.bmiVal.textContent = m.bmi.toFixed(1);
        if (el.bmiCat) el.bmiCat.textContent = m.category;
        if (el.calVal) el.calVal.textContent = Math.round(m.calories);
        if (el.bmrVal) el.bmrVal.textContent = Math.round(m.bmr);
        if (el.fatVal) el.fatVal.textContent = Math.max(0, m.fat).toFixed(1) + "%";
    }

    updateDailyLabel();
});
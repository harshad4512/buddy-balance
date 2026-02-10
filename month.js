/*********************************************************
 * BUDDY BALANCE – INTEGRATED HABIT TRACKER (month.js)
 * -------------------------------------------------------
 * INCLUDES: Hard Sync, Delete Confirm, Streaks, Confetti,
 * Color-Coded Weekly Chart, and Daily Bar Labels.
 *********************************************************/

document.addEventListener("DOMContentLoaded", () => {
    // --- 1. AUTH & DATA INITIALIZATION ---
    const currentUser = localStorage.getItem("authUser");
    if (!currentUser) { window.location.href = "auth.html"; return; }

    let users = JSON.parse(localStorage.getItem("users")) || {};
    if (!users[currentUser]) users[currentUser] = { habits: [], checks: {}, profileImg: null };
    
    const userData = users[currentUser];
    let habits = userData.habits;

    const saveUserData = () => {
        users[currentUser] = userData;
        localStorage.setItem("users", JSON.stringify(users));
    };

    // --- 2. ELEMENT SELECTORS ---
    const $ = (id) => document.getElementById(id);
    const el = {
        habitInput: $("habitInput"), addHabitBtn: $("addHabitBtn"), habitList: $("habitList"),
        habitBody: $("habitBody"), dateRow: $("dateRow"), weekdayRow: $("weekdayRow"),
        dailyBars: $("dailyBars"), weeklyBars: $("weeklyProgress"), topHabitsList: $("topHabitsList"),
        monthSelect: $("monthSelect"), yearSelect: $("yearSelect"), dailyPercent: $("dailyPercent"),
        dailyCount: $("dailyCount"), logoutBtn: $("logoutBtn"), logoutModal: $("logoutModal"),
        cancelLogout: $("cancelLogout"), confirmLogout: $("confirmLogout"), 
        profileImg: $("profileImg"), photoInput: $("photoInput")
    };

    const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // --- 3. CELEBRATION (CONFETTI) ---
    function launchConfetti() {
        const emojis = ["🔥", "⭐", "💪", "✨", "✅"];
        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement("div");
            confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            confetti.style.cssText = `position:fixed; left:${Math.random()*100}vw; top:-5vh; font-size:2rem; z-index:9999; pointer-events:none; transition:transform 2s ease-out, opacity 2s;`;
            document.body.appendChild(confetti);
            setTimeout(() => {
                confetti.style.transform = `translateY(110vh) rotate(${Math.random()*360}deg)`;
                confetti.style.opacity = "0";
            }, 10);
            setTimeout(() => confetti.remove(), 2000);
        }
    }

    // --- 4. SIDEBAR RENDER (WITH STREAKS) ---
    function renderHabitList() {
        if (!el.habitList) return;
        el.habitList.innerHTML = "";
        const today = new Date();
        const y = today.getFullYear(), m = today.getMonth(), dToday = today.getDate();

        habits.forEach((habit, index) => {
            let streak = 0;
            for (let d = dToday; d >= 1; d--) {
                if (userData.checks[`${y}-${m}-${d}-${index}`]) streak++;
                else break;
            }
            const li = document.createElement("li");
            li.innerHTML = `<span>${habit} <strong style="color:#00c853">🔥 ${streak}</strong></span>`;
            
            const del = document.createElement("button");
            del.textContent = "✕";
            del.className = "delete-habit";
            del.onclick = () => {
                if (confirm(`Are you sure you want to delete "${habit}"?`)) {
                    habits.splice(index, 1);
                    Object.keys(userData.checks).forEach(k => { if (k.endsWith(`-${index}`)) delete userData.checks[k]; });
                    saveUserData(); renderHabitList(); renderGrid();
                }
            };
            li.appendChild(del);
            el.habitList.appendChild(li);
        });
    }

    // --- 5. GRID & ANALYTICS ---
    function renderGrid() {
        const m = +el.monthSelect.value, y = +el.yearSelect.value;
        const days = new Date(y, m + 1, 0).getDate();

        el.dateRow.innerHTML = "<th>Habits</th>";
        el.weekdayRow.innerHTML = "<th></th>";
        el.habitBody.innerHTML = "";

        for (let d = 1; d <= days; d++) {
            el.dateRow.innerHTML += `<th>${d}</th>`;
            el.weekdayRow.innerHTML += `<th>${weekdays[new Date(y, m, d).getDay()]}</th>`;
        }

        habits.forEach((habit, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${habit}</td>`;
            for (let d = 1; d <= days; d++) {
                const key = `${y}-${m}-${d}-${index}`;
                const td = document.createElement("td");
                const cb = document.createElement("input");
                cb.type = "checkbox";
                cb.checked = userData.checks[key] || false;
                cb.onchange = () => {
                    userData.checks[key] = cb.checked;
                    if (cb.checked) {
                        let curStr = 0;
                        for (let x = d; x >= 1; x--) {
                            if (userData.checks[`${y}-${m}-${x}-${index}`]) curStr++;
                            else break;
                        }
                        if (curStr > 0 && curStr % 7 === 0) launchConfetti();
                    }
                    saveUserData(); updateAnalytics(); renderHabitList();
                };
                td.appendChild(cb); row.appendChild(td);
            }
            el.habitBody.appendChild(row);
        });
        updateAnalytics();
    }

    function updateAnalytics() {
        const m = +el.monthSelect.value, y = +el.yearSelect.value;
        const days = new Date(y, m + 1, 0).getDate();

        // Daily Progress (With Bar Labels)
        el.dailyBars.innerHTML = "";
        for (let d = 1; d <= days; d++) {
            let done = 0;
            habits.forEach((_, i) => { if (userData.checks[`${y}-${m}-${d}-${i}`]) done++; });
            const pct = habits.length ? (done / habits.length) * 100 : 0;
            el.dailyBars.innerHTML += `
                <div class="week-bar">
                    <div class="day-bar"><div class="day-bar-fill" style="height:${pct}%"></div></div>
                    <small style="font-size: 10px; margin-top: 4px; color: #888;">${d}</small>
                </div>`;
        }

        // Weekly Efficiency (Color-Coded)
        el.weeklyBars.innerHTML = "";
        const weeks = Math.ceil(days / 7);
        for (let w = 0; w < weeks; w++) {
            let wDone = 0, wTotal = 0;
            for (let d = w * 7 + 1; d <= Math.min(days, (w + 1) * 7); d++) {
                habits.forEach((_, i) => { wTotal++; if (userData.checks[`${y}-${m}-${d}-${i}`]) wDone++; });
            }
            const wPct = wTotal ? (wDone / wTotal) * 100 : 0;
            let color = "#ff4d4d"; // Red
            if (wPct >= 80) color = "#00c853"; // Green
            else if (wPct >= 50) color = "#ffeb3b"; // Yellow

            el.weeklyBars.innerHTML += `
                <div class="week-bar">
                    <div class="day-bar" style="width:40px;"><div class="day-bar-fill" style="height:${wPct}%; background:${color};"></div></div>
                    <small>Week ${w + 1}</small>
                    <small style="font-size: 9px; color:${color}">${Math.round(wPct)}%</small>
                </div>`;
        }

        // Header Labels
        const today = new Date();
        let tDone = 0;
        if (today.getMonth() === m && today.getFullYear() === y) {
            habits.forEach((_, i) => { if (userData.checks[`${y}-${m}-${today.getDate()}-${i}`]) tDone++; });
        }
        el.dailyPercent.textContent = habits.length ? Math.round((tDone/habits.length)*100)+"%" : "0%";
        el.dailyCount.textContent = `${tDone} / ${habits.length} Tasks Today`;
    }

    // --- 6. EVENT LISTENERS ---
    const addHabitUnified = () => {
        const val = el.habitInput.value.trim();
        if (val && !habits.includes(val)) {
            habits.push(val); el.habitInput.value = "";
            saveUserData(); renderHabitList(); renderGrid();
        }
    };
    el.addHabitBtn.onclick = addHabitUnified;
    el.habitInput.onkeydown = (e) => { if (e.key === "Enter") addHabitUnified(); };

    el.monthSelect.onchange = renderGrid;
    el.yearSelect.onchange = renderGrid;

    // Logout Modal
    el.logoutBtn.onclick = () => el.logoutModal.style.display = "flex";
    el.cancelLogout.onclick = () => el.logoutModal.style.display = "none";
    el.confirmLogout.onclick = () => { localStorage.removeItem("authUser"); window.location.href = "auth.html"; };

    // Initialize Selectors
    months.forEach((name, i) => el.monthSelect.innerHTML += `<option value="${i}">${name}</option>`);
    for (let yr = 2024; yr <= 2030; yr++) el.yearSelect.innerHTML += `<option value="${yr}">${yr}</option>`;
    el.monthSelect.value = new Date().getMonth();
    el.yearSelect.value = new Date().getFullYear();

    renderHabitList(); renderGrid();
});
document.addEventListener("DOMContentLoaded", () => {
    // 1. AUTH & STORAGE
    const currentUser = localStorage.getItem("authUser");
    if (!currentUser) { window.location.href = "auth.html"; return; }

    let users = JSON.parse(localStorage.getItem("users")) || {};
    if (!users[currentUser]) users[currentUser] = { habits: [], checks: {}, profileImg: null };
    const userData = users[currentUser];
    
    // 2. ELEMENT SELECTORS
    const $ = (id) => document.getElementById(id);
    const el = {
        habitInput: $("habitInput"), addHabitBtn: $("addHabitBtn"), habitList: $("habitList"),
        habitBody: $("habitBody"), dateRow: $("dateRow"), weekdayRow: $("weekdayRow"),
        dailyBars: $("dailyBars"), weeklyBars: $("weeklyProgress"), 
        topHabitsList: $("topHabitsList"), // Restored selector
        monthSelect: $("monthSelect"), yearSelect: $("yearSelect"), 
        dailyPercent: $("dailyPercent"), dailyCount: $("dailyCount"),
        logoutBtn: $("logoutBtn"), logoutModal: $("logoutModal"),
        cancelLogout: $("cancelLogout"), confirmLogout: $("confirmLogout"), 
        profileImg: $("profileImg"), photoInput: $("photoInput"),
        photoPlaceholder: $("photoPlaceholder")
    };

    const save = () => { users[currentUser] = userData; localStorage.setItem("users", JSON.stringify(users)); };

    // 3. PROFILE PHOTO LOGIC (FIXED)
    if (userData.profileImg) {
        el.profileImg.src = userData.profileImg;
        el.profileImg.style.display = "block";
        el.photoPlaceholder.style.display = "none";
    }

    el.photoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const b64 = event.target.result;
                el.profileImg.src = b64;
                el.profileImg.style.display = "block";
                el.photoPlaceholder.style.display = "none";
                userData.profileImg = b64;
                save();
            };
            reader.readAsDataURL(file);
        }
    });

    // 4. TOP 10 CONSISTENCY LOGIC
    function updateTopHabits() {
        const m = +el.monthSelect.value, y = +el.yearSelect.value;
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        
        const rankings = userData.habits.map((habit, index) => {
            let completedDays = 0;
            for (let d = 1; d <= daysInMonth; d++) {
                if (userData.checks[`${y}-${m}-${d}-${index}`]) completedDays++;
            }
            return { name: habit, score: Math.round((completedDays / daysInMonth) * 100) };
        });

        rankings.sort((a, b) => b.score - a.score);
        el.topHabitsList.innerHTML = rankings.slice(0, 10).map(h => 
            `<li><span>${h.name}</span><strong>${h.score}%</strong></li>`
        ).join("");
    }

    // 5. GRID & ANALYTICS RENDER
    function renderUI() {
        const m = +el.monthSelect.value, y = +el.yearSelect.value;
        const days = new Date(y, m + 1, 0).getDate();
        const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

        // Clear and rebuild grid
        el.dateRow.innerHTML = "<th>Habits</th>";
        el.weekdayRow.innerHTML = "<th></th>";
        el.habitBody.innerHTML = "";

        for (let d = 1; d <= days; d++) {
            el.dateRow.innerHTML += `<th>${d}</th>`;
            el.weekdayRow.innerHTML += `<th>${weekdays[new Date(y, m, d).getDay()]}</th>`;
        }

        userData.habits.forEach((habit, idx) => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${habit}</td>`;
            for (let d = 1; d <= days; d++) {
                const key = `${y}-${m}-${d}-${idx}`;
                const td = document.createElement("td");
                const cb = document.createElement("input");
                cb.type = "checkbox";
                cb.checked = userData.checks[key] || false;
                cb.onchange = () => { 
                    userData.checks[key] = cb.checked; 
                    save(); updateUI(); updateTopHabits(); 
                };
                td.appendChild(cb); row.appendChild(td);
            }
            el.habitBody.appendChild(row);
        });
        updateUI();
        updateTopHabits();
    }

    // Helper for charts and labels
    function updateUI() {
        const m = +el.monthSelect.value, y = +el.yearSelect.value;
        const days = new Date(y, m + 1, 0).getDate();
        const today = new Date();

        // Header Label
        let tDone = 0;
        if (today.getMonth() === m && today.getFullYear() === y) {
            userData.habits.forEach((_, i) => { if (userData.checks[`${y}-${m}-${today.getDate()}-${i}`]) tDone++; });
        }
        el.dailyPercent.textContent = userData.habits.length ? Math.round((tDone / userData.habits.length) * 100) + "%" : "0%";
        el.dailyCount.textContent = `${tDone} / ${userData.habits.length} Tasks Today`;

        // Daily Progress Bar Labels
        el.dailyBars.innerHTML = "";
        for (let d = 1; d <= days; d++) {
            let done = 0;
            userData.habits.forEach((_, i) => { if (userData.checks[`${y}-${m}-${d}-${i}`]) done++; });
            const pct = userData.habits.length ? (done / userData.habits.length) * 100 : 0;
            el.dailyBars.innerHTML += `<div class="week-bar"><div class="day-bar"><div class="day-bar-fill" style="height:${pct}%"></div></div><small>${d}</small></div>`;
        }

        // Color-Coded Weekly Efficiency
        el.weeklyBars.innerHTML = "";
        for (let w = 0; w < Math.ceil(days / 7); w++) {
            let wDone = 0, wTotal = 0;
            for (let d = w * 7 + 1; d <= Math.min(days, (w + 1) * 7); d++) {
                userData.habits.forEach((_, i) => { wTotal++; if (userData.checks[`${y}-${m}-${d}-${i}`]) wDone++; });
            }
            const wPct = wTotal ? (wDone / wTotal) * 100 : 0;
            const color = wPct >= 80 ? "#00c853" : wPct >= 50 ? "#ffeb3b" : "#ff4d4d";
            el.weeklyBars.innerHTML += `<div class="week-bar"><div class="day-bar" style="width:40px;"><div class="day-bar-fill" style="height:${wPct}%; background:${color};"></div></div><small>W${w+1}</small></div>`;
        }
    }

    // 6. INITIALIZATION
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    months.forEach((name, i) => el.monthSelect.innerHTML += `<option value="${i}">${name}</option>`);
    for (let yr = 2024; yr <= 2030; yr++) el.yearSelect.innerHTML += `<option value="${yr}">${yr}</option>`;
    
    el.monthSelect.value = new Date().getMonth();
    el.yearSelect.value = new Date().getFullYear();
    el.monthSelect.onchange = renderUI;
    el.yearSelect.onchange = renderUI;

    renderUI();
});
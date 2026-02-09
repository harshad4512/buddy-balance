/*********************************************************
 * SAFE INITIALIZATION
 *********************************************************/
document.addEventListener("DOMContentLoaded", () => {
    console.log("month.js loaded and DOM ready");

    // 1. Auth Check
    const currentUser = localStorage.getItem("authUser");
    if (!currentUser) {
        window.location.href = "auth.html";
        return;
    }

    // 2. Data Parsing (with Error Handling)
    let users = {};
    try {
        users = JSON.parse(localStorage.getItem("users")) || {};
    } catch (e) {
        console.error("Critical: LocalStorage corrupted. Resetting data.", e);
        users = {};
    }

    if (!users[currentUser]) {
        users[currentUser] = {
            password: "",
            habits: [],
            checks: {},
            profileImg: null
        };
    }

    const userData = users[currentUser];
    let habits = userData.habits;

    /*********************************************************
     * SAFE ELEMENT RETRIEVAL
     *********************************************************/
    const getEl = (id) => document.getElementById(id);
    
    // UI Elements
    const elements = {
        habitInput: getEl("habitInput"),
        habitList: getEl("habitList"),
        habitBody: getEl("habitBody"),
        dateRow: getEl("dateRow"),
        weekdayRow: getEl("weekdayRow"),
        dailyBars: getEl("dailyBars"),
        weeklyBars: getEl("weeklyProgress"),
        topHabitsList: getEl("topHabitsList"),
        monthSelect: getEl("monthSelect"),
        yearSelect: getEl("yearSelect"),
        dailyPercent: getEl("dailyPercent"),
        dailyCount: getEl("dailyCount"),
        logoutBtn: getEl("logoutBtn"),
        photoInput: getEl("photoInput"),
        profileImg: getEl("profileImg"),
        // Modal elements
        logoutModal: getEl("logoutModal"),
        cancelLogout: getEl("cancelLogout"),
        confirmLogout: getEl("confirmLogout")
    };

    // Constant Data
    const weekdays = ["S","M","T","W","T","F","S"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    /*********************************************************
     * HELPERS
     *********************************************************/
    function saveUserData() {
        users[currentUser] = userData;
        try {
            localStorage.setItem("users", JSON.stringify(users));
        } catch (e) {
            alert("Storage is full! Try deleting some photos.");
        }
    }

    function daysInMonth(m, y) {
        return new Date(y, m + 1, 0).getDate();
    }

    /*********************************************************
     * ANALYTICS & RENDERING (Wrapped in safe checks)
     *********************************************************/
    function updateAll() {
        updateDailyProgress();
        updateDailyBars();
        updateWeeklyBars();
        updateTopHabits();
    }

    function updateDailyProgress() {
        if (!elements.dailyPercent || !elements.dailyCount) return;
        const today = new Date();
        const mSelect = elements.monthSelect ? +elements.monthSelect.value : -1;
        const ySelect = elements.yearSelect ? +elements.yearSelect.value : -1;

        if (today.getMonth() !== mSelect || today.getFullYear() !== ySelect) {
            elements.dailyPercent.textContent = "0%";
            elements.dailyCount.textContent = `0 / ${habits.length}`;
            return;
        }

        let done = 0;
        if (elements.habitBody) {
            elements.habitBody.querySelectorAll("tr").forEach(row => {
                if (row.children[today.getDate()]?.firstChild?.checked) done++;
            });
        }

        elements.dailyPercent.textContent = habits.length ? Math.round((done / habits.length) * 100) + "%" : "0%";
        elements.dailyCount.textContent = `${done} / ${habits.length}`;
    }

    function updateDailyBars() {
        if (!elements.dailyBars) return;
        elements.dailyBars.innerHTML = "";
        const m = +elements.monthSelect.value;
        const y = +elements.yearSelect.value;
        const days = daysInMonth(m, y);

        for (let d = 1; d <= days; d++) {
            let done = 0;
            if (elements.habitBody) {
                elements.habitBody.querySelectorAll("tr").forEach(row => {
                    if (row.children[d]?.firstChild?.checked) done++;
                });
            }
            const percent = habits.length ? (done / habits.length) * 100 : 0;
            elements.dailyBars.innerHTML += `<div class="day-bar"><div class="day-bar-fill" style="height:${percent}%"></div></div>`;
        }
    }

    function updateWeeklyBars() {
        if (!elements.weeklyBars) return;
        elements.weeklyBars.innerHTML = "";
        const days = daysInMonth(+elements.monthSelect.value, +elements.yearSelect.value);
        const weeks = Math.ceil(days / 7);

        for (let w = 0; w < weeks; w++) {
            let done = 0, total = 0;
            if (elements.habitBody) {
                elements.habitBody.querySelectorAll("tr").forEach(row => {
                    for (let d = w * 7 + 1; d <= Math.min(days, (w + 1) * 7); d++) {
                        total++;
                        if (row.children[d]?.firstChild?.checked) done++;
                    }
                });
            }
            const percent = total ? (done / total) * 100 : 0;
            elements.weeklyBars.innerHTML += `<div class="week-bar"><div class="day-bar"><div class="day-bar-fill" style="height:${percent}%"></div></div><small>W${w + 1}</small></div>`;
        }
    }

    function updateTopHabits() {
        if (!elements.topHabitsList) return;
        elements.topHabitsList.innerHTML = "";
        const days = daysInMonth(+elements.monthSelect.value, +elements.yearSelect.value);

        habits.map((habit, index) => {
            let done = 0;
            if (elements.habitBody) {
                elements.habitBody.querySelectorAll("tr")[index]?.querySelectorAll("input").forEach(cb => cb.checked && done++);
            }
            return { habit, percent: days ? done / days : 0 };
        })
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 10)
        .forEach(item => {
            elements.topHabitsList.innerHTML += `<li>${item.habit} (${Math.round(item.percent * 100)}%)</li>`;
        });
    }

    function renderHabitList() {
        if (!elements.habitList) return;
        elements.habitList.innerHTML = "";
        habits.forEach((habit, index) => {
            const li = document.createElement("li");
            li.textContent = habit;
            const del = document.createElement("button");
            del.textContent = "✕";
            del.className = "delete-habit";
            del.onclick = () => {
                habits.splice(index, 1);
                Object.keys(userData.checks).forEach(key => { if (key.endsWith(`-${index}`)) delete userData.checks[key]; });
                saveUserData();
                renderHabitList();
                render();
            };
            li.appendChild(del);
            elements.habitList.appendChild(li);
        });
    }

    function render() {
        if (!elements.monthSelect || !elements.habitBody) return;
        const m = +elements.monthSelect.value;
        const y = +elements.yearSelect.value;
        const days = daysInMonth(m, y);

        if (elements.dateRow) elements.dateRow.innerHTML = "<th>Habits</th>";
        if (elements.weekdayRow) elements.weekdayRow.innerHTML = "<th></th>";
        elements.habitBody.innerHTML = "";

        for (let d = 1; d <= days; d++) {
            if (elements.dateRow) elements.dateRow.innerHTML += `<th>${d}</th>`;
            if (elements.weekdayRow) elements.weekdayRow.innerHTML += `<th>${weekdays[new Date(y, m, d).getDay()]}</th>`;
        }

        habits.forEach((habit, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${habit}</td>`;
            for (let d = 1; d <= days; d++) {
                const td = document.createElement("td");
                const cb = document.createElement("input");
                cb.type = "checkbox";
                const key = `${y}-${m}-${d}-${index}`;
                cb.checked = userData.checks[key] || false;
                cb.onchange = () => {
                    userData.checks[key] = cb.checked;
                    saveUserData();
                    updateAll();
                };
                td.appendChild(cb);
                row.appendChild(td);
            }
            elements.habitBody.appendChild(row);
        });
        updateAll();
    }

    /*********************************************************
     * ATTACH EVENTS & INITIALIZE
     *********************************************************/
    
    // Dropdowns
    if (elements.monthSelect && elements.yearSelect) {
        months.forEach((m, i) => elements.monthSelect.innerHTML += `<option value="${i}">${m}</option>`);
        for (let y = 2023; y <= 2035; y++) elements.yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
        elements.monthSelect.value = new Date().getMonth();
        elements.yearSelect.value = new Date().getFullYear();
        elements.monthSelect.addEventListener("change", render);
        elements.yearSelect.addEventListener("change", render);
    }

// Input
if (elements.habitInput) {
    elements.habitInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // 🔑 prevents mobile submit
            const value = elements.habitInput.value.trim();
            if (!value) return;

            habits.push(value);
            elements.habitInput.value = "";
            saveUserData();
            renderHabitList();
            render();
        }
    });
}

// Profile
    if (userData.profileImg && elements.profileImg) {
        elements.profileImg.src = userData.profileImg;
        elements.profileImg.style.display = "block";
    }

    if (elements.photoInput) {
        elements.photoInput.addEventListener("change", e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                if (elements.profileImg) {
                    elements.profileImg.src = reader.result;
                    elements.profileImg.style.display = "block";
                }
                userData.profileImg = reader.result;
                saveUserData();
            };
            reader.readAsDataURL(file);
        });
    }

    // Modal
    if (elements.logoutBtn && elements.logoutModal) {
        elements.logoutBtn.addEventListener("click", () => elements.logoutModal.style.display = "flex");
        elements.cancelLogout.addEventListener("click", () => elements.logoutModal.style.display = "none");
        elements.confirmLogout.addEventListener("click", () => {
            localStorage.removeItem("authUser");
            window.location.href = "auth.html";
        });
    }

    // Initial Run
    renderHabitList();
    render();
});
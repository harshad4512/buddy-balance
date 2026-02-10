document.addEventListener("DOMContentLoaded", () => {
    /* ================= ELEMENTS ================= */
    const chatBox = document.getElementById("chatBox");
    const input = document.getElementById("userQuestion");
    const sendBtn = document.getElementById("sendBtn");
    const quickBtns = document.querySelectorAll(".quick-questions button");
    const reportBtn = document.getElementById("downloadReport");
    const langSelect = document.getElementById("langSelect");
    const voiceToggle = document.getElementById("voiceToggle");
    const dailyPercent = document.getElementById("dailyPercent");
    const sidebarTip = document.getElementById("sidebarTip");

    /* ================= DATA INITIALIZATION ================= */
    const user = localStorage.getItem("authUser");
    if (!user) { window.location.href = "auth.html"; return; }
    
    const users = JSON.parse(localStorage.getItem("users")) || {};
    const data = users[user] || {};
    const habits = data.habits || [];
    const checks = data.checks || {};
    const metrics = data.metrics || null;

    const chatKey = `trainerChat_${user}`;
    const history = JSON.parse(localStorage.getItem(chatKey)) || [];

    /* ================= MULTI-LANGUAGE STRINGS ================= */
    const TEXT = {
        en: {
            greet: "👋 Hello! I've analyzed your stats. Ask me for a custom diet or workout.",
            bodyMissing: "Please update your Body Metrics first for a personalized plan.",
            noHabits: "Add some habits like 'Water' or 'Gym' so I can analyze your consistency.",
            lowConsistency: "I noticed your consistency is below 50%. Let's focus on smaller goals.",
            highConsistency: "Great job! You're crushing your habits. Ready to level up?"
        },
        hi: {
            greet: "👋 नमस्ते! मैंने आपके आंकड़ों का विश्लेषण किया है। डाइट या वर्कआउट पूछें।",
            bodyMissing: "व्यक्तिगत योजना के लिए पहले बॉडी मेट्रिक्स अपडेट करें।",
            noHabits: "कुछ आदतें जोड़ें ताकि मैं विश्लेषण कर सकूँ।",
            lowConsistency: "नियमितता 50% से कम है। छोटे लक्ष्यों पर ध्यान दें।",
            highConsistency: "बहुत बढ़िया! आप अपनी आदतों को अच्छे से निभा रहे हैं।"
        },
        mr: {
            greet: "👋 नमस्कार! मी तुमच्या आकडेवारीचे विश्लेषण केले आहे. डाएट किंवा वर्कआउट विचारा.",
            bodyMissing: "वैयक्तिक योजनेसाठी आधी बॉडी मेट्रिक्स अपडेट करा.",
            noHabits: "विश्लेषणासाठी काही सवयी जोडा.",
            lowConsistency: "तुमची सातत्य ५०% पेक्षा कमी आहे. लहान ध्येयांवर लक्ष द्या.",
            highConsistency: "छान! तुम्ही तुमच्या सवयींचे पालन करत आहात."
        }
    };

    /* ================= DYNAMIC LOGIC ENGINE ================= */

    function getDynamicWorkout() {
        if (!metrics) return TEXT[currentLang()].bodyMissing;
        const isOverweight = metrics.bmi > 25;
        const activityMap = { "1.2": "3 days", "1.375": "4 days", "1.55": "5 days", "1.725": "6 days" };
        
        return `[DYNAMIC WORKOUT]
Goal: ${isOverweight ? "Fat Loss & Metabolic Conditioning" : "Hypertrophy & Lean Bulk"}
Intensity: Based on your ${metrics.activity} activity score, aim for ${activityMap[metrics.activity] || "4 days"}/week.
Focus: ${isOverweight ? "Compound lifts + 20min Cardio" : "Progressive overload + High Protein intake"}.
Advice: Your current weight is ${metrics.weight}kg. Prioritize form over heavy weights.`;
    }

    function getDynamicDiet() {
        if (!metrics) return TEXT[currentLang()].bodyMissing;
        const protein = Math.round(metrics.weight * 1.6);
        const habitNames = habits.map(h => h.toLowerCase());
        
        let customWarning = "";
        if (!habitNames.some(h => h.includes("water"))) customWarning = "⚠️ WARNING: You aren't tracking 'Water'. Add it to your habits!";
        
        return `[DYNAMIC DIET]
Target: ${Math.round(metrics.calories)} kCal/day.
Protein: ${protein}g daily (Calculated for your ${metrics.weight}kg body weight).
Carbs: ${metrics.bmi > 25 ? "Keep carbs low (Brown rice/Oats)" : "Moderate carbs for energy"}.
${customWarning}`;
    }

    /* ================= CORE FUNCTIONS ================= */

    function currentLang() { return langSelect.value; }

    function speak(text) {
        if (!voiceToggle.checked) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = (currentLang() === "en") ? "en-IN" : "hi-IN";
        speechSynthesis.speak(u);
    }

    function addMessage(text, type = "bot", save = true) {
        const div = document.createElement("div");
        div.style.cssText = type === "bot" 
            ? `background: #222; color: #fff; padding: 12px; border-radius: 12px; max-width: 80%; align-self: flex-start; border-left: 4px solid #00c853; white-space: pre-line;`
            : `background: #00c853; color: #000; padding: 12px; border-radius: 12px; max-width: 80%; align-self: flex-end; font-weight: 600;`;
        
        div.textContent = text;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        if (type === "bot") speak(text);
        if (save) {
            history.push({ text, type });
            localStorage.setItem(chatKey, JSON.stringify(history));
        }
    }

    function respond(q) {
        const query = q.toLowerCase();
        if (query.includes("workout")) return getDynamicWorkout();
        if (query.includes("diet") || query.includes("eat")) return getDynamicDiet();
        if (query.includes("habit")) return analyzeHabits();
        if (query.includes("body") || query.includes("bmi")) return analyzeBody();
        return TEXT[currentLang()].greet;
    }

    /* ================= ANALYSIS & UI SYNC ================= */

    function analyzeHabits() {
        if (!habits.length) return TEXT[currentLang()].noHabits;
        // Simple consistency check
        let total = Object.keys(checks).length;
        let done = Object.values(checks).filter(v => v).length;
        return (done/total < 0.5) ? TEXT[currentLang()].lowConsistency : TEXT[currentLang()].highConsistency;
    }

    function analyzeBody() {
        if (!metrics) return TEXT[currentLang()].bodyMissing;
        return `Your BMI is ${metrics.bmi.toFixed(1)} (${metrics.category}). Your daily BMR is ${Math.round(metrics.bmr)} calories.`;
    }

    function updateDailyLabel() {
        const today = new Date();
        const keyPrefix = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        let done = 0;
        habits.forEach((_, i) => { if (checks[`${keyPrefix}-${i}`]) done++; });
        const pct = habits.length ? Math.round((done / habits.length) * 100) : 0;
        dailyPercent.textContent = pct + "%";
        
        if (metrics) {
            sidebarTip.textContent = `For a ${metrics.weight}kg ${metrics.gender}, aim for ${Math.round(metrics.calories)} calories today.`;
        }
    }

    /* ================= PDF EXPORT ================= */

    reportBtn.onclick = () => {
        const today = new Date();
        let content = `BUDDY BALANCE HEALTH REPORT\nDate: ${today.toLocaleDateString()}\n\n`;
        if (metrics) {
            content += `[METRICS]\nWeight: ${metrics.weight}kg | BMI: ${metrics.bmi.toFixed(1)}\nDaily Goal: ${Math.round(metrics.calories)} kCal\n\n`;
        }
        content += `[HABITS]\n`;
        habits.forEach((h, i) => content += `- ${h}\n`);
        content += `\n[TRAINER ADVICE]\n${getDynamicDiet()}\n\n${getDynamicWorkout()}`;

        const pdf = `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n4 0 obj << /Length ${content.length + 100} >>\nstream\nBT /F1 10 Tf 50 740 Td 12 TL (${content.replace(/\n/g, ") Tj T* (")}) Tj ET\nendstream endobj\n5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\nxref 0 6\n0000000000 65535 f\ntrailer << /Size 6 /Root 1 0 R >>\nstartxref 450\n%%EOF`;
        const blob = new Blob([pdf], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "BuddyBalance_Health_Summary.pdf";
        link.click();
    };

    /* ================= LISTENERS ================= */

    sendBtn.onclick = () => {
        const q = input.value.trim();
        if (!q) return;
        addMessage(q, "user");
        input.value = "";
        setTimeout(() => addMessage(respond(q)), 400);
    };

    input.onkeydown = (e) => { if (e.key === "Enter") sendBtn.click(); };

    quickBtns.forEach(b => {
        b.onclick = () => {
            addMessage(b.textContent, "user");
            setTimeout(() => addMessage(respond(b.dataset.q)), 400);
        };
    });

    history.forEach(m => addMessage(m.text, m.type, false));
    if (!history.length) addMessage(TEXT[currentLang()].greet);
    updateDailyLabel();
});
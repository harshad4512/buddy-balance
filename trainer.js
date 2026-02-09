document.addEventListener("DOMContentLoaded", () => {
  /* ================= ELEMENTS ================= */
  const chatBox = document.getElementById("chatBox");
  const input = document.getElementById("userQuestion");
  const sendBtn = document.getElementById("sendBtn");
  const quickBtns = document.querySelectorAll(".quick-questions button");
  const reportBtn = document.getElementById("downloadReport");
  const langSelect = document.getElementById("langSelect");
  const voiceToggle = document.getElementById("voiceToggle");

  /* ================= USER DATA ================= */
  const user = localStorage.getItem("authUser");
  const users = JSON.parse(localStorage.getItem("users")) || {};
  const data = users[user] || {};

  const habits = data.habits || [];
  const checks = data.checks || {};
  const metrics = data.metrics || null;

  /* ================= CHAT STORAGE ================= */
  const chatKey = `trainerChat_${user}`;
  const history = JSON.parse(localStorage.getItem(chatKey)) || [];

  /* ================= LANGUAGE TEXT ================= */
  const TEXT = {
    en: {
      greet: "👋 I’m your personal trainer. Ask me about habits, body, workout, or diet.",
      noHabits: "No habits found. Add Workout, Sleep, Water, Diet habits first.",
      bodyMissing: "Add body metrics first for accurate advice.",
      workout: `Indian Gym Workout:
• Push–Pull–Legs (4–5 days)
• Compound lifts first
• 20 min walking daily
• Sunday recovery`,
      diet: `Indian Diet Plan:
• Breakfast: Eggs / Oats / Poha
• Lunch: Roti + Dal + Sabzi
• Snacks: Fruits / Chana
• Dinner: Light roti + veg
• Avoid sugar & fried food`,
      weeklyLow: "Weekly consistency is low. Reduce goals, increase discipline.",
      weeklyMid: "Good progress. Push consistency slightly more.",
      weeklyHigh: "Excellent week. Maintain this routine."
    },
    hi: {
      greet: "👋 मैं आपका पर्सनल ट्रेनर हूँ। आदत, बॉडी, वर्कआउट या डाइट के बारे में पूछें।",
      noHabits: "कोई आदत नहीं मिली। पहले Workout, Sleep, Water, Diet जोड़ें।",
      bodyMissing: "सटीक सलाह के लिए पहले बॉडी मेट्रिक्स जोड़ें।",
      workout: `इंडियन जिम वर्कआउट:
• Push–Pull–Legs (4–5 दिन)
• पहले कंपाउंड एक्सरसाइज
• रोज़ 20 मिनट वॉक
• रविवार रिकवरी`,
      diet: `इंडियन डाइट प्लान:
• नाश्ता: अंडे / ओट्स / पोहा
• दोपहर: रोटी + दाल + सब्ज़ी
• स्नैक्स: फल / चना
• रात: हल्की रोटी + सब्ज़ी`,
      weeklyLow: "इस हफ्ते की नियमितता कम है। लक्ष्य छोटे रखें।",
      weeklyMid: "अच्छी प्रगति। थोड़ी और नियमितता बढ़ाएँ।",
      weeklyHigh: "बहुत बढ़िया हफ्ता। इसी तरह जारी रखें।"
    },
    mr: {
      greet: "👋 मी तुमचा पर्सनल ट्रेनर आहे. सवयी, शरीर, वर्कआउट किंवा डाएट बद्दल विचारा.",
      noHabits: "कोणत्याही सवयी नाहीत. Workout, Sleep, Water, Diet आधी जोडा.",
      bodyMissing: "योग्य सल्ल्यासाठी बॉडी मेट्रिक्स जोडा.",
      workout: `इंडियन जिम वर्कआउट:
• Push–Pull–Legs (4–5 दिवस)
• आधी कंपाउंड एक्सरसाइज
• दररोज 20 मिनिट चालणे
• रविवार रिकव्हरी`,
      diet: `इंडियन डाएट प्लान:
• नाश्ता: अंडी / ओट्स / पोहे
• दुपार: पोळी + डाळ + भाजी
• स्नॅक्स: फळे / चणे
• रात्री: हलकी पोळी + भाजी`,
      weeklyLow: "या आठवड्यात सातत्य कमी आहे. उद्दिष्टे लहान ठेवा.",
      weeklyMid: "चांगली प्रगती. थोडे अधिक सातत्य ठेवा.",
      weeklyHigh: "उत्तम आठवडा. असेच चालू ठेवा."
    }
  };

  function currentLang() {
    return langSelect ? langSelect.value : "en";
  }

  /* ================= VOICE ================= */
  if (localStorage.getItem("voiceEnabled") === "false") {
    voiceToggle.checked = false;
  }

  voiceToggle.addEventListener("change", () => {
    localStorage.setItem("voiceEnabled", voiceToggle.checked);
  });

  function speak(text) {
    if (!voiceToggle.checked) return;

    speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);

    // Marathi fallback → Hindi voice
    if (currentLang() === "mr" || currentLang() === "hi") {
      u.lang = "hi-IN";
    } else {
      u.lang = "en-IN";
    }

    u.rate = 1;
    u.pitch = 1;
    speechSynthesis.speak(u);
  }

  /* ================= CHAT ================= */
  function addMessage(text, type = "bot", save = true) {
    const div = document.createElement("div");
    div.className = `chat-message ${type}`;
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (type === "bot") speak(text);

    if (save) {
      history.push({ text, type });
      localStorage.setItem(chatKey, JSON.stringify(history));
    }
  }

  history.forEach(m => addMessage(m.text, m.type, false));
  if (!history.length) addMessage(TEXT[currentLang()].greet);

  /* ================= ANALYSIS ================= */
  function analyzeHabits() {
    if (!habits.length) return TEXT[currentLang()].noHabits;

    let stats = {};
    Object.keys(checks).forEach(k => {
      const idx = parseInt(k.split("-").pop());
      const h = habits[idx];
      if (!h) return;
      stats[h] = stats[h] || { t: 0, d: 0 };
      stats[h].t++;
      if (checks[k]) stats[h].d++;
    });

    let weak = null, low = 100;
    Object.keys(stats).forEach(h => {
      const p = (stats[h].d / stats[h].t) * 100;
      if (p < low) {
        low = p;
        weak = h;
      }
    });

    return `${weak} habit is weakest (${Math.round(low)}%). Improve consistency.`;
  }

  function analyzeBody() {
    if (!metrics) return TEXT[currentLang()].bodyMissing;

    return `BMI: ${metrics.bmi.toFixed(1)} (${metrics.category})
Calories: ${Math.round(metrics.calories)}`;
  }

  function weeklyAdvice() {
    let total = 0, done = 0;
    Object.values(checks).forEach(v => {
      total++;
      if (v) done++;
    });

    const pct = total ? (done / total) * 100 : 0;

    if (pct < 40) return TEXT[currentLang()].weeklyLow;
    if (pct < 70) return TEXT[currentLang()].weeklyMid;
    return TEXT[currentLang()].weeklyHigh;
  }

  function respond(q) {
    if (q.includes("habit")) return analyzeHabits();
    if (q.includes("body") || q.includes("bmi")) return analyzeBody();
    if (q.includes("workout")) return TEXT[currentLang()].workout;
    if (q.includes("diet")) return TEXT[currentLang()].diet;
    if (q.includes("week")) return weeklyAdvice();
    return TEXT[currentLang()].greet;
  }

  /* ================= EVENTS ================= */
  sendBtn.addEventListener("click", () => {
    const q = input.value.trim();
    if (!q) return;

    addMessage(q, "user");
    input.value = "";

    setTimeout(() => addMessage(respond(q.toLowerCase())), 300);
  });

  quickBtns.forEach(b => {
    b.addEventListener("click", () => {
      addMessage(b.textContent, "user");
      setTimeout(() => addMessage(respond(b.dataset.q)), 300);
    });
  });

  /* ================= PDF DOWNLOAD ================= */
  if (reportBtn) {
    reportBtn.addEventListener("click", () => {
      let total = 0, done = 0;
      Object.values(checks).forEach(v => {
        total++;
        if (v) done++;
      });

      const consistency = total ? Math.round((done / total) * 100) : 0;

      let content = `Buddy Balance – Weekly Fitness Report

Consistency: ${consistency}%

`;

      if (metrics) {
        content += `BMI: ${metrics.bmi.toFixed(1)}
Category: ${metrics.category}
Calories: ${Math.round(metrics.calories)}

`;
      }

      content += `Trainer Advice:
${weeklyAdvice()}
`;

      const pdf =
`%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 44 >>
stream
BT /F1 12 Tf 72 720 Td (${content.replace(/\n/g, "\\n")}) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref 0 6
0000000000 65535 f
trailer << /Size 6 /Root 1 0 R >>
startxref 420
%%EOF`;

      const blob = new Blob([pdf], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Weekly_Report.pdf";
      link.click();
    });
  }
});

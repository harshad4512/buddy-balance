/*********************************************************
 * AUTH.JS — Buddy Balance
 * Username + Password Authentication (Exam Safe)
 * Includes: Login, Signup, Password Reset, and Strength Meter
 *********************************************************/

/* ================= ELEMENTS ================= */
// Forms
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const forgotForm = document.getElementById("forgotForm");

// Navigation Links/Buttons
const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");
const forgotPassword = document.getElementById("forgotPassword");
const backToLogin = document.getElementById("backToLogin");

// Password Visibility Toggles
const togglePassButtons = document.querySelectorAll(".toggle-password");

// Strength Meter Elements
const newPassInput = document.getElementById("newPassword");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");

/* ================= STORAGE INITIALIZATION ================= */
let users = JSON.parse(localStorage.getItem("users")) || {};

/** Saves current users object to LocalStorage */
function saveUsers() {
    localStorage.setItem("users", JSON.stringify(users));
}

/** * Safely toggles between forms 
 * Prevents "Uncaught TypeError" if a form is missing from HTML
 */
function showForm(targetForm) {
    const allForms = [loginForm, signupForm, forgotForm];
    
    allForms.forEach(f => {
        if (f) f.style.display = "none";
    });

    if (targetForm) {
        targetForm.style.display = "block";
        targetForm.classList.add("animate");
    }
}

/* ================= PASSWORD VISIBILITY ================= */
togglePassButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const input = btn.previousElementSibling;
        if (input) {
            input.type = input.type === "password" ? "text" : "password";
            btn.textContent = input.type === "password" ? "👁" : "🙈";
        }
    });
});

/* ================= PASSWORD STRENGTH METER ================= */
if (newPassInput && strengthBar) {
    newPassInput.addEventListener("input", () => {
        const val = newPassInput.value;
        let score = 0;

        if (val.length > 5) score++;           // Length
        if (/[A-Z]/.test(val)) score++;        // Uppercase
        if (/[0-9]/.test(val)) score++;        // Numbers
        if (/[^A-Za-z0-9]/.test(val)) score++; // Special Characters

        const colors = ["#ff4d4d", "#ffa64d", "#99ff33", "#2eb82e"];
        const labels = ["Too Weak", "Weak", "Good", "Strong"];

        if (val.length === 0) {
            strengthBar.style.width = "0%";
            strengthText.textContent = "";
        } else {
            strengthBar.style.width = (score + 1) * 25 + "%";
            strengthBar.style.backgroundColor = colors[score] || colors[0];
            strengthText.textContent = labels[score] || labels[0];
            strengthText.style.color = colors[score] || colors[0];
        }
    });
}

/* ================= LOGIN LOGIC ================= */
if (loginForm) {
    loginForm.addEventListener("submit", e => {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        if (!users[username]) {
            alert("User not found");
            return;
        }

        if (users[username].password !== password) {
            alert("Incorrect password");
            return;
        }

        // Set Auth State
        localStorage.setItem("authUser", username);
        loginForm.classList.add("success");

        setTimeout(() => {
            window.location.href = "habits.html";
        }, 600);
    });
}

/* ================= SIGNUP LOGIC ================= */
if (signupForm) {
    signupForm.addEventListener("submit", e => {
        e.preventDefault();

        const username = document.getElementById("newUsername").value.trim();
        const password = document.getElementById("newPassword").value;

        if (users[username]) {
            alert("Username already exists");
            return;
        }

        // Initialize User Object
        users[username] = {
            password: password,
            habits: [],
            checks: {},
            metrics: null,
            profileImg: null
        };

        saveUsers();
        signupForm.classList.add("success");

        setTimeout(() => {
            showForm(loginForm);
            signupForm.reset(); // Clear signup inputs
            if (strengthBar) strengthBar.style.width = "0%";
        }, 700);
    });
}

/* ================= FORGOT PASSWORD LOGIC ================= */
if (forgotForm) {
    forgotForm.addEventListener("submit", e => {
        e.preventDefault();

        const username = document.getElementById("resetUsername").value.trim();
        const newPass = document.getElementById("resetPassword").value;

        if (!users[username]) {
            alert("User not found");
            return;
        }

        users[username].password = newPass;
        saveUsers();

        alert("Password reset successful!");
        showForm(loginForm);
        forgotForm.reset();
    });
}

/* ================= NAVIGATION CLICKS ================= */
const linkActions = [
    { btn: showSignup, target: signupForm },
    { btn: showLogin, target: loginForm },
    { btn: forgotPassword, target: forgotForm },
    { btn: backToLogin, target: loginForm }
];

linkActions.forEach(action => {
    if (action.btn) {
        action.btn.addEventListener("click", (e) => {
            e.preventDefault();
            showForm(action.target);
        });
    }
});

/* ================= INITIALIZATION ================= */
// Automatically show the login form when the page loads
if (loginForm) {
    showForm(loginForm);
}
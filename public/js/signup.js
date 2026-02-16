const API_BASE_URL = "https://q-by-q.vercel.app/api";
document.addEventListener("DOMContentLoaded", () => {
    const signupBtn = document.getElementById("signupBtn");
    const messageEl = document.getElementById("signupMessage");

    if (!signupBtn) {
        console.error("Critical Error: 'signupBtn' not found in HTML. Check your IDs!");
        return;
    }

    signupBtn.addEventListener("click", async (e) => {
        e.preventDefault(); 

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;

        // Reset UI
        messageEl.textContent = "";
        messageEl.className = "auth-message"; 
        messageEl.style.display = "none";

        if (!name || !email || !password) {
            showError("All fields are required!");
            return;
        }

        // Visual Feedback
        const originalText = signupBtn.textContent;
        signupBtn.textContent = "Creating Account...";
        signupBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();

            if (res.ok) {
                messageEl.textContent = "Account created! Redirecting...";
                messageEl.style.color = "var(--teal)";
                messageEl.style.display = "block";
                
                if (data.token) localStorage.setItem("token", data.token);
                
                setTimeout(() => window.location.href = "dashboard.html", 1500);
            } else {
                // FIX: Changed data.message to data.msg to match your backend auth.js
                showError(data.msg || "Signup failed");
            }
        } catch (err) {
            showError("Server error. Is your backend running on port 5000?");
            console.error("Fetch error:", err);
        } finally {
            signupBtn.textContent = originalText;
            signupBtn.disabled = false;
        }
    });

    function showError(msg) {
        messageEl.textContent = msg;
        messageEl.style.display = "block";
        messageEl.classList.add("auth-error"); 
        messageEl.style.color = "red"; // Added explicitly to ensure it's visible
    }
});
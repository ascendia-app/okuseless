/* =========================================
   DEBUG ENABLED - login.js (FIXED)
   ========================================= */
const API_BASE_URL = "https://q-by-q.vercel.app/api";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const errorBanner = document.getElementById("errorMessage");
    const submitBtn = loginForm?.querySelector("button[type='submit']");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // UI Reset
        if (errorBanner) errorBanner.style.display = "none";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Checking Server...";
        }

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            console.log("1. Sending login request for:", email);
            
       const res = await fetch(`${API_BASE_URL}/auth/login`, { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
});

// ADD THIS CHECK:
const contentType = res.headers.get("content-type");
if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text(); // Get the HTML to see what the error is
    console.error("Server returned HTML instead of JSON:", text);
    throw new Error("Server Error: API route not found or crashed.");
}

const data = await res.json();
            console.log("2. Server Response Data:", data);

            // Check every possible place the token could be
            const receivedToken = data.token || data.accessToken || (data.data && data.data.token);

            if (res.ok && receivedToken) {
                console.log("3. Token found! Length:", receivedToken.length);
                
                /** * CRITICAL FIX: 
                 * Do NOT use localStorage.clear()! It deletes your 'savedQuestions' library.
                 * Only remove the old token to ensure a fresh session.
                 */
                localStorage.removeItem("token"); 
                localStorage.setItem("token", receivedToken);
                
                // Verify storage immediately
                const check = localStorage.getItem("token");
                if (check) {
                    console.log("4. Successfully wrote to LocalStorage.");
                    submitBtn.style.backgroundColor = "#28a745";
                    submitBtn.textContent = "Redirecting...";
                    
                    setTimeout(() => {
                        window.location.href = "index.html"; 
                    }, 800);
                } else {
                    throw new Error("Browser blocked LocalStorage write.");
                }
            } else {
                console.error("Login failed. Response was:", data);
                showError(data.msg || "Invalid credentials or no token received.");
                resetButton();
            }
        } catch (err) {
            console.error("Critical Error:", err);
            showError("Network error or storage blocked. See console (F12).");
            resetButton();
        }
    });

    function resetButton() {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Sign In";
        }
    }

    function showError(message) {
        if (errorBanner) {
            errorBanner.textContent = message;
            errorBanner.style.display = "block";
        }
    }
});
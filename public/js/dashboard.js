/* =========================================
   1. GLOBAL CONFIG & DATA
   ========================================= */
const API_BASE_URL = "https://q-by-q.vercel.app/api";

const ALL_AVAILABLE_SUBJECTS = [
    { id: 'p3', name: 'Pure Mathematics 3' },
    { id: 's1', name: 'Probability & Statistics 1' },
    { id: 'psy-core', name: 'Psychology: Core Studies' },
    { id: 'eco-a2', name: 'A2 Economics' }
];
/* =========================================
   2. INITIALIZATION (On Load)
   ========================================= */
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Run Auth Check
    await checkAuth();

    // 2. Sidebar Persistence
    const sidebar = document.getElementById("sidebar");
    const toggleSidebar = document.getElementById("toggleSidebar");
    if (localStorage.getItem("sidebarCollapsed") === "true") {
        sidebar?.classList.add("collapsed");
    }

    if (toggleSidebar) {
        toggleSidebar.onclick = () => {
            sidebar.classList.toggle("collapsed");
            localStorage.setItem("sidebarCollapsed", sidebar.classList.contains("collapsed"));
        };
    }

    // 3. Initialize Dashboard Data
    updateRecentActivity();
    renderSyllabusMastery();
    updateLifetimeTimer();
    setInterval(updateLifetimeTimer, 1000);

    // 4. Reset Progress Logic (TIME ONLY)
    const resetModal = document.getElementById("resetModal");
    const totalResetBtn = document.getElementById("totalResetBtn");
    const confirmResetBtn = document.getElementById("confirmReset");
    const cancelResetBtn = document.getElementById("cancelReset");

    if (totalResetBtn) {
        totalResetBtn.onclick = () => {
            // You might want to update the modal text here via JS if it says "Reset All"
            resetModal.style.display = 'flex';
        };
    }

    if (cancelResetBtn) cancelResetBtn.onclick = () => resetModal.style.display = 'none';

    if (confirmResetBtn) {
        confirmResetBtn.onclick = () => {
            // ONLY remove time-related data
            localStorage.removeItem("lifetimeStudySeconds");
            localStorage.removeItem("timerTime");

            // Do NOT remove savedQuestions or syllabus progress
            window.location.reload();
        };
    }
})
/* =========================================
   3. SYLLABUS MASTERY & SUBJECT MANAGER
   ========================================= */
function renderSyllabusMastery() {
    const container = document.getElementById('syllabusMasterySection');
    if (!container) return;

    container.innerHTML = '';
    let cardsHtml = '';

    const selectedIds = JSON.parse(localStorage.getItem('user_selected_subjects')) || ['p3', 's1'];
    const papersToShow = ALL_AVAILABLE_SUBJECTS.filter(paper => selectedIds.includes(paper.id));

    if (papersToShow.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94a3b8;">
                <i class="fas fa-book-open" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                <p>No subjects selected. Click "Manage Subjects" to add cards.</p>
            </div>`;
        return;
    }

    papersToShow.forEach(paper => {
        const savedData = JSON.parse(localStorage.getItem(`syllabus_${paper.id}_progress`) || "{}");
        const totalTopics = parseInt(localStorage.getItem(`syllabus_${paper.id}_total`)) || 0;
        const entries = Object.values(savedData);

        let percentage = 0;
        let barColor = '#ef4444';

        if (totalTopics > 0) {
            let totalScore = 0;
            entries.forEach(color => {
                if (color === 'green') totalScore += 100;
                else if (color === 'yellow') totalScore += 50;
                else if (color === 'red') totalScore += 10;
            });
            percentage = Math.round((totalScore / (totalTopics * 100)) * 100);
            barColor = percentage < 35 ? '#ef4444' : (percentage < 75 ? '#f59e0b' : '#22c55e');
        }

 cardsHtml += `
    <div class="syllabus-card">
        <div class="card-body">
            <div class="card-header">
                <span class="subject-name">${paper.name}</span>
            </div>
            <div class="progress-row">
                <div class="mastery-bar-container">
                    <div class="mastery-bar-fill" style="width: ${percentage}%; background: ${barColor};"></div>
                </div>
                <span class="mastery-percent" style="color: ${barColor}">${percentage}%</span>
            </div>
            <div class="card-footer-text">
                <span class="topic-count">${entries.length} of ${totalTopics || '?'} Topics Tracked</span>
            </div>
        </div>
        <button onclick="window.location.href='syllabus.html?paper=${paper.id}'" class="go-to-syllabus-btn">
            Go to Syllabus <i class="fas fa-arrow-right"></i>
        </button>
    </div>
        `;
    });
    container.innerHTML = cardsHtml;
}

function openSubjectManager() {
    const selectedIds = JSON.parse(localStorage.getItem('user_selected_subjects')) || ['p3', 's1'];
    const modalHtml = `
        <div id="subjectModal" class="subject-modal-overlay">
            <div class="subject-modal-card">
                <div class="modal-header">
                    <h3>Manage Dashboard</h3>
                    <button class="close-x" onclick="closeModal()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <div class="subject-checklist">
                    ${ALL_AVAILABLE_SUBJECTS.map(s => `
                        <label class="subject-checkbox-item">
                            <input type="checkbox" value="${s.id}" ${selectedIds.includes(s.id) ? 'checked' : ''}>
                            <span class="subject-label-text">${s.name}</span>
                        </label>
                    `).join('')}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="saveSelectedSubjects()">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function saveSelectedSubjects() {
    const checkboxes = document.querySelectorAll('#subjectModal input[type="checkbox"]');
    const selected = Array.from(checkboxes).filter(i => i.checked).map(i => i.value);
    localStorage.setItem('user_selected_subjects', JSON.stringify(selected));
    closeModal();
    renderSyllabusMastery();
}

function closeModal() {
    const modal = document.getElementById('subjectModal');
    if (modal) modal.remove();
}

/* =========================================
   4. AUTH FUNCTIONS
   ========================================= */
async function checkAuth() {
    let token = localStorage.getItem("token");
    if (token && (token.startsWith('"') || token.startsWith("'"))) {
        token = token.substring(1, token.length - 1);
    }

    if (!token || token === "null" || token === "undefined" || token.length < 20) {
        updateSidebarAuthBtn(false);
        window.location.href = "pleaselogin.html";
        return false;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/auth/verify`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        if (res.ok) {
            const data = await res.json();
            updateSidebarAuthBtn(true, data.email);
            return true;
        } else {
            updateSidebarAuthBtn(true);
            return true;
        }
    } catch (err) {
        updateSidebarAuthBtn(true);
        return true;
    }
}

function updateSidebarAuthBtn(isLoggedIn, email = "") {
    const authBtn = document.getElementById("authTopBtn");
    const userEmailDisplay = document.getElementById("userEmail");
    if (!authBtn) return;
    if (userEmailDisplay) userEmailDisplay.textContent = email;

    if (isLoggedIn) {
        authBtn.classList.add("logout-state");
        authBtn.classList.remove("login-state");
        authBtn.innerHTML = `<div class="icon-box"><i class="fas fa-sign-out-alt"></i></div><span class="nav-text">Logout</span>`;
    } else {
        authBtn.classList.add("login-state");
        authBtn.classList.remove("logout-state");
        authBtn.innerHTML = `<div class="icon-box"><i class="fas fa-sign-in-alt"></i></div><span class="nav-text">Login</span>`;
    }
}

/* =========================================
   5. RECENT ACTIVITY & TIMER
   ========================================= */
function updateRecentActivity() {
    const lastPaperData = localStorage.getItem("lastPaper");
    const lastPaperText = document.getElementById("lastPaperText");
    const resumeBtn = document.getElementById("resumeStudyBtn");

    if (lastPaperData && lastPaperData !== "undefined") {
        try {
            const lastPaper = JSON.parse(lastPaperData);
            const seasonNames = { "mayjun": "May/June", "octnov": "Oct/Nov", "febmar": "Feb/Mar" };
            const displaySeason = seasonNames[lastPaper.series] || "Series";
            const displayVariant = lastPaper.variant ? lastPaper.variant.replace('v', '') : "1";
            const questionNum = (lastPaper.currentIndex || 0) + 1;

            if (lastPaperText) {
                lastPaperText.innerHTML = `
                    <div class="activity-row-primary">
                        <span class="subject-span">${lastPaper.subject || "9709 Maths"}</span>
                        <span class="separator">/</span>
                        <span class="paper-span">${lastPaper.paperName || "Paper"}</span>
                    </div>
                    <div class="activity-row-secondary">
                        ${displaySeason} ${lastPaper.year} <span class="dot">•</span> Variant ${displayVariant}
                    </div>
                    <div class="activity-row-tertiary">Question ${questionNum}</div>
                `;
            }

            if (resumeBtn) {
                resumeBtn.style.display = "flex";
                resumeBtn.onclick = () => {
                    window.location.href = `index.html?paper=${lastPaper.paper}&year=${lastPaper.year}&series=${lastPaper.series}&variant=${lastPaper.variant}&q=${lastPaper.currentIndex}`;
                };
            }
        } catch (e) { console.error(e); }
    } else {
        if (lastPaperText) lastPaperText.innerHTML = `<div class="activity-row-secondary">No recent activity found.</div>`;
        if (resumeBtn) resumeBtn.style.display = "none";
    }
}

function updateLifetimeTimer() {
    const lifetimeSeconds = parseInt(localStorage.getItem("lifetimeStudySeconds") || 0);
    const timerRaw = localStorage.getItem("timerTime");
    let activeSeconds = 0;

    if (timerRaw && timerRaw !== "undefined") {
        try {
            const currentSession = JSON.parse(timerRaw);
            activeSeconds = (currentSession.h * 3600) + (currentSession.m * 60) + currentSession.s;
            if (currentSession.running && currentSession.startTime) {
                activeSeconds += Math.floor((Date.now() - currentSession.startTime) / 1000);
            }
        } catch (e) { }
    }

    const totalSeconds = lifetimeSeconds + activeSeconds;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const totalTimeDisplay = document.getElementById("totalTime");
    if (totalTimeDisplay) {
        totalTimeDisplay.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}

/* =========================================
   6. GLOBAL CLICK LISTENER
   ========================================= */
window.addEventListener('click', (e) => {
    const logoutModal = document.getElementById("logoutModal");
    const resetModal = document.getElementById("resetModal");
    const authBtn = e.target.closest('#authTopBtn');

    if (authBtn) {
        if (authBtn.classList.contains('logout-state')) {
            if (logoutModal) logoutModal.style.display = 'flex';
        } else {
            window.location.href = "pleaselogin.html";
        }
    }

    if (e.target.id === 'confirmLogout') {
        localStorage.removeItem("token");
        window.location.href = "pleaselogin.html";
    }

    if (e.target === logoutModal || e.target.id === 'cancelLogout') {
        if (logoutModal) logoutModal.style.display = 'none';
    }

    if (e.target === resetModal) {
        resetModal.style.display = 'none';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        ["logoutModal", "resetModal"].forEach(id => {
            const m = document.getElementById(id);
            if (m) m.style.display = "none";
        });
    }
});

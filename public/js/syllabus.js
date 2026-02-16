/* =========================================
   1. CONFIG & AUTHENTICATION
   ========================================= */
const API_BASE_URL = "https://q-by-q.vercel.app/api";

async function checkAuth() {
    let token = localStorage.getItem("token");
    if (token && (token.startsWith('"') || token.startsWith("'"))) {
        token = token.substring(1, token.length - 1);
    }
    if (!token || token === "null" || token === "undefined" || token.length < 20) {
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
            window.location.href = "pleaselogin.html";
            return false;
        }
    } catch (err) {
        updateSidebarAuthBtn(true);
        return true;
    }
}

function updateSidebarAuthBtn(isLoggedIn, email = "") {
    const authBtn = document.getElementById("authTopBtn");
    const userEmailEl = document.getElementById("userEmail");
    if (!authBtn) return;
    if (userEmailEl) userEmailEl.textContent = email;
    if (isLoggedIn) {
        authBtn.classList.add("logout-state");
        authBtn.innerHTML = `<div class="icon-box"><i class="fas fa-sign-out-alt"></i></div><span class="nav-text">Logout</span>`;
    }
}

/* =========================================
   2. TOGGLE LOGIC (Global Scope)
   ========================================= */
function toggleTopic(header) {
    const row = header.closest('.topic-row');
    const content = row.querySelector('.collapsible-content');
    const icon = row.querySelector('.toggle-icon');
    
    if (!row || !content) return;

    const isActive = row.classList.toggle('active');

    if (isActive) {
        content.style.maxHeight = content.scrollHeight + "px";
        if (icon) icon.style.transform = "rotate(180deg)";
    } else {
        content.style.maxHeight = "0px";
        if (icon) icon.style.transform = "rotate(0deg)";
    }
}

/* =========================================
   3. SYLLABUS FETCH & RENDER
   ========================================= */

// Updates paper dropdown options based on the selected subject (Math vs Psych)
function updatePaperOptions() {
    const subjectSelect = document.getElementById('subjectSelectSyllabus');
    const paperSelect = document.getElementById('paperSelectSyllabus');
    if (!subjectSelect || !paperSelect) return;

    const selectedSubject = subjectSelect.value;
    paperSelect.innerHTML = ''; 

    if (selectedSubject === "9709") {
        const papers = [
            { val: "p3", text: "Pure Mathematics 3" },
            { val: "s1", text: "Probability & Statistics 1" }
        ];
        papers.forEach(p => paperSelect.add(new Option(p.text, p.val)));
    } else if (selectedSubject === "9990") {
        const papers = [
            { val: "psy-core", text: "Psychology: Core Studies" },
        ];
        papers.forEach(p => paperSelect.add(new Option(p.text, p.val)));
    } 
    // --- ADD THIS SECTION ---
    else if (selectedSubject === "9708") {
        const papers = [
            { val: "eco-a2", text: "A2 Microeconomics" },
        ];
        papers.forEach(p => paperSelect.add(new Option(p.text, p.val)));
    }
}

async function fetchAndRenderSyllabus() {
    const paperSelect = document.getElementById('paperSelectSyllabus');
    const subjectSelect = document.getElementById('subjectSelectSyllabus');
    const container = document.getElementById('syllabusDisplayContainer');
    const loadBtn = document.getElementById('loadSyllabusBtn');
    
    if (!paperSelect || !container) return;

    const paper = paperSelect.value;
    if (!paper) return; // Prevent fetch if no paper is selected yet

    // Save current selection to local storage
    localStorage.setItem('selectedPaperSyllabus', paper);
    if(subjectSelect) localStorage.setItem('selectedSubjectSyllabus', subjectSelect.value);

    const icon = loadBtn ? loadBtn.querySelector('i') : null;
    if (icon) icon.classList.add('fa-spin');
    container.style.opacity = "0.5";

    try {
        const response = await fetch('topics.html');
        if (!response.ok) throw new Error('Could not find topics.html');
        
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const template = doc.getElementById(`template-${paper}`);

        if (template) {
            container.innerHTML = template.innerHTML;
            container.style.opacity = "1";
            loadSyllabusProgress(); 
            
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise().catch(err => console.log('MathJax Error:', err));
            }
        } else {
            container.innerHTML = `<div style="padding:40px; text-align:center;">Template for <b>${paper}</b> not found.</div>`;
        }
    } catch (err) {
        container.innerHTML = `<div style="padding:40px; color:red; text-align:center;">Error loading syllabus data.</div>`;
    } finally {
        if (icon) setTimeout(() => icon.classList.remove('fa-spin'), 600);
        container.style.opacity = "1";
    }
}

/* =========================================
   4. PROGRESS TRACKING & CONFIDENCE
   ========================================= */
function handleConfidenceClick(wrapper) {
    const group = wrapper.closest('.confidence-dots');
    const subItem = wrapper.closest('.subtopic-item');
    const dot = wrapper.querySelector('.dot');
    
    let color = 'red';
    if (dot.classList.contains('yellow')) color = 'yellow';
    if (dot.classList.contains('green')) color = 'green';

    const isAlreadyActive = wrapper.classList.contains('active');
    
    group.querySelectorAll('.dot-wrapper').forEach(w => w.classList.remove('active'));
    subItem.classList.remove('status-red', 'status-yellow', 'status-green');
    
    if (!isAlreadyActive) {
        wrapper.classList.add('active');
        subItem.classList.add(`status-${color}`);
    }
    
    saveSyllabusProgress();
    updateProgressBar();
}

function saveSyllabusProgress() {
    const paperSelect = document.getElementById('paperSelectSyllabus');
    if (!paperSelect) return;
    const paper = paperSelect.value;
    const subtopics = document.querySelectorAll('.subtopic-item');
    const progressData = {};
    
    subtopics.forEach((item, index) => {
        const activeWrapper = item.querySelector('.dot-wrapper.active');
        if (activeWrapper) {
            const dot = activeWrapper.querySelector('.dot');
            const color = dot.classList.contains('red') ? 'red' : (dot.classList.contains('yellow') ? 'yellow' : 'green');
            progressData[index] = color;
        }
    });

    localStorage.setItem(`syllabus_${paper}_progress`, JSON.stringify(progressData));
    localStorage.setItem(`syllabus_${paper}_total`, subtopics.length); 
}

function loadSyllabusProgress() {
    const paperSelect = document.getElementById('paperSelectSyllabus');
    if (!paperSelect) return;
    const paper = paperSelect.value;
    const saved = JSON.parse(localStorage.getItem(`syllabus_${paper}_progress`) || "{}");
    document.querySelectorAll('.subtopic-item').forEach((item, index) => {
        item.classList.remove('status-red', 'status-yellow', 'status-green');
        item.querySelectorAll('.dot-wrapper').forEach(w => w.classList.remove('active'));
        const color = saved[index];
        if (color) {
            item.classList.add(`status-${color}`);
            const targetDot = item.querySelector(`.dot.${color}`);
            if (targetDot) targetDot.parentElement.classList.add('active');
        }
    });
    updateProgressBar();
}

function updateProgressBar() {
    const subtopics = document.querySelectorAll('.subtopic-item');
    let totalScore = 0;
    if (subtopics.length === 0) return;

    subtopics.forEach(item => {
        const activeDot = item.querySelector('.dot-wrapper.active .dot');
        if (activeDot) {
            if (activeDot.classList.contains('green')) totalScore += 100;
            else if (activeDot.classList.contains('yellow')) totalScore += 50;
            else totalScore += 10;
        }
    });

    const percentage = Math.round((totalScore / (subtopics.length * 100)) * 100);
    const fill = document.getElementById('progressFill');
    const rateText = document.getElementById('completionRate');
    
    if (fill && rateText) {
        fill.style.width = percentage + '%';
        rateText.innerText = `${percentage}% Confidence`;
        fill.style.background = percentage < 35 ? '#ef4444' : (percentage < 75 ? '#f59e0b' : '#22c55e');
    }
}

/* =========================================
   5. INITIALIZATION & GLOBAL DELEGATION
   ========================================= */
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();

    const subjectSelect = document.getElementById('subjectSelectSyllabus');
    const paperSelect = document.getElementById('paperSelectSyllabus');
    
    // 1. Get Params from URL (?paper=psy-core) for Dashboard redirection
    const urlParams = new URLSearchParams(window.location.search);
    const paperFromUrl = urlParams.get('paper'); 
    
    // 2. Get saved states from LocalStorage for general visits
    const savedSubject = localStorage.getItem('selectedSubjectSyllabus');
    const savedPaper = localStorage.getItem('selectedPaperSyllabus');

    // 3. Determine Subject Priority
    // Force Psychology if the incoming paper ID starts with 'psy'
  // 3. Determine Subject Priority
   // 3. Determine Subject Priority
    let targetSubject = "9709"; // Default Math
    if (paperFromUrl && paperFromUrl.startsWith('psy')) {
        targetSubject = "9990";
    } 
    // --- ADD THIS CHECK ---
    else if (paperFromUrl && paperFromUrl.startsWith('eco')) {
        targetSubject = "9708";
    } 
    else if (savedSubject) {
        targetSubject = savedSubject;
    }
    // 4. Populate Paper Dropdown based on the subject
    updatePaperOptions();

    // 5. Select the specific Paper
    if (paperSelect) {
        let targetPaper = paperFromUrl || savedPaper;
        
        // Ensure the target paper exists in the newly built list
        const exists = Array.from(paperSelect.options).some(opt => opt.value === targetPaper);
        
        if (targetPaper && exists) {
            paperSelect.value = targetPaper;
        }
    }

    // 6. Fetch content and render
    fetchAndRenderSyllabus();

    // --- EVENT LISTENERS ---
    subjectSelect?.addEventListener('change', () => {
        updatePaperOptions();
        fetchAndRenderSyllabus(); 
    });

    paperSelect?.addEventListener('change', fetchAndRenderSyllabus);
    
    document.getElementById('loadSyllabusBtn')?.addEventListener('click', fetchAndRenderSyllabus);

    // Global Click Delegation
    document.addEventListener('click', (e) => {
        // Toggle Check
        const topicHeader = e.target.closest('.topic-header');
        if (topicHeader && !topicHeader.hasAttribute('onclick')) {
            toggleTopic(topicHeader);
            return;
        }

        // Confidence Dots
        const dotWrapper = e.target.closest('.dot-wrapper');
        if (dotWrapper) {
            handleConfidenceClick(dotWrapper);
            return;
        }

        // Sidebar
        const toggleSidebar = e.target.closest('#toggleSidebar');
        if (toggleSidebar) {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('collapsed');
            localStorage.setItem("sidebarCollapsed", sidebar.classList.contains("collapsed"));
            return;
        }

        // Auth & Logout
        const authBtn = e.target.closest('#authTopBtn');
        if (authBtn) {
            if (authBtn.classList.contains('logout-state')) {
                document.getElementById('logoutModal').style.display = 'flex';
            } else {
                window.location.href = "pleaselogin.html";
            }
            return;
        }

        if (e.target.id === 'confirmLogout') {
            localStorage.removeItem("token");
            window.location.href = "pleaselogin.html";
        }

        if (e.target.id === 'cancelLogout' || e.target.classList.contains('modal')) {
            const modal = document.getElementById('logoutModal');
            if (modal) modal.style.display = 'none';
        }
    });

    if (localStorage.getItem("sidebarCollapsed") === "true") {
        document.getElementById("sidebar")?.classList.add("collapsed");
    }
});

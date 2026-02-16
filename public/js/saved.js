/* =========================================
   1. AUTHENTICATION GUARD
   ========================================= */
async function verifyAccess() {
    let token = localStorage.getItem("token");
    if (token) token = token.replace(/^["'](.+)["']$/, '$1');

    const isLoggedIn = token && token !== "null" && token !== "undefined" && token.length > 20;

    if (!isLoggedIn) {
        window.location.href = "login.html"; 
        return;
    }
    initLibrary();
}

/**
 * 2. MAIN UI INITIALIZATION
 */
function initLibrary() {
    /* --- UI ELEMENTS --- */
    const savedGrid = document.getElementById('savedGrid');
    const emptyState = document.getElementById('emptyState');
    const previewModal = document.getElementById('previewModal');
    const modalImages = document.getElementById('modalImages');
    const modalMS = document.getElementById('modalMS');
    const modalTitle = document.getElementById('modalTitle');
    const toggleMSBtn = document.getElementById('toggleModalMS');
    const sidebar = document.getElementById("sidebar");
    const toggleSidebar = document.getElementById("toggleSidebar");
    const authBtn = document.getElementById("authTopBtn");
    const logoutModal = document.getElementById('logoutModal');
    const clearAllModal = document.getElementById('clearAllModal');
    const closeBtn = document.querySelector('.close-modal');

    /* --- DATA STATE --- */
    let savedQuestions = JSON.parse(localStorage.getItem('savedQuestions')) || [];

    /* --- INITIAL UI SETUP --- */
    if (localStorage.getItem("sidebarCollapsed") === "true") sidebar?.classList.add("collapsed");
    
    if (authBtn) {
        authBtn.innerHTML = `<div class="icon-box"><i class="fas fa-sign-out-alt"></i></div><span class="nav-text">Logout</span>`;
        authBtn.className = "auth-btn logout-state";
    }

    /* --- CORE FUNCTIONS --- */
    function checkEmpty() {
        if (savedQuestions.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (savedGrid) savedGrid.style.display = 'none';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            if (savedGrid) {
                savedGrid.style.display = 'grid';
                renderSavedQuestions();
            }
        }
    }

function renderSavedQuestions() {
    if (!savedGrid) return;
    savedGrid.innerHTML = '';
    
    savedQuestions.forEach((q, index) => {
        // 1. Identify Subject
        const subjectCode = q.subjectVal || (q.paperInfo ? q.paperInfo.split('_')[0] : "9708");

        // 2. Format Metadata (Standardized Format: 9708_s24_qp_12)
        const sMap = { 'febmar': 'm', 'mayjun': 's', 'octnov': 'w' };
        const sCode = sMap[q.season] || 's';
        const yCode = q.year ? q.year.toString().slice(-2) : '24';
        const pNum = (q.paper || '1').toString().replace(/[a-zA-Z]/g, ''); 
        const vNum = q.variant ? q.variant.toString().replace('v', '') : '1';
        
        // This creates the exact string format used in Economics for ALL subjects
        const standardizedMeta = `${subjectCode}_${sCode}${yCode}_qp_${pNum}${vNum}`;

        // 3. Subject Badge Logic
        let subjectLabel = "ECONOMICS 9708";
        let badgeColor = "#10b981"; 
        if (subjectCode === "9709") { subjectLabel = "MATH 9709"; badgeColor = "#0ea5e9"; }
        else if (subjectCode === "9990") { subjectLabel = "PSYCH 9990"; badgeColor = "#8b5cf6"; }

        // 4. UI Elements
        const isErrorNote = q.note && q.note.toLowerCase().includes("wrong");
        const noteClass = isErrorNote ? "note-tag error-note" : "note-tag manual-note";
        const displayNum = q.questionNum || q.number || (q.index !== undefined ? q.index + 1 : "?");

        const card = document.createElement('div');
        card.className = 'saved-card';
        card.innerHTML = `
            ${q.note ? `<div class="${noteClass}" title="${q.note}"><i class="fas fa-sticky-note"></i> ${q.note}</div>` : ''}

            <div class="card-main-content">
                <button class="btn-remove" onclick="removeSaved(${index})">
                    <i class="fas fa-trash"></i>
                </button>
                
                <div class="badge-container">
                    <span class="badge" style="background: ${badgeColor}15; color: ${badgeColor}">
                        ${subjectLabel}
                    </span>
                </div>

                <div class="q-title">
                    <h3 style="margin:0; font-weight:800; min-width:60px;">Q${displayNum}</h3>
                </div>

                <div class="paper-meta-text">
                    ${standardizedMeta}
                </div>
${q.userSelected || q.note?.includes("Your Answer:") ? `
    <div class="mcq-results" style="display: flex; flex-direction: column; gap: 4px; margin-top: 10px; font-size: 0.85rem;">
        <div style="display: flex; justify-content: space-between; background: #fee2e2; padding: 4px 8px; border-radius: 4px;">
            <span style="color: #b91c1c; font-weight: 600;">Your Answer: </span>
            <span style="font-weight: 800;">${q.userSelected || q.note.split('|')[0].replace('Your Answer: ', ' ') || 'None'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; background: #dcfce7; padding: 4px 8px; border-radius: 4px;">
            <span style="color: #15803d; font-weight: 600;">Correct Answer:</span>
            <span style="font-weight: 800;">${q.correctIs || (q.note.includes('|') ? q.note.split('|')[1].replace(' Correct Answer: ', '') : '')}</span>
        </div>
    </div>
` : ' ' }

                <div style="margin-left: auto;">
                    <button class="btn-view" onclick="openPreview(${index})">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="btn-action practice" onclick="jumpToPractice(${index})">
    <i class="fas fa-play"></i> <span>Practice</span>
</button>
                </div>
            </div>
        `;
        savedGrid.appendChild(card);
    });
}
/* =========================================
   PRACTICE REDIRECTION LOGIC
   ========================================= */

window.practiceQuestion = (lookupKey) => {
    console.log("Practice clicked for Key/ID:", lookupKey);
    const saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
    
    // 1. Find the question by ID, Timestamp, or Index
    let q = saved.find(item => item.id == lookupKey || item.timestamp == lookupKey);
    if (!q && saved[lookupKey]) q = saved[lookupKey]; // Index fallback

    if (!q) {
        console.error("Question not found in localStorage for:", lookupKey);
        return;
    }

    // 2. Set default values
    let subject = q.subjectVal || "9708";
    let year = q.year || "2025";
    let series = q.season || "mayjun";
    let paper = q.paper || "p1";
    let variant = q.variant || "1";
    let targetIndex = q.questionNum ? (parseInt(q.questionNum) - 1) : 0;

    // 3. Decode Economics Auto-Saved Data (e.g., "9708_s24_qp_12")
    if (q.paperInfo && typeof q.paperInfo === 'string') {
        try {
            const parts = q.paperInfo.split('_'); 
            if (parts.length >= 4) {
                subject = parts[0]; 
                
                // Decode Season/Year
                const sy = parts[1]; // e.g., "s24"
                const sMap = { 'm': 'febmar', 's': 'mayjun', 'w': 'octnov' };
                series = sMap[sy.charAt(0)] || "mayjun";
                year = "20" + sy.substring(1);

                // Decode Paper/Variant
                const pv = parts[3]; // e.g., "12"
                paper = "p" + pv.charAt(0);
                variant = pv.charAt(1);
            }
        } catch (err) {
            console.error("Error decoding paperInfo:", err);
        }
    }

    // 4. Final Sanitization (Ensuring 'p' for Econ)
    if (subject === "9708" && paper && !paper.toString().startsWith('p')) {
        paper = "p" + paper;
    }

    // 5. Build Params USING THE DECODED VARIABLES (Not 'q.property')
    const params = new URLSearchParams({
        subject: subject,
        paper: paper,
        year: year,
        series: series,
        variant: variant,
        q: targetIndex
    });

    const finalUrl = `index.html?${params.toString()}`;
    console.log("REDIRECTING TO:", finalUrl);
    
    window.location.href = finalUrl;
};

window.jumpToPractice = (index) => {
    const saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
    const q = saved[index];
    if (q) {
        // Send the most unique identifier available
        const lookupKey = q.id || q.timestamp || index;
        window.practiceQuestion(lookupKey);
    } else {
        console.error("No question found at index:", index);
    }
};


window.openPreview = async (index) => {
    const q = savedQuestions[index];
    if (!q) return;

    // 1. ROBUST NUMBER FALLBACK
    const displayNum = q.questionNum || q.number || (q.index !== undefined ? q.index + 1 : "??");
    modalTitle.textContent = `Review: Q${displayNum}`;

    // 2. IDENTIFY SUBJECT
    const isEcon = q.subjectVal === "9708" || (q.paperInfo && q.paperInfo.startsWith("9708"));

    // 3. HANDLE NOTE
    const modalNoteContainer = document.getElementById('modalNote');
    if (modalNoteContainer) {
        modalNoteContainer.style.display = q.note ? 'block' : 'none';
        if (q.note) {
            modalNoteContainer.innerHTML = `
                <div style="background: #fdf2f2; border-left: 5px solid #ef4444; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
                    <small style="color:#b91c1c; font-weight:bold; display:block; margin-bottom:4px; text-transform: uppercase;">Note</small>
                    <p style="margin:0; color:#1e293b; font-size:0.95rem;">${q.note}</p>
                </div>`;
        }
    }

    modalImages.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    modalMS.innerHTML = '';
    
    // 4. HIDE MARKSCHEME FOR ECON
    const msToggleContainer = document.querySelector('.ms-toggle-container'); // Or whatever your MS button/tab container is
    if (isEcon) {
        modalMS.style.display = 'none';
        if (msToggleContainer) msToggleContainer.style.display = 'none';
    } else {
        if (msToggleContainer) msToggleContainer.style.display = 'block';
    }

    // 5. PATH & IMAGE LOADING
    let qFileBase = "";
    if (q.img) {
        qFileBase = q.img.replace(/[a-z]?\.(png|PNG)$/i, '');
    } else {
        const sMap = { 'febmar': 'm', 'mayjun': 's', 'octnov': 'w' };
        const sCode = sMap[q.season] || 'm';
        const yCode = q.year ? q.year.toString().slice(-2) : '25';
        let pNum = (q.paper || '1').toString().replace(/[a-zA-Z]/g, ''); 
        let vNum = q.variant ? q.variant.toString().replace('v', '') : '1';
        qFileBase = `images/${q.subjectVal}_${sCode}${yCode}_qp_${pNum}${vNum}_q${displayNum}`;
    }

    const parts = ["", "a", "b", "c", "d"];
    let foundAnything = false;

    for (const char of parts) {
        const fullPath = `${qFileBase}${char}.PNG`;
        try {
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    if (!foundAnything) { modalImages.innerHTML = ''; foundAnything = true; }
                    const qImg = document.createElement('img');
                    qImg.src = img.src;
                    qImg.className = "preview-img";
                    qImg.style.width = "100%";
                    modalImages.appendChild(qImg);

                    // Load MS ONLY if NOT Econ
                    if (!isEcon) {
                        const msPath = fullPath.replace('_qp_', '_ms_');
                        const mImg = new Image();
                        mImg.onload = () => {
                            const msDisplay = document.createElement('img');
                            msDisplay.src = mImg.src;
                            msDisplay.className = "preview-ms-img";
                            msDisplay.style.width = "100%";
                            modalMS.appendChild(msDisplay);
                        };
                        mImg.src = msPath;
                    }
                    resolve();
                };
                img.onerror = () => {
                    const lowImg = new Image();
                    lowImg.onload = () => {
                        if (!foundAnything) { modalImages.innerHTML = ''; foundAnything = true; }
                        modalImages.appendChild(lowImg);
                        resolve();
                    };
                    lowImg.onerror = reject;
                    lowImg.src = fullPath.toLowerCase();
                };
                img.src = fullPath;
            });
        } catch (e) { /* Part not found */ }
    }

    if (!foundAnything) {
        modalImages.innerHTML = `<div class="error" style="padding:20px; color:#ef4444;">Image Not Found: ${qFileBase}.PNG</div>`;
    }

    previewModal.style.display = "block";
};
// Simplified Toggle - Place this inside initLibrary
if (toggleMSBtn) {
    toggleMSBtn.onclick = (e) => {
        e.preventDefault();
        const isHidden = modalMS.style.display === 'none';
        modalMS.style.display = isHidden ? 'block' : 'none';
        toggleMSBtn.textContent = isHidden ? 'Hide Mark Scheme' : 'Show Mark Scheme';
    };
}
    /* --- UI EVENT LISTENERS --- */

    // Sidebar Toggle
    if (toggleSidebar) {
        toggleSidebar.onclick = () => {
            sidebar.classList.toggle("collapsed");
            localStorage.setItem("sidebarCollapsed", sidebar.classList.contains("collapsed"));
        };
    }

    // FIX: Flickering Mark Scheme Toggle
    if (toggleMSBtn) {
        toggleMSBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent event bubbling
            const isHidden = modalMS.style.display === 'none';
            modalMS.style.display = isHidden ? 'block' : 'none';
            toggleMSBtn.textContent = isHidden ? 'Hide Mark Scheme' : 'Show Mark Scheme';
        };
    }

    // Modal Close Button
    if (closeBtn) {
        closeBtn.onclick = () => { previewModal.style.display = "none"; };
    }

    // Clear All Questions
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.onclick = () => { if(savedQuestions.length > 0) clearAllModal.style.display = 'flex'; };
    }

    document.getElementById('confirmClearBtn').onclick = () => {
        savedQuestions = [];
        localStorage.setItem('savedQuestions', "[]");
        clearAllModal.style.display = 'none';
        checkEmpty();
    };

    // Logout
    if (authBtn) authBtn.onclick = () => { logoutModal.style.display = 'flex'; };
    document.getElementById('confirmLogout').onclick = () => {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    };

    // Click outside backdrop to close
    window.onclick = (e) => {
        if (e.target === previewModal) previewModal.style.display = "none";
        if (e.target === logoutModal) logoutModal.style.display = "none";
        if (e.target === clearAllModal) clearAllModal.style.display = "none";
    };

    // Escape Key to close everything
    document.onkeydown = (e) => {
        if (e.key === "Escape") {
            previewModal.style.display = "none";
            logoutModal.style.display = "none";
            clearAllModal.style.display = "none";
        }
    };

    // Initialize the grid
    checkEmpty();
}

// 3. START THE SEQUENCE
document.addEventListener("DOMContentLoaded", verifyAccess);

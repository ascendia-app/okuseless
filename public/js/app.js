let questions = [];
let currentIndex = 0;
const originalBtnHTML = `<i class="fas fa-sync-alt"></i> Load Paper`;
let userAnswers = [];
window.userAnswers = {};

let paperMarks = {};

window.saveMCQAnswer = (letter) => {
    userAnswers[currentIndex] = letter;
    renderUI(); // Re-run renderUI to update the button colors
};
window.finishEconomicsPaper = () => {
    // 1. Generate the Key ID (e.g., 9708_s24_31)
    const yCode = (seasonSelect.value === "febmar" ? "m" : seasonSelect.value === "mayjun" ? "s" : "w") + yearSelect.value.slice(-2);
    const pCode = paperSelect.value.replace('p', '') + variantSelect.value;
    const keyID = `${subjectSelect.value}_${yCode}_${pCode}`;

    // 2. Fetch keys from your keys.html database
    const mcqDatabase = JSON.parse(localStorage.getItem('mcqDatabase')) || {};
    const correctKey = mcqDatabase[keyID];

    if (!correctKey) {
        alert(`Error: Answer key for ${keyID} not found. Please add it in keys.html first!`);
        return;
    }

    let score = 0;
    const mistakesToSave = [];
    const currentSaved = JSON.parse(localStorage.getItem('savedQuestions')) || [];

    // 3. Loop through questions and grade
    questions.forEach((q, index) => {
        const userAns = userAnswers[index];
        const correctAns = correctKey[index];

        if (userAns === correctAns) {
            score++;
        } else {
            // AUTO-SAVE LOGIC
            const uniqueId = `${subjectSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}_q${q.number}`;
            
            // Only add if it's not already in the saved list
            if (!currentSaved.some(sq => sq.id === uniqueId)) {
              mistakesToSave.push({
    id: uniqueId,
    subjectVal: subjectSelect.value,
    paper: paperSelect.value,
    year: yearSelect.value,
    season: seasonSelect.value,
    variant: variantSelect.value,
    questionNum: q.number,
    // ADDED LABELS HERE:
    note: `Your Answer: ${userAns || 'None'} | Correct Answer: ${correctAns}`
});
            }
        }
    });

    // 4. Update LocalStorage
    localStorage.setItem('savedQuestions', JSON.stringify([...currentSaved, ...mistakesToSave]));

    // 5. Save Score to Grades
    const gradeData = JSON.parse(localStorage.getItem('grades')) || [];
    gradeData.push({
        subject: "Economics 9708",
        details: `${yearSelect.value} ${seasonSelect.value} P3 (${variantSelect.value})`,
        score: score,
        total: questions.length,
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem('grades', JSON.stringify(gradeData));

    // 6. Final Alert and Redirect
    alert(`Done! Score: ${score}/${questions.length}. ${mistakesToSave.length} mistakes saved to your revision list.`);
    window.location.href = "grades.html";
};

// 2. Find your function that displays the question (e.g., showQuestion or loadQuestion)
function updateQuestionUI(index) {
    const questionTitle = document.getElementById('question-number');
    
    // Get marks for this Q from our memory object
    const savedScore = paperMarks[index]?.got || "";
    const savedMax = paperMarks[index]?.max || "";

    // Inject the title AND the boxes together
    questionTitle.innerHTML = `
        <span>Question ${index}</span>
        <div style="display: inline-flex; align-items: center; gap: 8px; margin-left: 20px;">
            <input type="number" value="${savedScore}" placeholder="Score" 
                oninput="updateMark(${index}, 'got', this.value)" 
                style="width: 50px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;">
            <span style="color: #999;">/</span>
            <input type="number" value="${savedMax}" placeholder="Max" 
                oninput="updateMark(${index}, 'max', this.value)" 
                style="width: 50px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;">
        </div>
    `;
}

// 3. Add this helper function below it
function updateMark(index, type, input) {
    const val = parseInt(input.value) || 0;
    const qNum = currentPaper.questions[index].number;

    if (!paperMarks[qNum]) {
        paperMarks[qNum] = { got: 0, max: 0 };
    }

    paperMarks[qNum][type] = val;

    // Visual feedback: Change color of the button in the sidebar grid
    const sidebarBtn = document.querySelector(`[data-qnum="${qNum}"]`);
    if (sidebarBtn) {
        if (paperMarks[qNum].got > 0 || paperMarks[qNum].max > 0) {
            sidebarBtn.classList.add('marked');
        } else {
            sidebarBtn.classList.remove('marked');
        }
    }
}
/* =========================================
   1. AUTHENTICATION & GLOBAL STATE
   ========================================= */
const API_BASE_URL = "https://q-by-q.vercel.app/api"; 
const urlParams = new URLSearchParams(window.location.search);

// Global State


/* =========================================
   2. URL PARAMETER LISTENER & SYNC
   ========================================= */
const urlSubject = urlParams.get('subject');
const urlPaper = urlParams.get('paper');
const urlYear = urlParams.get('year');
const urlSeries = urlParams.get('series');
const urlVariant = urlParams.get('variant');
const urlQIndex = urlParams.get('q');

if (urlSubject) {
    const subjectSelect = document.getElementById('subjectSelect');
    if (subjectSelect) {
        subjectSelect.value = urlSubject;
        // Trigger a change event if your app uses it to rebuild paper options
        subjectSelect.dispatchEvent(new Event('change'));
    }

    // 1. Set Year, Series, Variant immediately
    if (urlYear) document.getElementById('yearSelect').value = urlYear;
    if (urlSeries) document.getElementById('seasonSelect').value = urlSeries;
    if (urlVariant) document.getElementById('variantSelect').value = urlVariant;

    // 2. Specialized Paper Logic (Econ vs Math)
    const paperSelect = document.getElementById('paperSelect');
    if (paperSelect && urlPaper) {
        let formattedPaper = urlPaper;
        
        // Fix: If Econ and paper is just "3", turn it into "p3" for the dropdown
        if (urlSubject === "9708" && !formattedPaper.startsWith('p')) {
            formattedPaper = "p" + formattedPaper;
        } 
        // Fix: If Math and paper is just "3", turn it into "pure3" (adjust to your math values)
        else if (urlSubject === "9709" && !formattedPaper.startsWith('pure') && (formattedPaper === "1" || formattedPaper === "3")) {
            formattedPaper = "pure" + formattedPaper;
        }

        paperSelect.value = formattedPaper;
    }

    // 3. Handle the question jump
    if (urlQIndex !== null) {
        currentIndex = parseInt(urlQIndex);
    }
}

/**
 * Sanitizes token and verifies with backend.
 * Updates Sidebar UI based on auth status.
 */
async function checkAuth() {
    let token = localStorage.getItem("token");
    
    if (token && (token.startsWith('"') || token.startsWith("'"))) {
        token = token.substring(1, token.length - 1);
    }

    if (!token || token === "null" || token === "undefined" || token.length < 20) {
        updateSidebarAuthBtn(false);
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

        // We return true regardless of error to keep the app functional as requested
        updateSidebarAuthBtn(res.ok);
        return true;
    } catch (err) {
        updateSidebarAuthBtn(true); 
        return true; 
    }
}

function updateSidebarAuthBtn(isLoggedIn) {
    const authBtn = document.getElementById("authTopBtn");
    if (!authBtn) return;

    if (isLoggedIn) {
        authBtn.classList.add("logout-state");
        authBtn.classList.remove("login-state");
        authBtn.innerHTML = `
            <div class="icon-box"><i class="fas fa-sign-out-alt"></i></div>
            <span class="nav-text">Logout</span>
        `;
    } else {
        authBtn.classList.add("login-state");
        authBtn.classList.remove("logout-state");
        authBtn.innerHTML = `
            <div class="icon-box"><i class="fas fa-sign-in-alt"></i></div>
            <span class="nav-text">Login</span>
        `;
    }
}

/* =========================================
   2. MAIN APPLICATION LOGIC
   ========================================= */
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initial Setup
    await checkAuth();

    // UI Elements
    const questionNumberEl = document.getElementById("question-number");
    const questionContentEl = document.getElementById("question-content");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const questionList = document.getElementById("questionList");
    const markSchemeBtn = document.getElementById("markSchemeBtn");
    const markSchemeViewer = document.getElementById("markSchemeViewer");
    const saveBtn = document.getElementById('saveQuestionBtn');
    const loadPaperBtn = document.getElementById("loadPaperBtn");
    const notFoundModal = document.getElementById('notFoundModal');

    // Note Modal Elements
    const noteModal = document.getElementById('noteModal');
    const openNoteBtn = document.getElementById('openNoteModalBtn');
    const closeNoteBtn = document.getElementById('closeNoteModal');
    const saveWithNoteConfirmBtn = document.getElementById('saveWithNoteConfirmBtn');
    const noteTextArea = document.getElementById('noteTextArea');
    
    // Filter Selectors
    const subjectSelect = document.getElementById("subjectSelect");
    const paperSelect = document.getElementById("paperSelect");
    const yearSelect = document.getElementById("yearSelect");
    const seasonSelect = document.getElementById("seasonSelect");
    const variantSelect = document.getElementById("variantSelect");

    /* --- CORE LOGIC FUNCTIONS --- */

    /**
     * Checks if a note exists for the current question in localStorage
     * and displays it in the revision note box.
     */
    function updateQuestionNote() {
        const noteBox = document.getElementById('active-question-note');
        const noteText = document.getElementById('note-text-content');
        if (!noteBox || !noteText || questions.length === 0) {
            if (noteBox) noteBox.style.display = 'none';
            return;
        }

        const q = questions[currentIndex];
        const currentId = `${subjectSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}_q${q.number}`;
        
        const saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
        const matched = saved.find(sq => sq.id === currentId);

        if (matched && matched.note && matched.note.trim() !== "") {
            noteText.textContent = matched.note;
            noteBox.style.display = 'flex';
        } else {
            noteBox.style.display = 'none';
        }
    }

    function handleSaveAction(note = null) {
        let token = localStorage.getItem("token");
        if (!token || token.length < 20) {
            window.location.href = "pleaselogin.html";
            return;
        }
        if (questions.length === 0) return;
         const sCode = seasonSelect.value === "febmar" ? "m" : seasonSelect.value === "mayjun" ? "s" : "w";
    const yCode = yearSelect.value.toString().slice(-2);
    const vCode = variantSelect.value.toString().replace('v', '');
    const pType = paperSelect.value; // e.g., "p1" or "pure1"
    
    // This creates the "9708_s24_qp_11" style string
    const paperMetadata = `${subjectSelect.value}_${sCode}${yCode}_qp_${pType}${vCode}`;

        const q = questions[currentIndex];
        const currentId = `${subjectSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}_q${q.number}`;
        let currentSaved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
        const existingIndex = currentSaved.findIndex(sq => sq.id === currentId);
        
        if (existingIndex === -1 || note !== null) {
            const saveObj = { 
                id: currentId, 
                subjectVal: subjectSelect.value, 
                paper: paperSelect.value, 
                year: yearSelect.value, 
                season: seasonSelect.value, 
                variant: variantSelect.value, 
                questionNum: q.number,
                note: note !== null ? note : (currentSaved[existingIndex]?.note || ""),
                
                dateSaved: new Date().toISOString()
            };

            if (existingIndex > -1) {
                currentSaved[existingIndex] = saveObj;
            } else {
                currentSaved.push(saveObj);
            }
        } else {
            currentSaved.splice(existingIndex, 1);
        }
        
        localStorage.setItem('savedQuestions', JSON.stringify(currentSaved));
        updateSaveButtonState();
        updateQuestionNote(); // Update the note display immediately after saving
    }

    function saveState() {
        if (!subjectSelect.value || questions.length === 0) return;
        const paperDisplayName = paperSelect.options[paperSelect.selectedIndex]?.text ;
        const subjectDisplayName = subjectSelect.options[subjectSelect.selectedIndex]?.text;

        localStorage.setItem("lastPaper", JSON.stringify({
            subject: subjectDisplayName, 
            subjectCode: subjectSelect.value, 
            paper: paperSelect.value, 
            paperName: paperDisplayName, 
            year: yearSelect.value,
            series: seasonSelect.value,
            variant: "v" + variantSelect.value,
            currentIndex: currentIndex
        }));
    }

    function renderQuestion() {
        if (!questions[currentIndex]) return;
        const q = questions[currentIndex];
 const questionNumberEl = document.getElementById("question-number");
        if (questionNumberEl) questionNumberEl.textContent = `Question ${q.number}`;
const scoreInput = document.getElementById('currentQScore');
    const totalInput = document.getElementById('currentQTotal');
    const markContainer = document.getElementById('headerMarkEntry');

    if (markContainer) markContainer.style.display = 'flex';

    if (scoreInput && totalInput) {
        // Look up saved marks using the actual question number as the key
        const saved = paperMarks[q.number]; 

        if (saved) {
            // Set values: Use empty string for 0 to let the HTML placeholder take over
            scoreInput.value = (saved.got === 0 || saved.got === "") ? "" : saved.got;
            totalInput.value = (saved.max === 0 || saved.max === "") ? "" : saved.max;
            
            // Apply Dynamic Colors based on content
            const scoreColor = (scoreInput.value === "") ? '#94a3b8' : '#1e293b';
            const totalColor = (totalInput.value === "") ? '#94a3b8' : '#64748b';
            
            scoreInput.style.setProperty('color', scoreColor, 'important');
            scoreInput.style.setProperty('-webkit-text-fill-color', scoreColor, 'important');
            totalInput.style.setProperty('color', totalColor, 'important');
            totalInput.style.setProperty('-webkit-text-fill-color', totalColor, 'important');
        } else {
            // Reset to empty if no data exists for this question
            scoreInput.value = "";
            totalInput.value = "";
        }

        // IMPORTANT: Re-bind the oninput event so it always points to the CURRENT currentIndex
        scoreInput.oninput = function() { window.updateMark(currentIndex, 'got', this); };
        totalInput.oninput = function() { window.updateMark(currentIndex, 'max', this); };
    }

        if (markSchemeViewer && markSchemeBtn) {
            markSchemeViewer.style.display = "none";
            markSchemeViewer.classList.remove("open");
            markSchemeBtn.innerHTML = `<i class="fas fa-eye"></i> Show Mark Scheme`;
        }

        questionContentEl.innerHTML = "";
        q.images.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            img.className = "question-image";
            img.loading = "lazy";
            img.onerror = () => img.style.display = 'none';
            questionContentEl.appendChild(img);
        });

        markSchemeViewer.innerHTML = "";
        q.markImages.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            img.className = "markscheme-image";
            markSchemeViewer.appendChild(img);
        });

        updateSaveButtonState();
        updateQuestionNote(); // Show the note if it exists for this specific question
    }

    function renderUI() {
        renderQuestion();
        if (questionList) {
            questionList.innerHTML = "";
            questions.forEach((q, index) => {
                const btn = document.createElement("button");
                btn.textContent = q.number;
                btn.className = index === currentIndex ? "question-btn active" : "question-btn";
                btn.onclick = () => { currentIndex = index; renderUI(); };
                questionList.appendChild(btn);
            });
        }
        if (prevBtn) prevBtn.style.visibility = (currentIndex === 0) ? "hidden" : "visible";
        if (nextBtn) nextBtn.style.visibility = (currentIndex === questions.length - 1 || questions.length === 0) ? "hidden" : "visible";




const mcqWrapper = document.getElementById('mcq-options-wrapper');
    const mcqButtons = document.getElementById('mcq-buttons');
    const marksEntry = document.getElementById('headerMarkEntry');
    
    const isEconMCQ = subjectSelect.value === "9708" && paperSelect.value.includes("3");

    if (isEconMCQ) {
        if (mcqWrapper) mcqWrapper.style.display = "block";
        if (marksEntry) marksEntry.style.display = "none";

        if (mcqButtons) {
            mcqButtons.innerHTML = ['A', 'B', 'C', 'D'].map(letter => `
                <button onclick="saveMCQAnswer('${letter}')" 
                    style="
                        width: 55px; height: 55px; border-radius: 50%; border: 2px solid #10b981;
                        font-weight: 800; font-size: 1.2rem; cursor: pointer; transition: all 0.2s;
                        background: ${userAnswers[currentIndex] === letter ? '#10b981' : 'transparent'};
                        color: ${userAnswers[currentIndex] === letter ? '#fff' : '#10b981'};
                        box-shadow: ${userAnswers[currentIndex] === letter ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'};
                    ">
                    ${letter}
                </button>
            `).join('');
        }
    } else {
        if (mcqWrapper) mcqWrapper.style.display = "none";
        if (marksEntry) marksEntry.style.display = "flex";
    }
        saveState(); 
    }

    window.saveMCQAnswer = (letter) => {
    userAnswers[currentIndex] = letter;
    renderUI(); 
};

// Helper function to save answers
window.saveMCQAnswer = (letter) => {
    userAnswers[currentIndex] = letter;
    renderUI(); // Re-render to show selection
};

    function updateSaveButtonState() {
        if (!questions[currentIndex] || !saveBtn) return;
        const q = questions[currentIndex];
        const currentId = `${subjectSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}_q${q.number}`;
        const currentSaved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
        const isSaved = currentSaved.some(sq => sq.id === currentId);
        
        if (isSaved) {
            saveBtn.innerHTML = `<i class="fas fa-bookmark"></i> Saved`;
            saveBtn.style.color = "#eab308";
        } else {
            saveBtn.innerHTML = `<i class="far fa-bookmark"></i> Save`;
            saveBtn.style.color = "";
        }
    }

    /* --- UI EVENT HANDLERS --- */

    if (saveBtn) {
        saveBtn.onclick = () => handleSaveAction();
    }

 if (openNoteBtn) {
    openNoteBtn.onclick = (e) => {
        e.preventDefault();

        // --- AUTH CHECK ADDED HERE ---
        let token = localStorage.getItem("token");
        if (!token || token.length < 20) {
            window.location.href = "pleaselogin.html";
            return;
        }
        // -----------------------------

        if (questions.length === 0) return;
        
        const q = questions[currentIndex];
        const currentId = `${subjectSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}_q${q.number}`;
        const currentSaved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
        const existing = currentSaved.find(sq => sq.id === currentId);
        
        noteTextArea.value = existing?.note || "";
        noteModal.style.display = 'flex';
    };
}
    if (closeNoteBtn) {
        closeNoteBtn.onclick = () => noteModal.style.display = 'none';
    }

    if (saveWithNoteConfirmBtn) {
        saveWithNoteConfirmBtn.onclick = () => {
            handleSaveAction(noteTextArea.value.trim());
            noteModal.style.display = 'none';
        };
    }

if (loadPaperBtn) {
    loadPaperBtn.onclick = (e) => {
        if (e && e.isTrusted) {
            currentIndex = 0;
        }

        loadPaperBtn.disabled = true;
        loadPaperBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;

        // Start the process
        startLoadingProcess();
    };
}

// 3. THE CORE LOGIC (Defined globally so it's not "missing")
const startLoadingProcess = () => {
    const paperMap = { pure1: "1", pure3: "3", mechanics: "4", stats1: "5" };
    let paperVal = paperSelect.value.toLowerCase();

    if (subjectSelect.value === "9990" || subjectSelect.value === "9708") {
        paperVal = paperVal.replace('p', '');
    }

    const pCode = (paperMap[paperVal] || paperVal) + variantSelect.value;
    const yCode = (seasonSelect.value === "febmar" ? "m" : seasonSelect.value === "mayjun" ? "s" : "w") + yearSelect.value.slice(-2);

   const CLOUD_NAME = "daiieadws"; 
const TARGET_FOLDER = ""; // Keep this empty if images are in root
// We remove the trailing slash to prevent double slashes //
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto`;

    questions = [];
    let qNum = 1;

    // This is the function that was "missing"
    const loadNextQuestion = () => {
        let parts = []; let markParts = []; let partIndex = 0;
        const partLetters = "abcdefgh";

        const tryPart = () => {
            const char = partLetters[partIndex];
            const fileName = `${subjectSelect.value}_${yCode}_qp_${pCode}_q${qNum}${char}.png`;
            const msName = `${subjectSelect.value}_${yCode}_ms_${pCode}_q${qNum}${char}.png`;
            console.log("Checking for image at:", qPath); // ADD THIS LINE
            const qPath = `${BASE_URL}${fileName}`;
            const mPath = `${BASE_URL}${msName}`;

            const img = new Image();
            img.onload = () => {
                parts.push(qPath); markParts.push(mPath);
                partIndex++; 
                tryPart();
            };
            img.onerror = () => {
                if (partIndex === 0) tryNoPart();
                else finishQuestion();
            };
            img.src = qPath;
        };

        const tryNoPart = () => {
            const fileName = `${subjectSelect.value}_${yCode}_qp_${pCode}_q${qNum}.png`;
            const msName = `${subjectSelect.value}_${yCode}_ms_${pCode}_q${qNum}.png`;
            const qPath = `${BASE_URL}${fileName}`;
            const mPath = `${BASE_URL}${msName}`;

            const img = new Image();
            img.onload = () => {
                questions.push({ 
                    number: qNum, 
                    img: qPath, 
                    images: [qPath], 
                    markImages: [mPath] 
                });
                qNum++; 
                loadNextQuestion();
            };
            img.onerror = () => finalizeLoading();
            img.src = qPath;
        };

        const finishQuestion = () => {
            questions.push({ 
                number: qNum, 
                img: parts[0], 
                images: parts, 
                markImages: markParts 
            });
            qNum++; 
            loadNextQuestion();
        };

        tryPart();
    };

    loadNextQuestion();
};

const finalizeLoading = () => {
    loadPaperBtn.disabled = false;
    loadPaperBtn.innerHTML = originalBtnHTML;
    
    if (questions.length === 0) {
        if (typeof notFoundModal !== 'undefined' && notFoundModal) {
            notFoundModal.style.display = 'flex';
        } else {
            alert("No questions found for this paper selection.");
        }
        return; 
    }

    window.questions = questions; 
    // ... (rest of your finalizeLoading logic)
    if (typeof renderUI === "function") renderUI();
    console.log("Paper Loaded Successfully!");
};
    
    /* --- SESSION RECOVERY & INITIALIZATION --- */
    function applyVariantRule() {
        const selectedSeason = seasonSelect.value;
        const savedVal = variantSelect.value;
        variantSelect.innerHTML = "";
        if (selectedSeason === "febmar") {
            variantSelect.innerHTML = `<option value="2">v2</option>`;
            variantSelect.value = "2";
        } else {
            ["1", "2", "3"].forEach(v => {
                const opt = document.createElement("option");
                opt.value = v; opt.textContent = "v" + v;
                variantSelect.appendChild(opt);
            });
            if (["1", "2", "3"].includes(savedVal)) variantSelect.value = savedVal;
        }
    }

    if (seasonSelect) seasonSelect.addEventListener('change', applyVariantRule);
const resumeSubject = urlParams.get('subject') || "9709";
    const resumePaper = urlParams.get('paper');
    const resumeYear = urlParams.get('year');
    const lastSession = JSON.parse(localStorage.getItem("lastPaper"));

    if (resumePaper && resumeYear) {
     subjectSelect.value = resumeSubject;
    
    // 2. Trigger the paper dropdown update (important!)
    subjectSelect.dispatchEvent(new Event('change')); 
        paperSelect.value = resumePaper;
        yearSelect.value = resumeYear;
        seasonSelect.value = urlParams.get('series') || "mayjun";
        applyVariantRule();
        variantSelect.value = (urlParams.get('variant') || "v1").replace('v', '');
        currentIndex = parseInt(urlParams.get('q') || 0);
        loadPaperBtn.click();
    } else if (lastSession) {
        subjectSelect.value = lastSession.subjectCode || "9709";
        
   subjectSelect.dispatchEvent(new Event('change')); 
        paperSelect.value = lastSession.paper;
        yearSelect.value = lastSession.year;
        seasonSelect.value = lastSession.series;
        applyVariantRule();
        variantSelect.value = lastSession.variant.replace('v', '');
        currentIndex = lastSession.currentIndex || 0;
        loadPaperBtn.click();
    } else {
        applyVariantRule();
    }

    // Navigation Click Events
    if (prevBtn) prevBtn.onclick = () => { if (currentIndex > 0) { currentIndex--; renderUI(); } };
    if (nextBtn) nextBtn.onclick = () => { if (currentIndex < questions.length - 1) { currentIndex++; renderUI(); } };
    if (markSchemeBtn) {
        markSchemeBtn.onclick = () => {
            const isOpen = markSchemeViewer.classList.toggle("open");
            markSchemeViewer.style.display = isOpen ? "block" : "none";
            markSchemeBtn.innerHTML = isOpen ? `<i class="fas fa-eye-slash"></i> Hide Markscheme` : `<i class="fas fa-eye"></i> Show Markscheme`;
        };
    }

    // Sidebar Toggle
    const sidebar = document.getElementById("sidebar");
    const toggleSidebar = document.getElementById("toggleSidebar");
    if (localStorage.getItem("sidebarCollapsed") === "true") sidebar?.classList.add("collapsed");
    if (toggleSidebar) {
        toggleSidebar.onclick = () => {
            sidebar.classList.toggle("collapsed");
            localStorage.setItem("sidebarCollapsed", sidebar.classList.contains("collapsed"));
        };
    }
    // --- MF19 Split Screen Logic ---
// Inside DOMContentLoaded
const toggleMF19Btn = document.getElementById('toggleMF19Btn');
const mf19SplitWindow = document.getElementById('mf19SplitWindow');
const closeMF19Split = document.getElementById('closeMF19Split');

if (toggleMF19Btn) {
    toggleMF19Btn.onclick = () => {
        if (mf19SplitWindow.style.display === 'none' || mf19SplitWindow.style.display === '') {
            mf19SplitWindow.style.display = 'flex'; // Uses flex for the internal layout
            toggleMF19Btn.innerHTML = `<i class="fas fa-eye-slash"></i> Hide MF19`;
        } else {
            mf19SplitWindow.style.display = 'none';
            toggleMF19Btn.innerHTML = `<i class="fas fa-file-pdf"></i> Show MF19`;
        }
    };
}

// Close button inside the split window
if (closeMF19Split) {
    closeMF19Split.onclick = () => {
        mf19SplitWindow.style.display = 'none';
        if (toggleMF19Btn) {
            toggleMF19Btn.innerHTML = `<i class="fas fa-file-pdf"></i> Show MF19`;
            toggleMF19Btn.classList.remove('active-toggle');
        }
    };
}
});

/* =========================================
   3. GLOBAL CLICK LISTENER (Modals & Auth)
   ========================================= */
window.addEventListener('click', (e) => {
    const logoutModal = document.getElementById('logoutModal');
    const noteModal = document.getElementById('noteModal');
    const notFoundModal = document.getElementById('notFoundModal');
    const authBtn = e.target.closest('#authTopBtn');

    if (authBtn) {
        if (authBtn.classList.contains('logout-state')) {
            if (logoutModal) logoutModal.style.display = 'flex';
        } else {
            window.location.href = "pleaselogin.html";
        }
        return;
    }

    if (e.target === logoutModal || e.target.id === 'cancelLogout') {
        if (logoutModal) logoutModal.style.display = 'none';
    }

    if (e.target.id === 'confirmLogout') {
        localStorage.removeItem("token");
        localStorage.removeItem("lastPaper"); 
        window.location.href = "pleaselogin.html";
    }

    if (e.target === noteModal) {
        noteModal.style.display = 'none';
    }

    if (e.target === notFoundModal || e.target.id === 'closeNotFound') {
        if (notFoundModal) notFoundModal.style.display = 'none';
    }
});

/* =========================================
   4. TIMER LOGIC
   ========================================= */
const hoursEl = document.getElementById("hours"), 
      minutesEl = document.getElementById("minutes"), 
      secondsEl = document.getElementById("seconds"),
      startBtn = document.getElementById("startTimer"), 
      pauseBtn = document.getElementById("pauseTimer"), 
      resetBtn = document.getElementById("resetTimer");
let tInt = null;

function getTimerData() { 
    const data = localStorage.getItem("timerTime");
    return (data && data !== "undefined") ? JSON.parse(data) : { h: 0, m: 0, s: 0, startTime: null, running: false }; 
}

function updateTimerUI() {
    const data = getTimerData();
    let totalS = (data.h * 3600) + (data.m * 60) + data.s;
    if (data.running && data.startTime) {
        totalS += Math.floor((Date.now() - data.startTime) / 1000);
    }
    if(hoursEl) hoursEl.textContent = String(Math.floor(totalS / 3600)).padStart(2, "0");
    if(minutesEl) minutesEl.textContent = String(Math.floor((totalS % 3600) / 60)).padStart(2, "0");
    if(secondsEl) secondsEl.textContent = String(totalS % 60).padStart(2, "0");
}

if (startBtn) {
    startBtn.onclick = () => {
        let data = getTimerData(); 
        if (data.running) return;
        data.running = true; 
        data.startTime = Date.now();
        localStorage.setItem("timerTime", JSON.stringify(data));
        tInt = setInterval(updateTimerUI, 1000);
    };
}

if (pauseBtn) {
    pauseBtn.onclick = () => {
        let data = getTimerData(); 
        if (!data.running) return;
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        let totalS = (data.h * 3600) + (data.m * 60) + data.s + elapsed;
        localStorage.setItem("timerTime", JSON.stringify({ 
            h: Math.floor(totalS / 3600), m: Math.floor((totalS % 3600) / 60), s: totalS % 60, 
            running: false, startTime: null 
        }));
        clearInterval(tInt); 
        updateTimerUI();
    };
}

if (resetBtn) {
    resetBtn.onclick = () => { 
        const data = getTimerData();
        let currentS = (data.h * 3600) + (data.m * 60) + data.s;
        if (data.running && data.startTime) currentS += Math.floor((Date.now() - data.startTime) / 1000);
        const existingLifetime = parseInt(localStorage.getItem("lifetimeStudySeconds") || 0);
        localStorage.setItem("lifetimeStudySeconds", existingLifetime + currentS);
        clearInterval(tInt); 
        localStorage.removeItem("timerTime"); 
        updateTimerUI(); 
    };
}

if (getTimerData().running) tInt = setInterval(updateTimerUI, 1000);
updateTimerUI();
function makeElementDraggable(el, handle) {
    let currentX, currentY, initialX, initialY;
    let xOffset = 0, yOffset = 0;
    let active = false;
    const iframe = document.getElementById('mf19Iframe');

    handle.addEventListener("mousedown", dragStart);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("mousemove", drag);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === handle || handle.contains(e.target)) {
            active = true;
            el.style.transition = "none"; 
            if (iframe) iframe.style.pointerEvents = 'none'; 
        }
    }

    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        active = false;
        if (iframe) iframe.style.pointerEvents = 'auto';
    }

    function drag(e) {
        if (active) {
            e.preventDefault();

            // Calculate requested position
            let nextX = e.clientX - initialX;
            let nextY = e.clientY - initialY;

            // --- BOUNDARY CALCULATIONS ---
            const rect = el.getBoundingClientRect();
            
            // Get the static starting position of the element
            // We need this because translate3d moves relative to these coordinates
            const originalLeft = el.offsetLeft;
            const originalTop = el.offsetTop;

            // Calculate the limits for X (Left and Right)
            const minX = -originalLeft; 
            const maxX = window.innerWidth - originalLeft - rect.width;

            // Calculate the limits for Y (Top and Bottom)
            const minY = -originalTop;
            const maxY = window.innerHeight - originalTop - rect.height;

            // Clamp the values
            currentX = Math.max(minX, Math.min(nextX, maxX));
            currentY = Math.max(minY, Math.min(nextY, maxY));

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, el);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
}

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        document.getElementById('mf19Iframe').style.pointerEvents = 'auto';
    }

// Initialize dragging in your DOMContentLoaded block
document.addEventListener("DOMContentLoaded", () => {
    const mf19Window = document.getElementById("mf19SplitWindow");
    const mf19Handle = document.getElementById("mf19Handle");
    if (mf19Window && mf19Handle) {
        mf19Window.style.transform = `translate3d(0px, 0px, 0)`;
        makeElementDraggable(mf19Window, mf19Handle);
    }
});
function makeElementResizable(el) {
    const resizer = document.getElementById('mf19Resizer');
    const iframe = document.getElementById('mf19Iframe');
    
    resizer.addEventListener('mousedown', initResize);

    function initResize(e) {
        e.preventDefault();
        window.addEventListener('mousemove', Resize);
        window.addEventListener('mouseup', stopResize);
        if (iframe) iframe.style.pointerEvents = 'none';
    }

    function Resize(e) {
        // Calculate new dimensions based on mouse position and element offset
        const newWidth = e.clientX - el.getBoundingClientRect().left;
        const newHeight = e.clientY - el.getBoundingClientRect().top;

        // Set minimum and maximum constraints
        if (newWidth > 300 && newWidth < window.innerWidth - 50) {
            el.style.width = newWidth + 'px';
        }
        if (newHeight > 200 && newHeight < window.innerHeight - 50) {
            el.style.height = newHeight + 'px';
        }
    }

    function stopResize() {
        window.removeEventListener('mousemove', Resize);
        window.removeEventListener('mouseup', stopResize);
        if (iframe) iframe.style.pointerEvents = 'auto';
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const mf19Window = document.getElementById("mf19SplitWindow");
    const mf19Handle = document.getElementById("mf19Handle");
    
    if (mf19Window && mf19Handle) {
        makeElementDraggable(mf19Window, mf19Handle);
        makeElementResizable(mf19Window); // Add this line
    }
});

function finalizeAndSave() {
    let totalGot = 0;
    let totalMax = 0;

    // Sum up everything in our paperMarks object
    Object.values(paperMarks).forEach(m => {
        totalGot += Number(m.got || 0);
        totalMax += Number(m.max || 0);
    });

    if (totalMax === 0) return alert("Please enter the max marks for at least one question!");

    const result = {
        name: "Maths Paper Practice",
        score: totalGot,
        max: totalMax,
        percent: Math.round((totalGot / totalMax) * 100),
        date: new Date().toLocaleDateString()
    };

    const grades = JSON.parse(localStorage.getItem('user_grades') || "[]");
    grades.unshift(result);
    localStorage.setItem('user_grades', JSON.stringify(grades));

    alert(`Saved! Final Score: ${totalGot}/${totalMax} (${result.percent}%)`);
}
window.updateMark = function(qIndex, field, inputEl) {
    // 1. Map the array index to the actual Question Number
    const qNumber = questions[qIndex].number; 
    
    let rawValue = inputEl.value.replace(/\D/g, '');
    
    // 2. Use qNumber as the key for consistency with renderQuestion
    if (!paperMarks[qNumber]) paperMarks[qNumber] = { got: 0, max: 0 };

    if (rawValue === "") {
        paperMarks[qNumber][field] = 0;
    } else {
        let val = parseInt(rawValue);
        if (isNaN(val)) val = 0;

        if (field === 'got') {
            let maxVal = paperMarks[qNumber].max || 0;
            if (maxVal > 0 && val > maxVal) {
                val = maxVal;
                inputEl.value = val;
            }
        }
        paperMarks[qNumber][field] = val;
    }

    // 3. Save to LocalStorage using the unique paper key
    const paperKey = `marks_${subjectSelect.value}_${paperSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}`;
    localStorage.setItem(paperKey, JSON.stringify(paperMarks));

    // 4. Update Colors
    const activeColor = (field === 'got') ? '#1e293b' : '#64748b';
    const emptyColor = '#94a3b8';
    const targetColor = (inputEl.value === "" || parseInt(inputEl.value) === 0) ? emptyColor : activeColor;
    
    inputEl.style.setProperty('color', targetColor, 'important');
    inputEl.style.setProperty('-webkit-text-fill-color', targetColor, 'important');
}

function finalizeFullPaperMarking() {
    const activeQuestions = window.questions || questions;
    if (!activeQuestions || activeQuestions.length === 0) return;

    // Detect Subject
    const fullPath = activeQuestions[0].img || activeQuestions[0].images[0];
    const fileName = fullPath.split('/').pop();
    const subjectCode = fileName.split('_')[0]; 
    const paperID = fileName.replace(/_q\d+.*\.png$/i, '');

    if (subjectCode === "9708") {
        const checkingModal = document.getElementById('checkingModal');
        if (checkingModal) checkingModal.style.display = 'flex';

        const HARDCODED_DATABASE = {
            "9708_m25_qp_32": "BDDBACBDABBAAACCACAAADABDBCCDC",
            "9708_s25_qp_31": "BCACCDCCBCBBCBBCBAACDAADBCBCDB", 
        };

        const correctKeyString = HARDCODED_DATABASE[paperID];
        if (!correctKeyString) {
            alert("Answer key not found for this Econ paper.");
            if (checkingModal) checkingModal.style.display = 'none';
            return;
        }

        const correctKey = correctKeyString.split('');

        setTimeout(() => {
            let score = 0;
            let attempted = 0;
            let total = activeQuestions.length;
            let wrongQuestions = [];

            for (let i = 0; i < total; i++) {
                // Check window.userAnswers (make sure your button clicks save here!)
                const userAns = window.userAnswers ? window.userAnswers[i] : null; 
                const correctAns = correctKey[i];

                if (userAns && userAns !== "None") attempted++; 

                if (userAns === correctAns) {
                    score++;
                } else {
                    const actualQNum = activeQuestions[i].number || (i + 1);
                    wrongQuestions.push({
                        ...activeQuestions[i],
                        questionNum: actualQNum, 
                        userSelected: userAns || "None",
                        correctIs: correctAns, 
                        subjectVal: "9708",
                        paperInfo: paperID,
                        note: `Your Answer: ${userAns || 'None'} | Correct Answer: ${correctAns}`
                    });
                }
            }
            
            // HIDE checking loader THEN show result
            if (checkingModal) checkingModal.style.display = 'none';
            showFinishModalUI(score, total, attempted, wrongQuestions);
            
        }, 1500);

    } else {
        // Math/Psych Path
        let totalGot = 0;
        let totalMax = 0;
        let attemptedCount = 0;

        // Use the paperMarks object you already have
        Object.values(paperMarks).forEach(m => {
            if (m.max > 0) {
                totalGot += Number(m.got || 0);
                totalMax += Number(m.max || 0);
                attemptedCount++;
            }
        });

        showFinishModalUI(totalGot, totalMax, attemptedCount, []);
    }
}
window.closeFinishModal = function() {
    const modal = document.getElementById('finishModal');
    if (!modal) return;

    // 1. Start the fade out/slide down animation
    modal.style.opacity = '0';
    const card = modal.querySelector('.modal-card');
    if (card) {
        card.style.transform = 'translateY(20px)';
    }

    // 2. Wait for the animation to finish (300ms) before hiding display
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
};

function showFinishModalUI(score, total, attempted, mistakes) {
    console.log("DEBUG: Final Score:", score, "Total:", total, "Attempted:", attempted);
    
    const modal = document.getElementById('finishModal');
    if (!modal) {
        alert("Critical Error: Modal 'finishModal' not found in HTML!");
        return;
    }

    // Update the numbers in the modal
    const countEl = document.getElementById('modalAttemptCount');
    const scoreEl = document.getElementById('modalScoreGot');
    const maxEl = document.getElementById('modalScoreMax');
    const percentEl = document.getElementById('modalPercent');

    if (countEl) countEl.textContent = attempted;
    if (scoreEl) scoreEl.textContent = score;
    if (maxEl) maxEl.textContent = total;
    
    const percent = total > 0 ? Math.round((score / total) * 100) : 0;
    if (percentEl) percentEl.textContent = percent + "%";

    // --- THE FIX: FORCE VISIBILITY ---
    modal.style.display = 'flex';
    modal.style.visibility = 'visible'; // Extra safety
    
    // Use a slight delay to ensure the 'display: flex' is processed before opacity
    setTimeout(() => {
        modal.style.opacity = '1';
        const card = modal.querySelector('.modal-card');
        if (card) {
            card.style.transform = 'translateY(0)';
            card.style.opacity = '1';
        }
    }, 50);

    // Save mistakes
    if (mistakes && mistakes.length > 0) {
        const saved = JSON.parse(localStorage.getItem('savedQuestions') || '[]');
        localStorage.setItem('savedQuestions', JSON.stringify([...saved, ...mistakes]));
    }
}
function savePaperToHistory(data) {
    // 1. Get the dropdown elements
    const subjectEl = document.getElementById('subjectSelect');
    const paperEl = document.getElementById('paperSelect');
    
    // 2. Get the "Readable" text from the selected option (e.g., "Economics 9708")
    // Instead of just the value (9708), we get the label the user sees.
    const selectedSubjectText = subjectEl.options[subjectEl.selectedIndex].text;

    const paperNameMap = { "pure3": "Pure 3", "stats1": "Stats 1", "pure1": "Pure 1" };

    const paperResult = {
        id: Date.now(),
        subject: selectedSubjectText, // <--- THIS FIXES IT
        paper: paperNameMap[paperEl?.value] || paperEl?.value || "Paper",
        year: document.getElementById('yearSelect')?.value || "2024",
        season: document.getElementById('seasonSelect')?.value || "Series",
        variant: document.getElementById('variantSelect')?.value || "1",
        score: Number(data.totalGot) || 0,
        maxScore: Number(data.totalMax) || 0,
        percentage: data.percentage || 0,
        date: new Date().toLocaleDateString(),
        timeSpent: document.getElementById('timer')?.innerText || "00:00",
        questionsCount: data.questionsAttempted || 0
    };

    // Save to LocalStorage
    const history = JSON.parse(localStorage.getItem('paperHistory') || '[]');
    history.unshift(paperResult);
    localStorage.setItem('paperHistory', JSON.stringify(history));

    window.location.href = "grades.html";
}
window.handleFinalSaveAndExit = function() {
    // 1. Pull the final values that the modal is currently showing
    const totalGot = document.getElementById('modalScoreGot').textContent;
    const totalMax = document.getElementById('modalScoreMax').textContent;
    const attempted = document.getElementById('modalAttemptCount').textContent;
    const percentStr = document.getElementById('modalPercent').textContent;

    // 2. Prepare the data object for your history function
    const data = {
        totalGot: parseInt(totalGot),
        totalMax: parseInt(totalMax),
        percentage: parseInt(percentStr.replace('%', '')),
        questionsAttempted: parseInt(attempted)
    };

    // 3. Call your existing save function
    savePaperToHistory(data);
};
document.addEventListener('DOMContentLoaded', () => {
    const subjectSelect = document.getElementById('subjectSelect');
    const paperSelect = document.getElementById('paperSelect');

 const paperData = {
    "9709": [
    ,
        { value: "pure3", text: "Pure 3" },
    
        { value: "stats1", text: "Stats 1" }
    ],
    "9990": [
        { value: "p1", text: "Paper 1" },
        { value: "p2", text: "Paper 2" },
        { value: "p3", text: "Paper 3" },
        { value: "p4", text: "Paper 4" }
    ],
    "9708": [
        { value: "p3", text: "Paper 3" } // Only Paper 3 for Economics
    ]
};
    subjectSelect.addEventListener('change', function() {
        const selectedSubject = this.value;
        const papers = paperData[selectedSubject] || [];

        // Clear existing options
        paperSelect.innerHTML = "";

        // Populate new options
        papers.forEach(paper => {
            const option = document.createElement('option');
            option.value = paper.value;
            option.textContent = paper.text;
            paperSelect.appendChild(option);
        });
    });
});


function saveAndShowResults(score, total, paperID, wrongQuestions) {
    const percentage = Math.round((score / total) * 100);
    
    // 1. Save to Grade History
    const gradeEntry = {
        paper: paperID,
        score: score,
        maxScore: total,
        percentage: percentage,
        date: new Date().toLocaleDateString(),
        // Fallbacks for UI selection
        season: document.getElementById('seasonSelect')?.value || "", 
        year: document.getElementById('yearSelect')?.value || "",
        variant: document.getElementById('variantSelect')?.value || ""
    };
    
    let history = JSON.parse(localStorage.getItem('paperHistory') || "[]");
    history.unshift(gradeEntry);
    localStorage.setItem('paperHistory', JSON.stringify(history));

    // 2. Save Wrong Questions (The Library)
    if (wrongQuestions.length > 0) {
        let savedItems = JSON.parse(localStorage.getItem('savedQuestions') || "[]");
        
        wrongQuestions.forEach(wq => {
            const imgPath = wq.img || (wq.images ? wq.images[0] : "");
            const isDuplicate = savedItems.some(item => item.img === imgPath);
            
            if (!isDuplicate) {
                savedItems.push({
                    id: Date.now() + Math.random(),
                    subjectVal: wq.subjectVal || "9708",
                    // --- THE FIX: LOCK THE NUMBER ---
                    questionNum: wq.questionNum, 
                    img: imgPath,
                    paperInfo: paperID,
                    userSelected: wq.userSelected,
                    correctIs: wq.correctAns,
                    note: wq.note,
                    dateSaved: new Date().toLocaleDateString(),
                    // Carry over meta-data for path calculation in preview
                    season: gradeEntry.season,
                    year: gradeEntry.year,
                    variant: gradeEntry.variant,
                    paper: paperID.split('_qp_')[1]?.charAt(0) || "1"
                });
            }
        });
        localStorage.setItem('savedQuestions', JSON.stringify(savedItems));
    }

    // 3. Update Results Modal UI
    const resScore = document.getElementById('resScore');
    const resTotal = document.getElementById('resTotal');
    const resPercent = document.getElementById('resPercent');
    const resultsModal = document.getElementById('resultsModal');

    if (resScore) resScore.textContent = score;
    if (resTotal) resTotal.textContent = total;
    if (resPercent) resPercent.textContent = percentage + "%";
    if (resultsModal) resultsModal.style.display = 'flex';
}
// Helper functions to keep main code clean
function saveToGrades(id, s, t, p) {
    let grades = JSON.parse(localStorage.getItem('userGrades')) || [];
    grades.push({ subject: "Economics", paper: id, date: new Date().toLocaleDateString(), score: `${s}/${t}`, percent: p });
    localStorage.setItem('userGrades', JSON.stringify(grades));
}

function saveToSaved(wrongs) {
    let saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
    wrongs.forEach(wq => {
        if (!saved.some(s => s.img === wq.img)) saved.push(wq);
    });
    localStorage.setItem('savedQuestions', JSON.stringify(saved));
}
function toggleMarkScheme() {
    const msContainer = document.getElementById('modalMS');
    const btn = document.getElementById('toggleMS');
    
    if (msContainer.style.display === 'none' || msContainer.style.display === '') {
        msContainer.style.display = 'block';
        btn.textContent = 'Hide Mark Scheme';
        btn.style.background = '#64748b'; // Change color when active
    } else {
        msContainer.style.display = 'none';
        btn.textContent = 'Show Mark Scheme';
        btn.style.background = '#0ea5e9';
    }
}
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('subject')) {
        // 1. Set the Subject first
        const subjectEl = document.getElementById('subjectSelect');
        subjectEl.value = params.get('subject');

        // 2. IMPORTANT: Manually trigger the 'change' event 
        // This makes sure the Paper dropdown updates its options (Pure vs Econ)
        subjectEl.dispatchEvent(new Event('change'));

        // 3. Set the rest of the dropdowns
        document.getElementById('paperSelect').value = params.get('paper');
        document.getElementById('yearSelect').value = params.get('year');
        document.getElementById('seasonSelect').value = params.get('series');
        document.getElementById('variantSelect').value = params.get('variant');

        // 4. Load the paper
        document.getElementById('loadPaperBtn').click();
        
        // 5. Jump to the question
        const qIndex = params.get('q');
        if (qIndex !== null) {
            setTimeout(() => {
                // We use window.currentIndex because your app uses it globally
                window.currentIndex = parseInt(qIndex);
                if (typeof renderQuestion === 'function') {
                    renderQuestion(window.currentIndex);
                }
            }, 800); // Slightly longer delay to allow images to populate
        }
    }
});


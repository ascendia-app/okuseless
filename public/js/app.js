let questions = [];
window.userAnswers = {};
let currentIndex = 0;
const originalBtnHTML = `<i class="fas fa-sync-alt"></i> Load Paper`;
let userAnswers = [];
window.userAnswers = {};
let paperMarks = {};
window.saveMCQAnswer = (letter) => {
    if (!window.userAnswers) window.userAnswers = {};
    
    window.userAnswers[currentIndex] = letter;
    console.log("Answer saved:", letter, "at index:", currentIndex);
    
    renderUI(); // This re-runs the logic below to apply the colors
};
window.finishEconomicsPaper = () => {
  const yCode = (seasonSelect.value === "febmar" ? "m" : seasonSelect.value === "mayjun" ? "s" : "w") + yearSelect.value.slice(-2);
  const pCode = paperSelect.value.replace('p', '') + variantSelect.value;
  const keyID = `${subjectSelect.value}_${yCode}_${pCode}`;
  const mcqDatabase = JSON.parse(localStorage.getItem('mcqDatabase')) || {};
  const correctKey = mcqDatabase[keyID];
  if (!correctKey) {
    alert(`Error: Answer key for ${keyID} not found. Please add it in keys.html first!`);
    return;
  }
  let score = 0;
  const mistakesToSave = [];
  const currentSaved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
  questions.forEach((q, index) => {
    const userAns = userAnswers[index];
    const correctAns = correctKey[index];
    if (userAns === correctAns) {
      score++;
    } else {
      const uniqueId = `${subjectSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}_q${q.number}`;
      if (!currentSaved.some(sq => sq.id === uniqueId)) {
        mistakesToSave.push({
          id: uniqueId,
          subjectVal: subjectSelect.value,
          paper: paperSelect.value,
          year: yearSelect.value,
          season: seasonSelect.value,
          variant: variantSelect.value,
          questionNum: q.number,
          note: `Your Answer: ${userAns || 'None'} | Correct Answer: ${correctAns}`
        });
      }
    }
  });
  localStorage.setItem('savedQuestions', JSON.stringify([...currentSaved, ...mistakesToSave]));
  const gradeData = JSON.parse(localStorage.getItem('grades')) || [];
  gradeData.push({
    subject: "Economics 9708",
    details: `${yearSelect.value} ${seasonSelect.value} P3 (${variantSelect.value})`,
    score: score,
    total: questions.length,
    date: new Date().toLocaleDateString()
  });
  localStorage.setItem('grades', JSON.stringify(gradeData));
  alert(`Done! Score: ${score}/${questions.length}. ${mistakesToSave.length} mistakes saved to your revision list.`);
  window.location.href = "grades.html";
};
function updateQuestionUI(index) {
  const questionTitle = document.getElementById('question-number');
  const savedScore = paperMarks[index]?.got || "";
  const savedMax = paperMarks[index]?.max || "";
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
function updateMark(index, type, input) {
  const val = parseInt(input.value) || 0;
  const qNum = currentPaper.questions[index].number;
  if (!paperMarks[qNum]) {
    paperMarks[qNum] = {
      got: 0,
      max: 0
    };
  }
  paperMarks[qNum][type] = val;
  const sidebarBtn = document.querySelector(`[data-qnum="${qNum}"]`);
  if (sidebarBtn) {
    if (paperMarks[qNum].got > 0 || paperMarks[qNum].max > 0) {
      sidebarBtn.classList.add('marked');
    } else {
      sidebarBtn.classList.remove('marked');
    }
  }
}
const API_BASE_URL = "https://q-by-q.vercel.app/api";
const urlParams = new URLSearchParams(window.location.search);
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
    subjectSelect.dispatchEvent(new Event('change'));
  }
  if (urlYear) document.getElementById('yearSelect').value = urlYear;
  if (urlSeries) document.getElementById('seasonSelect').value = urlSeries;
  if (urlVariant) document.getElementById('variantSelect').value = urlVariant;
  const paperSelect = document.getElementById('paperSelect');
  if (paperSelect && urlPaper) {
    let formattedPaper = urlPaper;
    if (urlSubject === "9708" && !formattedPaper.startsWith('p')) {
      formattedPaper = "p" + formattedPaper;
    } else if (urlSubject === "9709" && !formattedPaper.startsWith('pure') && (formattedPaper === "1" || formattedPaper === "3")) {
      formattedPaper = "pure" + formattedPaper;
    }
    paperSelect.value = formattedPaper;
  }
  if (urlQIndex !== null) {
    currentIndex = parseInt(urlQIndex);
  }
}
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
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
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
  const noteModal = document.getElementById('noteModal');
  const openNoteBtn = document.getElementById('openNoteModalBtn');
  const closeNoteBtn = document.getElementById('closeNoteModal');
  const saveWithNoteConfirmBtn = document.getElementById('saveWithNoteConfirmBtn');
  const noteTextArea = document.getElementById('noteTextArea');
  const subjectSelect = document.getElementById("subjectSelect");
  const paperSelect = document.getElementById("paperSelect");
  const yearSelect = document.getElementById("yearSelect");
  const seasonSelect = document.getElementById("seasonSelect");
  const variantSelect = document.getElementById("variantSelect");
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
    const pType = paperSelect.value;
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
        note: note !== null ? note : currentSaved[existingIndex]?.note || "",
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
    updateQuestionNote();
  }
  function saveState() {
    if (!subjectSelect.value || questions.length === 0) return;
    const paperDisplayName = paperSelect.options[paperSelect.selectedIndex]?.text;
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
function getCloudinaryPath(fileName) {
    if (!fileName) return "";
    if (fileName.includes('http')) return fileName.trim(); // Already a full URL

    const parts = fileName.split('_'); 
    // parts[0]=9709, parts[1]=s25, parts[2]=qp, parts[3]=32
    const subject = parts[0];
    const series = parts[1];
    const type = parts[2];
    const version = parts[3];

    const base = "qbyq_images";
    
    // This builds: https://res.cloudinary.com/daiieadws/image/upload/qbyq_images/9709/s25/qp/32/9709_s25_qp_32_q1a
    return `https://res.cloudinary.com/daiieadws/image/upload/${base}/${subject}/${series}/${type}/${version}/${fileName.trim()}`;
}
function renderQuestion() {
  if (!questions[currentIndex]) return;
  const q = questions[currentIndex];
  
  const questionNumberEl = document.getElementById("question-number");
  if (questionNumberEl) questionNumberEl.textContent = `Question ${q.number}`;
  
  const scoreInput = document.getElementById('currentQScore');
  const totalInput = document.getElementById('currentQTotal');
  const markContainer = document.getElementById('headerMarkEntry');

  // --- Mark Entry Logic ---
  if (scoreInput && totalInput) {
    const saved = paperMarks[q.number];
    if (saved) {
      scoreInput.value = (saved.got === 0 || saved.got === "") ? "" : saved.got;
      totalInput.value = (saved.max === 0 || saved.max === "") ? "" : saved.max;
      const scoreColor = scoreInput.value === "" ? '#94a3b8' : '#1e293b';
      scoreInput.style.setProperty('color', scoreColor, 'important');
      scoreInput.style.setProperty('-webkit-text-fill-color', scoreColor, 'important');
    } else {
      scoreInput.value = "";
      totalInput.value = "";
    }
    scoreInput.oninput = function () { window.updateMark(currentIndex, 'got', this); };
    totalInput.oninput = function () { window.updateMark(currentIndex, 'max', this); };
  }

  // --- Question Images (Folder Routed) ---
  questionContentEl.innerHTML = "";
  q.images.forEach(imgRef => {
    const img = document.createElement("img");
    // Use helper to find folder path
    img.src = getCloudinaryPath(imgRef);
    img.className = "question-image";
    img.loading = "lazy";
    img.onerror = () => {
        // Fallback: Try root if folder path fails
        if (img.src.includes('qbyq_images')) {
            img.src = `https://res.cloudinary.com/daiieadws/image/upload/${imgRef}`;
        } else {
            img.style.display = 'none';
        }
    };
    questionContentEl.appendChild(img);
  });

  // --- Mark Scheme Viewer (Folder Routed & Reset to Hidden) ---
  if (markSchemeViewer) {
    markSchemeViewer.innerHTML = "";
    markSchemeViewer.style.display = "none"; 

    const rawMS = q.markImages || q.msImages || q.mark_scheme || [];
    const msImages = Array.isArray(rawMS) ? rawMS : [rawMS];

    if (msImages.length > 0) {
      msImages.forEach(msRef => {
        if (!msRef) return;

        const img = document.createElement("img");
        img.src = getCloudinaryPath(msRef);
        img.className = "markscheme-image";
        img.style.width = "100%";
        img.style.display = "block";
        img.style.marginBottom = "15px";

        img.onerror = () => {
          console.warn("Folder path failed, trying fallback for:", msRef);
          
          // Fallback 1: Try without the folder structure
          const rootUrl = `https://res.cloudinary.com/daiieadws/image/upload/${msRef}`;
          
          // Fallback 2: Try without .png extension (handling your Public ID issue)
          if (img.src !== rootUrl) {
              img.src = rootUrl;
          } else if (msRef.toLowerCase().endsWith('.png')) {
              img.src = rootUrl.replace('.png', '');
          } else {
              img.src = "https://placehold.co/600x200?text=Mark+Scheme+Not+Found+in+Folder";
          }
        };

        markSchemeViewer.appendChild(img);
      });
    }
  }

  updateSaveButtonState();
  updateQuestionNote();
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

  if (prevBtn) prevBtn.style.visibility = currentIndex === 0 ? "hidden" : "visible";
  if (nextBtn) nextBtn.style.visibility = currentIndex === questions.length - 1 || questions.length === 0 ? "hidden" : "visible";

  const mcqWrapper = document.getElementById('mcq-options-wrapper');
  const mcqButtons = document.getElementById('mcq-buttons');
  const marksEntry = document.getElementById('headerMarkEntry');
  const msBtn = document.getElementById('markSchemeBtn');
  const mf19Btn = document.getElementById('toggleMF19Btn');

  const isMath = subCode === "9709"; // Only true for Math

  const subCode = subjectSelect.value;
  const isEconMCQ = subCode === "9708";
if (mf19Btn) {
    // Show only for Math, hide for Psychology (9990) and Economics (9708)
    mf19Btn.style.display = isMath ? "inline-flex" : "none";
  }

  if (isEconMCQ) {
    // --- ECONOMICS MODE ---
    if (mcqWrapper) mcqWrapper.style.display = "block";
    if (marksEntry) marksEntry.style.display = "none";
    
    // ... (Keep your MCQ button/Show Answer logic here) ...

  } else {
    // --- MATH / PSYCH MODE ---
    if (mcqWrapper) mcqWrapper.style.display = "none";
    if (marksEntry) marksEntry.style.display = "flex";

    if (msBtn && markSchemeViewer) {
      // ... (Keep your Mark Scheme toggle logic here) ...
    }
  }
  

  if (isEconMCQ) {
    if (mcqWrapper) mcqWrapper.style.display = "block";
    if (marksEntry) marksEntry.style.display = "none";

    if (mcqButtons) {
      mcqButtons.innerHTML = ['A', 'B', 'C', 'D'].map(letter => {
        const isSelected = window.userAnswers && window.userAnswers[currentIndex] === letter;
        return `<button onclick="saveMCQAnswer('${letter}')" style="width: 55px; height: 55px; border-radius: 50%; border: 2px solid #10b981; font-weight: 800; cursor: pointer; transition: 0.2s; background: ${isSelected ? '#10b981' : 'transparent'}; color: ${isSelected ? '#fff' : '#10b981'}; box-shadow: ${isSelected ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'};">${letter}</button>`;
      }).join('');
    }

    if (msBtn) {
      msBtn.innerHTML = `<i class="fas fa-lightbulb"></i> Show Answer`;
      msBtn.style.background = "";
      msBtn.onclick = () => {
        const currentQ = questions[currentIndex];
        const fileName = (currentQ.img || currentQ.images[0]).split('/').pop();
        const paperID = fileName.replace(/_q\d+.*\.png$/i, '');
        const KEYS = { 
            "9708_m25_qp_32": "BDDBACBDABBAAACCACAAADABDBCCDC", 
            "9708_s25_qp_31": "BCACCDCCBCBBCBBCBAACDAADBCBCDB" 
        };
        const keyString = KEYS[paperID];
        if (keyString) {
          msBtn.innerHTML = `<i class="fas fa-check-circle"></i> Correct: ${keyString[currentIndex]}`;
          msBtn.style.background = "#059669";
        }
      };
    }
  } else {
    if (mcqWrapper) mcqWrapper.style.display = "none";
    if (marksEntry) marksEntry.style.display = "flex";

    if (msBtn && markSchemeViewer) {
      msBtn.style.background = ""; 
      msBtn.innerHTML = `<i class="fas fa-eye"></i> Show Mark Scheme`;
      
      msBtn.onclick = () => {
        const isHidden = markSchemeViewer.style.display === "none";
        if (isHidden) {
          markSchemeViewer.style.display = "block";
          msBtn.innerHTML = `<i class="fas fa-eye-slash"></i> Hide Mark Scheme`;
          msBtn.style.background = "#64748b"; 
        } else {
          markSchemeViewer.style.display = "none";
          msBtn.innerHTML = `<i class="fas fa-eye"></i> Show Mark Scheme`;
          msBtn.style.background = "";
        }
      };
    }
  }
  saveState();
}
/**
 * Global function to save MCQ choices
 */
window.saveMCQAnswer = (letter) => {
    if (!window.userAnswers) window.userAnswers = {};
    window.userAnswers[currentIndex] = letter;
    renderUI(); // Re-render to update button highlights
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
  if (saveBtn) {
    saveBtn.onclick = () => handleSaveAction();
  }
  if (openNoteBtn) {
    openNoteBtn.onclick = e => {
      e.preventDefault();
      let token = localStorage.getItem("token");
      if (!token || token.length < 20) {
        window.location.href = "pleaselogin.html";
        return;
      }
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
    loadPaperBtn.onclick = e => {
      if (e && e.isTrusted) {
        currentIndex = 0;
      }
      loadPaperBtn.disabled = true;
      loadPaperBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;
      startLoadingProcess();
    };
  }
  const startLoadingProcess = () => {
    const paperMap = {
      pure1: "1",
      pure3: "3",
      mechanics: "4",
      stats1: "5"
    };
    let paperVal = paperSelect.value.toLowerCase();
    const subCode = subjectSelect.value;
    const isMCQSubject = subCode === "9990" || subCode === "9708";
    if (isMCQSubject) {
      paperVal = paperVal.replace('p', '');
    }
    const pCode = (paperMap[paperVal] || paperVal) + variantSelect.value;
    const yCode = (seasonSelect.value === "febmar" ? "m" : seasonSelect.value === "mayjun" ? "s" : "w") + yearSelect.value.slice(-2);
    const CLOUD_NAME = "daiieadws";
    const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/`;
    questions = [];
    let qNum = 1;
    const checkImage = (fileName, char) => {
      return new Promise(resolve => {
        const qPath = `${BASE_URL}${fileName}`;
        const img = new Image();
        img.onload = () => resolve({
          success: true,
          qPath,
          char,
          fileName
        });
        img.onerror = () => resolve({
          success: false
        });
        img.src = qPath;
      });
    };
    const loadNextQuestion = () => {
      const partLetters = isMCQSubject ? ["a"] : ["", "a", "b", "c", "d", "e"];
      const attempts = partLetters.map(char => {
        const fName = `${subCode}_${yCode}_qp_${pCode}_q${qNum}${char}.png`;
        return checkImage(fName, char);
      });
      Promise.all(attempts).then(results => {
        const validParts = results.filter(r => r.success);
        if (validParts.length > 0) {
          validParts.sort((a, b) => a.char.localeCompare(b.char));
          const qPaths = validParts.map(p => p.qPath);
          const mPaths = validParts.map(p => {
            const msFileName = p.fileName.replace('_qp_', '_ms_');
            return `${BASE_URL}${msFileName}`;
          });
          questions.push({
            number: qNum,
            img: qPaths[0],
            images: qPaths,
            markImages: mPaths
          });
          qNum++;
          loadNextQuestion();
        } else {
          finalizeLoading();
        }
      });
    };
    loadNextQuestion();
  };
  const finalizeLoading = () => {
    if (loadPaperBtn) {
      loadPaperBtn.disabled = false;
      loadPaperBtn.innerHTML = originalBtnHTML;
    }
    if (questions.length === 0) {
      if (typeof notFoundModal !== 'undefined' && notFoundModal) {
        notFoundModal.style.display = 'flex';
      } else {
        alert("No questions found for this paper. Check if your Cloudinary names match!");
      }
      return;
    }
    window.questions = questions;
    if (typeof renderUI === "function") renderUI();
    console.log("Paper Loaded Successfully! Count:", questions.length);
  };
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
        opt.value = v;
        opt.textContent = "v" + v;
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
  if (prevBtn) prevBtn.onclick = () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderUI();
    }
  };
  if (nextBtn) nextBtn.onclick = () => {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderUI();
    }
  };
  if (markSchemeBtn) {
    markSchemeBtn.onclick = () => {
      const isOpen = markSchemeViewer.classList.toggle("open");
      markSchemeViewer.style.display = isOpen ? "block" : "none";
      markSchemeBtn.innerHTML = isOpen ? `<i class="fas fa-eye-slash"></i> Hide Markscheme` : `<i class="fas fa-eye"></i> Show Markscheme`;
    };
  }
  const sidebar = document.getElementById("sidebar");
  const toggleSidebar = document.getElementById("toggleSidebar");
  if (localStorage.getItem("sidebarCollapsed") === "true") sidebar?.classList.add("collapsed");
  if (toggleSidebar) {
    toggleSidebar.onclick = () => {
      sidebar.classList.toggle("collapsed");
      localStorage.setItem("sidebarCollapsed", sidebar.classList.contains("collapsed"));
    };
  }
  const toggleMF19Btn = document.getElementById('toggleMF19Btn');
  const mf19SplitWindow = document.getElementById('mf19SplitWindow');
  const closeMF19Split = document.getElementById('closeMF19Split');
  if (toggleMF19Btn) {
    toggleMF19Btn.onclick = () => {
      if (mf19SplitWindow.style.display === 'none' || mf19SplitWindow.style.display === '') {
        mf19SplitWindow.style.display = 'flex';
        toggleMF19Btn.innerHTML = `<i class="fas fa-eye-slash"></i> Hide MF19`;
      } else {
        mf19SplitWindow.style.display = 'none';
        toggleMF19Btn.innerHTML = `<i class="fas fa-file-pdf"></i> Show MF19`;
      }
    };
  }
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
window.addEventListener('click', e => {
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
const hoursEl = document.getElementById("hours"),
  minutesEl = document.getElementById("minutes"),
  secondsEl = document.getElementById("seconds"),
  startBtn = document.getElementById("startTimer"),
  pauseBtn = document.getElementById("pauseTimer"),
  resetBtn = document.getElementById("resetTimer");
let tInt = null;
function getTimerData() {
  const data = localStorage.getItem("timerTime");
  return data && data !== "undefined" ? JSON.parse(data) : {
    h: 0,
    m: 0,
    s: 0,
    startTime: null,
    running: false
  };
}
function updateTimerUI() {
  const data = getTimerData();
  let totalS = data.h * 3600 + data.m * 60 + data.s;
  if (data.running && data.startTime) {
    totalS += Math.floor((Date.now() - data.startTime) / 1000);
  }
  if (hoursEl) hoursEl.textContent = String(Math.floor(totalS / 3600)).padStart(2, "0");
  if (minutesEl) minutesEl.textContent = String(Math.floor(totalS % 3600 / 60)).padStart(2, "0");
  if (secondsEl) secondsEl.textContent = String(totalS % 60).padStart(2, "0");
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
    let totalS = data.h * 3600 + data.m * 60 + data.s + elapsed;
    localStorage.setItem("timerTime", JSON.stringify({
      h: Math.floor(totalS / 3600),
      m: Math.floor(totalS % 3600 / 60),
      s: totalS % 60,
      running: false,
      startTime: null
    }));
    clearInterval(tInt);
    updateTimerUI();
  };
}
if (resetBtn) {
  resetBtn.onclick = () => {
    const data = getTimerData();
    let currentS = data.h * 3600 + data.m * 60 + data.s;
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
  let xOffset = 0,
    yOffset = 0;
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
      let nextX = e.clientX - initialX;
      let nextY = e.clientY - initialY;
      const rect = el.getBoundingClientRect();
      const originalLeft = el.offsetLeft;
      const originalTop = el.offsetTop;
      const minX = -originalLeft;
      const maxX = window.innerWidth - originalLeft - rect.width;
      const minY = -originalTop;
      const maxY = window.innerHeight - originalTop - rect.height;
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
    const newWidth = e.clientX - el.getBoundingClientRect().left;
    const newHeight = e.clientY - el.getBoundingClientRect().top;
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
    makeElementResizable(mf19Window);
  }
});
function finalizeAndSave() {
  let totalGot = 0;
  let totalMax = 0;
  Object.values(paperMarks).forEach(m => {
    totalGot += Number(m.got || 0);
    totalMax += Number(m.max || 0);
  });
  if (totalMax === 0) return alert("Please enter the max marks for at least one question!");
  const result = {
    name: "Maths Paper Practice",
    score: totalGot,
    max: totalMax,
    percent: Math.round(totalGot / totalMax * 100),
    date: new Date().toLocaleDateString()
  };
  const grades = JSON.parse(localStorage.getItem('user_grades') || "[]");
  grades.unshift(result);
  localStorage.setItem('user_grades', JSON.stringify(grades));
  alert(`Saved! Final Score: ${totalGot}/${totalMax} (${result.percent}%)`);
}
window.updateMark = function (qIndex, field, inputEl) {
  const qNumber = questions[qIndex].number;
  let rawValue = inputEl.value.replace(/\D/g, '');
  if (!paperMarks[qNumber]) paperMarks[qNumber] = {
    got: 0,
    max: 0
  };
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
  const paperKey = `marks_${subjectSelect.value}_${paperSelect.value}_${yearSelect.value}_${seasonSelect.value}_${variantSelect.value}`;
  localStorage.setItem(paperKey, JSON.stringify(paperMarks));
  const activeColor = field === 'got' ? '#1e293b' : '#64748b';
  const emptyColor = '#94a3b8';
  const targetColor = inputEl.value === "" || parseInt(inputEl.value) === 0 ? emptyColor : activeColor;
  inputEl.style.setProperty('color', targetColor, 'important');
  inputEl.style.setProperty('-webkit-text-fill-color', targetColor, 'important');
};
function finalizeFullPaperMarking() {
  const activeQuestions = window.questions || questions;
  if (!activeQuestions || activeQuestions.length === 0) return;
  const fullPath = activeQuestions[0].img || activeQuestions[0].images[0];
  const fileName = fullPath.split('/').pop();
  const subjectCode = fileName.split('_')[0];
  const paperID = fileName.replace(/_q\d+.*\.png$/i, '');
  if (subjectCode === "9708") {
    const checkingModal = document.getElementById('checkingModal');
    if (checkingModal) checkingModal.style.display = 'flex';
    const HARDCODED_DATABASE = {
      "9708_m25_qp_32": "BDDBACBDABBAAACCACAAADABDBCCDC",
      "9708_s25_qp_31": "BCACCDCCBCBBCBBCBAACDAADBCBCDB"
    };
    const correctKeyString = HARDCODED_DATABASE[paperID];
    if (!correctKeyString) {
      alert("Answer key not found for Econ paper: " + paperID);
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
        const userAns = window.userAnswers && window.userAnswers[i] ? window.userAnswers[i] : null;
        const correctAns = correctKey[i];
        if (userAns && userAns !== "None") {
          attempted++;
          if (userAns === correctAns) {
            score++;
          } else {
            const actualQNum = activeQuestions[i].number || i + 1;
            wrongQuestions.push({
              ...activeQuestions[i],
              questionNum: actualQNum,
              userSelected: userAns,
              correctIs: correctAns,
              subjectVal: "9708",
              paperInfo: paperID,
              note: `Your Answer: ${userAns} | Correct Answer: ${correctAns}`
            });
          }
        }
      }
      if (checkingModal) checkingModal.style.display = 'none';
      showFinishModalUI(score, total, attempted, wrongQuestions);
    }, 1500);
  } else {
    let totalGot = 0;
    let totalMax = 0;
    let attemptedCount = 0;
    if (typeof paperMarks !== 'undefined') {
      Object.values(paperMarks).forEach(m => {
        if (m.max > 0) {
          totalGot += Number(m.got || 0);
          totalMax += Number(m.max || 0);
          attemptedCount++;
        }
      });
    }
    showFinishModalUI(totalGot, totalMax, attemptedCount, []);
  }
}
window.closeFinishModal = function () {
  const modal = document.getElementById('finishModal');
  if (!modal) return;
  modal.style.opacity = '0';
  const card = modal.querySelector('.modal-card');
  if (card) {
    card.style.transform = 'translateY(20px)';
  }
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
  const countEl = document.getElementById('modalAttemptCount');
  const scoreEl = document.getElementById('modalScoreGot');
  const maxEl = document.getElementById('modalScoreMax');
  const percentEl = document.getElementById('modalPercent');
  if (countEl) countEl.textContent = attempted;
  if (scoreEl) scoreEl.textContent = score;
  if (maxEl) maxEl.textContent = total;
  const percent = total > 0 ? Math.round(score / total * 100) : 0;
  if (percentEl) percentEl.textContent = percent + "%";
  modal.style.display = 'flex';
  modal.style.visibility = 'visible';
  setTimeout(() => {
    modal.style.opacity = '1';
    const card = modal.querySelector('.modal-card');
    if (card) {
      card.style.transform = 'translateY(0)';
      card.style.opacity = '1';
    }
  }, 50);
  if (mistakes && mistakes.length > 0) {
    const saved = JSON.parse(localStorage.getItem('savedQuestions') || '[]');
    localStorage.setItem('savedQuestions', JSON.stringify([...saved, ...mistakes]));
  }
}
function savePaperToHistory(data) {
  const subjectEl = document.getElementById('subjectSelect');
  const paperEl = document.getElementById('paperSelect');
  const selectedSubjectText = subjectEl.options[subjectEl.selectedIndex].text;
  const paperNameMap = {
    "pure3": "Pure 3",
    "stats1": "Stats 1",
    "pure1": "Pure 1"
  };
  const paperResult = {
    id: Date.now(),
    subject: selectedSubjectText,
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
  const history = JSON.parse(localStorage.getItem('paperHistory') || '[]');
  history.unshift(paperResult);
  localStorage.setItem('paperHistory', JSON.stringify(history));
  window.location.href = "grades.html";
}
window.handleFinalSaveAndExit = function () {
  const totalGot = document.getElementById('modalScoreGot').textContent;
  const totalMax = document.getElementById('modalScoreMax').textContent;
  const attempted = document.getElementById('modalAttemptCount').textContent;
  const percentStr = document.getElementById('modalPercent').textContent;
  const data = {
    totalGot: parseInt(totalGot),
    totalMax: parseInt(totalMax),
    percentage: parseInt(percentStr.replace('%', '')),
    questionsAttempted: parseInt(attempted)
  };
  savePaperToHistory(data);
};
document.addEventListener('DOMContentLoaded', () => {
  const subjectSelect = document.getElementById('subjectSelect');
  const paperSelect = document.getElementById('paperSelect');
  const paperData = {
    "9709": [, {
      value: "pure3",
      text: "Pure 3"
    }, {
      value: "stats1",
      text: "Stats 1"
    }],
    "9990": [{
      value: "p1",
      text: "Paper 1"
    }, {
      value: "p2",
      text: "Paper 2"
    }, {
      value: "p3",
      text: "Paper 3"
    }, {
      value: "p4",
      text: "Paper 4"
    }],
    "9708": [{
      value: "p3",
      text: "Paper 3"
    }]
  };
  subjectSelect.addEventListener('change', function () {
    const selectedSubject = this.value;
    const papers = paperData[selectedSubject] || [];
    paperSelect.innerHTML = "";
    papers.forEach(paper => {
      const option = document.createElement('option');
      option.value = paper.value;
      option.textContent = paper.text;
      paperSelect.appendChild(option);
    });
  });
});
function saveAndShowResults(score, total, paperID, wrongQuestions) {
  const percentage = Math.round(score / total * 100);
  const gradeEntry = {
    paper: paperID,
    score: score,
    maxScore: total,
    percentage: percentage,
    date: new Date().toLocaleDateString(),
    season: document.getElementById('seasonSelect')?.value || "",
    year: document.getElementById('yearSelect')?.value || "",
    variant: document.getElementById('variantSelect')?.value || ""
  };
  let history = JSON.parse(localStorage.getItem('paperHistory') || "[]");
  history.unshift(gradeEntry);
  localStorage.setItem('paperHistory', JSON.stringify(history));
  if (wrongQuestions.length > 0) {
    let savedItems = JSON.parse(localStorage.getItem('savedQuestions') || "[]");
    wrongQuestions.forEach(wq => {
      const imgPath = wq.img || (wq.images ? wq.images[0] : "");
      const isDuplicate = savedItems.some(item => item.img === imgPath);
      if (!isDuplicate) {
        savedItems.push({
          id: Date.now() + Math.random(),
          subjectVal: wq.subjectVal || "9708",
          questionNum: wq.questionNum,
          img: imgPath,
          paperInfo: paperID,
          userSelected: wq.userSelected,
          correctIs: wq.correctAns,
          note: wq.note,
          dateSaved: new Date().toLocaleDateString(),
          season: gradeEntry.season,
          year: gradeEntry.year,
          variant: gradeEntry.variant,
          paper: paperID.split('_qp_')[1]?.charAt(0) || "1"
        });
      }
    });
    localStorage.setItem('savedQuestions', JSON.stringify(savedItems));
  }
  const resScore = document.getElementById('resScore');
  const resTotal = document.getElementById('resTotal');
  const resPercent = document.getElementById('resPercent');
  const resultsModal = document.getElementById('resultsModal');
  if (resScore) resScore.textContent = score;
  if (resTotal) resTotal.textContent = total;
  if (resPercent) resPercent.textContent = percentage + "%";
  if (resultsModal) resultsModal.style.display = 'flex';
}
function saveToGrades(id, s, t, p) {
  let grades = JSON.parse(localStorage.getItem('userGrades')) || [];
  grades.push({
    subject: "Economics",
    paper: id,
    date: new Date().toLocaleDateString(),
    score: `${s}/${t}`,
    percent: p
  });
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
    btn.style.background = '#64748b';
  } else {
    msContainer.style.display = 'none';
    btn.textContent = 'Show Mark Scheme';
    btn.style.background = '#0ea5e9';
  }
}
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('subject')) {
    const subjectEl = document.getElementById('subjectSelect');
    subjectEl.value = params.get('subject');
    subjectEl.dispatchEvent(new Event('change'));
    document.getElementById('paperSelect').value = params.get('paper');
    document.getElementById('yearSelect').value = params.get('year');
    document.getElementById('seasonSelect').value = params.get('series');
    document.getElementById('variantSelect').value = params.get('variant');
    document.getElementById('loadPaperBtn').click();
    const qIndex = params.get('q');
    if (qIndex !== null) {
      setTimeout(() => {
        window.currentIndex = parseInt(qIndex);
        if (typeof renderQuestion === 'function') {
          renderQuestion(window.currentIndex);
        }
      }, 800);
    }
  }
});
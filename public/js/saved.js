function getCloudinaryPath(fileName) {
    if (!fileName) return "";
    const cleanName = fileName.trim().replace(/[\n\r]/g, "");
    if (cleanName.includes('http')) return cleanName;

    const parts = cleanName.split('_'); 
    const finalFileName = cleanName.includes('.') ? cleanName : `${cleanName}.png`;

    // ADD THIS: Cloudinary transformations
    // f_auto = automatic format (WebP/Avif)
    // q_auto = automatic quality compression
    const transform = "f_auto,q_auto";

    if (parts.length < 4) {
        return `https://res.cloudinary.com/daiieadws/image/upload/${transform}/${finalFileName}`;
    }

    const path = `qbyq_images/${parts[0]}/${parts[1]}/${parts[2]}/${parts[3]}`;
    return `https://res.cloudinary.com/daiieadws/image/upload/${transform}/${path}/${finalFileName}`;
}
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
function getCloudinaryPath(fileName) {
  if (!fileName) return "";
  const cleanName = fileName.trim().replace(/[\n\r]/g, "");
  if (cleanName.includes('http')) return cleanName;
  const parts = cleanName.split('_');
  if (parts.length < 4) return `https://res.cloudinary.com/daiieadws/image/upload/${cleanName}`;
  const subject = parts[0];
  const series = parts[1];
  const type = parts[2];
  const version = parts[3];
  const base = "qbyq_images";
  return `https://res.cloudinary.com/daiieadws/image/upload/f_auto,q_auto/${base}/${subject}/${series}/${type}/${version}/${cleanName}`;
}
function initLibrary() {
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
  let savedQuestions = JSON.parse(localStorage.getItem('savedQuestions')) || [];
  if (localStorage.getItem("sidebarCollapsed") === "true") sidebar?.classList.add("collapsed");
  if (authBtn) {
    authBtn.innerHTML = `<div class="icon-box"><i class="fas fa-sign-out-alt"></i></div><span class="nav-text">Logout</span>`;
    authBtn.className = "auth-btn logout-state";
  }
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
    const savedQuestions = JSON.parse(localStorage.getItem('savedQuestions')) || [];
    savedGrid.innerHTML = '';
    if (savedQuestions.length === 0) {
      checkEmpty();
      return;
    }
    savedQuestions.forEach((q, index) => {
      const subjectCode = q.subjectVal || (q.paperInfo ? q.paperInfo.split('_')[0] : "9708");
      const sMap = {
        'febmar': 'm',
        'mayjun': 's',
        'octnov': 'w'
      };
      const sCode = sMap[q.season] || 's';
      const yCode = q.year ? q.year.toString().slice(-2) : '25';
      const pNum = (q.paper || '1').toString().replace(/[a-zA-Z]/g, '');
      const vNum = q.variant ? q.variant.toString().replace('v', '') : '1';
      const standardizedMeta = `${subjectCode}_${sCode}${yCode}_qp_${pNum}${vNum}`;
      let subjectLabel = "ECONOMICS 9708";
      let badgeColor = "#10b981";
      if (subjectCode === "9709") {
        subjectLabel = "MATH 9709";
        badgeColor = "#0ea5e9";
      } else if (subjectCode === "9990") {
        subjectLabel = "PSYCH 9990";
        badgeColor = "#8b5cf6";
      }
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
                ` : ''}
                <div style="margin-left: auto; display: flex; gap: 8px;">
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
 
  window.practiceQuestion = lookupKey => {
    console.log("Practice clicked for Key/ID:", lookupKey);
    const saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
    let q = saved.find(item => item.id == lookupKey || item.timestamp == lookupKey);
    if (!q && saved[lookupKey]) q = saved[lookupKey];
    if (!q) {
      console.error("Question not found in localStorage for:", lookupKey);
      return;
    }
    let subject = q.subjectVal || "9708";
    let year = q.year || "2025";
    let series = q.season || "mayjun";
    let paper = q.paper || "p1";
    let variant = q.variant || "1";
    let targetIndex = q.questionNum ? parseInt(q.questionNum) - 1 : 0;
    if (q.paperInfo && typeof q.paperInfo === 'string') {
      try {
        const parts = q.paperInfo.split('_');
        if (parts.length >= 4) {
          subject = parts[0];
          const sy = parts[1];
          const sMap = {
            'm': 'febmar',
            's': 'mayjun',
            'w': 'octnov'
          };
          series = sMap[sy.charAt(0)] || "mayjun";
          year = "20" + sy.substring(1);
          const pv = parts[3];
          paper = "p" + pv.charAt(0);
          variant = pv.charAt(1);
        }
      } catch (err) {
        console.error("Error decoding paperInfo:", err);
      }
    }
    if (subject === "9708" && paper && !paper.toString().startsWith('p')) {
      paper = "p" + paper;
    }
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
  window.jumpToPractice = index => {
    const saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
    const q = saved[index];
    if (q) {
      const lookupKey = q.id || q.timestamp || index;
      window.practiceQuestion(lookupKey);
    } else {
      console.error("No question found at index:", index);
    }
  };
window.openPreview = async (index) => {
    const q = savedQuestions[index];
    if (!q) return;

    const displayNum = q.questionNum || q.number || (q.index !== undefined ? q.index + 1 : "??");
    modalTitle.textContent = `Review: Q${displayNum}`;

    const isEcon = q.subjectVal === "9708" || (q.paperInfo && q.paperInfo.startsWith("9708"));

    // UI Reset
    modalImages.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    modalMS.innerHTML = '';
    
    let baseFileName = "";
    if (q.img) {
        // Extract filename and strip extension
        const raw = q.img.split('/').pop();
        baseFileName = raw.replace(/[a-z]?\.(png|PNG|jpg|JPG)$/i, '');
    } else {
        const sMap = { 'febmar': 'm', 'mayjun': 's', 'octnov': 'w' };
        const sCode = sMap[q.season] || 's';
        const yCode = q.year ? q.year.toString().slice(-2) : '25';
        const pNum = (q.paper || '1').toString().replace(/[a-zA-Z]/g, ''); 
        const vNum = q.variant ? q.variant.toString().replace('v', '') : '1';
        baseFileName = `${q.subjectVal}_${sCode}${yCode}_qp_${pNum}${vNum}_q${displayNum}`;
    }

    const subParts = ["", "a", "b", "c", "d"];
    let foundAnything = false;

   // Inside your window.openPreview loop:
for (const char of subParts) {
    // Send only the name, let getCloudinaryPath handle the extension and path
    const currentNameOnly = `${baseFileName}${char}`; 
    const fullURL = getCloudinaryPath(currentNameOnly);
    
    console.log("Testing URL:", fullURL); // This will show you exactly why it fails or works

    try {
        await new Promise((resolve, reject) => {
            const testImg = new Image();
            testImg.onload = () => {
                if (!foundAnything) { modalImages.innerHTML = ''; foundAnything = true; }
                const qImg = document.createElement('img');
                qImg.src = testImg.src;
                qImg.className = "preview-img";
                qImg.style.width = "100%";
                modalImages.appendChild(qImg);
                resolve();
            };
            testImg.onerror = () => {
                // Try Uppercase PNG if lowercase fails
                if (!testImg.src.includes('.PNG')) {
                    testImg.src = testImg.src.replace('.png', '.PNG');
                } else {
                    reject();
                }
            };
            testImg.src = fullURL;
        });
    } catch (e) { /* skip */ }
}
    if (!foundAnything) {
        modalImages.innerHTML = `<div class="error" style="padding:20px; color:#ef4444; text-align:center;">
            <i class="fas fa-exclamation-circle"></i><br>Image Not Found<br>
            <small style="color: #64748b">${baseFileName}</small>
        </div>`;
    }

    previewModal.style.display = "block";
};
  if (toggleMSBtn) {
    toggleMSBtn.onclick = e => {
      e.preventDefault();
      const isHidden = modalMS.style.display === 'none';
      modalMS.style.display = isHidden ? 'block' : 'none';
      toggleMSBtn.textContent = isHidden ? 'Hide Mark Scheme' : 'Show Mark Scheme';
    };
  }
  if (toggleSidebar) {
    toggleSidebar.onclick = () => {
      sidebar.classList.toggle("collapsed");
      localStorage.setItem("sidebarCollapsed", sidebar.classList.contains("collapsed"));
    };
  }
  if (toggleMSBtn) {
    toggleMSBtn.onclick = e => {
      e.stopPropagation();
      const isHidden = modalMS.style.display === 'none';
      modalMS.style.display = isHidden ? 'block' : 'none';
      toggleMSBtn.textContent = isHidden ? 'Hide Mark Scheme' : 'Show Mark Scheme';
    };
  }
  if (closeBtn) {
    closeBtn.onclick = () => {
      previewModal.style.display = "none";
    };
  }
  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.onclick = () => {
      if (savedQuestions.length > 0) clearAllModal.style.display = 'flex';
    };
  }
  document.getElementById('confirmClearBtn').onclick = () => {
    savedQuestions = [];
    localStorage.setItem('savedQuestions', "[]");
    clearAllModal.style.display = 'none';
    checkEmpty();
  };
  if (authBtn) authBtn.onclick = () => {
    logoutModal.style.display = 'flex';
  };
  document.getElementById('confirmLogout').onclick = () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  };
  window.onclick = e => {
    if (e.target === previewModal) previewModal.style.display = "none";
    if (e.target === logoutModal) logoutModal.style.display = "none";
    if (e.target === clearAllModal) clearAllModal.style.display = "none";
  };
  document.onkeydown = e => {
    if (e.key === "Escape") {
      previewModal.style.display = "none";
      logoutModal.style.display = "none";
      clearAllModal.style.display = "none";
    }
  };
  checkEmpty();
}
document.addEventListener("DOMContentLoaded", verifyAccess);
window.removeSaved = function(index) {
    // 1. Get latest data from storage
    let saved = JSON.parse(localStorage.getItem('savedQuestions')) || [];
    
    // 2. Remove the specific item
    saved.splice(index, 1);
    
    // 3. Save back to storage
    localStorage.setItem('savedQuestions', JSON.stringify(saved));
    
    // 4. IMPORTANT: Sync the global variable used by other functions
    // This prevents "Preview" from opening the wrong question after a delete
    if (typeof savedQuestions !== 'undefined') {
        savedQuestions = saved; 
    }
    
    // 5. Refresh the UI
    if (typeof renderSavedQuestions === "function") {
        renderSavedQuestions();
    } else {
        window.location.reload();
    }
    
    // 6. Update empty state visibility
    if (typeof checkEmpty === "function") checkEmpty();
};
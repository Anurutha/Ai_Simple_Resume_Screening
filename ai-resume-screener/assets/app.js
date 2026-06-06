/* ========================================================
   AI Resume Screener — app.js
   Client-side NLP: PDF text extraction, skills detection,
   TF-IDF cosine similarity scoring
======================================================== */

// ── Config
if (typeof pdfjsLib !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

// ── Skills Database (extended)
const SKILLS_DB = [
  "python","java","c++","c","c#","ruby","go","rust","swift","kotlin","r","scala",
  "html","css","javascript","typescript","react","vue","angular","next","nuxt","svelte",
  "node","express","django","flask","fastapi","spring","laravel",
  "sql","mysql","postgresql","mongodb","redis","cassandra","firebase","supabase","sqlite",
  "machine learning","deep learning","artificial intelligence","ai","nlp","natural language processing",
  "data analysis","data science","data engineering","business intelligence",
  "pandas","numpy","tensorflow","pytorch","keras","sklearn","scikit-learn","scipy","matplotlib","seaborn","plotly",
  "power bi","tableau","excel","google sheets",
  "git","github","gitlab","docker","kubernetes","aws","azure","gcp","linux","bash",
  "rest api","graphql","microservices","ci/cd","devops","agile","scrum",
  "opencv","mediapipe","computer vision","image processing",
  "leadership","communication","problem solving","teamwork","critical thinking"
];

// ── DOM refs
const jobInput    = document.getElementById("jobInput");
const jdCount     = document.getElementById("jdCount");
const fileInput   = document.getElementById("fileInput");
const uploadZone  = document.getElementById("uploadZone");
const uploadIdle  = document.getElementById("uploadIdle");
const uploadReady = document.getElementById("uploadReady");
const fileName    = document.getElementById("fileName");
const removeFile  = document.getElementById("removeFile");
const analyzeBtn  = document.getElementById("analyzeBtn");
const themeToggle = document.getElementById("themeToggle");
const scrollTop   = document.getElementById("scrollTop");
const navbar      = document.getElementById("navbar");
const hamburger   = document.getElementById("hamburger");
const mobileMenu  = document.getElementById("mobileMenu");
const resultEmpty   = document.getElementById("resultEmpty");
const resultContent = document.getElementById("resultContent");

let currentFile = null;
let resumeText  = "";

// ── Theme
const html = document.documentElement;
const saved = localStorage.getItem("theme") || "dark";
html.setAttribute("data-theme", saved);

themeToggle.addEventListener("click", () => {
  const current = html.getAttribute("data-theme");
  const next    = current === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

// ── Navbar scroll
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 40);
  scrollTop.classList.toggle("visible", window.scrollY > 400);
});

scrollTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// ── Mobile menu
hamburger.addEventListener("click", () => mobileMenu.classList.toggle("open"));

// ── JD character count
jobInput.addEventListener("input", () => {
  jdCount.textContent = jobInput.value.length.toLocaleString();
  checkReady();
});

// ── Upload zone
uploadZone.addEventListener("click", () => fileInput.click());

uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-over");
});

uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));

uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file && file.type === "application/pdf") handleFile(file);
});

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

removeFile.addEventListener("click", (e) => {
  e.stopPropagation();
  resetFile();
});

function handleFile(file) {
  currentFile = file;
  fileName.textContent = file.name;
  uploadIdle.style.display  = "none";
  uploadReady.style.display = "flex";
  extractPDFText(file).then(text => {
    resumeText = text;
    checkReady();
  });
}

function resetFile() {
  currentFile = null;
  resumeText  = "";
  fileInput.value = "";
  uploadIdle.style.display  = "";
  uploadReady.style.display = "none";
  checkReady();
}

function checkReady() {
  const ready = resumeText.trim().length > 0 && jobInput.value.trim().length > 10;
  analyzeBtn.disabled = !ready;
}

// ── PDF text extraction via PDF.js
async function extractPDFText(file) {
  if (typeof pdfjsLib === "undefined") {
    // Fallback: read as text (for demo/non-PDF plain text)
    return new Promise(res => {
      const r = new FileReader();
      r.onload = () => res(r.result || "");
      r.readAsText(file);
    });
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const pdf  = await pdfjsLib.getDocument(typedArray).promise;
        let full   = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page  = await pdf.getPage(i);
          const items = await page.getTextContent();
          full += items.items.map(s => s.str).join(" ") + "\n";
        }
        resolve(full);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
}

// ── Skills extraction
function extractSkills(text) {
  const lower = text.toLowerCase();
  return SKILLS_DB.filter(skill => {
    // word-boundary check for short tokens
    const re = new RegExp(`(?<![a-z])${skill.replace(/[+]/g, "\\+")}(?![a-z])`, "i");
    return re.test(lower);
  });
}

// ── TF-IDF helpers
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 1);
}

const STOP_WORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with",
  "is","are","was","were","be","been","has","have","had","do","does","did",
  "will","would","could","should","may","might","shall","can","that","this",
  "it","its","i","we","our","you","your","they","their","he","she","his","her"
]);

function tfidf(docs) {
  const tokenized = docs.map(tokenize);
  const N = docs.length;

  // term frequency per doc
  const tfs = tokenized.map(tokens => {
    const freq = {};
    tokens.forEach(t => { if (!STOP_WORDS.has(t)) freq[t] = (freq[t]||0)+1; });
    const maxF = Math.max(...Object.values(freq), 1);
    Object.keys(freq).forEach(k => freq[k] = freq[k] / maxF);
    return freq;
  });

  // document frequency
  const df = {};
  tfs.forEach(tf => Object.keys(tf).forEach(t => df[t] = (df[t]||0)+1));

  // vocabulary
  const vocab = [...new Set(tokenized.flat().filter(t => !STOP_WORDS.has(t)))];

  // TF-IDF vectors
  return vocab.map(term =>
    tfs.map(tf => {
      const tfv  = tf[term] || 0;
      const idf  = Math.log((N + 1) / ((df[term]||0) + 1)) + 1;
      return tfv * idf;
    })
  ); // shape: [vocab_size, N]  → transpose below
}

function dotProduct(a, b) {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

function magnitude(v) {
  return Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
}

function cosineSimilarity(docs) {
  const matrix = tfidf(docs); // [terms][docs]
  const vA = matrix.map(row => row[0]);
  const vB = matrix.map(row => row[1]);
  const dot = dotProduct(vA, vB);
  const mag = magnitude(vA) * magnitude(vB);
  return mag === 0 ? 0 : dot / mag;
}

// Keyword overlap score
function keywordOverlap(resume, job) {
  const rTokens = new Set(tokenize(resume).filter(t => !STOP_WORDS.has(t)));
  const jTokens = new Set(tokenize(job).filter(t => !STOP_WORDS.has(t)));
  const inter   = [...rTokens].filter(t => jTokens.has(t)).length;
  const union   = new Set([...rTokens, ...jTokens]).size;
  return union === 0 ? 0 : inter / union;
}

// Skill overlap score
function skillOverlapScore(skills, job) {
  if (!skills.length) return 0;
  const lower = job.toLowerCase();
  const matched = skills.filter(s => lower.includes(s));
  return matched.length / skills.length;
}

// ── Analyze
analyzeBtn.addEventListener("click", async () => {
  if (!resumeText || !jobInput.value) return;

  setLoading(true);

  // Simulate slight processing delay for UX
  await new Promise(res => setTimeout(res, 600));

  try {
    const job    = jobInput.value;
    const skills = extractSkills(resumeText);

    const similarity    = cosineSimilarity([resumeText, job]);
    const kwOverlap     = keywordOverlap(resumeText, job);
    const skillScore    = skillOverlapScore(skills, job);

    // Weighted composite
    const score = Math.min(
      100,
      Math.round((similarity * 0.55 + kwOverlap * 0.25 + skillScore * 0.20) * 100)
    );

    renderResults(score, skills, { similarity, kwOverlap, skillScore });
  } catch (err) {
    console.error("Analysis error:", err);
  }

  setLoading(false);
});

function setLoading(loading) {
  const txt  = analyzeBtn.querySelector(".btn-text");
  const ldr  = analyzeBtn.querySelector(".btn-loader");
  const arr  = analyzeBtn.querySelector(".btn-arrow");
  txt.style.display  = loading ? "none" : "";
  ldr.style.display  = loading ? "flex" : "none";
  arr.style.display  = loading ? "none" : "";
  analyzeBtn.disabled = loading;
}

// ── Render results
function renderResults(score, skills, breakdown) {
  resultEmpty.style.display   = "none";
  resultContent.style.display = "flex";

  // Score ring
  const ringFill = document.getElementById("ringFill");
  const circ     = 2 * Math.PI * 52;
  const offset   = circ * (1 - score / 100);
  ringFill.style.strokeDashoffset = offset;

  // Ring color
  if (score >= 75) ringFill.style.stroke = "#38d9a9";
  else if (score >= 50) ringFill.style.stroke = "#f7934f";
  else ringFill.style.stroke = "#fb7185";

  // Animate score number
  animateNumber("scoreNum", 0, score, 1000);
  document.getElementById("thinFill").style.width = score + "%";

  // Verdict
  const labelEl   = document.getElementById("scoreLabel");
  const verdictEl = document.getElementById("scoreVerdict");
  labelEl.textContent = "Match Score";

  if (score >= 75) {
    verdictEl.textContent = "Excellent Match ⭐";
    verdictEl.style.color = "#38d9a9";
  } else if (score >= 50) {
    verdictEl.textContent = "Moderate Match";
    verdictEl.style.color = "#f7934f";
  } else {
    verdictEl.textContent = "Low Match";
    verdictEl.style.color = "#fb7185";
  }

  // Skills
  const cloud = document.getElementById("skillsCloud");
  cloud.innerHTML = "";
  document.getElementById("skillCount").textContent = `${skills.length} found`;

  const palette = [
    ["rgba(79,142,247,0.12)","rgba(79,142,247,0.3)","#4f8ef7"],
    ["rgba(56,217,169,0.12)","rgba(56,217,169,0.3)","#38d9a9"],
    ["rgba(167,139,250,0.12)","rgba(167,139,250,0.3)","#a78bfa"],
    ["rgba(247,147,79,0.12)","rgba(247,147,79,0.3)","#f7934f"],
    ["rgba(251,113,133,0.12)","rgba(251,113,133,0.3)","#fb7185"],
  ];

  if (skills.length === 0) {
    cloud.innerHTML = `<span style="color:var(--text-3);font-size:0.875rem">No recognizable skills detected</span>`;
  } else {
    skills.forEach((skill, i) => {
      const [bg, border, color] = palette[i % palette.length];
      const tag = document.createElement("span");
      tag.className = "skill-tag";
      tag.textContent = skill;
      tag.style.cssText = `background:${bg};border-color:${border};color:${color};animation-delay:${i*0.05}s`;
      cloud.appendChild(tag);
    });
  }

  // Breakdown
  const rows = document.getElementById("breakdownRows");
  rows.innerHTML = "";
  const metrics = [
    { label: "Semantic Similarity", val: breakdown.similarity, color: "#4f8ef7" },
    { label: "Keyword Overlap",     val: breakdown.kwOverlap,  color: "#38d9a9" },
    { label: "Skill Match",         val: breakdown.skillScore, color: "#a78bfa" },
  ];

  metrics.forEach(m => {
    const pct = Math.round(m.val * 100);
    rows.insertAdjacentHTML("beforeend", `
      <div class="breakdown-row">
        <span class="breakdown-label">${m.label}</span>
        <div class="breakdown-bar">
          <div class="breakdown-fill" style="background:${m.color};width:0%" data-target="${pct}"></div>
        </div>
        <span class="breakdown-val">${pct}%</span>
      </div>
    `);
  });

  // Animate breakdown bars
  requestAnimationFrame(() => {
    document.querySelectorAll(".breakdown-fill").forEach(el => {
      el.style.width = el.dataset.target + "%";
    });
  });

  // Recommendation
  const recCard = document.getElementById("recCard");
  recCard.className = "rec-card";
  const recIcon  = document.getElementById("recIcon");
  const recTitle = document.getElementById("recTitle");
  const recBody  = document.getElementById("recBody");

  if (score >= 75) {
    recCard.classList.add("excellent");
    recIcon.textContent  = "🌟";
    recTitle.textContent = "Strong Candidate — Recommend for Interview";
    recBody.textContent  = "This resume demonstrates high alignment with the job requirements. The candidate shows a solid skills match and relevant experience.";
  } else if (score >= 50) {
    recCard.classList.add("average");
    recIcon.textContent  = "⚡";
    recTitle.textContent = "Moderate Fit — Consider for Screening Call";
    recBody.textContent  = "The resume has some relevant skills but may lack certain key qualifications. A screening call could clarify fit further.";
  } else {
    recCard.classList.add("low");
    recIcon.textContent  = "⚠️";
    recTitle.textContent = "Low Match — Not Recommended";
    recBody.textContent  = "Significant gaps exist between this resume and the job requirements. Consider candidates with stronger alignment.";
  }

  // Scroll result into view on mobile
  if (window.innerWidth < 768) {
    document.getElementById("resultContent").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function animateNumber(id, from, to, duration) {
  const el    = document.getElementById(id);
  const start = performance.now();
  function step(now) {
    const t      = Math.min((now - start) / duration, 1);
    const eased  = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Intersection Observer for step cards
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(".step-card, .feature-card").forEach((el, i) => {
  el.style.opacity    = "0";
  el.style.transform  = "translateY(24px)";
  el.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s, border-color 0.25s, box-shadow 0.25s`;
  observer.observe(el);
});

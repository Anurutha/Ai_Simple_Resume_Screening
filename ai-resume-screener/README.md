# 🤖 AI Resume Screening System

A professional, NLP-powered resume analysis and candidate ranking platform. Paste a job description, upload resumes, and instantly get match scores, skill breakdowns, and hiring recommendations.

---

## 📁 File Structure

```
ai-resume-screener/
├── index.html              ← Standalone frontend (HTML/CSS/JS)
├── app.py                  ← Streamlit backend app
├── matcher.py              ← TF-IDF cosine similarity scoring
├── resume_parser.py        ← PDF text extraction (PyPDF2)
├── skills.py               ← Skills database & extraction
├── requirements.txt        ← Python dependencies
└── assets/
    ├── style.css           ← Full CSS (shared by both frontend & Streamlit)
    └── app.js              ← Client-side NLP logic (for HTML frontend)
```

---

## ✨ What's New vs Original

| Feature | Original | Upgraded |
|---|---|---|
| Scoring | TF-IDF cosine only | **Composite: TF-IDF + Keyword Overlap + Skill Match** |
| Skills DB | 26 skills | **60+ skills with word-boundary matching** |
| UI | Basic Streamlit | **Premium HTML/CSS/JS + improved Streamlit** |
| Batch Analysis | ❌ | **✅ Upload multiple resumes, ranked CSV export** |
| Score Breakdown | ❌ | **✅ Per-metric breakdown shown** |
| Dark/Light Mode | ❌ | **✅ Toggle with localStorage persistence** |
| Mobile Responsive | ❌ | **✅ Fully responsive** |
| Client-side NLP | ❌ | **✅ Pure JS NLP (no server needed for HTML version)** |
| Resume Parser | Basic | **Handles encrypted PDFs, multi-page, byte streams** |
| Export | ❌ | **✅ JSON (single) + CSV (batch)** |
| Animations | ❌ | **✅ Score ring, animated bars, scroll reveals** |

---

## 🚀 Setup Instructions

### Option A — HTML Frontend (no Python needed)

1. Clone or download the repo
2. Open `index.html` in a browser
3. ✅ That's it — PDF.js handles parsing entirely in the browser

### Option B — Streamlit Backend

**Requirements:** Python 3.9+

```bash
# 1. Clone the repo
git clone https://github.com/your-username/ai-resume-screener
cd ai-resume-screener

# 2. Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate      # macOS/Linux
venv\Scripts\activate         # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
streamlit run app.py
```

The app opens at `http://localhost:8501`

---

## 📦 Dependencies

```
streamlit>=1.32.0
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
PyPDF2>=3.0.0
```

---

## 🌐 Deployment

### Deploy HTML Frontend to GitHub Pages

```bash
# Push to GitHub repo
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-resume-screener.git
git push -u origin main

# Enable GitHub Pages:
# Settings → Pages → Source: main branch, / (root)
# Your site: https://YOUR_USERNAME.github.io/ai-resume-screener
```

### Deploy HTML Frontend to Netlify

1. Drag-drop the project folder onto [netlify.com/drop](https://app.netlify.com/drop)
2. ✅ Live in 30 seconds

### Deploy HTML Frontend to Vercel

```bash
npm i -g vercel
vercel
```

### Deploy Streamlit App to Streamlit Cloud

1. Push code to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect repo → set `app.py` as entrypoint
4. Click **Deploy**

---

## 🧠 How the Scoring Works

The composite match score is calculated as:

```
Score = (TF-IDF Cosine Similarity × 0.55)
      + (Keyword Jaccard Overlap   × 0.25)
      + (Skill Match Rate          × 0.20)
```

| Metric | Description |
|---|---|
| **TF-IDF Cosine Similarity** | Vectorizes both texts and measures semantic angle |
| **Keyword Overlap** | Jaccard similarity of non-stop-word tokens |
| **Skill Match Rate** | % of resume skills present in the job description |

| Score Range | Verdict |
|---|---|
| 75%+ | ✅ Excellent Candidate |
| 50–74% | ⚡ Average Candidate |
| <50% | ❌ Low Match |

---

## 🔮 Future Enhancements

- [ ] **LLM Integration** — Use Claude/GPT to generate qualitative candidate summaries
- [ ] **Named Entity Recognition** — Extract names, companies, universities automatically
- [ ] **Experience Detection** — Parse years of experience from resume text
- [ ] **ATS Score Simulation** — Check formatting compatibility with ATS systems
- [ ] **Custom Skills Database** — Allow HR teams to define their own skill keywords
- [ ] **Email Notifications** — Send ranked reports to hiring managers automatically
- [ ] **Database Backend** — Store candidates and track pipeline stages
- [ ] **Interview Question Generator** — Auto-generate JD-specific interview questions
- [ ] **Resume Gap Analysis** — Identify missing skills vs job requirements
- [ ] **Multi-language Support** — Parse resumes in Spanish, French, German

---

## 📄 License

MIT — free to use, modify, and distribute.

---

Built by Anurutha · Final Year Project · 2025–2026

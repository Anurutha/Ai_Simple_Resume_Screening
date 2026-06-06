"""
AI Resume Screening System — Streamlit Backend
Improved version with better scoring, batch analysis, and export
"""

import streamlit as st
import pandas as pd
import json
from io import BytesIO

from resume_parser import extract_text
from skills import extract_skills, SKILLS_DATABASE
from matcher import get_score, get_detailed_score


# ── Page config (MUST be first Streamlit call)
st.set_page_config(
    page_title="AI Resume Screening System",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)


# ── Load CSS
def load_css():
    try:
        with open("assets/style.css") as f:
            st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)
    except FileNotFoundError:
        pass  # CSS optional; page still works without it


load_css()


# ── Sidebar
with st.sidebar:
    st.markdown("## ⚙️ Settings")

    score_threshold = st.slider(
        "Excellent Candidate Threshold (%)",
        min_value=50, max_value=90, value=75, step=5,
        help="Candidates above this score are marked as Excellent"
    )

    avg_threshold = st.slider(
        "Average Candidate Threshold (%)",
        min_value=30, max_value=70, value=50, step=5,
        help="Candidates above this score are marked as Average"
    )

    show_breakdown = st.checkbox("Show Score Breakdown", value=True)
    show_word_count = st.checkbox("Show Resume Word Count", value=False)

    st.markdown("---")
    st.markdown("### 📖 How It Works")
    st.markdown("""
    1. **Upload** one or more PDF resumes  
    2. **Paste** the job description  
    3. **Analyze** — NLP extracts skills and computes similarity  
    4. **Review** ranked candidates with detailed scores
    """)

    st.markdown("---")
    st.caption("Built with scikit-learn · TF-IDF · Cosine Similarity")


# ── Header
st.markdown("""
<h1 style='text-align:center;color:#4f8ef7;font-size:2.4rem;font-weight:800;margin-bottom:4px'>
🤖 AI Resume Screening System
</h1>
<p style='text-align:center;color:#8b95b3;font-size:1rem;margin-bottom:32px'>
NLP-Powered Resume Analysis & Candidate Ranking
</p>
""", unsafe_allow_html=True)


# ── Tabs
tab1, tab2 = st.tabs(["📄 Single Resume", "📊 Batch Analysis"])


# ─── TAB 1: Single Resume ───────────────────────────────────────────────
with tab1:
    col1, col2 = st.columns([1, 1], gap="large")

    with col1:
        st.subheader("Job Description")
        job = st.text_area(
            "",
            height=280,
            placeholder="Paste the job description here...\n\nExample: We're looking for a Python developer experienced in machine learning, data pipelines, and cloud infrastructure...",
            key="jd_single"
        )

    with col2:
        st.subheader("Upload Resume (PDF)")
        resume_file = st.file_uploader(
            "",
            type=["pdf"],
            key="resume_single",
            help="Upload a PDF resume for analysis"
        )

    if resume_file and job:
        with st.spinner("🔍 Analyzing resume with NLP..."):
            resume_text = extract_text(resume_file)
            skills      = extract_skills(resume_text)
            result      = get_detailed_score(resume_text, job)
            score       = result["score"]

        st.markdown("---")
        st.subheader("📊 Analysis Results")

        # Score + verdict
        m1, m2, m3 = st.columns(3)
        with m1:
            st.metric("Match Score", f"{score}%")
        with m2:
            st.metric("Skills Found", len(skills))
        with m3:
            if show_word_count:
                word_count = len(resume_text.split())
                st.metric("Resume Words", f"{word_count:,}")
            else:
                st.metric("Keyword Overlap", f"{result.get('keyword_overlap', 0):.1%}")

        # Verdict banner
        if score >= score_threshold:
            st.success(f"✅ Excellent Candidate — Score {score}% exceeds threshold of {score_threshold}%")
        elif score >= avg_threshold:
            st.warning(f"⚡ Average Candidate — Score {score}% is above {avg_threshold}%")
        else:
            st.error(f"❌ Low Match — Score {score}% is below {avg_threshold}%")

        # Score breakdown
        if show_breakdown:
            st.subheader("Score Breakdown")
            breakdown_df = pd.DataFrame({
                "Metric": ["Semantic Similarity (TF-IDF)", "Keyword Overlap", "Skill Match Rate"],
                "Score": [
                    f"{result.get('similarity', 0):.1%}",
                    f"{result.get('keyword_overlap', 0):.1%}",
                    f"{result.get('skill_score', 0):.1%}",
                ],
                "Weight": ["55%", "25%", "20%"]
            })
            st.dataframe(breakdown_df, use_container_width=True, hide_index=True)

        # Skills tags
        st.subheader("Extracted Skills")
        if skills:
            # Skill categories for color coding
            prog_langs = {"python","java","c++","c","c#","ruby","go","rust","swift","kotlin","r","scala"}
            web_tech   = {"html","css","javascript","typescript","react","vue","angular","next","node","svelte"}
            data_ai    = {"machine learning","deep learning","ai","nlp","data analysis","tensorflow","pytorch","pandas","numpy"}
            cloud_ops  = {"docker","kubernetes","aws","azure","gcp","git","linux","ci/cd"}

            cols = st.columns(min(len(skills), 6))
            for i, skill in enumerate(skills):
                col = cols[i % len(cols)]
                if skill in prog_langs:
                    icon = "🐍"
                elif skill in web_tech:
                    icon = "🌐"
                elif skill in data_ai:
                    icon = "🤖"
                elif skill in cloud_ops:
                    icon = "☁️"
                else:
                    icon = "⭐"
                col.markdown(f"`{icon} {skill}`")
        else:
            st.info("No recognizable technical skills found. Check if the resume text is properly formatted.")

        # Raw text preview
        with st.expander("📄 View Extracted Resume Text"):
            st.text_area("", value=resume_text[:3000] + ("..." if len(resume_text) > 3000 else ""),
                         height=200, disabled=True)

        # Export
        export_data = {
            "score": score,
            "verdict": "Excellent" if score >= score_threshold else ("Average" if score >= avg_threshold else "Low"),
            "skills": skills,
            "breakdown": {
                "similarity": result.get("similarity", 0),
                "keyword_overlap": result.get("keyword_overlap", 0),
                "skill_score": result.get("skill_score", 0)
            }
        }
        st.download_button(
            "📥 Download Report (JSON)",
            data=json.dumps(export_data, indent=2),
            file_name=f"resume_report_{resume_file.name.replace('.pdf','')}.json",
            mime="application/json"
        )

    elif resume_file or job:
        if not resume_file:
            st.info("📎 Please upload a PDF resume to continue.")
        if not job:
            st.info("📝 Please paste a job description to continue.")


# ─── TAB 2: Batch Analysis ──────────────────────────────────────────────
with tab2:
    st.subheader("Batch Resume Screening")
    st.caption("Upload multiple resumes at once and rank all candidates automatically.")

    job_batch = st.text_area(
        "Job Description",
        height=180,
        placeholder="Paste the job description here...",
        key="jd_batch"
    )

    resumes_batch = st.file_uploader(
        "Upload Resumes (PDF — select multiple)",
        type=["pdf"],
        accept_multiple_files=True,
        key="resumes_batch"
    )

    if resumes_batch and job_batch:
        if st.button("🚀 Analyze All Resumes", type="primary"):
            results = []
            progress = st.progress(0)
            status   = st.empty()

            for i, r in enumerate(resumes_batch):
                status.text(f"Analyzing: {r.name} ({i+1}/{len(resumes_batch)})")
                try:
                    text   = extract_text(r)
                    skills = extract_skills(text)
                    detail = get_detailed_score(text, job_batch)
                    score  = detail["score"]
                    verdict = (
                        "✅ Excellent" if score >= score_threshold else
                        "⚡ Average"  if score >= avg_threshold  else
                        "❌ Low Match"
                    )
                    results.append({
                        "Rank": 0,
                        "File": r.name,
                        "Score (%)": score,
                        "Verdict": verdict,
                        "Skills Found": len(skills),
                        "Top Skills": ", ".join(skills[:5]) if skills else "—",
                    })
                except Exception as e:
                    results.append({
                        "Rank": 0,
                        "File": r.name,
                        "Score (%)": 0,
                        "Verdict": "⚠️ Parse Error",
                        "Skills Found": 0,
                        "Top Skills": str(e)[:40],
                    })
                progress.progress((i + 1) / len(resumes_batch))

            status.empty()
            progress.empty()

            # Sort by score, add rank
            results.sort(key=lambda x: x["Score (%)"], reverse=True)
            for i, r in enumerate(results):
                r["Rank"] = i + 1

            df = pd.DataFrame(results)
            st.success(f"✅ Analyzed {len(results)} resumes successfully!")
            st.dataframe(df, use_container_width=True, hide_index=True)

            # Export as CSV
            csv = df.to_csv(index=False)
            st.download_button(
                "📥 Download Rankings (CSV)",
                data=csv,
                file_name="candidate_rankings.csv",
                mime="text/csv"
            )

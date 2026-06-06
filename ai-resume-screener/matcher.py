"""
matcher.py — TF-IDF Cosine Similarity + Composite Scoring
"""

import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# Stop words not covered by sklearn
_EXTRA_STOPS = {
    "experience","year","years","required","preferred","ability","strong",
    "work","team","position","role","responsibilities","will","candidate"
}


def _keyword_overlap(text_a: str, text_b: str) -> float:
    """Jaccard similarity of non-stop word tokens."""
    def tokenize(t):
        return set(re.sub(r"[^a-z0-9 ]", " ", t.lower()).split()) - _EXTRA_STOPS
    a, b = tokenize(text_a), tokenize(text_b)
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _skill_overlap(resume: str, job: str, skills: list) -> float:
    """Fraction of resume skills that appear in the job description."""
    if not skills:
        return 0.0
    job_lower = job.lower()
    matched = sum(1 for s in skills if s in job_lower)
    return matched / len(skills)


def get_score(resume: str, job: str) -> float:
    """
    Simple TF-IDF cosine similarity score (0–100).
    Kept for backward compatibility.
    """
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    vectors    = vectorizer.fit_transform([resume, job])
    score      = cosine_similarity(vectors[0], vectors[1])[0][0]
    return round(score * 100, 2)


def get_detailed_score(resume: str, job: str) -> dict:
    """
    Returns a composite score plus individual metric breakdown.

    Weights:
      - TF-IDF cosine similarity : 55%
      - Keyword (Jaccard) overlap : 25%
      - Skill match rate          : 20%
    """
    from skills import extract_skills

    # 1. TF-IDF cosine similarity
    vectorizer  = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    vectors     = vectorizer.fit_transform([resume, job])
    similarity  = float(cosine_similarity(vectors[0], vectors[1])[0][0])

    # 2. Keyword overlap
    kw_overlap  = _keyword_overlap(resume, job)

    # 3. Skill overlap
    skills      = extract_skills(resume)
    skill_score = _skill_overlap(resume, job, skills)

    # 4. Weighted composite
    composite = (
        similarity  * 0.55 +
        kw_overlap  * 0.25 +
        skill_score * 0.20
    )

    return {
        "score"           : min(100, round(composite * 100, 2)),
        "similarity"      : round(similarity, 4),
        "keyword_overlap" : round(kw_overlap, 4),
        "skill_score"     : round(skill_score, 4),
        "skills"          : skills,
    }

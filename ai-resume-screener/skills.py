"""
skills.py — Skills Database & Extraction
Extended to 60+ skills with category awareness
"""

import re

SKILLS_DATABASE = {
    # Programming Languages
    "python", "java", "c++", "c", "c#", "ruby", "go", "rust",
    "swift", "kotlin", "r", "scala", "matlab", "julia",

    # Web Technologies
    "html", "css", "javascript", "typescript", "react", "vue",
    "angular", "next", "nuxt", "svelte", "node", "express",
    "django", "flask", "fastapi", "spring", "laravel", "rails",

    # Databases
    "sql", "mysql", "postgresql", "mongodb", "redis", "cassandra",
    "firebase", "supabase", "sqlite", "elasticsearch",

    # Data Science & AI
    "machine learning", "deep learning", "artificial intelligence",
    "ai", "nlp", "natural language processing", "computer vision",
    "data analysis", "data science", "data engineering",
    "business intelligence", "statistics",

    # Libraries & Frameworks
    "pandas", "numpy", "tensorflow", "pytorch", "keras",
    "sklearn", "scikit-learn", "scipy", "matplotlib", "seaborn",
    "plotly", "opencv", "mediapipe", "huggingface",

    # Visualization & BI
    "power bi", "tableau", "excel", "google sheets", "looker",

    # DevOps & Cloud
    "git", "github", "gitlab", "docker", "kubernetes",
    "aws", "azure", "gcp", "linux", "bash", "ci/cd",
    "terraform", "ansible",

    # Soft Skills
    "leadership", "communication", "problem solving",
    "teamwork", "critical thinking", "agile", "scrum",
}


def extract_skills(text: str) -> list[str]:
    """
    Extract known skills from resume text.
    Uses word-boundary matching to avoid false positives
    (e.g. 'c' matching inside 'science').
    Returns sorted list of found skills.
    """
    text_lower = text.lower()
    found = []

    for skill in SKILLS_DATABASE:
        # For short tokens (≤2 chars), use strict word boundaries
        if len(skill) <= 2:
            pattern = rf"\b{re.escape(skill)}\b"
        else:
            # For multi-word or longer skills, simple substring is fine
            pattern = re.escape(skill)

        if re.search(pattern, text_lower):
            found.append(skill)

    # Sort: multi-word first (more specific), then alphabetically
    found.sort(key=lambda s: (-len(s.split()), s))
    return found

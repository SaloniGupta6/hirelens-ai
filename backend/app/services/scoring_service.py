
import re
from datetime import datetime

from typing import Any

from app.services.candidate_parser import SKILL_KEYWORDS


# =========================================================
# CONFIGURATION
# =========================================================

WEIGHTS = {
    "skills": 60,
    "experience": 25,
    "education": 15,
}

# Variations of a skill are treated as one requirement.
SKILL_GROUPS = {
    "python": ["python", "python3"],
    "javascript": ["javascript", "js", "ecmascript"],
    "typescript": ["typescript", "ts"],
    "react.js": ["react", "react.js", "reactjs"],
    "node.js": ["node", "node.js", "nodejs"],
    "express.js": ["express", "express.js", "expressjs"],
    "fastapi": ["fastapi", "fast api"],
    "rest apis": ["rest api", "rest apis", "restful api", "restful apis"],
    "machine learning": ["machine learning", "ml"],
    "deep learning": ["deep learning", "dl"],
    "natural language processing": ["natural language processing", "nlp"],
    "computer vision": ["computer vision", "cv"],
    "artificial intelligence": ["artificial intelligence", "ai"],
    "scikit-learn": ["scikit-learn", "scikit learn", "sklearn"],
    "tensorflow": ["tensorflow", "tf"],
    "pytorch": ["pytorch", "torch"],
    "sql": ["sql", "structured query language"],
    "mongodb": ["mongodb", "mongo db", "mongo"],
    "postgresql": ["postgresql", "postgres"],
    "mysql": ["mysql"],
    "docker": ["docker", "containerization"],
    "kubernetes": ["kubernetes", "k8s"],
    "git": ["git", "version control"],
    "github": ["github"],
    "html": ["html", "html5"],
    "css": ["css", "css3"],
    "tailwind css": ["tailwind", "tailwind css"],
    "bootstrap": ["bootstrap"],
    "flask": ["flask"],
    "django": ["django"],
    "java": ["java"],
    "c++": ["c++", "cpp"],
    "c#": ["c#", "c sharp"],
    "php": ["php"],
    "ruby": ["ruby"],
    "go": ["golang", "go"],
    "rust": ["rust"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "google cloud": ["google cloud", "gcp"],
    "api integration": ["api integration", "api integrations"],
    "data analysis": ["data analysis", "data analytics"],
    "power bi": ["power bi", "powerbi"],
    "tableau": ["tableau"],
    "excel": ["excel", "microsoft excel"],
    "linux": ["linux"],
    "agile": ["agile"],
}

# Map every alias to its canonical skill name.
SKILL_ALIAS_MAP = {
    alias: canonical
    for canonical, aliases in SKILL_GROUPS.items()
    for alias in aliases
}

# Add parser keywords not explicitly covered above as standalone skills.
for skill in SKILL_KEYWORDS:
    normalized = str(skill).lower().strip()
    SKILL_ALIAS_MAP.setdefault(normalized, normalized)


# Experience requirements are grouped to avoid penalizing synonyms.
EXPERIENCE_GROUPS = {
        "software development": [
    "software developer",
    "software development",
    "programmer",
    "coding",
    "full stack developer",
    "full-stack developer",
    "fullstack developer",
    "web developer",
    "application developer",
],
    "engineering": [
        "engineer", "engineering", "software engineer",
    ],
    "internship": ["intern", "internship", "trainee"],
    "analytical work": ["analyst", "analysis", "analytics"],
    "testing and qa": ["tester", "testing", "qa", "quality assurance"],
    "design": ["designer", "design", "designing"],
    "backend development": ["backend", "back end", "server side"],
    "frontend development": ["frontend", "front end", "client side"],
    "full stack development": ["fullstack", "full stack", "full-stack"],
    "management": ["manager", "management", "lead", "leadership"],
    "consulting": ["consultant", "consulting"],
    "technical support": ["technician", "technical support"],
}

EDUCATION_GROUPS = {
    "bachelor": [
        "bachelor", "bachelors", "bachelor's",
        "b.tech", "btech", "b tech",
        "b.e", "b eng",
        "b.sc", "bsc", "b.a", "ba",
        "undergraduate", "undergrad",
    ],
    "master": [
        "master", "masters", "master's",
        "m.tech", "mtech", "m tech",
        "m.e", "me", "m.sc", "msc",
        "m.a", "ma", "postgraduate", "post graduate",
    ],
    "mba": ["mba", "master of business administration"],
    "phd": ["phd", "ph.d", "doctorate", "doctoral"],
    "diploma": ["diploma"],
    "graduation": ["graduate", "graduation"],
}


# =========================================================
# TEXT NORMALIZATION
# =========================================================

def normalize_text(text: str) -> str:
    text = str(text or "").lower()
    text = text.replace("&", " and ")
    text = re.sub(r"[^a-z0-9+#.\s'-]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_skill(skill: str) -> str:
    skill = normalize_text(skill)
    return SKILL_ALIAS_MAP.get(skill, skill)


def contains_term(text: str, term: str) -> bool:
    text = normalize_text(text)
    term = normalize_text(term)

    if not text or not term:
        return False

    # Match complete terms/phrases, not accidental substrings.
    pattern = (
        r"(?<![a-z0-9])"
        + re.escape(term)
        + r"(?![a-z0-9])"
    )
    return bool(re.search(pattern, text))


def find_group_matches(text: str, groups: dict) -> list[str]:
    text = normalize_text(text)
    matched = []

    for group_name, aliases in groups.items():
        if any(contains_term(text, alias) for alias in aliases):
            matched.append(group_name)

    return sorted(matched)
def parse_experience_duration(date_text: str) -> int | None:
    if not date_text:
        return None

    text = date_text.lower().strip()

    month_map = {
        "jan": 1, "january": 1,
        "feb": 2, "february": 2,
        "mar": 3, "march": 3,
        "apr": 4, "april": 4,
        "may": 5,
        "jun": 6, "june": 6,
        "jul": 7, "july": 7,
        "aug": 8, "august": 8,
        "sep": 9, "september": 9,
        "oct": 10, "october": 10,
        "nov": 11, "november": 11,
        "dec": 12, "december": 12,
    }

    def to_month_index(year, month):
        return year * 12 + month - 1

    # Month/year ranges
    month_range = re.search(
        r"\b([a-z]{3,9})\s*(19\d{2}|20\d{2})\s*"
        r"(?:-|–|—|to)\s*"
        r"([a-z]{3,9})\s*(19\d{2}|20\d{2})\b",
        text,
    )

    if month_range:
        start_month = month_map.get(month_range.group(1))
        start_year = int(month_range.group(2))
        end_month = month_map.get(month_range.group(3))
        end_year = int(month_range.group(4))

        if not start_month or not end_month:
            return None

        start_index = to_month_index(start_year, start_month)
        end_index = to_month_index(end_year, end_month)

        if end_index < start_index:
            return None

        return end_index - start_index

    # Month/year to Present or Current
    ongoing = re.search(
        r"\b([a-z]{3,9})\s*(19\d{2}|20\d{2})\s*"
        r"(?:-|–|—)\s*(present|current)\b",
        text,
    )

    if ongoing:
        start_month = month_map.get(ongoing.group(1))
        start_year = int(ongoing.group(2))

        if not start_month:
            return None

        now = datetime.now()
        start_index = to_month_index(start_year, start_month)
        end_index = to_month_index(now.year, now.month)

        if start_index > end_index:
            return None

        return end_index - start_index

    # Year-only ranges (approximate)
    year_range = re.search(
        r"\b(19\d{2}|20\d{2})\s*(?:-|–|—)\s*(19\d{2}|20\d{2})\b",
        text,
    )

    if year_range:
        start_year = int(year_range.group(1))
        end_year = int(year_range.group(2))

        if end_year < start_year:
            return None

        return (end_year - start_year) * 12

    # A single year cannot establish duration
    return None


# JOB DESCRIPTION ANALYSIS
# =========================================================

def extract_jd_skills(job_description: str) -> list[str]:
    text = normalize_text(job_description)
    found = set()

    # Use the candidate parser's skill vocabulary.
    for skill in SKILL_KEYWORDS:
        if contains_term(text, skill):
            found.add(normalize_skill(skill))

    # Also recognize skill aliases from the equivalence groups.
    for canonical, aliases in SKILL_GROUPS.items():
        if any(contains_term(text, alias) for alias in aliases):
            found.add(canonical)

    return sorted(found)


def extract_jd_experience_terms(job_description: str) -> list[str]:
    return find_group_matches(job_description, EXPERIENCE_GROUPS)


def extract_jd_education_terms(job_description: str) -> list[str]:
    return find_group_matches(job_description, EDUCATION_GROUPS)


def analyze_job_description(job_description: str) -> dict:
    if not job_description or not job_description.strip():
        raise ValueError("Job description cannot be empty.")

    skills = extract_jd_skills(job_description)

    return {
        "job_description": job_description.strip(),
        "required_skills": skills,
        "total_skills_required": len(skills),
        "experience_terms": extract_jd_experience_terms(job_description),
        "education_terms": extract_jd_education_terms(job_description),
    }


# =========================================================
# SKILL MATCHING
# =========================================================

def calculate_skill_match(
    required_skills: list[str],
    candidate_skills: list[str],
) -> dict:
    required = sorted(set(normalize_skill(skill) for skill in required_skills))
    candidate = set(normalize_skill(skill) for skill in candidate_skills)

    matched = sorted(set(required) & candidate)
    missing = sorted(set(required) - set(matched))

    score = (
        round(len(matched) / len(required) * 100, 2)
        if required else 100.0
    )

    return {
        "score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "total_required": len(required),
        "total_matched": len(matched),
    }


# =========================================================
# EXPERIENCE MATCHING
# =========================================================

def calculate_experience_match(
    job_description: str,
    candidate_experience: list[dict],
) -> dict:
    jd_groups = find_group_matches(
        job_description, EXPERIENCE_GROUPS
    )

    experience_text = " ".join(
        str(item.get("role", "")) + " "
        + str(item.get("description", ""))
        for item in candidate_experience
    )

    candidate_groups = find_group_matches(
        experience_text, EXPERIENCE_GROUPS
    )

    matched = sorted(set(jd_groups) & set(candidate_groups))
    missing = sorted(set(jd_groups) - set(matched))

    keyword_score = (
        round(len(matched) / len(jd_groups) * 100, 2)
        if jd_groups else None
    )

    duration_records = []
    known_months = []

    for item in candidate_experience:
        duration = parse_experience_duration(
            str(item.get("year", ""))
        )

        duration_records.append({
            "role": item.get("role", ""),
            "date_range": item.get("year", ""),
            "duration_months": duration,
        })

        if duration is not None:
            known_months.append(duration)

    total_known_months = sum(known_months)

    return {
        "score": keyword_score,
        "matched_terms": matched,
        "missing_terms": missing,
        "experience_entries": len(candidate_experience),
        "duration_analysis": {
            "entries": duration_records,
            "total_known_months": total_known_months,
            "total_known_years": round(total_known_months / 12, 2),
            "duration_confidence": (
                "estimated" if known_months else "unknown"
            ),
        },
    }


# =========================================================
# EDUCATION MATCHING
# =========================================================

def calculate_education_match(
    job_description: str,
    candidate_education: list[dict],
) -> dict:
    required = find_group_matches(
        job_description, EDUCATION_GROUPS
    )

    candidate_text = " ".join(
        str(item.get("details", ""))
        for item in candidate_education
    )
    candidate_groups = find_group_matches(
        candidate_text, EDUCATION_GROUPS
    )

    matched = sorted(set(required) & set(candidate_groups))
    missing = sorted(set(required) - set(matched))

    score = (
    round(len(matched) / len(required) * 100, 2)
    if required else None
)

    return {
        "score": score,
        "matched_requirements": matched,
        "missing_requirements": missing,
        "requirements_found": len(required),
    }


# =========================================================
# OVERALL CANDIDATE SCORING
# =========================================================

def score_candidate(
    job_description: str,
    candidate: dict[str, Any],
) -> dict:
    if not job_description or not job_description.strip():
        raise ValueError("Job description cannot be empty.")

    candidate_skills = candidate.get("skills", [])
    candidate_experience = candidate.get("experience", [])
    candidate_education = candidate.get("education", [])

    skill_result = calculate_skill_match(
        extract_jd_skills(job_description),
        candidate_skills,
    )

    experience_result = calculate_experience_match(
        job_description,
        candidate_experience,
    )

    education_result = calculate_education_match(
        job_description,
        candidate_education,
    )

    category_results = {
        "skills": skill_result,
        "experience": experience_result,
        "education": education_result,
    }

    applicable_weights = {
        "skills": len(skill_result["matched_skills"]) + len(skill_result["missing_skills"]) > 0,
        "experience": len(extract_jd_experience_terms(job_description)) > 0,
        "education": len(extract_jd_education_terms(job_description)) > 0,
    }

    active_weight_total = sum(
        WEIGHTS[key]
        for key, is_applicable in applicable_weights.items()
        if is_applicable
    )

    overall_score = (
        round(
            sum(
                category_results[key]["score"] * WEIGHTS[key]
                for key, is_applicable in applicable_weights.items()
                if is_applicable
            ) / active_weight_total,
            2,
        )
        if active_weight_total > 0
        else None
    )

    return {
        "candidate_name": candidate.get(
            "candidate_name", "Unknown Candidate"
        ),
        "filename": candidate.get("filename"),
        "original_filename": candidate.get("original_filename"),
        "overall_score": overall_score,
                "score_breakdown": {
            "skills": {
                "score": skill_result["score"] if applicable_weights["skills"] else None,
                "weight": round(WEIGHTS["skills"] / active_weight_total * 100, 2) if applicable_weights["skills"] else 0,
                "weighted_score": round(skill_result["score"] * WEIGHTS["skills"] / active_weight_total, 2) if applicable_weights["skills"] else 0,
            },
            "experience": {
                "score": experience_result["score"] if applicable_weights["experience"] else None,
                "weight": round(WEIGHTS["experience"] / active_weight_total * 100, 2) if applicable_weights["experience"] else 0,
                "weighted_score": round(experience_result["score"] * WEIGHTS["experience"] / active_weight_total, 2) if applicable_weights["experience"] else 0,
            },
            "education": {
                "score": education_result["score"] if applicable_weights["education"] else None,
                "weight": round(WEIGHTS["education"] / active_weight_total * 100, 2) if applicable_weights["education"] else 0,
                "weighted_score": round(education_result["score"] * WEIGHTS["education"] / active_weight_total, 2) if applicable_weights["education"] else 0,
            },
        },
        "matched_skills": skill_result["matched_skills"],
        "missing_skills": skill_result["missing_skills"],
        "experience_analysis": experience_result,
        "education_analysis": education_result,
    }


# =========================================================
# CANDIDATE RANKING
# =========================================================

def rank_candidates(
    job_description: str,
    candidates: list[dict[str, Any]],
) -> list[dict]:
    scored_candidates = [
        score_candidate(job_description, candidate)
        for candidate in candidates
    ]

    scored_candidates.sort(
        key=lambda item: item["overall_score"],
        reverse=True,
    )

    for rank, candidate in enumerate(scored_candidates, start=1):
        candidate["rank"] = rank

    return scored_candidates

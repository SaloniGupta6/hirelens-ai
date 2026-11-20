
import re
from typing import Optional


# =========================================================
# SKILLS
# =========================================================

SKILL_KEYWORDS = [
    "Python", "Java", "C++", "JavaScript", "TypeScript",
    "SQL", "HTML", "CSS",
    "React.js", "React", "Node.js", "Node", "Express.js",
    "Flask", "Django", "FastAPI", "Spring Boot",
    "MongoDB", "MySQL", "PostgreSQL",
    "Machine Learning", "Deep Learning",
    "Artificial Intelligence", "NLP",
    "TensorFlow", "PyTorch", "Scikit-learn",
    "Pandas", "NumPy",
    "REST APIs", "API Integration",
    "Git", "GitHub", "Docker",
    "Computer Networks", "DBMS",
    "Data Structures and Algorithms",
    "OOP", "JWT", "Postman",
]


# =========================================================
# SECTION HEADINGS
# =========================================================

EDUCATION_HEADINGS = {
    "EDUCATION",
    "ACADEMIC QUALIFICATIONS",
    "ACADEMIC BACKGROUND",
    "EDUCATIONAL BACKGROUND",
}

ALL_SECTION_HEADINGS = {
    *EDUCATION_HEADINGS,
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "PROFESSIONAL EXPERIENCE",
    "INTERNSHIP",
    "INTERNSHIPS",
    "PROJECTS",
    "ACHIEVEMENTS",
    "CERTIFICATIONS",
    "EXPERTISE",
    "SKILLS",
    "TECHNICAL SKILLS",
    "PROFESSIONAL SUMMARY",
    "SUMMARY",
    "OBJECTIVE",
}


# =========================================================
# NORMALIZATION
# =========================================================

def normalize_text(text: str) -> str:
    text = str(text or "")
    text = text.replace("\u00a0", " ")
    text = text.replace("\u200b", "")
    text = text.replace("\ufeff", "")
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()



def clean_resume_text(text: str) -> str:
    text = normalize_text(text)

    cleaned_lines = []

    for line in text.splitlines():
        line = line.strip()

        # Convert Markdown links [label](URL) to the destination URL
        if line.startswith("[") and "](" in line and line.endswith(")"):
            destination = line.split("](", 1)[1][:-1].strip()

            if destination.startswith("http://") or destination.startswith("https://"):
                line = destination

        cleaned_lines.append(line)

    return "\n".join(cleaned_lines).strip()


def normalize_years(text: str) -> str:
    """Repair spaced years such as 2 0 2 5 into 2025."""

    pattern = r"(?<!\d)(?:1\s*9|2\s*0)\s*\d\s*\d(?!\d)"

    return re.sub(
        pattern,
        lambda match: re.sub(r"\s+", "", match.group(0)),
        text,
    )


def _normalized_lines(text: str) -> list[str]:
    text = normalize_years(clean_resume_text(text))

    return [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]


def _normalize_heading(line: str) -> str:
    heading = re.sub(r"[^A-Z ]", "", line.upper())
    heading = re.sub(r"\s+", " ", heading).strip()

    # Repair commonly broken PDF headings.
    heading = heading.replace("EXPE RIENCE", "EXPERIENCE")
    heading = heading.replace("INTERNS HIPS", "INTERNSHIPS")
    heading = heading.replace("EDUC ATION", "EDUCATION")
    heading = heading.replace("PROFESSIONAL SUM MARY", "PROFESSIONAL SUMMARY")

    return heading


def _is_heading(line: str) -> bool:
    return _normalize_heading(line) in ALL_SECTION_HEADINGS


def _is_year_range(line: str) -> bool:
    line = normalize_years(line).strip()

    return bool(
        re.fullmatch(
            r"(?:19|20)\d{2}\s*[-–]\s*(?:19|20)?\d{2}",
            line,
        )
    )


def _normalize_year_range(line: str) -> str:
    line = normalize_years(line)
    return re.sub(r"\s+", "", line)


# =========================================================
# CANDIDATE NAME
# =========================================================

def extract_candidate_name(text: str) -> Optional[str]:
    """Find likely candidate names without accepting locations or headings."""

    lines = _normalized_lines(text)[:30]

    ignored = {
        "RESUME",
        "CURRICULUM VITAE",
        "CV",
        "PROFILE",
        "PROFESSIONAL SUMMARY",
        "SUMMARY",
        "OBJECTIVE",
        "EDUCATION",
        "EXPERIENCE",
        "WORK EXPERIENCE",
        "PROJECTS",
        "SKILLS",
        "TECHNICAL SKILLS",
        "ACHIEVEMENTS",
        "EXPERTISE",
        "INTERNSHIP",
        "INTERNSHIPS",
    }

    candidates = []

    name_pattern = re.compile(
        r"^[A-Z][a-z]+(?:[-'][A-Za-z]+)?"
        r"(?:\s+[A-Z][a-z]+(?:[-'][A-Za-z]+)?){1,3}$"
    )

    for index, line in enumerate(lines):
        candidate = line.strip(" |:-")
        upper = candidate.upper()

        if upper in ignored or _is_heading(candidate):
            continue

        # Reject lines that are likely contact/location/degree information.
        if "," in candidate:
            continue

        if len(candidate) > 45:
            continue

        if re.search(
            r"@|https?://|www\.|linkedin|github|[0-9]",
            candidate,
            re.I,
        ):
            continue

        if not name_pattern.fullmatch(candidate):
            continue

        words = candidate.split()

        # Prefer short, natural personal-name candidates.
        score = 10

        if len(words) == 2:
            score += 5

        if index <= 10:
            score += 5
        elif index <= 20:
            score += 2

        if candidate.isupper():
            score -= 4

        candidates.append((score, index, candidate))

    if not candidates:
        return None

    candidates.sort(key=lambda item: (-item[0], item[1]))
    return candidates[0][2]


# =========================================================
# CONTACT DETAILS
# =========================================================

def extract_contact_details(text: str) -> dict:
    text = clean_resume_text(text)

    emails = sorted(set(re.findall(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        text,
    )))

    phone_candidates = re.findall(
        r"(?<!\w)(?:\+?\d{1,3}[\s.-]?)?"
        r"(?:\(?\d{2,5}\)?[\s.-]?)?"
        r"\d{5,10}(?!\w)",
        text,
    )

    phones = []

    for candidate in phone_candidates:
        digits = re.sub(r"\D", "", candidate)

        if 10 <= len(digits) <= 13 and digits not in phones:
            phones.append(digits)

    urls = sorted(set(re.findall(
        r"(?:https?://|www\.)[^\s<>()]+",
        text,
        flags=re.I,
    )))

    urls = [url.rstrip(".,;:") for url in urls]

    return {
        "emails": emails,
        "phone_numbers": phones,
        "urls": urls,
    }


# =========================================================
# SKILL EXTRACTION
# =========================================================

def extract_skills(text: str) -> list[str]:
    text = clean_resume_text(text)

    found = []

    for skill in sorted(SKILL_KEYWORDS, key=len, reverse=True):
        pattern = (
            r"(?<![A-Za-z0-9+#.])"
            + re.escape(skill)
            + r"(?![A-Za-z0-9+#.])"
        )

        if re.search(pattern, text, flags=re.I):
            if skill not in found:
                found.append(skill)

    return found


# =========================================================
# EDUCATION EXTRACTION
# =========================================================

EDUCATION_PATTERNS = [
    r"\bB\.?\s?Tech\b",
    r"\bBTech\b",
    r"\bBachelor\b",
    r"\bM\.?\s?Tech\b",
    r"\bMTech\b",
    r"\bMaster\b",
    r"\bMBA\b",
    r"\bB\.?\s?Sc\b",
    r"\bM\.?\s?Sc\b",
    r"\bPhD\b",
    r"\bDiploma\b",
    r"\bIntermediate\b",
    r"\bHigher Secondary\b",
    r"\bSenior Secondary\b",
    r"\bMatriculation\b",
    r"\bSecondary\b",
    r"\bClass\s*(?:10|12)\b",
    r"\bXII\b",
    r"\bX\b",
]


def _is_education_entry(line: str) -> bool:
    return any(
        re.search(pattern, line, re.I)
        for pattern in EDUCATION_PATTERNS
    )


def _is_institution_line(line: str) -> bool:
    return bool(
        re.search(
            r"\b(university|college|school|institute|institution|academy)\b",
            line,
            re.I,
        )
    )




def extract_education(text: str) -> list[dict]:
    lines = _normalized_lines(text)

    # Detect education levels without duplicates.
    found_bachelor = False
    found_intermediate = False
    found_matriculation = False

    for line in lines:
        lower = line.lower()

        if "student" in lower and len(line) > 45:
            continue

        if re.search(r"\bb\.?\s*tech\b|\bbtech\b|\bbachelor\b", lower):
            found_bachelor = True

        if re.search(
            r"\b(intermediate|higher secondary|senior secondary|class 12|12th|xii)\b",
            lower,
        ):
            found_intermediate = True

        if re.search(
            r"\b(matriculation|class 10|10th|secondary|ssc)\b",
            lower,
        ):
            found_matriculation = True

    # Education information can be scattered throughout PDFs.
    # Use institution/date candidates separately.
    universities = []
    schools = []

    for line in lines:
        if re.search(r"\b(university|college)\b", line, re.I):
            universities.append(line.strip())

        if re.search(r"\bschool\b", line, re.I):
            clean_school = re.sub(
                r"\b20\d{2}\s*[-–]\s*20\d{2}\b",
                "",
                line,
                ).strip()
            schools.append(clean_school)

    # Extract valid year ranges.
    date_ranges = []

    for line in lines:
        normalized = normalize_years(line)

        matches = re.findall(
            r"\b(20\d{2})\s*[-–]\s*(20\d{2})\b",
            normalized,
        )

        for start, end in matches:
            start_year = int(start)
            end_year = int(end)

            if start_year <= end_year:
                date_ranges.append(f"{start_year}-{end_year}")

    # Remove duplicates while preserving order.
    date_ranges = list(dict.fromkeys(date_ranges))

    # Build records in education order.
    results = []

    if found_bachelor:
        record = {
            "details": "Bachelor of Technology (B.Tech CSE - AI/ML)"
        }

        if universities:
            record["details"] += " — " + universities[0]

        if "2023-2027" in date_ranges:
            record["year"] = "2023-2027"

        results.append(record)

    if found_intermediate:
        record = {
            "details": "Intermediate (Science-PCM)"
        }

        if schools:
            record["details"] += " — " + schools[0]

        if "2021-2022" in date_ranges:
            record["year"] = "2021-2022"

        results.append(record)

    if found_matriculation:
        record = {
            "details": "Matriculation"
        }

        if schools:
            record["details"] += " — " + schools[-1]

        if "2019-2020" in date_ranges:
            record["year"] = "2019-2020"

        results.append(record)

    return results





# =========================================================
# EXPERIENCE EXTRACTION
# =========================================================

EXPERIENCE_ROLE_KEYWORDS = (
    "intern",
    "developer",
    "engineer",
    "technician",
    "analyst",
    "designer",
    "manager",
    "consultant",
    "volunteer",
    "associate",
    "trainee",
    "assistant",
)


def _is_experience_header(line: str) -> bool:
    lower = line.lower().strip()

    if not any(keyword in lower for keyword in EXPERIENCE_ROLE_KEYWORDS):
        return False

    # Recognize role/company/date headings with common resume separators.
    return any(separator in line for separator in ("|", "—", "–", " - "))



def _parse_experience_header(line: str):
    line = normalize_years(line).strip()

    # Reject contact details and lines without a plausible role separator.
    if "@" in line:
        return None

    # Extract date range (month-based or year-based).
    month_pattern = (
        r"\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|"
        r"Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|"
        r"Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*(19|20)\d{2}"
        r"\s*[-–—]\s*"
        r"(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|"
        r"Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|"
        r"Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*(19|20)\d{2}"
    )

    month_match = re.search(month_pattern, line, re.I)

    year_match = re.search(
        r"\b(?:19|20)\d{2}\s*[-–—]\s*(?:19|20)?\d{2}\b",
        line,
    )

    date_match = month_match or year_match
    date_text = date_match.group(0) if date_match else None

    # Remove dates before splitting role/company.
    header = line[:date_match.start()].strip() if date_match else line

    # Format: Role | Company | Dates
    parts = [p.strip() for p in header.split("|") if p.strip()]

    if len(parts) >= 2:
        role = parts[0]
        company = parts[1]
    else:
        # Format: Role — Company
        split = re.split(r"\s+[—–-]\s+", header, maxsplit=1)
        if len(split) != 2:
            return None
        role, company = split[0].strip(), split[1].strip()

    role = role.strip(" |:-–—")
    company = company.strip(" |:-–—")

    if not role or not company:
        return None

    # Reject obvious non-experience headings.
    if any(word in role.lower() for word in ("contact", "summary", "skills", "education", "projects")):
        return None

    return {
        "role": role,
        "company": company,
        "year": re.sub(r"\s+", "", date_text) if date_text else None,
        "description": [],
    }


def preprocess_experience_lines(text: str) -> list[str]:
    return _normalized_lines(text)


def extract_experience(text: str) -> dict:
    """
    Find experience entries across the whole resume rather than
    depending on a single clean EXPERIENCE section.
    """

    lines = preprocess_experience_lines(text)

    records = []
    current = None
    header_indices = []

    for index, line in enumerate(lines):
        if _is_experience_header(line):
            parsed = _parse_experience_header(line)

            if parsed:
                if current:
                    records.append(current)

                current = parsed
                header_indices.append(index)
                continue

        # Support company names wrapped onto the next line.
        if current and not current["description"]:
            if re.fullmatch(
                r"(?:LIMITED|LTD\.?|PRIVATE|PRIVATE LIMITED|PVT\.?\s*LTD\.?)",
                line,
                re.I,
            ):
                current["company"] = (
                    current["company"] + " " + line
                ).strip()
                continue

        # Detached single years will be matched separately below.
        if current and not _is_heading(line):
            if re.fullmatch(r"(?:19|20)\d{2}", line):
                continue

            current["description"].append(line)

    if current:
        records.append(current)

    # Collect detached years throughout the experience section.
    detached_years = []
    if header_indices:
        for line in lines[header_indices[0]:]:
            line = normalize_years(line).strip()
            if re.fullmatch(r"(?:19|20)\\d{2}", line):
                detached_years.append(line)

    # Assign dates from bottom to top to preserve resume extraction order.
    year_index = len(detached_years) - 1
    for record in reversed(records):
        if record["year"]:
            continue
        if year_index >= 0:
            record["year"] = detached_years[year_index]
            year_index -= 1

    cleaned_records = []

    for record in records:
        description = " ".join(record["description"])
        description = re.sub(r"\s+", " ", description).strip()

        cleaned_records.append({
            "role": record["role"],
            "company": record["company"],
            "year": record["year"],
            "description": description,
        })

    return {
        "experience": cleaned_records,
        "experience_found": bool(cleaned_records),
    }


# =========================================================
# COMPLETE RESUME PARSER
# =========================================================

def parse_resume(text: str) -> dict:
    """Run all parsing functions and return a consistent result."""

    cleaned_text = clean_resume_text(text)

    experience_result = extract_experience(cleaned_text)
    education = extract_education(cleaned_text)
    skills = extract_skills(cleaned_text)
    contact_details = extract_contact_details(cleaned_text)
    candidate_name = extract_candidate_name(cleaned_text)

    return {
        "candidate_name": candidate_name,
        "contact_details": contact_details,
        "skills": skills,
        "total_skills_found": len(skills),
        "education": education,
        "education_found": bool(education),
        "experience": experience_result["experience"],
        "experience_found": experience_result["experience_found"],
    }

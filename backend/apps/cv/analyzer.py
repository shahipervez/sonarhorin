"""CV / Resume judge for Bangladeshi freshers.

score (0-100)  →  rejection probability (%)  +  a report of strengths and fixes.

Rule-based so it works offline and is explainable. If an Anthropic key is set,
an LLM adds rewrite suggestions on top (apps.core.ai).
"""
import io
import math
import re

from pypdf import PdfReader

# ----------------------------------------------------------------- extraction

def extract_text(file_obj, filename: str):
    """Returns (text, page_count)."""
    name = filename.lower()
    data = file_obj.read()
    if name.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(data))
        return "\n".join((p.extract_text() or "") for p in reader.pages), len(reader.pages)
    if name.endswith(".docx"):
        import docx

        d = docx.Document(io.BytesIO(data))
        parts = [p.text for p in d.paragraphs]
        for t in d.tables:
            for row in t.rows:
                parts.append(" | ".join(c.text for c in row.cells))
        text = "\n".join(parts)
        return text, max(1, round(len(text.split()) / 450))
    if name.endswith(".txt"):
        text = data.decode("utf-8", errors="ignore")
        return text, max(1, round(len(text.split()) / 450))
    raise ValueError("Upload a PDF, DOCX or TXT file.")


# ----------------------------------------------------------------- knowledge

SECTIONS = {
    "summary": [r"\b(career )?objective\b", r"\bsummary\b", r"\bprofile\b", r"\babout me\b"],
    "education": [r"\beducation\b", r"\bacademic\b", r"\bqualification"],
    "skills": [r"\bskills?\b", r"\btechnical skills\b", r"\bcompetenc"],
    "projects": [r"\bprojects?\b", r"\bthesis\b", r"\bcapstone\b"],
    "experience": [r"\bexperience\b", r"\binternships?\b", r"\bemployment\b", r"\bwork history\b"],
    "certifications": [r"\bcertifications?\b", r"\bcertificates?\b", r"\bcourses?\b", r"\btrainings?\b"],
    "achievements": [r"\bachievements?\b", r"\bawards?\b", r"\bhonou?rs?\b", r"\bcompetitions?\b"],
    "activities": [r"\bextra[- ]?curricular\b", r"\bvolunteer", r"\bclubs?\b", r"\bleadership\b", r"\bactivities\b"],
}
SECTION_LABEL = {
    "summary": "Career objective / summary", "education": "Education", "skills": "Skills", "projects": "Projects",
    "experience": "Experience / internships", "certifications": "Certifications / courses",
    "achievements": "Achievements / awards", "activities": "Extracurricular / volunteering",
}

KEYWORDS = {
    "CSE": ["python", "java", "c++", "javascript", "react", "django", "node", "sql", "mysql", "postgresql", "git", "github",
            "rest api", "data structures", "algorithms", "oop", "linux", "docker", "machine learning", "html", "css",
            "flutter", "aws", "testing", "agile"],
    "EEE": ["matlab", "simulink", "plc", "scada", "autocad", "proteus", "pspice", "power system", "circuit", "arduino",
            "microcontroller", "embedded", "pcb", "substation", "transformer", "renewable", "solar", "control system",
            "etap", "telecom", "networking", "safety"],
    "BBA": ["excel", "power bi", "tableau", "marketing", "digital marketing", "sales", "finance", "accounting",
            "financial analysis", "budget", "supply chain", "hr", "recruitment", "crm", "presentation", "negotiation",
            "market research", "sql", "erp", "sap", "communication", "customer service"],
    "English": ["content writing", "copywriting", "editing", "proofreading", "seo", "research", "social media",
                "communication", "presentation", "translation", "ielts", "teaching", "creative writing", "wordpress",
                "canva", "public speaking"],
    "Pharmacy": ["gmp", "quality control", "quality assurance", "hplc", "regulatory", "pharmacology", "formulation",
                 "validation", "documentation", "sop", "clinical", "microbiology", "dissolution", "stability",
                 "pharmacovigilance", "spectroscopy"],
    "Textile": ["merchandising", "garments", "knitting", "dyeing", "spinning", "weaving", "quality control",
                "industrial engineering", "compliance", "costing", "lean", "production planning", "fabric",
                "sample", "buyer communication", "erp"],
    "Other": ["excel", "communication", "presentation", "teamwork", "problem solving", "research", "microsoft office",
              "customer service", "data entry", "time management", "leadership", "english"],
}
SOFT = ["teamwork", "leadership", "communication", "problem solving", "time management", "presentation", "adaptab"]

ACTION_VERBS = ["developed", "built", "designed", "led", "created", "implemented", "managed", "organized",
                "improved", "increased", "reduced", "analyzed", "launched", "achieved", "coordinated", "trained",
                "automated", "delivered", "conducted", "won", "published", "optimized", "researched", "deployed"]

WEAK_PHRASES = {
    "hard[- ]?working": "“Hardworking” is a claim, not proof — show it with a result instead.",
    "responsible for": "Replace “responsible for” with an action verb + result (e.g. “Built…”, “Led…”).",
    "team player": "“Team player” is generic — name the team project and your part in it.",
    "quick learner": "“Quick learner” — prove it: “Learned React in 3 weeks to ship X”.",
    "dynamic environment": "“Dynamic environment” is filler — cut it.",
    "to work in a challenging": "Objective lines like “to work in a challenging environment…” are ignored by recruiters. Write what YOU offer.",
    "references? available upon request": "Drop “References available upon request” — it wastes a line.",
}

# Personal info common in Bangladeshi CVs that recruiters and ATS don't need
OVERSHARE = {
    "father'?s name": "Father's name", "mother'?s name": "Mother's name", "religion": "Religion",
    "marital status": "Marital status", "blood group": "Blood group", "nid": "NID number",
    "nationality": "Nationality", "date of birth|\\bdob\\b": "Date of birth", "height": "Height", "weight": "Weight",
    "permanent address": "Permanent address",
}

EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
PHONE = re.compile(r"(\+?880[\s-]?|0)1[3-9]\d{2}[\s-]?\d{6}")
LINKEDIN = re.compile(r"linkedin\.com/in/", re.I)
GITHUB = re.compile(r"github\.com/", re.I)
CGPA = re.compile(r"(?:cgpa|gpa)\s*[:\-]?\s*([0-4]\.\d{1,2})", re.I)
NUMBER_RESULT = re.compile(r"\b\d+(\.\d+)?\s*(%|percent|\+|k\b|users|students|clients|members|hours|days|weeks|months|projects|times|x\b|tk|bdt|৳)", re.I)
FIRST_PERSON = re.compile(r"\b(i|me|my)\b", re.I)


def _has(patterns, text):
    return any(re.search(p, text, re.I) for p in patterns)


# ----------------------------------------------------------------- scoring

def analyze(text: str, pages: int, major: str = "CSE", target_role: str = "") -> dict:
    t = text or ""
    low = t.lower()
    words = re.findall(r"[A-Za-z][A-Za-z+#.\-]*", t)
    wc = len(words)
    strengths, fixes = [], []
    checks = []  # (name, earned, possible)

    def fix(priority, section, title, tip, example=""):
        fixes.append({"priority": priority, "section": section, "title": title, "tip": tip, "example": example})

    # 0. Readability by ATS
    if wc < 25:
        fix("critical", "Format", "Your CV text could not be read",
            "Applicant-tracking systems read text, not pictures. Your file looks image-based or nearly empty, so most "
            "companies' software would auto-reject it. Export from Word/Google Docs as a text PDF.")
        ats = 0
    else:
        ats = 10
        strengths.append("The CV is machine-readable — ATS software can parse it.")
    checks.append(("ATS readable", ats, 10))

    # 1. Contact
    c = 0
    has_email, has_phone = bool(EMAIL.search(t)), bool(PHONE.search(t))
    has_li, has_gh = bool(LINKEDIN.search(t)), bool(GITHUB.search(t))
    c += 4 if has_email else 0
    c += 3 if has_phone else 0
    c += 2 if has_li else 0
    c += 1 if (has_gh or major != "CSE") else 0
    if not has_email:
        fix("critical", "Header", "No email address found", "Put a professional email at the top (firstname.lastname@gmail.com).")
    if not has_phone:
        fix("high", "Header", "No Bangladeshi phone number found", "Add a reachable number in the format +880 1XXXXXXXXX.")
    if not has_li:
        fix("medium", "Header", "Add your LinkedIn", "Recruiters in BD check LinkedIn before calling. Add linkedin.com/in/yourname.")
    if major == "CSE" and not has_gh:
        fix("high", "Header", "Add your GitHub", "For CSE roles, a GitHub link with 2–3 real projects matters more than a long CV.")
    if has_email and has_phone and has_li:
        strengths.append("Complete contact header (email, phone, LinkedIn).")
    checks.append(("Contact details", c, 10))

    # 2. Sections
    found = {k: _has(v, low) for k, v in SECTIONS.items()}
    weights = {"education": 4, "skills": 4, "projects": 4, "experience": 3, "summary": 2, "certifications": 1,
               "achievements": 1, "activities": 1}
    s = sum(w for k, w in weights.items() if found[k])
    checks.append(("Key sections", s, 20))
    for k in ("education", "skills", "projects"):
        if not found[k]:
            fix("high", SECTION_LABEL[k], f"Missing “{SECTION_LABEL[k]}” section",
                {"education": "List degree, university, CGPA and passing year — newest first.",
                 "skills": "Group skills: Technical / Tools / Soft skills. Only list what you can be tested on.",
                 "projects": "Freshers win on projects. Add 2–3 with what you built, the tools, and a result."}[k])
    if not found["experience"]:
        fix("medium", "Experience", "No internship / experience section",
            "No internship yet? Add part-time work, tuition, club roles, freelancing or volunteer work — it all counts.")
    if found["projects"] and found["skills"]:
        strengths.append("Has both Skills and Projects — exactly what fresher recruiters look for.")
    if found["certifications"]:
        strengths.append("Certifications/courses listed — good signal of self-learning.")

    # 3. Keywords for major / role
    kw = KEYWORDS.get(major, KEYWORDS["Other"])
    role_words = [w for w in re.findall(r"[a-z+#]+", target_role.lower()) if len(w) > 2]
    found_kw = [k for k in kw if k in low]
    missing_kw = [k for k in kw if k not in low]
    ratio = len(found_kw) / max(1, len(kw))
    k_score = round(min(1, ratio / 0.45) * 20)
    checks.append(("Role keywords", k_score, 20))
    if ratio >= 0.35:
        strengths.append(f"Strong keyword match for {major} roles ({len(found_kw)} relevant terms).")
    else:
        fix("high", "Skills", f"Low keyword match for {major} roles",
            "Companies filter CVs by keywords. Add the tools you actually know from the missing list, inside your "
            "Skills and Projects (not just as a list).",
            ", ".join(missing_kw[:8]))
    role_hit = [w for w in role_words if w in low]
    if role_words and len(role_hit) < max(1, len(role_words) // 2):
        fix("medium", "Summary", f"Your CV doesn't mention the target role “{target_role}”",
            "Mirror the job title in your summary line so both ATS and recruiters see the fit.",
            f"“Fresh {major} graduate aiming for a {target_role} role, with hands-on …”")

    # 4. Impact: numbers + action verbs
    nums = len(NUMBER_RESULT.findall(t))
    verbs = sorted({v for v in ACTION_VERBS if re.search(rf"\b{v}\b", low)})
    impact = min(8, nums * 2) + min(7, len(verbs))
    checks.append(("Impact & results", impact, 15))
    if nums >= 3:
        strengths.append(f"Uses numbers to show results ({nums} quantified points).")
    else:
        fix("high", "Projects / Experience", "Show results with numbers",
            "Recruiters spend ~7 seconds per CV; numbers stop the eye. Add scale, % or time saved to each bullet.",
            "“Built a Django attendance app used by 120 students; cut manual work by 70%.”")
    if len(verbs) >= 5:
        strengths.append("Bullets start with strong action verbs (" + ", ".join(verbs[:5]) + ").")
    else:
        fix("medium", "Projects / Experience", "Start bullets with action verbs",
            "Use Built, Led, Designed, Improved, Analyzed… instead of “I did” or “Responsible for”.")

    # 5. Education quality
    e = 5
    m = CGPA.search(t)
    cg = float(m.group(1)) if m else None
    if cg is None:
        fix("medium", "Education", "CGPA not found", "Many BD employers filter by CGPA. Write it clearly: “CGPA 3.45 / 4.00”.")
        e = 2
    elif cg >= 3.5:
        strengths.append(f"Competitive CGPA ({cg:.2f}).")
        e = 10
    elif cg >= 3.0:
        e = 7
    else:
        e = 4
        fix("medium", "Education", "CGPA is below many company cut-offs (3.00)",
            "Balance it: lead with projects, certifications and skills; put Education after them.")
    checks.append(("Education", e, 10))

    # 6. Length & polish
    p = 15
    if wc and wc < 250:
        p -= 5
        fix("medium", "Overall", "CV is too thin", f"Only ~{wc} words. Aim for 350–700 words on one page for a fresher.")
    elif wc > 900 or pages > 2:
        p -= 5
        fix("medium", "Overall", "CV is too long", "Freshers should fit on 1 page (2 at most). Cut school-level details and repeated skills.")
    else:
        strengths.append("Good length for a fresher CV.")
    weak_found = [(k, msg) for k, msg in WEAK_PHRASES.items() if re.search(k, low)]
    for k, msg in weak_found[:4]:
        fix("low", "Wording", "Generic phrase detected", msg)
    p -= min(5, len(weak_found) * 2)
    fp = len(FIRST_PERSON.findall(t))
    if fp > 6:
        p -= 3
        fix("low", "Wording", "Too many “I / my”", "CV bullets drop the pronoun: “Built X” not “I built X”.")
    over = [label for pat, label in OVERSHARE.items() if re.search(pat, low)]
    if over:
        p -= min(5, len(over))
        fix("medium", "Personal info", "Remove unnecessary personal details",
            "Modern recruiters don't need these and they take space from your skills: " + ", ".join(over) + ".")
    checks.append(("Length & polish", max(0, p), 15))

    # soft skills
    soft = [s for s in SOFT if s in low]

    score = sum(a for _, a, _ in checks)
    possible = sum(b for _, _, b in checks)
    score = round(score / possible * 100)

    # logistic map: 50 → ~62% rejection, 80 → ~20%, 95 → ~7%
    rejection = round(100 / (1 + math.exp((score - 58) / 11)))
    rejection = max(3, min(97, rejection))
    verdict = ("Shortlist-ready" if score >= 80 else "Almost there" if score >= 65 else
               "At risk of rejection" if score >= 45 else "Likely rejected")

    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    fixes.sort(key=lambda f: order[f["priority"]])

    return {
        "score": score,
        "rejection_probability": rejection,
        "verdict": verdict,
        "breakdown": [{"name": n, "earned": a, "possible": b} for n, a, b in checks],
        "strengths": strengths,
        "improvements": fixes,
        "sections": [{"key": k, "label": SECTION_LABEL[k], "present": v} for k, v in found.items()],
        "keywords": {"found": found_kw, "missing": missing_kw[:12]},
        "soft_skills": soft,
        "recommended_order": ["Header (name, phone, email, LinkedIn/GitHub)", "Summary (2 lines, target role)",
                              "Skills", "Projects", "Experience / internships", "Education",
                              "Certifications", "Achievements & activities"],
        "stats": {"words": wc, "pages": pages, "quantified_points": nums, "action_verbs": len(verbs), "cgpa": cg},
        "ai_suggestions": [],
    }


def ai_enrich(report: dict, text: str, major: str, target_role: str) -> dict:
    """Optional LLM pass: concrete bullet rewrites. Silent no-op without a key."""
    from apps.core import ai

    if not ai.enabled():
        return report
    data = ai.complete_json(
        "You are a senior recruiter in Bangladesh reviewing a fresh graduate's CV. Be specific and kind.",
        f"Major: {major}\nTarget role: {target_role or 'any fresher role'}\n\nCV text:\n{text[:6000]}\n\n"
        'Return {"suggestions":[{"before":"weak line from the CV","after":"stronger rewrite","why":"short reason"}],'
        '"summary_line":"a 2-line summary they could use"} with 3-5 suggestions.',
    )
    if data:
        report["ai_suggestions"] = data.get("suggestions", [])[:5]
        if data.get("summary_line"):
            report["ai_summary_line"] = data["summary_line"]
    return report

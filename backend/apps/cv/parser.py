"""Pull profile fields out of a CV so sign-up fills itself in.

Rule-based (works offline); when ANTHROPIC_API_KEY is set an LLM pass fills gaps.
Returns {"fields": {...}, "found": [field names], "confidence": {field: 0..1}}.
"""
import re
from datetime import date

from .analyzer import CGPA, EMAIL, KEYWORDS

PHONE_ANY = re.compile(r"(?:\+?88[\s-]?)?0?1[3-9][\d\s-]{8,11}")
LINKEDIN = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[A-Za-z0-9_\-%]+/?", re.I)
GITHUB = re.compile(r"(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9_\-]+/?", re.I)
YEAR = re.compile(r"\b(20[12]\d)\b")
UNI = re.compile(r"(university|college|institute|polytechnic|\bBUET\b|\bRUET\b|\bKUET\b|\bCUET\b|\bSUST\b|\bIUBAT\b|\bNSU\b|\bBRAC\b|\bAIUB\b|\bEWU\b|\bIUT\b|\bBUTEX\b|\bDU\b|varsity)", re.I)
SECTION = re.compile(r"^\s*(education|academic|skills?|technical skills|projects?|experience|certifications?|languages?|achievements?|references?|objective|summary|profile|contact)\b", re.I)
SKIP_NAME = re.compile(r"(curriculum|vitae|resume|résumé|\bcv\b|@|http|www\.|\d{4}|objective|summary|profile|contact|address|phone|email)", re.I)

MAJOR_RULES = [
    ("CSE", r"computer science|\bcse\b|software engineering|information technology|\bict\b|computer engineering"),
    ("EEE", r"electrical|electronic|\beee\b|\bete\b|telecommunication"),
    ("Pharmacy", r"pharmacy|b\.?\s?pharm|pharmaceutical"),
    ("Textile", r"textile|apparel|fashion design|\bbutex\b"),
    ("English", r"\benglish\b(?! (?:proficiency|language|medium))|english literature|linguistics"),
    ("BBA", r"\bbba\b|\bmba\b|business administration|\bfinance\b|marketing|accounting|management studies|human resource"),
]

ALL_SKILLS = sorted({k for v in KEYWORDS.values() for k in v}, key=len, reverse=True)


def _title(s):
    return " ".join(w if w.isupper() and len(w) <= 3 else w.capitalize() for w in s.split())


def _clean_phone(raw):
    d = re.sub(r"\D", "", raw)
    if d.startswith("880"):
        d = d[3:]
    if d.startswith("1") and len(d) == 10:
        d = "0" + d
    return f"+880 {d[1:5]} {d[5:]}" if len(d) == 11 and d.startswith("01") else None


def _section(lines, names):
    """Lines under a heading like 'Education' until the next heading."""
    out, on = [], False
    for ln in lines:
        m = SECTION.match(ln)
        if m:
            on = m.group(1).lower().rstrip("s") in names
            rest = ln[m.end():].strip(" :-|•")
            if on and rest:
                out.append(rest)
            continue
        if on:
            out.append(ln)
    return out


def parse_cv_text(text: str) -> dict:
    t = text or ""
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in t.splitlines()]
    lines = [ln for ln in lines if ln]
    f, conf = {}, {}

    if (m := EMAIL.search(t)):
        f["email"] = m.group(0).lower().rstrip(".")
        conf["email"] = 1.0
    for m in PHONE_ANY.finditer(t):
        p = _clean_phone(m.group(0))
        if p:
            f["phone"], conf["phone"] = p, 0.95
            break
    if (m := LINKEDIN.search(t)):
        u = m.group(0)
        f["linkedin"] = u if u.startswith("http") else "https://" + u
        conf["linkedin"] = 1.0
    if (m := GITHUB.search(t)):
        u = m.group(0)
        f["github"] = u if u.startswith("http") else "https://" + u
        conf["github"] = 1.0

    # name: first short, letters-only line near the top
    for ln in lines[:8]:
        clean = re.sub(r"[^A-Za-zঀ-৿ .'-]", "", ln).strip()
        words = clean.split()
        if 2 <= len(words) <= 5 and not SKIP_NAME.search(ln) and len(clean) >= len(ln) * 0.8 and not SECTION.match(ln):
            f["full_name"], conf["full_name"] = _title(clean), 0.8
            break

    edu = _section(lines, {"education", "academic"}) or lines
    edu_text = " ".join(edu)
    for ln in edu:
        if UNI.search(ln):
            # keep the institution part of "BSc in CSE, IUBAT — CGPA 3.6 (2026)"
            parts = [p.strip() for p in re.split(r"[,|–—\-•]| at ", ln) if UNI.search(p)]
            name = (parts[0] if parts else ln)
            name = re.sub(r"\(.*?\)|\b(cgpa|gpa)\b.*$|\b20\d\d\b.*$", "", name, flags=re.I).strip(" ,:-")
            if 3 <= len(name) <= 120:
                f["university"], conf["university"] = name, 0.75
                break
    for major, pat in MAJOR_RULES:
        if re.search(pat, edu_text, re.I):
            f["major"], conf["major"] = major, 0.85
            break
    else:
        for major, pat in MAJOR_RULES:
            if re.search(pat, t, re.I):
                f["major"], conf["major"] = major, 0.5
                break

    years = [int(y) for y in YEAR.findall(edu_text)]
    this = date.today().year
    years = [y for y in years if 2012 <= y <= this + 3]
    if years:
        f["graduation_year"], conf["graduation_year"] = max(years), 0.7
    if (m := CGPA.search(t)):
        f["cgpa"], conf["cgpa"] = float(m.group(1)), 0.95

    # skills: the Skills section if present, else known keywords anywhere
    skills = []
    sec = _section(lines, {"skill", "technical skill"})
    if sec:
        for ln in sec[:8]:
            ln = re.sub(r"^[A-Za-z /&]{2,30}:\s*", "", ln)  # "Languages: Python, ..." → items
            skills += [s.strip(" .•-") for s in re.split(r"[,;|•·/]", ln) if 1 < len(s.strip(" .•-")) <= 30]
    low = re.sub(r"\S+\.(?:com|org|io|dev)\S*", " ", t.lower())  # don't read 'github' out of a profile URL
    for k in ALL_SKILLS:
        have = [x.lower() for x in skills]
        if any(k in h for h in have):  # "excel" inside "ms excel", "java" inside "javascript"
            continue
        if re.search(rf"(?<![a-z0-9+#]){re.escape(k)}(?![a-z0-9+#])", low):
            skills.append(k.upper() if len(k) <= 3 else k.title())
    seen, uniq = set(), []
    for s in skills:
        if s.lower() not in seen:
            seen.add(s.lower()); uniq.append(s)
    if uniq:
        f["skills"], conf["skills"] = uniq[:18], 0.8 if sec else 0.6

    return {"fields": f, "found": sorted(f), "confidence": conf}


def ai_fill(result: dict, text: str) -> dict:
    """Optional LLM pass for fields the rules missed."""
    from apps.core import ai

    missing = [k for k in ("full_name", "university", "major", "graduation_year", "skills") if k not in result["fields"]]
    if not ai.enabled() or not missing:
        return result
    data = ai.complete_json(
        "Extract profile fields from a Bangladeshi graduate's CV.",
        f"CV:\n{text[:6000]}\n\nReturn JSON with any of: full_name, university, major (one of CSE, EEE, BBA, English, Pharmacy, Textile, Other), "
        "graduation_year (int), skills (list of up to 15 strings). Omit unknown fields.",
        max_tokens=500,
    ) or {}
    for k in missing:
        if data.get(k):
            result["fields"][k] = data[k]
            result["confidence"][k] = 0.7
    result["found"] = sorted(result["fields"])
    return result


def portfolio_sections(text: str) -> dict:
    """Projects / experience / summary lines from a CV — used to pre-fill the portfolio website."""
    lines = [re.sub(r"\s+", " ", ln).strip(" •-–·*") for ln in (text or "").splitlines()]
    lines = [ln for ln in lines if ln]

    def items(names, limit):
        out = []
        for ln in _section(lines, names):
            if len(ln) < 12 or SECTION.match(ln):
                continue
            title, _, rest = ln.partition(" - ") if " - " in ln else ln.partition(": ")
            if not rest:
                # "Campus food ordering app with React and Django …" → short title + the full line
                words = ln.split()
                title, rest = " ".join(words[:5]).rstrip(",."), ln
            out.append({"title": title.strip()[:80], "desc": rest.strip()[:300]})
            if len(out) >= limit:
                break
        return out

    summary = " ".join(_section(lines, {"objective", "summary", "profile"})[:3])[:400]
    return {"projects": items({"project"}, 6), "experience": items({"experience"}, 4), "about": summary}

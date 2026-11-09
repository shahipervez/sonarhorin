"""Career AI engine.

Every public function returns a usable result with or without an Anthropic key:
Claude does the writing when available; a deterministic rule engine takes over otherwise.

Truthfulness rules (enforced in code, not just in the prompt):
* a tailored CV may re-order, re-phrase and emphasise — it may not add employers, schools, dates or skills
  that the master CV doesn't contain (`_guard_truth`);
* missing job keywords are reported as *gaps to close*, never silently added.
"""
import json
import re
from collections import Counter

from apps.core import ai
from apps.cv import parser as cvparser
from apps.cv.analyzer import ACTION_VERBS, SECTIONS

# --------------------------------------------------------------------------- vocabulary
EXTRA_TERMS = [
    "typescript", "next.js", "nextjs", "vue", "angular", "tailwind", "redux", "fastapi", "flask", "spring", "laravel", "php",
    "kotlin", "swift", "android", "ios", "react native", "graphql", "rest", "microservices", "kubernetes", "ci/cd", "jenkins",
    "terraform", "azure", "gcp", "firebase", "mongodb", "redis", "elasticsearch", "kafka", "pandas", "numpy", "scikit-learn",
    "tensorflow", "pytorch", "nlp", "deep learning", "computer vision", "llm", "data analysis", "data visualization",
    "statistics", "etl", "airflow", "spark", "figma", "ui/ux", "ux", "unit testing", "selenium", "jira", "scrum",
    "problem solving", "teamwork", "leadership", "time management", "stakeholder management", "critical thinking",
    "attention to detail", "english", "bangla", "ms office", "microsoft excel", "google sheets", "powerpoint",
    "content marketing", "google analytics", "facebook ads", "lead generation", "b2b", "kpi", "reporting",
    "inventory", "procurement", "logistics", "auditing", "taxation", "ifrs", "quickbooks", "tally", "autocad",
    "solidworks", "revit", "plc", "embedded systems", "iot", "networking", "ccna", "cybersecurity", "linux",
]
VOCAB = sorted({*cvparser.ALL_SKILLS, *EXTRA_TERMS}, key=len, reverse=True)
STOP = set("""a an the and or of to in for on with at by from as is are be will you your our we they this that it
must should able ability strong good excellent knowledge experience years year plus preferred required requirement
requirements responsibilities responsibility candidate candidates role job work working team skills skill using use
including etc other new well within across into about least minimum relevant related fresh freshers graduate degree
bsc msc bba mba any basic understanding familiarity hands""".split())
BULLET = re.compile(r"^\s*(?:[-*•▪●◦‣·–]|\d{1,2}[.)])\s+")
YEARISH = re.compile(r"((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?(19|20)\d{2}\s*(?:[-–—to]+\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?((19|20)\d{2}|present|current|now))?", re.I)
DEGREE = re.compile(r"\b(b\.?\s?sc|m\.?\s?sc|bachelor|master|bba|mba|b\.?\s?a|m\.?\s?a|hsc|ssc|a[- ]?level|o[- ]?level|diploma|ph\.?d|b\.?\s?pharm|llb)\b", re.I)
RESULT = re.compile(r"\b(?:cgpa|gpa)\s*[:\-]?\s*(\d\.\d{1,2})(?:\s*/\s*\d(?:\.\d+)?)?", re.I)


def _norm(s):
    return re.sub(r"\s+", " ", (s or "").lower()).strip()


def _has_term(text_low: str, term: str) -> bool:
    return re.search(rf"(?<![a-z0-9+#]){re.escape(term)}(?![a-z0-9+#])", text_low) is not None


CAPS = {"sql": "SQL", "kpi": "KPI", "power bi": "Power BI", "rest api": "REST API", "ui/ux": "UI/UX", "ci/cd": "CI/CD",
        "javascript": "JavaScript", "typescript": "TypeScript", "next.js": "Next.js", "node": "Node.js", "github": "GitHub",
        "postgresql": "PostgreSQL", "mysql": "MySQL", "mongodb": "MongoDB", "graphql": "GraphQL", "fastapi": "FastAPI",
        "pytorch": "PyTorch", "tensorflow": "TensorFlow", "scikit-learn": "scikit-learn", "ios": "iOS", "nlp": "NLP",
        "llm": "LLM", "seo": "SEO", "crm": "CRM", "erp": "ERP", "sap": "SAP", "hplc": "HPLC", "gmp": "GMP", "plc": "PLC",
        "ms office": "MS Office", "autocad": "AutoCAD", "solidworks": "SolidWorks", "ielts": "IELTS", "c++": "C++"}


def pretty(term: str) -> str:
    t = (term or "").strip()
    if t.lower() in CAPS:
        return CAPS[t.lower()]
    if len(t) <= 3 and t.isalpha():
        return t.upper()
    return t if any(c.isupper() for c in t) else t.title()


def _clip(s, n):
    s = (s or "").strip()
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


# --------------------------------------------------------------------------- profile schema
EMPTY_PROFILE = {
    "name": "", "headline": "", "summary": "",
    "contact": {"email": "", "phone": "", "location": "", "linkedin": "", "github": "", "website": ""},
    "skills": [], "experience": [], "projects": [], "education": [],
    "certifications": [], "achievements": [], "languages": [],
}


def normalize_profile(p) -> dict:
    """Coerce any dict (AI output, user edits) into the exact profile shape with sane limits."""
    p = p if isinstance(p, dict) else {}
    out = json.loads(json.dumps(EMPTY_PROFILE))
    out["name"] = _clip(str(p.get("name", "")), 80)
    out["headline"] = _clip(str(p.get("headline", "")), 140)
    out["summary"] = _clip(str(p.get("summary", "")), 900)
    c = p.get("contact") if isinstance(p.get("contact"), dict) else {}
    for k in out["contact"]:
        out["contact"][k] = _clip(str(c.get(k, "") or ""), 160)

    def strs(v, n, ln=160):
        return [_clip(str(x), ln) for x in (v or []) if str(x).strip()][:n] if isinstance(v, list) else []

    out["skills"] = strs(p.get("skills"), 30, 40)
    for k in ("certifications", "achievements", "languages"):
        out[k] = strs(p.get(k), 12)
    for e in (p.get("experience") or [])[:10]:
        if isinstance(e, dict):
            out["experience"].append({"role": _clip(str(e.get("role", "")), 100), "org": _clip(str(e.get("org", "")), 100),
                                      "period": _clip(str(e.get("period", "")), 40), "location": _clip(str(e.get("location", "")), 60),
                                      "bullets": strs(e.get("bullets"), 8, 260)})
    for pr in (p.get("projects") or [])[:10]:
        if isinstance(pr, dict):
            out["projects"].append({"name": _clip(str(pr.get("name", "")), 100), "tech": _clip(str(pr.get("tech", "")), 140),
                                    "link": _clip(str(pr.get("link", "")), 160), "bullets": strs(pr.get("bullets"), 6, 260)})
    for ed in (p.get("education") or [])[:6]:
        if isinstance(ed, dict):
            out["education"].append({k: _clip(str(ed.get(k, "")), 140) for k in ("degree", "institution", "period", "result")})
    return out


def profile_text(p: dict) -> str:
    """Flatten a profile back into plain text (for scoring and prompts)."""
    p = normalize_profile(p)
    parts = [p["name"], p["headline"], p["summary"], ", ".join(p["skills"])]
    for e in p["experience"]:
        parts += [f'{e["role"]} {e["org"]} {e["period"]}', *e["bullets"]]
    for pr in p["projects"]:
        parts += [f'{pr["name"]} {pr["tech"]}', *pr["bullets"]]
    for ed in p["education"]:
        parts.append(" ".join(ed.values()))
    parts += p["certifications"] + p["achievements"] + p["languages"]
    return "\n".join(x for x in parts if x)


# --------------------------------------------------------------------------- resume → profile
def _section_of(line: str):
    """Is this line a section header like 'EDUCATION' or 'Technical Skills:'? → section key."""
    if len(line) > 40 or BULLET.match(line) or re.search(r":\s*\S", line):
        return None
    clean = re.sub(r"[^a-z &/-]", "", line.lower()).strip()
    if not clean or len(clean.split()) > 4:
        return None
    if clean in ("languages", "language", "language proficiency", "language skills"):
        return "languages"
    for key, pats in SECTIONS.items():
        if any(re.search(p, clean) for p in pats):
            return key
    return None


def _items(lines):
    """Group lines into items: a header line followed by bullet lines."""
    items, cur = [], None
    for ln in lines:
        if BULLET.match(ln):
            if cur is None:
                cur = {"head": "", "bullets": []}
                items.append(cur)
            cur["bullets"].append(BULLET.sub("", ln).strip())
        elif cur is not None and not cur["bullets"] and len(ln) < 90 and not YEARISH.fullmatch(ln.strip()):
            cur["head"] += " | " + ln  # second header line (e.g. company + dates)
        elif len(ln) >= 90 and cur is not None:
            cur["bullets"].append(ln.strip())
        else:
            cur = {"head": ln, "bullets": []}
            items.append(cur)
    return items


def _split_head(head):
    period = ""
    if (m := YEARISH.search(head)):
        period = m.group(0).strip()
        head = head.replace(m.group(0), " ")
    bits = [b.strip(" ,|–—-:()") for b in re.split(r"\s+(?:at|@)\s+|\s[|–—]\s|\s-\s|,|\|", head) if b.strip(" ,|–—-:()")]
    return bits, period


def heuristic_profile(text: str) -> dict:
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in (text or "").splitlines()]
    lines = [ln for ln in lines if ln]
    fields = cvparser.parse_cv_text(text)["fields"]
    sections, cur = {"_top": []}, "_top"
    for ln in lines:
        key = _section_of(ln)
        if key:
            cur = key
            sections.setdefault(cur, [])
            continue
        m = re.match(r"^([A-Za-z &/-]{3,30}):\s*(.+)$", ln)  # inline header: "Skills: Python, SQL"
        if m and (k2 := _section_of(m.group(1))):
            cur = k2
            sections.setdefault(cur, []).append(m.group(2))
            continue
        sections.setdefault(cur, []).append(ln)

    p = json.loads(json.dumps(EMPTY_PROFILE))
    p["name"] = fields.get("full_name", "")
    for k_src, k_dst in (("email", "email"), ("phone", "phone"), ("linkedin", "linkedin"), ("github", "github")):
        p["contact"][k_dst] = fields.get(k_src, "")
    top = [ln for ln in sections.get("_top", []) if ln != p["name"] and not re.search(r"@|\+?\d{6,}|linkedin|github", ln, re.I)]
    if top and len(top[0]) < 90:
        p["headline"] = top[0]
    p["summary"] = " ".join(sections.get("summary", []))[:900]

    skills = list(fields.get("skills", []))
    for ln in sections.get("skills", []):
        ln = re.sub(r"^[A-Za-z /&]{2,30}:\s*", "", BULLET.sub("", ln))
        skills += [s.strip(" .") for s in re.split(r"[,;|•·/]", ln) if 1 < len(s.strip(" .")) <= 40]
    seen = set()
    p["skills"] = [s for s in skills if not (s.lower() in seen or seen.add(s.lower()))][:30]

    for it in _items(sections.get("experience", [])):
        if len(it["head"]) > 70 and re.search(r"\s[—–]\s|:\s", it["head"]):
            head, rest = re.split(r"\s[—–]\s|:\s", it["head"], maxsplit=1)
            it = {"head": head, "bullets": [rest.strip(), *it["bullets"]]}
        bits, period = _split_head(it["head"])
        if not bits and not it["bullets"]:
            continue
        p["experience"].append({"role": bits[0] if bits else "", "org": bits[1] if len(bits) > 1 else "", "period": period,
                                "location": bits[2] if len(bits) > 2 else "", "bullets": it["bullets"][:8]})
    proj_items = []
    for it in _items(sections.get("projects", [])):
        if not it["head"].strip() and len(it["bullets"]) > 1:  # a bare list → one project per bullet
            for b in it["bullets"]:
                nm = re.sub(r"^(built|developed|designed|created|made|implemented|wrote)\s+(an?\s+|the\s+)?", "", b, flags=re.I)
                nm = re.split(r"[;,.]|\s(?:used|that|which|to|for|and deployed|with)\s", nm)[0]
                proj_items.append({"head": " ".join(nm.split()[:6]).strip().capitalize(), "bullets": [b]})
        else:
            proj_items.append(it)
    for it in proj_items:
        head = it["head"]
        tech = ""
        if (m := re.search(r"[(\[]([^)\]]{3,120})[)\]]|[:|–—]\s*(.{3,120})$", head)):
            tech = (m.group(1) or m.group(2) or "").strip()
            head = head[: m.start()].strip()
        link = (re.search(r"https?://\S+|github\.com/\S+", " ".join([it["head"], *it["bullets"]])) or [""])[0]
        if head or it["bullets"]:
            p["projects"].append({"name": head[:100] or "Project", "tech": tech, "link": link, "bullets": it["bullets"][:6]})
    edu_lines = sections.get("education", [])
    i = 0
    while i < len(edu_lines):
        ln = edu_lines[i]
        if DEGREE.search(ln) or cvparser.UNI.search(ln):
            ed = {"degree": "", "institution": "", "period": "", "result": ""}
            block = " | ".join(edu_lines[i:i + 3])
            if (m := DEGREE.search(block)):
                seg = [s for s in re.split(r"\s\|\s|,", block) if DEGREE.search(s)]
                ed["degree"] = (seg[0] if seg else m.group(0)).strip()[:140]
            seg = [s for s in re.split(r"\s\|\s|,|–|—", block) if cvparser.UNI.search(s)]
            ed["institution"] = seg[0].strip()[:140] if seg else ""
            if (m := YEARISH.search(block)):
                ed["period"] = m.group(0).strip()
            if (m := RESULT.search(block)):
                ed["result"] = f"CGPA {m.group(1)}"
            if ed["degree"] or ed["institution"]:
                p["education"].append(ed)
            i += 2
        else:
            i += 1
    for key in ("certifications", "achievements", "languages"):
        p[key] = [BULLET.sub("", ln)[:160] for ln in sections.get(key, [])][:12]
    return normalize_profile(p)


PROFILE_SYSTEM = """You convert a CV into structured JSON for a careers platform in Bangladesh.
Return exactly this shape: {"name":"","headline":"","summary":"","contact":{"email":"","phone":"","location":"",
"linkedin":"","github":"","website":""},"skills":[""],"experience":[{"role":"","org":"","period":"","location":"",
"bullets":[""]}],"projects":[{"name":"","tech":"","link":"","bullets":[""]}],"education":[{"degree":"","institution":"",
"period":"","result":""}],"certifications":[""],"achievements":[""],"languages":[""]}
Copy facts exactly as written. Do not invent anything. Internships and part-time jobs go in experience."""


def build_profile(text: str):
    """CV text → (profile, used_ai)."""
    data = ai.complete_json(PROFILE_SYSTEM, ai.untrusted("resume", text), max_tokens=2500)
    if isinstance(data, dict) and (data.get("skills") or data.get("experience") or data.get("education")):
        prof = normalize_profile(data)
        base = heuristic_profile(text)
        for k in ("email", "phone"):  # regex is more reliable for contact details
            prof["contact"][k] = prof["contact"][k] or base["contact"][k]
        return prof, True
    return heuristic_profile(text), False


# --------------------------------------------------------------------------- job → keywords
def job_keywords(job_text: str, limit: int = 24):
    low = _norm(job_text)
    counts = Counter()
    for term in VOCAB:
        n = len(re.findall(rf"(?<![a-z0-9+#]){re.escape(term)}(?![a-z0-9+#])", low))
        if n:
            if any(term != t and term in t and _has_term(low, t) for t in VOCAB if len(t) > len(term)):
                n = max(0, n - 1)  # "java" inside "javascript" etc.
            if n:
                counts[term] += n
    for line in (job_text or "").splitlines():
        boost = 2 if re.search(r"\b(must|required|mandatory|need)\b", line, re.I) else 1
        for term in list(counts):
            if _has_term(line.lower(), term):
                counts[term] += boost - 1
        for tok in re.findall(r"\b[A-Z][A-Za-z0-9.+#/-]{1,20}\b", line):  # acronyms / product names
            t = tok.lower().strip(".")
            if (tok.isupper() and 2 <= len(tok) <= 6 or re.search(r"[.+#/]|\d", tok)) and t not in STOP and not t.isdigit():
                counts[t] += 1
    ranked = [t for t, _ in counts.most_common()]
    multi = [t for t in ranked if " " in t]
    ranked = [t for t in ranked if " " in t or not any(re.search(rf"(?<![a-z]){re.escape(t)}(?![a-z])", m) for m in multi)]
    return ranked[:limit]


def keyword_match(profile: dict, keywords):
    low = _norm(profile_text(profile))
    matched = [k for k in keywords if _has_term(low, k)]
    missing = [k for k in keywords if k not in matched]
    return matched, missing


def ats_score(profile: dict, keywords) -> int:
    """0–100: keyword coverage (60) + prominence of top keywords up front (20) + structure (20)."""
    p = normalize_profile(profile)
    matched, _ = keyword_match(p, keywords)
    cov = len(matched) / max(1, len(keywords)) if keywords else 0.6
    top = keywords[:8]
    front = _norm(" ".join([p["headline"], p["summary"], " ".join(p["skills"][:10])]))
    prom = sum(1 for k in top if _has_term(front, k)) / max(1, len(top)) if top else 0.5
    struct = sum([
        5 if p["summary"] else 0, 4 if len(p["skills"]) >= 5 else 0,
        5 if (p["experience"] or p["projects"]) else 0, 3 if p["education"] else 0,
        3 if (p["contact"]["email"] and p["contact"]["phone"]) else 0,
    ])
    verbs = sum(1 for b in [*[x for e in p["experience"] for x in e["bullets"]], *[x for pr in p["projects"] for x in pr["bullets"]]]
                if b.split()[0:1] and b.split()[0].lower().rstrip("ed") in {v.rstrip("ed") for v in ACTION_VERBS})
    struct = min(20, struct + min(3, verbs))
    return max(5, min(99, round(cov * 60 + prom * 20 + struct)))


# --------------------------------------------------------------------------- CV tailoring
TAILOR_SYSTEM = """You are an expert CV writer and ATS specialist helping a fresh graduate in Bangladesh apply for one job.
Rewrite the candidate's CV for this job. Rules:
- Use ONLY facts in the CV. You may re-order sections/items, choose what to emphasise, tighten wording,
  start bullets with strong action verbs and mirror the job's vocabulary WHERE the CV supports it.
- Never add employers, schools, dates, certifications, metrics or skills the CV doesn't show.
- Headline: one line aimed at this role. Summary: 2–3 sentences, specific, no clichés.
- Skills: most relevant first (max 16). Bullets: max 4 per item, each under 30 words.
- cover_letter: 180–240 words, addressed to the hiring team at the company, warm and specific, signed with the candidate's name.
Return JSON: {"content": <profile JSON in the same shape as the input, plus "cover_letter": "">,
"changes": [{"section": "", "what": "", "why": ""}], "tips": ["how to close a gap honestly, max 4"]}"""


def _relevance(text, keywords):
    low = _norm(text)
    return sum(1 for k in keywords if _has_term(low, k))


def _guard_truth(original: dict, tailored: dict, keywords):
    """Drop anything the model added that the master CV can't back up. Returns (profile, warnings)."""
    warnings = []
    src_low = _norm(profile_text(original))
    orgs = {_norm(e["org"]) for e in original["experience"] if e["org"]}
    schools = {_norm(e["institution"]) for e in original["education"] if e["institution"]}

    keep = []
    for s in tailored["skills"]:
        if _has_term(src_low, _norm(s)) or any(_norm(s) in _norm(o) or _norm(o) in _norm(s) for o in original["skills"]):
            keep.append(s)
        else:
            warnings.append(f"Removed “{s}” from skills — it isn't in your CV. Add it only if you really have it.")
    tailored["skills"] = keep

    if orgs and any(e["org"] and not any(_norm(e["org"]) in o or o in _norm(e["org"]) for o in orgs) for e in tailored["experience"]):
        tailored["experience"] = original["experience"]
        warnings.append("Kept your original experience entries — the rewrite changed an employer name.")
    if schools and any(e["institution"] and not any(_norm(e["institution"]) in s or s in _norm(e["institution"]) for s in schools)
                       for e in tailored["education"]):
        tailored["education"] = original["education"]
    for k in ("name",):
        tailored[k] = original[k] or tailored[k]
    tailored["contact"] = {k: original["contact"][k] or tailored["contact"].get(k, "") for k in original["contact"]}
    tailored["certifications"] = [c for c in tailored["certifications"] if any(_norm(c)[:18] in _norm(o) or _norm(o)[:18] in _norm(c) for o in original["certifications"])] or original["certifications"]
    return tailored, warnings


def _fallback_tailor(p: dict, job_title: str, company: str, keywords):
    t = json.loads(json.dumps(p))
    matched, missing = keyword_match(p, keywords)
    order = {k: i for i, k in enumerate(keywords)}

    def skill_rank(s):
        sl = _norm(s)
        hits = [order[k] for k in matched if k in sl or sl in k]
        return (0, min(hits)) if hits else (1, 0)

    t["skills"] = sorted(p["skills"], key=skill_rank)[:16]
    for e in t["experience"]:
        e["bullets"] = sorted(e["bullets"], key=lambda b: -_relevance(b, keywords))[:4]
    t["projects"] = sorted(t["projects"], key=lambda pr: -_relevance(" ".join([pr["name"], pr["tech"], *pr["bullets"]]), keywords))
    for pr in t["projects"]:
        pr["bullets"] = sorted(pr["bullets"], key=lambda b: -_relevance(b, keywords))[:4]
    top = [s for s in t["skills"][:4]]
    t["headline"] = f"{job_title} · " + " · ".join(top[:3]) if top else f"Aspiring {job_title}"
    edu = p["education"][0] if p["education"] else {}
    who = f'{edu.get("degree") or "recent"} graduate' + (f' from {edu["institution"]}' if edu.get("institution") else "")
    proof = ""
    if t["projects"]:
        proof = f' Built the {t["projects"][0]["name"]} project' + (f' using {t["projects"][0]["tech"]}' if t["projects"][0]["tech"] else "") + "."
    elif t["experience"]:
        e = t["experience"][0]
        proof = f' Worked as {e["role"]}' + (f' at {e["org"]}' if e["org"] else "") + "."
    skills_line = ", ".join(top) if top else "the core skills of this role"
    t["summary"] = (f"{who[0].upper() + who[1:]} with hands-on experience in {skills_line}.{proof} "
                    f"Ready to bring this to the {job_title} role" + (f" at {company}." if company else "."))
    name = p["name"] or "[Your name]"
    t["cover_letter"] = (
        f"Dear Hiring Team{' at ' + company if company else ''},\n\n"
        f"I'm applying for the {job_title} position. As a {who}, I have worked with {skills_line}, "
        f"and I'm excited by the chance to use these skills on your team.{proof}\n\n"
        f"What draws me to this role is the opportunity to learn quickly and contribute from the first week. "
        f"I take ownership of my work, ask good questions, and follow through on details.\n\n"
        f"I would welcome the chance to discuss how I can help{' ' + company if company else ''}. Thank you for your time.\n\n"
        f"Sincerely,\n{name}"
    )
    changes = [{"section": "Skills", "what": f"Moved {', '.join(pretty(m) for m in matched[:4]) or 'your most relevant skills'} to the top",
                "why": "Recruiters and ATS read the first skills first."},
               {"section": "Summary", "what": "Rewrote it for this role", "why": "Names the role and your strongest proof."},
               {"section": "Experience & projects", "what": "Put the most relevant bullets and projects first",
                "why": "The job's keywords now appear early."}]
    tips = [f"If you have real experience with {pretty(k)}, add one line showing where you used it." for k in missing[:3]]
    return t, changes, tips


def tailor(profile: dict, job_title: str, company: str, job_text: str):
    """→ (content, analysis, used_ai)"""
    p = normalize_profile(profile)
    keywords = job_keywords(f"{job_title}\n{job_text}")
    before = ats_score(p, keywords)
    used_ai = False
    data = ai.complete_json(
        TAILOR_SYSTEM,
        "\n\n".join([
            f"Role: {job_title}\nCompany: {company or 'not given'}",
            ai.untrusted("job", job_text, 8000),
            "Keywords the employer cares about: " + ", ".join(keywords),
            ai.untrusted("resume", json.dumps(p, ensure_ascii=False), 14000),
        ]),
        max_tokens=4000,
    )
    if isinstance(data, dict) and isinstance(data.get("content"), dict):
        content = normalize_profile(data["content"])
        cover = _clip(str(data["content"].get("cover_letter", "")), 2500)
        content, warnings = _guard_truth(p, content, keywords)
        changes = [c for c in (data.get("changes") or []) if isinstance(c, dict)][:8]
        tips = [str(t) for t in (data.get("tips") or [])][:4]
        used_ai = True
        if not cover:
            cover = _fallback_tailor(p, job_title, company, keywords)[0]["cover_letter"]
        content["cover_letter"] = cover
    else:
        content, changes, tips = _fallback_tailor(p, job_title, company, keywords)
        warnings = []
    matched, missing = keyword_match(content, keywords)
    analysis = {
        "keywords": keywords, "matched": [pretty(k) for k in matched], "missing": [pretty(k) for k in missing],
        "score_before": before, "score_after": max(before, ats_score(content, keywords)),
        "changes": changes, "tips": tips, "warnings": warnings,
    }
    return content, analysis, used_ai


# --------------------------------------------------------------------------- interview kit
KIT_SYSTEM = """You are a senior interview coach preparing a fresh graduate in Bangladesh for one specific interview.
Use the job's requirements and responsibilities, and the candidate's real CV (if given), to predict what will be asked.
Model answers are written in first person, natural spoken English, 90–160 words, built ONLY from facts in the CV;
behavioural answers follow STAR. If the CV lacks something, show how to answer honestly (transferable experience,
how you'd learn it) — never invent experience.
Return JSON: {"overview": "2 sentences on what this interview will test",
"focus_areas": [{"name": "", "why": "", "prep": ""}],
"questions": [{"id": "q1", "category": "technical|role|behavioral|situational|hr", "question": "", "why": "what they're really checking",
"answer": "", "key_points": ["", "", ""], "pitfalls": ["", ""], "difficulty": "easy|medium|hard"}],
"ask_them": ["smart questions the candidate can ask"], "plan": [{"day": 1, "title": "", "tasks": ["", ""]}],
"dos": [""], "donts": [""]}
Give 12 questions: 4 technical/role, 3 behavioral, 2 situational (from the responsibilities), 3 hr. 4 ask_them, a 5-day plan."""


def _first_name(p):
    return (p.get("name") or "").split(" ")[0] if p else ""


def _fallback_kit(job_title, company, requirements, responsibilities, profile):
    p = normalize_profile(profile or {})
    keywords = job_keywords(f"{job_title}\n{requirements}\n{responsibilities}", 12)
    resp_lines = [BULLET.sub("", ln).strip() for ln in responsibilities.splitlines() if len(ln.strip()) > 12][:4]
    have = set(keyword_match(p, keywords)[0]) if profile else set()
    proj = p["projects"][0] if p["projects"] else None
    exp = p["experience"][0] if p["experience"] else None
    edu = p["education"][0] if p["education"] else {}
    evidence = (f'In {proj["name"]}' + (f' ({proj["tech"]})' if proj["tech"] else "")) if proj else \
        (f'As {exp["role"]} at {exp["org"]}' if exp else "In my final-year coursework")
    co = company or "your company"
    qs = []

    def add(cat, q, why, ans, keys, pits, diff="medium"):
        qs.append({"id": f"q{len(qs) + 1}", "category": cat, "question": q, "why": why, "answer": ans,
                   "key_points": keys, "pitfalls": pits, "difficulty": diff})

    for k_raw in keywords[:4]:
        k = pretty(k_raw)
        if k_raw in have:
            ans = (f"{evidence}, I used {k} directly. I was responsible for one clear part of it, I made a specific decision about "
                   f"how to use {k}, and I can show the result. What I learned is how {k} fits into the bigger workflow — "
                   f"which is exactly what this {job_title} role needs.")
        else:
            ans = (f"I haven't used {k} in a real project yet, so I'll be honest about that. What I have done is "
                   f"{(evidence[0].lower() + evidence[1:]) if evidence else 'build related skills'}, and the fundamentals carry over. "
                   f"My plan is to build a small project with {k} this week and I'm happy to walk you through it.")
        add("technical", f"How have you used {k}? Walk me through a concrete example.",
            f"Whether your {k} knowledge is real and hands-on, not just listed on the CV.", ans,
            [f"One specific example with {k}", "Your exact role and decision", "The result or what you learned"],
            ["Listing buzzwords without an example", "Claiming more experience than you have"], "medium")
    add("behavioral", "Tell me about a time you worked in a team and something went wrong.",
        "Ownership, communication and how you handle pressure.",
        f"Situation: {('i' + evidence[1:]) if evidence.startswith('In') else evidence}, our team fell behind a deadline. Task: I owned one part. "
        "Action: I split my work into daily goals, flagged the risk early to the team, and helped a teammate unblock their part. "
        "Result: we delivered on time, and I learned to raise problems early instead of hoping they disappear.",
        ["Use STAR: situation, task, action, result", "Focus on what YOU did", "End with a lesson"],
        ["Blaming teammates", "A story with no result"], "medium")
    add("behavioral", "Tell me about something you learned quickly on your own.",
        "How fast you'll ramp up — the #1 worry with freshers.",
        f"When I needed a new skill for {proj['name'] if proj else 'a course project'}, I set a one-week goal, followed the official docs, "
        "built a tiny version first and asked for feedback. Within a week I was using it in the real project. That is how I would "
        f"ramp up in my first month here as a {job_title}.",
        ["Name the skill", "Your method", "How fast — and the proof"], ["Being vague", "Saying you learn fast without proof"], "easy")
    add("behavioral", "Describe a mistake you made and what you did about it.", "Honesty and self-awareness.",
        "In a project I once pushed changes without testing them properly and broke a feature before a demo. I owned it immediately, "
        "fixed it, and since then I always test before I share work. The mistake made me more careful, not more afraid.",
        ["A real, small mistake", "You owned and fixed it", "The habit you changed"], ["A fake weakness", "No lesson"], "medium")
    for r in resp_lines[:2]:
        add("situational", f"This role involves: “{_clip(r, 140)}”. How would you approach it in your first month?",
            "Whether you understand the actual job and can plan.",
            "In week one I'd learn how the team does this today — the tools, the standards, who I should ask. In week two I'd take a small "
            "piece under guidance and ask for feedback early. By the end of the month I'd aim to handle it independently and suggest one "
            "improvement based on what I observed.",
            ["Learn → do small → own", "Ask for feedback early", "One concrete improvement"], ["Over-promising", "No plan"], "hard")
    add("hr", "Tell me about yourself.", "Your story in 60 seconds and whether it points at this role.",
        f"I'm {p['name'] or '[name]'}, a {edu.get('degree') or 'recent'} graduate" + (f" from {edu['institution']}" if edu.get("institution") else "")
        + f". {evidence}, I worked with {', '.join(p['skills'][:3]) or 'the core tools of this field'}. "
        f"I'm applying for this {job_title} role because it lets me use those skills from day one and grow in a team like {co}'s.",
        ["Present → past → why this role", "Under 60 seconds", "End with why you're here"], ["Reciting your CV", "Personal life story"], "easy")
    add("hr", f"Why do you want to work at {co}?", "Motivation and whether you researched them.",
        f"I looked at what {co} does and what this team works on. Three things stand out: the kind of work in this role, the chance to learn "
        "from experienced people, and a place where a fresher's work is actually used. I want my first job to be somewhere I grow fast.",
        ["One specific thing about them", "Link to your goals", "Show you'll stay and grow"], ["Generic praise", "Only talking about salary"], "easy")
    add("hr", "What are your salary expectations?", "Whether you're realistic for a fresher role.",
        "For a fresher role like this, I understand the typical range in Dhaka. I'm most focused on learning and the role itself, so I'm flexible "
        "and open to your standard offer for this position.",
        ["Know the market range", "Stay flexible", "Focus on growth"], ["Naming a number far above range", "Refusing to answer"], "medium")
    plan = [
        {"day": 1, "title": "Know the job", "tasks": ["Highlight every requirement", "Match each to a line in your CV"]},
        {"day": 2, "title": "Close the gaps", "tasks": [f"Revise {', '.join(pretty(k) for k in keywords[:3]) or 'core skills'}", "Build or revisit one small example"]},
        {"day": 3, "title": "Stories", "tasks": ["Write 3 STAR stories", "Practise them out loud — 90 seconds each"]},
        {"day": 4, "title": "Mock interview", "tasks": ["Answer every question here out loud", "Use the coach for feedback"]},
        {"day": 5, "title": "Final polish", "tasks": [f"Research {co}", "Prepare your questions for them", "Sleep early"]},
    ]
    return {
        "overview": f"This interview will check whether you can actually do the core work of a {job_title} and how quickly you'll learn. "
                    "Expect concrete 'show me' questions on the main skills plus a few about teamwork and motivation.",
        "focus_areas": [{"name": pretty(k), "why": "Named in the requirements", "prep": f"Have one concrete example using {pretty(k)}."} for k in keywords[:4]],
        "questions": qs,
        "ask_them": ["What does success look like in the first 90 days?", "How does the team review and give feedback on work?",
                     "What's the biggest challenge the team is facing right now?", "What does growth look like for someone in this role?"],
        "plan": plan,
        "dos": ["Answer with examples, not adjectives", "Pause and think before hard questions", "Ask for clarification when needed"],
        "donts": ["Memorise answers word-for-word", "Badmouth anyone", "Pretend to know something you don't"],
    }


def _normalize_kit(k):
    k = k if isinstance(k, dict) else {}
    qs = []
    for i, q in enumerate((k.get("questions") or [])[:16]):
        if not isinstance(q, dict) or not q.get("question"):
            continue
        cat = str(q.get("category", "role")).lower()
        qs.append({
            "id": f"q{i + 1}", "category": cat if cat in {"technical", "role", "behavioral", "situational", "hr"} else "role",
            "question": _clip(str(q["question"]), 400), "why": _clip(str(q.get("why", "")), 300),
            "answer": _clip(str(q.get("answer", "")), 1600),
            "key_points": [_clip(str(x), 160) for x in (q.get("key_points") or [])][:4],
            "pitfalls": [_clip(str(x), 160) for x in (q.get("pitfalls") or [])][:3],
            "difficulty": q.get("difficulty") if q.get("difficulty") in {"easy", "medium", "hard"} else "medium",
        })
    return {
        "overview": _clip(str(k.get("overview", "")), 600),
        "focus_areas": [{"name": _clip(str(f.get("name", "")), 60), "why": _clip(str(f.get("why", "")), 200), "prep": _clip(str(f.get("prep", "")), 240)}
                        for f in (k.get("focus_areas") or []) if isinstance(f, dict)][:5],
        "questions": qs,
        "ask_them": [_clip(str(x), 200) for x in (k.get("ask_them") or [])][:5],
        "plan": [{"day": int(d.get("day", i + 1)) if str(d.get("day", "")).isdigit() else i + 1, "title": _clip(str(d.get("title", "")), 60),
                  "tasks": [_clip(str(t), 160) for t in (d.get("tasks") or [])][:4]} for i, d in enumerate(k.get("plan") or []) if isinstance(d, dict)][:7],
        "dos": [_clip(str(x), 160) for x in (k.get("dos") or [])][:5],
        "donts": [_clip(str(x), 160) for x in (k.get("donts") or [])][:5],
    }


def interview_kit(job_title, company, requirements, responsibilities, profile=None):
    """→ (kit, used_ai)"""
    parts = [f"Role: {job_title}\nCompany: {company or 'not given'}",
             ai.untrusted("job", f"REQUIREMENTS:\n{requirements}\n\nRESPONSIBILITIES:\n{responsibilities}", 9000)]
    if profile:
        parts.append(ai.untrusted("resume", json.dumps(normalize_profile(profile), ensure_ascii=False), 12000))
    else:
        parts.append("No CV was given — write answers as a template the candidate fills with their own facts, marked with [brackets].")
    data = ai.complete_json(KIT_SYSTEM, "\n\n".join(parts), max_tokens=7000, timeout=120)
    if isinstance(data, dict):
        kit = _normalize_kit(data)
        if len(kit["questions"]) >= 5:
            return kit, True
    return _normalize_kit(_fallback_kit(job_title, company, requirements, responsibilities, profile)), False


# --------------------------------------------------------------------------- answer feedback
FEEDBACK_SYSTEM = """You are an encouraging but honest interview coach. Score the candidate's spoken answer to one interview
question for the given role. Return JSON: {"score": 0-100, "verdict": "one short line", "strengths": ["", ""],
"improve": ["specific, actionable", ""], "star": {"situation": true, "task": true, "action": true, "result": true},
"improved_answer": "a stronger version in first person using only facts from their answer and CV (90–160 words)"}"""
FILLERS = re.compile(r"\b(um+|uh+|like|basically|actually|you know|i mean|kind of|sort of)\b", re.I)


def _fallback_feedback(question, answer, keywords):
    words = answer.split()
    n = len(words)
    low = answer.lower()
    star = {
        "situation": bool(re.search(r"\b(when|during|in my|at my|while|project|internship|semester|once)\b", low)),
        "task": bool(re.search(r"\b(my (role|job|task|responsibility)|i was (responsible|asked|assigned)|goal|needed to)\b", low)),
        "action": bool(re.search(r"\bi (built|led|designed|wrote|created|fixed|organized|organised|analy[sz]ed|implemented|talked|decided|learned|set up|made|used)\b", low)),
        "result": bool(re.search(r"\b(result|so that|which led|increased|reduced|improved|saved|delivered|won|finished|launched|\d+ ?%)\b", low)),
    }
    fillers = len(FILLERS.findall(answer))
    kw = [k for k in keywords if _has_term(low, k)]
    score = 35
    score += 20 if 60 <= n <= 220 else (10 if 35 <= n < 60 or 220 < n <= 300 else 0)
    score += 6 * sum(star.values())
    score += min(12, 4 * len(kw))
    score += 5 if re.search(r"\d", answer) else 0
    score -= min(12, fillers * 2)
    score = max(5, min(97, score))
    strengths, improve = [], []
    if star["action"]:
        strengths.append("You describe what you personally did — good.")
    if star["result"]:
        strengths.append("You end with a result.")
    if kw:
        strengths.append(f"You connected it to the role ({', '.join(pretty(k) for k in kw[:3])}).")
    if n < 60:
        improve.append("Too short — add a concrete example (what, where, your part, the result).")
    if n > 260:
        improve.append("Too long — aim for 60–90 seconds (about 120–180 words).")
    if not star["situation"]:
        improve.append("Start with the situation: where and when did this happen?")
    if not star["result"]:
        improve.append("Finish with the result — ideally a number or a clear outcome.")
    if fillers > 2:
        improve.append(f"Cut filler words (found {fillers}). Pause instead.")
    if not re.search(r"\d", answer):
        improve.append("Add one number (time saved, users, marks, %) to make it memorable.")
    verdict = "Strong answer — polish and you're ready." if score >= 80 else "Good base — make it more specific." if score >= 60 else "Needs a concrete example and a result."
    cleaned = re.sub(r"\s{2,}", " ", FILLERS.sub("", answer)).strip(" ,.")
    improved = ("Situation: [where and when]. Task: [what you were responsible for]. Action: " +
                (cleaned[:400] + "." if cleaned else "[what you did, step by step]") +
                " Result: [the outcome — with a number if you can] — and [what you learned that helps in this role].")
    return {"score": score, "verdict": verdict, "strengths": strengths[:3] or ["You attempted the question — keep practising."],
            "improve": improve[:4], "star": star, "improved_answer": improved, "word_count": n, "filler_count": fillers}


def answer_feedback(question, answer, job_title, keywords, profile=None):
    """→ (feedback, used_ai)"""
    msg = "\n\n".join([f"Role: {job_title}", ai.untrusted("question", question, 600), ai.untrusted("answer", answer, 4000)] +
                      ([ai.untrusted("resume", json.dumps(normalize_profile(profile), ensure_ascii=False), 8000)] if profile else []))
    data = ai.complete_json(FEEDBACK_SYSTEM, msg, max_tokens=1500)
    base = _fallback_feedback(question, answer, keywords)
    if isinstance(data, dict) and "score" in data:
        try:
            score = max(0, min(100, int(data.get("score", 0))))
        except (TypeError, ValueError):
            score = base["score"]
        star = data.get("star") if isinstance(data.get("star"), dict) else base["star"]
        return {
            "score": score, "verdict": _clip(str(data.get("verdict", "")), 160) or base["verdict"],
            "strengths": [_clip(str(x), 220) for x in (data.get("strengths") or [])][:4],
            "improve": [_clip(str(x), 220) for x in (data.get("improve") or [])][:4],
            "star": {k: bool(star.get(k)) for k in ("situation", "task", "action", "result")},
            "improved_answer": _clip(str(data.get("improved_answer", "")), 1600),
            "word_count": base["word_count"], "filler_count": base["filler_count"],
        }, True
    return base, False


# --------------------------------------------------------------------------- coach chat
COACH_SYSTEM = """You are "Horin", Sonarhorin's interview coach — warm, direct and practical, like a senior mentor.
You are helping the candidate prepare for the interview described below. Answer in the user's language
(Bangla, English or Banglish — match them). Be concise: short paragraphs or tight bullet lists, under 220 words
unless they ask for more. When they ask how to answer something, give a sample answer in first person built from
their real CV facts, then 2–3 tips. If they paste an answer, critique it kindly and show a better version.
Never invent experience they don't have."""


def coach_context(kit_obj) -> str:
    k = kit_obj.kit or {}
    qs = "\n".join(f'- {q["question"]}' for q in k.get("questions", [])[:12])
    prof = kit_obj.resume.profile if kit_obj.resume_id and kit_obj.resume else None
    parts = [f"Interview: {kit_obj.job_title} at {kit_obj.company or 'the company'}",
             ai.untrusted("job", f"REQUIREMENTS:\n{kit_obj.requirements}\n\nRESPONSIBILITIES:\n{kit_obj.responsibilities}", 6000),
             f"Questions already prepared:\n{qs}"]
    if prof:
        parts.append(ai.untrusted("resume", json.dumps(normalize_profile(prof), ensure_ascii=False), 8000))
    return "\n\n".join(parts)


CHAT_STOP = STOP | {"have", "they", "them", "you", "your", "don", "does", "did", "ask", "asked", "when", "then", "than", "this", "that",
                    "how", "answer", "should", "would", "what", "say", "can", "give", "tell", "me", "for", "the"}


def _tokens(s):
    return {w for w in re.findall(r"[a-zঀ-৿]{3,}", (s or "").lower()) if w not in CHAT_STOP}


def fallback_coach_reply(kit_obj, message: str) -> str:
    k = kit_obj.kit or {}
    qs = k.get("questions", [])
    mt = _tokens(message)
    best, score = None, 0
    low = (message or "").lower()
    hr = next((q for q in qs if "yourself" in q["question"].lower()), None)
    if re.search(r"don'?t have|haven'?t (used|done)|no experience|lack|missing skill|জানি না|নেই", low):
        gaps = [pretty(k) for k in job_keywords(kit_obj.requirements, 10)]
        return ("Be honest — interviewers respect it far more than bluffing. Use this 3-step shape:\n\n"
                "• **Admit it plainly:** “I haven't used X in a real project yet.”\n"
                "• **Bridge:** name the closest thing you *have* done and why it transfers.\n"
                "• **Plan:** “I've started learning it — here's what I've built so far / how I'll ramp up in my first 2 weeks.”\n\n"
                + (f"For this role, the skills to prepare that bridge for are: {', '.join(gaps[:4])}." if gaps else ""))
    if re.search(r"project|প্রজেক্ট", low):
        prof = normalize_profile(kit_obj.resume.profile) if getattr(kit_obj, "resume_id", None) and kit_obj.resume else None
        kws = job_keywords(f"{kit_obj.job_title}\n{kit_obj.requirements}\n{getattr(kit_obj, 'responsibilities', '')}", 12)
        items = (prof["projects"] + [{"name": f'{e["role"]} at {e["org"]}', "tech": "", "bullets": e["bullets"]} for e in prof["experience"]]) if prof else []
        if items:
            ranked = sorted(items, key=lambda it: -_relevance(" ".join([it["name"], it.get("tech", ""), *it["bullets"]]), kws))
            top = ranked[0]
            hits = [pretty(k) for k in kws if _has_term(_norm(" ".join([top["name"], top.get("tech", ""), *top["bullets"]])), k)]
            others = ", ".join(r["name"] for r in ranked[1:3])
            return (f"Lead with **{top['name']}** — it shows {', '.join(hits[:4]) or 'the closest match to this role'}, which this job asks for.\n\n"
                    "Tell it in this order:\n• The problem and who it was for\n• What *you* built and one decision you made\n• The result (a number)\n\n"
                    + (f"Keep {others} as backups for follow-up questions." if others else ""))
    if re.search(r"pitch|60.?sec|introduce|elevator", low) and hr:
        return f"Here's a 60-second version you can say out loud:\n\n{hr['answer']}\n\n• Keep it under 150 words\n• Finish on why *this* role\n• Smile on the last line"
    for q in qs:
        qtext = q["question"].lower().strip(" ?.")
        sc = 2 * len(mt & _tokens(q["question"])) + len(mt & _tokens(q.get("why", "")))
        if qtext and qtext in low:
            sc += 10
        if sc > score:
            best, score = q, sc
    if best and score >= 2:
        pts = "\n".join(f"• {p}" for p in best.get("key_points", []))
        return (f"**{best['question']}**\n\nThey're checking: {best.get('why', '')}\n\nHere's a strong way to answer:\n\n"
                f"{best['answer']}\n\nKeep these in mind:\n{pts}\n\nTry saying it out loud in under 90 seconds, then paste your "
                "version here and I'll tighten it.")
    if len(message.split()) > 40:
        fb = _fallback_feedback("", message, job_keywords(kit_obj.requirements, 10))
        tips = "\n".join(f"• {t}" for t in fb["improve"]) or "• Already solid — practise the delivery."
        return f"Score: **{fb['score']}/100** — {fb['verdict']}\n\nTo make it stronger:\n{tips}"
    focus = ", ".join(f["name"] for f in k.get("focus_areas", [])[:3]) or "the core skills in the job post"
    return (f"For this {kit_obj.job_title} interview, focus on {focus}. Pick any question from your kit and ask me "
            "“how do I answer this?”, or paste your own answer and I'll score it and rewrite it with you.")


def coach_stream(kit_obj, history, message):
    """Yields reply chunks. Falls back to a rule-based reply streamed word by word."""
    msgs = [{"role": m["role"], "content": m["content"]} for m in history[-12:]]
    msgs.append({"role": "user", "content": ai.untrusted("message", message, 4000)})
    if msgs[0]["role"] != "user":
        msgs = msgs[1:]
    got = False
    for chunk in ai.stream(COACH_SYSTEM + "\n\n" + coach_context(kit_obj), msgs, max_tokens=1200):
        got = True
        yield chunk
    if not got:
        text = fallback_coach_reply(kit_obj, message)
        for w in re.findall(r"\S+\s*", text):
            yield w

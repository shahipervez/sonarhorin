import re

from django.utils.text import slugify

from apps.certifications.models import Certificate
from apps.cv.models import CVAnalysis
from apps.cv.parser import portfolio_sections

from .models import RESERVED, SLUG_RX, Portfolio

URL_FIELDS = ("linkedin", "github", "website", "kaggle", "scholar", "behance", "facebook")
MAX_JSON = 60_000


def suggest_slug(user):
    base = slugify(user.full_name or user.email.split("@")[0])[:30] or "fresher"
    base = base if len(base) >= 3 else f"{base}-dev"
    slug, n = base, 1
    while slug in RESERVED or Portfolio.objects.filter(slug=slug).exclude(user=user).exists():
        n += 1
        slug = f"{base}-{n}"
    return slug


def prefill(user):
    cv = CVAnalysis.objects.filter(user=user).order_by("-created_at").first()
    sec = portfolio_sections(cv.extracted_text) if cv else {"projects": [], "experience": [], "about": ""}
    skills = [s.strip() for s in (user.skills or "").split(",") if s.strip()]
    major = user.get_major_display()
    return {
        "name": user.full_name,
        "headline": user.headline or f"{major} graduate{' · ' + user.university if user.university else ''}",
        "about": sec["about"] or (f"I'm a {major} graduate{' from ' + user.university if user.university else ''} looking for my first role. "
                                  "I learn fast, I finish what I start, and I'd love to build useful things with a good team."),
        "location": "Bangladesh",
        "email": user.email, "phone": user.phone,
        "skills": skills[:16],
        "projects": [{**p, "link": "", "tags": []} for p in sec["projects"]] or [
            {"title": "Your best project", "desc": "What it does, what you built, and one number that shows impact (users, accuracy, time saved).", "link": "", "tags": skills[:3]},
        ],
        "experience": [{"role": e["title"], "org": "", "period": "", "desc": e["desc"]} for e in sec["experience"]],
        "education": [{"degree": f"B.Sc./BBA in {major}" if user.major != "BBA" else "Bachelor of Business Administration",
                       "school": user.university, "year": str(user.graduation_year or ""), "detail": f"CGPA {user.cgpa}" if user.cgpa else ""}],
        "links": {"linkedin": user.linkedin, "github": user.github},
        "open_to": "Full-time" if user.track == "job" else "Internship" if user.track == "internship" else "Co-founders & investors",
    }


def _clean_url(v):
    v = (v or "").strip()[:300]
    if not v:
        return ""
    if re.match(r"^[a-z][a-z0-9+.-]*:", v, re.I) and not re.match(r"^https?://", v, re.I):
        return ""  # javascript:, data:, mailto: … — links must be web pages
    if not re.match(r"^https?://", v, re.I):
        v = "https://" + v
    return v if re.match(r"^https?://[\w.-]+\.[a-z]{2,}(?:[/?#][^\s<>\"']*)?$", v, re.I) else ""


def clean_data(d):
    """Keep the JSON small and safe — the public site renders it as text, never as HTML."""
    if not isinstance(d, dict):
        return {}
    s = lambda v, n=300: str(v or "")[:n]
    out = {k: s(d.get(k), 400 if k == "about" else 140) for k in ("name", "headline", "location", "email", "phone", "open_to")}
    out["about"] = s(d.get("about"), 1200)
    out["skills"] = [s(x, 40) for x in (d.get("skills") or [])[:24] if str(x).strip()]
    out["projects"] = [{"title": s(p.get("title"), 90), "desc": s(p.get("desc"), 500), "link": _clean_url(p.get("link")),
                        "tags": [s(t, 30) for t in (p.get("tags") or [])[:6]]} for p in (d.get("projects") or [])[:10] if isinstance(p, dict)]
    out["experience"] = [{k: s(e.get(k), 400 if k == "desc" else 90) for k in ("role", "org", "period", "desc")}
                         for e in (d.get("experience") or [])[:8] if isinstance(e, dict)]
    out["education"] = [{k: s(e.get(k), 120) for k in ("degree", "school", "year", "detail")}
                        for e in (d.get("education") or [])[:5] if isinstance(e, dict)]
    links = d.get("links") or {}
    out["links"] = {k: u for k in URL_FIELDS if isinstance(links, dict) and (u := _clean_url(links.get(k)))}
    out["sections"] = [x for x in (d.get("sections") or []) if x in ("about", "skills", "projects", "experience", "education", "certificates", "contact")][:8]
    return out


def verified(user):
    """Credentials Sonarhorin itself issued — shown with live verify links, the user can't edit them."""
    return [{"title": c.title, "kind": c.get_kind_display(), "score": c.score, "code": c.code, "verify_url": c.verify_url,
             "issued": c.issued_at.date().isoformat()} for c in Certificate.objects.filter(user=user, revoked=False)[:8]]


def valid_slug(slug, user):
    slug = (slug or "").lower().strip()
    if not SLUG_RX.match(slug):
        return slug, "Use 3–40 letters, numbers or dashes."
    if slug in RESERVED:
        return slug, "That address is reserved."
    if Portfolio.objects.filter(slug=slug).exclude(user=user).exists():
        return slug, "Someone already has that address."
    return slug, None

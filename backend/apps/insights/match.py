"""CV/profile ↔ job match score.

Deterministic first: skills are taken from a fixed vocabulary (the CV analyzer's per-major keyword lists) found in
the job text, compared with the skills in the user's profile + latest parsed CV. When the Claude API is configured,
the result is enriched with extra tips (and at most a ±10 nudge to the score); without a key the rule-based result
is returned unchanged.

Result is cached per (user, job, CV version, profile, job content) for ``CACHE_SECONDS``.
"""
import hashlib
import logging
import re

from django.core.cache import cache

from apps.core import ai
from apps.cv.analyzer import KEYWORDS
from apps.jobs.services import latest_cv

log = logging.getLogger("apps.insights")
CACHE_SECONDS = 6 * 3600
VOCAB = sorted({k for words in KEYWORDS.values() for k in words}, key=len, reverse=True)
# Generic words that are in the vocab but too vague to count as a job's "required skill".
GENERIC = {"communication", "presentation", "teamwork", "research", "english", "testing", "sample", "hr", "leadership",
           "time management", "problem solving", "documentation", "safety", "compliance", "circuit"}
CGPA_REQ = re.compile(r"cgpa\s*([0-4]\.\d{1,2})\s*\+?", re.I)


def _has(text, term):
    return re.search(rf"(?<![a-z0-9]){re.escape(term)}s?(?![a-z0-9])", text) is not None


def _skills_in(text):
    text = (text or "").lower()
    return [t for t in VOCAB if _has(text, t)]


def job_skills(job):
    reqs = " ".join(str(r) for r in (job.requirements or []))
    text = f"{job.title} {job.description} {reqs}"
    found = _skills_in(text)
    specific = [s for s in found if s not in GENERIC]
    return specific or found


def user_skills(user, cv):
    profile = {s.strip().lower() for s in (user.skills or "").split(",") if s.strip()}
    text = " ".join(profile)
    if cv:
        text += " " + (cv.extracted_text or "") + " " + " ".join((cv.report or {}).get("keywords", {}).get("found", []))
    return profile | set(_skills_in(text))


def _key(user, job, cv):
    sig = hashlib.sha1(f"{user.skills}|{user.major}|{user.cgpa}|{job.title}|{job.description}|{job.requirements}|{job.majors}"
                       .encode()).hexdigest()[:16]
    return f"insights:match:v1:{user.pk}:{job.pk}:{cv.pk if cv else 0}:{sig}"


def rule_score(user, job, cv):
    needed = job_skills(job)
    have = user_skills(user, cv)
    matched = [s for s in needed if s in have]
    missing = [s for s in needed if s not in have]
    skill = len(matched) / len(needed) if needed else 0.6  # no detectable skills -> neutral
    majors = [m.lower() for m in job.major_list]
    major_fit = 1.0 if not majors or user.major.lower() in majors else 0.0
    cv_q = (cv.score / 100) if cv else 0.4
    score = round(100 * (0.65 * skill + 0.20 * major_fit + 0.15 * cv_q))

    tips = []
    if not cv:
        tips.append("Upload your CV so we can match on everything you know, not just your profile skills.")
    if missing:
        tips.append(f"This job asks for {', '.join(missing[:4])}. If you know them, name them in your Skills and Projects; "
                    "if not, a small project with one of them is the fastest way to close the gap.")
    if major_fit == 0:
        tips.append(f"The post targets {', '.join(job.major_list)} graduates. Explain in your cover letter why your "
                    f"{user.get_major_display()} background still fits.")
    reqs = " ".join(str(r) for r in (job.requirements or []))
    if (m := CGPA_REQ.search(reqs)) and user.cgpa is not None and float(user.cgpa) < float(m.group(1)):
        tips.append(f"The post asks for CGPA {m.group(1)}+; lead with projects and certifications to offset it.")
    if cv and cv.score < 65:
        tips.append(f"Your CV scores {cv.score}/100 — fix the top items in your CV report before applying.")
    if matched and score >= 70:
        tips.append(f"Strong fit: mention {', '.join(matched[:3])} in the first lines of your cover letter.")
    return {"score": max(0, min(100, score)), "matched": matched, "missing": missing, "tips": tips[:5],
            "breakdown": {"skills": round(skill * 100), "major_fit": round(major_fit * 100), "cv_quality": round(cv_q * 100)},
            "cv_id": cv.pk if cv else None, "source": "rules"}


def _ai_enrich(result, user, job, have):
    data = ai.complete_json(
        "You are a career coach for fresh graduates in Bangladesh. Given a job and a candidate's skills, return "
        '{"tips": [up to 3 short, specific tips], "adjust": integer between -10 and 10 to nudge a rule-based fit score}.',
        f"Rule-based score: {result['score']}. Matched: {result['matched']}. Missing: {result['missing']}.\n"
        f"Candidate major: {user.get_major_display()}. Skills: {', '.join(sorted(have))[:1500]}\n"
        + ai.untrusted("job", f"{job.title} at {job.company.name}\n{job.description}\n{job.requirements}", 4000),
        max_tokens=400, timeout=30)
    if not isinstance(data, dict):
        return result
    tips = [str(t)[:300] for t in (data.get("tips") or []) if isinstance(t, str)][:3]
    try:
        adjust = max(-10, min(10, int(data.get("adjust", 0))))
    except (TypeError, ValueError):
        adjust = 0
    result = {**result, "score": max(0, min(100, result["score"] + adjust)), "tips": (tips + result["tips"])[:6], "source": "ai"}
    return result


def match_score(user, job):
    cv = latest_cv(user)
    key = _key(user, job, cv)
    if (hit := cache.get(key)) is not None:
        return {**hit, "cached": True}
    result = rule_score(user, job, cv)
    if ai.enabled():
        try:
            result = _ai_enrich(result, user, job, user_skills(user, cv))
        except Exception:  # never fail the endpoint because of the LLM
            log.exception("AI match enrichment failed")
    cache.set(key, result, CACHE_SECONDS)
    return {**result, "cached": False}

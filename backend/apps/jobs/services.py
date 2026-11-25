"""Apply engine.

Three channels, chosen per job:
  partner — employer is on Sonarhorin: the application lands in their dashboard instantly.
  email   — job says "send your CV to hr@…": we email HR from Sonarhorin with the CV attached,
            reply-to the candidate. Fully automatic.
  ats     — company gave us its Greenhouse/Lever key: the application goes straight into their own ATS
            from Sonarhorin (see ats.py). If their API refuses it, the candidate finishes on the portal.
  portal  — job lives on the company's own career site (no API). We never bot-fill third-party
            sites (captchas, logins, terms of use); we prepare a tailored packet and the
            candidate finishes in ~1 minute, then marks it done.
Auto-apply only uses partner + email, respects a daily cap and never applies twice.
"""
import logging
import re

from django.conf import settings
from django.core.mail import EmailMessage
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone

from apps.cv.models import CVAnalysis

from .models import AutoApplySettings, Job, JobApplication

log = logging.getLogger(__name__)
FRESHER_MAX_YEARS = 1


def latest_cv(user):
    return CVAnalysis.objects.filter(user=user).order_by("-created_at").first()


def apply_packet(user, job):
    """Everything a candidate needs to paste into a company portal."""
    return {
        "full_name": user.full_name, "email": user.email, "phone": user.phone, "university": user.university,
        "major": user.get_major_display(), "graduation_year": user.graduation_year,
        "cgpa": str(user.cgpa) if user.cgpa is not None else "", "linkedin": user.linkedin, "github": user.github,
        "skills": user.skills, "apply_url": job.apply_url or job.company.careers_url,
    }


def cover_letter(user, job, note=""):
    """Short tailored cover letter. Uses the LLM when configured, otherwise a solid template."""
    from apps.core import ai

    skills = [s.strip() for s in (user.skills or "").split(",") if s.strip()]
    want = " ".join(job.requirements).lower() + " " + job.description.lower()
    matched = [s for s in skills if s.lower() in want][:4]  # only claim skills the job actually asks for
    if ai.enabled():
        text = ai.complete(
            "You write short, specific cover letters for fresh graduates in Bangladesh. 120-170 words, no clichés, no placeholders.",
            f"Candidate: {user.full_name}, {user.get_major_display()} graduate ({user.graduation_year or ''}) from {user.university or 'a Bangladeshi university'}"
            f"{', CGPA ' + str(user.cgpa) if user.cgpa else ''}. Skills: {', '.join(skills[:12])}.\n"
            f"Personal note: {note}\nJob: {job.title} at {job.company.name}, {job.location}.\nDescription: {job.description[:1500]}\n"
            "Write the letter body only, starting with 'Dear Hiring Team,' and ending with the candidate's name.",
            max_tokens=450,
        )
        if text and len(text) > 200:
            return text.strip()
    lines = [
        "Dear Hiring Team,",
        "",
        f"I'm applying for the {job.title} role at {job.company.name}. I'm a {user.get_major_display()} graduate"
        f"{' of ' + user.university if user.university else ''}{' (' + str(user.graduation_year) + ')' if user.graduation_year else ''}"
        f"{', CGPA ' + str(user.cgpa) if user.cgpa else ''}, and I'm looking for a first role where I can learn fast and contribute from week one.",
    ]
    if matched:
        lines.append(f"The role asks for skills I've practised in my projects and coursework: {', '.join(matched)}.")
    if note:
        lines.append(note.strip())
    lines += [
        "My CV is attached. I'd be glad to take any test or assignment as part of your process.",
        "",
        "Thank you for your time,",
        user.full_name,
        " · ".join(x for x in [user.phone, user.email, user.linkedin] if x),
    ]
    return "\n".join(lines)


def _send_email(app, user, job, cv):
    subject = f"Application: {job.title} — {user.full_name} (via Sonarhorin)"
    msg = EmailMessage(subject, app.cover_letter, settings.DEFAULT_FROM_EMAIL, [job.inbox], reply_to=[user.email],
                       headers={"X-Sonarhorin-Application": str(app.id)})
    if cv and cv.file:
        try:
            cv.file.open("rb")
            msg.attach(cv.original_name, cv.file.read())
        finally:
            cv.file.close()
    msg.send(fail_silently=False)


class ApplyError(Exception):
    pass


def apply(user, job, note="", auto=False, letter=None):
    """Create the application and deliver it through the job's channel. Returns JobApplication."""
    if not job.is_open:
        raise ApplyError("This job is closed.")
    if JobApplication.objects.filter(user=user, job=job).exists():
        raise ApplyError("You've already applied to this job.")
    channel = job.effective_channel()
    cv = latest_cv(user)
    if channel in ("partner", "email", "ats") and not cv:
        raise ApplyError("Upload your CV first (Judge my CV) — we attach it to every application.")
    try:
        with transaction.atomic():
            app = JobApplication.objects.create(
                user=user, job=job, channel=channel, auto=auto, cv=cv,
                status={"partner": "submitted", "email": "sent", "ats": "submitted", "portal": "needs_action"}[channel],
                cover_letter=letter or cover_letter(user, job, note),
            )
    except IntegrityError:
        raise ApplyError("You've already applied to this job.")
    if channel == "email":
        try:
            _send_email(app, user, job, cv)
            app.sent_at = timezone.now()
        except Exception as exc:  # SMTP down, bad address…
            log.warning("email apply failed: %s", exc)
            app.status, app.error = "failed", str(exc)[:300]
        app.save(update_fields=["status", "sent_at", "error"])
    elif channel == "partner":
        app.sent_at = timezone.now()
        app.save(update_fields=["sent_at"])
    elif channel == "ats":
        from .ats import submit_application
        try:
            submit_application(job, user, cv, app.cover_letter)
            app.sent_at = timezone.now()
        except Exception as exc:  # key revoked, required custom question, ATS down…
            log.warning("ATS apply failed for job %s: %s", job.id, exc)
            app.status, app.error = "needs_action", f"Couldn't submit automatically — finish on the company page. ({str(exc)[:200]})"
        app.save(update_fields=["status", "sent_at", "error"])
    return app


def matching_jobs(user, prefs=None, channels=None):
    """Open, fresher-friendly jobs that fit the user's major and preferences and that they haven't applied to."""
    prefs = prefs or AutoApplySettings(user=user)
    majors = [m.strip() for m in (prefs.majors or user.major).split(",") if m.strip()]
    qs = (Job.objects.filter(is_active=True, experience_max_years__lte=FRESHER_MAX_YEARS)
          .filter(Q(deadline__isnull=True) | Q(deadline__gte=timezone.localdate()))
          .exclude(applications__user=user).select_related("company"))
    mq = Q(majors="")
    for m in majors:
        mq |= Q(majors__icontains=m)
    qs = qs.filter(mq)
    if prefs.locations:
        lq = Q(remote=True)
        for loc in [x.strip() for x in prefs.locations.split(",") if x.strip()]:
            lq |= Q(location__icontains=loc)
        qs = qs.filter(lq)
    if prefs.remote_only:
        qs = qs.filter(remote=True)
    if prefs.job_types:
        qs = qs.filter(job_type__in=[x.strip() for x in prefs.job_types.split(",") if x.strip()])
    if prefs.min_salary:
        qs = qs.filter(Q(salary_max__isnull=True) | Q(salary_max__gte=prefs.min_salary))
    jobs = list(qs)
    if channels:
        jobs = [j for j in jobs if j.effective_channel() in channels]
    return jobs


def run_auto_apply(user, now=None):
    """Apply to new matching partner/email jobs, up to the user's daily cap. Returns list of (job, app|error)."""
    prefs = getattr(user, "auto_apply", None)
    if not prefs or not prefs.enabled:
        return []
    now = now or timezone.now()
    today = timezone.localtime(now).date()
    used = JobApplication.objects.filter(user=user, auto=True, created_at__date=today).count()
    room = max(0, min(prefs.max_per_day, 20) - used)
    allowed = {c for c in prefs.channels.split(",") if c in ("partner", "email", "ats")}
    results = []
    if room and latest_cv(user):
        for job in matching_jobs(user, prefs, channels=allowed)[:room]:
            try:
                results.append((job, apply(user, job, note=prefs.note, auto=True)))
            except ApplyError as e:
                results.append((job, str(e)))
    prefs.last_run = now
    prefs.save(update_fields=["last_run"])
    return results


# ---------------------------------------------------------------- careers-page importer
FRESHER_RX = re.compile(r"fresher|entry[- ]level|graduate trainee|management trainee|\bmto\b|internship|intern\b|0\s*[-–to]+\s*1\s*year|no experience|trainee", re.I)
SENIOR_RX = re.compile(r"\b([2-9]|1\d)\+?\s*(?:-\s*\d+\s*)?years?\b", re.I)
MAIL_RX = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
TAG_RX = re.compile(r"<[^>]+>")


def _text(html):
    import html as h
    return h.unescape(TAG_RX.sub(" ", html or "")).replace("\xa0", " ").strip()


def postings_from_html(html):
    """Yield schema.org JobPosting dicts from a page's JSON-LD blocks."""
    import json

    for block in re.findall(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', html, re.S | re.I):
        try:
            data = json.loads(block.strip())
        except json.JSONDecodeError:
            continue
        stack = data if isinstance(data, list) else [data]
        while stack:
            d = stack.pop(0)  # keep page order
            if isinstance(d, dict):
                if d.get("@type") == "JobPosting" or (isinstance(d.get("@type"), list) and "JobPosting" in d["@type"]):
                    yield d
                stack.extend(d.get("@graph", []) if isinstance(d.get("@graph"), list) else [])
            elif isinstance(d, list):
                stack.extend(d)


def posting_to_fields(p):
    desc = _text(p.get("description", ""))
    exp = p.get("experienceRequirements")
    months = None
    if isinstance(exp, dict):
        months = exp.get("monthsOfExperience")
    blob = f"{p.get('title', '')} {desc} {exp if isinstance(exp, str) else ''}"
    years = None
    if months is not None:
        try:
            years = int(float(months) // 12)
        except (TypeError, ValueError):
            years = None
    if years is None:
        m = SENIOR_RX.search(blob)
        years = int(m.group(1)) if m and not FRESHER_RX.search(p.get("title", "")) else 0
    loc = p.get("jobLocation") or {}
    if isinstance(loc, list):
        loc = loc[0] if loc else {}
    addr = loc.get("address", {}) if isinstance(loc, dict) else {}
    city = addr.get("addressLocality") or addr.get("addressRegion") or "Dhaka" if isinstance(addr, dict) else "Dhaka"
    sal = p.get("baseSalary") or {}
    val = sal.get("value", {}) if isinstance(sal, dict) else {}
    etype = p.get("employmentType", "")
    etype = etype[0] if isinstance(etype, list) and etype else etype
    jt = "internship" if "INTERN" in str(etype).upper() or re.search(r"intern", p.get("title", ""), re.I) else \
         "trainee" if re.search(r"trainee|\bmto\b", p.get("title", ""), re.I) else \
         "part_time" if "PART" in str(etype).upper() else "full_time"
    mail = MAIL_RX.search(desc)
    deadline = (p.get("validThrough") or "")[:10] or None
    return {
        "title": (p.get("title") or "").strip()[:160],
        "description": desc[:5000],
        "location": str(city)[:100],
        "remote": p.get("jobLocationType") == "TELECOMMUTE",
        "experience_max_years": years,
        "fresher": years <= FRESHER_MAX_YEARS or bool(FRESHER_RX.search(blob)),
        "salary_min": int(val["minValue"]) if isinstance(val, dict) and val.get("minValue") else None,
        "salary_max": int(val["maxValue"]) if isinstance(val, dict) and val.get("maxValue") else None,
        "job_type": jt,
        "deadline": deadline,
        "apply_url": p.get("url", "") or "",
        "apply_email": mail.group(0) if mail else "",
        "external_id": str((p.get("identifier") or {}).get("value", "") if isinstance(p.get("identifier"), dict) else p.get("identifier") or p.get("url") or p.get("title"))[:200],
        "company_name": ((p.get("hiringOrganization") or {}).get("name") if isinstance(p.get("hiringOrganization"), dict) else None),
    }

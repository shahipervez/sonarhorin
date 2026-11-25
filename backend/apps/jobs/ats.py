"""Import jobs from companies' own public job boards — and apply to them from Sonarhorin.

Sources (all public, made for exactly this):
  greenhouse  GET https://boards-api.greenhouse.io/v1/boards/<slug>/jobs?content=true
  lever       GET https://api.lever.co/v0/postings/<slug>?mode=json
  workable    GET https://apply.workable.com/api/v1/widget/accounts/<slug>?details=true

One-click apply (application lands inside the company's own ATS, no third party):
  greenhouse  POST https://boards-api.greenhouse.io/v1/boards/<slug>/jobs/<id>   (Basic auth, company's Job Board API key)
  lever       POST https://api.lever.co/v0/postings/<slug>/<id>?key=<key>        (company's postings API key)
Both need a key the *company* creates and gives us (Company.ats_api_key). Without it a job falls back to the
assisted "portal" channel. Workable's apply API needs a partner token, so Workable jobs are always "portal".

No scraping, no fake browsers, no LinkedIn.
"""
import base64
import html as htmllib
import json
import logging
import re
import urllib.parse
import urllib.request
import uuid
from datetime import datetime

from django.db import transaction
from django.utils import timezone

from .models import Company, Job
from .scraper import clean_html_text, extract_skills, infer_job_type, infer_majors

log = logging.getLogger("sonarhorin.ats")
UA = "SonarhorinJobsBot/1.0 (+https://sonarhorin.com; jobs@sonarhorin.com)"
SUPPORTED = ("greenhouse", "lever", "workable")
DIRECT_APPLY = ("greenhouse", "lever")
FRESHER_MAX_YEARS = 1
BD_RX = re.compile(r"bangladesh|dhaka|chatt?ogram|chittagong|sylhet|khulna|rajshahi|gazipur|narayanganj|\bbd\b", re.I)
REMOTE_RX = re.compile(r"\bremote\b|anywhere|work from home", re.I)
EXP_RX = re.compile(r"(\d{1,2})\s*\+?\s*(?:(?:-|–|to)\s*\d{1,2}\s*)?(?:years?|yrs?)", re.I)


# --------------------------------------------------------------------------- http
def http(url, method="GET", data=None, headers=None, timeout=20):
    """Small urllib wrapper; returns (status, parsed JSON or text). Patched in tests."""
    req = urllib.request.Request(url, data=data, method=method, headers={"User-Agent": UA, "Accept": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read().decode("utf-8", "replace")
            status = r.status
    except urllib.error.HTTPError as e:
        body, status = e.read().decode("utf-8", "replace"), e.code
    try:
        return status, json.loads(body)
    except ValueError:
        return status, body


def multipart(fields, files):
    """Encode multipart/form-data. files: {name: (filename, bytes, content_type)}."""
    boundary = uuid.uuid4().hex
    out = bytearray()
    for k, v in fields.items():
        if v in (None, ""):
            continue
        out += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    for k, (fname, blob, ctype) in files.items():
        out += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="{fname}"\r\nContent-Type: {ctype}\r\n\r\n'.encode()
        out += blob + b"\r\n"
    out += f"--{boundary}--\r\n".encode()
    return bytes(out), f"multipart/form-data; boundary={boundary}"


# --------------------------------------------------------------------------- helpers
def experience_years(text):
    """Smallest 'N years' mentioned near the word experience (0 when none). '0-2 years' → 0."""
    best = None
    for m in EXP_RX.finditer(text or ""):
        window = text[max(0, m.start() - 80): m.end() + 80].lower()
        if "experience" in window or "exp." in window:
            n = int(m.group(1))
            best = n if best is None else min(best, n)
    return best or 0


def _date(s):
    if not s:
        return timezone.now()
    try:
        if isinstance(s, (int, float)):  # Lever: ms since epoch
            return datetime.fromtimestamp(s / 1000, tz=timezone.utc)
        d = datetime.fromisoformat(str(s).replace("Z", "+00:00"))
        return d if d.tzinfo else timezone.make_aware(d)
    except (ValueError, OSError):
        return timezone.now()


def _text(raw):
    return clean_html_text(htmllib.unescape(raw or ""))


# --------------------------------------------------------------------------- fetchers → normalized dicts
def fetch_greenhouse(slug):
    st, d = http(f"https://boards-api.greenhouse.io/v1/boards/{urllib.parse.quote(slug)}/jobs?content=true")
    if st != 200 or not isinstance(d, dict):
        raise RuntimeError(f"Greenhouse board '{slug}' answered {st}")
    out = []
    for j in d.get("jobs", []):
        loc = (j.get("location") or {}).get("name", "")
        out.append({"external_id": f"gh:{j['id']}", "title": j.get("title", "").strip(), "location": loc,
                    "remote": bool(REMOTE_RX.search(loc)), "description": _text(j.get("content")),
                    "apply_url": j.get("absolute_url", ""), "posted_at": _date(j.get("updated_at")), "commitment": ""})
    return out


def fetch_lever(slug):
    st, d = http(f"https://api.lever.co/v0/postings/{urllib.parse.quote(slug)}?mode=json")
    if st != 200 or not isinstance(d, list):
        raise RuntimeError(f"Lever site '{slug}' answered {st}")
    out = []
    for p in d:
        cat = p.get("categories") or {}
        lists = "\n\n".join(f"{x.get('text', '')}\n{_text(x.get('content'))}" for x in p.get("lists") or [])
        out.append({"external_id": f"lv:{p['id']}", "title": p.get("text", "").strip(), "location": cat.get("location") or "",
                    "remote": p.get("workplaceType") == "remote", "description": ((p.get("descriptionPlain") or "") + "\n\n" + lists).strip(),
                    "apply_url": p.get("applyUrl") or p.get("hostedUrl", ""), "posted_at": _date(p.get("createdAt")),
                    "commitment": cat.get("commitment") or ""})
    return out


def fetch_workable(slug):
    st, d = http(f"https://apply.workable.com/api/v1/widget/accounts/{urllib.parse.quote(slug)}?details=true")
    if st != 200 or not isinstance(d, dict):
        raise RuntimeError(f"Workable account '{slug}' answered {st}")
    out = []
    for j in d.get("jobs", []):
        loc = ", ".join(x for x in (j.get("city"), j.get("state"), j.get("country")) if x)
        out.append({"external_id": f"wk:{j.get('shortcode') or j.get('code')}", "title": j.get("title", "").strip(), "location": loc,
                    "remote": bool(j.get("telecommuting")), "description": _text(j.get("description")),
                    "apply_url": j.get("application_url") or j.get("shortlink") or j.get("url", ""),
                    "posted_at": _date(j.get("published_on") or j.get("created_at")), "commitment": j.get("employment_type") or ""})
    return out


FETCHERS = {"greenhouse": fetch_greenhouse, "lever": fetch_lever, "workable": fetch_workable}


# --------------------------------------------------------------------------- import
def _job_type(title, text, commitment):
    c = (commitment or "").lower()
    if "intern" in c:
        return "internship"
    if "part" in c:
        return "part_time"
    return infer_job_type(title, text)


def import_company(company, now=None):
    """Upsert one company's open jobs. Returns stats dict. Closes jobs that disappeared from the board."""
    now = now or timezone.now()
    stats = {"company": company.name, "created": 0, "updated": 0, "closed": 0, "skipped": 0, "error": ""}
    fetch = FETCHERS.get(company.ats)
    if not fetch or not company.ats_slug:
        stats["error"] = "No supported ATS / slug set"
        return stats
    try:
        postings = fetch(company.ats_slug)
    except Exception as exc:  # network, 404, bad JSON…
        log.warning("ATS import failed for %s: %s", company, exc)
        company.import_error = str(exc)[:300]
        company.save(update_fields=["import_error"])
        stats["error"] = company.import_error
        return stats

    channel = "ats" if company.ats in DIRECT_APPLY and company.ats_api_key else "portal"
    prefix = postings[0]["external_id"].split(":")[0] + ":" if postings else {"greenhouse": "gh:", "lever": "lv:", "workable": "wk:"}[company.ats]
    seen = []
    with transaction.atomic():
        for p in postings:
            text = p["description"]
            in_bd = bool(BD_RX.search(p["location"])) or (p["remote"] and BD_RX.search(p["title"] + " " + p["location"]))
            if company.bd_only and not in_bd:
                stats["skipped"] += 1
                continue
            years = experience_years(text)
            if years > FRESHER_MAX_YEARS:  # this is a fresher-only site
                stats["skipped"] += 1
                continue
            seen.append(p["external_id"])
            fields = {
                "title": p["title"][:160], "location": (p["location"] or company.city or "Bangladesh")[:100], "remote": p["remote"],
                "job_type": _job_type(p["title"], text, p["commitment"]), "majors": infer_majors(p["title"], text)[:120],
                "experience_max_years": years, "description": text, "requirements": extract_skills(p["title"], text),
                "apply_channel": channel, "apply_url": p["apply_url"][:200], "source": "import", "source_url": p["apply_url"][:200],
                "posted_at": p["posted_at"], "is_active": True,
            }
            job, created = Job.objects.update_or_create(company=company, external_id=p["external_id"], defaults=fields)
            stats["created" if created else "updated"] += 1
        stats["closed"] = (Job.objects.filter(company=company, source="import", external_id__startswith=prefix, is_active=True)
                           .exclude(external_id__in=seen).update(is_active=False))
        company.last_imported_at, company.import_error = now, ""
        company.save(update_fields=["last_imported_at", "import_error"])

    if not company.logo:
        from .logos import fetch_real_logo
        fetch_real_logo(company)
    return stats


def import_all():
    qs = Company.objects.filter(auto_import=True, ats__in=SUPPORTED).exclude(ats_slug="")
    return [import_company(c) for c in qs]


# --------------------------------------------------------------------------- one-click apply into the company's ATS
class DirectApplyError(Exception):
    pass


def _split_name(full):
    parts = (full or "").strip().split()
    return (parts[0] if parts else "Candidate"), (" ".join(parts[1:]) or "-")


def _cv_file(cv):
    cv.file.open("rb")
    try:
        blob = cv.file.read()
    finally:
        cv.file.close()
    name = cv.original_name or "cv.pdf"
    ext = name.rsplit(".", 1)[-1].lower()
    ctype = {"pdf": "application/pdf", "doc": "application/msword", "txt": "text/plain", "rtf": "application/rtf",
             "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}.get(ext, "application/octet-stream")
    return name, blob, ctype


def submit_application(job, user, cv, letter):
    """Send the application straight into the company's ATS. Returns the ATS's application id (or '')."""
    c = job.company
    ext_id = job.external_id.split(":", 1)[-1]
    if not (c.ats_api_key and cv and cv.file):
        raise DirectApplyError("Missing company key or CV")
    resume = _cv_file(cv)
    phone = getattr(user, "phone", "") or ""
    if c.ats == "greenhouse":
        first, last = _split_name(user.full_name)
        body, ctype = multipart({"first_name": first, "last_name": last, "email": user.email, "phone": phone,
                                 "cover_letter_text": letter}, {"resume": resume})
        token = base64.b64encode(f"{c.ats_api_key}:".encode()).decode()
        st, d = http(f"https://boards-api.greenhouse.io/v1/boards/{urllib.parse.quote(c.ats_slug)}/jobs/{ext_id}", "POST", body,
                     {"Content-Type": ctype, "Authorization": f"Basic {token}"})
        if st not in (200, 201):
            raise DirectApplyError(f"Greenhouse said {st}: {str(d)[:160]}")
        return str((d or {}).get("id", "")) if isinstance(d, dict) else ""
    if c.ats == "lever":
        body, ctype = multipart({"name": user.full_name, "email": user.email, "phone": phone, "comments": letter,
                                 "source": "Sonarhorin"}, {"resume": resume})
        st, d = http(f"https://api.lever.co/v0/postings/{urllib.parse.quote(c.ats_slug)}/{ext_id}?key={urllib.parse.quote(c.ats_api_key)}",
                     "POST", body, {"Content-Type": ctype})
        if st != 200 or not (isinstance(d, dict) and d.get("ok")):
            raise DirectApplyError(f"Lever said {st}: {str(d)[:160]}")
        return str(d.get("applicationId", ""))
    raise DirectApplyError(f"Direct apply isn't available for {c.ats}")

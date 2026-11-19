"""Bilingual (English + Bangla) alert text."""
from django.conf import settings

BN_DIGITS = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")


def bn(n) -> str:
    return str(n).translate(BN_DIGITS)


def _salary(job):
    if job.salary_min and job.salary_max:
        return f"৳{job.salary_min:,}–{job.salary_max:,}/month"
    if job.salary_min or job.salary_max:
        return f"৳{(job.salary_min or job.salary_max):,}/month"
    return ""


def job_line(job):
    site = settings.SITE_URL.rstrip("/")
    bits = [job.location + (" · Remote" if job.remote else ""), job.get_job_type_display(), _salary(job)]
    meta = " · ".join(b for b in bits if b)
    deadline = f"\n   Deadline / শেষ তারিখ: {job.deadline:%d %b %Y}" if job.deadline else ""
    return f"• {job.title} — {job.company.name}\n   {meta}{deadline}\n   {site}/jobs/{job.id}"


def build(alert, jobs, test=False):
    n = len(jobs)
    site = settings.SITE_URL.rstrip("/")
    prefix = "[TEST] " if test else ""
    plural = "s" if n != 1 else ""
    subject = f"{prefix}{n} new job{plural} for “{alert.name}” · “{alert.name}”-এর জন্য {bn(n)}টি নতুন চাকরি"
    head = (f"Hi {alert.user.full_name or 'there'},\n"
            f"{n} new opening{plural} match your alert “{alert.name}”.\n"
            f"আপনার “{alert.name}” অ্যালার্টের সাথে মিলে যাওয়া {bn(n)}টি নতুন সুযোগ পাওয়া গেছে।\n")
    if test:
        head += "This is a test message: your alert is working. / এটি একটি পরীক্ষামূলক বার্তা — আপনার অ্যালার্ট কাজ করছে।\n"
    body = "\n\n".join(job_line(j) for j in jobs) if jobs else "(No matching jobs right now / এই মুহূর্তে কোনো মিল নেই)"
    foot = f"\n\nManage alerts / অ্যালার্ট পরিবর্তন করুন: {site}/alerts\n— Sonarhorin · সোনারহরিণ"
    first = jobs[0] if jobs else None
    return {
        "subject": subject,
        "text": f"{head}\n{body}{foot}",
        "title": subject,
        "short": f"{first.title} — {first.company.name}" if first else alert.name,
        "url": f"{site}/jobs/{first.id}" if first else f"{site}/alerts",
    }

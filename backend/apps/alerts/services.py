"""Job-alert matching and delivery.

Flow
  * A new ``jobs.Job`` is saved -> :func:`queue_instant` (via the post_save signal) creates ``pending``
    :class:`AlertDelivery` rows for every matching *instant* alert. No network I/O happens in the save path.
  * ``manage.py send_job_alerts`` (cron, e.g. every 10 minutes) calls :func:`run_daily` (queues digests for daily
    alerts that are due) and :func:`send_pending` (sends everything pending, grouped into one message per
    alert + channel, retrying failures up to ``MAX_ATTEMPTS``).
  * The unique (alert, job, channel) constraint guarantees a job is never sent twice on the same channel.
"""
import logging
import os
import re
from collections import defaultdict
from datetime import timedelta

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone

from apps.jobs.models import Job

from . import channels, messages
from .models import AlertDelivery, JobAlert

log = logging.getLogger("apps.alerts")
MAX_ATTEMPTS = 3
MAX_JOBS_PER_MESSAGE = 15
FRESHER_MAX_YEARS = 1
JOB_TYPES_FOR = {"job": {"full_time", "trainee", "part_time"}, "internship": {"internship"}}
DAILY_EVERY = timedelta(hours=23)  # a little under 24h so a daily cron at a fixed time never skips a day


def _contains(text, needle):
    return re.search(rf"(?<![a-z0-9]){re.escape(needle)}(?![a-z0-9])", text) is not None


def job_text(job):
    reqs = " ".join(str(r) for r in (job.requirements or []))
    return f"{job.title} {job.company.name} {job.description} {reqs}".lower()


def match_alert(alert: JobAlert, job: Job) -> bool:
    """True when ``job`` satisfies every filter on ``alert``. Pure function: no DB writes."""
    if not job.is_open or job.experience_max_years > FRESHER_MAX_YEARS:
        return False
    if alert.job_type in JOB_TYPES_FOR and job.job_type not in JOB_TYPES_FOR[alert.job_type]:
        return False
    want_majors = set(alert.split(alert.majors))
    if want_majors and job.majors.strip():  # blank job.majors = open to any major
        if not want_majors & {m.lower() for m in job.major_list}:
            return False
    if alert.location.strip():
        loc_ok = alert.location.strip().lower() in job.location.lower()
        if not loc_ok and not (alert.remote_ok and job.remote):
            return False
    if alert.min_salary:
        best = job.salary_max or job.salary_min
        if best is not None and best < alert.min_salary:  # unknown salary still matches (common for fresher posts)
            return False
    kws = alert.split(alert.keywords)
    if kws:
        text = job_text(job)
        if not any(_contains(text, k) for k in kws):
            return False
    return True


def _queue(alert, job):
    created = 0
    for ch in alert.enabled_channels():
        try:
            with transaction.atomic():
                _, made = AlertDelivery.objects.get_or_create(alert=alert, job=job, channel=ch)
            created += made
        except IntegrityError:  # raced with another worker: already queued
            pass
    return created


def queue_instant(job: Job) -> int:
    """Queue ``pending`` deliveries for every active instant alert matching ``job``. Returns rows created."""
    if not job.is_open:
        return 0
    n = 0
    for alert in JobAlert.objects.filter(is_active=True, frequency="instant").select_related("user"):
        if alert.user.is_active and match_alert(alert, job):
            n += _queue(alert, job)
    return n


def candidate_jobs(since):
    today = timezone.localdate()
    return (Job.objects.filter(is_active=True, posted_at__gt=since, experience_max_years__lte=FRESHER_MAX_YEARS)
            .filter(Q(deadline__isnull=True) | Q(deadline__gte=today)).select_related("company"))


def run_daily(now=None) -> int:
    """Queue digest deliveries for daily alerts that are due. Returns rows created."""
    now = now or timezone.now()
    n = 0
    due = JobAlert.objects.filter(is_active=True, frequency="daily", user__is_active=True).filter(
        Q(last_sent_at__isnull=True) | Q(last_sent_at__lte=now - DAILY_EVERY)).select_related("user")
    for alert in due:
        since = alert.last_sent_at or now - timedelta(days=1)
        for job in candidate_jobs(since):
            if match_alert(alert, job):
                n += _queue(alert, job)
        # Mark the digest as done even with zero matches so the window keeps moving.
        JobAlert.objects.filter(pk=alert.pk).update(last_sent_at=now)
    return n


def send_pending(now=None) -> dict:
    """Send all pending (and retryable failed) deliveries, one message per (alert, channel)."""
    now = now or timezone.now()
    stats = {"sent": 0, "failed": 0, "skipped": 0}
    rows = (AlertDelivery.objects.filter(Q(status="pending") | Q(status="failed", attempts__lt=MAX_ATTEMPTS))
            .filter(alert__is_active=True).select_related("alert__user", "job__company").order_by("alert_id", "channel", "-job__posted_at"))
    groups = defaultdict(list)
    for d in rows:
        groups[(d.alert_id, d.channel)].append(d)
    for (_, ch_name), items in groups.items():
        alert = items[0].alert
        live = [d for d in items if d.job.is_open]
        for d in items:
            if d not in live:
                d.status, d.error = "skipped", "Job closed before delivery"
                d.save(update_fields=["status", "error"])
        live = live[:MAX_JOBS_PER_MESSAGE]  # the rest stay pending for the next run
        if not live:
            continue
        ch = channels.get(ch_name)
        if ch is None or not ch.available(alert):
            res = channels.Result(ok=False, skipped=True, error="Channel not configured")
        else:
            res = ch.send(alert, [d.job for d in live], messages.build(alert, [d.job for d in live]))
        status = "sent" if res.ok else ("skipped" if res.skipped else "failed")
        AlertDelivery.objects.filter(pk__in=[d.pk for d in live]).update(
            status=status, error=res.error[:300], attempts=live[0].attempts + 1, sent_at=now if res.ok else None)
        stats[status] += len(live)
        if res.ok:
            JobAlert.objects.filter(pk=alert.pk).update(last_sent_at=now)
    return stats


def send_test(alert: JobAlert) -> dict:
    """Send a sample message on every enabled channel without recording deliveries."""
    jobs = [j for j in candidate_jobs(timezone.now() - timedelta(days=30))[:200] if match_alert(alert, j)][:3]
    msg = messages.build(alert, jobs, test=True)
    out = {}
    for name in alert.enabled_channels():
        ch = channels.get(name)
        if ch is None or not ch.available(alert):
            out[name] = {"ok": False, "skipped": True, "detail": "Channel not configured"}
            continue
        r = ch.send(alert, jobs, msg)
        out[name] = {"ok": r.ok, "skipped": r.skipped, "detail": r.error}
    return {"matched_jobs": len(jobs), "channels": out}


def send_on_save_enabled():
    return os.getenv("ALERTS_SEND_ON_SAVE", "").lower() in ("1", "true", "yes")

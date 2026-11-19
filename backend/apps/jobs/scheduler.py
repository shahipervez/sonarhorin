"""Automated background scheduler for Bangladesh job scraping.

Runs periodically in a background daemon thread inside Django, keeping the
job database refreshed without blocking HTTP workers.

The in-process thread is **opt-in** outside local development: serverless
platforms (Vercel) freeze or kill the process between requests, and multi-worker
gunicorn would start one thread per worker. In production, scraping is driven by
GitHub Actions cron instead (``.github/workflows/scrape-jobs.yml`` runs
``python manage.py run_job_scraper``).

Control with ``ENABLE_INPROCESS_SCHEDULER``:
  * ``true``/``1``  -> always start the thread
  * ``false``/``0`` -> never start it
  * unset           -> start only for local dev (DEBUG on and not on Vercel)
"""
import logging
import os
import threading
import time
from django.utils import timezone

log = logging.getLogger("sonarhorin.scheduler")

_SCHEDULER_THREAD = None
_LAST_RUN = None
_LAST_STATS = None
_IS_RUNNING = False
_LOCK = threading.Lock()

# Default interval: 60 minutes (configurable via env var AUTO_SCRAPE_INTERVAL_MINUTES)
INTERVAL_MINUTES = int(os.environ.get("AUTO_SCRAPE_INTERVAL_MINUTES", "60"))


def inprocess_enabled():
    """Whether the in-process scraper thread should run in this process."""
    explicit = os.environ.get("ENABLE_INPROCESS_SCHEDULER")
    if explicit is not None and explicit.strip() != "":
        return explicit.strip().lower() in ("1", "true", "yes", "on")
    if os.environ.get("VERCEL"):
        return False
    from django.conf import settings
    return bool(getattr(settings, "DEBUG", False))


def get_status():
    """Returns the current scheduler status for API and Admin display."""
    from apps.jobs.models import Job
    return {
        "enabled": inprocess_enabled(),
        "mode": "in-process thread" if inprocess_enabled() else "external cron (GitHub Actions)",
        "is_running": _IS_RUNNING,
        "interval_minutes": INTERVAL_MINUTES,
        "last_run": _LAST_RUN.isoformat() if _LAST_RUN else None,
        "last_stats": _LAST_STATS,
        "total_active_jobs": Job.objects.filter(is_active=True).count(),
        "total_internships": Job.objects.filter(is_active=True, job_type="internship").count(),
    }


def _worker_loop():
    global _LAST_RUN, _LAST_STATS, _IS_RUNNING
    # Initial warm-up delay so Django startup completes cleanly
    time.sleep(10)

    while True:
        with _LOCK:
            _IS_RUNNING = True
        try:
            from apps.jobs.scraper import run_scraper
            log.info("Auto-scraper background cycle starting...")
            stats = run_scraper(limit_per_query=8, fetch_details=True)
            _LAST_RUN = timezone.now()
            _LAST_STATS = stats
            log.info("Auto-scraper cycle finished: %d created, %d updated.", stats["created"], stats["updated"])
        except Exception as e:
            log.error("Error in background job scraper cycle: %s", e)
        finally:
            with _LOCK:
                _IS_RUNNING = False

        # Sleep until next scheduled cycle
        time.sleep(INTERVAL_MINUTES * 60)


def start_scheduler():
    """Start the background scheduler thread if not already running."""
    global _SCHEDULER_THREAD
    if not inprocess_enabled():
        log.info("In-process job scheduler disabled (set ENABLE_INPROCESS_SCHEDULER=true to enable).")
        return

    if _SCHEDULER_THREAD is not None and _SCHEDULER_THREAD.is_alive():
        return

    _SCHEDULER_THREAD = threading.Thread(target=_worker_loop, daemon=True, name="JobScraperScheduler")
    _SCHEDULER_THREAD.start()
    log.info("Started background Bangladesh Job Scraper (cycle: every %d minutes).", INTERVAL_MINUTES)


def trigger_immediate_scrape(queries=None, limit=8, fetch_details=False):
    """Trigger a scrape run immediately on demand (e.g. from API or Admin)."""
    global _LAST_RUN, _LAST_STATS, _IS_RUNNING
    with _LOCK:
        _IS_RUNNING = True
    try:
        from apps.jobs.scraper import run_scraper
        stats = run_scraper(queries=queries, limit_per_query=limit, fetch_details=fetch_details)
        _LAST_RUN = timezone.now()
        _LAST_STATS = stats
        return stats
    finally:
        with _LOCK:
            _IS_RUNNING = False

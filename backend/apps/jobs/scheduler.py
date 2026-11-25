"""Automated background scheduler for Bangladesh job scraping.

Runs periodically in a background daemon thread inside Django, keeping the
job database refreshed without blocking HTTP workers.
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


def get_status():
    """Returns the current scheduler status for API and Admin display."""
    from apps.jobs.models import Job
    return {
        "enabled": True,
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
            from apps.jobs.ats import import_all
            log.info("Job import cycle starting (company job boards)...")
            boards = import_all()
            stats = {"created": sum(b["created"] for b in boards), "updated": sum(b["updated"] for b in boards),
                     "closed": sum(b["closed"] for b in boards), "boards": boards}
            # LinkedIn's terms forbid scraping — the old guest scraper only runs if someone turns it on deliberately.
            if os.environ.get("ENABLE_LINKEDIN_GUEST_SCRAPER") == "1":
                from apps.jobs.scraper import run_scraper
                li = run_scraper(limit_per_query=8, fetch_details=True)
                stats["created"] += li["created"]; stats["updated"] += li["updated"]
            _LAST_RUN = timezone.now()
            _LAST_STATS = stats
            log.info("Job import cycle finished: %d created, %d updated, %d closed.", stats["created"], stats["updated"], stats["closed"])
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
    # In Django dev server, autoreload creates two processes. Only run in the main child process.
    if os.environ.get("RUN_MAIN") != "true" and "gunicorn" not in os.environ.get("SERVER_SOFTWARE", ""):
        # Check if running under direct manage.py runserver
        pass

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
        from apps.jobs.ats import import_all
        boards = import_all()
        stats = {"created": sum(b["created"] for b in boards), "updated": sum(b["updated"] for b in boards),
                 "closed": sum(b["closed"] for b in boards), "boards": boards}
        if os.environ.get("ENABLE_LINKEDIN_GUEST_SCRAPER") == "1":
            from apps.jobs.scraper import run_scraper
            li = run_scraper(queries=queries, limit_per_query=limit, fetch_details=fetch_details)
            stats["created"] += li["created"]; stats["updated"] += li["updated"]
        _LAST_RUN = timezone.now()
        _LAST_STATS = stats
        return stats
    finally:
        with _LOCK:
            _IS_RUNNING = False

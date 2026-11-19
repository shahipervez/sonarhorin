import os
import sys
from django.apps import AppConfig


class JobsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.jobs"
    verbose_name = "Jobs & auto-apply"

    def ready(self):
        # Only web servers get the background thread: skip every manage.py command except runserver
        # (migrate, test, check, shell, run_job_scraper, send_job_alerts, ...).
        if sys.argv and sys.argv[0].endswith("manage.py") and (len(sys.argv) < 2 or sys.argv[1] != "runserver"):
            return
        if any(cmd in sys.argv for cmd in ["migrate", "makemigrations", "test", "check", "collectstatic", "run_job_scraper"]):
            return
        if "runserver" in sys.argv and os.environ.get("RUN_MAIN") != "true":
            return

        try:
            from . import scheduler
            # Opt-in outside local dev: see scheduler.inprocess_enabled() / ENABLE_INPROCESS_SCHEDULER.
            scheduler.start_scheduler()
        except Exception:
            pass

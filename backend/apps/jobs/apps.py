import os
import sys
from django.apps import AppConfig


class JobsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.jobs"
    verbose_name = "Jobs & auto-apply"

    def ready(self):
        # Don't run background threads during migrations or test runs
        if any(cmd in sys.argv for cmd in ["migrate", "makemigrations", "test", "check", "collectstatic", "run_job_scraper"]):
            return
        if "runserver" in sys.argv and os.environ.get("RUN_MAIN") != "true":
            return

        try:
            from . import scheduler
            scheduler.start_scheduler()
        except Exception:
            pass

"""Queue instant alerts whenever a new Job row is created (admin, partner post, scraper or import_jobs).

Note: ``bulk_create`` bypasses signals; code that bulk-inserts jobs should call
``apps.alerts.services.queue_instant(job)`` for each new job itself.
"""
import logging

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.jobs.models import Job

log = logging.getLogger("apps.alerts")


@receiver(post_save, sender=Job, dispatch_uid="alerts_queue_instant")
def job_created(sender, instance, created, raw=False, **kwargs):
    if not created or raw:  # raw = loaddata fixtures
        return

    def _run():
        from . import services
        try:
            if services.queue_instant(instance) and services.send_on_save_enabled():
                services.send_pending()
        except Exception:  # alerts must never break job creation / scraping
            log.exception("queueing alerts for job %s failed", instance.pk)

    transaction.on_commit(_run)

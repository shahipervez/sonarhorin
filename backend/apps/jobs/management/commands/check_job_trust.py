"""Backfill / re-run the scam detector: `python manage.py check_job_trust [--all] [--ai] [--job ID]`."""
from django.core.management.base import BaseCommand

from apps.core import ai
from apps.jobs import trust
from apps.jobs.models import Job


class Command(BaseCommand):
    help = "Score jobs with the fake/scam-job detector and store trust_level / trust_score / trust_reasons."

    def add_arguments(self, parser):
        parser.add_argument("--all", action="store_true", help="Include inactive / expired jobs (default: active only).")
        parser.add_argument("--ai", action="store_true", help="Also ask Claude for extra signals (needs ANTHROPIC_API_KEY).")
        parser.add_argument("--job", type=int, help="Only this job id.")

    def handle(self, *args, **o):
        qs = Job.objects.select_related("company")
        if o["job"]:
            qs = qs.filter(pk=o["job"])
        elif not o["all"]:
            qs = qs.filter(is_active=True)
        use_ai = o["ai"] and ai.enabled()
        if o["ai"] and not use_ai:
            self.stdout.write(self.style.WARNING("ANTHROPIC_API_KEY not set — rules only."))
        counts = {lvl: 0 for lvl in trust.LEVELS}
        for job in qs.iterator(chunk_size=200):
            trust.refresh(job, use_ai=use_ai)
            counts[job.trust_level] += 1
        self.stdout.write(self.style.SUCCESS("Checked {} jobs: ".format(sum(counts.values()))
                                             + ", ".join(f"{k}={v}" for k, v in counts.items())))

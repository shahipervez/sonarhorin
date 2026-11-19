from django.core.management.base import BaseCommand

from apps.alerts import services


class Command(BaseCommand):
    help = "Queue daily job-alert digests that are due and send every pending alert delivery. Safe to run often (cron)."

    def add_arguments(self, parser):
        parser.add_argument("--skip-daily", action="store_true", help="Only send already-queued (instant) deliveries.")

    def handle(self, *args, **opts):
        queued = 0 if opts["skip_daily"] else services.run_daily()
        stats = services.send_pending()
        self.stdout.write(self.style.SUCCESS(
            f"Job alerts: {queued} digest item(s) queued; sent {stats['sent']}, failed {stats['failed']}, skipped {stats['skipped']}."))

from django.core.management.base import BaseCommand

from apps.jobs.models import AutoApplySettings
from apps.jobs.services import run_auto_apply


class Command(BaseCommand):
    help = "Apply for every user with auto-apply on (partner + email jobs only, daily cap). Schedule daily with cron."

    def handle(self, *args, **opts):
        total = 0
        for prefs in AutoApplySettings.objects.filter(enabled=True).select_related("user"):
            res = run_auto_apply(prefs.user)
            ok = sum(1 for _, r in res if not isinstance(r, str) and r.status != "failed")
            total += ok
            if res:
                self.stdout.write(f"{prefs.user.email}: {ok}/{len(res)} applied")
        self.stdout.write(self.style.SUCCESS(f"Auto-apply done — {total} applications sent."))

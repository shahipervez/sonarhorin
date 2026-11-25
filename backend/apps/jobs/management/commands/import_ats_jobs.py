from django.core.management.base import BaseCommand

from apps.jobs.ats import import_all, import_company
from apps.jobs.logos import fetch_real_logo
from apps.jobs.models import Company


class Command(BaseCommand):
    help = "Import openings from companies' public job boards (Greenhouse / Lever / Workable) and fetch missing real logos."

    def add_arguments(self, parser):
        parser.add_argument("--company", help="Only this company (slug)")
        parser.add_argument("--logos", action="store_true", help="Also fetch real logos for every company that has none")

    def handle(self, *a, **o):
        stats = [import_company(Company.objects.get(slug=o["company"]))] if o.get("company") else import_all()
        for s in stats:
            self.stdout.write(f"{s['company']}: +{s['created']} new · {s['updated']} updated · {s['closed']} closed · "
                              f"{s['skipped']} skipped{' · ERROR ' + s['error'] if s['error'] else ''}")
        if o.get("logos"):
            got = sum(fetch_real_logo(c) for c in Company.objects.filter(logo=""))
            self.stdout.write(f"Real logos saved: {got}")
        if not stats:
            self.stdout.write("No companies with auto_import on. Set ats + ats_slug + auto_import in the admin.")

"""Import fresher jobs from a company's public careers page.

Reads schema.org JobPosting JSON-LD (what Google for Jobs uses), so it works on any career site
that publishes it — no scraping of HTML layouts, no logins. Respects robots.txt.

  python manage.py import_jobs --company "Padma Pay" --url https://padmapay.example/careers
  python manage.py import_jobs --company "Padma Pay" --file saved_careers_page.html
  python manage.py import_jobs --all-companies          # every Company with a careers_url
"""
import urllib.request
import urllib.robotparser
from urllib.parse import urljoin, urlparse

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.jobs.models import Company, Job
from apps.jobs.services import postings_from_html, posting_to_fields

UA = "SonarhorinJobsBot/1.0 (+https://sonarhorin.com/bot)"


def fetch(url):
    robots = urllib.robotparser.RobotFileParser()
    robots.set_url(urljoin(f"{urlparse(url).scheme}://{urlparse(url).netloc}", "/robots.txt"))
    try:
        robots.read()
        if not robots.can_fetch(UA, url):
            raise CommandError(f"robots.txt disallows {url}")
    except CommandError:
        raise
    except Exception:
        pass  # no robots.txt → allowed
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", "ignore")


class Command(BaseCommand):
    help = "Import fresher-friendly jobs from careers pages (JSON-LD JobPosting)."

    def add_arguments(self, p):
        p.add_argument("--company")
        p.add_argument("--url")
        p.add_argument("--file")
        p.add_argument("--all-companies", action="store_true")
        p.add_argument("--include-senior", action="store_true", help="Also import jobs needing 2+ years")

    def handle(self, *a, **o):
        targets = []
        if o["all_companies"]:
            targets = [(c, c.careers_url, None) for c in Company.objects.exclude(careers_url="")]
        else:
            if not (o["url"] or o["file"]):
                raise CommandError("Give --url, --file or --all-companies")
            comp = None
            if o["company"]:
                comp, _ = Company.objects.get_or_create(name=o["company"], defaults={"careers_url": o["url"] or ""})
            targets = [(comp, o["url"], o["file"])]
        made = upd = skipped = 0
        for comp, url, path in targets:
            html = open(path, encoding="utf-8").read() if path else fetch(url)
            for posting in postings_from_html(html):
                f = posting_to_fields(posting)
                if not f["title"] or (not f.pop("fresher") and not o["include_senior"]):
                    skipped += 1
                    continue
                c = comp or Company.objects.get_or_create(name=f["company_name"] or "Unknown company")[0]
                f.pop("company_name", None)
                channel = "email" if f["apply_email"] else "portal"
                if not f["apply_url"] and url:
                    f["apply_url"] = url
                defaults = {**{k: v for k, v in f.items() if k != "external_id"}, "apply_channel": channel, "source": "import",
                            "source_url": url or "", "is_active": True, "posted_at": timezone.now()}
                _, created = Job.objects.update_or_create(company=c, external_id=f["external_id"], defaults=defaults)
                made += created
                upd += not created
        self.stdout.write(self.style.SUCCESS(f"Imported {made} new, updated {upd}, skipped {skipped} (not fresher-friendly)."))

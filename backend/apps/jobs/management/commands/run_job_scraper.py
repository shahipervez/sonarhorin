"""Management command to run the Bangladesh Career Web Scraper.

Usage:
  python manage.py run_job_scraper
  python manage.py run_job_scraper --limit 10
  python manage.py run_job_scraper --query "Internship,Fresher,Trainee"
"""
from django.core.management.base import BaseCommand
from apps.jobs.scraper import run_scraper


class Command(BaseCommand):
    help = "Scrapes live jobs & internships across Bangladesh career platforms and auto-posts to Sonarhorin."

    def add_arguments(self, parser):
        parser.add_argument(
            "--query",
            type=str,
            default="",
            help="Comma-separated query keywords (e.g. 'Fresher,Internship,Junior Developer').",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=8,
            help="Maximum items to scrape per query (default: 8).",
        )
        parser.add_argument(
            "--no-details",
            action="store_true",
            help="Skip full description fetch for faster execution.",
        )

    def handle(self, *args, **options):
        queries = [q.strip() for q in options["query"].split(",") if q.strip()] if options["query"] else None
        limit = options["limit"]
        fetch_details = not options["no_details"]

        self.stdout.write(self.style.NOTICE(f"Starting Bangladesh Career Web Scraper (limit: {limit})..."))
        res = run_scraper(queries=queries, limit_per_query=limit, fetch_details=fetch_details)

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully completed: {res['created']} new jobs posted, {res['updated']} updated (Total scraped: {res['total_scraped']})."
            )
        )
        for j in res.get("latest_jobs", [])[:5]:
            self.stdout.write(f"  • {j['title']} at {j['company']} [{j['job_type']}] — {j['salary']}")

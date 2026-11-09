from django.core.management.base import BaseCommand
from apps.jobs.company_scraper import sync_top_corporates


class Command(BaseCommand):
    help = "Scrapes authentic corporate logos and connects career portals for top Bangladesh offices."

    def handle(self, *args, **options):
        self.stdout.write("Starting corporate logo scraping and career portal sync...")
        results = sync_top_corporates()
        success_count = sum(1 for r in results if r["logo_saved"])
        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully synced {len(results)} top Bangladesh corporate offices! ({success_count} logos scraped and saved)"
            )
        )
        for r in results:
            self.stdout.write(f" - {r['name']} -> {r['careers_url']} (Logo: {'OK' if r['logo_saved'] else 'None'})")

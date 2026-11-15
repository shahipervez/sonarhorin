"""Management command to seed the database with initial data for production."""
import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = "Seed the database with initial companies, jobs, and users."

    def handle(self, *args, **options):
        self.stdout.write("Loading initial data fixture...")
        # Try multiple paths to find fixture
        fixture_paths = [
            Path(__file__).resolve().parent.parent.parent.parent / "fixtures" / "initial_data.json",
            "apps/jobs/fixtures/initial_data.json",
            "initial_data",
        ]
        for fixture_path in fixture_paths:
            fixture_path = str(fixture_path)
            if Path(fixture_path).exists() or not fixture_path.endswith(".json"):
                try:
                    call_command("loaddata", fixture_path, verbosity=1)
                    self.stdout.write(self.style.SUCCESS("✅ Initial data loaded successfully!"))
                    return
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"⚠️  Fixture load failed ({fixture_path}): {e}"))
        self.stdout.write("Continuing without seed data.")

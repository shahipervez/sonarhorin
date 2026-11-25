"""Seed companies whose public job board we verified (Nov 2026). Add more in the admin: ats + ats_slug + auto_import."""
from django.db import migrations

VERIFIED = [
    # Populate — US health-tech with a Dhaka office; Greenhouse board lists Dhaka / Remote: Bangladesh roles
    {"name": "Populate", "slug": "populate", "website": "https://www.populateemr.com", "careers_url": "https://job-boards.greenhouse.io/applytopopulate",
     "industry": "Health-tech software", "city": "Dhaka", "ats": "greenhouse", "ats_slug": "applytopopulate"},
]


def seed(apps, schema_editor):
    Company = apps.get_model("jobs", "Company")
    for c in VERIFIED:
        obj, _ = Company.objects.get_or_create(name=c["name"], defaults={k: v for k, v in c.items() if k != "name"})
        obj.ats, obj.ats_slug, obj.auto_import = c["ats"], c["ats_slug"], True
        obj.save()


class Migration(migrations.Migration):
    dependencies = [("jobs", "0004_ats_import_real_logos")]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]

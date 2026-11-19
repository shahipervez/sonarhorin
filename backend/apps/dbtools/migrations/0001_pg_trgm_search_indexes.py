"""PostgreSQL-only: enable pg_trgm and add GIN trigram indexes used by apps.jobs.search.

No-op on SQLite (and any other vendor). Lives outside apps.jobs so it never conflicts with model
migrations there. The indexes are plain SQL (not in Job/Company Meta), so `makemigrations jobs`
will never try to create or drop them.
"""
import logging

from django.db import migrations, transaction

log = logging.getLogger("apps")

INDEXES = [
    ("jobs_job_title_trgm", "jobs_job", "title"),
    ("jobs_company_name_trgm", "jobs_company", "name"),
]


def forwards(apps, schema_editor):
    conn = schema_editor.connection
    if conn.vendor != "postgresql":
        return
    try:
        # pg_trgm is a "trusted" extension (PG13+): the database owner can create it without superuser.
        with transaction.atomic(using=conn.alias), conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    except Exception as exc:  # managed DB without the extension: search degrades to FTS + icontains
        log.warning("pg_trgm unavailable (%s); skipping trigram indexes", exc)
        return
    with conn.cursor() as cur:
        for name, table, column in INDEXES:
            cur.execute(f'CREATE INDEX IF NOT EXISTS "{name}" ON "{table}" USING gin ("{column}" gin_trgm_ops)')


def backwards(apps, schema_editor):
    conn = schema_editor.connection
    if conn.vendor != "postgresql":
        return
    with conn.cursor() as cur:
        for name, _table, _column in INDEXES:
            cur.execute(f'DROP INDEX IF EXISTS "{name}"')
    # The extension itself is left installed: other objects may depend on it.


class Migration(migrations.Migration):
    dependencies = [("jobs", "0003_company_featured_company_logo")]

    operations = [migrations.RunPython(forwards, backwards, elidable=False)]

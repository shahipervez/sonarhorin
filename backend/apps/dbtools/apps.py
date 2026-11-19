from django.apps import AppConfig


class DbtoolsConfig(AppConfig):
    """No models: holds vendor-specific database migrations (extensions, special indexes)."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.dbtools"
    verbose_name = "Database tools"

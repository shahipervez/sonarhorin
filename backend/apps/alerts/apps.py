from django.apps import AppConfig


class AlertsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.alerts"
    verbose_name = "Job alerts"

    def ready(self):
        from . import signals  # noqa: F401  (connects post_save on jobs.Job)

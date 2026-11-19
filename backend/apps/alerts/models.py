from django.conf import settings
from django.db import models


class JobAlert(models.Model):
    """A saved search. New jobs that match it are delivered by email / Telegram / web push."""

    TYPES = [("any", "Any"), ("job", "Job (full-time, trainee, part-time)"), ("internship", "Internship")]
    FREQ = [("instant", "Instant"), ("daily", "Daily digest")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_alerts")
    name = models.CharField(max_length=80)
    keywords = models.CharField(max_length=200, blank=True, help_text="Comma separated; a job matches if ANY keyword appears. Blank = all.")
    job_type = models.CharField(max_length=12, choices=TYPES, default="any")
    majors = models.CharField(max_length=120, blank=True, help_text="Comma separated category/majors (CSE, BBA…). Blank = any.")
    location = models.CharField(max_length=100, blank=True, help_text="City, e.g. Dhaka. Blank = anywhere.")
    remote_ok = models.BooleanField(default=True, help_text="Also match remote jobs outside the chosen location.")
    min_salary = models.PositiveIntegerField(null=True, blank=True, help_text="BDT / month. Jobs without a salary still match.")
    email = models.BooleanField(default=True)
    telegram = models.BooleanField(default=False)
    webpush = models.BooleanField(default=False)
    telegram_chat_id = models.CharField(max_length=40, blank=True)
    frequency = models.CharField(max_length=8, choices=FREQ, default="daily")
    is_active = models.BooleanField(default=True)
    last_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["is_active", "frequency"])]

    def __str__(self):
        return f"{self.name} ({self.user})"

    def enabled_channels(self):
        return [c for c in ("email", "telegram", "webpush") if getattr(self, c)]

    @staticmethod
    def split(value):
        return [v.strip().lower() for v in (value or "").split(",") if v.strip()]


class AlertDelivery(models.Model):
    """One job sent (or queued) to one alert over one channel. The unique constraint makes re-runs idempotent."""

    STATUS = [("pending", "Pending"), ("sent", "Sent"), ("failed", "Failed"), ("skipped", "Skipped (channel unavailable)")]
    CHANNELS = [("email", "Email"), ("telegram", "Telegram"), ("webpush", "Web push")]

    alert = models.ForeignKey(JobAlert, on_delete=models.CASCADE, related_name="deliveries")
    job = models.ForeignKey("jobs.Job", on_delete=models.CASCADE, related_name="alert_deliveries")
    channel = models.CharField(max_length=10, choices=CHANNELS)
    status = models.CharField(max_length=8, choices=STATUS, default="pending")
    attempts = models.PositiveSmallIntegerField(default=0)
    error = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [models.UniqueConstraint(fields=["alert", "job", "channel"], name="uniq_alert_job_channel")]
        indexes = [models.Index(fields=["status"])]

    def __str__(self):
        return f"{self.alert_id} → job {self.job_id} via {self.channel} ({self.status})"

from django.conf import settings
from django.db import models

from apps.accounts.models import MAJOR_CHOICES


class SuccessStory(models.Model):
    """A fresher who got hired tells their story. Shown publicly only after admin approval."""

    STATUS = [("pending", "Pending review"), ("approved", "Approved"), ("rejected", "Rejected")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="stories")
    name = models.CharField(max_length=80, help_text="Display name, e.g. 'Tania R.'")
    major = models.CharField(max_length=20, choices=MAJOR_CHOICES)
    university = models.CharField(max_length=120, blank=True)
    city = models.CharField(max_length=60, blank=True)
    role = models.CharField(max_length=120)
    company = models.CharField(max_length=120)
    quote = models.TextField(max_length=600, help_text="Their story in 1–3 sentences (Bangla or English).")
    # before / after
    months_jobless = models.PositiveSmallIntegerField(default=0, help_text="Months of job search before Sonarhorin")
    applications_before = models.PositiveSmallIntegerField(default=0)
    days_to_hire = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Days from joining Sonarhorin to the offer")
    cv_score_before = models.PositiveSmallIntegerField(null=True, blank=True)
    cv_score_after = models.PositiveSmallIntegerField(null=True, blank=True)
    tests_passed = models.PositiveSmallIntegerField(default=0)
    certificate_code = models.CharField(max_length=16, blank=True)
    # moderation
    status = models.CharField(max_length=10, choices=STATUS, default="pending")
    featured = models.BooleanField(default=False)
    is_demo = models.BooleanField(default=False, help_text="Sample story for the prototype — shown with a 'Sample' label.")
    consent = models.BooleanField(default=False, help_text="User agreed to show this story publicly.")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-featured", "-created_at"]
        verbose_name_plural = "Success stories"

    def __str__(self):
        return f"{self.name} → {self.role} @ {self.company} ({self.status})"

    @property
    def verified(self):
        if not self.certificate_code or self.is_demo:
            return False
        from apps.certifications.models import Certificate

        q = Certificate.objects.filter(code=self.certificate_code, revoked=False)
        if self.user_id:
            q = q.filter(user_id=self.user_id)
        return q.exists()

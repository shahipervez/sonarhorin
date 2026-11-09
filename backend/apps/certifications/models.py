import secrets

from django.conf import settings
from django.db import models


def new_code():
    return "SH-" + secrets.token_hex(4).upper()


class Certificate(models.Model):
    KIND = [
        ("skill_check", "Skill Check (Quick Test)"),
        ("efficiency", "Verified Efficiency Test"),
        ("interview", "AI Interview Readiness"),
        ("training", "Offline Training / Program"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="certificates")
    kind = models.CharField(max_length=20, choices=KIND)
    title = models.CharField(max_length=200)
    score = models.PositiveSmallIntegerField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    code = models.CharField(max_length=16, unique=True, default=new_code, editable=False)
    issued_at = models.DateTimeField(auto_now_add=True)
    revoked = models.BooleanField(default=False)

    class Meta:
        ordering = ["-issued_at"]

    def __str__(self):
        return f"{self.code} · {self.title} · {self.user}"

    @property
    def verify_url(self):
        return f"{settings.SITE_URL}/verify/{self.code}"

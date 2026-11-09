import re

from django.conf import settings
from django.db import models

RESERVED = {"admin", "api", "www", "jobs", "login", "register", "me", "u", "static", "media", "sonarhorin", "support", "help"}
SLUG_RX = re.compile(r"^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$")


class Portfolio(models.Model):
    """A fresher's personal website, built from their profile/CV and served live at /u/<slug>."""

    TEMPLATES = [("editorial", "Editorial"), ("developer", "Developer"), ("bold", "Bold"), ("bangla", "Bilingual")]
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="portfolio")
    slug = models.SlugField(max_length=40, unique=True)
    template = models.CharField(max_length=12, choices=TEMPLATES, default="editorial")
    accent = models.CharField(max_length=9, default="#6B4EFF")
    data = models.JSONField(default=dict, blank=True)
    show_certificates = models.BooleanField(default=True)
    published = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"/u/{self.slug} · {self.user}"

    @property
    def url(self):
        return f"{settings.SITE_URL}/u/{self.slug}"

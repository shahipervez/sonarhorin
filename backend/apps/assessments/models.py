import secrets

from django.conf import settings
from django.db import models


class Question(models.Model):
    CATEGORIES = [(c, c) for c in ["CSE", "EEE", "BBA", "English", "Pharmacy", "Textile", "Aptitude", "Communication"]]
    category = models.CharField(max_length=20, choices=CATEGORIES, db_index=True)
    topic = models.CharField(max_length=60, blank=True)
    difficulty = models.PositiveSmallIntegerField(default=1)
    text = models.TextField()
    options = models.JSONField(help_text="List of 4 option strings")
    answer_index = models.PositiveSmallIntegerField()
    explanation = models.TextField(blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"[{self.category}] {self.text[:70]}"


# ------------------------------------------------------------------ Quick test (practice, major-based)

class QuickTestAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quick_tests")
    major = models.CharField(max_length=20)
    question_ids = models.JSONField(default=list)
    option_orders = models.JSONField(default=dict, help_text="question id → shuffled original indexes")
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    correct = models.PositiveSmallIntegerField(default=0)
    total = models.PositiveSmallIntegerField(default=0)
    percent = models.PositiveSmallIntegerField(default=0)
    passed = models.BooleanField(default=False)
    results = models.JSONField(default=dict, blank=True)
    certificate = models.ForeignKey("certifications.Certificate", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-started_at"]


# ------------------------------------------------------------------ Efficiency test (proctored, for employers)

def invite_code():
    return secrets.token_urlsafe(6).replace("-", "x").replace("_", "y").upper()[:8]


class EfficiencyTest(models.Model):
    """A strict, proctored test a company can require before hiring a fresher."""

    title = models.CharField(max_length=160)
    company_name = models.CharField(max_length=120, blank=True, help_text="Blank = Sonarhorin general test")
    description = models.TextField(blank=True)
    major = models.CharField(max_length=20, blank=True, help_text="Blank = candidate's own major")
    question_count = models.PositiveSmallIntegerField(default=15)
    seconds_per_question = models.PositiveSmallIntegerField(default=60)
    pass_percent = models.PositiveSmallIntegerField(default=60)
    min_integrity = models.PositiveSmallIntegerField(default=70)
    require_webcam = models.BooleanField(default=False)
    require_fullscreen = models.BooleanField(default=True)
    invite_code = models.CharField(max_length=12, unique=True, default=invite_code)
    is_public = models.BooleanField(default=True, help_text="Listed on the site. Private tests open only via invite code.")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
                                   related_name="created_efficiency_tests")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.company_name or 'Sonarhorin'})"

    @property
    def total_minutes(self):
        return round(self.question_count * self.seconds_per_question / 60)


class EfficiencySession(models.Model):
    STATUS = [("in_progress", "In progress"), ("completed", "Completed"), ("terminated", "Terminated (integrity)")]
    test = models.ForeignKey(EfficiencyTest, on_delete=models.CASCADE, related_name="sessions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="efficiency_sessions")
    status = models.CharField(max_length=20, choices=STATUS, default="in_progress")
    major = models.CharField(max_length=20)
    question_ids = models.JSONField(default=list)
    option_orders = models.JSONField(default=dict)
    current_index = models.PositiveSmallIntegerField(default=0)
    question_served_at = models.DateTimeField(null=True, blank=True)
    answers = models.JSONField(default=list)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    correct = models.PositiveSmallIntegerField(default=0)
    percent = models.PositiveSmallIntegerField(default=0)
    integrity_score = models.PositiveSmallIntegerField(default=100)
    flags = models.JSONField(default=dict, blank=True)
    passed = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)
    certificate = models.ForeignKey("certifications.Certificate", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        unique_together = [("test", "user")]  # one genuine attempt per candidate per test
        ordering = ["-started_at"]


class IntegrityEvent(models.Model):
    KINDS = [
        ("tab_hidden", "Switched tab / minimized"),
        ("window_blur", "Window lost focus"),
        ("copy", "Copy attempt"),
        ("paste", "Paste attempt"),
        ("context_menu", "Right-click"),
        ("fullscreen_exit", "Left full screen"),
        ("devtools", "Developer tools suspected"),
        ("no_face", "Webcam: no face / camera off"),
        ("too_fast", "Answered implausibly fast"),
        ("timeout", "Question timed out"),
    ]
    session = models.ForeignKey(EfficiencySession, on_delete=models.CASCADE, related_name="events")
    kind = models.CharField(max_length=20, choices=KINDS)
    detail = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class WebcamSnapshot(models.Model):
    session = models.ForeignKey(EfficiencySession, on_delete=models.CASCADE, related_name="snapshots")
    image = models.ImageField(upload_to="proctoring/%Y/%m/")
    created_at = models.DateTimeField(auto_now_add=True)

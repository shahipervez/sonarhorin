"""Career AI: a private resume vault, per-job tailored CVs, and interview kits with practice + coach chat."""
from django.conf import settings
from django.db import models

from apps.core.uploads import private_storage, safe_name

TEMPLATES = [("classic", "Classic"), ("modern", "Modern"), ("minimal", "Minimal")]


def resume_path(instance, filename):
    return f"resumes/{instance.user_id}/{safe_name(filename)}"


class Resume(models.Model):
    """A user's master CV: the original file (private) + extracted text + a structured profile."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resumes")
    title = models.CharField(max_length=80, default="My CV")
    file = models.FileField(upload_to=resume_path, storage=private_storage, blank=True)
    original_name = models.CharField(max_length=255, blank=True)
    text = models.TextField(blank=True)
    profile = models.JSONField(default=dict, blank=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_primary", "-updated_at"]

    def __str__(self):
        return f"{self.user} · {self.title}"

    def delete(self, *a, **kw):
        if self.file:
            self.file.delete(save=False)
        return super().delete(*a, **kw)


class TailoredResume(models.Model):
    """A CV rewritten for one job — truthful: only re-orders, re-phrases and emphasises what's in the master CV."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tailored_resumes")
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name="tailored")
    job = models.ForeignKey("jobs.Job", on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    job_title = models.CharField(max_length=160)
    company = models.CharField(max_length=140, blank=True)
    job_text = models.TextField(blank=True)
    template = models.CharField(max_length=10, choices=TEMPLATES, default="modern")
    content = models.JSONField(default=dict)
    analysis = models.JSONField(default=dict)
    ai = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} → {self.job_title}"


class InterviewKit(models.Model):
    """Everything to prepare for one interview: likely questions with model answers, a plan, and a coach."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interview_kits")
    resume = models.ForeignKey(Resume, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    job = models.ForeignKey("jobs.Job", on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    job_title = models.CharField(max_length=160)
    company = models.CharField(max_length=140, blank=True)
    requirements = models.TextField(blank=True)
    responsibilities = models.TextField(blank=True)
    kit = models.JSONField(default=dict)
    ai = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} · {self.job_title} interview"


class PracticeAttempt(models.Model):
    kit = models.ForeignKey(InterviewKit, on_delete=models.CASCADE, related_name="attempts")
    question_id = models.CharField(max_length=20)
    question = models.TextField()
    answer = models.TextField()
    feedback = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class CoachMessage(models.Model):
    ROLES = [("user", "User"), ("assistant", "Coach")]
    kit = models.ForeignKey(InterviewKit, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=10, choices=ROLES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

from django.conf import settings
from django.db import models


class InterviewSession(models.Model):
    STATUS = [("active", "Active"), ("completed", "Completed"), ("expired", "Time up")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interviews")
    major = models.CharField(max_length=20)
    role = models.CharField(max_length=120, blank=True)
    language = models.CharField(max_length=5, default="en")
    status = models.CharField(max_length=12, choices=STATUS, default="active")
    plan = models.JSONField(default=list)
    started_at = models.DateTimeField(auto_now_add=True)
    ends_at = models.DateTimeField()
    finished_at = models.DateTimeField(null=True, blank=True)
    report = models.JSONField(default=dict, blank=True)
    overall = models.PositiveSmallIntegerField(default=0)
    certificate = models.ForeignKey("certifications.Certificate", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-started_at"]


class InterviewTurn(models.Model):
    session = models.ForeignKey(InterviewSession, on_delete=models.CASCADE, related_name="turns")
    order = models.PositiveSmallIntegerField()
    kind = models.CharField(max_length=20)
    question = models.TextField()
    answer = models.TextField(blank=True)
    evaluation = models.JSONField(default=dict, blank=True)
    asked_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["order"]

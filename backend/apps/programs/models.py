from django.conf import settings
from django.db import models


class Program(models.Model):
    KIND = [("graduate", "Graduate Program"), ("internship", "Internship Program"), ("training", "Offline Training")]
    MODE = [("offline", "Offline (in person)"), ("hybrid", "Hybrid"), ("online", "Online")]
    kind = models.CharField(max_length=12, choices=KIND, db_index=True)
    title = models.CharField(max_length=160)
    organization = models.CharField(max_length=120, default="Sonarhorin")
    summary = models.CharField(max_length=240)
    description = models.TextField()
    location = models.CharField(max_length=120, default="Dhaka")
    mode = models.CharField(max_length=10, choices=MODE, default="offline")
    duration = models.CharField(max_length=60, help_text="e.g. 12 weeks")
    stipend = models.CharField(max_length=60, blank=True, help_text="e.g. ৳15,000/month — blank if none")
    fee = models.CharField(max_length=60, blank=True, help_text="Training fee — blank = free")
    seats = models.PositiveSmallIntegerField(default=30)
    start_date = models.DateField()
    deadline = models.DateField()
    majors = models.CharField(max_length=120, blank=True, help_text="Comma separated, blank = all majors")
    requirements = models.JSONField(default=list, blank=True)
    curriculum = models.JSONField(default=list, blank=True)
    perks = models.JSONField(default=list, blank=True)
    certificate_on_completion = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["deadline"]

    def __str__(self):
        return f"{self.get_kind_display()}: {self.title}"

    @property
    def major_list(self):
        return [m.strip() for m in self.majors.split(",") if m.strip()]


class Application(models.Model):
    STATUS = [("submitted", "Submitted"), ("shortlisted", "Shortlisted"), ("accepted", "Accepted"),
              ("rejected", "Not selected"), ("completed", "Completed")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="applications")
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="applications")
    motivation = models.TextField(max_length=1500)
    status = models.CharField(max_length=12, choices=STATUS, default="submitted")
    created_at = models.DateTimeField(auto_now_add=True)
    certificate = models.ForeignKey("certifications.Certificate", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        unique_together = [("user", "program")]
        ordering = ["-created_at"]

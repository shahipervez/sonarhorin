from django.conf import settings
from django.db import models


from apps.core.uploads import private_storage, safe_name


def cv_path(instance, filename):
    return f"cvs/{instance.user_id}/{safe_name(filename)}"


class CVAnalysis(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cv_analyses")
    file = models.FileField(upload_to=cv_path, storage=private_storage)
    original_name = models.CharField(max_length=255)
    major = models.CharField(max_length=20)
    target_role = models.CharField(max_length=120, blank=True)
    extracted_text = models.TextField(blank=True)
    score = models.PositiveSmallIntegerField(default=0)
    rejection_probability = models.PositiveSmallIntegerField(default=0)
    report = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} · {self.original_name} · {self.score}"

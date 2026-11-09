from django.conf import settings
from django.db import models


from apps.core.uploads import private_storage, safe_name


def deck_path(instance, filename):
    return f"decks/{instance.user_id}/{safe_name(filename)}"


class Pitch(models.Model):
    STAGES = [("idea", "Just an idea"), ("prototype", "Prototype / MVP"), ("users", "Early users"), ("revenue", "Making revenue")]
    STATUS = [("draft", "Draft"), ("submitted", "Submitted"), ("review", "In review"), ("shortlisted", "Shortlisted"),
              ("pitch_day", "Invited to pitch day"), ("funded", "Funded 🎉"), ("declined", "Not this round")]
    SECTORS = [("edtech", "EdTech"), ("fintech", "FinTech"), ("agritech", "AgriTech"), ("health", "Health"), ("ecommerce", "E-commerce"),
               ("ai", "AI / SaaS"), ("logistics", "Logistics"), ("social", "Social impact"), ("other", "Other")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pitches")
    name = models.CharField(max_length=80)
    one_liner = models.CharField(max_length=160, blank=True)
    sector = models.CharField(max_length=12, choices=SECTORS, default="other")
    stage = models.CharField(max_length=10, choices=STAGES, default="idea")
    problem = models.TextField(blank=True, max_length=1500)
    solution = models.TextField(blank=True, max_length=1500)
    market = models.TextField(blank=True, max_length=1200)
    business_model = models.TextField(blank=True, max_length=1200)
    traction = models.TextField(blank=True, max_length=1200)
    team = models.TextField(blank=True, max_length=1200)
    ask_amount = models.PositiveIntegerField(null=True, blank=True, help_text="BDT")
    use_of_funds = models.TextField(blank=True, max_length=1000)
    deck = models.FileField(upload_to=deck_path, blank=True, storage=private_storage)
    video_url = models.URLField(blank=True)
    status = models.CharField(max_length=12, choices=STATUS, default="draft")
    feedback = models.TextField(blank=True, help_text="Shown to the founder")
    funded_amount = models.PositiveIntegerField(null=True, blank=True)
    public_story = models.BooleanField(default=False, help_text="Show on the public funded list (founder consent)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.name} · {self.user} · {self.status}"

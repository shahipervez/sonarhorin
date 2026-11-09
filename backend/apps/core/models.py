from django.db import models


class WaitlistEntry(models.Model):
    """Emails collected by the home-page "Join সোনারহরিণ" form."""

    email = models.EmailField(unique=True)
    major = models.CharField(max_length=20, blank=True)
    source = models.CharField(max_length=40, default="home_cta")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name_plural = "Waitlist"

    def __str__(self):
        return self.email

    @property
    def position(self):
        return WaitlistEntry.objects.filter(id__lte=self.id).count()


class Video(models.Model):
    """সোনারহরিণ TV — real videos added by the team (YouTube). The site also has built-in animated reels."""

    KIND = [("story", "Stories — their own journey"), ("knowledge", "Knowledge — CV, interview, career")]
    title = models.CharField(max_length=140)
    title_bn = models.CharField(max_length=140, blank=True)
    kind = models.CharField(max_length=10, choices=KIND, default="knowledge")
    youtube_id = models.CharField(max_length=20, help_text="The part after watch?v= in the YouTube link")
    speaker = models.CharField(max_length=80, blank=True)
    minutes = models.PositiveSmallIntegerField(default=3)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title

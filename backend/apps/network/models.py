from django.conf import settings
from django.db import models
from django.db.models import Q

ROOMS = {
    "general": ("সবাই · Everyone", "Job leads, questions, wins — everyone's welcome."),
    "cse": ("CSE", "Coding interviews, referrals, project feedback."),
    "eee": ("EEE", "Power, telecom, MTO and GET programs."),
    "bba": ("BBA", "MTO, banking, sales and marketing roles."),
    "english": ("English", "Content, teaching, communications."),
    "pharmacy": ("Pharmacy", "Pharma QC/QA, medical promotion."),
    "textile": ("Textile", "Merchandising, RMG, production."),
    "interviews": ("Interview stories", "What they asked, how you answered."),
    "startup": ("Startup founders", "Ideas, co-founders, pitch practice."),
}


class Connection(models.Model):
    STATUS = [("pending", "Pending"), ("accepted", "Accepted"), ("declined", "Declined")]
    from_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_connections")
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_connections")
    status = models.CharField(max_length=10, choices=STATUS, default="pending")
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["from_user", "to_user"], name="uniq_connection")]

    @staticmethod
    def between(a, b):
        return Connection.objects.filter(Q(from_user=a, to_user=b) | Q(from_user=b, to_user=a)).first()

    @staticmethod
    def connected(a, b):
        c = Connection.between(a, b)
        return bool(c and c.status == "accepted")


class Message(models.Model):
    """A direct message (recipient set) or a room message (room set)."""

    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="inbox")
    room = models.CharField(max_length=20, blank=True, db_index=True)
    text = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    hidden = models.BooleanField(default=False, help_text="Hide abusive messages")

    class Meta:
        ordering = ["id"]
        indexes = [models.Index(fields=["sender", "recipient", "id"])]

    def __str__(self):
        return f"{self.sender} → {self.recipient or '#' + self.room}: {self.text[:40]}"

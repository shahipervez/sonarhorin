import uuid

from django.conf import settings
from django.db import models


def new_tran_id():
    return "SH" + uuid.uuid4().hex[:22].upper()


class Payment(models.Model):
    PENDING, VALID, FAILED, CANCELLED = "pending", "valid", "failed", "cancelled"
    STATUSES = [(PENDING, "Pending"), (VALID, "Paid (validated)"), (FAILED, "Failed"), (CANCELLED, "Cancelled")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="payments")
    tran_id = models.CharField(max_length=40, unique=True, default=new_tran_id)
    plan = models.CharField(max_length=40)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="BDT")
    status = models.CharField(max_length=12, choices=STATUSES, default=PENDING, db_index=True)
    gateway = models.CharField(max_length=20, default="sslcommerz")
    session_key = models.CharField(max_length=100, blank=True)
    val_id = models.CharField(max_length=100, blank=True)
    bank_tran_id = models.CharField(max_length=100, blank=True)
    card_type = models.CharField(max_length=60, blank=True)
    validation_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tran_id} {self.amount} {self.currency} [{self.status}]"

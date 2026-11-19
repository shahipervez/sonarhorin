from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["tran_id", "user", "plan", "amount", "status", "created_at", "paid_at"]
    list_filter = ["status", "plan"]
    search_fields = ["tran_id", "user__email", "val_id", "bank_tran_id"]
    raw_id_fields = ["user"]
    readonly_fields = ["validation_response"]

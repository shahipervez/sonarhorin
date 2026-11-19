from django.contrib import admin

from .models import AlertDelivery, JobAlert


@admin.register(JobAlert)
class JobAlertAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "frequency", "job_type", "location", "email", "telegram", "webpush", "is_active", "last_sent_at")
    list_filter = ("frequency", "job_type", "is_active")
    search_fields = ("name", "keywords", "user__email")


@admin.register(AlertDelivery)
class AlertDeliveryAdmin(admin.ModelAdmin):
    list_display = ("alert", "job", "channel", "status", "attempts", "sent_at")
    list_filter = ("channel", "status")
    raw_id_fields = ("alert", "job")

from django.contrib import admin

from .models import PushSubscription


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "created_at", "last_success_at", "failures"]
    search_fields = ["user__email"]
    raw_id_fields = ["user"]

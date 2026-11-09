from django.contrib import admin

from .models import Pitch
from .scoring import score


@admin.register(Pitch)
class PitchAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "sector", "stage", "ask_amount", "status", "readiness", "submitted_at")
    list_filter = ("status", "sector", "stage")
    list_editable = ("status",)
    search_fields = ("name", "user__email", "user__full_name")
    readonly_fields = ("submitted_at", "created_at", "updated_at")

    @admin.display(description="Readiness")
    def readiness(self, p):
        return score(p)["score"]

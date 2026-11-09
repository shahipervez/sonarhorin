from django.contrib import admin

from .models import CVAnalysis


@admin.register(CVAnalysis)
class CVAnalysisAdmin(admin.ModelAdmin):
    list_display = ["user", "original_name", "major", "score", "rejection_probability", "created_at"]
    list_filter = ["major"]
    search_fields = ["user__email", "original_name"]
    readonly_fields = ["report", "extracted_text"]

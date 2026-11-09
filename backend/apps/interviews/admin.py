from django.contrib import admin

from .models import InterviewSession, InterviewTurn


class TurnInline(admin.StackedInline):
    model = InterviewTurn
    extra = 0
    readonly_fields = ["order", "kind", "question", "answer", "evaluation", "asked_at", "answered_at"]


@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ["user", "major", "role", "status", "overall", "started_at"]
    list_filter = ["status", "major"]
    inlines = [TurnInline]

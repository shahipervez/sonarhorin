from django.contrib import admin

from .models import EfficiencySession, EfficiencyTest, IntegrityEvent, Question, QuickTestAttempt, WebcamSnapshot


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["text", "category", "topic", "difficulty", "active"]
    list_filter = ["category", "difficulty", "active"]
    search_fields = ["text", "topic"]


@admin.register(QuickTestAttempt)
class QuickTestAttemptAdmin(admin.ModelAdmin):
    list_display = ["user", "major", "percent", "passed", "started_at"]
    list_filter = ["major", "passed"]


class EventInline(admin.TabularInline):
    model = IntegrityEvent
    extra = 0
    readonly_fields = ["kind", "detail", "created_at"]


class SnapshotInline(admin.TabularInline):
    model = WebcamSnapshot
    extra = 0
    readonly_fields = ["image", "created_at"]


@admin.register(EfficiencyTest)
class EfficiencyTestAdmin(admin.ModelAdmin):
    list_display = ["title", "company_name", "major", "question_count", "invite_code", "is_public", "active"]
    readonly_fields = ["invite_code"]


@admin.register(EfficiencySession)
class EfficiencySessionAdmin(admin.ModelAdmin):
    list_display = ["user", "test", "status", "percent", "integrity_score", "passed", "started_at"]
    list_filter = ["status", "passed", "test"]
    inlines = [EventInline, SnapshotInline]

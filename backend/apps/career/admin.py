from django.contrib import admin

from .models import CoachMessage, InterviewKit, PracticeAttempt, Resume, TailoredResume


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ["user", "title", "is_primary", "updated_at"]
    search_fields = ["user__email", "title"]
    exclude = ["text"]  # personal data: not shown in admin lists


@admin.register(TailoredResume)
class TailoredAdmin(admin.ModelAdmin):
    list_display = ["user", "job_title", "company", "template", "ai", "created_at"]
    search_fields = ["user__email", "job_title", "company"]


@admin.register(InterviewKit)
class KitAdmin(admin.ModelAdmin):
    list_display = ["user", "job_title", "company", "ai", "created_at"]
    search_fields = ["user__email", "job_title", "company"]


admin.site.register(PracticeAttempt)
admin.site.register(CoachMessage)

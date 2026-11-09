from django.contrib import admin

from .models import AutoApplySettings, Company, Job, JobApplication


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ["name", "city", "industry", "featured", "is_partner", "apply_email", "ats"]
    list_editable = ["featured"]
    list_filter = ["featured", "is_partner", "ats", "city"]
    search_fields = ["name"]
    filter_horizontal = ["employer_users"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ["title", "company", "location", "job_type", "apply_channel", "experience_max_years", "deadline", "source", "is_active"]
    list_filter = ["apply_channel", "job_type", "source", "is_active", "company__is_partner"]
    search_fields = ["title", "company__name", "description"]
    autocomplete_fields = ["company"]


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ["user", "job", "channel", "status", "auto", "created_at", "sent_at"]
    list_filter = ["channel", "status", "auto"]
    search_fields = ["user__email", "job__title", "job__company__name"]
    list_editable = ["status"]
    readonly_fields = ["cover_letter", "error"]


@admin.register(AutoApplySettings)
class AutoApplySettingsAdmin(admin.ModelAdmin):
    list_display = ["user", "enabled", "max_per_day", "channels", "last_run"]
    list_filter = ["enabled"]

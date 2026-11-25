from django.contrib import admin

from .models import AutoApplySettings, Company, Job, JobApplication


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ["name", "city", "industry", "featured", "is_partner", "ats", "ats_slug", "auto_import", "one_click", "last_imported_at", "import_error"]
    list_editable = ["featured"]
    list_filter = ["featured", "is_partner", "ats", "auto_import", "city"]
    search_fields = ["name"]
    filter_horizontal = ["employer_users"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["last_imported_at", "import_error", "logo_source"]
    actions = ["import_now", "fetch_logo"]
    fieldsets = [
        (None, {"fields": ["name", "slug", "website", "careers_url", "industry", "city", "color", "featured", "is_partner", "apply_email", "employer_users"]}),
        ("Logo (real only)", {"fields": ["logo", "logo_source"]}),
        ("Automatic job import", {"fields": ["ats", "ats_slug", "auto_import", "bd_only", "last_imported_at", "import_error"]}),
        ("One-click apply (company's own key)", {"fields": ["ats_api_key"], "description":
            "Greenhouse: Job Board API key (Configure → Dev Center → API Credentials). Lever: postings API key "
            "(Settings → Integrations → API). With a key, candidates apply in one click and the application lands in the company's ATS."}),
    ]

    @admin.display(boolean=True, description="1-click")
    def one_click(self, c):
        return bool(c.ats_api_key) and c.ats in ("greenhouse", "lever")

    @admin.action(description="Import jobs now from the company job board")
    def import_now(self, request, queryset):
        from .ats import import_company
        for c in queryset:
            s = import_company(c)
            self.message_user(request, f"{c.name}: {s['created']} new, {s['updated']} updated, {s['closed']} closed, "
                                       f"{s['skipped']} skipped{' — ' + s['error'] if s['error'] else ''}")

    @admin.action(description="Fetch real logo from the company website")
    def fetch_logo(self, request, queryset):
        from .logos import fetch_real_logo
        ok = sum(fetch_real_logo(c) for c in queryset)
        self.message_user(request, f"Real logo saved for {ok} of {queryset.count()} companies.")


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

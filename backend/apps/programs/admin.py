from django.contrib import admin, messages

from apps.certifications.services import issue_certificate

from .models import Application, Program


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ["title", "kind", "organization", "mode", "start_date", "deadline", "seats", "is_active"]
    list_filter = ["kind", "mode", "is_active"]
    search_fields = ["title", "organization"]


@admin.action(description="Mark completed + issue certificate")
def complete_and_certify(modeladmin, request, queryset):
    n = 0
    for a in queryset.select_related("program", "user"):
        if a.status == "completed" and a.certificate:
            continue
        a.status = "completed"
        if a.program.certificate_on_completion and not a.certificate:
            a.certificate = issue_certificate(a.user, "training", f"{a.program.get_kind_display()} — {a.program.title}",
                                              None, {"organization": a.program.organization, "duration": a.program.duration})
        a.save()
        n += 1
    messages.success(request, f"{n} application(s) completed and certified.")


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ["user", "program", "status", "created_at"]
    list_filter = ["status", "program__kind", "program"]
    search_fields = ["user__email", "user__full_name", "program__title"]
    actions = [complete_and_certify]

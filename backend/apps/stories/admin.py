from django.contrib import admin, messages

from .models import SuccessStory


@admin.action(description="Approve selected stories (show on the website)")
def approve(modeladmin, request, qs):
    n = qs.filter(consent=True).update(status="approved")
    skipped = qs.filter(consent=False).count()
    messages.success(request, f"{n} approved." + (f" {skipped} skipped — no publishing consent." if skipped else ""))


@admin.action(description="Reject selected stories")
def reject(modeladmin, request, qs):
    qs.update(status="rejected")


@admin.register(SuccessStory)
class SuccessStoryAdmin(admin.ModelAdmin):
    list_display = ["name", "role", "company", "major", "status", "featured", "is_demo", "verified_badge", "created_at"]
    list_filter = ["status", "major", "featured", "is_demo"]
    search_fields = ["name", "company", "role", "user__email"]
    list_editable = ["featured"]
    actions = [approve, reject]

    @admin.display(boolean=True, description="Verified")
    def verified_badge(self, obj):
        return obj.verified

from django.contrib import admin

from .models import Video, WaitlistEntry


@admin.register(WaitlistEntry)
class WaitlistAdmin(admin.ModelAdmin):
    list_display = ["email", "major", "source", "created_at"]
    list_filter = ["major", "source"]
    search_fields = ["email"]


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ["title", "kind", "speaker", "minutes", "order", "is_active"]
    list_filter = ["kind", "is_active"]
    list_editable = ["order", "is_active"]

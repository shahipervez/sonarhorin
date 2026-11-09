from django.contrib import admin

from .models import Portfolio


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ("slug", "user", "template", "published", "views", "updated_at")
    list_filter = ("template", "published")
    search_fields = ("slug", "user__email", "user__full_name")
    list_editable = ("published",)

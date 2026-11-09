from django.contrib import admin

from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ["code", "user", "kind", "title", "score", "issued_at", "revoked"]
    list_filter = ["kind", "revoked"]
    search_fields = ["code", "user__email", "user__full_name", "title"]
    readonly_fields = ["code", "issued_at"]

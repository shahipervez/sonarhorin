from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-date_joined"]
    list_display = ["email", "full_name", "major", "university", "is_employer", "is_staff"]
    list_filter = ["major", "is_employer", "is_staff"]
    search_fields = ["email", "full_name", "university"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("full_name", "phone", "major", "university", "graduation_year", "is_employer")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = ((None, {"classes": ("wide",), "fields": ("email", "full_name", "major", "password1", "password2")}),)

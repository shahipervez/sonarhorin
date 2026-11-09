from django.contrib import admin

from .models import Connection, Message


@admin.register(Connection)
class ConnectionAdmin(admin.ModelAdmin):
    list_display = ("from_user", "to_user", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("from_user__email", "to_user__email")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "recipient", "room", "text", "created_at", "hidden")
    list_filter = ("room", "hidden")
    list_editable = ("hidden",)
    search_fields = ("text", "sender__email")

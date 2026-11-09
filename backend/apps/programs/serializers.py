from django.utils import timezone
from rest_framework import serializers

from .models import Application, Program


class ProgramSerializer(serializers.ModelSerializer):
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)
    mode_label = serializers.CharField(source="get_mode_display", read_only=True)
    major_list = serializers.ListField(read_only=True)
    seats_left = serializers.SerializerMethodField()
    applied = serializers.SerializerMethodField()
    open = serializers.SerializerMethodField()

    class Meta:
        model = Program
        exclude = ["created_at", "majors"]

    def get_seats_left(self, p):
        return max(0, p.seats - p.applications.filter(status__in=["accepted", "completed"]).count())

    def get_applied(self, p):
        u = self.context["request"].user
        return u.is_authenticated and p.applications.filter(user=u).exists()

    def get_open(self, p):
        return p.deadline >= timezone.localdate()


class ApplicationSerializer(serializers.ModelSerializer):
    program = ProgramSerializer(read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Application
        fields = ["id", "program", "motivation", "status", "status_label", "created_at"]

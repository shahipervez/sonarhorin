from rest_framework import serializers

from .models import AutoApplySettings, Company, Job, JobApplication


class CompanyMini(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = ["id", "name", "slug", "city", "industry", "color", "is_partner", "website", "careers_url", "logo"]

    def get_logo(self, c):
        import os
        from django.conf import settings
        # Return static svg/png path so it resolves seamlessly on any host
        if c.slug:
            return f"/logos/{c.slug}.svg"
        if c.logo:
            return c.logo.url
        return ""


class JobSerializer(serializers.ModelSerializer):
    company = CompanyMini(read_only=True)
    channel = serializers.SerializerMethodField()
    job_type_label = serializers.CharField(source="get_job_type_display", read_only=True)
    major_list = serializers.ListField(read_only=True)
    my_status = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = ["id", "title", "company", "location", "remote", "job_type", "job_type_label", "major_list", "experience_max_years",
                  "salary_min", "salary_max", "description", "requirements", "channel", "apply_url", "posted_at", "deadline", "source", "my_status"]

    def get_channel(self, j):
        return j.effective_channel()

    def get_my_status(self, j):
        apps = self.context.get("my_apps") or {}
        return apps.get(j.id)


class ApplicationSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = JobApplication
        fields = ["id", "job", "channel", "status", "status_label", "auto", "cover_letter", "error", "created_at", "sent_at",
                  "candidate_stage"]


class AutoApplySerializer(serializers.ModelSerializer):
    class Meta:
        model = AutoApplySettings
        fields = ["enabled", "majors", "locations", "job_types", "min_salary", "remote_only", "max_per_day", "channels", "note", "last_run"]
        read_only_fields = ["last_run"]

    def validate_max_per_day(self, v):
        return max(1, min(v, 20))

    def validate_channels(self, v):
        ok = [c for c in v.split(",") if c in ("partner", "email")]
        return ",".join(ok) or "partner"

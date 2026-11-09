from rest_framework import serializers

from .models import SuccessStory


class StorySerializer(serializers.ModelSerializer):
    verified = serializers.BooleanField(read_only=True)
    major_label = serializers.CharField(source="get_major_display", read_only=True)

    class Meta:
        model = SuccessStory
        fields = ["id", "name", "major", "major_label", "university", "city", "role", "company", "quote",
                  "months_jobless", "applications_before", "days_to_hire", "cv_score_before", "cv_score_after",
                  "tests_passed", "verified", "is_demo", "featured", "status", "created_at"]
        read_only_fields = ["status", "featured", "is_demo", "created_at"]


class StorySubmitSerializer(serializers.ModelSerializer):
    consent = serializers.BooleanField()

    class Meta:
        model = SuccessStory
        fields = ["name", "university", "city", "role", "company", "quote", "months_jobless", "applications_before", "consent"]

    def validate_consent(self, v):
        if not v:
            raise serializers.ValidationError("Please allow us to show your story publicly.")
        return v

    def validate_quote(self, v):
        if len(v.strip()) < 30:
            raise serializers.ValidationError("Tell us a little more (at least 30 characters).")
        return v.strip()

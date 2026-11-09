from rest_framework import serializers

from apps.core.uploads import UploadError, check_upload

from .models import CVAnalysis


class CVAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVAnalysis
        fields = ["id", "original_name", "major", "target_role", "score", "rejection_probability", "report", "created_at"]


class CVUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    major = serializers.CharField(required=False, allow_blank=True)
    target_role = serializers.CharField(required=False, allow_blank=True, max_length=120)

    def validate_file(self, f):
        try:
            check_upload(f)
        except UploadError as e:
            raise serializers.ValidationError(str(e))
        return f

from rest_framework import serializers

from .models import CoachMessage, InterviewKit, PracticeAttempt, Resume, TailoredResume


class ResumeSerializer(serializers.ModelSerializer):
    has_file = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = ["id", "title", "original_name", "profile", "is_primary", "has_file", "created_at", "updated_at"]
        read_only_fields = ["original_name", "created_at", "updated_at"]

    def get_has_file(self, r):
        return bool(r.file)


class TailoredSerializer(serializers.ModelSerializer):
    resume_title = serializers.CharField(source="resume.title", read_only=True)

    class Meta:
        model = TailoredResume
        fields = ["id", "resume", "resume_title", "job", "job_title", "company", "job_text", "template", "content", "analysis",
                  "ai", "created_at", "updated_at"]
        read_only_fields = ["resume", "job", "job_title", "company", "job_text", "analysis", "ai", "created_at", "updated_at"]


class TailoredListSerializer(serializers.ModelSerializer):
    score = serializers.SerializerMethodField()

    class Meta:
        model = TailoredResume
        fields = ["id", "job_title", "company", "template", "score", "ai", "created_at"]

    def get_score(self, t):
        return (t.analysis or {}).get("score_after")


class KitSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewKit
        fields = ["id", "resume", "job", "job_title", "company", "requirements", "responsibilities", "kit", "ai", "created_at"]


class KitListSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()

    class Meta:
        model = InterviewKit
        fields = ["id", "job_title", "company", "questions", "ai", "created_at"]

    def get_questions(self, k):
        return len((k.kit or {}).get("questions", []))


class AttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticeAttempt
        fields = ["id", "question_id", "question", "answer", "feedback", "created_at"]


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoachMessage
        fields = ["id", "role", "content", "created_at"]


class JobInput(serializers.Serializer):
    """Either an existing job id, or a pasted job post."""

    job_id = serializers.IntegerField(required=False, allow_null=True)
    job_title = serializers.CharField(required=False, allow_blank=True, max_length=160)
    company = serializers.CharField(required=False, allow_blank=True, max_length=140)
    requirements = serializers.CharField(required=False, allow_blank=True, max_length=12000)
    responsibilities = serializers.CharField(required=False, allow_blank=True, max_length=12000)
    resume_id = serializers.IntegerField(required=False, allow_null=True)
    template = serializers.ChoiceField(choices=["classic", "modern", "minimal"], required=False, default="modern")

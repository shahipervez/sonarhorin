from rest_framework import serializers

from .models import CompanyReview
from .sanitize import clean_text

TEXT_FIELDS = ("role_title", "pros", "cons", "interview_questions")


class CompanyReviewSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()
    company = serializers.SlugRelatedField(slug_field="slug", read_only=True)

    class Meta:
        model = CompanyReview
        fields = ["id", "company", "author", "is_mine", "anonymous", "role_title", "review_type", "rating",
                  "interview_difficulty", "got_offer", "pros", "cons", "interview_questions", "created_at"]
        read_only_fields = ["id", "company", "author", "is_mine", "created_at"]
        # The unique (company, author, review_type) constraint is checked in the view: company and author
        # are not writable here, so DRF's auto-generated UniqueTogetherValidator can't run.
        validators = []

    def get_author(self, obj):
        # Anonymous reviews expose nothing about the author — no name, no id.
        if obj.anonymous:
            return None
        return {"name": obj.author.full_name or "Sonarhorin member", "university": obj.author.university or ""}

    def get_is_mine(self, obj):
        user = getattr(self.context.get("request"), "user", None)
        return bool(user and user.is_authenticated and obj.author_id == user.id)

    def validate(self, attrs):
        for f in TEXT_FIELDS:
            if f in attrs:
                attrs[f] = clean_text(attrs[f])
        if not any(attrs.get(f) for f in ("pros", "cons", "interview_questions")):
            raise serializers.ValidationError("Write at least one of pros, cons or interview questions.")
        return attrs

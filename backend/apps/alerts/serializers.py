from rest_framework import serializers

from .models import JobAlert

MAX_ALERTS_PER_USER = 20


class JobAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobAlert
        fields = ["id", "name", "keywords", "job_type", "majors", "location", "remote_ok", "min_salary", "email", "telegram",
                  "webpush", "telegram_chat_id", "frequency", "is_active", "last_sent_at", "created_at", "updated_at"]
        read_only_fields = ["last_sent_at", "created_at", "updated_at"]

    def validate_telegram_chat_id(self, v):
        v = (v or "").strip()
        if v and not v.lstrip("-").isdigit() and not v.startswith("@"):
            raise serializers.ValidationError("Telegram chat id must be numeric (or an @channel name).")
        return v

    def validate(self, attrs):
        get = lambda k: attrs.get(k, getattr(self.instance, k, None) if self.instance else None)  # noqa: E731
        if get("telegram") and not get("telegram_chat_id"):
            raise serializers.ValidationError({"telegram_chat_id": "Required when Telegram delivery is on."})
        if not self.instance:
            user = self.context["request"].user
            if JobAlert.objects.filter(user=user).count() >= MAX_ALERTS_PER_USER:
                raise serializers.ValidationError(f"You can keep up to {MAX_ALERTS_PER_USER} alerts.")
        return attrs

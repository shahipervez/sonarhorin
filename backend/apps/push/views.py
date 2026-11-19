from django.conf import settings
from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PushSubscription
from .services import endpoint_allowed, push_enabled

MAX_SUBSCRIPTIONS_PER_USER = 10


class _Keys(serializers.Serializer):
    p256dh = serializers.CharField(max_length=200)
    auth = serializers.CharField(max_length=100)


class SubscriptionSerializer(serializers.Serializer):
    """Matches the browser's PushSubscription.toJSON() shape."""

    endpoint = serializers.URLField(max_length=1000)
    keys = _Keys()

    def validate_endpoint(self, value):
        if not endpoint_allowed(value):
            raise serializers.ValidationError("Unsupported push service endpoint.")
        return value


class VapidKeyView(APIView):
    """GET → {enabled, public_key}. The browser needs the public key to subscribe."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"enabled": push_enabled(), "public_key": settings.VAPID_PUBLIC_KEY if push_enabled() else ""})


class SubscribeView(APIView):
    """POST PushSubscription JSON → saved for the current user. DELETE {endpoint} → removed."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not push_enabled():
            return Response({"detail": "Push notifications are not configured."}, status=503)
        s = SubscriptionSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        sub, created = PushSubscription.objects.update_or_create(
            endpoint=d["endpoint"],
            defaults={"user": request.user, "p256dh": d["keys"]["p256dh"], "auth": d["keys"]["auth"],
                      "user_agent": request.headers.get("User-Agent", "")[:300], "failures": 0},
        )
        # Cap devices per user — drop the oldest.
        extra = PushSubscription.objects.filter(user=request.user).order_by("-created_at")[MAX_SUBSCRIPTIONS_PER_USER:]
        PushSubscription.objects.filter(pk__in=[x.pk for x in extra]).delete()
        return Response({"id": sub.pk, "created": created}, status=201 if created else 200)

    def delete(self, request):
        endpoint = request.data.get("endpoint") or request.query_params.get("endpoint")
        qs = PushSubscription.objects.filter(user=request.user)
        if endpoint:
            qs = qs.filter(endpoint=endpoint)
        n, _ = qs.delete()
        return Response(status=204 if n else 404)

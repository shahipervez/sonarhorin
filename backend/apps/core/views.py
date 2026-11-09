from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.models import MAJOR_CHOICES


@api_view(["GET"])
@permission_classes([AllowAny])
def public_config(request):
    """Public settings the frontend needs (Community → Discord, majors, AI availability)."""
    return Response(
        {
            "discord_url": settings.DISCORD_INVITE_URL,
            "majors": [{"value": v, "label": l} for v, l in MAJOR_CHOICES],
            "ai_enabled": bool(settings.ANTHROPIC_API_KEY),
            "quick_test": {
                "questions": settings.QUICK_TEST_QUESTIONS,
                "minutes": settings.QUICK_TEST_MINUTES,
                "pass_percent": settings.QUICK_TEST_PASS_PERCENT,
            },
            "interview_minutes": settings.INTERVIEW_MINUTES,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"ok": True})


# ------------------------------------------------------------------ waitlist
from django.core.validators import validate_email  # noqa: E402
from django.core.exceptions import ValidationError  # noqa: E402
from rest_framework.throttling import AnonRateThrottle  # noqa: E402

from apps.accounts.models import MAJOR_CHOICES as _MAJORS  # noqa: E402

from .models import WaitlistEntry  # noqa: E402


class WaitlistThrottle(AnonRateThrottle):
    scope = "waitlist"  # own counter, separate from the global anon throttle
    rate = "20/hour"


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def waitlist(request):
    """GET → {count}.  POST {email, major?} → {position, count, already}."""
    if request.method == "GET":
        return Response({"count": WaitlistEntry.objects.count()})
    if not WaitlistThrottle().allow_request(request, None):
        return Response({"detail": "Too many tries — please wait a little."}, status=429)
    email = (request.data.get("email") or "").strip().lower()
    try:
        validate_email(email)
    except ValidationError:
        return Response({"detail": "Please enter a valid email address."}, status=400)
    major = request.data.get("major") if request.data.get("major") in dict(_MAJORS) else ""
    entry, created = WaitlistEntry.objects.get_or_create(email=email, defaults={"major": major})
    return Response({"position": entry.position, "count": WaitlistEntry.objects.count(), "already": not created},
                    status=201 if created else 200)


@api_view(["GET"])
@permission_classes([AllowAny])
def videos(request):
    """সোনারহরিণ TV playlist — team-added YouTube videos."""
    from .models import Video

    return Response([{"id": v.id, "title": v.title, "title_bn": v.title_bn, "kind": v.kind, "youtube_id": v.youtube_id,
                      "speaker": v.speaker, "minutes": v.minutes} for v in Video.objects.filter(is_active=True)[:40]])

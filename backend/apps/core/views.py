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


# ---------------------------------------------------------------------------
# Guide Bot — answers "where is X / how do I Y" questions about the site.
# The frontend answers common questions instantly on its own; it only calls this for questions it couldn't match.
# ---------------------------------------------------------------------------
GUIDE_PAGES = {
    "/jobs": "Fresher & entry-level jobs, 1-tap apply, filter by major",
    "/internships": "Internships: paid, learning (unpaid + certificate), versity credit, corporate (PPO), remote",
    "/programs": "Graduate programs, internship programs and offline trainings",
    "/cv": "Judge Yourself: upload a CV, get rejection % and an improvement report (ATS check)",
    "/studio": "CV Studio: tailor your CV to one specific job",
    "/quick-test": "Quick Test: major-based MCQ test (BBA/CSE/EEE…)",
    "/interview": "10-minute AI mock interview with feedback",
    "/coach": "Interview Coach: AI prep kit for one specific job",
    "/certificates": "Certifications and certificate verification",
    "/efficiency": "Efficiency Test (pre-joining test companies use)",
    "/portfolio": "Portfolio website builder",
    "/network": "Network: connect and chat with students, find co-founders",
    "/startup": "Startup: we help founders get funded. Start with idea/problem/solution, build the full pitch, then a funding wall of grants, accelerators and investors in Bangladesh and worldwide",
    "/stories": "Success stories and videos",
    "/applications": "My applications and their status (login needed)",
    "/me": "Dashboard (login needed)",
    "/login": "Log in",
    "/register": "Create a free account",
}


class GuideThrottle(AnonRateThrottle):
    scope = "guide"
    rate = "40/hour"


@api_view(["POST"])
@permission_classes([AllowAny])
def guide(request):
    """POST {message, page?, lang?} → {reply, links:[path…]}. reply is null when AI is off (frontend falls back)."""
    from . import ai

    msg = str(request.data.get("message") or "").strip()[:500]
    if not msg:
        return Response({"detail": "message is required"}, status=400)
    if not ai.enabled():
        return Response({"reply": None, "links": []})
    if not GuideThrottle().allow_request(request, None):
        return Response({"detail": "Too many questions — please wait a little."}, status=429)
    page = str(request.data.get("page") or "/")[:80]
    lang = "Bangla" if request.data.get("lang") == "bn" else "English"
    site = "\n".join(f"- {p}: {d}" for p, d in GUIDE_PAGES.items())
    system = (
        "You are the Guide Bot of সোনারহরিণ (Sonarhorin), a jobs & career website only for freshers in Bangladesh. "
        "Help the visitor find the right page and explain briefly how to use it. Pages:\n" + site + "\n"
        f"The visitor is on {page}. Reply in {lang} (Banglish input is fine), in at most 3 short sentences, friendly. "
        "Only talk about this website and fresher careers; for anything else, politely steer back. Never invent "
        "features, prices or jobs. Respond ONLY with JSON: {\"reply\": string, \"links\": [up to 3 paths from the list]}."
    )
    data = ai.complete_json(system, ai.untrusted("question", msg), max_tokens=300)
    if not isinstance(data, dict) or not isinstance(data.get("reply"), str):
        return Response({"reply": None, "links": []})
    links = [p for p in (data.get("links") or []) if isinstance(p, str) and p in GUIDE_PAGES][:3]
    return Response({"reply": data["reply"][:600], "links": links})

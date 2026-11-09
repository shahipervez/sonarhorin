from django.db.models import Avg, F
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.assessments.models import QuickTestAttempt
from apps.certifications.models import Certificate
from apps.cv.models import CVAnalysis

from .models import SuccessStory
from .serializers import StorySerializer, StorySubmitSerializer


def journey_for(user):
    """Facts we already know from the user's Sonarhorin activity — filled in automatically."""
    cvs = CVAnalysis.objects.filter(user=user).order_by("created_at")
    first = cvs.first()
    best = cvs.order_by("-score").first()
    cert = Certificate.objects.filter(user=user, revoked=False).order_by("-issued_at").first()
    return {
        "cv_score_before": first.score if first else None,
        "cv_score_after": best.score if best and first and best.id != first.id else None,
        "tests_passed": QuickTestAttempt.objects.filter(user=user, passed=True).count(),
        "certificate_code": cert.code if cert else "",
        "days_to_hire": max(1, (timezone.now() - user.date_joined).days),
    }


class StoryListView(APIView):
    """GET ?major=CSE → approved stories + aggregate stats.  POST (auth) → submit for review."""

    def get_permissions(self):
        return [permissions.AllowAny()] if self.request.method == "GET" else [permissions.IsAuthenticated()]

    def get(self, request):
        qs = SuccessStory.objects.filter(status="approved")
        if (m := request.query_params.get("major")):
            qs = qs.filter(major=m)
        real = qs.filter(is_demo=False)
        base = real if real.exists() else qs  # stats from real stories once there are any
        jumps = base.exclude(cv_score_before=None).exclude(cv_score_after=None)
        stats = {
            "count": qs.count(),
            "real_count": real.count(),
            "avg_days_to_hire": round(base.exclude(days_to_hire=None).aggregate(v=Avg("days_to_hire"))["v"] or 0),
            "avg_cv_jump": round(jumps.aggregate(v=Avg(F("cv_score_after") - F("cv_score_before")))["v"] or 0),
            "avg_months_jobless": round(base.aggregate(v=Avg("months_jobless"))["v"] or 0, 1),
            "sample_only": not real.exists() and qs.exists(),
        }
        return Response({"stats": stats, "stories": StorySerializer(qs[:60], many=True).data})

    def post(self, request):
        s = StorySubmitSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        if SuccessStory.objects.filter(user=request.user, status="pending").exists():
            return Response({"detail": "You already have a story waiting for review."}, status=409)
        story = SuccessStory.objects.create(user=request.user, major=request.user.major, status="pending",
                                            **s.validated_data, **journey_for(request.user))
        return Response(StorySerializer(story).data, status=201)


class MyStoriesView(APIView):
    def get(self, request):
        return Response({"journey": journey_for(request.user),
                         "stories": StorySerializer(SuccessStory.objects.filter(user=request.user), many=True).data})

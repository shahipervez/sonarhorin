from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.jobs.models import Job

from .match import match_score
from .salary import salary_insight


class MatchScoreView(APIView):
    """GET /api/jobs/<id>/match/ — how well the signed-in user's CV/profile fits this job."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        job = get_object_or_404(Job.objects.select_related("company"), pk=pk)
        return Response(match_score(request.user, job))


class SalaryInsightView(APIView):
    """GET /api/insights/salary/?title=&location=&type= — min/median/max from posted salary ranges."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        p = request.query_params
        return Response(salary_insight(p.get("title", "")[:120], p.get("location", "")[:100], p.get("type", "")[:20]))

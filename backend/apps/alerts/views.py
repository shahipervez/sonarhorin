from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from . import services
from .models import JobAlert
from .serializers import JobAlertSerializer


class AlertListCreateView(generics.ListCreateAPIView):
    """GET own alerts / POST a new alert."""

    serializer_class = JobAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return JobAlert.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AlertDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobAlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):  # other users' alerts 404
        return JobAlert.objects.filter(user=self.request.user)


class AlertTestThrottle(UserRateThrottle):
    scope = "alert_test"
    rate = "10/hour"  # set here so no settings change is needed; stops the test button spamming inboxes


class AlertTestView(APIView):
    """POST /api/alerts/<id>/test/ — send a sample message on every enabled channel now."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AlertTestThrottle]

    def post(self, request, pk):
        alert = get_object_or_404(JobAlert.objects.select_related("user"), pk=pk, user=request.user)
        return Response(services.send_test(alert))

from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Application, Program
from .serializers import ApplicationSerializer, ProgramSerializer


class ProgramListView(generics.ListAPIView):
    """GET ?kind=graduate|internship|training&major=CSE"""

    permission_classes = [permissions.AllowAny]
    serializer_class = ProgramSerializer

    def get_queryset(self):
        qs = Program.objects.filter(is_active=True)
        if k := self.request.query_params.get("kind"):
            qs = qs.filter(kind=k)
        if m := self.request.query_params.get("major"):
            qs = [p for p in qs if not p.major_list or m in p.major_list]
        return qs


class ProgramDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProgramSerializer
    queryset = Program.objects.filter(is_active=True)


class ApplyView(APIView):
    def post(self, request, pk):
        p = get_object_or_404(Program, pk=pk, is_active=True)
        if p.deadline < timezone.localdate():
            return Response({"detail": "Applications for this program are closed."}, status=400)
        if p.major_list and request.user.major not in p.major_list:
            return Response({"detail": f"This program is for {', '.join(p.major_list)} students."}, status=400)
        motivation = (request.data.get("motivation") or "").strip()
        if len(motivation) < 40:
            return Response({"detail": "Tell us a bit more (at least 40 characters) about why you want to join."}, status=400)
        if Application.objects.filter(user=request.user, program=p).exists():
            return Response({"detail": "You've already applied."}, status=409)
        try:
            with transaction.atomic():
                a = Application.objects.create(user=request.user, program=p, motivation=motivation[:1500])
        except IntegrityError:
            return Response({"detail": "You've already applied."}, status=409)
        return Response(ApplicationSerializer(a, context={"request": request}).data, status=201)


class MyApplicationsView(generics.ListAPIView):
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user).select_related("program")

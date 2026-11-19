from django.http import HttpResponse
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.throttles import STRICT

from . import analyzer
from .models import CVAnalysis
from .pdf import build_cv_report_pdf
from .serializers import CVAnalysisSerializer, CVUploadSerializer


class AnalyzeCVView(APIView):
    """POST multipart {file, major?, target_role?} → score, rejection %, report."""

    throttle_classes = STRICT
    throttle_scope = "upload"  # file parsing + optional LLM call per request

    def post(self, request):
        s = CVUploadSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        f = s.validated_data["file"]
        major = s.validated_data.get("major") or request.user.major
        role = s.validated_data.get("target_role", "")
        try:
            text, pages = analyzer.extract_text(f, f.name)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
        except Exception:
            return Response({"detail": "Could not read this file. Is it password-protected or corrupted?"}, status=400)
        f.seek(0)
        report = analyzer.analyze(text, pages, major, role)
        report = analyzer.ai_enrich(report, text, major, role)
        obj = CVAnalysis.objects.create(
            user=request.user, file=f, original_name=f.name[:255], major=major, target_role=role,
            extracted_text=text[:50000], score=report["score"], rejection_probability=report["rejection_probability"],
            report=report,
        )
        return Response(CVAnalysisSerializer(obj).data, status=201)


class MyAnalysesView(generics.ListAPIView):
    serializer_class = CVAnalysisSerializer

    def get_queryset(self):
        return CVAnalysis.objects.filter(user=self.request.user)


class AnalysisDetailView(generics.RetrieveAPIView):
    serializer_class = CVAnalysisSerializer

    def get_queryset(self):
        return CVAnalysis.objects.filter(user=self.request.user)


class AnalysisPDFView(APIView):
    def get(self, request, pk):
        obj = generics.get_object_or_404(CVAnalysis, pk=pk, user=request.user)
        resp = HttpResponse(build_cv_report_pdf(obj), content_type="application/pdf")
        resp["Content-Disposition"] = f'attachment; filename="sonarhorin-cv-report-{obj.pk}.pdf"'
        return resp

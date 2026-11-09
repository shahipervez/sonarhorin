from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.views import APIView

from .models import Certificate
from .pdf import build_certificate_pdf
from .serializers import CertificateSerializer, PublicCertificateSerializer


class MyCertificatesView(generics.ListAPIView):
    serializer_class = CertificateSerializer

    def get_queryset(self):
        return Certificate.objects.filter(user=self.request.user)


class VerifyCertificateView(generics.RetrieveAPIView):
    """Public: employers verify a certificate by its code."""

    permission_classes = [permissions.AllowAny]
    serializer_class = PublicCertificateSerializer
    lookup_field = "code"

    def get_queryset(self):
        return Certificate.objects.select_related("user")


class CertificatePDFView(APIView):
    def get(self, request, pk):
        cert = get_object_or_404(Certificate, pk=pk, user=request.user)
        resp = HttpResponse(build_certificate_pdf(cert), content_type="application/pdf")
        resp["Content-Disposition"] = f'attachment; filename="sonarhorin-certificate-{cert.code}.pdf"'
        return resp

from rest_framework import serializers

from .models import Certificate


class CertificateSerializer(serializers.ModelSerializer):
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)
    verify_url = serializers.CharField(read_only=True)

    class Meta:
        model = Certificate
        fields = ["id", "kind", "kind_label", "title", "score", "details", "code", "issued_at", "revoked", "verify_url"]


class PublicCertificateSerializer(serializers.ModelSerializer):
    holder = serializers.CharField(source="user.full_name")
    major = serializers.CharField(source="user.major")
    kind_label = serializers.CharField(source="get_kind_display")

    class Meta:
        model = Certificate
        fields = ["holder", "major", "kind", "kind_label", "title", "score", "details", "code", "issued_at", "revoked"]

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, serializers
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Pitch
from .scoring import score

EDITABLE = ["name", "one_liner", "sector", "stage", "problem", "solution", "market", "business_model", "traction", "team",
            "ask_amount", "use_of_funds", "video_url", "public_story"]


class PitchSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    deck_name = serializers.SerializerMethodField()
    readiness = serializers.SerializerMethodField()

    class Meta:
        model = Pitch
        fields = ["id", *EDITABLE, "status", "status_label", "feedback", "funded_amount", "deck_name", "readiness", "created_at", "updated_at", "submitted_at"]
        read_only_fields = ["status", "feedback", "funded_amount"]

    def get_deck_name(self, p):
        return p.deck.name.rsplit("/", 1)[-1] if p.deck else ""

    def get_readiness(self, p):
        return score(p)


class Pitches(APIView):
    def get(self, request):
        return Response(PitchSerializer(Pitch.objects.filter(user=request.user), many=True).data)

    def post(self, request):
        s = PitchSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        return Response(PitchSerializer(s.save(user=request.user)).data, status=201)


class PitchDetail(APIView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def obj(self, request, pk):
        return get_object_or_404(Pitch, pk=pk, user=request.user)

    def get(self, request, pk):
        return Response(PitchSerializer(self.obj(request, pk)).data)

    def put(self, request, pk):
        p = self.obj(request, pk)
        if p.status not in ("draft", "declined"):
            return Response({"detail": "Submitted pitches are locked while we review them."}, status=400)
        s = PitchSerializer(p, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        return Response(PitchSerializer(s.save()).data)

    def delete(self, request, pk):
        p = self.obj(request, pk)
        if p.status != "draft":
            return Response({"detail": "Only drafts can be deleted."}, status=400)
        p.delete()
        return Response(status=204)


class PitchDeck(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        p = get_object_or_404(Pitch, pk=pk, user=request.user)
        f = request.FILES.get("file")
        if not f or not f.name.lower().endswith(".pdf"):
            return Response({"detail": "Upload your deck as a PDF."}, status=400)
        if f.size > 10 * 1024 * 1024:
            return Response({"detail": "Max deck size is 10 MB."}, status=400)
        if f.read(5) != b"%PDF-":
            return Response({"detail": "That file isn't a valid PDF."}, status=400)
        f.seek(0)
        p.deck.save(f.name[-80:], f, save=True)
        return Response(PitchSerializer(p).data)


class PitchSubmit(APIView):
    def post(self, request, pk):
        p = get_object_or_404(Pitch, pk=pk, user=request.user)
        if p.status not in ("draft", "declined"):
            return Response({"detail": "Already submitted."}, status=400)
        r = score(p)
        if r["score"] < 45:
            return Response({"detail": f"Readiness {r['score']}/100 — fill in the missing parts first (45 needed to submit).", "readiness": r}, status=400)
        p.status, p.submitted_at = "submitted", timezone.now()
        p.save(update_fields=["status", "submitted_at"])
        return Response(PitchSerializer(p).data)


class Funded(APIView):
    """Public: founders who were funded and agreed to share their story."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = Pitch.objects.filter(status="funded", public_story=True).select_related("user")[:24]
        return Response([{"name": p.name, "one_liner": p.one_liner, "sector": p.get_sector_display(), "founder": p.user.full_name,
                          "university": p.user.university, "amount": p.funded_amount} for p in qs])

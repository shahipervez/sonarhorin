from django.db import IntegrityError, transaction
from django.db.models import Avg, Count, F, Q
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.jobs.models import Company

from .models import AUTO_HIDE_REPORTS, CompanyReview, ReviewReport
from .serializers import CompanyReviewSerializer


def company_aggregate(company):
    qs = CompanyReview.objects.filter(company=company, is_approved=True)
    agg = qs.aggregate(count=Count("id"), avg_rating=Avg("rating"), avg_difficulty=Avg("interview_difficulty"),
                       offers=Count("id", filter=Q(got_offer=True)),
                       offer_known=Count("id", filter=Q(got_offer__isnull=False)))
    dist = dict(qs.values_list("rating").annotate(n=Count("id")).values_list("rating", "n"))
    by_type = dict(qs.values_list("review_type").annotate(n=Count("id")).values_list("review_type", "n"))
    rnd = lambda v: round(v, 2) if v is not None else None  # noqa: E731
    return {
        "count": agg["count"],
        "avg_rating": rnd(agg["avg_rating"]),
        "avg_interview_difficulty": rnd(agg["avg_difficulty"]),
        "offer_rate": rnd(agg["offers"] / agg["offer_known"]) if agg["offer_known"] else None,
        "rating_distribution": {str(i): dist.get(i, 0) for i in range(1, 6)},
        "by_type": {t: by_type.get(t, 0) for t, _ in CompanyReview.TYPES},
    }


class CompanyReviewsView(APIView):
    """GET /api/reviews/companies/<slug>/?type=interview — public list + aggregate.
    POST (auth) — create the caller's review of this company (one per review_type)."""

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request, slug):
        company = get_object_or_404(Company, slug=slug)
        qs = CompanyReview.objects.filter(company=company, is_approved=True).select_related("author", "company")
        if (t := request.query_params.get("type")) in dict(CompanyReview.TYPES):
            qs = qs.filter(review_type=t)
        reviews = CompanyReviewSerializer(qs[:100], many=True, context={"request": request}).data
        return Response({"company": {"name": company.name, "slug": company.slug},
                         "aggregate": company_aggregate(company), "reviews": reviews})

    def post(self, request, slug):
        company = get_object_or_404(Company, slug=slug)
        ser = CompanyReviewSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        review_type = ser.validated_data.get("review_type", "interview")
        dup = {"detail": f"You have already reviewed your {review_type} at {company.name}."}
        if CompanyReview.objects.filter(company=company, author=request.user, review_type=review_type).exists():
            return Response(dup, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                review = ser.save(company=company, author=request.user)
        except IntegrityError:  # lost a race with a concurrent identical POST
            return Response(dup, status=status.HTTP_400_BAD_REQUEST)
        return Response(CompanyReviewSerializer(review, context={"request": request}).data, status=status.HTTP_201_CREATED)


class ReportReviewView(APIView):
    """POST /api/reviews/<id>/report/ {reason} — flag a review. Hidden after AUTO_HIDE_REPORTS distinct reports."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        review = get_object_or_404(CompanyReview, pk=pk, is_approved=True)
        if review.author_id == request.user.id:
            return Response({"detail": "You can't report your own review."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                ReviewReport.objects.create(review=review, reporter=request.user,
                                            reason=str(request.data.get("reason", ""))[:300])
                CompanyReview.objects.filter(pk=review.pk).update(report_count=F("report_count") + 1)
                CompanyReview.objects.filter(pk=review.pk, report_count__gte=AUTO_HIDE_REPORTS).update(is_approved=False)
        except IntegrityError:
            return Response({"detail": "Already reported. Thanks!"}, status=status.HTTP_200_OK)
        return Response({"detail": "Reported. A moderator will take a look."}, status=status.HTTP_201_CREATED)

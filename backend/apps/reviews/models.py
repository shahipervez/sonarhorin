from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.jobs.models import Company

ONE_TO_FIVE = [MinValueValidator(1), MaxValueValidator(5)]
AUTO_HIDE_REPORTS = 3  # a review with this many distinct reports is hidden until a moderator re-approves it


class CompanyReview(models.Model):
    """Glassdoor-style review of a company: interview, internship or job experience."""

    TYPES = [("interview", "Interview"), ("internship", "Internship"), ("job", "Job")]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="reviews")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="company_reviews")
    anonymous = models.BooleanField(default=True, help_text="Hide the author's name from everyone except admins.")
    role_title = models.CharField(max_length=120, blank=True)
    review_type = models.CharField(max_length=12, choices=TYPES, default="interview")
    rating = models.PositiveSmallIntegerField(validators=ONE_TO_FIVE)
    interview_difficulty = models.PositiveSmallIntegerField(null=True, blank=True, validators=ONE_TO_FIVE)
    got_offer = models.BooleanField(null=True, blank=True)
    pros = models.TextField(blank=True, max_length=3000)
    cons = models.TextField(blank=True, max_length=3000)
    interview_questions = models.TextField(blank=True, max_length=4000)
    created_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=True)
    report_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["company", "author", "review_type"], name="uniq_review_company_author_type"),
            models.CheckConstraint(condition=models.Q(rating__gte=1, rating__lte=5), name="review_rating_1_5"),
            models.CheckConstraint(condition=models.Q(interview_difficulty__isnull=True)
                                   | models.Q(interview_difficulty__gte=1, interview_difficulty__lte=5),
                                   name="review_difficulty_1_5"),
        ]
        # The public list query: approved reviews of one company, newest first.
        indexes = [models.Index(fields=["company", "is_approved", "-created_at"], name="review_company_list_idx")]

    def __str__(self):
        return f"{self.company} · {self.review_type} · {self.rating}★"


class ReviewReport(models.Model):
    """One row per (review, reporter) so report_count can't be inflated by a single user."""

    review = models.ForeignKey(CompanyReview, on_delete=models.CASCADE, related_name="reports")
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="review_reports")
    reason = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["review", "reporter"], name="uniq_review_report")]

    def __str__(self):
        return f"Report on #{self.review_id}"

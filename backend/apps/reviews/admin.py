from django.contrib import admin

from .models import CompanyReview, ReviewReport


class ReviewReportInline(admin.TabularInline):
    model = ReviewReport
    extra = 0
    readonly_fields = ["reporter", "reason", "created_at"]


@admin.register(CompanyReview)
class CompanyReviewAdmin(admin.ModelAdmin):
    list_display = ["company", "review_type", "rating", "interview_difficulty", "got_offer", "anonymous", "author",
                    "is_approved", "report_count", "created_at"]
    list_filter = ["is_approved", "review_type", "rating", "anonymous"]
    search_fields = ["company__name", "role_title", "pros", "cons", "author__email"]
    list_select_related = ["company", "author"]
    raw_id_fields = ["company", "author"]
    inlines = [ReviewReportInline]
    actions = ["approve", "unapprove"]

    @admin.action(description="Approve (and clear reports)")
    def approve(self, request, queryset):
        queryset.update(is_approved=True, report_count=0)
        ReviewReport.objects.filter(review__in=queryset).delete()

    @admin.action(description="Hide from public")
    def unapprove(self, request, queryset):
        queryset.update(is_approved=False)


@admin.register(ReviewReport)
class ReviewReportAdmin(admin.ModelAdmin):
    list_display = ["review", "reporter", "reason", "created_at"]
    raw_id_fields = ["review", "reporter"]

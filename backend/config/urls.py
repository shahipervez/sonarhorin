from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.insights.views import MatchScoreView

admin.site.site_header = "Sonarhorin Admin"
admin.site.site_title = "Sonarhorin"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.core.urls")),
    path("api/cv/", include("apps.cv.urls")),
    path("api/assessments/", include("apps.assessments.urls")),
    path("api/interviews/", include("apps.interviews.urls")),
    path("api/programs/", include("apps.programs.urls")),
    path("api/certificates/", include("apps.certifications.urls")),
    path("api/stories/", include("apps.stories.urls")),
    path("api/jobs/<int:pk>/match/", MatchScoreView.as_view()),
    path("api/jobs/", include("apps.jobs.urls")),
    path("api/portfolio/", include("apps.portfolio.urls")),
    path("api/network/", include("apps.network.urls")),
    path("api/startups/", include("apps.startups.urls")),
    path("api/career/", include("apps.career.urls")),
    path("api/reviews/", include("apps.reviews.urls")),
    path("api/alerts/", include("apps.alerts.urls")),
    path("api/insights/", include("apps.insights.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

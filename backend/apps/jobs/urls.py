from django.urls import path

from . import views

urlpatterns = [
    path("", views.JobListView.as_view()),
    path("companies/featured/", views.FeaturedCompaniesView.as_view()),
    path("scraper/run/", views.ScraperTriggerView.as_view()),
    path("scraper/status/", views.ScraperStatusView.as_view()),
    path("scrape/", views.ScraperTriggerView.as_view()),
    path("matches/", views.MatchesView.as_view()),
    path("apply-bulk/", views.BulkApplyView.as_view()),
    path("auto-apply/", views.AutoApplyView.as_view()),
    path("auto-apply/run/", views.AutoApplyRunView.as_view()),
    path("applications/", views.MyApplicationsView.as_view()),
    path("applications/<int:pk>/<str:action>/", views.ApplicationActionView.as_view()),
    path("employer/applicants/", views.EmployerApplicantsView.as_view()),
    path("report-scam/", views.ReportScamView.as_view()),
    path("<int:pk>/", views.JobDetailView.as_view()),
    path("<int:pk>/preview/", views.PreviewView.as_view()),
    path("<int:pk>/apply/", views.ApplyView.as_view()),
]

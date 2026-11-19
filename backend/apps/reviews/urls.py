from django.urls import path

from . import views

urlpatterns = [
    path("companies/<slug:slug>/", views.CompanyReviewsView.as_view()),
    path("<int:pk>/report/", views.ReportReviewView.as_view()),
]

from django.urls import path

from . import views

urlpatterns = [
    path("analyze/", views.AnalyzeCVView.as_view()),
    path("analyses/", views.MyAnalysesView.as_view()),
    path("analyses/<int:pk>/", views.AnalysisDetailView.as_view()),
    path("analyses/<int:pk>/pdf/", views.AnalysisPDFView.as_view()),
]

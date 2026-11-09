from django.urls import path

from . import views

urlpatterns = [
    path("", views.MyCertificatesView.as_view()),
    path("<int:pk>/pdf/", views.CertificatePDFView.as_view()),
    path("verify/<str:code>/", views.VerifyCertificateView.as_view()),
]

from django.urls import path

from . import views

urlpatterns = [
    path("", views.AlertListCreateView.as_view()),
    path("<int:pk>/", views.AlertDetailView.as_view()),
    path("<int:pk>/test/", views.AlertTestView.as_view()),
]

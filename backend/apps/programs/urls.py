from django.urls import path

from . import views

urlpatterns = [
    path("", views.ProgramListView.as_view()),
    path("mine/", views.MyApplicationsView.as_view()),
    path("<int:pk>/", views.ProgramDetailView.as_view()),
    path("<int:pk>/apply/", views.ApplyView.as_view()),
]

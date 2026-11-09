from django.urls import path

from . import views

urlpatterns = [
    path("start/", views.StartInterviewView.as_view()),
    path("history/", views.InterviewHistoryView.as_view()),
    path("<int:pk>/", views.InterviewDetailView.as_view()),
    path("<int:pk>/answer/", views.AnswerView.as_view()),
    path("<int:pk>/finish/", views.FinishInterviewView.as_view()),
]

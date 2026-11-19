from django.urls import path

from . import views

urlpatterns = [
    path("salary/", views.SalaryInsightView.as_view()),
]

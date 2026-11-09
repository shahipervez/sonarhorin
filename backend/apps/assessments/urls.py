from django.urls import path

from . import views

urlpatterns = [
    path("quick/start/", views.QuickTestStartView.as_view()),
    path("quick/<int:pk>/submit/", views.QuickTestSubmitView.as_view()),
    path("quick/history/", views.QuickTestHistoryView.as_view()),
    path("efficiency/", views.EfficiencyTestListView.as_view()),
    path("efficiency/code/<str:code>/", views.EfficiencyByCodeView.as_view()),
    path("efficiency/<int:pk>/", views.EfficiencyDetailView.as_view()),
    path("efficiency/<int:pk>/start/", views.EfficiencyStartView.as_view()),
    path("efficiency/<int:pk>/results/", views.EmployerResultsView.as_view()),
    path("efficiency/sessions/<int:sid>/current/", views.EfficiencyCurrentView.as_view()),
    path("efficiency/sessions/<int:sid>/answer/", views.EfficiencyAnswerView.as_view()),
    path("efficiency/sessions/<int:sid>/event/", views.EfficiencyEventView.as_view()),
    path("efficiency/sessions/<int:sid>/snapshot/", views.EfficiencySnapshotView.as_view()),
    path("efficiency/sessions/<int:sid>/result/", views.EfficiencyResultView.as_view()),
]

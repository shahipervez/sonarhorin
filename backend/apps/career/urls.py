from django.urls import path

from . import views

urlpatterns = [
    path("", views.Overview.as_view()),
    path("resumes/", views.ResumeListCreate.as_view()),
    path("resumes/<int:pk>/", views.ResumeDetail.as_view()),
    path("resumes/<int:pk>/file/", views.ResumeFile.as_view()),
    path("tailor/", views.TailorListCreate.as_view()),
    path("tailor/<int:pk>/", views.TailorDetail.as_view()),
    path("tailor/<int:pk>/export/", views.TailorExport.as_view()),
    path("kits/", views.KitListCreate.as_view()),
    path("kits/<int:pk>/", views.KitDetail.as_view()),
    path("kits/<int:pk>/practice/", views.Practice.as_view()),
    path("kits/<int:pk>/chat/", views.CoachChat.as_view()),
]

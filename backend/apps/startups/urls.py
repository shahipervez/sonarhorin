from django.urls import path

from . import views

urlpatterns = [
    path("pitches/", views.Pitches.as_view()),
    path("pitches/<int:pk>/", views.PitchDetail.as_view()),
    path("pitches/<int:pk>/deck/", views.PitchDeck.as_view()),
    path("pitches/<int:pk>/submit/", views.PitchSubmit.as_view()),
    path("funded/", views.Funded.as_view()),
]

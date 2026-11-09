from django.urls import path

from . import views

urlpatterns = [
    path("mine/", views.MinePortfolio.as_view()),
    path("prefill/", views.Prefill.as_view()),
    path("slug-check/", views.SlugCheck.as_view()),
    path("u/<slug:slug>/", views.PublicPortfolio.as_view()),
]

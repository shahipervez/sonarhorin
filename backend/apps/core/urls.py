from django.urls import path

from . import views

urlpatterns = [
    path("config/", views.public_config),
    path("health/", views.health),
    path("waitlist/", views.waitlist),
    path("videos/", views.videos),
]

from django.urls import path

from .views import SubscribeView, VapidKeyView

urlpatterns = [
    path("vapid-key/", VapidKeyView.as_view()),
    path("subscribe/", SubscribeView.as_view()),
]

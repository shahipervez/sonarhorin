from django.urls import path

from . import views

urlpatterns = [
    path("", views.Overview.as_view()),
    path("people/", views.People.as_view()),
    path("connect/<int:user_id>/", views.Connect.as_view()),
    path("requests/<int:request_id>/<str:action>/", views.Respond.as_view()),
    path("dm/<int:user_id>/", views.Direct.as_view()),
    path("rooms/<slug:slug>/", views.Room.as_view()),
]

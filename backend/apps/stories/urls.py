from django.urls import path

from . import views

urlpatterns = [
    path("", views.StoryListView.as_view()),
    path("mine/", views.MyStoriesView.as_view()),
]

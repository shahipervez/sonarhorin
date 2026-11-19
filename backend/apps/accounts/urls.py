from django.urls import path

from .integrations import GoogleLoginView, OTPRequestView, OTPVerifyView
from .views import ChangePasswordView, LoginView, LogoutView, MeView, ParseCVView, RefreshView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("refresh/", RefreshView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("password/", ChangePasswordView.as_view()),
    path("me/", MeView.as_view()),
    path("parse-cv/", ParseCVView.as_view()),
    # third-party sign-in (apps/accounts/integrations.py)
    path("google/", GoogleLoginView.as_view()),
    path("otp/request/", OTPRequestView.as_view()),
    path("otp/verify/", OTPVerifyView.as_view()),
]

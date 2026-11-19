from django.urls import path

from .views import InitPaymentView, IPNView, PaymentStatusView, PlansView, ReturnView

urlpatterns = [
    path("plans/", PlansView.as_view()),
    path("init/", InitPaymentView.as_view()),
    path("ipn/", IPNView.as_view()),
    path("return/<str:result>/", ReturnView.as_view()),
    path("<str:tran_id>/", PaymentStatusView.as_view()),
]

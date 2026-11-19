"""SSLCommerz premium checkout skeleton. See docs/integrations/INTEGRATIONS.md."""
import logging
from decimal import Decimal
from urllib.parse import urlencode

from django.conf import settings
from django.http import HttpResponseRedirect
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from . import sslcommerz
from .models import Payment
from .services import process_validation

log = logging.getLogger("apps.payments")


def _api_url(path):
    return settings.API_PUBLIC_URL.rstrip("/") + path


class PlansView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({
            "enabled": sslcommerz.configured(),
            "sandbox": settings.SSLCZ_SANDBOX,
            "plans": [{"id": k, "name": v["name"], "amount": v["amount"], "currency": "BDT"} for k, v in settings.PREMIUM_PLANS.items()],
        })


class InitPaymentView(APIView):
    """POST {plan} → {tran_id, gateway_url}. The SPA redirects the browser to gateway_url."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not sslcommerz.configured():
            return Response({"detail": "Payments are not configured."}, status=503)
        plan_id = request.data.get("plan", "premium_monthly")
        plan = settings.PREMIUM_PLANS.get(plan_id)
        if not plan:
            return Response({"detail": "Unknown plan."}, status=400)
        u = request.user
        payment = Payment.objects.create(user=u, plan=plan_id, amount=Decimal(str(plan["amount"])))
        urls = {
            "success": _api_url("/api/payments/return/success/"),
            "fail": _api_url("/api/payments/return/fail/"),
            "cancel": _api_url("/api/payments/return/cancel/"),
            "ipn": _api_url("/api/payments/ipn/"),
        }
        customer = {"name": u.full_name, "email": "" if u.email.endswith("@phone.sonarhorin.com") else u.email, "phone": u.phone}
        try:
            session = sslcommerz.init_session(payment, customer=customer, product_name=plan["name"], urls=urls)
        except sslcommerz.SSLCommerzError as e:
            payment.status = Payment.FAILED
            payment.save(update_fields=["status", "updated_at"])
            log.warning("sslcommerz init failed tran_id=%s err=%s", payment.tran_id, e)
            return Response({"detail": "Could not start the payment. Please try again."}, status=502)
        payment.session_key = session["session_key"][:100]
        payment.save(update_fields=["session_key", "updated_at"])
        return Response({"tran_id": payment.tran_id, "gateway_url": session["gateway_url"]}, status=201)


class IPNView(APIView):
    """Server-to-server Instant Payment Notification from SSLCommerz (form POST).

    Never trusts the posted status: every notification is re-checked with the validator API. Idempotent.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = []

    def post(self, request):
        if not sslcommerz.configured():
            return Response({"detail": "Payments are not configured."}, status=503)
        tran_id = str(request.data.get("tran_id", ""))[:40]
        val_id = str(request.data.get("val_id", ""))[:100]
        posted = str(request.data.get("status", "")).upper()
        if not tran_id:
            return Response({"detail": "tran_id required"}, status=400)
        if posted in ("FAILED", "CANCELLED", "UNATTEMPTED", "EXPIRED") or not val_id:
            Payment.objects.filter(tran_id=tran_id, status=Payment.PENDING).update(
                status=Payment.CANCELLED if posted == "CANCELLED" else Payment.FAILED)
            return Response({"status": "noted"})
        try:
            p = process_validation(tran_id, val_id)
        except sslcommerz.SSLCommerzError as e:
            log.warning("ipn validation error tran_id=%s err=%s", tran_id, e)
            return Response({"detail": "validation unavailable"}, status=502)  # SSLCommerz retries the IPN
        if p is None:
            return Response({"detail": "unknown transaction"}, status=404)
        return Response({"status": p.status})


class ReturnView(APIView):
    """Browser lands here (POST from SSLCommerz) after checkout → validate if possible → redirect to the SPA."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, result):
        if result not in ("success", "fail", "cancel"):
            return Response(status=404)
        tran_id = str(request.data.get("tran_id", ""))[:40]
        val_id = str(request.data.get("val_id", ""))[:100]
        status = result
        if result == "success" and tran_id and val_id and sslcommerz.configured():
            try:
                p = process_validation(tran_id, val_id)
                status = p.status if p else "failed"
            except sslcommerz.SSLCommerzError:
                status = "pending"  # IPN will settle it
        q = urlencode({"status": status, "tran_id": tran_id})
        return HttpResponseRedirect(f"{settings.SITE_URL.rstrip('/')}/premium/result?{q}")

    get = post


class PaymentStatusView(APIView):
    def get(self, request, tran_id):
        p = Payment.objects.filter(tran_id=tran_id, user=request.user).first()
        if not p:
            return Response({"detail": "Not found."}, status=404)
        return Response({"tran_id": p.tran_id, "plan": p.plan, "amount": str(p.amount), "currency": p.currency,
                         "status": p.status, "paid_at": p.paid_at})

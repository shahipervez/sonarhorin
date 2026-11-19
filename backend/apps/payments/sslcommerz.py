"""Minimal SSLCommerz v4 client (session init + order validation).

Docs: https://developer.sslcommerz.com/doc/v4/
  * Session:    POST {base}/gwprocess/v4/api.php                         → {status, GatewayPageURL, sessionkey}
  * Validation: GET  {base}/validator/api/validationserverAPI.php?val_id → {status: VALID|VALIDATED|INVALID_TRANSACTION…}
"""
import logging
from decimal import Decimal, InvalidOperation

import requests
from django.conf import settings

log = logging.getLogger("apps.payments")
TIMEOUT = 15


class SSLCommerzError(Exception):
    pass


def configured() -> bool:
    return bool(settings.SSLCZ_STORE_ID and settings.SSLCZ_STORE_PASS)


def _base():
    return settings.SSLCZ_API_BASE.rstrip("/")


def init_session(payment, *, customer: dict, product_name: str, urls: dict) -> dict:
    """Start a hosted-checkout session. Returns {'gateway_url', 'session_key'}."""
    data = {
        "store_id": settings.SSLCZ_STORE_ID,
        "store_passwd": settings.SSLCZ_STORE_PASS,
        "total_amount": f"{payment.amount:.2f}",
        "currency": payment.currency,
        "tran_id": payment.tran_id,
        "success_url": urls["success"],
        "fail_url": urls["fail"],
        "cancel_url": urls["cancel"],
        "ipn_url": urls["ipn"],
        "cus_name": customer.get("name") or "Customer",
        "cus_email": customer.get("email") or "customer@example.com",
        "cus_phone": customer.get("phone") or "01700000000",
        "cus_add1": customer.get("address") or "Dhaka",
        "cus_city": customer.get("city") or "Dhaka",
        "cus_country": "Bangladesh",
        "shipping_method": "NO",
        "num_of_item": 1,
        "product_name": product_name,
        "product_category": "subscription",
        "product_profile": "non-physical-goods",
        "value_a": payment.plan,  # echoed back in IPN/validation
    }
    try:
        r = requests.post(f"{_base()}/gwprocess/v4/api.php", data=data, timeout=TIMEOUT)
        body = r.json()
    except (requests.RequestException, ValueError) as e:
        raise SSLCommerzError(f"session init failed: {e.__class__.__name__}") from e
    if str(body.get("status", "")).upper() != "SUCCESS" or not body.get("GatewayPageURL"):
        raise SSLCommerzError(body.get("failedreason") or "session init rejected")
    return {"gateway_url": body["GatewayPageURL"], "session_key": body.get("sessionkey", "")}


def validate(val_id: str) -> dict:
    """Ask SSLCommerz whether `val_id` is a genuine, successful payment. Returns the validator JSON."""
    params = {"val_id": val_id, "store_id": settings.SSLCZ_STORE_ID, "store_passwd": settings.SSLCZ_STORE_PASS,
              "v": 1, "format": "json"}
    try:
        r = requests.get(f"{_base()}/validator/api/validationserverAPI.php", params=params, timeout=TIMEOUT)
        return r.json()
    except (requests.RequestException, ValueError) as e:
        raise SSLCommerzError(f"validation failed: {e.__class__.__name__}") from e


def amounts_match(a, b) -> bool:
    try:
        return Decimal(str(a)).quantize(Decimal("0.01")) == Decimal(str(b)).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError):
        return False

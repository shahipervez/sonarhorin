import logging

import django.dispatch
from django.db import transaction
from django.utils import timezone

from . import sslcommerz
from .models import Payment

log = logging.getLogger("apps.payments")

# Sent once per payment, after it is validated with SSLCommerz. kwargs: payment.
# Whoever owns premium features connects a receiver to grant access.
payment_validated = django.dispatch.Signal()


def process_validation(tran_id: str, val_id: str) -> Payment | None:
    """Validate (val_id) with SSLCommerz and mark the payment paid. Safe to call many times (IPN + browser return)."""
    payment = Payment.objects.filter(tran_id=tran_id).first()
    if payment is None:
        log.warning("ipn for unknown tran_id=%s", tran_id)
        return None
    if payment.status == Payment.VALID or not val_id:
        return payment

    result = sslcommerz.validate(val_id)
    status = str(result.get("status", "")).upper()
    ok = (
        status in ("VALID", "VALIDATED")
        and result.get("tran_id") == payment.tran_id
        and sslcommerz.amounts_match(result.get("amount"), payment.amount)
        and str(result.get("currency", payment.currency)).upper() == payment.currency
    )
    with transaction.atomic():
        p = Payment.objects.select_for_update().get(pk=payment.pk)
        if p.status == Payment.VALID:  # another request won the race
            return p
        p.validation_response = {k: result.get(k) for k in (
            "status", "tran_id", "val_id", "amount", "currency", "store_amount", "bank_tran_id", "card_type",
            "card_brand", "risk_level", "risk_title", "tran_date")}
        if ok and str(result.get("risk_level", "0")) == "1":
            log.warning("payment %s flagged high-risk by SSLCommerz — left pending for manual review", p.tran_id)
            p.save(update_fields=["validation_response", "updated_at"])
            return p
        if ok:
            p.status = Payment.VALID
            p.val_id = val_id
            p.bank_tran_id = str(result.get("bank_tran_id") or "")[:100]
            p.card_type = str(result.get("card_type") or "")[:60]
            p.paid_at = timezone.now()
            p.save()
            transaction.on_commit(lambda: payment_validated.send(sender=Payment, payment=p))
            log.info("payment validated tran_id=%s", p.tran_id)
        else:
            if p.status == Payment.PENDING:
                p.status = Payment.FAILED
            p.save()
            log.warning("payment validation rejected tran_id=%s status=%s", p.tran_id, status)
    return p

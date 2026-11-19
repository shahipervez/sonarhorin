from decimal import Decimal
from unittest import mock

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import User

from .models import Payment
from .services import payment_validated

CFG = dict(SSLCZ_STORE_ID="testbox", SSLCZ_STORE_PASS="qwerty", SSLCZ_API_BASE="https://sandbox.sslcommerz.com")


def _resp(body):
    r = mock.Mock(status_code=200)
    r.json.return_value = body
    return r


@override_settings(**CFG)
class SSLCommerzTests(TestCase):
    def setUp(self):
        self.u = User.objects.create_user(email="pay@test.com", password="Strong-pass-2026", full_name="Pay", phone="01711111111")
        self.c = APIClient()
        self.c.force_authenticate(self.u)

    def make_payment(self):
        return Payment.objects.create(user=self.u, plan="premium_monthly", amount=Decimal("199.00"))

    def valid_body(self, p, **over):
        return {"status": "VALID", "tran_id": p.tran_id, "val_id": "V123", "amount": "199.00", "currency": "BDT",
                "bank_tran_id": "B1", "card_type": "BKASH-BKash", "risk_level": "0", **over}

    def test_init_session(self):
        with mock.patch("apps.payments.sslcommerz.requests.post",
                        return_value=_resp({"status": "SUCCESS", "GatewayPageURL": "https://sandbox.sslcommerz.com/pay/x", "sessionkey": "S1"})) as post:
            r = self.c.post("/api/payments/init/", {"plan": "premium_monthly"}, format="json")
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(r.data["gateway_url"], "https://sandbox.sslcommerz.com/pay/x")
        sent = post.call_args.kwargs["data"]
        self.assertEqual(sent["total_amount"], "199.00")
        self.assertTrue(sent["ipn_url"].endswith("/api/payments/ipn/"))
        self.assertEqual(Payment.objects.get().session_key, "S1")

    def test_ipn_validates_and_is_idempotent(self):
        p = self.make_payment()
        received = []
        handler = lambda sender, payment, **kw: received.append(payment.tran_id)  # noqa: E731
        payment_validated.connect(handler)
        self.addCleanup(payment_validated.disconnect, handler)
        with mock.patch("apps.payments.sslcommerz.requests.get", return_value=_resp(self.valid_body(p))) as get:
            with self.captureOnCommitCallbacks(execute=True):
                r = APIClient().post("/api/payments/ipn/", {"tran_id": p.tran_id, "val_id": "V123", "status": "VALID"})
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.data["status"], "valid")
            self.assertEqual(get.call_args.kwargs["params"]["val_id"], "V123")
            # second IPN: no re-validation, no second signal
            with self.captureOnCommitCallbacks(execute=True):
                r2 = APIClient().post("/api/payments/ipn/", {"tran_id": p.tran_id, "val_id": "V123", "status": "VALID"})
            self.assertEqual(r2.data["status"], "valid")
            self.assertEqual(get.call_count, 1)
        p.refresh_from_db()
        self.assertEqual(p.status, Payment.VALID)
        self.assertEqual(p.bank_tran_id, "B1")
        self.assertEqual(received, [p.tran_id])

    def test_ipn_amount_mismatch_rejected(self):
        p = self.make_payment()
        with mock.patch("apps.payments.sslcommerz.requests.get", return_value=_resp(self.valid_body(p, amount="1.00"))):
            r = APIClient().post("/api/payments/ipn/", {"tran_id": p.tran_id, "val_id": "V123", "status": "VALID"})
        self.assertEqual(r.data["status"], "failed")

    def test_ipn_invalid_transaction_rejected(self):
        p = self.make_payment()
        with mock.patch("apps.payments.sslcommerz.requests.get", return_value=_resp({"status": "INVALID_TRANSACTION"})):
            APIClient().post("/api/payments/ipn/", {"tran_id": p.tran_id, "val_id": "FAKE", "status": "VALID"})
        p.refresh_from_db()
        self.assertEqual(p.status, Payment.FAILED)

    def test_ipn_unknown_tran(self):
        with mock.patch("apps.payments.sslcommerz.requests.get") as get:
            r = APIClient().post("/api/payments/ipn/", {"tran_id": "NOPE", "val_id": "V", "status": "VALID"})
        self.assertEqual(r.status_code, 404)
        get.assert_not_called()

    def test_return_redirects_to_spa(self):
        p = self.make_payment()
        with mock.patch("apps.payments.sslcommerz.requests.get", return_value=_resp(self.valid_body(p))):
            r = APIClient().post("/api/payments/return/success/", {"tran_id": p.tran_id, "val_id": "V123"})
        self.assertEqual(r.status_code, 302)
        self.assertIn("status=valid", r["Location"])

    @override_settings(SSLCZ_STORE_ID="", SSLCZ_STORE_PASS="")
    def test_not_configured(self):
        self.assertEqual(self.c.post("/api/payments/init/", {"plan": "premium_monthly"}, format="json").status_code, 503)
        self.assertFalse(APIClient().get("/api/payments/plans/").data["enabled"])

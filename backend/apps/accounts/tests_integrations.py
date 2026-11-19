"""Google sign-in, phone OTP and SMS backend tests. All network calls are mocked."""
from datetime import timedelta
from unittest import mock

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from . import otp as otp_mod
from .models import PhoneOTP, User
from .phone import InvalidPhone, normalize_bd_phone
from .sms import SMSError, get_backend


class PhoneNormaliseTests(TestCase):
    def test_accepts_bd_forms(self):
        for raw in ["01712345678", "+8801712345678", "8801712345678", "+880 1712-345678", "০১৭১২৩৪৫৬৭৮", "008801712345678"]:
            self.assertEqual(normalize_bd_phone(raw), "+8801712345678", raw)

    def test_rejects_others(self):
        for raw in ["", "0171234567", "01212345678", "+14155550100", "017123456789", "abc"]:
            with self.assertRaises(InvalidPhone, msg=raw):
                normalize_bd_phone(raw)


GOOGLE_CLAIMS = {"iss": "https://accounts.google.com", "sub": "1234567890", "email": "Rahim@Gmail.com",
                 "email_verified": True, "name": "Rahim Uddin", "aud": "test-client.apps.googleusercontent.com"}


@override_settings(GOOGLE_CLIENT_IDS=["test-client.apps.googleusercontent.com"])
class GoogleLoginTests(TestCase):
    def setUp(self):
        cache.clear()
        self.c = APIClient()

    def post(self, claims=GOOGLE_CLAIMS, side_effect=None):
        with mock.patch("google.oauth2.id_token.verify_oauth2_token", return_value=dict(claims), side_effect=side_effect) as m:
            r = self.c.post("/api/auth/google/", {"credential": "x.y.z"}, format="json")
        return r, m

    def test_creates_user_and_returns_session(self):
        r, m = self.post()
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(m.call_args.kwargs["audience"], "test-client.apps.googleusercontent.com")
        self.assertIn("access", r.data)
        self.assertEqual(r.data["user"]["email"], "rahim@gmail.com")
        self.assertNotIn("refresh", r.data)  # refresh token only in the HttpOnly cookie
        self.assertTrue(r.cookies["sh_refresh"]["httponly"])
        u = User.objects.get(email="rahim@gmail.com")
        self.assertEqual(u.google_sub, "1234567890")
        self.assertFalse(u.has_usable_password())

    def test_links_existing_email(self):
        u = User.objects.create_user(email="rahim@gmail.com", password="Strong-pass-2026", full_name="R")
        r, _ = self.post()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["user"]["id"], u.id)
        u.refresh_from_db()
        self.assertEqual(u.google_sub, "1234567890")
        self.assertEqual(User.objects.count(), 1)

    def test_unverified_email_rejected(self):
        r, _ = self.post({**GOOGLE_CLAIMS, "email_verified": False})
        self.assertEqual(r.status_code, 401)
        self.assertFalse(User.objects.exists())

    def test_bad_token_rejected(self):
        r, _ = self.post(side_effect=ValueError("Token expired"))
        self.assertEqual(r.status_code, 401)

    def test_wrong_issuer_rejected(self):
        r, _ = self.post({**GOOGLE_CLAIMS, "iss": "evil.example.com"})
        self.assertEqual(r.status_code, 401)

    @override_settings(GOOGLE_CLIENT_IDS=[])
    def test_not_configured(self):
        r = self.c.post("/api/auth/google/", {"credential": "x"}, format="json")
        self.assertEqual(r.status_code, 503)


@override_settings(SMS_BACKEND="console", OTP_PHONE_RATE="100/hour", OTP_IP_RATE="100/hour", OTP_VERIFY_IP_RATE="100/hour")
class OTPFlowTests(TestCase):
    PHONE = "01812345678"

    def setUp(self):
        cache.clear()
        self.c = APIClient()
        self.sent = []
        p = mock.patch("apps.accounts.integrations.send_sms", side_effect=lambda ph, msg: self.sent.append((ph, msg)))
        p.start()
        self.addCleanup(p.stop)
        # Make the code predictable for the test.
        g = mock.patch.object(otp_mod, "generate_code", return_value="482916")
        g.start()
        self.addCleanup(g.stop)

    def request(self, phone=PHONE):
        return self.c.post("/api/auth/otp/request/", {"phone": phone}, format="json")

    def verify(self, code="482916", phone=PHONE, **extra):
        return self.c.post("/api/auth/otp/verify/", {"phone": phone, "code": code, **extra}, format="json")

    def test_full_flow_creates_account(self):
        r = self.request("+880 1812-345678")
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(self.sent[0][0], "+8801812345678")
        self.assertIn("482916", self.sent[0][1])
        row = PhoneOTP.objects.get()
        self.assertNotIn("482916", row.code_hash)  # stored hashed
        r = self.verify(full_name="Karim")
        self.assertEqual(r.status_code, 201, r.data)
        self.assertIn("access", r.data)
        self.assertNotIn("refresh", r.data)
        self.assertTrue(r.cookies["sh_refresh"]["httponly"])
        u = User.objects.get(phone_e164="+8801812345678")
        self.assertTrue(u.phone_verified)
        self.assertEqual(u.full_name, "Karim")
        # code is single-use
        self.assertEqual(self.verify().status_code, 400)

    def test_logs_into_existing_legacy_user(self):
        u = User.objects.create_user(email="x@test.com", password="Strong-pass-2026", full_name="X", phone="01812345678")
        self.request()
        r = self.verify()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["user"]["id"], u.id)
        u.refresh_from_db()
        self.assertEqual(u.phone_e164, "+8801812345678")

    def test_invalid_phone(self):
        self.assertEqual(self.request("12345").status_code, 400)

    def test_resend_cooldown(self):
        self.assertEqual(self.request().status_code, 200)
        r = self.request()
        self.assertEqual(r.status_code, 429)
        self.assertIn("Retry-After", r)
        PhoneOTP.objects.update(created_at=timezone.now() - timedelta(seconds=61))
        self.assertEqual(self.request().status_code, 200)
        # only the newest code stays valid
        self.assertEqual(PhoneOTP.objects.filter(used_at__isnull=True).count(), 1)

    def test_expiry(self):
        self.request()
        PhoneOTP.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
        r = self.verify()
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.data["code"], "expired")

    def test_max_attempts(self):
        self.request()
        for i in range(4):
            r = self.verify("000000")
            self.assertEqual(r.status_code, 400)
            self.assertEqual(r.data["attempts_left"], 4 - i)
        self.assertEqual(self.verify("000000").status_code, 429)
        # even the right code is refused once locked
        r = self.verify()
        self.assertEqual(r.status_code, 429)
        self.assertFalse(User.objects.exists())

    @override_settings(OTP_ALLOW_SIGNUP=False)
    def test_signup_disabled(self):
        self.request()
        self.assertEqual(self.verify().status_code, 404)

    def test_sms_failure_returns_503_and_no_cooldown(self):
        with mock.patch("apps.accounts.integrations.send_sms", side_effect=SMSError("down")):
            self.assertEqual(self.request().status_code, 503)
        self.assertFalse(PhoneOTP.objects.exists())

    @override_settings(OTP_PHONE_RATE="2/hour")
    def test_per_phone_throttle(self):
        self.request()
        PhoneOTP.objects.update(created_at=timezone.now() - timedelta(seconds=61))
        self.request()
        PhoneOTP.objects.update(created_at=timezone.now() - timedelta(seconds=61))
        self.assertEqual(self.request().status_code, 429)
        self.assertEqual(self.request("01912345678").status_code, 200)  # other number unaffected

    @override_settings(OTP_IP_RATE="2/hour")
    def test_per_ip_throttle(self):
        self.request("01712345671")
        self.request("01712345672")
        self.assertEqual(self.request("01712345673").status_code, 429)


class SMSBackendTests(TestCase):
    @override_settings(SMS_BACKEND="bulksmsbd", SMS_API_KEY="k", SMS_SENDER_ID="8809000000000", SMS_API_URL="")
    def test_bulksmsbd_success_and_failure(self):
        with mock.patch("apps.accounts.sms.requests.post") as post:
            post.return_value.status_code = 200
            post.return_value.json.return_value = {"response_code": 202}
            get_backend().send("+8801712345678", "hi")
            self.assertEqual(post.call_args.kwargs["data"]["number"], "8801712345678")
            post.return_value.json.return_value = {"response_code": 1007, "error_message": "Balance Insufficient"}
            with self.assertRaises(SMSError):
                get_backend().send("+8801712345678", "hi")

    @override_settings(SMS_BACKEND="alphasms", SMS_API_KEY="", SMS_API_URL="")
    def test_unconfigured_backend_raises(self):
        with self.assertRaises(SMSError):
            get_backend().send("+8801712345678", "hi")

    @override_settings(SMS_BACKEND="sslwireless", SMS_API_KEY="t", SMS_SENDER_ID="SONARHORIN", SMS_API_URL="")
    def test_sslwireless(self):
        with mock.patch("apps.accounts.sms.requests.post") as post:
            post.return_value.status_code = 200
            post.return_value.json.return_value = {"status": "SUCCESS", "status_code": 200}
            get_backend().send("+8801712345678", "hi")
            self.assertEqual(post.call_args.kwargs["json"]["msisdn"], "8801712345678")

    @override_settings(SMS_BACKEND="nope")
    def test_unknown_backend(self):
        with self.assertRaises(SMSError):
            get_backend()

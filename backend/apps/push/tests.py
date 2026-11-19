from unittest import mock

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import User

from .models import PushSubscription
from .services import send_push

SUB = {"endpoint": "https://fcm.googleapis.com/fcm/send/abc123", "keys": {"p256dh": "BNc-key", "auth": "auth-secret"}}
VAPID = dict(VAPID_PUBLIC_KEY="BPublicKey", VAPID_PRIVATE_KEY="private-key", VAPID_SUBJECT="mailto:t@test.com")


@override_settings(**VAPID)
class PushAPITests(TestCase):
    def setUp(self):
        self.u = User.objects.create_user(email="p@test.com", password="Strong-pass-2026", full_name="P")
        self.c = APIClient()
        self.c.force_authenticate(self.u)

    def test_vapid_key(self):
        r = APIClient().get("/api/push/vapid-key/")
        self.assertEqual(r.data, {"enabled": True, "public_key": "BPublicKey"})

    @override_settings(VAPID_PUBLIC_KEY="", VAPID_PRIVATE_KEY="")
    def test_disabled_without_keys(self):
        self.assertEqual(APIClient().get("/api/push/vapid-key/").data["enabled"], False)
        self.assertEqual(self.c.post("/api/push/subscribe/", SUB, format="json").status_code, 503)
        self.assertEqual(send_push(self.u, "t", "b", "/"), 0)

    def test_subscribe_idempotent_and_unsubscribe(self):
        self.assertEqual(self.c.post("/api/push/subscribe/", SUB, format="json").status_code, 201)
        self.assertEqual(self.c.post("/api/push/subscribe/", SUB, format="json").status_code, 200)
        self.assertEqual(PushSubscription.objects.count(), 1)
        r = self.c.delete("/api/push/subscribe/", {"endpoint": SUB["endpoint"]}, format="json")
        self.assertEqual(r.status_code, 204)
        self.assertFalse(PushSubscription.objects.exists())

    def test_requires_auth(self):
        self.assertEqual(APIClient().post("/api/push/subscribe/", SUB, format="json").status_code, 401)

    def test_rejects_non_push_endpoint(self):
        for ep in ["https://evil.example.com/x", "http://fcm.googleapis.com/x", "https://fcm.googleapis.com.evil.io/x"]:
            r = self.c.post("/api/push/subscribe/", {**SUB, "endpoint": ep}, format="json")
            self.assertEqual(r.status_code, 400, ep)

    def test_send_push(self):
        self.c.post("/api/push/subscribe/", SUB, format="json")
        with mock.patch("pywebpush.webpush") as wp:
            self.assertEqual(send_push(self.u, "New job", "Junior dev", "/jobs/1"), 1)
        kw = wp.call_args.kwargs
        self.assertEqual(kw["subscription_info"]["endpoint"], SUB["endpoint"])
        self.assertIn('"url": "/jobs/1"', kw["data"])
        self.assertEqual(kw["vapid_claims"], {"sub": "mailto:t@test.com"})

    def test_gone_subscription_deleted(self):
        from pywebpush import WebPushException

        self.c.post("/api/push/subscribe/", SUB, format="json")
        resp = mock.Mock(status_code=410)
        with mock.patch("pywebpush.webpush", side_effect=WebPushException("gone", response=resp)):
            self.assertEqual(send_push(self.u, "t", "b"), 0)
        self.assertFalse(PushSubscription.objects.exists())

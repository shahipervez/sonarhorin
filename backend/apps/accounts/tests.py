import itertools as _it
_PH = _it.count(1)


def _phone():
    return f"017{next(_PH):08d}"


from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

H = {"HTTP_X_REQUESTED_WITH": "sonarhorin"}


class AuthSecurityTests(TestCase):
    def setUp(self):
        cache.clear()
        self.c = APIClient()
        self.c.post("/api/auth/register/", {"phone": _phone(), "email": "a@test.com", "password": "Strong-pass-2026", "full_name": "A B"}, format="json")
        self.c = APIClient()

    def login(self, pw="Strong-pass-2026"):
        return self.c.post("/api/auth/login/", {"email": "A@test.com", "password": pw}, format="json")

    def test_refresh_token_only_in_httponly_cookie(self):
        r = self.login()
        self.assertEqual(r.status_code, 200)
        self.assertIn("access", r.data)
        self.assertNotIn("refresh", r.data)
        ck = r.cookies["sh_refresh"]
        self.assertTrue(ck["httponly"])
        self.assertEqual(ck["path"], "/api/auth/")

    def test_refresh_requires_header_and_rotates(self):
        self.login()
        self.assertEqual(self.c.post("/api/auth/refresh/").status_code, 403)
        old = self.c.cookies["sh_refresh"].value
        r = self.c.post("/api/auth/refresh/", **H)
        self.assertEqual(r.status_code, 200)
        self.assertIn("access", r.data)
        self.assertNotEqual(self.c.cookies["sh_refresh"].value, old)
        # the old (rotated) token is blacklisted
        replay = APIClient()
        replay.cookies["sh_refresh"] = old
        self.assertEqual(replay.post("/api/auth/refresh/", **H).status_code, 401)

    def test_logout_revokes(self):
        self.login()
        tok = self.c.cookies["sh_refresh"].value
        self.assertEqual(self.c.post("/api/auth/logout/").status_code, 204)
        again = APIClient()
        again.cookies["sh_refresh"] = tok
        self.assertEqual(again.post("/api/auth/refresh/", **H).status_code, 401)

    def test_lockout_after_failures(self):
        for _ in range(5):
            self.assertEqual(self.login("wrong-password").status_code, 401)
        r = self.login()
        self.assertEqual(r.status_code, 429)

    def test_weak_password_rejected(self):
        r = APIClient().post("/api/auth/register/", {"phone": _phone(), "email": "b@test.com", "password": "12345678", "full_name": "B"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_api_security_headers(self):
        r = self.c.get("/api/config/")
        self.assertIn("default-src 'none'", r["Content-Security-Policy"])
        self.assertEqual(r["X-Content-Type-Options"], "nosniff")
        self.assertEqual(r["X-Frame-Options"], "DENY")

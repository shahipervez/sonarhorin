"""Auth API: register / login (phone + email) / refresh / me / logout."""
import unittest

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from .models import User

H = {"HTTP_X_REQUESTED_WITH": "sonarhorin"}
PW = "Strong-pass-2026"


class RegisterTests(TestCase):
    def setUp(self):
        cache.clear()
        self.c = APIClient()

    def reg(self, **kw):
        data = {"phone": "01711111111", "password": PW, "full_name": "Rafi Ahmed", **kw}
        return self.c.post("/api/auth/register/", data, format="json")

    def test_register_returns_user_access_and_cookie(self):
        r = self.reg(email="Rafi@Test.com", major="CSE", track="internship")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["user"]["email"], "rafi@test.com")  # normalised
        self.assertEqual(r.data["user"]["track"], "internship")
        self.assertFalse(r.data["user"]["is_employer"])
        self.assertIn("access", r.data)
        self.assertTrue(r.cookies["sh_refresh"]["httponly"])

    def test_phone_only_signup_gets_placeholder_email(self):
        r = self.reg(phone="+880 1722-222222")
        self.assertEqual(r.status_code, 201)
        self.assertTrue(r.data["user"]["email"].endswith("@phone.sonarhorin.com"))

    def test_phone_required(self):
        r = self.c.post("/api/auth/register/", {"email": "x@test.com", "password": PW, "full_name": "X"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("phone", r.data)

    def test_duplicate_email_and_phone_rejected(self):
        self.assertEqual(self.reg(email="a@test.com").status_code, 201)
        r = self.reg(email="A@test.com", phone="01733333333")
        self.assertEqual(r.status_code, 400)
        self.assertIn("email", r.data)
        r = self.reg(email="b@test.com")
        self.assertEqual(r.status_code, 400)
        self.assertIn("phone", r.data)

    @unittest.expectedFailure  # KNOWN BUG: same number in another format registers twice (accounts/serializers.py:26-33)
    def test_duplicate_phone_in_other_format_rejected(self):
        self.assertEqual(self.reg(phone="01744444444").status_code, 201)
        self.assertEqual(self.reg(phone="+8801744444444", email="z@test.com").status_code, 400)

    def test_cannot_self_promote_to_employer(self):
        r = self.reg(email="sneaky@test.com", is_employer=True, is_staff=True)
        self.assertEqual(r.status_code, 201)
        u = User.objects.get(email="sneaky@test.com")
        self.assertFalse(u.is_employer)
        self.assertFalse(u.is_staff)


class LoginRefreshTests(TestCase):
    def setUp(self):
        cache.clear()
        APIClient().post("/api/auth/register/", {"phone": "01755555555", "email": "lina@test.com", "password": PW, "full_name": "Lina"}, format="json")
        self.c = APIClient()

    def login(self, ident, pw=PW):
        return self.c.post("/api/auth/login/", {"email": ident, "password": pw}, format="json")

    def test_login_by_email_case_insensitive(self):
        r = self.login("  LINA@test.com ")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["user"]["full_name"], "Lina")

    def test_login_by_phone_in_several_formats(self):
        for ident in ("01755555555", "+8801755555555", "8801755555555", "017-5555-5555"):
            cache.clear()
            self.assertEqual(self.login(ident).status_code, 200, ident)

    def test_wrong_password_is_401_with_generic_message(self):
        r = self.login("lina@test.com", "nope-nope-123")
        self.assertEqual(r.status_code, 401)
        self.assertIn("incorrect", r.data["detail"])
        r = self.c.post("/api/auth/login/", {"email": "lina@test.com", "password": "x"}, format="json", HTTP_ACCEPT_LANGUAGE="bn")
        self.assertRegex(r.data["detail"], r"[ঀ-৿]")  # Bangla message (avoid matching য় normalisation)
        self.assertNotIn("incorrect", r.data["detail"])

    def test_unknown_user_same_error_as_wrong_password(self):
        a = self.login("ghost@test.com").data
        b = self.login("lina@test.com", "wrong-wrong-1").data
        self.assertEqual(a, b)

    def test_access_token_authorises_me(self):
        tok = self.login("lina@test.com").data["access"]
        api = APIClient()
        self.assertEqual(api.get("/api/auth/me/").status_code, 401)
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {tok}")
        r = api.get("/api/auth/me/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["email"], "lina@test.com")

    def test_garbage_token_401(self):
        api = APIClient()
        api.credentials(HTTP_AUTHORIZATION="Bearer not.a.jwt")
        self.assertEqual(api.get("/api/auth/me/").status_code, 401)

    def test_refresh_without_cookie_is_204(self):
        self.assertEqual(APIClient().post("/api/auth/refresh/", **H).status_code, 204)

    def test_refresh_with_garbage_cookie_401_and_cleared(self):
        c = APIClient()
        c.cookies["sh_refresh"] = "garbage"
        r = c.post("/api/auth/refresh/", **H)
        self.assertEqual(r.status_code, 401)
        self.assertEqual(r.cookies["sh_refresh"].value, "")

    def test_refreshed_access_token_works(self):
        self.login("lina@test.com")
        access = self.c.post("/api/auth/refresh/", **H).data["access"]
        api = APIClient()
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(api.get("/api/auth/me/").data["email"], "lina@test.com")

    def test_me_update_cannot_change_email_or_employer_flag(self):
        tok = self.login("lina@test.com").data["access"]
        api = APIClient()
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {tok}")
        r = api.patch("/api/auth/me/", {"full_name": "Lina K", "email": "evil@test.com", "is_employer": True, "track": "startup"}, format="json")
        self.assertEqual(r.status_code, 200)
        u = User.objects.get(phone="01755555555")
        self.assertEqual((u.full_name, u.email, u.is_employer, u.track), ("Lina K", "lina@test.com", False, "startup"))

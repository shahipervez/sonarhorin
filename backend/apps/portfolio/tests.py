from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.certifications.models import Certificate


class PortfolioTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.u = User.objects.create_user("rimi@x.com", "Pass@12345", full_name="Nusrat Rimi", major="CSE", university="IUBAT",
                                          skills="Python, React", github="https://github.com/rimi")
        Certificate.objects.create(user=self.u, kind="skill_check", title="CSE Skill Check", score=80)
        self.client.force_authenticate(self.u)

    def test_draft_save_publish_public(self):
        r = self.client.get("/api/portfolio/mine/")
        self.assertFalse(r.data["exists"])
        self.assertEqual(r.data["slug"], "nusrat-rimi")
        self.assertIn("Python", r.data["data"]["skills"])
        self.assertEqual(len(r.data["verified"]), 1)
        data = {**r.data["data"], "projects": [{"title": "Bot", "desc": "x", "link": "javascript:alert(1)"}],
                "links": {"github": "github.com/rimi", "website": "<script>"}}
        r = self.client.put("/api/portfolio/mine/", {"slug": "rimi", "template": "developer", "accent": "#123456", "data": data}, format="json")
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data["data"]["projects"][0]["link"], "")  # unsafe link dropped
        self.assertEqual(r.data["data"]["links"]["github"], "https://github.com/rimi")
        self.assertNotIn("website", r.data["data"]["links"])
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/portfolio/u/rimi/").status_code, 404)  # not published yet
        self.client.force_authenticate(self.u)
        self.client.put("/api/portfolio/mine/", {"slug": "rimi", "data": data, "published": True}, format="json")
        self.client.force_authenticate(None)
        r = self.client.get("/api/portfolio/u/rimi/")
        self.assertEqual(r.status_code, 200)
        self.assertNotIn("views", r.data)
        self.assertEqual(r.data["verified"][0]["title"], "CSE Skill Check")

    def test_slug_rules(self):
        other = User.objects.create_user("o@x.com", "Pass@12345", full_name="O")
        self.client.force_authenticate(other)
        self.client.put("/api/portfolio/mine/", {"slug": "taken", "data": {}}, format="json")
        self.client.force_authenticate(self.u)
        for bad in ("taken", "admin", "a", "Bad Slug!"):
            r = self.client.put("/api/portfolio/mine/", {"slug": bad, "data": {}}, format="json")
            self.assertEqual(r.status_code, 400, bad)
        self.assertTrue(self.client.get("/api/portfolio/slug-check/?slug=free-one").data["ok"])

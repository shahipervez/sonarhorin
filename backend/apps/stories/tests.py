"""Success stories API: public list (approved only) + stats, authenticated submission."""
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User

from .models import SuccessStory


def story(**kw):
    d = dict(name="Tania R.", major="BBA", role="MTO", company="Padma Pay", quote="I got hired in five weeks after fixing my CV.",
             status="approved", months_jobless=6, days_to_hire=30, cv_score_before=40, cv_score_after=80)
    d.update(kw)
    return SuccessStory.objects.create(**d)


class StoriesApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.anon = APIClient()

    def test_only_approved_stories_are_public(self):
        story(name="Shown")
        story(name="Pending", status="pending")
        story(name="Rejected", status="rejected")
        r = self.anon.get("/api/stories/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual([s["name"] for s in r.data["stories"]], ["Shown"])
        self.assertEqual(r.data["stats"]["count"], 1)

    def test_filter_by_major(self):
        story(name="BBA one")
        story(name="CSE one", major="CSE")
        self.assertEqual([s["name"] for s in self.anon.get("/api/stories/?major=CSE").data["stories"]], ["CSE one"])

    def test_stats_use_demo_stories_until_real_ones_exist(self):
        story(is_demo=True, days_to_hire=10, cv_score_before=30, cv_score_after=90)
        st = self.anon.get("/api/stories/").data["stats"]
        self.assertTrue(st["sample_only"])
        self.assertEqual((st["avg_days_to_hire"], st["avg_cv_jump"], st["real_count"]), (10, 60, 0))
        story(is_demo=False, days_to_hire=50, cv_score_before=50, cv_score_after=70)
        st = self.anon.get("/api/stories/").data["stats"]
        self.assertFalse(st["sample_only"])
        self.assertEqual((st["avg_days_to_hire"], st["avg_cv_jump"], st["real_count"], st["count"]), (50, 20, 1, 2))

    def test_empty_list(self):
        d = self.anon.get("/api/stories/").data
        self.assertEqual(d["stories"], [])
        self.assertFalse(d["stats"]["sample_only"])

    def test_featured_first(self):
        story(name="Old")
        story(name="Star", featured=True)
        self.assertEqual(self.anon.get("/api/stories/").data["stories"][0]["name"], "Star")

    def test_submit_requires_auth(self):
        self.assertEqual(self.anon.post("/api/stories/", {}, format="json").status_code, 401)
        self.assertEqual(self.anon.get("/api/stories/mine/").status_code, 401)

    def test_submit_flow(self):
        u = User.objects.create_user("hired@test.com", "Strong-pass-2026", full_name="Hired", major="CSE", phone="01900000001")
        c = APIClient()
        c.force_authenticate(u)
        data = {"name": "Hired G.", "role": "Junior Dev", "company": "Nodi Labs", "quote": "Short", "consent": True}
        self.assertEqual(c.post("/api/stories/", data, format="json").status_code, 400)  # quote too short
        data["quote"] = "Sonarhorin's CV check doubled my interview calls in a month."
        self.assertEqual(c.post("/api/stories/", {**data, "consent": False}, format="json").status_code, 400)
        r = c.post("/api/stories/", {**data, "status": "approved", "featured": True}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual((r.data["status"], r.data["featured"], r.data["major"]), ("pending", False, "CSE"))
        self.assertEqual(self.anon.get("/api/stories/").data["stories"], [])  # not public until approved
        self.assertEqual(c.post("/api/stories/", data, format="json").status_code, 409)  # one pending at a time
        mine = c.get("/api/stories/mine/").data
        self.assertEqual(len(mine["stories"]), 1)
        self.assertIn("days_to_hire", mine["journey"])

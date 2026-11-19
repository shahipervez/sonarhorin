from unittest import mock

from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.cv.models import CVAnalysis
from apps.jobs.models import Company, Job

from .salary import normalise_city, title_keywords


@override_settings(ANTHROPIC_API_KEY="")
class MatchScoreTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user("m@example.com", "Strong-pass-2026", full_name="Mitu", major="CSE",
                                            skills="Python, Git")
        co = Company.objects.create(name="Padma Tech")
        cls.job = Job.objects.create(company=co, title="Junior Software Engineer", majors="CSE",
                                     description="Build Django services with Docker.", requirements=["Python", "Git", "REST APIs"])

    def setUp(self):
        cache.clear()
        self.c = APIClient()
        self.c.force_authenticate(self.user)

    def url(self):
        return f"/api/jobs/{self.job.id}/match/"

    def test_auth_required(self):
        self.assertEqual(APIClient().get(self.url()).status_code, 401)
        self.assertEqual(self.c.get("/api/jobs/999999/match/").status_code, 404)

    def test_profile_only_score(self):
        r = self.c.get(self.url())
        self.assertEqual(r.status_code, 200)
        self.assertEqual(set(r.data), {"score", "matched", "missing", "tips", "breakdown", "cv_id", "source", "cached"})
        self.assertIn("python", r.data["matched"])
        self.assertIn("git", r.data["matched"])
        self.assertIn("docker", r.data["missing"])
        self.assertIn("django", r.data["missing"])
        self.assertTrue(0 <= r.data["score"] <= 100)
        self.assertTrue(any("Upload your CV" in t for t in r.data["tips"]))
        self.assertEqual(r.data["source"], "rules")

    def test_cv_raises_score_and_cache_is_per_cv(self):
        before = self.c.get(self.url()).data
        self.assertFalse(before["cached"])
        self.assertTrue(self.c.get(self.url()).data["cached"])
        cv = CVAnalysis.objects.create(user=self.user, file="cvs/x.txt", original_name="cv.txt", major="CSE", score=85,
                                       extracted_text="Skills: Python, Django, Docker, REST API, Git",
                                       report={"keywords": {"found": ["python", "django", "docker"]}})
        after = self.c.get(self.url()).data
        self.assertFalse(after["cached"])  # new CV version -> new cache key
        self.assertEqual(after["cv_id"], cv.id)
        self.assertEqual(after["missing"], [])
        self.assertGreater(after["score"], before["score"])

    def test_major_mismatch_lowers_score(self):
        bba = User.objects.create_user("b@example.com", "Strong-pass-2026", full_name="B", major="BBA", skills="Python, Git")
        self.c.force_authenticate(bba)
        r = self.c.get(self.url()).data
        self.assertEqual(r["breakdown"]["major_fit"], 0)
        self.assertTrue(any("CSE" in t for t in r["tips"]))

    @override_settings(ANTHROPIC_API_KEY="test-key")
    def test_ai_enrichment_is_bounded(self):
        with mock.patch("apps.core.ai.complete_json", return_value={"tips": ["Ship a Dockerised Django demo."], "adjust": 99}):
            base = self.c.get(self.url()).data
        self.assertEqual(base["source"], "ai")
        self.assertEqual(base["tips"][0], "Ship a Dockerised Django demo.")
        cache.clear()
        with mock.patch("apps.core.ai.complete_json", return_value=None):  # AI down -> rule result
            fallback = self.c.get(self.url()).data
        self.assertEqual(fallback["source"], "rules")
        self.assertEqual(base["score"], min(100, fallback["score"] + 10))


class SalaryInsightTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        co = Company.objects.create(name="Acme")
        for title, loc, lo, hi, jt in [
            ("Junior Software Engineer", "Dhaka (Banani)", 30000, 38000, "full_time"),
            ("Software Engineer Trainee", "Gulshan, Dhaka", 25000, 30000, "trainee"),
            ("Software Engineer", "Dhaka", 35000, 45000, "full_time"),
            ("Software Engineer", "Chittagong", 28000, None, "full_time"),
            ("Software Engineer Intern", "Remote", 10000, 15000, "internship"),
            ("Software Engineer", "Sylhet", None, None, "full_time"),  # no salary -> ignored
            ("Accountant", "Dhaka", 20000, 25000, "full_time"),
        ]:
            Job.objects.create(company=co, title=title, location=loc, salary_min=lo, salary_max=hi, job_type=jt)

    def get(self, **params):
        r = APIClient().get("/api/insights/salary/", params)
        self.assertEqual(r.status_code, 200)
        return r.data

    def test_normalisers(self):
        self.assertEqual(title_keywords("Junior Software Engineer (Backend)"), ["software", "engineer", "backend"])
        self.assertEqual(title_keywords("Trainee"), ["trainee"])
        self.assertEqual(normalise_city("Hybrid · Dhaka"), "dhaka")
        self.assertEqual(normalise_city("Chittagong"), "chattogram")

    def test_title_and_city_stats(self):
        d = self.get(title="software engineer", location="Dhaka")
        self.assertEqual(d["scope"], "title+city")
        self.assertEqual(d["stats"], {"min": 25000, "median": 34000, "max": 45000, "count": 3})
        self.assertNotIn("message", d)

    def test_falls_back_to_all_cities(self):
        d = self.get(title="software engineer", location="Chattogram")
        self.assertEqual(d["scope"], "title (all cities)")
        self.assertEqual(d["stats"]["count"], 5)
        self.assertIn("showing all cities", d["message"])

    def test_type_filter_and_insufficient_data(self):
        d = self.get(title="software engineer", type="internship")
        self.assertFalse(d["enough_data"])
        self.assertIsNone(d["stats"])
        self.assertEqual(d["count"], 1)
        self.assertIn("Not enough salary data", d["message"])
        d = self.get(title="software engineer", type="job")
        self.assertEqual(d["stats"]["count"], 4)

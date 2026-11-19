from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User

from .models import Company, Job, JobApplication


class CandidateStageTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user("o@example.com", "Strong-pass-2026", full_name="Owner")
        cls.other = User.objects.create_user("x@example.com", "Strong-pass-2026", full_name="Other")
        job = Job.objects.create(company=Company.objects.create(name="Acme"), title="QA")
        cls.app = JobApplication.objects.create(user=cls.owner, job=job, channel="portal", status="needs_action")

    def setUp(self):
        cache.clear()
        self.c = APIClient()
        self.c.force_authenticate(self.owner)
        self.url = f"/api/jobs/applications/{self.app.id}/stage/"

    def test_owner_moves_stage_and_clears_it(self):
        r = self.c.patch(self.url, {"candidate_stage": "interview"}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.data["candidate_stage"], "interview")
        self.app.refresh_from_db()
        self.assertEqual((self.app.candidate_stage, self.app.status), ("interview", "needs_action"))  # status untouched
        self.assertEqual(self.c.get("/api/jobs/applications/").data["applications"][0]["candidate_stage"], "interview")
        r = self.c.patch(self.url, {"candidate_stage": None}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertIsNone(r.data["candidate_stage"])

    def test_validation_and_permissions(self):
        self.assertEqual(self.c.patch(self.url, {"candidate_stage": "ceo"}, format="json").status_code, 400)
        self.assertEqual(self.c.patch(self.url, {}, format="json").status_code, 400)
        other = APIClient()
        other.force_authenticate(self.other)
        self.assertEqual(other.patch(self.url, {"candidate_stage": "offer"}, format="json").status_code, 404)
        self.assertEqual(APIClient().patch(self.url, {"candidate_stage": "offer"}, format="json").status_code, 401)
        # existing POST actions on the same prefix still work
        self.assertEqual(self.c.post(f"/api/jobs/applications/{self.app.id}/done/").status_code, 200)

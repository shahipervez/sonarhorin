"""API tests for the jobs board: list filters, detail, apply flow, tracker actions and employer permissions.

Self-contained fixtures (no `seed`), so the expectations below are exact.
"""
import itertools
import unittest
from datetime import timedelta
from unittest import mock

from django.core.cache import cache
from django.core.files.base import ContentFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.cv.models import CVAnalysis

from .models import Company, Job, JobApplication

_n = itertools.count(1)


def make_user(**kw):
    i = next(_n)
    kw.setdefault("full_name", f"User {i}")
    kw.setdefault("phone", f"0181{i:07d}")
    return User.objects.create_user(kw.pop("email", f"u{i}@test.com"), "Strong-pass-2026", **kw)


def give_cv(user):
    cv = CVAnalysis(user=user, original_name="cv.txt", major="CSE", score=82, extracted_text="Python SQL")
    cv.file.save("cv.txt", ContentFile(b"Python, SQL, Git"), save=False)
    cv.save()
    return cv


@override_settings(ANTHROPIC_API_KEY="", EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class JobsApiBase(TestCase):
    @classmethod
    def setUpTestData(cls):
        today = timezone.localdate()
        cls.partner = Company.objects.create(name="Partner Co", is_partner=True, apply_email="hr@partner.example")
        cls.mailco = Company.objects.create(name="Mail Co", apply_email="jobs@mail.example")
        cls.portal = Company.objects.create(name="Portal Ltd", careers_url="https://portal.example/careers")
        J = Job.objects.create
        cls.j_partner = J(company=cls.partner, title="Junior Python Developer", job_type="full_time", majors="CSE",
                          apply_channel="partner", location="Dhaka", salary_min=30000, description="Django and SQL")
        cls.j_email = J(company=cls.mailco, title="Marketing Trainee", job_type="trainee", majors="BBA",
                        apply_channel="email", location="Chattogram", deadline=today + timedelta(days=10))
        cls.j_portal = J(company=cls.portal, title="Design Intern", job_type="internship", majors="",
                         apply_channel="portal", apply_url="https://portal.example/apply/1", location="Sylhet", remote=True)
        cls.j_part = J(company=cls.mailco, title="Part-time Tutor", job_type="part_time", majors="English",
                       apply_channel="email", location="Khulna")
        # never listed:
        cls.j_senior = J(company=cls.partner, title="Senior Architect", experience_max_years=8, apply_channel="partner")
        cls.j_closed = J(company=cls.partner, title="Expired Role", apply_channel="partner", deadline=today - timedelta(days=1))
        cls.j_inactive = J(company=cls.partner, title="Hidden Role", apply_channel="partner", is_active=False)

    def setUp(self):
        cache.clear()
        self.anon = APIClient()

    def client_for(self, user):
        c = APIClient()
        c.force_authenticate(user)
        return c

    def titles(self, qs=""):
        r = self.anon.get(f"/api/jobs/{qs}")
        self.assertEqual(r.status_code, 200)
        return {j["title"] for j in r.data["jobs"]}


class JobListTests(JobsApiBase):
    OPEN = {"Junior Python Developer", "Marketing Trainee", "Design Intern", "Part-time Tutor"}

    def test_public_list_shows_only_open_fresher_jobs(self):
        r = self.anon.get("/api/jobs/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual({j["title"] for j in r.data["jobs"]}, self.OPEN)
        self.assertEqual(r.data["count"], 4)
        self.assertEqual(r.data["by_channel"], {"partner": 1, "email": 2, "portal": 1})

    def test_list_payload_shape(self):
        j = next(j for j in self.anon.get("/api/jobs/").data["jobs"] if j["title"] == "Junior Python Developer")
        for k in ("id", "company", "channel", "job_type_label", "major_list", "deadline", "my_status", "salary_min"):
            self.assertIn(k, j)
        self.assertEqual(j["company"]["name"], "Partner Co")
        self.assertEqual(j["channel"], "partner")
        self.assertEqual(j["major_list"], ["CSE"])
        self.assertIsNone(j["my_status"])

    def test_filter_by_each_type(self):
        self.assertEqual(self.titles("?type=full_time"), {"Junior Python Developer"})
        self.assertEqual(self.titles("?type=trainee"), {"Marketing Trainee"})
        self.assertEqual(self.titles("?type=internship"), {"Design Intern"})
        self.assertEqual(self.titles("?type=part_time"), {"Part-time Tutor"})
        self.assertEqual(self.titles("?type=bogus"), set())

    def test_filter_by_major_includes_any_major_jobs(self):
        self.assertEqual(self.titles("?major=CSE"), {"Junior Python Developer", "Design Intern"})
        self.assertEqual(self.titles("?major=BBA"), {"Marketing Trainee", "Design Intern"})

    def test_filter_by_location_includes_remote(self):
        self.assertEqual(self.titles("?location=chattogram"), {"Marketing Trainee", "Design Intern"})

    def test_search_q_matches_title_company_description(self):
        self.assertEqual(self.titles("?q=python"), {"Junior Python Developer"})
        self.assertEqual(self.titles("?q=portal ltd"), {"Design Intern"})
        self.assertEqual(self.titles("?q=django"), {"Junior Python Developer"})
        self.assertEqual(self.titles("?q=%20%20"), self.OPEN)  # blank search = everything

    def test_filter_by_channel(self):
        self.assertEqual(self.titles("?channel=email"), {"Marketing Trainee", "Part-time Tutor"})
        self.assertEqual(self.titles("?channel=portal"), {"Design Intern"})

    def test_combined_filters(self):
        self.assertEqual(self.titles("?type=trainee&major=BBA&location=Chattogram"), {"Marketing Trainee"})
        self.assertEqual(self.titles("?type=full_time&major=BBA"), set())

    def test_my_status_for_logged_in_user(self):
        u = make_user()
        JobApplication.objects.create(user=u, job=self.j_portal, channel="portal", status="needs_action")
        jobs = {j["title"]: j for j in self.client_for(u).get("/api/jobs/").data["jobs"]}
        self.assertEqual(jobs["Design Intern"]["my_status"], "needs_action")
        self.assertIsNone(jobs["Marketing Trainee"]["my_status"])

    def test_partner_channel_falls_back_to_email_when_company_not_partner(self):
        self.mailco.is_partner = False
        j = Job.objects.create(company=self.mailco, title="Fallback", apply_channel="partner")
        self.assertEqual(self.anon.get(f"/api/jobs/{j.id}/").data["channel"], "email")
        nobox = Company.objects.create(name="No Inbox")
        j2 = Job.objects.create(company=nobox, title="Fallback 2", apply_channel="email")
        self.assertEqual(self.anon.get(f"/api/jobs/{j2.id}/").data["channel"], "portal")


class JobDetailTests(JobsApiBase):
    def test_detail_is_public(self):
        r = self.anon.get(f"/api/jobs/{self.j_email.id}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["title"], "Marketing Trainee")
        self.assertEqual(r.data["channel"], "email")
        self.assertEqual(r.data["job_type"], "trainee")

    def test_detail_404(self):
        self.assertEqual(self.anon.get("/api/jobs/999999/").status_code, 404)

    def test_closed_job_detail_still_readable(self):
        # Deep links to an expired job keep working (the UI shows it as closed).
        self.assertEqual(self.anon.get(f"/api/jobs/{self.j_closed.id}/").status_code, 200)


class ApplyFlowTests(JobsApiBase):
    def setUp(self):
        super().setUp()
        self.user = make_user(email="fresh@test.com", major="CSE", skills="Python, SQL")
        self.c = self.client_for(self.user)

    def apply(self, job, **data):
        return self.c.post(f"/api/jobs/{job.id}/apply/", data, format="json")

    def test_apply_requires_auth(self):
        self.assertEqual(self.anon.post(f"/api/jobs/{self.j_partner.id}/apply/").status_code, 401)

    def test_apply_unknown_job_404(self):
        self.assertEqual(self.c.post("/api/jobs/999999/apply/").status_code, 404)

    def test_partner_apply_needs_cv(self):
        r = self.apply(self.j_partner)
        self.assertEqual(r.status_code, 400)
        self.assertIn("CV", r.data["detail"])
        self.assertFalse(JobApplication.objects.exists())

    def test_portal_apply_works_without_cv_and_returns_packet(self):
        r = self.apply(self.j_portal)
        self.assertEqual(r.status_code, 201)
        self.assertEqual((r.data["channel"], r.data["status"]), ("portal", "needs_action"))
        self.assertEqual(r.data["packet"]["apply_url"], "https://portal.example/apply/1")
        self.assertEqual(r.data["packet"]["email"], "fresh@test.com")

    def test_partner_apply_with_cv(self):
        give_cv(self.user)
        r = self.apply(self.j_partner, cover_letter="Dear Hiring Team, I love Django.")
        self.assertEqual(r.status_code, 201)
        self.assertEqual((r.data["channel"], r.data["status"]), ("partner", "submitted"))
        self.assertEqual(r.data["cover_letter"], "Dear Hiring Team, I love Django.")
        self.assertEqual(r.data["job"]["my_status"], None)  # serializer context-less → None

    def test_duplicate_apply_rejected(self):
        give_cv(self.user)
        self.assertEqual(self.apply(self.j_partner).status_code, 201)
        r = self.apply(self.j_partner)
        self.assertEqual(r.status_code, 400)
        self.assertIn("already applied", r.data["detail"])
        self.assertEqual(JobApplication.objects.filter(user=self.user, job=self.j_partner).count(), 1)

    def test_cannot_apply_to_closed_or_inactive_job(self):
        give_cv(self.user)
        for j in (self.j_closed, self.j_inactive):
            r = self.apply(j)
            self.assertEqual(r.status_code, 400, j.title)
            self.assertIn("closed", r.data["detail"])

    def test_cover_letter_is_capped(self):
        give_cv(self.user)
        r = self.apply(self.j_partner, cover_letter="x" * 9000)
        self.assertEqual(len(r.data["cover_letter"]), 5000)

    def test_tracker_lists_and_counts(self):
        give_cv(self.user)
        self.apply(self.j_partner)
        self.apply(self.j_portal)
        d = self.c.get("/api/jobs/applications/").data
        self.assertEqual(len(d["applications"]), 2)
        self.assertEqual(d["counts"], {"submitted": 1, "needs_action": 1})

    def test_tracker_actions(self):
        app_id = self.apply(self.j_portal).data["id"]
        self.assertEqual(self.c.post(f"/api/jobs/applications/{app_id}/withdraw/").data["status"], "withdrawn")
        # a withdrawn application can't be marked done or withdrawn again
        self.assertEqual(self.c.post(f"/api/jobs/applications/{app_id}/done/").status_code, 400)
        self.assertEqual(self.c.post(f"/api/jobs/applications/{app_id}/withdraw/").status_code, 400)
        self.assertEqual(self.c.post(f"/api/jobs/applications/{app_id}/explode/").status_code, 400)

    def test_cannot_touch_someone_elses_application(self):
        app_id = self.apply(self.j_portal).data["id"]
        other = self.client_for(make_user())
        self.assertEqual(other.post(f"/api/jobs/applications/{app_id}/withdraw/").status_code, 404)
        self.assertEqual(other.get("/api/jobs/applications/").data["applications"], [])

    def test_my_status_appears_in_list_after_apply(self):
        self.apply(self.j_portal)
        jobs = {j["title"]: j for j in self.c.get("/api/jobs/").data["jobs"]}
        self.assertEqual(jobs["Design Intern"]["my_status"], "needs_action")

    def test_bulk_apply_ignores_junk_ids(self):
        give_cv(self.user)
        r = self.c.post("/api/jobs/apply-bulk/", {"job_ids": [self.j_partner.id, "abc", -1, self.j_portal.id]}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["applied"], 1)


class EmployerPermissionTests(JobsApiBase):
    def setUp(self):
        super().setUp()
        self.cand = make_user(full_name="Candidate One")
        give_cv(self.cand)
        self.client_for(self.cand).post(f"/api/jobs/{self.j_partner.id}/apply/", {}, format="json")
        self.boss = make_user(email="boss@partner.example", is_employer=True)
        self.partner.employer_users.add(self.boss)

    def test_anonymous_gets_401(self):
        self.assertEqual(self.anon.get("/api/jobs/employer/applicants/").status_code, 401)

    def test_employer_sees_own_company_applicants(self):
        rows = self.client_for(self.boss).get("/api/jobs/employer/applicants/").data
        self.assertEqual([r["candidate"] for r in rows], ["Candidate One"])
        self.assertEqual(rows[0]["job"], "Junior Python Developer")

    def test_other_employer_sees_nothing(self):
        rival = make_user(is_employer=True)
        Company.objects.create(name="Rival").employer_users.add(rival)
        self.assertEqual(self.client_for(rival).get("/api/jobs/employer/applicants/").data, [])

    def test_regular_candidate_sees_nothing(self):
        self.assertEqual(self.client_for(self.cand).get("/api/jobs/employer/applicants/").data, [])

    def test_withdrawn_applications_hidden_from_employer(self):
        JobApplication.objects.filter(user=self.cand).update(status="withdrawn")
        self.assertEqual(self.client_for(self.boss).get("/api/jobs/employer/applicants/").data, [])

    def test_auth_required_on_candidate_endpoints(self):
        for method, url in [("get", "/api/jobs/matches/"), ("get", "/api/jobs/applications/"), ("get", "/api/jobs/auto-apply/"),
                            ("post", "/api/jobs/apply-bulk/"), ("post", "/api/jobs/auto-apply/run/"),
                            ("get", f"/api/jobs/{self.j_partner.id}/preview/")]:
            self.assertEqual(getattr(self.anon, method)(url).status_code, 401, url)

    def test_scraper_trigger_requires_staff(self):
        with mock.patch("apps.jobs.scheduler.trigger_immediate_scrape", return_value={"ok": True}) as run:
            r = self.anon.post("/api/jobs/scraper/run/", {}, format="json")
            self.assertIn(r.status_code, (401, 403))
            run.assert_not_called()

    def test_scraper_trigger_bad_limit_falls_back_to_default(self):
        staff = make_user(is_staff=True)
        with mock.patch("apps.jobs.scheduler.trigger_immediate_scrape", return_value={"ok": True}):
            c = self.client_for(staff)
            c.raise_request_exception = False
            self.assertEqual(c.post("/api/jobs/scraper/run/", {"limit": "lots"}, format="json").status_code, 200)

    def test_scraper_status_is_public_read_only(self):
        r = self.anon.get("/api/jobs/scraper/status/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["total_internships"], 1)

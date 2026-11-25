"""Company job-board import, one-click ATS apply and real-logo fetching — all HTTP mocked."""
import io
import itertools
from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from apps.core.tests import STRONG_CV

from . import ats, logos
from .models import Company, Job, JobApplication

_ph = itertools.count(500)

GH_JOBS = {"jobs": [
    {"id": 101, "title": "Junior Support Engineer", "updated_at": "2026-11-20T10:00:00Z", "location": {"name": "Dhaka, Bangladesh"},
     "absolute_url": "https://job-boards.greenhouse.io/acme/jobs/101", "content": "&lt;p&gt;Fresh graduates welcome. 0-1 years experience.&lt;/p&gt;"},
    {"id": 102, "title": "Account Executive", "updated_at": "2026-11-20T10:00:00Z", "location": {"name": "New York"},
     "absolute_url": "https://job-boards.greenhouse.io/acme/jobs/102", "content": "&lt;p&gt;NY office&lt;/p&gt;"},
    {"id": 103, "title": "Senior Engineer", "updated_at": "2026-11-20T10:00:00Z", "location": {"name": "Dhaka"},
     "absolute_url": "https://job-boards.greenhouse.io/acme/jobs/103", "content": "&lt;p&gt;Minimum 5+ years of experience.&lt;/p&gt;"},
]}
LEVER_POSTINGS = [
    {"id": "abc-1", "text": "Software Engineering Intern", "categories": {"location": "Dhaka", "commitment": "Internship"},
     "descriptionPlain": "Learn with our team.", "lists": [{"text": "You have", "content": "<li>Python</li>"}],
     "hostedUrl": "https://jobs.lever.co/acme/abc-1", "applyUrl": "https://jobs.lever.co/acme/abc-1/apply", "workplaceType": "on-site"},
]


def png(px):
    b = io.BytesIO()
    Image.new("RGBA", (px, px), (226, 19, 110, 255)).save(b, "PNG")
    return b.getvalue()


@override_settings(ANTHROPIC_API_KEY="")
class ATSImportTests(TestCase):
    def setUp(self):
        self.gh = Company.objects.create(name="Acme GH", website="", ats="greenhouse", ats_slug="acme", auto_import=True)

    def test_experience_parse(self):
        self.assertEqual(ats.experience_years("Fresh graduates, 0-2 years experience"), 0)
        self.assertEqual(ats.experience_years("Minimum 3+ years of experience in sales"), 3)
        self.assertEqual(ats.experience_years("Founded 25 years ago"), 0)

    def test_greenhouse_import_filters_and_closes(self):
        with mock.patch.object(ats, "http", return_value=(200, GH_JOBS)):
            s = ats.import_company(self.gh)
        self.assertEqual((s["created"], s["skipped"]), (1, 2))  # NY + senior skipped
        job = Job.objects.get(company=self.gh)
        self.assertEqual((job.external_id, job.apply_channel, job.source), ("gh:101", "portal", "import"))
        self.assertIn("Fresh graduates", job.description)
        self.assertIsNone(job.salary_min)  # we never invent salaries
        with mock.patch.object(ats, "http", return_value=(200, {"jobs": []})):
            s = ats.import_company(self.gh)
        self.assertEqual(s["closed"], 1)
        self.assertFalse(Job.objects.get(pk=job.pk).is_active)

    def test_board_error_is_recorded(self):
        with mock.patch.object(ats, "http", return_value=(404, "not found")):
            s = ats.import_company(self.gh)
        self.assertIn("404", s["error"])
        self.gh.refresh_from_db()
        self.assertIn("404", self.gh.import_error)


@override_settings(ANTHROPIC_API_KEY="", EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class OneClickATSApplyTests(TestCase):
    def setUp(self):
        self.co = Company.objects.create(name="Acme Lever", ats="lever", ats_slug="acme", ats_api_key="secret-key")
        with mock.patch.object(ats, "http", return_value=(200, LEVER_POSTINGS)):
            ats.import_company(self.co)
        self.job = Job.objects.get(company=self.co)
        self.c = APIClient()
        r = self.c.post("/api/auth/register/", {"phone": f"017{next(_ph):08d}", "email": "one@click.com", "password": "Strong-pass-2026",
                                                "full_name": "Arif Hasan", "major": "CSE"}, format="json")
        self.c.credentials(HTTP_AUTHORIZATION="Bearer " + r.data["access"])
        f = SimpleUploadedFile("Arif_CV.txt", STRONG_CV.encode(), content_type="text/plain")
        self.assertEqual(self.c.post("/api/cv/analyze/", {"file": f, "major": "CSE"}, format="multipart").status_code, 201)

    def test_imported_job_is_one_click_and_lands_in_lever(self):
        self.assertEqual((self.job.job_type, self.job.effective_channel()), ("internship", "ats"))
        self.assertEqual(self.c.get("/api/jobs/").data["jobs"][0]["channel"], "ats")
        with mock.patch.object(ats, "http", return_value=(200, {"ok": True, "applicationId": "app-9"})) as h:
            r = self.c.post(f"/api/jobs/{self.job.id}/apply/", {}, format="json")
        self.assertIn(r.status_code, (200, 201))
        url, method, body, headers = h.call_args[0]
        self.assertEqual(method, "POST")
        self.assertIn("/v0/postings/acme/abc-1?key=secret-key", url)
        self.assertIn(b'name="resume"; filename="Arif_CV.txt"', body)
        self.assertIn(b"Arif Hasan", body)
        app = JobApplication.objects.get(job=self.job)
        self.assertEqual((app.channel, app.status), ("ats", "submitted"))
        self.assertIsNotNone(app.sent_at)

    def test_ats_refusal_falls_back_to_portal(self):
        with mock.patch.object(ats, "http", return_value=(500, {"ok": False, "error": "boom"})):
            self.c.post(f"/api/jobs/{self.job.id}/apply/", {}, format="json")
        app = JobApplication.objects.get(job=self.job)
        self.assertEqual(app.status, "needs_action")
        self.assertIn("finish on the company page", app.error)

    def test_key_never_exposed(self):
        self.assertNotIn("secret-key", str(self.c.get("/api/jobs/").data))


class RealLogoTests(TestCase):
    def setUp(self):
        self.co = Company.objects.create(name="Logo Co", website="https://logo.example")

    def test_apple_touch_icon_from_own_site(self):
        html = b'<html><head><link rel="icon" href="/fav-16.png" sizes="16x16"><link rel="apple-touch-icon" href="/touch.png" sizes="180x180"></head></html>'
        pages = {"https://logo.example": (html, "text/html"), "https://logo.example/touch.png": (png(180), "image/png")}
        ok = logos.fetch_real_logo(self.co, fetch=lambda u: pages[u])
        self.assertTrue(ok)
        self.co.refresh_from_db()
        self.assertEqual(self.co.logo_source, "https://logo.example/touch.png")
        self.assertTrue(self.co.logo.name.endswith(".png"))

    def test_tiny_or_missing_icons_mean_no_logo(self):
        def fetch(u):
            if u == "https://logo.example":
                return b"<html></html>", "text/html"
            return png(16), "image/png"  # favicon.ico / google: too small to show
        self.assertFalse(logos.fetch_real_logo(self.co, fetch=fetch))
        self.co.refresh_from_db()
        self.assertFalse(self.co.logo)

    def test_api_never_returns_drawn_logo_paths(self):
        Job.objects.create(company=self.co, title="Trainee")
        d = APIClient().get("/api/jobs/").data["jobs"][0]["company"]
        self.assertEqual(d["logo"], "")

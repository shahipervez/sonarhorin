import itertools as _it
_PH = _it.count(1)


def _phone():
    return f"017{next(_PH):08d}"


import io
import json
import os
import tempfile

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.core.tests import STRONG_CV

from .models import Company, Job, JobApplication
from .services import postings_from_html, posting_to_fields

CAREERS_HTML = """<html><head>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[
 {"@type":"JobPosting","title":"Graduate Trainee Engineer","identifier":{"value":"GT-26"},
  "description":"<p>Fresh graduates welcome. Send your CV to <b>talent@acme-bd.example</b></p>",
  "hiringOrganization":{"name":"Acme BD"},"jobLocation":{"address":{"addressLocality":"Chattogram"}},
  "employmentType":"FULL_TIME","validThrough":"2099-12-31","baseSalary":{"value":{"minValue":30000,"maxValue":36000}}},
 {"@type":"JobPosting","title":"Senior Backend Engineer","description":"Minimum 5 years experience required.",
  "hiringOrganization":{"name":"Acme BD"},"url":"https://acme-bd.example/jobs/sbe","identifier":"SBE-1"}
]}</script></head><body></body></html>"""


@override_settings(ANTHROPIC_API_KEY="", EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class JobsTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed", stdout=io.StringIO())

    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.c = APIClient()
        r = self.c.post("/api/auth/register/", {"phone": _phone(), "email": "fresh@test.com", "password": "Strong-pass-2026", "full_name": "Fresh Grad",
                                                "major": "CSE", "skills": "Python, SQL, Git", "phone": "+880 1712 345678"}, format="json")
        self.c.credentials(HTTP_AUTHORIZATION="Bearer " + r.data["access"])

    def upload_cv(self):
        f = SimpleUploadedFile("Fresh_CV.txt", STRONG_CV.encode(), content_type="text/plain")
        self.assertEqual(self.c.post("/api/cv/analyze/", {"file": f, "major": "CSE"}, format="multipart").status_code, 201)

    def job(self, title):
        return Job.objects.get(title=title)

    def test_list_and_channels(self):
        d = APIClient().get("/api/jobs/?major=CSE").data
        self.assertGreater(d["count"], 3)
        self.assertTrue(all(v >= 1 for v in d["by_channel"].values()) or d["by_channel"]["portal"] == 0)
        self.assertEqual(set(j["channel"] for j in APIClient().get("/api/jobs/").data["jobs"]), {"partner", "email", "portal"})

    def test_apply_needs_cv(self):
        r = self.c.post(f"/api/jobs/{self.job('Junior Software Engineer').id}/apply/", {}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("CV", r.data["detail"])

    def test_three_channels(self):
        self.upload_cv()
        # partner → lands with employer instantly
        p = self.c.post(f"/api/jobs/{self.job('Junior Software Engineer').id}/apply/", {}, format="json")
        self.assertEqual((p.status_code, p.data["status"], p.data["channel"]), (201, "submitted", "partner"))
        # email → real email to HR with the CV attached, reply-to the candidate
        e = self.c.post(f"/api/jobs/{self.job('Trainee ML Engineer').id}/apply/", {"cover_letter": "Dear Hiring Team,\nCustom letter.\nFresh Grad"}, format="json")
        self.assertEqual(e.data["status"], "sent")
        self.assertEqual(len(mail.outbox), 1)
        m = mail.outbox[0]
        self.assertEqual(m.to, ["careers@shapla-systems.example"])
        self.assertEqual(m.reply_to, ["fresh@test.com"])
        self.assertEqual(m.attachments[0][0], "Fresh_CV.txt")
        self.assertIn("Custom letter", m.body)
        # portal → assisted: packet + needs_action, then the user marks it done
        g = self.c.post(f"/api/jobs/{self.job('Graduate Engineer Trainee — Electrical').id}/apply/", {}, format="json")
        self.assertEqual(g.data["status"], "needs_action")
        self.assertEqual(g.data["packet"]["email"], "fresh@test.com")
        self.assertTrue(g.data["packet"]["apply_url"].startswith("https://"))
        done = self.c.post(f"/api/jobs/applications/{g.data['id']}/done/")
        self.assertEqual(done.data["status"], "done")
        # no duplicates
        self.assertEqual(self.c.post(f"/api/jobs/{self.job('Junior Software Engineer').id}/apply/", {}, format="json").status_code, 400)
        tracker = self.c.get("/api/jobs/applications/").data
        self.assertEqual(len(tracker["applications"]), 3)

    def test_preview_letter(self):
        self.upload_cv()
        r = self.c.get(f"/api/jobs/{self.job('Trainee ML Engineer').id}/preview/").data
        self.assertEqual(r["channel"], "email")
        self.assertIn("Trainee ML Engineer", r["cover_letter"])
        self.assertIn("Python", r["cover_letter"])
        self.assertEqual(r["cv"]["name"], "Fresh_CV.txt")

    def test_bulk_apply_skips_portals(self):
        self.upload_cv()
        ids = [self.job("Junior Software Engineer").id, self.job("Trainee ML Engineer").id, self.job("Graduate Engineer Trainee — Electrical").id]
        r = self.c.post("/api/jobs/apply-bulk/", {"job_ids": ids}, format="json").data
        self.assertEqual(r["applied"], 2)
        self.assertFalse([x for x in r["results"] if x["job_id"] == ids[2]][0]["ok"])

    def test_auto_apply_daily_cap(self):
        self.upload_cv()
        self.assertEqual(self.c.post("/api/jobs/auto-apply/run/").status_code, 400)  # off by default
        self.c.put("/api/jobs/auto-apply/", {"enabled": True, "max_per_day": 2, "channels": "partner,email,portal"}, format="json")
        s = self.c.get("/api/jobs/auto-apply/").data
        self.assertEqual(s["channels"], "partner,email")  # portals can never be auto-submitted
        r = self.c.post("/api/jobs/auto-apply/run/").data
        self.assertEqual(r["applied"], 2)
        self.assertEqual(self.c.post("/api/jobs/auto-apply/run/").data["applied"], 0)  # cap reached today
        apps = JobApplication.objects.filter(user__email="fresh@test.com")
        self.assertTrue(all(a.auto and a.channel in ("partner", "email") for a in apps))
        out = io.StringIO()
        call_command("run_auto_apply", stdout=out)
        self.assertIn("Auto-apply done", out.getvalue())

    def test_matches_follow_major(self):
        self.upload_cv()
        d = self.c.get("/api/jobs/matches/").data
        titles = [j["title"] for j in d["jobs"]]
        self.assertIn("Junior Software Engineer", titles)
        self.assertNotIn("QC Officer Trainee", titles)  # pharmacy job
        self.assertTrue(d["has_cv"])

    def test_importer(self):
        posts = list(postings_from_html(CAREERS_HTML))
        self.assertEqual(len(posts), 2)
        fr, sr = posting_to_fields(posts[0]), posting_to_fields(posts[1])
        self.assertTrue(fr["fresher"]); self.assertFalse(sr["fresher"])
        self.assertEqual(fr["apply_email"], "talent@acme-bd.example")
        self.assertEqual((fr["salary_min"], fr["location"], fr["job_type"]), (30000, "Chattogram", "trainee"))
        with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as fh:
            fh.write(CAREERS_HTML)
        try:
            out = io.StringIO()
            call_command("import_jobs", company="Acme BD", file=fh.name, stdout=out)
            call_command("import_jobs", company="Acme BD", file=fh.name, stdout=io.StringIO())  # idempotent
        finally:
            os.unlink(fh.name)
        jobs = Job.objects.filter(company__name="Acme BD")
        self.assertEqual(jobs.count(), 1)
        self.assertEqual(jobs[0].effective_channel(), "email")
        self.assertIn("Imported 1 new", out.getvalue())

    def test_employer_sees_partner_applicants(self):
        self.upload_cv()
        self.c.post(f"/api/jobs/{self.job('Management Trainee Officer').id}/apply/", {}, format="json")
        from apps.accounts.models import User
        boss = User.objects.create_user("hr@padma.example", "Strong-pass-2026", full_name="HR", is_employer=True)
        Company.objects.get(name="Padma Pay (demo)").employer_users.add(boss)
        ec = APIClient(); ec.force_authenticate(boss)
        rows = ec.get("/api/jobs/employer/applicants/").data
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["candidate"], "Fresh Grad")

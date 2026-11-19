from datetime import timedelta
from unittest import mock

from django.core import mail
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.jobs.models import Company, Job

from . import channels, services
from .models import AlertDelivery, JobAlert


def make_job(company, **kw):
    d = dict(title="Junior Python Developer", location="Dhaka (Banani)", job_type="full_time", majors="CSE",
             salary_min=30000, salary_max=38000, description="Django and REST APIs.", requirements=["Python", "Git"])
    d.update(kw)
    return Job.objects.create(company=company, **d)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", ANTHROPIC_API_KEY="")
class AlertMatchingTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user("a@example.com", "Strong-pass-2026", full_name="Asha")
        cls.co = Company.objects.create(name="Padma Tech")

    def alert(self, **kw):
        return JobAlert(user=self.user, name="Python jobs", **kw)

    def test_keyword_type_location_salary_major(self):
        job = make_job(self.co)
        self.assertTrue(services.match_alert(self.alert(), job))
        self.assertTrue(services.match_alert(self.alert(keywords="python, java"), job))
        self.assertFalse(services.match_alert(self.alert(keywords="pharmacy"), job))
        self.assertFalse(services.match_alert(self.alert(keywords="java"), job))  # not a substring hit on "javascript"-free text
        self.assertTrue(services.match_alert(self.alert(job_type="job"), job))
        self.assertFalse(services.match_alert(self.alert(job_type="internship"), job))
        self.assertTrue(services.match_alert(self.alert(location="dhaka"), job))
        self.assertFalse(services.match_alert(self.alert(location="Sylhet"), job))
        self.assertTrue(services.match_alert(self.alert(min_salary=35000), job))
        self.assertFalse(services.match_alert(self.alert(min_salary=50000), job))
        self.assertTrue(services.match_alert(self.alert(majors="cse,eee"), job))
        self.assertFalse(services.match_alert(self.alert(majors="BBA"), job))

    def test_remote_unknown_salary_open_to_all_majors_and_closed(self):
        remote = make_job(self.co, title="Remote intern", location="Remote", remote=True, job_type="internship",
                          salary_min=None, salary_max=None, majors="")
        self.assertTrue(services.match_alert(self.alert(location="Dhaka", remote_ok=True), remote))
        self.assertFalse(services.match_alert(self.alert(location="Dhaka", remote_ok=False), remote))
        self.assertTrue(services.match_alert(self.alert(min_salary=50000, majors="BBA"), remote))
        closed = make_job(self.co, title="Old", deadline=timezone.localdate() - timedelta(days=1))
        self.assertFalse(services.match_alert(self.alert(), closed))
        senior = make_job(self.co, title="Senior", experience_max_years=5)
        self.assertFalse(services.match_alert(self.alert(), senior))

    def test_signal_queues_instant_and_dedupes(self):
        a = JobAlert.objects.create(user=self.user, name="py", keywords="python", frequency="instant", email=True, webpush=True)
        JobAlert.objects.create(user=self.user, name="daily", keywords="python", frequency="daily")
        with self.captureOnCommitCallbacks(execute=True):
            job = make_job(self.co)
        self.assertEqual(AlertDelivery.objects.filter(alert=a, job=job).count(), 2)  # email + webpush, not the daily one
        self.assertEqual(services.queue_instant(job), 0)  # idempotent
        with self.captureOnCommitCallbacks(execute=True):
            job.title = "Edited"
            job.save()  # updates don't re-queue
        self.assertEqual(AlertDelivery.objects.count(), 2)

        stats = services.send_pending()
        self.assertEqual(stats, {"sent": 1, "failed": 0, "skipped": 1})  # webpush is a stub -> skipped
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("নতুন চাকরি", mail.outbox[0].subject)
        self.assertIn("Edited — Padma Tech", mail.outbox[0].body)
        self.assertEqual(services.send_pending(), {"sent": 0, "failed": 0, "skipped": 0})
        self.assertEqual(len(mail.outbox), 1)
        a.refresh_from_db()
        self.assertIsNotNone(a.last_sent_at)

    def test_daily_digest_command(self):
        JobAlert.objects.create(user=self.user, name="daily", keywords="python", frequency="daily")
        make_job(self.co)
        make_job(self.co, title="Python Intern", job_type="internship")
        make_job(self.co, title="Accountant", description="", requirements=[])
        call_command("send_job_alerts", stdout=mock.MagicMock())
        self.assertEqual(len(mail.outbox), 1)  # one digest with both python jobs
        self.assertIn("Python Intern", mail.outbox[0].body)
        self.assertEqual(AlertDelivery.objects.filter(status="sent").count(), 2)
        call_command("send_job_alerts", stdout=mock.MagicMock())  # not due again yet, nothing resent
        self.assertEqual(len(mail.outbox), 1)

    @override_settings(TELEGRAM_BOT_TOKEN="123:abc")
    def test_telegram_channel_posts_to_bot_api(self):
        a = JobAlert.objects.create(user=self.user, name="tg", frequency="instant", email=False, telegram=True, telegram_chat_id="42")
        job = make_job(self.co)
        services.queue_instant(job)
        with mock.patch("apps.alerts.channels.requests.post") as post:
            post.return_value.status_code = 200
            stats = services.send_pending()
        self.assertEqual(stats["sent"], 1)
        url = post.call_args.args[0]
        self.assertEqual(url, "https://api.telegram.org/bot123:abc/sendMessage")
        self.assertEqual(post.call_args.kwargs["json"]["chat_id"], "42")
        self.assertTrue(AlertDelivery.objects.get(alert=a).status == "sent")

    @override_settings(TELEGRAM_BOT_TOKEN="")
    def test_telegram_skipped_without_token_and_failures_retry(self):
        JobAlert.objects.create(user=self.user, name="tg", frequency="instant", email=False, telegram=True, telegram_chat_id="42")
        services.queue_instant(make_job(self.co))
        self.assertEqual(services.send_pending()["skipped"], 1)

        b = JobAlert.objects.create(user=self.user, name="mail", frequency="instant")
        services.queue_instant(make_job(self.co, title="Python 2"))
        with mock.patch.object(channels.EmailChannel, "send", return_value=channels.Result(ok=False, error="smtp down")):
            self.assertEqual(services.send_pending()["failed"], 1)
        d = AlertDelivery.objects.get(alert=b)
        self.assertEqual((d.status, d.attempts), ("failed", 1))
        self.assertEqual(services.send_pending()["sent"], 1)  # retried on next run


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", ANTHROPIC_API_KEY="")
class AlertApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.u1 = User.objects.create_user("u1@example.com", "Strong-pass-2026", full_name="One")
        cls.u2 = User.objects.create_user("u2@example.com", "Strong-pass-2026", full_name="Two")
        make_job(Company.objects.create(name="Acme"))

    def setUp(self):
        cache.clear()
        self.c = APIClient()
        self.c.force_authenticate(self.u1)

    def test_auth_required(self):
        self.assertEqual(APIClient().get("/api/alerts/").status_code, 401)

    def test_crud_own_alerts_only(self):
        r = self.c.post("/api/alerts/", {"name": "Python Dhaka", "keywords": "python", "location": "Dhaka", "frequency": "instant"}, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        aid = r.data["id"]
        self.assertEqual(JobAlert.objects.get(pk=aid).user, self.u1)
        self.assertEqual(len(self.c.get("/api/alerts/").data), 1)
        r = self.c.patch(f"/api/alerts/{aid}/", {"min_salary": 25000}, format="json")
        self.assertEqual((r.status_code, r.data["min_salary"]), (200, 25000))

        other = APIClient()
        other.force_authenticate(self.u2)
        self.assertEqual(other.get("/api/alerts/").data, [])
        self.assertEqual(other.get(f"/api/alerts/{aid}/").status_code, 404)
        self.assertEqual(other.patch(f"/api/alerts/{aid}/", {"name": "x"}, format="json").status_code, 404)
        self.assertEqual(other.delete(f"/api/alerts/{aid}/").status_code, 404)
        self.assertEqual(other.post(f"/api/alerts/{aid}/test/").status_code, 404)

        self.assertEqual(self.c.delete(f"/api/alerts/{aid}/").status_code, 204)
        self.assertFalse(JobAlert.objects.exists())

    def test_user_field_cannot_be_spoofed_and_telegram_needs_chat_id(self):
        r = self.c.post("/api/alerts/", {"name": "x", "user": self.u2.id}, format="json")
        self.assertEqual(JobAlert.objects.get(pk=r.data["id"]).user, self.u1)
        r = self.c.post("/api/alerts/", {"name": "tg", "telegram": True}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("telegram_chat_id", r.data)

    def test_test_endpoint_sends_email(self):
        aid = self.c.post("/api/alerts/", {"name": "py", "keywords": "python"}, format="json").data["id"]
        r = self.c.post(f"/api/alerts/{aid}/test/")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data["channels"]["email"]["ok"])
        self.assertEqual(r.data["matched_jobs"], 1)
        self.assertIn("[TEST]", mail.outbox[0].subject)
        self.assertFalse(AlertDelivery.objects.exists())  # tests don't consume deliveries

import itertools as _it
_PH = _it.count(1)


def _phone():
    return f"017{next(_PH):08d}"


"""End-to-end API tests for every Sonarhorin feature.  Run:  python manage.py test"""
import io
from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.assessments.models import EfficiencySession, EfficiencyTest, Question
from apps.certifications.models import Certificate
from apps.interviews.models import InterviewSession

STRONG_CV = """Rahim Uddin
rahim.uddin@gmail.com | +880 1712345678 | linkedin.com/in/rahimuddin | github.com/rahim
Summary: Fresh CSE graduate aiming for a Junior Software Engineer role.
Skills: Python, Django, React, JavaScript, SQL, PostgreSQL, Git, Docker, REST API, Data Structures, Algorithms, Linux
Projects
- Built a Django attendance app used by 120 students; reduced manual work by 70%.
- Developed a React dashboard and deployed it on AWS, serving 500 users.
- Designed a machine learning model that improved accuracy by 12%.
Experience
Software Engineer Intern, Robi — Implemented REST API endpoints, automated tests, optimized queries (3x faster).
Education
BSc in CSE, IUBAT — CGPA 3.62 / 4.00 (2026)
Certifications: AWS Cloud Practitioner, Coursera Machine Learning
Achievements: Won 2nd place in a national hackathon; led a team of 4.
Activities: Volunteer, IT Society — organized coding workshops for 80 students.
""" + "Additional detail about coursework, teamwork, communication and problem solving. " * 25

WEAK_CV = """Karim
Career Objective: To work in a challenging and dynamic environment. I am hardworking and a team player.
Father's Name: X. Mother's Name: Y. Religion: Islam. Marital Status: Single. Blood group: B+.
I am responsible for many things. I like computers.
"""


@override_settings(ANTHROPIC_API_KEY="")
class SonarhorinFlowTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed", stdout=io.StringIO())

    def setUp(self):
        from django.core.cache import cache
        cache.clear()  # throttles keep counts in the cache
        self.c = APIClient()
        r = self.c.post("/api/auth/register/", {"phone": _phone(), "email": "Fresher@Test.com", "password": "Strong-pass-2026",
                                                "full_name": "Test Fresher", "major": "CSE"}, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        self.c.credentials(HTTP_AUTHORIZATION="Bearer " + r.data["access"])

    # ---- auth & config
    def test_login_and_config(self):
        r = APIClient().post("/api/auth/login/", {"email": "fresher@test.com", "password": "Strong-pass-2026"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["user"]["major"], "CSE")
        cfg = APIClient().get("/api/config/").data
        self.assertIn("discord_url", cfg)

    # ---- CV → profile auto-fill at sign-up
    def test_parse_cv_autofill(self):
        f = SimpleUploadedFile("cv.txt", STRONG_CV.encode(), content_type="text/plain")
        r = APIClient().post("/api/auth/parse-cv/", {"file": f}, format="multipart")
        self.assertEqual(r.status_code, 200, r.content)
        fl = r.data["fields"]
        self.assertEqual(fl["full_name"], "Rahim Uddin")
        self.assertEqual(fl["email"], "rahim.uddin@gmail.com")
        self.assertEqual(fl["major"], "CSE")
        self.assertEqual(fl["university"], "IUBAT")
        self.assertEqual(fl["graduation_year"], 2026)
        self.assertIn("Django", fl["skills"])
        self.assertNotIn("Java", fl["skills"])
        tiny = SimpleUploadedFile("cv.txt", b"just a name", content_type="text/plain")
        self.assertEqual(APIClient().post("/api/auth/parse-cv/", {"file": tiny}, format="multipart").status_code, 422)

    # ---- success stories
    def test_success_stories(self):
        pub = APIClient().get("/api/stories/").data
        self.assertTrue(pub["stats"]["sample_only"])
        self.assertTrue(all(st["is_demo"] for st in pub["stories"]))
        self.assertEqual(len(APIClient().get("/api/stories/?major=CSE").data["stories"]), 1)
        # journey is filled from the user's own activity
        self._upload(WEAK_CV, "weak.txt"); self._upload(STRONG_CV)
        bad = self.c.post("/api/stories/", {"name": "T", "role": "x", "company": "y", "quote": "short", "consent": False}, format="json")
        self.assertEqual(bad.status_code, 400)
        r = self.c.post("/api/stories/", {"name": "Test F.", "role": "Junior SWE", "company": "Acme", "quote": "I sent 40 CVs with no reply, then fixed my CV here and got hired.",
                                          "months_jobless": 6, "applications_before": 40, "consent": True}, format="json")
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(r.data["status"], "pending")
        self.assertLess(r.data["cv_score_before"], r.data["cv_score_after"])
        self.assertFalse(any(st["name"] == "Test F." for st in APIClient().get("/api/stories/").data["stories"]))  # not public until approved
        from apps.stories.models import SuccessStory
        SuccessStory.objects.filter(name="Test F.").update(status="approved")
        data = APIClient().get("/api/stories/").data
        self.assertFalse(data["stats"]["sample_only"])
        self.assertEqual(data["stats"]["real_count"], 1)
        self.assertEqual(self.c.post("/api/stories/", {"name": "Again", "role": "x", "company": "y", "quote": "q" * 40, "consent": True}, format="json").status_code, 201)

    # ---- waitlist (home CTA)
    def test_waitlist(self):
        anon = APIClient()
        self.assertEqual(anon.get("/api/waitlist/").data["count"], 0)
        r1 = anon.post("/api/waitlist/", {"email": "A@x.com", "major": "BBA"}, format="json")
        r2 = anon.post("/api/waitlist/", {"email": "b@x.com"}, format="json")
        again = anon.post("/api/waitlist/", {"email": "a@x.com"}, format="json")
        self.assertEqual((r1.status_code, r1.data["position"]), (201, 1))
        self.assertEqual(r2.data["position"], 2)
        self.assertTrue(again.data["already"])
        self.assertEqual(again.data["position"], 1)
        self.assertEqual(anon.post("/api/waitlist/", {"email": "nope"}, format="json").status_code, 400)

    # ---- 1 & 2: CV judge + report
    def _upload(self, text, name="cv.txt"):
        f = SimpleUploadedFile(name, text.encode(), content_type="text/plain")
        return self.c.post("/api/cv/analyze/", {"file": f, "major": "CSE", "target_role": "Junior Software Engineer"},
                           format="multipart")

    def test_cv_strong_vs_weak(self):
        strong = self._upload(STRONG_CV)
        weak = self._upload(WEAK_CV, "weak.txt")
        self.assertEqual(strong.status_code, 201, strong.content)
        self.assertGreater(strong.data["score"], weak.data["score"])
        self.assertLess(strong.data["rejection_probability"], weak.data["rejection_probability"])
        self.assertGreater(weak.data["rejection_probability"], 60)
        titles = " ".join(f["title"] for f in weak.data["report"]["improvements"])
        self.assertIn("personal details", titles)
        self.assertTrue(strong.data["report"]["strengths"])
        pdf = self.c.get(f"/api/cv/analyses/{strong.data['id']}/pdf/")
        self.assertEqual(pdf.status_code, 200)
        self.assertTrue(pdf.content.startswith(b"%PDF"))

    def test_cv_rejects_bad_type(self):
        f = SimpleUploadedFile("cv.exe", b"x")
        self.assertEqual(self.c.post("/api/cv/analyze/", {"file": f}, format="multipart").status_code, 400)

    # ---- 3a: quick test by major
    def test_quick_test_major_and_grading(self):
        r = self.c.post("/api/assessments/quick/start/", {"major": "BBA"}, format="json")
        self.assertEqual(r.status_code, 201)
        qs = r.data["questions"]
        self.assertEqual(len(qs), 10)
        self.assertNotIn("answer_index", qs[0])
        cats = {q["category"] for q in qs}
        self.assertIn("BBA", cats)
        # answer everything correctly by mapping back through the bank
        answers = {}
        for q in qs:
            real = Question.objects.get(id=q["id"])
            answers[str(q["id"])] = q["options"].index(real.options[real.answer_index])
        res = self.c.post(f"/api/assessments/quick/{r.data['attempt_id']}/submit/", {"answers": answers}, format="json")
        self.assertEqual(res.data["percent"], 100)
        self.assertTrue(res.data["passed"])
        self.assertTrue(Certificate.objects.filter(code=res.data["certificate_code"]).exists())
        again = self.c.post(f"/api/assessments/quick/{r.data['attempt_id']}/submit/", {"answers": answers}, format="json")
        self.assertEqual(again.status_code, 409)

    # ---- 3b: AI interviewer (rule engine)
    def test_interview_flow(self):
        r = self.c.post("/api/interviews/start/", {"role": "Junior Software Engineer"}, format="json")
        self.assertEqual(r.status_code, 201)
        sid = r.data["session_id"]
        state, n = r.data, 0
        while not state.get("finished"):
            turn = state["current"]
            ans = ("When our team project had a bug, I first reproduced it, then read the logs and wrote a test. "
                   "As a result we fixed it in 2 days and I learned to debug systematically. The process shares memory "
                   "and threads are lightweight; HTTP request goes to DNS then server response.")
            state = self.c.post(f"/api/interviews/{sid}/answer/", {"turn_id": turn["turn_id"], "answer": ans}, format="json").data
            n += 1
            self.assertIn("evaluation", state)
        self.assertEqual(n, 8)
        self.assertGreater(state["report"]["overall"], 0)
        self.assertEqual(InterviewSession.objects.get(id=sid).status, "completed")

    def test_interview_time_limit(self):
        r = self.c.post("/api/interviews/start/", {}, format="json")
        s = InterviewSession.objects.get(id=r.data["session_id"])
        s.ends_at = timezone.now() - timedelta(seconds=1)
        s.save()
        res = self.c.post(f"/api/interviews/{s.id}/answer/", {"turn_id": r.data["current"]["turn_id"], "answer": "Hello"}, format="json")
        self.assertTrue(res.data["finished"])
        self.assertEqual(res.data["status"], "expired")

    # ---- 4: programs
    def test_programs_and_apply(self):
        allp = APIClient().get("/api/programs/").data
        self.assertEqual({p["kind"] for p in allp}, {"graduate", "internship", "training"})
        training = APIClient().get("/api/programs/?kind=training").data
        pid = training[0]["id"]
        short = self.c.post(f"/api/programs/{pid}/apply/", {"motivation": "pls"}, format="json")
        self.assertEqual(short.status_code, 400)
        ok = self.c.post(f"/api/programs/{pid}/apply/", {"motivation": "I want to become job-ready and build real projects with mentors."}, format="json")
        self.assertEqual(ok.status_code, 201)
        self.assertEqual(self.c.post(f"/api/programs/{pid}/apply/", {"motivation": "x" * 50}, format="json").status_code, 409)
        self.assertEqual(len(self.c.get("/api/programs/mine/").data), 1)
        bba_only = [p for p in allp if p["major_list"] == ["BBA"]][0]
        self.assertEqual(self.c.post(f"/api/programs/{bba_only['id']}/apply/", {"motivation": "x" * 50}, format="json").status_code, 400)

    # ---- 5 & 6: efficiency test (genuine) + certification
    def test_efficiency_test_integrity(self):
        test = EfficiencyTest.objects.get(company_name="")
        r = self.c.post(f"/api/assessments/efficiency/{test.id}/start/")
        self.assertEqual(r.status_code, 201)
        sid = r.data["session_id"]
        # out-of-order answer is rejected
        self.assertEqual(self.c.post(f"/api/assessments/efficiency/sessions/{sid}/answer/", {"question_id": 999999, "choice": 0}, format="json").status_code, 400)
        self.c.post(f"/api/assessments/efficiency/sessions/{sid}/event/", {"kind": "tab_hidden"}, format="json")
        state = r.data
        while True:
            q = state["question"]
            real = Question.objects.get(id=q["id"])
            choice = q["options"].index(real.options[real.answer_index])
            EfficiencySession.objects.filter(id=sid).update(question_served_at=timezone.now() - timedelta(seconds=5))
            state = self.c.post(f"/api/assessments/efficiency/sessions/{sid}/answer/", {"question_id": q["id"], "choice": choice}, format="json").data
            if state.get("finished"):
                break
        res = state["result"]
        self.assertEqual(res["percent"], 100)
        self.assertEqual(res["integrity_score"], 92)
        self.assertTrue(res["passed"])
        # second attempt blocked
        self.assertEqual(self.c.post(f"/api/assessments/efficiency/{test.id}/start/").status_code, 409)
        # public verification works without login
        v = APIClient().get(f"/api/certificates/verify/{res['certificate_code']}/")
        self.assertEqual(v.status_code, 200)
        self.assertEqual(v.data["details"]["integrity_score"], 92)
        cert = Certificate.objects.get(code=res["certificate_code"])
        pdf = self.c.get(f"/api/certificates/{cert.id}/pdf/")
        self.assertTrue(pdf.content.startswith(b"%PDF"))

    def test_efficiency_terminated_after_tab_switches(self):
        test = EfficiencyTest.objects.get(company_name="")
        sid = self.c.post(f"/api/assessments/efficiency/{test.id}/start/").data["session_id"]
        for _ in range(4):
            r = self.c.post(f"/api/assessments/efficiency/sessions/{sid}/event/", {"kind": "tab_hidden"}, format="json")
        self.assertTrue(r.data["terminated"])
        self.assertFalse(r.data["result"]["passed"])

    def test_efficiency_timeout_gives_no_credit(self):
        test = EfficiencyTest.objects.get(company_name="")
        r = self.c.post(f"/api/assessments/efficiency/{test.id}/start/").data
        q = r["question"]
        real = Question.objects.get(id=q["id"])
        EfficiencySession.objects.filter(id=r["session_id"]).update(question_served_at=timezone.now() - timedelta(minutes=5))
        self.c.post(f"/api/assessments/efficiency/sessions/{r['session_id']}/answer/",
                    {"question_id": q["id"], "choice": q["options"].index(real.options[real.answer_index])}, format="json")
        s = EfficiencySession.objects.get(id=r["session_id"])
        self.assertFalse(s.answers[0]["correct"])
        self.assertEqual(s.flags.get("timeout"), 1)

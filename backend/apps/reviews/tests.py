from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from apps.jobs.models import Company

from .models import AUTO_HIDE_REPORTS, CompanyReview
from .sanitize import clean_text

User = get_user_model()
URL = "/api/reviews/companies/{}/"


class ReviewTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Padma Pay")
        cls.u1 = User.objects.create_user("rina@test.com", "Strong-pass-2026", full_name="Rina Akter", university="BUET")
        cls.u2 = User.objects.create_user("tanvir@test.com", "Strong-pass-2026", full_name="Tanvir Hasan")

    def client_for(self, user):
        c = APIClient()
        c.force_authenticate(user)
        return c

    def post(self, user, **data):
        body = {"rating": 4, "review_type": "interview", "pros": "Friendly panel", **data}
        return self.client_for(user).post(URL.format(self.company.slug), body, format="json")

    def test_anonymous_by_default_hides_author(self):
        r = self.post(self.u1, role_title="SWE Intern")
        self.assertEqual(r.status_code, 201, r.data)
        self.assertTrue(r.data["anonymous"])
        d = APIClient().get(URL.format(self.company.slug)).data
        rev = d["reviews"][0]
        self.assertIsNone(rev["author"])
        self.assertNotIn("Rina", str(d))
        self.assertNotIn(str(self.u1.id), str(rev.get("author")))
        self.assertFalse(rev["is_mine"])

    def test_named_review_shows_author(self):
        self.post(self.u1, anonymous=False)
        rev = APIClient().get(URL.format(self.company.slug)).data["reviews"][0]
        self.assertEqual(rev["author"]["name"], "Rina Akter")
        self.assertNotIn("email", rev["author"])

    def test_aggregate(self):
        self.post(self.u1, rating=5, interview_difficulty=4, got_offer=True)
        self.post(self.u2, rating=2, interview_difficulty=2, got_offer=False)
        self.post(self.u2, rating=3, review_type="internship")
        agg = APIClient().get(URL.format(self.company.slug)).data["aggregate"]
        self.assertEqual(agg["count"], 3)
        self.assertAlmostEqual(agg["avg_rating"], 3.33, places=2)
        self.assertEqual(agg["avg_interview_difficulty"], 3.0)
        self.assertEqual(agg["offer_rate"], 0.5)
        self.assertEqual(agg["by_type"], {"interview": 2, "internship": 1, "job": 0})
        self.assertEqual(agg["rating_distribution"]["5"], 1)
        only = APIClient().get(URL.format(self.company.slug), {"type": "internship"}).data["reviews"]
        self.assertEqual(len(only), 1)

    def test_unique_per_company_author_type(self):
        self.assertEqual(self.post(self.u1).status_code, 201)
        r = self.post(self.u1)
        self.assertEqual(r.status_code, 400)
        self.assertIn("already", r.data["detail"])
        self.assertEqual(self.post(self.u1, review_type="job").status_code, 201)
        with self.assertRaises(IntegrityError), transaction.atomic():
            CompanyReview.objects.create(company=self.company, author=self.u1, review_type="job", rating=3)

    def test_validation(self):
        self.assertEqual(self.post(self.u1, rating=6).status_code, 400)
        self.assertEqual(self.post(self.u1, interview_difficulty=0).status_code, 400)
        self.assertEqual(self.post(self.u1, pros="", cons="").status_code, 400)
        self.assertEqual(APIClient().post(URL.format(self.company.slug), {"rating": 4, "pros": "x"}, format="json").status_code, 401)
        self.assertEqual(self.post(self.u1).status_code, 201)
        self.assertEqual(self.client_for(self.u1).post(URL.format("no-such-co"), {"rating": 4, "pros": "x"}, format="json").status_code, 404)

    def test_pii_and_profanity_stripped(self):
        r = self.post(self.u1, pros="Call HR on 01712-345678 or +880 1812 345 678, mail hr@padma.example",
                      cons="ফোন ০১৭১২৩৪৫৬৭৮ — the manager was a bastard", interview_questions="DSA, SQL. wa.me/8801712345678")
        self.assertEqual(r.status_code, 201, r.data)
        txt = " ".join([r.data["pros"], r.data["cons"], r.data["interview_questions"]])
        for leak in ("01712", "345678", "1812", "hr@padma.example", "০১৭১২", "bastard", "wa.me"):
            self.assertNotIn(leak, txt)
        self.assertIn("[phone removed]", r.data["pros"])
        self.assertIn("[email removed]", r.data["pros"])
        self.assertIn("DSA, SQL.", r.data["interview_questions"])

    def test_clean_text_leaves_normal_numbers(self):
        self.assertEqual(clean_text("3 rounds, salary 35000 BDT, CGPA 3.75 in 2025"), "3 rounds, salary 35000 BDT, CGPA 3.75 in 2025")
        self.assertEqual(clean_text("Class assessment"), "Class assessment")  # no false positive on "ass"

    def test_report_dedupes_and_auto_hides(self):
        review_id = self.post(self.u1).data["id"]
        url = f"/api/reviews/{review_id}/report/"
        self.assertEqual(self.client_for(self.u1).post(url, {}).status_code, 400)  # own review
        self.assertEqual(self.client_for(self.u2).post(url, {"reason": "fake"}).status_code, 201)
        self.assertEqual(self.client_for(self.u2).post(url, {}).status_code, 200)  # duplicate ignored
        self.assertEqual(CompanyReview.objects.get(pk=review_id).report_count, 1)
        for i in range(AUTO_HIDE_REPORTS - 1):
            u = User.objects.create_user(f"r{i}@test.com", "Strong-pass-2026", full_name=f"R{i}")
            self.client_for(u).post(url, {})
        self.assertFalse(CompanyReview.objects.get(pk=review_id).is_approved)
        self.assertEqual(APIClient().get(URL.format(self.company.slug)).data["aggregate"]["count"], 0)

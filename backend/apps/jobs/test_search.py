"""Search tests. Written to pass on both SQLite (difflib fallback) and PostgreSQL (FTS + pg_trgm)."""
from django.db import connection
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Company, Job
from .search import expand, search_jobs, tokenize


class SearchTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        nodi = Company.objects.create(name="Nodi Labs", industry="Software")
        brac = Company.objects.create(name="Padma Bank", industry="Banking")
        megh = Company.objects.create(name="Megh Foods", industry="FMCG")
        cls.swe = Job.objects.create(company=nodi, title="Junior Software Engineer", location="Dhaka (Banani)",
                                     description="Build APIs with Django.")
        cls.intern = Job.objects.create(company=nodi, title="Frontend Developer Intern", location="Remote",
                                        job_type="internship", remote=True, description="React and CSS.")
        cls.bank = Job.objects.create(company=brac, title="Management Trainee Officer", location="Chattogram",
                                      job_type="trainee", description="Rotations across retail banking.")
        cls.mkt = Job.objects.create(company=megh, title="Marketing Executive", location="Dhaka",
                                     description="Brand campaigns for snacks.")

    def titles(self, q):
        return [j.title for j in search_jobs(Job.objects.select_related("company"), q)]

    def test_tokenize_keeps_bangla_vowel_signs(self):
        self.assertEqual(tokenize("সফটওয়্যার চাকরি, Dhaka!"), ["সফটওয়্যার", "চাকরি", "dhaka"])

    def test_expand_synonyms_and_stopwords(self):
        groups = expand("সফটওয়্যার jobs in ঢাকা")
        self.assertEqual(len(groups), 2)
        self.assertIn("software", groups[0])
        self.assertIn("dhaka", groups[1])

    def test_exact_and_ranking(self):
        r = self.titles("software engineer")
        self.assertEqual(r[0], "Junior Software Engineer")

    def test_typo_tolerance(self):
        self.assertIn("Junior Software Engineer", self.titles("softwer"))
        self.assertIn("Marketing Executive", self.titles("markting"))
        self.assertEqual(self.titles("softwer enginer")[0], "Junior Software Engineer")

    def test_bangla_synonyms(self):
        self.assertIn("Junior Software Engineer", self.titles("সফটওয়্যার"))
        self.assertEqual(self.titles("ইন্টার্নশিপ"), ["Frontend Developer Intern"])
        self.assertIn("Management Trainee Officer", self.titles("ব্যাংক"))
        self.assertIn("Marketing Executive", self.titles("মার্কেটিং"))
        dhaka = self.titles("ঢাকা চাকরি")
        self.assertIn("Junior Software Engineer", dhaka)
        self.assertNotIn("Management Trainee Officer", dhaka)

    def test_words_are_anded(self):
        self.assertEqual(self.titles("marketing dhaka"), ["Marketing Executive"])
        self.assertEqual(self.titles("marketing chattogram"), [])

    def test_empty_or_stopword_query_is_noop(self):
        self.assertEqual(len(self.titles("")), 4)
        self.assertEqual(len(self.titles("jobs")), 4)

    def test_nonsense_returns_nothing(self):
        self.assertEqual(self.titles("zzqxv"), [])

    def test_job_list_endpoint_uses_search(self):
        d = APIClient().get("/api/jobs/", {"q": "softwer"}).data
        self.assertEqual(d["jobs"][0]["title"], "Junior Software Engineer")
        d = APIClient().get("/api/jobs/", {"q": "ইন্টার্নশিপ"}).data
        self.assertEqual([j["title"] for j in d["jobs"]], ["Frontend Developer Intern"])

    def test_trigram_indexes_only_on_postgres(self):
        with connection.cursor() as cur:
            if connection.vendor == "postgresql":
                cur.execute("SELECT indexname FROM pg_indexes WHERE indexname LIKE '%%_trgm'")
                self.assertEqual({r[0] for r in cur.fetchall()}, {"jobs_job_title_trgm", "jobs_company_name_trgm"})
            else:
                names = {i["name"] if isinstance(i, dict) else i
                         for i in connection.introspection.get_constraints(cur, "jobs_job")}
                self.assertFalse(any(n.endswith("_trgm") for n in names))

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from apps.accounts.models import User

GOOD = dict(
    name="KrishiBondhu", one_liner="KrishiBondhu helps smallholder farmers sell straight to Dhaka restaurants.",
    problem="Farmers in Bogura lose 30% of their price to 3–4 middlemen; a tomato that sells for ৳60 in Dhaka earns the farmer ৳18. Restaurants also can't trace quality.",
    solution="A WhatsApp-first marketplace: farmers list harvest by voice in Bangla, restaurants pre-order, we run one truck route per district.",
    market="Dhaka has ~12,000 restaurants spending about ৳40,000 a month on vegetables — a ৳5,700 crore yearly market.",
    business_model="8% commission on every order plus a ৳1,500 monthly plan for restaurants that want guaranteed delivery.",
    traction="Pilot with 14 farmers and 6 restaurants: 210 orders, ৳3.2 lakh GMV in 6 weeks, 5 of 6 restaurants re-ordered.",
    team="Pulok (CSE, built the app) and a co-founder from a farming family in Bogura who runs supply.",
    ask_amount=1000000, use_of_funds="A second truck, two field agents and 6 months of runway to reach 100 restaurants.",
)


class StartupTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.u = User.objects.create_user("p@x.com", "Pass@12345", full_name="Pulok", track="startup")
        self.client.force_authenticate(self.u)

    def test_pitch_flow(self):
        r = self.client.post("/api/startups/pitches/", {"name": "Idea"}, format="json")
        pid = r.data["id"]
        self.assertLess(r.data["readiness"]["score"], 45)
        self.assertEqual(self.client.post(f"/api/startups/pitches/{pid}/submit/").status_code, 400)
        r = self.client.put(f"/api/startups/pitches/{pid}/", GOOD, format="json")
        self.assertGreaterEqual(r.data["readiness"]["score"], 80)
        bad = SimpleUploadedFile("deck.pdf", b"not a pdf", content_type="application/pdf")
        self.assertEqual(self.client.post(f"/api/startups/pitches/{pid}/deck/", {"file": bad}).status_code, 400)
        deck = SimpleUploadedFile("deck.pdf", b"%PDF-1.4 fake deck", content_type="application/pdf")
        r = self.client.post(f"/api/startups/pitches/{pid}/deck/", {"file": deck})
        self.assertEqual(r.data["readiness"]["score"], 100)
        r = self.client.post(f"/api/startups/pitches/{pid}/submit/")
        self.assertEqual(r.data["status"], "submitted")
        self.assertEqual(self.client.put(f"/api/startups/pitches/{pid}/", {"name": "x"}, format="json").status_code, 400)  # locked
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/startups/funded/").data, [])

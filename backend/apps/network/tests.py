from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.accounts.models import User


class NetworkTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.a = User.objects.create_user("a@x.com", "Pass@12345", full_name="Arif Hasan", major="CSE", university="IUBAT")
        self.b = User.objects.create_user("b@x.com", "Pass@12345", full_name="Bithi Roy", major="CSE", university="IUBAT")
        self.c = User.objects.create_user("c@x.com", "Pass@12345", full_name="Chayan Das", major="BBA", university="NSU")

    def test_connect_chat_flow(self):
        self.client.force_authenticate(self.a)
        people = self.client.get("/api/network/people/").data
        self.assertEqual(people[0]["full_name"], "Bithi Roy")  # same university + major first
        self.assertNotIn("email", people[0])
        self.assertEqual(self.client.post(f"/api/network/dm/{self.b.id}/", {"text": "hi"}).status_code, 403)
        self.assertEqual(self.client.post(f"/api/network/connect/{self.b.id}/").data["state"], "outgoing")
        self.client.force_authenticate(self.b)
        ov = self.client.get("/api/network/").data
        self.assertEqual(len(ov["incoming"]), 1)
        self.client.post(f"/api/network/requests/{ov['incoming'][0]['request_id']}/accept/")
        self.client.post(f"/api/network/dm/{self.a.id}/", {"text": "Hello Arif!"})
        self.client.force_authenticate(self.a)
        ov = self.client.get("/api/network/").data
        self.assertEqual(ov["unread"], 1)
        r = self.client.get(f"/api/network/dm/{self.b.id}/")
        self.assertEqual(r.data["messages"][0]["text"], "Hello Arif!")
        self.assertEqual(self.client.get("/api/network/").data["unread"], 0)
        last = r.data["messages"][-1]["id"]
        self.assertEqual(self.client.get(f"/api/network/dm/{self.b.id}/?after={last}").data["messages"], [])

    def test_rooms(self):
        self.client.force_authenticate(self.c)
        self.assertEqual(self.client.post("/api/network/rooms/bba/", {"text": "Any MTO tips?"}).status_code, 201)
        self.assertEqual(self.client.get("/api/network/rooms/nope/").status_code, 404)
        self.client.force_authenticate(self.a)
        r = self.client.get("/api/network/rooms/bba/")
        self.assertEqual(r.data["messages"][0]["text"], "Any MTO tips?")
        self.assertFalse(r.data["messages"][0]["mine"])

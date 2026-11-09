from django.contrib.auth import get_user_model
from django.db.models import Case, IntegerField, Q, Value, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from .models import ROOMS, Connection, Message

User = get_user_model()


class ChatThrottle(UserRateThrottle):
    scope = "chat"
    rate = "40/min"


def person(u, me=None, state=None):
    return {"id": u.id, "full_name": u.full_name, "initials": "".join(w[0] for w in u.full_name.split()[:2]).upper(),
            "major": u.major, "university": u.university, "graduation_year": u.graduation_year,
            "headline": u.headline, "track": u.track, "state": state}


def state_for(me, other):
    c = Connection.between(me, other)
    if not c:
        return "none"
    if c.status == "accepted":
        return "connected"
    if c.status == "declined":
        return "none" if c.from_user_id == me.id else "declined"
    return "outgoing" if c.from_user_id == me.id else "incoming"


def msg(m, me):
    return {"id": m.id, "text": "Message removed" if m.hidden else m.text, "mine": m.sender_id == me.id, "created_at": m.created_at,
            "sender": {"id": m.sender_id, "full_name": m.sender.full_name, "major": m.sender.major}}


class People(APIView):
    """GET ?q= → people to connect with; same university + major first."""

    def get(self, request):
        me, q = request.user, (request.query_params.get("q") or "").strip()
        qs = User.objects.filter(is_active=True, is_employer=False).exclude(id=me.id)
        if q:
            qs = qs.filter(Q(full_name__icontains=q) | Q(university__icontains=q) | Q(major__iexact=q) | Q(headline__icontains=q))
        qs = qs.annotate(rank=Case(
            When(university__iexact=me.university or "-", major=me.major, then=Value(0)),
            When(university__iexact=me.university or "-", then=Value(1)),
            When(major=me.major, then=Value(2)), default=Value(3), output_field=IntegerField(),
        )).order_by("rank", "-date_joined")[:40]
        return Response([person(u, me, state_for(me, u)) for u in qs])


class Overview(APIView):
    """GET → connections, requests and DM threads (with unread counts)."""

    def get(self, request):
        me = request.user
        cons = Connection.objects.filter(Q(from_user=me) | Q(to_user=me)).select_related("from_user", "to_user")
        friends, incoming, outgoing = [], [], []
        for c in cons:
            other = c.to_user if c.from_user_id == me.id else c.from_user
            if c.status == "accepted":
                friends.append(other)
            elif c.status == "pending":
                (outgoing if c.from_user_id == me.id else incoming).append({"request_id": c.id, "note": c.note, **person(other)})
        threads = []
        for f in friends:
            last = Message.objects.filter(Q(sender=me, recipient=f) | Q(sender=f, recipient=me)).order_by("-id").first()
            unread = Message.objects.filter(sender=f, recipient=me, read_at__isnull=True).count()
            threads.append({**person(f, state="connected"), "last": last.text[:80] if last else "", "last_at": last.created_at if last else None, "unread": unread})
        threads.sort(key=lambda t: (t["last_at"] is None, -(t["last_at"].timestamp() if t["last_at"] else 0)))
        rooms = []
        for slug, (name, desc) in ROOMS.items():
            last = Message.objects.filter(room=slug).order_by("-id").select_related("sender").first()
            rooms.append({"slug": slug, "name": name, "desc": desc, "last": f"{last.sender.full_name.split()[0]}: {last.text[:60]}" if last else "",
                          "mine": slug in ("general", me.major.lower(), "startup" if me.track == "startup" else "interviews")})
        return Response({"connections": len(friends), "threads": threads, "incoming": incoming, "outgoing": outgoing, "rooms": rooms,
                         "unread": sum(t["unread"] for t in threads)})


class Connect(APIView):
    def post(self, request, user_id):
        me, other = request.user, get_object_or_404(User, pk=user_id, is_active=True)
        if other == me:
            return Response({"detail": "That's you 🙂"}, status=400)
        c = Connection.between(me, other)
        if c and c.status == "accepted":
            return Response({"state": "connected"})
        if c and c.from_user_id == other.id and c.status == "pending":
            c.status = "accepted"; c.save(update_fields=["status"])
            return Response({"state": "connected"})
        if c and c.from_user_id == other.id and c.status == "declined":
            return Response({"state": "none"})
        if c:
            c.status, c.note = "pending", (request.data.get("note") or "")[:200]
            c.save(update_fields=["status", "note"])
        else:
            Connection.objects.create(from_user=me, to_user=other, note=(request.data.get("note") or "")[:200])
        return Response({"state": "outgoing"}, status=201)


class Respond(APIView):
    def post(self, request, request_id, action):
        c = get_object_or_404(Connection, pk=request_id, to_user=request.user, status="pending")
        if action not in ("accept", "decline"):
            return Response({"detail": "Unknown action."}, status=400)
        c.status = "accepted" if action == "accept" else "declined"
        c.save(update_fields=["status"])
        return Response({"state": "connected" if action == "accept" else "none"})


class Direct(APIView):
    """GET ?after=<id> → messages with one connection (marks them read). POST {text}."""

    def get_throttles(self):
        return [ChatThrottle()] if self.request.method == "POST" else super().get_throttles()

    def get(self, request, user_id):
        me, other = request.user, get_object_or_404(User, pk=user_id)
        if not Connection.connected(me, other):
            return Response({"detail": "Connect first to chat."}, status=403)
        qs = Message.objects.filter(Q(sender=me, recipient=other) | Q(sender=other, recipient=me)).select_related("sender")
        after = request.query_params.get("after")
        qs = qs.filter(id__gt=int(after)) if after and after.isdigit() else qs.order_by("-id")[:60]
        msgs = sorted(qs, key=lambda m: m.id)
        Message.objects.filter(sender=other, recipient=me, read_at__isnull=True).update(read_at=timezone.now())
        return Response({"with": person(other, state="connected"), "messages": [msg(m, me) for m in msgs]})

    def post(self, request, user_id):
        me, other = request.user, get_object_or_404(User, pk=user_id)
        if not Connection.connected(me, other):
            return Response({"detail": "Connect first to chat."}, status=403)
        text = (request.data.get("text") or "").strip()[:2000]
        if not text:
            return Response({"detail": "Empty message."}, status=400)
        m = Message.objects.create(sender=me, recipient=other, text=text)
        return Response(msg(m, me), status=201)


class Room(APIView):
    def get_throttles(self):
        return [ChatThrottle()] if self.request.method == "POST" else super().get_throttles()

    def get(self, request, slug):
        if slug not in ROOMS:
            return Response({"detail": "No such room."}, status=404)
        qs = Message.objects.filter(room=slug).select_related("sender")
        after = request.query_params.get("after")
        qs = qs.filter(id__gt=int(after)) if after and after.isdigit() else qs.order_by("-id")[:80]
        name, desc = ROOMS[slug]
        return Response({"room": {"slug": slug, "name": name, "desc": desc}, "messages": [msg(m, request.user) for m in sorted(qs, key=lambda m: m.id)]})

    def post(self, request, slug):
        if slug not in ROOMS:
            return Response({"detail": "No such room."}, status=404)
        text = (request.data.get("text") or "").strip()[:2000]
        if not text:
            return Response({"detail": "Empty message."}, status=400)
        m = Message.objects.create(sender=request.user, room=slug, text=text)
        return Response(msg(m, request.user), status=201)

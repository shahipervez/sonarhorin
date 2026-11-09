import base64
import uuid
from datetime import timedelta

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.certifications.services import issue_certificate

from . import services
from .models import EfficiencySession, EfficiencyTest, IntegrityEvent, Question, QuickTestAttempt, WebcamSnapshot

GRACE = timedelta(seconds=30)


# =================================================================== QUICK TEST

class QuickTestStartView(APIView):
    """POST {major?} → 10 random questions for the major, 10-minute timer."""

    def post(self, request):
        major = request.data.get("major") or request.user.major
        n = settings.QUICK_TEST_QUESTIONS
        ids, orders = services.pick_questions(major, n)
        if not ids:
            return Response({"detail": "Question bank is empty. Run `python manage.py seed`."}, status=503)
        att = QuickTestAttempt.objects.create(
            user=request.user, major=major, question_ids=ids, option_orders=orders, total=len(ids),
            expires_at=timezone.now() + timedelta(minutes=settings.QUICK_TEST_MINUTES),
        )
        qs = {q.id: q for q in Question.objects.filter(id__in=ids)}
        return Response({
            "attempt_id": att.id, "major": major, "expires_at": att.expires_at,
            "seconds": settings.QUICK_TEST_MINUTES * 60, "pass_percent": settings.QUICK_TEST_PASS_PERCENT,
            "questions": [services.client_question(qs[i], orders[str(i)], k) for k, i in enumerate(ids)],
        }, status=201)


class QuickTestSubmitView(APIView):
    """POST {answers: {question_id: displayed_option_index}} → graded result + explanations."""

    def post(self, request, pk):
        att = get_object_or_404(QuickTestAttempt, pk=pk, user=request.user)
        if att.submitted_at:
            return Response({"detail": "Already submitted.", "result": att.results}, status=409)
        late = timezone.now() > att.expires_at + GRACE
        answers = request.data.get("answers") or {}
        qs = {q.id: q for q in Question.objects.filter(id__in=att.question_ids)}
        review, correct, by_topic = [], 0, {}
        for qid in att.question_ids:
            q = qs.get(qid)
            if not q:
                continue
            order = att.option_orders[str(qid)]
            chosen = None if late else services.original_choice(order, answers.get(str(qid)))
            ok = chosen == q.answer_index
            correct += ok
            t = by_topic.setdefault(q.topic or q.category, [0, 0])
            t[0] += ok
            t[1] += 1
            review.append({"id": qid, "text": q.text, "options": q.options, "chosen": chosen,
                           "answer": q.answer_index, "correct": ok, "explanation": q.explanation, "topic": q.topic})
        percent = round(correct / max(1, att.total) * 100)
        passed = percent >= settings.QUICK_TEST_PASS_PERCENT
        att.correct, att.percent, att.passed, att.submitted_at = correct, percent, passed, timezone.now()
        weak = [k for k, (a, b) in by_topic.items() if a / b < 0.6]
        att.results = {"correct": correct, "total": att.total, "percent": percent, "passed": passed, "late": late,
                       "by_topic": [{"topic": k, "correct": a, "total": b} for k, (a, b) in by_topic.items()],
                       "weak_topics": weak, "review": review}
        if passed:
            att.certificate = issue_certificate(
                request.user, "skill_check", f"{att.major} Fundamentals — Skill Check", percent,
                {"correct": correct, "total": att.total},
            )
            att.results["certificate_code"] = att.certificate.code
        att.save()
        return Response(att.results)


class QuickTestHistoryView(APIView):
    def get(self, request):
        data = [{"id": a.id, "major": a.major, "percent": a.percent, "passed": a.passed,
                 "started_at": a.started_at, "submitted": bool(a.submitted_at)}
                for a in QuickTestAttempt.objects.filter(user=request.user)[:20]]
        return Response(data)


# =================================================================== EFFICIENCY TEST

def _test_card(t: EfficiencyTest, user=None):
    d = {"id": t.id, "title": t.title, "company_name": t.company_name or "Sonarhorin", "description": t.description,
         "major": t.major or "Your major", "question_count": t.question_count,
         "seconds_per_question": t.seconds_per_question, "total_minutes": t.total_minutes,
         "pass_percent": t.pass_percent, "min_integrity": t.min_integrity,
         "require_webcam": t.require_webcam, "require_fullscreen": t.require_fullscreen}
    if user and user.is_authenticated:
        s = EfficiencySession.objects.filter(test=t, user=user).first()
        d["my_session"] = {"id": s.id, "status": s.status} if s else None
    return d


class EfficiencyTestListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        tests = EfficiencyTest.objects.filter(active=True, is_public=True).order_by("-created_at")
        return Response([_test_card(t, request.user) for t in tests])


class EfficiencyDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        t = get_object_or_404(EfficiencyTest, pk=pk, active=True)
        return Response(_test_card(t, request.user))


class EfficiencyByCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, code):
        t = get_object_or_404(EfficiencyTest, invite_code=code.upper(), active=True)
        return Response(_test_card(t, request.user))


def _current_payload(s: EfficiencySession):
    test = s.test
    if s.current_index >= len(s.question_ids):
        return None
    qid = s.question_ids[s.current_index]
    q = Question.objects.get(id=qid)
    now = timezone.now()
    if not s.question_served_at:
        s.question_served_at = now
        s.save(update_fields=["question_served_at"])
    left = test.seconds_per_question - (now - s.question_served_at).total_seconds()
    return {"question": services.client_question(q, s.option_orders[str(qid)], s.current_index),
            "index": s.current_index, "total": len(s.question_ids), "seconds_left": max(0, round(left)),
            "seconds_per_question": test.seconds_per_question}


def _finish(s: EfficiencySession, status_="completed"):
    s.status = status_
    s.finished_at = timezone.now()
    s.correct = sum(1 for a in s.answers if a.get("correct"))
    s.percent = round(s.correct / max(1, len(s.question_ids)) * 100)
    if s.test.require_webcam and not s.snapshots.exists():
        s.flags["no_face"] = s.flags.get("no_face", 0) + 3
    s.integrity_score = services.integrity_from_flags(s.flags)
    s.passed = status_ == "completed" and s.percent >= s.test.pass_percent and s.integrity_score >= s.test.min_integrity
    if s.passed and not s.certificate:
        s.certificate = issue_certificate(
            s.user, "efficiency", f"Verified Efficiency Test — {s.test.title}", s.percent,
            {"integrity_score": s.integrity_score, "company": s.test.company_name or "Sonarhorin",
             "questions": len(s.question_ids)},
        )
    s.save()


def _result(s: EfficiencySession):
    return {"session_id": s.id, "status": s.status, "test": s.test.title, "correct": s.correct,
            "total": len(s.question_ids), "percent": s.percent, "integrity_score": s.integrity_score,
            "flags": s.flags, "passed": s.passed, "pass_percent": s.test.pass_percent,
            "min_integrity": s.test.min_integrity, "certificate_code": s.certificate.code if s.certificate else None,
            "finished_at": s.finished_at}


class EfficiencyStartView(APIView):
    def post(self, request, pk):
        test = get_object_or_404(EfficiencyTest, pk=pk, active=True)
        existing = EfficiencySession.objects.filter(test=test, user=request.user).first()
        if existing:
            if existing.status == "in_progress":
                return Response({"session_id": existing.id, "resumed": True, **_current_payload(existing)})
            return Response({"detail": "You have already taken this test. One genuine attempt per candidate.",
                             "result": _result(existing)}, status=409)
        major = test.major or request.user.major
        ids, orders = services.pick_questions(major, test.question_count, mix=(0.6, 0.25, 0.15))
        if not ids:
            return Response({"detail": "Question bank is empty."}, status=503)
        try:
            with transaction.atomic():
                s = EfficiencySession.objects.create(
                    test=test, user=request.user, major=major, question_ids=ids, option_orders=orders,
                    ip_address=request.META.get("REMOTE_ADDR"), user_agent=request.META.get("HTTP_USER_AGENT", "")[:300],
                )
        except IntegrityError:
            return Response({"detail": "Session already exists."}, status=409)
        return Response({"session_id": s.id, "resumed": False, **_current_payload(s)}, status=201)


class EfficiencyCurrentView(APIView):
    def get(self, request, sid):
        s = get_object_or_404(EfficiencySession, pk=sid, user=request.user)
        if s.status != "in_progress":
            return Response({"finished": True, "result": _result(s)})
        return Response(_current_payload(s))


class EfficiencyAnswerView(APIView):
    """POST {question_id, choice (displayed index or null)}. No going back, server-side timing."""

    def post(self, request, sid):
        with transaction.atomic():
            s = get_object_or_404(EfficiencySession.objects.select_for_update(), pk=sid, user=request.user)
            if s.status != "in_progress":
                return Response({"finished": True, "result": _result(s)})
            qid = s.question_ids[s.current_index]
            if int(request.data.get("question_id", -1)) != qid:
                return Response({"detail": "Out-of-order answer rejected."}, status=400)
            q = Question.objects.get(id=qid)
            now = timezone.now()
            served = s.question_served_at or now
            ms = int((now - served).total_seconds() * 1000)
            timed_out = ms > (s.test.seconds_per_question + 3) * 1000
            chosen = None if timed_out else services.original_choice(s.option_orders[str(qid)], request.data.get("choice"))
            correct = chosen == q.answer_index
            if timed_out:
                s.flags["timeout"] = s.flags.get("timeout", 0) + 1
            elif chosen is not None and ms < 1500 and len(q.text) > 40:
                s.flags["too_fast"] = s.flags.get("too_fast", 0) + 1
            s.answers.append({"question_id": qid, "choice": chosen, "correct": correct, "ms": ms, "timed_out": timed_out})
            s.current_index += 1
            s.question_served_at = None
            if s.current_index >= len(s.question_ids):
                _finish(s)
                return Response({"finished": True, "result": _result(s)})
            s.save()
        return Response({"finished": False, **_current_payload(s)})


class EfficiencyEventView(APIView):
    """POST {kind, detail} — browser reports integrity events (tab switch, paste, ...)."""

    def post(self, request, sid):
        s = get_object_or_404(EfficiencySession, pk=sid, user=request.user)
        kind = request.data.get("kind")
        if kind not in dict(IntegrityEvent.KINDS) or s.status != "in_progress":
            return Response({"ok": False}, status=400)
        IntegrityEvent.objects.create(session=s, kind=kind, detail=str(request.data.get("detail", ""))[:200])
        s.flags[kind] = s.flags.get(kind, 0) + 1
        s.integrity_score = services.integrity_from_flags(s.flags)
        if s.flags.get("tab_hidden", 0) >= services.TERMINATE_AFTER_TAB_SWITCHES:
            _finish(s, "terminated")
            return Response({"terminated": True, "result": _result(s)})
        s.save(update_fields=["flags", "integrity_score"])
        return Response({"ok": True, "integrity_score": s.integrity_score,
                         "warnings_left": services.TERMINATE_AFTER_TAB_SWITCHES - s.flags.get("tab_hidden", 0)})


class EfficiencySnapshotView(APIView):
    """POST {image: dataURL jpeg} — periodic webcam frame for employer review."""

    def post(self, request, sid):
        s = get_object_or_404(EfficiencySession, pk=sid, user=request.user, status="in_progress")
        data = request.data.get("image", "")
        if not data.startswith("data:image/jpeg;base64,") or len(data) > 400_000:
            return Response({"ok": False}, status=400)
        raw = base64.b64decode(data.split(",", 1)[1])
        WebcamSnapshot.objects.create(session=s, image=ContentFile(raw, name=f"{s.id}-{uuid.uuid4().hex[:8]}.jpg"))
        return Response({"ok": True})


class EfficiencyResultView(APIView):
    def get(self, request, sid):
        s = get_object_or_404(EfficiencySession, pk=sid, user=request.user)
        return Response(_result(s))


class EmployerResultsView(APIView):
    """Employer/staff: every candidate's score + integrity for a test they created."""

    def get(self, request, pk):
        test = get_object_or_404(EfficiencyTest, pk=pk)
        if not (request.user.is_staff or test.created_by_id == request.user.id):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        rows = [{"candidate": s.user.full_name, "email": s.user.email, "major": s.major, "status": s.status,
                 "percent": s.percent, "integrity_score": s.integrity_score, "flags": s.flags, "passed": s.passed,
                 "snapshots": s.snapshots.count(), "finished_at": s.finished_at}
                for s in test.sessions.select_related("user")]
        return Response({"test": _test_card(test), "candidates": rows})

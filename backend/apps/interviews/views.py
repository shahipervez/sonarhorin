from datetime import timedelta

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.certifications.services import issue_certificate

from . import interviewer
from .models import InterviewSession, InterviewTurn


def _state(s: InterviewSession):
    current = s.turns.filter(answer="").order_by("order").last()
    left = max(0, int((s.ends_at - timezone.now()).total_seconds()))
    return {"session_id": s.id, "status": s.status, "seconds_left": left, "total_questions": len(s.plan),
            "asked": s.turns.count(),
            "current": {"turn_id": current.id, "kind": current.kind, "question": current.question} if current and s.status == "active" else None}


def _finish(s: InterviewSession, status="completed"):
    s.status = status
    s.finished_at = timezone.now()
    s.report = interviewer.final_report(list(s.turns.all()))
    s.overall = s.report["overall"]
    if s.overall >= 70 and not s.certificate:
        s.certificate = issue_certificate(s.user, "interview", f"AI Mock Interview — {s.role or s.major}", s.overall,
                                          {"scores": s.report["scores"]})
        s.report["certificate_code"] = s.certificate.code
    s.save()


class StartInterviewView(APIView):
    """POST {major?, role?, language?} → 10-minute session + first question."""

    def post(self, request):
        InterviewSession.objects.filter(user=request.user, status="active").update(status="expired")
        major = request.data.get("major") or request.user.major
        role = (request.data.get("role") or "")[:120]
        plan = interviewer.build_plan(major, role)
        s = InterviewSession.objects.create(
            user=request.user, major=major, role=role, language=request.data.get("language", "en")[:5], plan=plan,
            ends_at=timezone.now() + timedelta(minutes=settings.INTERVIEW_MINUTES),
        )
        InterviewTurn.objects.create(session=s, order=0, kind=plan[0]["kind"], question=plan[0]["q"])
        return Response({**_state(s), "greeting": f"Hi {request.user.full_name.split()[0]}! I'm Mitu, your AI interviewer. "
                         f"We have {settings.INTERVIEW_MINUTES} minutes. Answer like it's the real thing."}, status=201)


class AnswerView(APIView):
    """POST {turn_id, answer} → evaluation of that answer + next question (or the final report)."""

    def post(self, request, pk):
        s = get_object_or_404(InterviewSession, pk=pk, user=request.user)
        if s.status != "active":
            return Response({"finished": True, "report": s.report, **_state(s)})
        turn = get_object_or_404(InterviewTurn, pk=request.data.get("turn_id"), session=s)
        if turn.answer:
            return Response({"detail": "Already answered."}, status=409)
        answer = (request.data.get("answer") or "").strip()[:4000] or "(no answer)"
        item = s.plan[turn.order] if turn.order < len(s.plan) else {"kind": turn.kind, "q": turn.question, "kw": []}
        item = dict(item, q=turn.question)
        time_up = timezone.now() >= s.ends_at
        next_item = None if time_up or turn.order + 1 >= len(s.plan) else s.plan[turn.order + 1]
        ev, next_q = interviewer.evaluate_and_next(s, item, answer, next_item)
        turn.answer, turn.evaluation, turn.answered_at = answer, ev, timezone.now()
        turn.save()
        if next_q and not time_up:
            InterviewTurn.objects.create(session=s, order=turn.order + 1, kind=next_item["kind"], question=next_q)
            return Response({"finished": False, "evaluation": ev, **_state(s)})
        _finish(s, "expired" if time_up else "completed")
        return Response({"finished": True, "evaluation": ev, "report": s.report, **_state(s)})


class FinishInterviewView(APIView):
    def post(self, request, pk):
        s = get_object_or_404(InterviewSession, pk=pk, user=request.user)
        if s.status == "active":
            _finish(s, "expired" if timezone.now() >= s.ends_at else "completed")
        return Response({"finished": True, "report": s.report, **_state(s)})


class InterviewDetailView(APIView):
    def get(self, request, pk):
        s = get_object_or_404(InterviewSession, pk=pk, user=request.user)
        if s.status == "active" and timezone.now() >= s.ends_at + timedelta(seconds=30):
            _finish(s, "expired")
        return Response({**_state(s), "report": s.report, "major": s.major, "role": s.role})


class InterviewHistoryView(APIView):
    def get(self, request):
        return Response([{"id": s.id, "major": s.major, "role": s.role, "status": s.status, "overall": s.overall,
                          "started_at": s.started_at} for s in InterviewSession.objects.filter(user=request.user)[:20]])

"""/api/career/ — resume vault, CV tailor, interview kits, practice and the streaming coach.

Every object is scoped to request.user (404 for anyone else's). AI-heavy endpoints use the "ai" throttle scope.
"""
import json
import logging

from django.db import transaction
from django.http import FileResponse, HttpResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.renderers import BaseRenderer, JSONRenderer
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.uploads import UploadError, check_upload
from apps.cv.analyzer import extract_text
from apps.jobs.models import Job

from . import export, services
from .models import CoachMessage, InterviewKit, PracticeAttempt, Resume, TailoredResume
from .serializers import (AttemptSerializer, JobInput, KitListSerializer, KitSerializer, MessageSerializer, ResumeSerializer,
                          TailoredListSerializer, TailoredSerializer)

log = logging.getLogger("apps.career")


class AIThrottled:
    throttle_scope = "ai"

    def get_throttles(self):
        if self.request.method == "POST":
            return [ScopedRateThrottle()]
        return super().get_throttles()


def _job_payload(data, user):
    """Resolve job fields from a job id or the pasted text. Returns (job, title, company, requirements, responsibilities)."""
    s = JobInput(data=data)
    s.is_valid(raise_exception=True)
    v = s.validated_data
    job = None
    title, company = v.get("job_title", "").strip(), v.get("company", "").strip()
    reqs, resp = v.get("requirements", "").strip(), v.get("responsibilities", "").strip()
    if v.get("job_id"):
        job = get_object_or_404(Job.objects.select_related("company"), pk=v["job_id"], is_active=True)
        title = title or job.title
        company = company or job.company.name
        reqs = reqs or "\n".join(f"- {r}" for r in (job.requirements or []))
        resp = resp or job.description
    if not title:
        raise UploadError("Add the job title.")
    if len((reqs + resp).split()) < 5:
        raise UploadError("Paste the job's requirements or responsibilities (a few lines is enough).")
    resume = None
    if v.get("resume_id"):
        resume = get_object_or_404(Resume, pk=v["resume_id"], user=user)
    return job, title, company, reqs, resp, resume, v.get("template", "modern")


# --------------------------------------------------------------------------- resumes
class ResumeListCreate(AIThrottled, generics.ListCreateAPIView):
    """GET → my resumes. POST multipart {file, title?} or JSON {text, title?} → parsed resume."""

    serializer_class = ResumeSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        f = request.FILES.get("file")
        title = (request.data.get("title") or "").strip()[:80]
        try:
            if f:
                check_upload(f)
                text, _ = extract_text(f, f.name)
                f.seek(0)
            else:
                text = (request.data.get("text") or "").strip()[:30000]
        except UploadError as e:
            return Response({"detail": str(e)}, status=400)
        except Exception:
            return Response({"detail": "Could not read this file. Is it password-protected or corrupted?"}, status=400)
        if len(text.split()) < 25:
            return Response({"detail": "We couldn't read enough text. Use a text-based PDF/DOCX, or paste your CV."}, status=422)
        profile, _ = services.build_profile(text)
        with transaction.atomic():
            first = not Resume.objects.filter(user=request.user).exists()
            r = Resume(user=request.user, title=title or (f.name.rsplit(".", 1)[0][:80] if f else "My CV"), text=text[:50000],
                       profile=profile, is_primary=first, original_name=(f.name[:255] if f else ""))
            if f:
                r.file.save(f.name, f, save=False)
            r.save()
        return Response(ResumeSerializer(r).data, status=201)


class ResumeDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ResumeSerializer

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def perform_update(self, s):
        prof = s.validated_data.get("profile")
        extra = {"profile": services.normalize_profile(prof)} if prof is not None else {}
        r = s.save(**extra)
        if s.validated_data.get("is_primary"):
            Resume.objects.filter(user=self.request.user).exclude(pk=r.pk).update(is_primary=False)


class ResumeFile(APIView):
    """Owner-only download of the original upload (files are never publicly served)."""

    def get(self, request, pk):
        r = get_object_or_404(Resume, pk=pk, user=request.user)
        if not r.file:
            return Response({"detail": "No file stored for this CV."}, status=404)
        return FileResponse(r.file.open("rb"), as_attachment=True, filename=r.original_name or "cv")


# --------------------------------------------------------------------------- tailoring
class TailorListCreate(AIThrottled, generics.ListCreateAPIView):
    """POST {resume_id, job_id | job_title+requirements/responsibilities, company?, template?} → tailored CV."""

    def get_serializer_class(self):
        return TailoredListSerializer if self.request.method == "GET" else TailoredSerializer

    def get_queryset(self):
        return TailoredResume.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            job, title, company, reqs, resp, resume, template = _job_payload(request.data, request.user)
        except UploadError as e:
            return Response({"detail": str(e)}, status=400)
        resume = resume or Resume.objects.filter(user=request.user).first()
        if not resume:
            return Response({"detail": "Upload your CV first."}, status=400)
        job_text = f"REQUIREMENTS:\n{reqs}\n\nRESPONSIBILITIES:\n{resp}".strip()
        content, analysis, used_ai = services.tailor(resume.profile, title, company, job_text)
        t = TailoredResume.objects.create(user=request.user, resume=resume, job=job, job_title=title, company=company,
                                          job_text=job_text, template=template, content=content, analysis=analysis, ai=used_ai)
        return Response(TailoredSerializer(t).data, status=201)


class TailorDetail(generics.RetrieveUpdateDestroyAPIView):
    """PATCH {content?, template?} — edits are re-scored against the same job keywords."""

    serializer_class = TailoredSerializer

    def get_queryset(self):
        return TailoredResume.objects.filter(user=self.request.user)

    def perform_update(self, s):
        t = s.instance
        content = s.validated_data.get("content")
        if content is not None:
            cover = str(content.get("cover_letter", t.content.get("cover_letter", "")))[:2500]
            content = services.normalize_profile(content)
            content["cover_letter"] = cover
            kw = t.analysis.get("keywords", [])
            matched, missing = services.keyword_match(content, kw)
            analysis = {**t.analysis, "matched": [services.pretty(k) for k in matched], "missing": [services.pretty(k) for k in missing],
                        "score_after": services.ats_score(content, kw)}
            s.save(content=content, analysis=analysis)
        else:
            s.save()


class TailorExport(APIView):
    """GET ?fmt=pdf|docx&doc=resume|cover  (not `format` — DRF reserves it)"""

    def get(self, request, pk):
        t = get_object_or_404(TailoredResume, pk=pk, user=request.user)
        fmt = request.query_params.get("fmt", "pdf")
        doc = request.query_params.get("doc", "resume")
        if fmt not in ("pdf", "docx") or doc not in ("resume", "cover"):
            return Response({"detail": "fmt must be pdf|docx and doc resume|cover"}, status=400)
        name = (t.content.get("name") or "cv").replace(" ", "_")
        slug = "".join(c for c in t.job_title if c.isalnum() or c in " -").strip().replace(" ", "_")[:40] or "job"
        if fmt == "pdf":
            data = export.resume_pdf(t.content, t.template) if doc == "resume" else export.cover_pdf(t.content, t.job_title, t.company, t.template)
            ctype = "application/pdf"
        else:
            data = export.resume_docx(t.content, t.template) if doc == "resume" else export.cover_docx(t.content, t.job_title, t.company)
            ctype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        resp = HttpResponse(data, content_type=ctype)
        resp["Content-Disposition"] = f'attachment; filename="{name}_{"CV" if doc == "resume" else "Cover_Letter"}_{slug}.{fmt}"'
        return resp


# --------------------------------------------------------------------------- interview kits
class KitListCreate(AIThrottled, generics.ListCreateAPIView):
    """POST {job_id | job_title + requirements + responsibilities, company?, resume_id?} → interview kit."""

    def get_serializer_class(self):
        return KitListSerializer if self.request.method == "GET" else KitSerializer

    def get_queryset(self):
        return InterviewKit.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            job, title, company, reqs, resp, resume, _ = _job_payload(request.data, request.user)
        except UploadError as e:
            return Response({"detail": str(e)}, status=400)
        if resume is None and request.data.get("resume_id") is None:
            resume = Resume.objects.filter(user=request.user).first()
        kit, used_ai = services.interview_kit(title, company, reqs, resp, resume.profile if resume else None)
        k = InterviewKit.objects.create(user=request.user, resume=resume, job=job, job_title=title, company=company,
                                        requirements=reqs, responsibilities=resp, kit=kit, ai=used_ai)
        return Response(KitSerializer(k).data, status=201)


class KitDetail(generics.RetrieveDestroyAPIView):
    serializer_class = KitSerializer

    def get_queryset(self):
        return InterviewKit.objects.filter(user=self.request.user)


class Practice(AIThrottled, APIView):
    """GET → my attempts. POST {question_id, answer} → scored feedback + improved answer."""

    def get(self, request, pk):
        k = get_object_or_404(InterviewKit, pk=pk, user=request.user)
        return Response(AttemptSerializer(k.attempts.all()[:50], many=True).data)

    def post(self, request, pk):
        k = get_object_or_404(InterviewKit, pk=pk, user=request.user)
        qid = str(request.data.get("question_id", ""))[:20]
        answer = str(request.data.get("answer", "")).strip()[:5000]
        q = next((x for x in k.kit.get("questions", []) if x["id"] == qid), None)
        if not q:
            return Response({"detail": "Unknown question."}, status=400)
        if len(answer.split()) < 5:
            return Response({"detail": "Write or say a little more — at least a sentence or two."}, status=400)
        keywords = services.job_keywords(f"{k.job_title}\n{k.requirements}\n{k.responsibilities}", 12)
        fb, used_ai = services.answer_feedback(q["question"], answer, k.job_title, keywords,
                                               k.resume.profile if k.resume_id and k.resume else None)
        fb["ai"] = used_ai
        a = PracticeAttempt.objects.create(kit=k, question_id=qid, question=q["question"], answer=answer, feedback=fb)
        return Response(AttemptSerializer(a).data, status=201)


class EventStreamRenderer(BaseRenderer):
    media_type = "text/event-stream"
    format = "sse"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return json.dumps(data).encode() if data is not None else b""


class CoachChat(AIThrottled, APIView):
    """GET → history. POST {message} → text/event-stream of `data: {"t": "..."}` chunks, then `data: {"done": true}`."""

    renderer_classes = [JSONRenderer, EventStreamRenderer]

    def get(self, request, pk):
        k = get_object_or_404(InterviewKit, pk=pk, user=request.user)
        return Response(MessageSerializer(k.messages.all()[:200], many=True).data)

    def delete(self, request, pk):
        k = get_object_or_404(InterviewKit, pk=pk, user=request.user)
        k.messages.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def post(self, request, pk):
        k = get_object_or_404(InterviewKit.objects.select_related("resume"), pk=pk, user=request.user)
        message = str(request.data.get("message", "")).strip()[:4000]
        if not message:
            return Response({"detail": "Type a message."}, status=400)
        history = list(k.messages.values("role", "content"))[-12:]
        CoachMessage.objects.create(kit=k, role="user", content=message)

        def events():
            out = []
            try:
                for chunk in services.coach_stream(k, history, message):
                    out.append(chunk)
                    yield f"data: {json.dumps({'t': chunk})}\n\n"
            finally:
                text = "".join(out).strip()
                if text:
                    CoachMessage.objects.create(kit=k, role="assistant", content=text)
            yield f"data: {json.dumps({'done': True})}\n\n"

        resp = StreamingHttpResponse(events(), content_type="text/event-stream")
        resp["Cache-Control"] = "no-cache"
        resp["X-Accel-Buffering"] = "no"
        return resp


class Overview(APIView):
    """Counts for the dashboard."""

    def get(self, request):
        u = request.user
        return Response({
            "resumes": Resume.objects.filter(user=u).count(),
            "tailored": TailoredResume.objects.filter(user=u).count(),
            "kits": InterviewKit.objects.filter(user=u).count(),
            "practice": PracticeAttempt.objects.filter(kit__user=u).count(),
        })

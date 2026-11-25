from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import AutoApplySettings, Company, Job, JobApplication
from .serializers import ApplicationSerializer, AutoApplySerializer, JobSerializer


def _my_apps(user):
    if not user.is_authenticated:
        return {}
    return dict(JobApplication.objects.filter(user=user).values_list("job_id", "status"))


class JobListView(APIView):
    """GET ?q=&kw=&major=&channel=&location=&type=&fresher=1 — open fresher-friendly jobs. kw = space-separated, any word matches."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        p = request.query_params
        qs = (Job.objects.filter(is_active=True, experience_max_years__lte=services.FRESHER_MAX_YEARS)
              .filter(Q(deadline__isnull=True) | Q(deadline__gte=timezone.localdate())).select_related("company"))
        if (q := p.get("q", "").strip()):
            qs = qs.filter(Q(title__icontains=q) | Q(company__name__icontains=q) | Q(description__icontains=q))
        if (kw := p.get("kw", "").split()):
            # category keywords (driver, chef…): any one word in the title or description
            any_word = Q()
            for w in kw[:8]:
                any_word |= Q(title__icontains=w) | Q(description__icontains=w)
            qs = qs.filter(any_word)
        if (m := p.get("major")):
            qs = qs.filter(Q(majors="") | Q(majors__icontains=m))
        if (loc := p.get("location")):
            qs = qs.filter(Q(location__icontains=loc) | Q(remote=True))
        if (t := p.get("type")):
            qs = qs.filter(job_type=t)
        jobs = list(qs[:200])
        if (ch := p.get("channel")):
            jobs = [j for j in jobs if j.effective_channel() == ch]
        counts = {c: 0 for c in ("partner", "email", "portal")}
        for j in jobs:
            counts[j.effective_channel()] += 1
        data = JobSerializer(jobs, many=True, context={"my_apps": _my_apps(request.user)}).data
        return Response({"count": len(jobs), "by_channel": counts, "jobs": data})


class JobDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        job = get_object_or_404(Job.objects.select_related("company"), pk=pk)
        return Response(JobSerializer(job, context={"my_apps": _my_apps(request.user)}).data)


class PreviewView(APIView):
    """GET → the cover letter + portal packet we'd send, so the user can review/edit first."""

    def get(self, request, pk):
        job = get_object_or_404(Job, pk=pk)
        cv = services.latest_cv(request.user)
        return Response({"channel": job.effective_channel(), "cover_letter": services.cover_letter(request.user, job),
                         "packet": services.apply_packet(request.user, job), "to": job.inbox if job.effective_channel() == "email" else None,
                         "cv": {"id": cv.id, "name": cv.original_name, "score": cv.score} if cv else None})


class ApplyView(APIView):
    def post(self, request, pk):
        job = get_object_or_404(Job.objects.select_related("company"), pk=pk)
        try:
            app = services.apply(request.user, job, note=request.data.get("note", ""),
                                 letter=(request.data.get("cover_letter") or "").strip()[:5000] or None)
        except services.ApplyError as e:
            return Response({"detail": str(e)}, status=400)
        out = ApplicationSerializer(app).data
        if app.channel == "portal":
            out["packet"] = services.apply_packet(request.user, job)
        return Response(out, status=201)


class BulkApplyView(APIView):
    """POST {job_ids: [...]} → apply to up to 20 jobs at once (partner + email only)."""

    def post(self, request):
        ids = [int(i) for i in (request.data.get("job_ids") or []) if str(i).isdigit()][:20]
        results = []
        for job in Job.objects.filter(id__in=ids).select_related("company"):
            if job.effective_channel() == "portal":
                results.append({"job_id": job.id, "ok": False, "detail": "Company portal — finish this one yourself."})
                continue
            try:
                app = services.apply(request.user, job)
                results.append({"job_id": job.id, "ok": app.status != "failed", "status": app.status})
            except services.ApplyError as e:
                results.append({"job_id": job.id, "ok": False, "detail": str(e)})
        return Response({"results": results, "applied": sum(r["ok"] for r in results)})


class MatchesView(APIView):
    def get(self, request):
        prefs = getattr(request.user, "auto_apply", None)
        jobs = services.matching_jobs(request.user, prefs)
        auto = [j.id for j in jobs if j.effective_channel() in ("partner", "email")]
        return Response({"count": len(jobs), "auto_eligible": auto, "jobs": JobSerializer(jobs[:60], many=True).data,
                         "has_cv": bool(services.latest_cv(request.user))})


class AutoApplyView(APIView):
    def get(self, request):
        prefs, _ = AutoApplySettings.objects.get_or_create(user=request.user)
        return Response(AutoApplySerializer(prefs).data)

    def put(self, request):
        prefs, _ = AutoApplySettings.objects.get_or_create(user=request.user)
        s = AutoApplySerializer(prefs, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)


class AutoApplyRunView(APIView):
    """Run auto-apply now (same rules + daily cap as the scheduled run)."""

    def post(self, request):
        prefs = getattr(request.user, "auto_apply", None)
        if not prefs or not prefs.enabled:
            return Response({"detail": "Turn auto-apply on first."}, status=400)
        if not services.latest_cv(request.user):
            return Response({"detail": "Upload your CV first — we attach it to every application."}, status=400)
        res = services.run_auto_apply(request.user)
        return Response({"applied": sum(1 for _, r in res if not isinstance(r, str) and r.status != "failed"),
                         "results": [{"job": j.title, "company": j.company.name, "status": r if isinstance(r, str) else r.status} for j, r in res]})


class MyApplicationsView(APIView):
    def get(self, request):
        apps = JobApplication.objects.filter(user=request.user).select_related("job__company")
        data = ApplicationSerializer(apps, many=True).data
        counts = {}
        for a in apps:
            counts[a.status] = counts.get(a.status, 0) + 1
        return Response({"counts": counts, "applications": data})


class ApplicationActionView(APIView):
    """POST /applications/<id>/<action>/ — action: done (portal submitted) | withdraw."""

    def post(self, request, pk, action):
        app = get_object_or_404(JobApplication, pk=pk, user=request.user)
        if action == "done" and app.status == "needs_action":
            app.status, app.sent_at = "done", timezone.now()
        elif action == "withdraw" and app.status in ("needs_action", "submitted", "sent", "done"):
            app.status = "withdrawn"
        else:
            return Response({"detail": "Not allowed."}, status=400)
        app.save(update_fields=["status", "sent_at"])
        return Response(ApplicationSerializer(app).data)


class EmployerApplicantsView(APIView):
    """Employers (company.employer_users) see 1-click applicants for their jobs."""

    def get(self, request):
        apps = (JobApplication.objects.filter(job__company__employer_users=request.user, channel="partner")
                .exclude(status="withdrawn").select_related("user", "job", "cv"))
        return Response([{"id": a.id, "job": a.job.title, "candidate": a.user.full_name, "email": a.user.email, "phone": a.user.phone,
                          "major": a.user.major, "university": a.user.university, "cgpa": a.user.cgpa, "cv_score": a.cv.score if a.cv else None,
                          "cover_letter": a.cover_letter, "status": a.status, "applied": a.created_at} for a in apps])


class ScraperTriggerView(APIView):
    """POST /api/jobs/scraper/run/ or /api/jobs/scrape/ — Trigger live web scrape."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        queries = request.data.get("queries")
        limit = int(request.data.get("limit", 8))
        fetch_details = bool(request.data.get("fetch_details", False))
        from . import scheduler
        res = scheduler.trigger_immediate_scrape(queries=queries, limit=limit, fetch_details=fetch_details)
        return Response(res)


class ScraperStatusView(APIView):
    """GET /api/jobs/scraper/status/ — Check automation runner status."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from . import scheduler
        return Response(scheduler.get_status())




class FeaturedCompaniesView(APIView):
    """Top Bangladesh Corporate Offices and Companies with live openings and official career portal links."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        import os
        from django.conf import settings
        from django.db.models import Count, Q
        from django.utils import timezone

        today = timezone.localdate()
        live = Q(jobs__is_active=True) & (Q(jobs__deadline__isnull=True) | Q(jobs__deadline__gte=today))
        qs = (Company.objects.annotate(open_jobs=Count("jobs", filter=live, distinct=True))
              .filter(Q(open_jobs__gt=0) | Q(featured=True))
              .order_by("-featured", "-open_jobs", "name")[:40])
        out = []
        for c in qs:
            # Prefer clean relative path /logos/{slug}.svg for crisp vector rendering across all origins/hosts
            logo_url = f"/logos/{c.slug}.svg"
            if not os.path.exists(os.path.join(settings.BASE_DIR, "..", "frontend", "public", "logos", f"{c.slug}.svg")):
                if c.logo:
                    logo_url = c.logo.url
                else:
                    logo_url = f"/media/logos/{c.slug}.png"

            out.append({
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "color": c.color,
                "industry": c.industry,
                "city": c.city,
                "website": c.website,
                "careers_url": c.careers_url,
                "logo": logo_url,
                "open_jobs": c.open_jobs,
                "is_partner": c.is_partner,
                "featured": c.featured,
            })
        return Response(out)

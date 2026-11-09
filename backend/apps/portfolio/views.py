import json

from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import Portfolio


def payload(p, user, public=False):
    out = {"slug": p.slug, "template": p.template, "accent": p.accent, "data": p.data, "published": p.published,
           "show_certificates": p.show_certificates, "url": p.url, "updated_at": p.updated_at}
    if not public:
        out["views"] = p.views
    out["verified"] = services.verified(user) if p.show_certificates else []
    return out


class MinePortfolio(APIView):
    """GET → your portfolio (or an unsaved draft pre-filled from your profile + CV). PUT → save."""

    def get(self, request):
        p = Portfolio.objects.filter(user=request.user).first()
        if p:
            return Response({"exists": True, **payload(p, request.user)})
        draft = Portfolio(user=request.user, slug=services.suggest_slug(request.user), data=services.prefill(request.user))
        return Response({"exists": False, **payload(draft, request.user), "views": 0, "updated_at": None})

    def put(self, request):
        d = request.data
        slug, err = services.valid_slug(d.get("slug"), request.user)
        if err:
            return Response({"slug": [err]}, status=400)
        data = services.clean_data(d.get("data"))
        if len(json.dumps(data)) > services.MAX_JSON:
            return Response({"detail": "Too much content — trim a few projects."}, status=400)
        tpl = d.get("template") if d.get("template") in dict(Portfolio.TEMPLATES) else "editorial"
        accent = d.get("accent") if isinstance(d.get("accent"), str) and len(d.get("accent")) in (4, 7) and d["accent"].startswith("#") else "#6B4EFF"
        p, _ = Portfolio.objects.update_or_create(user=request.user, defaults={
            "slug": slug, "template": tpl, "accent": accent, "data": data,
            "show_certificates": bool(d.get("show_certificates", True)),
            **({"published": bool(d["published"])} if "published" in d else {}),
        })
        return Response({"exists": True, **payload(p, request.user)})


class Prefill(APIView):
    def get(self, request):
        return Response(services.prefill(request.user))


class SlugCheck(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        slug, err = services.valid_slug(request.query_params.get("slug"), user)
        return Response({"slug": slug, "ok": err is None, "detail": err})


class PublicPortfolio(APIView):
    """The live site's data. Only published portfolios are visible."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        p = get_object_or_404(Portfolio.objects.select_related("user"), slug=slug.lower(), published=True)
        if not (request.user.is_authenticated and request.user == p.user):
            Portfolio.objects.filter(pk=p.pk).update(views=F("views") + 1)
        return Response(payload(p, p.user, public=True))

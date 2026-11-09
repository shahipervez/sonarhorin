"""Security headers for every API response (the SPA's own CSP is set by nginx — see deploy/)."""
from django.conf import settings


class SecurityHeadersMiddleware:
    API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
    ADMIN_CSP = ("default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
                 "script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        resp = self.get_response(request)
        path = request.path
        if path.startswith("/admin/"):
            resp.setdefault("Content-Security-Policy", self.ADMIN_CSP)
        elif path.startswith("/api/"):
            resp.setdefault("Content-Security-Policy", self.API_CSP)
            resp.setdefault("Cache-Control", "no-store")
        resp.setdefault("Permissions-Policy", "camera=(), geolocation=(), payment=(), usb=(), microphone=(self)")
        resp.setdefault("Cross-Origin-Resource-Policy", "same-site")
        resp.setdefault("X-Content-Type-Options", "nosniff")
        return resp


def client_ip(request):
    if getattr(settings, "TRUST_X_FORWARDED_FOR", False):
        fwd = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if fwd:
            return fwd.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")

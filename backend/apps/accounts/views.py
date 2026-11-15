from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView

from .serializers import EmailTokenSerializer, RegisterSerializer, UserSerializer


import logging

from django.conf import settings
from django.core.cache import cache
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from apps.core.security import client_ip

sec_log = logging.getLogger("security")


def _set_refresh_cookie(resp, refresh: str):
    c = settings.REFRESH_COOKIE
    resp.set_cookie(c["key"], refresh, max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
                    path=c["path"], httponly=c["httponly"], secure=c["secure"], samesite=c["samesite"])
    return resp


def _clear_refresh_cookie(resp):
    c = settings.REFRESH_COOKIE
    resp.delete_cookie(c["key"], path=c["path"], samesite=c["samesite"])
    return resp


def _session_response(user, refresh: RefreshToken, code=200):
    """Access token and refresh token in the body + HttpOnly cookie."""
    resp = Response({
        "user": UserSerializer(user).data,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }, status=code)
    return _set_refresh_cookie(resp, str(refresh))


def _cookie_guard(request):
    """Cookie-authenticated endpoints need this header: a cross-site <form> can't send it (CSRF defence)."""
    return request.headers.get("X-Requested-With") == "sonarhorin"


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        sec_log.info("register user=%s ip=%s", user.pk, client_ip(request))
        return _session_response(user, RefreshToken.for_user(user), code=201)


class LoginView(APIView):
    """Email + password → access token + HttpOnly refresh cookie. Locks an email/IP after repeated failures."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def _keys(self, request):
        email = str(request.data.get("email", "")).lower().strip()[:254]
        return f"lf:e:{email}", f"lf:ip:{client_ip(request)}"

    def post(self, request):
        ke, ki = self._keys(request)
        limit, minutes = settings.LOGIN_MAX_FAILS, settings.LOGIN_LOCK_MINUTES
        if (cache.get(ke, 0) >= limit) or (cache.get(ki, 0) >= limit * 4):
            sec_log.warning("login locked key=%s ip=%s", ke, client_ip(request))
            return Response({"detail": f"Too many attempts. Try again in {minutes} minutes."}, status=429)
        s = EmailTokenSerializer(data=request.data)
        try:
            s.is_valid(raise_exception=True)
        except Exception:
            for k, mult in ((ke, 1), (ki, 4)):
                cache.set(k, cache.get(k, 0) + 1, timeout=minutes * 60)
            sec_log.info("login failed key=%s ip=%s", ke, client_ip(request))
            return Response({"detail": "ফোন নম্বর/জিমেইল বা পাসওয়ার্ড সঠিক নয়।" if "bn" in request.headers.get("Accept-Language", "") else "Phone number/Gmail or password is incorrect."}, status=401)
        cache.delete(ke)
        user = s.user
        return _session_response(user, RefreshToken.for_user(user))


class RefreshView(APIView):
    """Rotates the refresh cookie and returns a fresh access token."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        if not _cookie_guard(request):
            return Response({"detail": "Missing request header."}, status=403)
        token = request.COOKIES.get(settings.REFRESH_COOKIE["key"]) or request.data.get("refresh")
        if not token:
            return Response(status=status.HTTP_204_NO_CONTENT)  # simply signed out — not an error
        s = TokenRefreshSerializer(data={"refresh": token})
        try:
            s.is_valid(raise_exception=True)
        except (TokenError, Exception):
            return _clear_refresh_cookie(Response({"detail": "Session expired. Please sign in again."}, status=401))
        resp = Response({"access": s.validated_data["access"], "refresh": s.validated_data.get("refresh", str(token))})
        if s.validated_data.get("refresh"):
            _set_refresh_cookie(resp, s.validated_data["refresh"])
        return resp


class LogoutView(APIView):
    """Blacklists the refresh token and clears the cookie."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.COOKIES.get(settings.REFRESH_COOKIE["key"])
        if token:
            try:
                RefreshToken(token).blacklist()
            except TokenError:
                pass
        return _clear_refresh_cookie(Response(status=status.HTTP_204_NO_CONTENT))


class ChangePasswordView(APIView):
    """Change password; every other session's refresh token is revoked."""

    def post(self, request):
        from django.contrib.auth import password_validation
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

        old, new = request.data.get("old_password", ""), request.data.get("new_password", "")
        if not request.user.check_password(old):
            return Response({"detail": "Current password is incorrect."}, status=400)
        try:
            password_validation.validate_password(new, request.user)
        except Exception as e:
            return Response({"detail": " ".join(getattr(e, "messages", [str(e)]))}, status=400)
        request.user.set_password(new)
        request.user.save(update_fields=["password"])
        for t in OutstandingToken.objects.filter(user=request.user):
            BlacklistedToken.objects.get_or_create(token=t)
        sec_log.info("password changed user=%s", request.user.pk)
        return _session_response(request.user, RefreshToken.for_user(request.user))


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


# ------------------------------------------------------------------ CV → profile auto-fill
from rest_framework.throttling import AnonRateThrottle  # noqa: E402
from rest_framework.views import APIView  # noqa: E402

from apps.cv import analyzer, parser  # noqa: E402
from apps.core.uploads import UploadError, check_upload  # noqa: E402


class CVParseThrottle(AnonRateThrottle):
    scope = "cvparse"
    rate = "15/hour"


class ParseCVView(APIView):
    """POST multipart {file} → profile fields read from the CV. Nothing is stored."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [CVParseThrottle]

    def post(self, request):
        f = request.FILES.get("file")
        try:
            check_upload(f)
        except UploadError as e:
            return Response({"detail": str(e)}, status=400)
        try:
            text, _ = analyzer.extract_text(f, f.name)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
        except Exception:
            return Response({"detail": "Could not read this file. Is it password-protected?"}, status=400)
        if len(text.split()) < 20:
            return Response({"detail": "This CV looks like an image — we couldn't read any text. Try a text-based PDF or DOCX."}, status=422)
        return Response(parser.ai_fill(parser.parse_cv_text(text), text))

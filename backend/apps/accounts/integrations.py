"""Third-party sign-in: Google Identity Services and BD phone OTP.

Both return exactly the same session payload as the email/password login (`views._session_response`).
"""
import logging

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.security import client_ip

from . import otp
from .models import User
from .phone import InvalidPhone, local_form, mask, normalize_bd_phone, phone_variants
from .sms import SMSError, send_sms
from .views import _session_response

sec_log = logging.getLogger("security")


def _bn(request):
    return "bn" in request.headers.get("Accept-Language", "")


# ------------------------------------------------------------------------------------------- throttles
class _SettingRateThrottle(SimpleRateThrottle):
    """Rate read from a plain setting (so it doesn't depend on REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'])."""

    rate_setting = ""

    def get_rate(self):
        return getattr(settings, self.rate_setting)


class OTPIPThrottle(_SettingRateThrottle):
    scope = "otp_ip"
    rate_setting = "OTP_IP_RATE"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": client_ip(request) or "unknown"}


class OTPPhoneThrottle(_SettingRateThrottle):
    scope = "otp_phone"
    rate_setting = "OTP_PHONE_RATE"

    def get_cache_key(self, request, view):
        try:
            ident = normalize_bd_phone(request.data.get("phone"))
        except InvalidPhone:
            return None  # the view rejects it anyway
        return self.cache_format % {"scope": self.scope, "ident": ident}


class OTPVerifyIPThrottle(OTPIPThrottle):
    scope = "otp_verify_ip"
    rate_setting = "OTP_VERIFY_IP_RATE"


class GoogleLoginThrottle(OTPIPThrottle):
    scope = "google_login"
    rate_setting = "OTP_VERIFY_IP_RATE"


# ---------------------------------------------------------------------------------------------- Google
def verify_google_token(token: str) -> dict:
    """Verify a Google ID token's signature, expiry, issuer and audience. Returns its claims."""
    from google.auth.transport import requests as g_requests
    from google.oauth2 import id_token

    audience = settings.GOOGLE_CLIENT_IDS
    claims = id_token.verify_oauth2_token(token, g_requests.Request(), audience=audience if len(audience) > 1 else audience[0])
    if claims.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise ValueError("wrong issuer")
    return claims


class GoogleLoginView(APIView):
    """POST {credential | id_token} (from Google Identity Services) → session (same shape as /login/)."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [GoogleLoginThrottle]

    def post(self, request):
        if not settings.GOOGLE_CLIENT_IDS:
            return Response({"detail": "Google sign-in is not configured."}, status=503)
        token = request.data.get("credential") or request.data.get("id_token") or ""
        if not token or len(token) > 4096:
            return Response({"detail": "Missing Google credential."}, status=400)
        try:
            claims = verify_google_token(token)
        except Exception as e:  # ValueError for bad tokens, TransportError if Google's certs are unreachable
            sec_log.info("google login rejected ip=%s reason=%s", client_ip(request), e.__class__.__name__)
            return Response({"detail": "Google sign-in failed. Please try again."}, status=401)
        email = (claims.get("email") or "").lower().strip()
        if not email or not claims.get("email_verified"):
            return Response({"detail": "Your Google account email is not verified."}, status=401)
        sub = str(claims.get("sub") or "")
        if not sub:
            return Response({"detail": "Google sign-in failed. Please try again."}, status=401)

        user = User.objects.filter(google_sub=sub).first()
        created = False
        if user is None:
            user = User.objects.filter(email__iexact=email).first()
            if user is not None:
                if user.google_sub and user.google_sub != sub:
                    return Response({"detail": "This email is linked to a different Google account."}, status=409)
                user.google_sub = sub
                user.save(update_fields=["google_sub"])
            else:
                user = User.objects.create_user(email=email, password=None, google_sub=sub,
                                                full_name=(claims.get("name") or email.split("@")[0])[:120])
                created = True
        if not user.is_active:
            return Response({"detail": "This account is disabled."}, status=403)
        sec_log.info("google login user=%s created=%s ip=%s", user.pk, created, client_ip(request))
        return _session_response(user, RefreshToken.for_user(user), code=201 if created else 200)


# ------------------------------------------------------------------------------------------- Phone OTP
def _phone_or_400(request):
    try:
        return normalize_bd_phone(request.data.get("phone")), None
    except InvalidPhone:
        msg = "সঠিক বাংলাদেশি মোবাইল নম্বর দিন (01XXXXXXXXX)।" if _bn(request) else "Enter a valid Bangladeshi mobile number (01XXXXXXXXX)."
        return None, Response({"detail": msg}, status=400)


class OTPRequestView(APIView):
    """POST {phone} → sends a 6-digit code by SMS. Throttled per phone and per IP, 60 s resend cooldown."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [OTPIPThrottle, OTPPhoneThrottle]

    def post(self, request):
        phone, err = _phone_or_400(request)
        if err:
            return err
        try:
            row, code = otp.issue(phone, ip=client_ip(request))
        except otp.OTPError as e:
            resp = Response({"detail": e.message, "code": e.code, **e.extra}, status=e.status)
            if "retry_after" in e.extra:
                resp["Retry-After"] = str(e.extra["retry_after"])
            return resp
        minutes = max(1, settings.OTP_TTL_SECONDS // 60)
        text = f"Sonarhorin code: {code}. Valid {minutes} min. Never share it. সোনারহরিণ কোড: {code}"
        try:
            send_sms(phone, text)
        except SMSError as e:
            row.delete()  # don't burn the cooldown on a code the user never got
            sec_log.warning("otp sms failed to=%s err=%s", mask(phone), e)
            msg = "এখন SMS পাঠানো যাচ্ছে না, একটু পরে চেষ্টা করো।" if _bn(request) else "Could not send the SMS right now. Please try again shortly."
            return Response({"detail": msg}, status=503)
        sec_log.info("otp sent to=%s ip=%s", mask(phone), client_ip(request))
        return Response({"detail": "sent", "phone": local_form(phone), "expires_in": settings.OTP_TTL_SECONDS,
                         "resend_in": settings.OTP_RESEND_COOLDOWN})


def _user_for_phone(phone: str):
    user = User.objects.filter(phone_e164=phone).first()
    if user:
        return user
    local = local_form(phone)
    return User.objects.filter(
        Q(phone__in=phone_variants(phone)) | Q(email=f"{local}@phone.sonarhorin.com") | Q(email=f"{phone[1:]}@phone.sonarhorin.com")
    ).order_by("id").first()


class OTPVerifyView(APIView):
    """POST {phone, code, full_name?} → session. Creates the account on first login (OTP_ALLOW_SIGNUP)."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [OTPVerifyIPThrottle]

    def post(self, request):
        phone, err = _phone_or_400(request)
        if err:
            return err
        try:
            otp.verify(phone, request.data.get("code"))
        except otp.OTPError as e:
            sec_log.info("otp verify failed to=%s reason=%s ip=%s", mask(phone), e.code, client_ip(request))
            bn = {"expired": "কোডের মেয়াদ শেষ, নতুন কোড নাও।", "locked": "অনেকবার ভুল হয়েছে, নতুন কোড নাও।", "invalid": "কোডটি ভুল।"}
            return Response({"detail": bn.get(e.code, e.message) if _bn(request) else e.message, "code": e.code, **e.extra}, status=e.status)

        user = _user_for_phone(phone)
        created = False
        if user is None:
            if not settings.OTP_ALLOW_SIGNUP:
                return Response({"detail": "No account uses this number. Please register first."}, status=404)
            local = local_form(phone)
            name = str(request.data.get("full_name") or "").strip()[:120] or local
            try:
                with transaction.atomic():
                    user = User.objects.create_user(email=f"{local}@phone.sonarhorin.com", password=None,
                                                    full_name=name, phone=local, phone_e164=phone, phone_verified=True)
                created = True
            except IntegrityError:
                user = _user_for_phone(phone)
        if not user.is_active:
            return Response({"detail": "This account is disabled."}, status=403)
        if user.phone_e164 != phone or not user.phone_verified:
            if not User.objects.filter(phone_e164=phone).exclude(pk=user.pk).exists():
                user.phone_e164, user.phone_verified = phone, True
                user.save(update_fields=["phone_e164", "phone_verified"])
        sec_log.info("otp login user=%s created=%s ip=%s", user.pk, created, client_ip(request))
        return _session_response(user, RefreshToken.for_user(user), code=201 if created else 200)

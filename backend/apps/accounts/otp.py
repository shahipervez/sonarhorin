"""Phone OTP issue/verify logic (no HTTP here — see integrations.py for the views)."""
import hashlib
import hmac
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import PhoneOTP

OTP_DIGITS = 6


class OTPError(Exception):
    def __init__(self, code, message, status=400, **extra):
        super().__init__(message)
        self.code, self.message, self.status, self.extra = code, message, status, extra


def _hash(phone: str, code: str, salt: str) -> str:
    key = settings.SECRET_KEY.encode()
    return hmac.new(key, f"{salt}:{phone}:{code}".encode(), hashlib.sha256).hexdigest()


def _make_hash(phone, code):
    salt = secrets.token_hex(8)
    return f"{salt}${_hash(phone, code, salt)}"


def _check_hash(stored, phone, code) -> bool:
    try:
        salt, digest = stored.split("$", 1)
    except ValueError:
        return False
    return hmac.compare_digest(digest, _hash(phone, code, salt))


def generate_code() -> str:
    return f"{secrets.randbelow(10 ** OTP_DIGITS):0{OTP_DIGITS}d}"


def issue(phone: str, ip=None):
    """Create a fresh OTP for `phone` (E.164). Returns (otp_row, plain_code). Enforces the resend cooldown."""
    now = timezone.now()
    last = PhoneOTP.objects.filter(phone=phone).first()
    if last and (now - last.created_at).total_seconds() < settings.OTP_RESEND_COOLDOWN:
        wait = int(settings.OTP_RESEND_COOLDOWN - (now - last.created_at).total_seconds()) + 1
        raise OTPError("cooldown", f"Please wait {wait}s before requesting another code.", status=429, retry_after=wait)
    code = generate_code()
    with transaction.atomic():
        # Only the newest code is ever valid.
        PhoneOTP.objects.filter(phone=phone, used_at__isnull=True).update(used_at=now)
        row = PhoneOTP.objects.create(
            phone=phone, code_hash=_make_hash(phone, code), ip=ip or None,
            expires_at=now + timedelta(seconds=settings.OTP_TTL_SECONDS),
        )
    return row, code


def verify(phone: str, code: str) -> PhoneOTP:
    """Consume the current OTP for `phone` if `code` matches. Raises OTPError otherwise."""
    code = str(code or "").strip()
    now = timezone.now()
    with transaction.atomic():
        row = (PhoneOTP.objects.select_for_update()
               .filter(phone=phone, used_at__isnull=True).order_by("-created_at").first())
        if row is None or row.expires_at <= now:
            raise OTPError("expired", "This code has expired or was never requested. Request a new one.")
        if row.attempts >= settings.OTP_MAX_ATTEMPTS:
            raise OTPError("locked", "Too many wrong attempts. Request a new code.", status=429)
        row.attempts += 1
        ok = len(code) == OTP_DIGITS and code.isdigit() and _check_hash(row.code_hash, phone, code)
        if ok:
            row.used_at = now
        row.save(update_fields=["attempts", "used_at"])
    if not ok:
        left = max(0, settings.OTP_MAX_ATTEMPTS - row.attempts)
        if left == 0:
            raise OTPError("locked", "Too many wrong attempts. Request a new code.", status=429)
        raise OTPError("invalid", "Wrong code.", attempts_left=left)
    return row

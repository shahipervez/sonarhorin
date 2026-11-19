"""Bangladesh mobile number helpers.

Accepted input: 01XXXXXXXXX, 8801XXXXXXXXX, +8801XXXXXXXXX, 008801XXXXXXXXX — spaces, dashes and dots ignored,
Bangla digits (০-৯) understood. The operator digit (3rd digit of the local form) must be 3-9.
"""
import re

_BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
_LOCAL_RE = re.compile(r"^01[3-9]\d{8}$")


class InvalidPhone(ValueError):
    pass


def normalize_bd_phone(raw) -> str:
    """Return the E.164 form '+8801XXXXXXXXX' or raise InvalidPhone."""
    s = str(raw or "").translate(_BN_DIGITS)
    s = re.sub(r"[\s\-().]", "", s)
    if s.startswith("+"):
        s = s[1:]
    if s.startswith("00"):
        s = s[2:]
    if s.startswith("880"):
        s = s[2:]  # 8801XXXXXXXXX → 01XXXXXXXXX
    if not _LOCAL_RE.match(s):
        raise InvalidPhone("Enter a valid Bangladeshi mobile number (01XXXXXXXXX).")
    return "+88" + s


def local_form(e164: str) -> str:
    """'+8801712345678' → '01712345678'."""
    return e164[3:] if e164.startswith("+880") else e164


def phone_variants(e164: str) -> set:
    """Ways the same number may already be stored in User.phone by the legacy register form."""
    local = local_form(e164)
    return {e164, local, e164[1:], "+88 " + local, "+880 " + local[1:5] + " " + local[5:]}


def mask(e164: str) -> str:
    """For logs: '+8801712345678' → '+88017*****678'."""
    return e164[:6] + "*" * max(0, len(e164) - 9) + e164[-3:]

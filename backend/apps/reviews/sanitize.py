"""Keep reviews safe to publish: strip contact details (PII) and mask a small profanity list.

Deliberately simple and predictable. Reviews are about companies, so names of private people are
not detected; moderators handle that via the report flow and the admin.
"""
import re

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
# Bangladeshi mobiles (+880 1XXXXXXXXX / 01XXXXXXXXX, with optional spaces or dashes) and any other
# run of 8+ digits, which is almost always a phone/ID number rather than review content.
PHONE_RE = re.compile(r"(?:\+?\s?88[\s-]?)?0?1[3-9](?:[\s-]?\d){8}\b|(?:\+?\d[\s-]?){8,}\d")
BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
# Private chat links (WhatsApp / Telegram / Messenger) are contact details too.
URL_RE = re.compile(r"(?:https?://)?(?:www\.)?(?:wa\.me|(?:api|chat)\.whatsapp\.com|t\.me|telegram\.me|m\.me)/\S*", re.I)

PROFANITY = [
    "fuck", "fucking", "shit", "bitch", "bastard", "asshole", "motherfucker",
    # Banglish / Bangla insults commonly seen in BD forums
    "shala", "harami", "haramjada", "kuttar bacha", "kuttar baccha", "chudi",
    "শালা", "হারামি", "হারামজাদা", "কুত্তার বাচ্চা", "মাগি",
]
_PROF_RE = re.compile(r"(?<![\wঀ-৿])(?:" + "|".join(re.escape(w) for w in sorted(PROFANITY, key=len, reverse=True))
                      + r")(?![\wঀ-৿])", re.I)


def _strip_phones(text: str) -> str:
    # Match on a copy with Bangla digits normalised, then cut those spans out of the original.
    normalised = text.translate(BN_DIGITS)
    out, last = [], 0
    for m in PHONE_RE.finditer(normalised):
        out.append(text[last:m.start()])
        out.append("[phone removed]")
        last = m.end()
    out.append(text[last:])
    return "".join(out)


def clean_text(text: str) -> str:
    if not text:
        return text
    text = EMAIL_RE.sub("[email removed]", text)
    text = URL_RE.sub("[link removed]", text)
    text = _strip_phones(text)
    text = _PROF_RE.sub(lambda m: "*" * len(m.group(0)), text)
    return text.strip()

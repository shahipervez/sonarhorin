"""Web push sending. Public API for other apps (e.g. job alerts' `webpush` channel):

    from apps.push.services import send_push
    send_push(user, "New job: Junior Dev at bKash", "Dhaka · ৳40k", "/jobs/123")

Returns the number of devices the notification was delivered to. Never raises for delivery problems; when VAPID keys
are not configured it logs and returns 0, so callers don't need their own feature flag (use `push_enabled()`
if you want to skip work up-front).
"""
import json
import logging
from urllib.parse import urlparse

from django.conf import settings
from django.db.models import F
from django.utils import timezone

from .models import PushSubscription

log = logging.getLogger("apps.push")

MAX_FAILURES = 5  # transient errors in a row before a subscription is dropped


def push_enabled() -> bool:
    return bool(settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY)


def endpoint_allowed(endpoint: str) -> bool:
    """Only HTTPS endpoints on known browser push services (the server POSTs there → SSRF guard)."""
    try:
        u = urlparse(endpoint)
    except ValueError:
        return False
    host = (u.hostname or "").lower()
    if u.scheme != "https" or not host:
        return False
    return any(host == s or host.endswith("." + s) for s in settings.PUSH_ALLOWED_HOST_SUFFIXES)


def _payload(title, body, url, extra=None):
    data = {"title": str(title)[:120], "body": str(body)[:300], "url": url or "/"}
    if extra:
        data.update(extra)
    return json.dumps(data, ensure_ascii=False)


def send_to_subscription(sub: PushSubscription, payload: str, ttl: int = 86400) -> bool:
    from pywebpush import WebPushException, webpush

    try:
        webpush(
            subscription_info=sub.as_subscription_info(),
            data=payload,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_SUBJECT},
            ttl=ttl,
            timeout=10,
        )
    except WebPushException as e:
        status = getattr(getattr(e, "response", None), "status_code", None)
        if status in (404, 410):  # subscription expired / unsubscribed in the browser
            log.info("push subscription gone (%s) — deleting id=%s", status, sub.pk)
            sub.delete()
        else:
            PushSubscription.objects.filter(pk=sub.pk).update(failures=F("failures") + 1)
            if sub.failures + 1 >= MAX_FAILURES:
                sub.delete()
            log.warning("push failed id=%s status=%s", sub.pk, status)
        return False
    except Exception as e:  # network errors etc. — never break the caller
        log.warning("push error id=%s err=%s", sub.pk, e.__class__.__name__)
        return False
    PushSubscription.objects.filter(pk=sub.pk).update(failures=0, last_success_at=timezone.now())
    return True


def send_push(user, title: str, body: str, url: str = "/", **extra) -> int:
    """Send a notification to every subscribed device of `user`. Returns how many deliveries succeeded."""
    if not push_enabled():
        log.info("web push not configured (VAPID keys missing) — skipped push for user=%s", getattr(user, "pk", user))
        return 0
    payload = _payload(title, body, url, extra)
    sent = 0
    for sub in list(PushSubscription.objects.filter(user=user)):
        sent += send_to_subscription(sub, payload)
    return sent

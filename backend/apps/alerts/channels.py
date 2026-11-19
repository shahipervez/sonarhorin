"""Pluggable delivery channels for job alerts.

Each channel turns ``(alert, jobs, message)`` into one outgoing message and returns a :class:`Result`::

    class MyChannel(Channel):
        name = "webpush"
        def available(self, alert): ...           # False -> deliveries are recorded as "skipped"
        def send(self, alert, jobs, message): ... # return Result(ok=True) or Result(ok=False, error="...")

    register(MyChannel())                          # replaces the built-in channel with the same name

``message`` is the dict from :func:`apps.alerts.messages.build` (subject / text / title / short / url).
Channels must not raise for expected failures; they return ``Result(ok=False, error=...)`` instead.
"""
import logging
import os
from dataclasses import dataclass

import requests
from django.conf import settings
from django.core.mail import send_mail

log = logging.getLogger("apps.alerts")
TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


@dataclass
class Result:
    ok: bool
    error: str = ""
    skipped: bool = False


class Channel:
    name = ""

    def available(self, alert) -> bool:
        return True

    def send(self, alert, jobs, message) -> Result:  # pragma: no cover - interface
        raise NotImplementedError


class EmailChannel(Channel):
    """Django ``send_mail`` (console backend in development, SMTP via EMAIL_* env in production)."""

    name = "email"

    def available(self, alert):
        return bool(alert.user.email)

    def send(self, alert, jobs, message):
        sender = os.getenv("ALERTS_FROM_EMAIL") or settings.DEFAULT_FROM_EMAIL
        try:
            send_mail(message["subject"], message["text"], sender, [alert.user.email], fail_silently=False)
            return Result(ok=True)
        except Exception as exc:
            log.warning("alert email failed for alert %s: %s", alert.id, exc)
            return Result(ok=False, error=str(exc)[:300])


def telegram_token():
    return getattr(settings, "TELEGRAM_BOT_TOKEN", "") or os.getenv("TELEGRAM_BOT_TOKEN", "")


class TelegramChannel(Channel):
    """Telegram Bot API. Needs TELEGRAM_BOT_TOKEN and the user's chat id (they must /start the bot first)."""

    name = "telegram"

    def available(self, alert):
        return bool(telegram_token() and alert.telegram_chat_id)

    def send(self, alert, jobs, message):
        try:
            r = requests.post(TELEGRAM_API.format(token=telegram_token()), timeout=15, json={
                "chat_id": alert.telegram_chat_id, "text": message["text"][:4000], "disable_web_page_preview": True})
            if r.status_code != 200:
                return Result(ok=False, error=f"Telegram HTTP {r.status_code}: {r.text[:200]}")
            return Result(ok=True)
        except Exception as exc:
            log.warning("telegram alert failed for alert %s: %s", alert.id, exc)
            return Result(ok=False, error=str(exc)[:300])


class WebPushChannel(Channel):
    """Stub: the Integration team plugs real Web Push (VAPID) in here.

    To implement: store each browser's PushSubscription per user, then subclass this, override ``available`` to
    check the user has a subscription and ``send`` to call pywebpush with ``message["title"]``, ``message["short"]``
    and ``message["url"]`` as the payload. Register it with ``apps.alerts.channels.register(MyWebPush())``
    (e.g. from your app's ``AppConfig.ready``). Until then every webpush delivery is recorded as ``skipped``.
    """

    name = "webpush"

    def available(self, alert):
        return False

    def send(self, alert, jobs, message):
        return Result(ok=False, skipped=True, error="Web push not configured")


REGISTRY: dict[str, Channel] = {}


def register(channel: Channel):
    REGISTRY[channel.name] = channel


def get(name) -> Channel | None:
    return REGISTRY.get(name)


for _c in (EmailChannel(), TelegramChannel(), WebPushChannel()):
    register(_c)

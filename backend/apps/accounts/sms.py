"""Pluggable SMS sending for OTP codes.

Choose the backend with SMS_BACKEND (console | sslwireless | bulksmsbd | alphasms), credentials with SMS_API_KEY /
SMS_SENDER_ID (and SMS_API_URL to override the endpoint). Every adapter receives the number in E.164
('+8801XXXXXXXXX') and converts it to what the provider expects.

Parameter names follow each provider's public API documentation as of 2026; ones we could not verify against a live
account are marked TODO — confirm them with the provider dashboard before going live.
"""
import logging

import requests
from django.conf import settings

from .phone import mask

log = logging.getLogger("apps.sms")


class SMSError(Exception):
    """The provider rejected the message or could not be reached."""


class BaseSMSBackend:
    name = "base"
    default_url = ""

    def __init__(self):
        self.api_key = settings.SMS_API_KEY
        self.sender_id = settings.SMS_SENDER_ID
        self.url = settings.SMS_API_URL or self.default_url
        self.timeout = settings.SMS_TIMEOUT

    def send(self, phone: str, message: str) -> None:  # pragma: no cover - interface
        raise NotImplementedError

    # helpers -------------------------------------------------------------------------------------
    def _require_config(self):
        if not self.api_key or not self.url:
            raise SMSError(f"SMS backend '{self.name}' is not configured (SMS_API_KEY / SMS_SENDER_ID).")

    def _post(self, **kw):
        try:
            r = requests.post(self.url, timeout=self.timeout, **kw)
        except requests.RequestException as e:
            raise SMSError(f"{self.name}: network error: {e.__class__.__name__}") from e
        if r.status_code >= 400:
            raise SMSError(f"{self.name}: HTTP {r.status_code}")
        try:
            return r.json()
        except ValueError:
            return {"raw": r.text[:500]}


class ConsoleBackend(BaseSMSBackend):
    """Development only: writes the SMS to the log instead of sending it."""

    name = "console"

    def send(self, phone, message):
        if not settings.DEBUG:
            log.warning("SMS_BACKEND=console while DEBUG=False — OTPs are NOT being delivered to users.")
        log.info("[console SMS] to=%s message=%s", phone, message)


class SSLWirelessBackend(BaseSMSBackend):
    """SSL Wireless ISMS 'send-sms' JSON API (v3).

    Docs: https://sslwireless.com/ (API docs are shared with account holders).
    TODO: verify field names (api_token / sid / msisdn / sms / csms_id) against your account's API document.
    """

    name = "sslwireless"
    default_url = "https://smsplus.sslwireless.com/api/v3/send-sms"

    def send(self, phone, message):
        self._require_config()
        import uuid

        data = self._post(json={
            "api_token": self.api_key,
            "sid": self.sender_id,                 # SSL calls the approved sender/masking id "SID"
            "msisdn": phone.lstrip("+"),            # 8801XXXXXXXXX
            "sms": message,
            "csms_id": uuid.uuid4().hex[:20],       # TODO: verify max length of the client message id
        })
        # Success looks like {"status": "SUCCESS", "status_code": 200, ...}
        if str(data.get("status", "")).upper() != "SUCCESS":
            raise SMSError(f"sslwireless: {data.get('error_message') or data.get('status') or 'rejected'}")


class BulkSMSBDBackend(BaseSMSBackend):
    """BulkSMSBD HTTP API. Docs: https://bulksmsbd.net/api-documentation (login required)."""

    name = "bulksmsbd"
    default_url = "https://bulksmsbd.net/api/smsapi"

    def send(self, phone, message):
        self._require_config()
        data = self._post(data={
            "api_key": self.api_key,
            "senderid": self.sender_id,
            "number": phone.lstrip("+"),            # TODO: verify whether 880-prefixed or 01-local form is preferred
            "message": message,
            "type": "text",                         # TODO: verify — 'unicode' may be required for Bangla text
        })
        # Documented success code is 202 ("SMS Submitted Successfully").
        if str(data.get("response_code")) != "202":
            raise SMSError(f"bulksmsbd: {data.get('error_message') or data.get('response_code') or 'rejected'}")


class AlphaSMSBackend(BaseSMSBackend):
    """Alpha SMS (alpha.net.bd) HTTP API. Docs: https://sms.net.bd/api"""

    name = "alphasms"
    default_url = "https://api.sms.net.bd/sendsms"

    def send(self, phone, message):
        self._require_config()
        payload = {
            "api_key": self.api_key,
            "msg": message,
            "to": phone.lstrip("+"),                # 8801XXXXXXXXX
        }
        if self.sender_id:
            payload["sender_id"] = self.sender_id   # TODO: verify param name; only needed for approved masking
        data = self._post(data=payload)
        # Success: {"error": 0, "msg": "Request successfully submitted", ...}
        if str(data.get("error")) != "0":
            raise SMSError(f"alphasms: {data.get('msg') or 'rejected'}")


BACKENDS = {
    "console": ConsoleBackend,
    "sslwireless": SSLWirelessBackend,
    "bulksmsbd": BulkSMSBDBackend,
    "alphasms": AlphaSMSBackend,
}


def get_backend():
    key = (settings.SMS_BACKEND or "console").lower()
    cls = BACKENDS.get(key)
    if cls is None:
        raise SMSError(f"Unknown SMS_BACKEND '{key}'. Use one of: {', '.join(BACKENDS)}")
    return cls()


def send_sms(phone: str, message: str) -> None:
    """Send `message` to an E.164 BD number using the configured backend. Raises SMSError on failure."""
    backend = get_backend()
    backend.send(phone, message)
    log.info("sms sent backend=%s to=%s", backend.name, mask(phone))

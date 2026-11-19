# Third-party integrations

Every integration is **off until its env vars are set** and the site works without any of them. Backend vars go in
`backend/.env` (template: `backend/.env.example`), frontend vars in `frontend/.env` (template: `frontend/.env.example`;
`VITE_*` vars are baked in at build time, so rebuild after changing them).

| Feature | Backend vars | Frontend vars | When unset |
|---|---|---|---|
| Google login | `GOOGLE_CLIENT_ID` | `VITE_GOOGLE_CLIENT_ID` | button hidden, GIS script never loaded, `/api/auth/google/` → 503 |
| Phone OTP | `SMS_BACKEND`, `SMS_API_KEY`, `SMS_SENDER_ID`, `SMS_API_URL`, `OTP_*` | — | `console` backend: code is written to the server log (dev only) |
| Web push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | — | `send_push()` logs and returns 0; subscribe → 503 |
| Sentry | `SENTRY_DSN` (+ `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, `SENTRY_TRACES_SAMPLE_RATE`) | `VITE_SENTRY_DSN` (+ `_ENVIRONMENT`, `_RELEASE`, `_TRACES_SAMPLE_RATE`) | not initialised; the `@sentry/react` chunk is never downloaded |
| Analytics | — | `VITE_POSTHOG_KEY` (+ `VITE_POSTHOG_HOST`) **or** `VITE_PLAUSIBLE_DOMAIN` (+ `VITE_PLAUSIBLE_SRC`) | no script loaded |
| Payments | `SSLCZ_STORE_ID`, `SSLCZ_STORE_PASS`, `SSLCZ_SANDBOX`, `API_PUBLIC_URL`, `PREMIUM_*_BDT` | — | `/api/payments/init/` → 503 |

All backend settings live in one block at the end of `backend/config/settings.py` ("Third-party integrations").

---

## 1. Google login

1. Google Cloud Console → *APIs & Services* → *Credentials* → **Create credentials → OAuth client ID** → *Web application*.
2. **Authorised JavaScript origins**: `http://localhost:5173`, `https://sonarhorin.com` (every origin that shows the button).
   No redirect URI is needed (popup / ID-token flow).
3. Configure the OAuth consent screen (app name, logo, support email; scopes `openid email profile` only).
4. Set the same client ID in both places:
   ```
   backend/.env   GOOGLE_CLIENT_ID=1234-abc.apps.googleusercontent.com
   frontend/.env  VITE_GOOGLE_CLIENT_ID=1234-abc.apps.googleusercontent.com
   ```
   (Backend accepts a comma-separated list if you later add an Android/iOS client.)

**Flow:** the Login/Register pages load `https://accounts.google.com/gsi/client` and render Google's button
(`src/integrations/GoogleButton.jsx`). Google returns an ID token (`credential`) which the SPA posts to
`POST /api/auth/google/ {credential}`. The backend verifies it with
`google.oauth2.id_token.verify_oauth2_token(token, Request(), audience=GOOGLE_CLIENT_ID)` (signature, expiry,
audience, issuer), requires `email_verified`, then:

* finds the user by `google_sub`, else by email (and links `google_sub`), else creates a new user with an unusable password;
* responds exactly like `/api/auth/login/`: `{user, access}` + the HttpOnly `sh_refresh` cookie (201 when created).

## 2. Phone OTP login (Bangladesh)

Endpoints:

| | Body | Response |
|---|---|---|
| `POST /api/auth/otp/request/` | `{phone}` | `{detail:"sent", phone, expires_in, resend_in}` / 400 bad number / 429 cooldown (`retry_after`, `Retry-After`) or throttled / 503 SMS failure |
| `POST /api/auth/otp/verify/` | `{phone, code, full_name?}` | session (same as login; 201 when a new account is created) / 400 `code: invalid|expired` (+`attempts_left`) / 429 `code: locked` |

* Numbers accepted: `01XXXXXXXXX`, `8801XXXXXXXXX`, `+8801XXXXXXXXX`, with spaces/dashes and Bangla digits; stored as
  E.164 in `User.phone_e164` (`apps/accounts/phone.py`).
* Code: 6 digits from `secrets`, stored only as a salted HMAC-SHA256 (keyed with `SECRET_KEY`) in `PhoneOTP`.
* Expiry `OTP_TTL_SECONDS` (300), max `OTP_MAX_ATTEMPTS` (5) wrong tries per code, resend cooldown
  `OTP_RESEND_COOLDOWN` (60 s); requesting a new code invalidates the old one.
* Throttles: `OTP_PHONE_RATE` (5/hour per number), `OTP_IP_RATE` (20/hour per IP), `OTP_VERIFY_IP_RATE` (30/hour per IP).
  Behind a proxy set `TRUST_X_FORWARDED_FOR=True` so the client IP is correct. Use Redis (`REDIS_URL`) in production so
  throttles are shared across workers.
* Unknown verified number → new account (`OTP_ALLOW_SIGNUP=False` to require registering first). An existing account
  whose legacy `phone` matches is logged in and its number marked verified.

### SMS providers (`apps/accounts/sms.py`)

| `SMS_BACKEND` | Provider | `SMS_API_KEY` | `SMS_SENDER_ID` | Default URL |
|---|---|---|---|---|
| `console` | none — logs the SMS (**dev only**, warns if `DEBUG=False`) | – | – | – |
| `sslwireless` | SSL Wireless ISMS | API token | SID | `https://smsplus.sslwireless.com/api/v3/send-sms` |
| `bulksmsbd` | BulkSMSBD | api_key | approved sender id | `https://bulksmsbd.net/api/smsapi` |
| `alphasms` | Alpha SMS (sms.net.bd) | api_key | optional masking id | `https://api.sms.net.bd/sendsms` |

Steps: open an account with the provider, get a **sender ID / masking** approved (BTRC rules apply — non-masked numbers
work for testing), top up balance, then set `SMS_BACKEND`, `SMS_API_KEY`, `SMS_SENDER_ID`. Use `SMS_API_URL` if the
provider gives you a different endpoint. Parameter names that could not be verified against a live account are marked
`TODO` in `sms.py` — check them against your provider's API document before launch. Adding a provider = a subclass with
`send(phone, message)` plus an entry in `BACKENDS`.

## 3. Web push (job alerts)

1. Generate a VAPID key pair (base64url, raw):
   ```bash
   backend/.venv/bin/python -c "import base64;from cryptography.hazmat.primitives.asymmetric import ec;from cryptography.hazmat.primitives import serialization as s;k=ec.generate_private_key(ec.SECP256R1());b=lambda x:base64.urlsafe_b64encode(x).rstrip(b'=').decode();print('VAPID_PRIVATE_KEY='+b(k.private_numbers().private_value.to_bytes(32,'big')));print('VAPID_PUBLIC_KEY='+b(k.public_key().public_bytes(s.Encoding.X962,s.PublicFormat.UncompressedPoint)))"
   ```
2. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:you@sonarhorin.com`. Never rotate the keys
   casually — existing browser subscriptions are bound to the public key.

API (`apps.push`): `GET /api/push/vapid-key/` → `{enabled, public_key}`; `POST /api/push/subscribe/` with
`PushSubscription.toJSON()` (`{endpoint, keys:{p256dh, auth}}`); `DELETE /api/push/subscribe/ {endpoint}` (no
endpoint = remove all of the user's devices). Endpoints must be HTTPS on a known push service
(`PUSH_ALLOWED_HOST_SUFFIXES`) because the server POSTs to them. Max 10 devices per user.

Server side, other apps call:
```python
from apps.push.services import send_push, push_enabled
send_push(user, "New job: Junior Dev at bKash", "Dhaka · ৳40k", "/jobs/123")   # → number of devices reached
```
It never raises for delivery problems; 404/410 subscriptions are deleted, others dropped after 5 consecutive failures.
Payload delivered to the service worker: `{"title", "body", "url"}` JSON — the PWA service worker should show it with
`self.registration.showNotification(title, {body, data: {url}})` and open `url` on `notificationclick`.

Frontend: `src/push.js` — `getPushState()`, `enablePush()` (call from a click), `disablePush()`. It uses
`navigator.serviceWorker.ready`, so it needs the PWA service worker (vite-plugin-pwa) to be registered. iOS needs the site
installed to the home screen (16.4+).

## 4. Monitoring & analytics

**Sentry** — create two projects (Django + React) at sentry.io, copy the DSNs:
`SENTRY_DSN` (backend; `sentry-sdk[django]`, `send_default_pii=False`) and `VITE_SENTRY_DSN` (frontend; `@sentry/react`
loaded with a dynamic `import()` from `src/integrations/monitoring.js` into its own `sentry` chunk). Tracing is off
unless `*_TRACES_SAMPLE_RATE` > 0. `captureException(err)` from `monitoring.js` is a no-op without a DSN.

**PostHog** — project API key → `VITE_POSTHOG_KEY`; `VITE_POSTHOG_HOST=https://eu.i.posthog.com` for the EU cloud.
Loaded with autocapture and session recording off (light for slow connections). **Plausible** — add the site in
Plausible → `VITE_PLAUSIBLE_DOMAIN=sonarhorin.com` (`VITE_PLAUSIBLE_SRC` for self-hosted). If both are set PostHog is used.
`trackEvent(name, props)` sends a custom event to whichever is active.

### Content-Security-Policy

`frontend/nginx.conf` currently ships `script-src 'self'` / `connect-src 'self' https://api.github.com`, which blocks
these providers. When you enable one, extend the CSP accordingly:

| Provider | Add to |
|---|---|
| Google | `script-src https://accounts.google.com/gsi/client`; `frame-src https://accounts.google.com/gsi/`; `connect-src https://accounts.google.com/gsi/`; `style-src https://accounts.google.com/gsi/style` |
| Sentry | `connect-src https://*.ingest.sentry.io https://*.ingest.us.sentry.io` (or your org's ingest host) |
| PostHog | `script-src https://us-assets.i.posthog.com`; `connect-src https://us.i.posthog.com` (eu-… for EU) |
| Plausible | `script-src https://plausible.io`; `connect-src https://plausible.io` |

Google sign-in in a popup also needs `Cross-Origin-Opener-Policy: same-origin-allow-popups` on the SPA pages (not the API).

## 5. Payments — SSLCommerz (premium, optional)

1. Register a sandbox store at <https://developer.sslcommerz.com/registration/> → you get a Store ID and Store Password.
2. Set `SSLCZ_STORE_ID`, `SSLCZ_STORE_PASS`, `SSLCZ_SANDBOX=True`, `API_PUBLIC_URL` (public HTTPS origin of the API —
   for local testing use a tunnel such as `cloudflared`/`ngrok`), optionally `PREMIUM_MONTHLY_BDT`/`PREMIUM_YEARLY_BDT`.
3. In the SSLCommerz merchant panel set the **IPN URL** to `{API_PUBLIC_URL}/api/payments/ipn/`.
4. Go live: get the live store approved, set `SSLCZ_SANDBOX=False` (uses `https://securepay.sslcommerz.com`).

| Endpoint | Who | What |
|---|---|---|
| `GET /api/payments/plans/` | anyone | `{enabled, sandbox, plans[]}` |
| `POST /api/payments/init/ {plan}` | logged-in user | creates a `Payment` (pending), opens an SSLCommerz session → `{tran_id, gateway_url}`; redirect the browser there |
| `POST /api/payments/ipn/` | SSLCommerz server | re-validates `val_id` with the **validator API** (`/validator/api/validationserverAPI.php`), checks tran_id + amount + currency, marks `valid`. Idempotent: an already-valid payment is never re-processed. Risk-flagged (`risk_level=1`) payments stay `pending` for manual review |
| `POST /api/payments/return/<success\|fail\|cancel>/` | user's browser | validates (if success) and redirects to `{SITE_URL}/premium/result?status=…&tran_id=…` |
| `GET /api/payments/<tran_id>/` | owner | payment status |

Granting premium is not implemented yet: connect a receiver to `apps.payments.services.payment_validated`
(`kwargs: payment`), which fires exactly once per validated payment. The frontend checkout UI and the
`/premium/result` page are still to do. Sandbox test cards/wallets: see SSLCommerz developer docs.

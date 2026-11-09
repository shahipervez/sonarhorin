# Sonarhorin — Security

| Area | What's in place |
|---|---|
| **Sessions** | Access JWT lives 15 min, **in memory only**. Refresh JWT lives 7 days in an **HttpOnly, Secure, SameSite=Strict** cookie scoped to `/api/auth/`. Refresh tokens **rotate** on every use; the old one is **blacklisted** (replay → 401). Logout and password change revoke tokens. |
| **CSRF** | The cookie is only sent to `/api/auth/`, is SameSite=Strict, and `/refresh/` additionally requires the `X-Requested-With: sonarhorin` header (a cross-site form can't set it). All other APIs use the Bearer header, not cookies. |
| **Brute force** | 5 failed logins per email (20 per IP) → 15-minute lock. DRF scoped throttles: login 10/min, register 8/h, AI 60/h, uploads 40/h. nginx adds per-IP limits. |
| **Passwords** | Argon2id hashing (old hashes upgrade on login); Django validators: length ≥ 8, common, numeric-only, similarity to profile; strength meter on sign-up. |
| **Uploads** | Extension allow-list **and magic-byte sniffing** (`%PDF-`, DOCX zip with `word/document.xml`, NUL-free text), 5 MB cap, zip-bomb guard, random sanitised filenames. |
| **Private files** | CVs, resumes and pitch decks are stored in `PRIVATE_MEDIA_ROOT`, **never served by `/media/`**; downloads go through owner-checked views. Every career object is scoped to its owner (others get 404). Resume delete removes the file. |
| **AI / prompt injection** | User text (CV, job post, answers, chat) is wrapped in tagged blocks with breakout tags stripped; every system prompt carries a guard telling Claude to treat it as data. Output is schema-normalised and length-capped; tailored CVs pass the truth guard. Inputs truncated (`AI_MAX_INPUT_CHARS`). |
| **XSS** | React escaping everywhere; chat Markdown is rendered to React nodes (no `innerHTML`). CSP on the SPA (`script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`); API responses send `default-src 'none'`. |
| **Transport & headers** | HSTS (1 year, preload), SSL redirect, secure cookies, `nosniff`, `X-Frame-Options: DENY`, strict Referrer-Policy, COOP, Permissions-Policy (mic only for voice practice). |
| **Config** | The app refuses to start with `DEBUG=False` and a weak/default `SECRET_KEY`. `manage.py check --deploy` passes clean. Secrets come from `.env` (never committed). |
| **Logging** | `security` logger records registrations, failed logins, lockouts and password changes (no passwords/tokens). |

**Before going live:** set a 60+ char `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, real `ALLOWED_HOSTS`/`CORS_ALLOWED_ORIGINS`,
a strong Postgres password, HTTPS in front of nginx, and back up the `pgdata` + `private` volumes.

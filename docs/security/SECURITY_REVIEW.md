# Sonarhorin security review

Scope: `backend/config/settings.py`, auth (`apps/accounts`), uploads (`apps/core/uploads.py`), object-level access in
`apps/jobs` and the other apps, throttling, secrets in the repo. Fake-job detection is covered at the end.

Severity: **Critical** (fix before next deploy), **High**, **Medium**, **Low**, **Info**.

## Fixed in this change

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| F1 | High | **Uploaded CVs and pitch decks were committed to git** (`backend/private/`: 114 files, CV .txt/.pdf and decks). Most are test artefacts, but a few PDFs look like real uploads. The test suite was writing uploads into `backend/private/`. | Untracked `backend/private/` (`git rm --cached`) and added it to `.gitignore`. `manage.py test` now points `PRIVATE_MEDIA_ROOT` at a temp dir. **The files are still in git history:** see O1. |
| F2 | High | `POST /api/jobs/scraper/run/` (and `/scrape/`) was `AllowAny`. Any anonymous client could start unlimited outbound scraping runs (a DoS / IP-ban amplifier), with an unbounded `limit` and arbitrary `queries`. | It now needs a signed-in user and has its own `scrape` throttle (4/hour). `limit` is clamped to 1–10 and `queries` to at most 5 strings of 80 characters. `fetch_details` is staff-only. |
| F3 | High | `CORS_ALLOW_ALL_ORIGINS = True` was hard-coded, together with `CORS_ALLOW_CREDENTIALS = True`. Every origin gets reflected, so any website can make credentialed calls and read the responses. | It is now `env_bool("CORS_ALLOW_ALL_ORIGINS", DEBUG)`. Production deploys that do not set it fall back to `CORS_ALLOWED_ORIGINS`. fly.toml and render.yaml still set it to `true` explicitly: see O2. |
| F4 | Medium | `ALLOWED_HOSTS = ["*"]` was hard-coded, so the `DJANGO_ALLOWED_HOSTS` / `ALLOWED_HOSTS` env vars in `.env.example` and render.yaml were ignored (Host-header injection into absolute URLs and password-reset style links). | It now reads `DJANGO_ALLOWED_HOSTS` or `ALLOWED_HOSTS` and falls back to `*`. |
| F5 | Medium | AI and upload endpoints had only the global 3000/hour user limit: `POST /api/cv/analyze/` (file parse plus an LLM call) and interview start/answer (an LLM call per answer). That is an LLM cost-abuse risk. | They now use the `upload` (40/hour) and `ai` (60/hour) scopes through `apps.core.throttles.STRICT`. |
| F6 | Medium | No throttle scopes existed for the upcoming OTP / social login. | Added `otp` (5/hour), `otp_verify` (10/hour), `social_login` (20/hour), `report` (20/day) and `scrape` (4/hour). The Integration teammate should put `throttle_classes = STRICT` and `throttle_scope = "otp"` etc. on those views. |
| F7 | Low | CSRF / session cookie flags were left at their defaults. | Set `CSRF_COOKIE_HTTPONLY`, `SameSite=Lax` on the session and CSRF cookies, `FILE_UPLOAD_PERMISSIONS = 0o640` and `DATA_UPLOAD_MAX_NUMBER_FIELDS`. |

Already in good shape (verified, nothing changed):
- **Security headers:** `SECURE_*` with HSTS (1 year, subdomains, preload), an SSL redirect, secure session and CSRF cookies when `DEBUG=False`, nosniff, referrer policy, COOP, `X-Frame-Options: DENY`, and a strict API CSP in `apps.core.security`.
- **Secret key:** refuses to start in production with the dev `SECRET_KEY`.
- **Passwords:** all four Django validators (minimum length 8) plus Argon2.
- **Login:** `login` 10/min plus a per-email and per-IP lockout. `register` is limited to 8/hour.
- **Uploads (`check_upload`):** a 5 MB cap, an extension allow-list, magic-byte checks for PDF and DOCX, a zip-bomb guard for DOCX, a NUL check for TXT, random storage names and private storage with no public URL. Pitch decks: PDF magic bytes and 10 MB.
- **IDOR:**
  - `ApplicationActionView` filters by `user=request.user`.
  - `EmployerApplicantsView` filters by `job__company__employer_users=request.user`.
  - CV, interviews, career, startups and assessment sessions are all scoped to their owner.
  - `EmployerResultsView` checks staff or creator.
  - Network DMs need an accepted connection.
- **Secrets:** no API keys, tokens or private keys found in tracked files. The `.env.example` values are empty, and `frontend/.env.production` holds only the public API URL.

## Open findings (not fixed: need a product or deploy decision)

| # | Severity | Finding | Recommendation |
|---|----------|---------|----------------|
| O1 | **High** | CV and pitch-deck files (`backend/private/**`) are still in **git history**. | If any of them belong to real users, purge them with `git filter-repo --path backend/private --invert-paths`, force-push, and tell the affected users. Rotate anything else that was committed alongside them. |
| O2 | **High** | fly.toml and render.yaml set `CORS_ALLOW_ALL_ORIGINS=true` with credentials. | Set `CORS_ALLOW_ALL_ORIGINS=false` and `CORS_ALLOWED_ORIGINS=https://<frontend-domain>` in the deploy configs once the production frontend origin is fixed. Owner: whoever owns deploys. |
| O3 | **High** | The refresh token is returned in the JSON body, and the SPA stores both the access and refresh tokens in `localStorage` (`frontend/src/api.js`). Any XSS gives an attacker a 7-day session. The comment in `api.js` says otherwise, and `accounts.tests.test_refresh_token_only_in_httponly_cookie` currently fails. | Rely on the HttpOnly cookie only: serve the API first-party (`api.<frontend-domain>`) so SameSite cookies work, then drop `refresh` from the body and from localStorage. The Integration teammate is handling the auth change. |
| O4 | Medium | fly.toml and render.yaml set `COOKIE_SECURE=false` and `SECURE_SSL_REDIRECT=false`. TLS is terminated at the platform edge, and `SECURE_PROXY_SSL_HEADER` is already set. | Set `COOKIE_SECURE=true` (both platforms are HTTPS-only). Keep the redirect off only if the platform already forces HTTPS (fly `force_https = true`). |
| O5 | Medium | Private efficiency tests (`is_public=False`) can be viewed and started by sequential `pk` through `/api/assessments/efficiency/<pk>/` and `/start/`, which bypasses the invite code. | Require `is_public` or a matching `invite_code` in `EfficiencyDetailView` and `EfficiencyStartView`. This was left alone because it changes the frontend flow. |
| O6 | Medium | `ParseCVView` (anonymous) calls `parser.ai_fill`, an LLM call, for anyone at 15/hour per IP. Behind `TRUST_X_FORWARDED_FOR=true` the IP comes from the client-controlled `X-Forwarded-For`, so that limit is easy to get around on fly. | Use the right-most trusted hop (e.g. `Fly-Client-IP`) in `client_ip()`, and skip the AI fill for anonymous users. |
| O7 | Low | `FeaturedCompaniesView` and `CompanyMini` build file paths from `slug`. Admin-only input today, but `os.path.join` on user-controlled slugs would allow traversal. | Keep slug writes admin-only, or validate it with `slugify`. |
| O8 | Low | No CSP for the SPA in this repo (the API CSP is done; the SPA's CSP is said to live in nginx `deploy/`, which is not used on fly or render). | Add a CSP header at the static host (Vercel/Netlify headers file). |
| O9 | Info | `EmployerApplicantsView` returns the candidate's phone and email. That is intended, but it should be logged for audit. | Add an audit log entry per employer view. |

## Fake / scam job detector (`apps/jobs/trust.py`)

- **How it works:** rule-based, bilingual (Bangla and English, including Bangla digits) and works offline. It flags:
  - fee, deposit or registration requests, and bKash / Nagad / Rocket payments (ignored when the employer *is* bKash or Nagad)
  - WhatsApp / Telegram / IMO-only contact, and personal Gmail / Yahoo addresses
  - an unrealistic fresher salary or daily pay
  - "100% job guarantee", task / like-video scams, MLM
  - requests for an OTP, PIN or card details, or for an NID over chat
  - overseas jobs that charge visa fees, "no interview" posts, and missing company info
  - 3 or more open user reports

  Disclaimers like "no fee" / "কোনো ফি লাগবে না" are stripped first, so they don't trigger the money rule.
- **Levels:** risk ≥ 55 → `danger`, ≥ 20 → `caution`. A partner company with no reasons → `verified`, otherwise `ok`. `trust_score` = 100 − risk.
- **AI (optional):** `ai_refine` wraps the post with `ai.untrusted("job", …)`. The model can only add reasons and lift `ok` / `verified` to `caution`. It never lowers a verdict and never verifies a job.
- **When it runs:** on every `Job.save()` that touches content (scrapers and `import_jobs` included). `python manage.py check_job_trust [--all] [--ai] [--job ID]` backfills.
- **Reporting:** `POST /api/jobs/report-scam/ {job_id, reason, details}`. Signed-in users only, one report per user per job, `report` throttle 20/day. Staff resolve reports in the admin, and resolved reports stop counting.
- **Limits:** heuristics can be evaded, for example with images of text or links to external forms. Review `caution` jobs in the admin (`trust_level` filter) and treat this as triage, not proof.

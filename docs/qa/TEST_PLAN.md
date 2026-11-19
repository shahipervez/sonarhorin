# Sonarhorin — Test Plan

Owner: QA. Scope: Django 5 + DRF API (`backend/`) and React 18 + Vite 5 SPA (`frontend/`).

## 1. Strategy

| Layer | Tool | What it covers | Where |
|---|---|---|---|
| Backend API / unit | Django `TestCase` + DRF `APIClient` | Endpoints, permissions, business rules (apply channels, duplicates, lockout, token rotation) | `backend/apps/*/tests.py`, `backend/apps/*/test_*.py` |
| Frontend unit | Vitest + Testing Library + jsdom | Pure helpers (`utils`, `track`, `i18n`, `money`/`daysLeft`/`MATCH`, `storyLink`) and render smoke tests (Logo, Footer) | `frontend/src/__tests__/*.test.{js,jsx}` |
| End-to-end | Playwright (Chromium) | Real browser against Vite + real seeded API: track gate, Jobs, Internships, Login, 404, auth redirect, EN/BN toggle, mobile overflow | `frontend/e2e/*.spec.js` |
| Manual | Checklist (§4) | New features in flight, visuals/animation, devices, real OAuth/SMS | this file |

Principles
- **Test pyramid**: most logic in backend + unit tests (fast, deterministic); E2E only for critical user journeys.
- **Bilingual-aware**: E2E selectors accept English *or* Bangla (`either(en, bn)`) and prefer roles/labels. Note: the codebase mixes precomposed/decomposed Bangla letters (e.g. `য়` U+09DF vs `য`+`়`), so match Bangla loosely (prefix/regex), never by exact long strings.
- **Known bugs stay visible but don't block CI**: they are written as tests of the *correct* behaviour and marked `@unittest.expectedFailure` (backend) or `it.fails` (Vitest). When the bug is fixed the test reports "unexpected success" → remove the marker.
- **No side effects on shared servers**: E2E never registers users or submits real failed logins (the backend locks an IP after 20 failures); such flows are stubbed with `page.route`.
- Unit tests run with `TZ=UTC` (set in `vitest.config.js`); timezone-specific tests switch `process.env.TZ` themselves.

## 2. How to run

### Backend
```bash
cd backend
.venv/bin/python manage.py test            # whole suite (from a worktree use the main checkout venv)
.venv/bin/python manage.py test apps.jobs  # one app
.venv/bin/python manage.py test apps.jobs.test_api.ApplyFlowTests.test_duplicate_apply_rejected
```
Uses a throw-away test DB; `ANTHROPIC_API_KEY` is overridden to empty in AI-touching tests so no network calls happen.

### Frontend unit
```bash
cd frontend
npm install
npm test            # vitest run (CI mode)
npm run test:watch  # watch mode
```

### End-to-end
Prerequisite: **a seeded backend on http://127.0.0.1:8000** (the Vite proxy forwards `/api` and `/media` there):
```bash
cd backend && python manage.py migrate && python manage.py seed && python manage.py runserver 127.0.0.1:8000
```
Then:
```bash
cd frontend
npm run e2e                                   # = playwright test --trace off
npx playwright test e2e/mobile.spec.js        # one file
E2E_PORT=5190 npm run e2e                     # different vite port (default 5185)
E2E_BASE_URL=https://staging.example npm run e2e   # against a deployed site (no local vite)
```
`playwright.config.js` starts `vite --port 5185` via `webServer` (reuses one already running). `@playwright/test` is pinned to the globally installed Playwright (1.63.0); browsers come from `PLAYWRIGHT_BROWSERS_PATH` (or set `PW_CHROMIUM_PATH`). Failure screenshots land in `frontend/test-results/` (git-ignored).

## 3. Current automated coverage

- **Auth**: register (email/phone-only, duplicates, no self-promotion to employer/staff), login by email & 4 phone formats, generic error EN/BN, lockout, refresh cookie (HttpOnly, path, rotation, blacklist, 204 without cookie, 401 + cleared on garbage), `/me` read/update restrictions, logout revocation.
- **Jobs**: list visibility (active, fresher-only, not expired), filters `type` (all 4 + bogus), `major` (incl. any-major jobs), `location` (+remote), `q` (title/company/description), `channel`, combinations; payload shape; `my_status`; channel fallback (partner→email→portal); detail (public, 404, closed job); apply flow per channel, CV requirement, duplicate apply, closed/inactive job, cover-letter cap; tracker list/counts/done/withdraw, foreign-application isolation; bulk apply; employer applicants permissions (anon 401, own company only, candidate/rival see nothing, withdrawn hidden); auth required on candidate endpoints.
- **Stories**: only approved public, major filter, stats demo vs real, featured ordering, submission validation/consent/409/pending-not-public, `/mine`.
- **Frontend unit**: `fmt`, `mmss`, `toast`, `pickVoice`, `speak`; track storage/session/`?gate`/hook broadcast; i18n storage/html lang/`useT` fallback; `money`, `daysLeft`, `getCH`, internship `MATCH` filters, `storyLink`/`STORY_SETS`; Logo/Footer render EN + BN.
- **E2E**: gate shows 3 choices, EN↔BN toggle, Internship choice → internship categories, “Just browsing” → job track, session skip + `?gate`; `/jobs` lists seeded jobs (matches API count), type filter, `?type=internship` redirect; `/internships` story + 5 categories + boarding passes; login form + error; 404; `/applications` → login; nav language toggle; mobile 390×844 no horizontal scroll on `/`, `/?track=internship`, `/jobs`, `/internships` in EN and BN, and on the gate.

## 4. Manual QA checklist — features in development

Run on: Chrome desktop, Android Chrome (low-end device or DevTools “Slow 4G” + 4× CPU throttle), iOS Safari, at 390×844 and 1440×900, in **English and Bangla**.

### Job alerts
- [ ] Create an alert from a search (keyword + major + type + location); it appears in “My alerts”.
- [ ] Edit / pause / delete an alert; duplicates are prevented or merged.
- [ ] A new matching job triggers exactly one notification (email/push/in-app) — no repeat on re-scrape of the same job.
- [ ] Non-matching jobs (wrong type, senior, expired) do not trigger.
- [ ] Unsubscribe link works without login and only affects that alert.
- [ ] Alert copy and dates render correctly in Bangla (Bangla digits where used).
- [ ] Anonymous user is asked to log in; user A cannot read/edit user B’s alerts (API 404/403).

### Google login / phone-OTP login
- [ ] Google: new user is created with verified email; existing email account is linked, not duplicated.
- [ ] Google: cancelling the popup returns to login with no error loop; works in a popup-blocked browser.
- [ ] OTP: accepts `01XXXXXXXXX`, `+8801…`, `8801…`, with spaces/dashes; rejects non-BD numbers.
- [ ] OTP expires (e.g. 5 min), is single-use, wrong code limit + resend cooldown enforced; rate limited per phone and per IP.
- [ ] Same number in different formats maps to one account (see bug B3).
- [ ] Session after OAuth/OTP behaves like password login (refresh cookie, logout revokes).
- [ ] Error messages are bilingual and don’t reveal whether a number is registered.

### Scam badges
- [ ] Jobs flagged as suspicious show the badge on list card, detail and internship pass, with an explanation tooltip/modal.
- [ ] Triggers to test: asks for payment/“registration fee”, personal Gmail HR address, unrealistic salary, no company website, WhatsApp-only contact.
- [ ] Verified/partner companies never show a scam badge; badge is not shown for legitimate jobs with similar words (false-positive check).
- [ ] “Report this job” flow works and can’t be spammed; admin can clear a badge.
- [ ] Badge is accessible (text, not colour only) and translated.

### Lite mode
- [ ] Toggle persists across reloads; respects `prefers-reduced-motion` and Save-Data by default.
- [ ] In Lite mode: no autoplay video (gate wallpaper, stories), no canvas/WebGL, no heavy fonts; images lazy.
- [ ] Measure: home transfer size and LCP on Slow 4G meaningfully lower than normal mode (record numbers).
- [ ] All core flows (search, filter, apply, login) still work; nothing is hidden that’s required.
- [ ] Mobile 390px: no horizontal scroll in Lite mode either.

### PWA install
- [ ] Manifest valid (name, Bangla short name, icons 192/512, maskable, theme colour); Lighthouse PWA checks pass.
- [ ] Android Chrome shows install prompt/button; iOS shows “Add to Home Screen” hint.
- [ ] Installed app opens standalone at `/` with correct splash/icon.
- [ ] Offline: shell + last-viewed jobs load; API failures show a friendly offline message; no stale auth leaks after logout.
- [ ] New deploy updates the service worker (no users stuck on old JS); `/api/*` is never cached.

### Kanban application tracker
- [ ] Columns map to statuses (Applied/Submitted, Shortlisted, Interview, Rejected, Hired, Withdrawn, Needs action).
- [ ] Drag-and-drop (mouse and touch) moves a card and persists after reload; keyboard alternative exists.
- [ ] Invalid transitions are blocked consistently with the API (e.g. withdrawn → done is rejected).
- [ ] Counts per column match `/api/jobs/applications/` counts.
- [ ] Empty state, 100+ cards performance, mobile layout (horizontal swipe between columns without page overflow).
- [ ] Bangla labels and dates.

### Typo-tolerant / Bangla search
- [ ] Typos find results: “sofware”, “enginer”, “markting”, “intrn”.
- [ ] Bangla queries: “চাকরি”, “ইন্টার্নশিপ”, “সফটওয়্যার ইঞ্জিনিয়ার”, “ঢাকা” return relevant jobs.
- [ ] Banglish/transliteration (“chakri”, “dhaka”) and mixed scripts work.
- [ ] Both Bangla Unicode forms of য়/ড়/ঢ় (precomposed vs nukta) match the same results.
- [ ] Ranking: exact title match above description match; empty/whitespace query = all jobs; very long input and special chars (`%`, `'`, `<script>`) are safe.
- [ ] Nav search and /jobs search give the same results.

### Company reviews
- [ ] Only logged-in users can review; one review per user per company (edit allowed).
- [ ] Rating 1–5 required, text length limits, profanity/PII filtering, XSS-safe rendering.
- [ ] Average rating and count update correctly; shown on company card and job detail.
- [ ] Report/moderation flow; employer cannot delete negative reviews of their own company.
- [ ] Anonymous display option hides the reviewer’s name everywhere (API too).

### Internship page — cartoon story without boxes
- [ ] `/internships` story renders as a free-flowing cartoon (no card/box borders, backgrounds or shadows around panels) at 390px and 1440px.
- [ ] Chapters advance automatically and via ‹ › controls; “See N Paid →” links go to `/internships?cat=<id>`.
- [ ] Category counts on the departures board equal the number of passes shown after clicking the category.
- [ ] Reduced motion / Lite mode: story is static but readable.
- [ ] Bangla text fits (no clipped glyphs), no horizontal scroll.

### Home page — girl appears only when the intro story starts / replays
- [ ] On first load the girl (gate wallpaper video) is **not visible** before the intro story starts.
- [ ] She appears exactly when the story starts (curtain pull ≈1.15 s or the 2.2 s fallback), not earlier.
- [ ] “STORY” / “REPLAY PEEK” hides her, restarts the story, and she re-appears in sync with the replay — repeat 3× quickly (no double video, no stuck state).
- [ ] After choosing a track she is gone; returning with `?gate=1` repeats the behaviour.
- [ ] With video blocked/slow network: fallback still reveals cards; no blank gate.
- [ ] Mobile 390×844: she doesn’t cover the mission cards; no horizontal scroll.

### Regression smoke (every release)
- [ ] `npm test`, `npm run e2e`, `python manage.py test` all green (only documented expected failures).
- [ ] Register → upload CV → apply (1-click, email, portal) → tracker → withdraw.
- [ ] Language toggle on every top-level page; refresh keeps language and track.
- [ ] No console errors on `/`, `/jobs`, `/internships`, `/login`.

## 5. Known bugs found by QA (open)

| # | Severity | Where | Bug | Test |
|---|---|---|---|---|
| B1 | High (security) | `backend/apps/accounts/views.py:41` (+ `frontend/src/api.js:21-24`) | Refresh token is returned in the JSON body and the SPA stores access+refresh in `localStorage`, contradicting the HttpOnly-cookie model in `docs/SECURITY.md` / `api.js:4` comment. XSS can steal a 7-day session. | `apps.accounts.tests.AuthSecurityTests.test_refresh_token_only_in_httponly_cookie` (fails; being fixed by Integration) |
| B2 | High (security/DoS) | `backend/apps/jobs/views.py:172` | `POST /api/jobs/scraper/run/` (and `/scrape/`) is `AllowAny` and runs a synchronous live scrape inside the request; caller controls `limit`/`queries`. | `test_scraper_trigger_requires_staff` (expectedFailure) |
| B3 | Medium | `backend/apps/accounts/serializers.py:26-33` | Same phone in different formats (`017…` vs `+88017…`) registers two accounts; phone login (`:81-83`, `icontains` + `.first()`) then picks one arbitrarily. | `test_duplicate_phone_in_other_format_rejected` (expectedFailure) |
| B4 | Medium | `frontend/src/pages/Jobs.jsx:47-48` | `daysLeft` parses `YYYY-MM-DD` as UTC but compares to local midnight → in Asia/Dhaka every deadline shows +1 day (“ends today” shows 1d; yesterday shows 0). | `it.fails("counts days correctly in Asia/Dhaka")` |
| B5 | Low | `backend/apps/jobs/views.py:176` | Non-numeric `limit` → unhandled `ValueError` (500). | `test_scraper_trigger_bad_limit_is_400` (expectedFailure) |
| B6 | Low | `frontend/src/components/FeaturedCompanies.jsx:316` | Duplicate React keys (`base` repeats items to ≥12 but key uses `c.id`) → console warnings, possible render glitches. Use the index in the key. | seen in E2E console |
| B7 | Low (a11y) | `frontend/src/landing/EntryGate.jsx` vs `frontend/src/components/Nav.jsx:74` | The two language toggles use differently-encoded “বাংলায়” (precomposed U+09DF vs য+nukta) in `aria-label`; screen-reader/search inconsistency. | worked around in E2E |

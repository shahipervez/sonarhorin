# সোনারহরিণ (Sonarhorin) — First jobs for freshers in Bangladesh

Django REST API + React (Vite) app. Story-format landing page that first asks Job / Internship / Startup, two animated films with voices, and these tools:

| # | Feature | Where | How it works |
|---|---------|-------|--------------|
| 1 | **Judge Yourself** — CV rejection % | `/cv` | Upload PDF/DOCX/TXT → rule-based screening engine (ATS readability, contact info, sections, major keywords, quantified impact, CGPA, length, generic phrases, BD-style personal over-sharing) → score 0–100 → rejection probability |
| 2 | **CV report** | `/cv` | Strengths, prioritized fixes with examples, section checklist, missing keywords, recommended section order, **PDF download** |
| 3 | **Quick Test + AI Interviewer** | `/quick-test`, `/interview` | 10 MCQs drawn from the user's major (CSE, EEE, BBA, English, Pharmacy, Textile + aptitude/communication), server-graded, 10-min timer. 10-minute mock interview with Mitu: intro → technical (by major) → behavioural → situational → closing. Voice in (Chrome speech recognition) + voice out; every answer scored on content/structure/communication |
| 4 | **Graduate programs, internships, offline training** | `/programs` | Listings with curriculum, seats, deadline, stipend/fee; apply with motivation; admin can mark completed |
| 5 | **Certification** | `/certificates`, `/verify/:code` | Issued automatically (quick test ≥70%, interview ≥70, efficiency test passed, program completed). PDF certificate + public verification page for employers |
| 6 | **Efficiency Test** (genuine, proctored) | `/efficiency` | One attempt per candidate · randomized questions & options · one question at a time, no going back · per-question timer kept on the **server** · tab-switch / copy / paste / right-click / full-screen-exit / dev-tools logging · 4 tab switches = terminated · optional webcam snapshots · integrity score on the certificate · private invite codes for companies |
| ★ | **Fresher jobs + 1-tap apply / auto-apply** | `/jobs`, `/applications` | See *Jobs & apply automation* below |
| ★ | **CV → sign-up auto-fill** | `/register` | Drop a CV at sign-up → name, email, phone, major, university, graduation year, CGPA, LinkedIn, GitHub and skills fill themselves in (`POST /api/auth/parse-cv/`, nothing stored) |
| 7 | **Network** (was Discord) | `/network` | Connect with your university and major, 1:1 chat, rooms per major |

AI: everything works **without any API key** (transparent rule engines). Add `ANTHROPIC_API_KEY` to get LLM rewrite suggestions on CVs and adaptive interviewer follow-ups.

---




## ✦ Animated login welcome (Nov 8, 2026)

`frontend/src/landing/anime/welcome.js` + `pages/Login.jsx`: the login page background is a live, warm golden-hour
scene with **Tara**, Sonarhorin's original anime host (golden headband with the deer mark, spiky ponytail).
She waves "Hi!", opens the login card with a sparkle from her hand, covers her eyes while you type your password 🙈,
peeks when you reveal it 👀, sweats on a wrong password, and on a successful login winks and throws a bouquet at
the screen that bursts into petals and confetti before redirecting. "Skip to login" or a click skips the intro.
Eyes follow the cursor. Reduced-motion users get the card immediately.

## ✦ Visual update (Nov 8, 2026)

- **Anime long story on the gate** — `frontend/src/landing/anime/story.js`: "Episode 01: প্রথম সুযোগ", a ~24 s anime short
  drawn live on canvas (cel shading, manga panels, impact frame, Bangla SFX, krishnachura petals, Dhaka metro). It starts when
  the girl pulls the curtain, plays once, then holds on the title card. "STORY" replays it.
- **Featured Companies** — `components/FeaturedCompanies.jsx`: two infinite logo rows (opposite directions) that lean with
  scroll speed. Data: `GET /api/jobs/companies/featured/` = companies with real open jobs (+ any marked *featured*).
  Upload logos in Django admin → Companies → *Logo*; tick *Featured* to pin a company first.
- **Job Galaxy** — `components/JobGalaxy.jsx`: scroll-driven live data story; every star is a real open job → stars cluster
  by major → they form the golden-deer constellation. Hover a star to see the job, click to open it.
- **Signature layer** — `components/Signature.jsx`: magnetic gold cursor (desktop only), gold page-transition curtain,
  scroll-progress line with a running deer. All motion respects `prefers-reduced-motion`.
- Tests updated for phone-number sign-up (41/41 passing). Anonymous API rate raised to 1500/hour (`ANON_RATE`).

## ✦ Career AI (Nov 2026)

- **CV Studio** (`/studio`) — upload your CV once (kept private), pick any job from the board or paste one, and get a CV
  rewritten for that job + a cover letter, an ATS match score (before → after), matched keywords and honest gaps.
  Edit in place, switch between 3 designs, download PDF or Word. Nothing is invented — enforced in code.
- **Interview Coach** (`/coach`) — paste the job's requirements & responsibilities → 12 predicted questions with why
  they're asked and a model answer built from *your* CV, practice with voice input and instant scoring (STAR check),
  a streaming AI coach chat, and a 5-day prep plan.
- **Security** — HttpOnly rotating refresh cookies, token blacklist, login lockout, Argon2, upload sniffing, private
  file storage, CSP/HSTS, prompt-injection guards. See `docs/SECURITY.md`.
- **Deploy** — `docker compose up -d --build` (Postgres + Redis + Gunicorn + nginx). See `docs/ARCHITECTURE.md`.
- Add `ANTHROPIC_API_KEY` to `backend/.env` to switch every AI feature to Claude; without it the built-in engine runs.

## Run it locally

Requirements: Python 3.11+, Node 18+.

### 1. Backend (Django) — terminal 1
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate     macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # Windows: copy .env.example .env  — then set DISCORD_INVITE_URL
python manage.py migrate
python manage.py seed --demo-user   # MCQs, programs, efficiency tests, 11 sample jobs, demo login (+ sample CV)
python manage.py createsuperuser    # for /admin
python manage.py runserver
```

### 2. Frontend (React) — terminal 2
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**. Demo login: `demo@prothom.dev` / `Sonarhorin@2026`.
Admin panel: **http://127.0.0.1:8000/admin**.

### 3. Tests
```bash
cd backend && python manage.py test
```
Covers auth, CV judge + PDF, major-based quick test, interview flow + 10-min limit, programs, efficiency test (integrity, termination, timeout, one attempt), certificate verification.

---

## Page 1 — the home page as a story (scene by scene)
| Scene | File | What happens |
|---|---|---|
| 0 · তুমি কেন এসেছো? | `landing/EntryGate.jsx` | First visit only: a full-screen choice — Job / Internship / Startup. **Everything below then shows only that path** (stored in `src/track.js`, saved to the profile when logged in). |
| 1 · Hero | `landing/Hero.jsx` + `landing/hero/*` | Each path has its own world: CV rain (`JobRain`), paper planes (`PlaneSky`), sky lanterns (`LanternSky`). The picker here switches path any time. |
| Pop-ups | `landing/Popups.jsx` | Scam alerts (left) and success stories (right), one at a time after scrolling. |
| 2 · Services | `landing/Services.jsx` | All services as live boxes in a **horizontal, scroll-driven row** (swipe row on mobile). Order and selection follow the path — e.g. Startup shows fund, founders' room, website, programs, jobs. |
| 3 · The film | `landing/StoryAnimation.jsx`, `story/chorus.jsx`, `story/startup.jsx` | Job/Internship → “চাকরি পাইছো?”. Startup → Pulok's story. |
| 4 · Your road | `landing/Roadmap.jsx` | Replaces “See it in action”: a winding road drawn as you scroll, the golden deer running ahead, 6 stops (Day 1 → goal) for the chosen path, each linking to the tool. |
| 5 · সোনারহরিণ TV | `landing/Playlist.jsx` | Stories + knowledge reels; add YouTube videos in **Admin → Videos**. |
| 6 · Experience | `landing/Experience.jsx` | Job/Internship only — proof paths, why-us table, FAQ with action buttons. |
| 7 · The painter | `landing/Painter.jsx` | Red (rejection) + blue (giving up) → **gold** → “তুমি ঠিক জায়গায় এসেছো”. |
| Stories | `landing/SuccessStories.jsx` | Success stories + share yours. |

Removed: the automation scene, Mitu's “See it in action”, the bottom “Everything” grid (now the horizontal services), and earlier the vibe swipe / how-it-works / join CTA / live wallpaper.

**Language:** English by default, with an **EN / বাং** toggle in the nav (and on the entry screen). Use `useT()` from `src/i18n.js` — `t("Jobs", "চাকরি")` — or the CSS classes `only-en` / `only-bn`. The choice is saved per browser.

**Nav search:** the search box left of “Jobs” opens `/jobs?q=…` (title, company or description).

**Palette:** no greens — “golden hour”: deep ink `#12101C`, violet `#6B4EFF`, pink `#FF4F9A`, gold `#FFB627`, coral, sky; key words use a violet→pink→gold gradient. Tokens are in `styles/landing.css` (`--green`/`--lime` keep their old names but are violet/gold).

**Characters:** drawn in SVG (`landing/story/people.jsx`) in an anime style — big glossy eyes with highlights, tapered brows, bangs with a shine band, cel shading, slightly larger heads. They are 2D vector art, not Blender renders; to use real 3D/anime footage instead, render it as video and swap the film for a `<video>`.

### Voices in the films
Priority: **your own recordings** → a Bangla text-to-speech voice on the device (Edge on Windows and Android Chrome have one) → cartoon “babble” + subtitles. To use real voices, record each line and add `frontend/public/voice/chorus/manifest.json` (or `voice/startup/`) like `{"1": "01.mp3", "2": "02.mp3"}` — the key is the line's index in `LINES`.

## Page 2 — dashboard, website, network, startup
- **Dashboard** (`/me`): notebook paper with hand-written notes (Galada / Caveat fonts, `components/Scribble.jsx`), next-best-step, the 6-swipe “vibe” onboarding (saves auto-apply preferences), matches, applications, website, network, checklist. Founders get a different night-sky layout.
- **Portfolio website builder** (`/portfolio`): 4 templates (Editorial, Developer, Bold, Bilingual), accent colours, live preview (desktop/mobile), import projects from GitHub, verified সোনারহরিণ certificates with live verify links. Anyone can try it; **publishing (live at `/u/<slug>`) and downloading the .html need login**. The site is pure HTML/CSS (no scripts), rendered in a sandboxed iframe; all text is escaped and links must be http(s).
- **Network** (`/network`): connect with people (same university + major first), 1:1 chat with connections, rooms per major + general/interviews/startup. Polls every 3 s. Admins can hide messages (Admin → Messages). Replaces the Discord link.
- **Startup** (`/startup`): night-sky layout, Pulok's film, how funding works, **pitch builder** with a live readiness score (`apps/startups/scoring.py`), PDF deck upload, submit at 45+, status timeline + panel feedback; funded founders listed only with consent. Review pitches in **Admin → Pitches** (status is editable in the list).

## Success stories
- **Home section** (`landing/SuccessStories.jsx`) + **/stories page**: flip cards — front shows REJECTED ×N → HIRED, role, quote and the CV-score jump; back shows the journey timeline. Major filter, draggable carousel, live stats (avg days to hire, avg CV score jump).
- **Share your story** (logged-in): we fill in the journey automatically from the user's own activity — first vs best CV score, skill tests passed, days on the platform, latest certificate. A valid certificate gives the story a **✓ Verified** badge.
- **Moderation:** new stories are `pending`; approve in **Admin → Success stories** (only stories with publishing consent can be approved). `GET/POST /api/stories/`, `GET /api/stories/mine/`.
- `python manage.py seed` adds 6 **sample** stories (`is_demo=True`), shown with a “Sample” label and excluded from stats once real stories exist. Delete them before launch.

## Hero: the rejection cloud + rotating Bangla headline
- The big headline itself now changes: `HEADLINES` in `landing/FunnyTyper.jsx` types a funny Bangla line very fast, holds, deletes and moves on (`|` = line break, `*text*` = lime highlight). “Yes, the fresher job hunt sucks.” is kept as the hidden `<h1>` for SEO/screen readers. The old typing strip under it is gone.
- `landing/StormCloud.jsx`: a storm cloud near the top rains CVs onto the table, with a “আজকের পূর্বাভাস: ১০০% সিভি-বৃষ্টি” chip. Lightning flashes every 5–9 s and dumps a burst of extra CVs; every rescue lights up the cloud's golden lining.

## Jobs & apply automation
Most Bangladeshi companies post on their own career portals. Every job gets the best channel that company actually accepts:

| Channel | When | What happens |
|---|---|---|
| ⚡ **1-click** (partner) | Company is a Sonarhorin partner | Application + CV + cover letter land in the employer's dashboard instantly (`GET /api/jobs/employer/applicants/`) |
| ✉️ **Email apply** | Job says “send your CV to hr@…” | We email HR from `DEFAULT_FROM_EMAIL` with the CV attached and **Reply-To = the candidate**. Fully automatic |
| 🔗 **Company portal** | Job only lives on their careers site | **Assisted apply**: tailored cover letter + copy-ready fields + “Open career portal ↗”; the candidate submits there (~1 min) and taps “I've submitted it ✓” |

We deliberately **don't bot-fill third-party portals**: they use logins/captchas, their terms forbid automated submissions, and a broken auto-submit silently loses the candidate's application. Turn a portal company into 1-click by signing them as a partner (Admin → Companies → *is partner*), or set an *apply email*.

- **Auto-apply** (`/jobs` → 🤖): daily cap (1–20), filters (major, location, job type, min salary), personal line for every cover letter. Only 1-click + email jobs, never the same job twice. Schedule it daily:
  `0 9 * * *  cd /path/backend && python manage.py run_auto_apply`
- **Bulk apply**: “Apply to all N matches” (max 20, portal jobs skipped).
- **Import jobs from company careers pages** (reads schema.org `JobPosting` JSON-LD, respects robots.txt, keeps only 0–1 yr jobs):
  `python manage.py import_jobs --company "Company Name" --url https://company.com/careers` · `--all-companies` · `--file saved.html` · `--include-senior`
- **Email**: set `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL` in `.env`. In dev, emails print to the Django console.
- Seeded companies/jobs are labelled “(demo)” — delete them before launch.

## Hero: every CV is a story
Each falling CV carries a name. Hover a landed CV to read that person's story; click/tap it and the golden deer carries it in. Characters are illustrative composites (`PERSONAS` in `landing/hero/JobRain.jsx`).

## Admin tasks
- **Questions** — add/edit MCQs per major (Assessments → Questions).
- **Programs** — create graduate/internship/training programs; select applications → *Mark completed + issue certificate*.
- **Efficiency tests** — create a private test for a company (`is_public` off), share its invite code; set `created_by` to the employer's account so they can call `GET /api/assessments/efficiency/<id>/results/`. Sessions show integrity events and webcam snapshots.
- **Certificates** — revoke if needed.
- **Pitches** — review startup pitches, set status (review → shortlisted → pitch day → funded/declined), write feedback.
- **Videos** — add YouTube videos to সোনারহরিণ TV (kind: story/knowledge).
- **Messages / Connections** — hide abusive chat messages.
- `seed --demo-user` also creates 6 **sample** network people (`@sample.sonarhorin` emails) and a few room messages — delete them before launch.

## Project layout
```
backend/
  config/            settings, urls
  apps/accounts      email login, JWT, user major
  apps/core          /api/config (Discord URL), optional LLM helper, seed command, tests
  apps/cv            analyzer.py (scoring engine), pdf.py (report)
  apps/assessments   question bank, quick test, proctored efficiency test
  apps/interviews    interviewer.py (Mitu), sessions & turns
  apps/programs      graduate / internship / offline training + applications
  apps/certifications certificates, PDF, public verify
  apps/jobs          companies, jobs, apply engine (services.py), auto-apply, import_jobs / run_auto_apply commands
  apps/cv/parser.py  CV → profile fields for sign-up auto-fill
  apps/portfolio     portfolio websites (/u/<slug>), prefill from profile + CV
  apps/network       connections, direct messages, rooms
  apps/startups      pitches, deck upload, readiness scoring
frontend/
  src/landing        Hero (+ hero/JobRain, PlaneSky, LanternSky), Popups, Automation, StoryAnimation (+ story/chorus, story/startup), MituVideo, Playlist, Experience, Painter, Everything
  src/portfolio      templates.js — the 4 website templates (HTML generator)
  src/pages          Portfolio (+ PublicSite), Network, Startup, Jobs (+ Applications), CVJudge, QuickTest, Interview, Programs, Certificates, Verify, Efficiency, EfficiencyRun, Dashboard, auth
```

## API overview
`POST /api/auth/register|login|refresh`, `POST /api/auth/parse-cv/`, `GET/PATCH /api/auth/me/`, `GET /api/config/` · `GET/POST /api/waitlist/`
`POST /api/cv/analyze/` · `GET /api/cv/analyses/` · `GET /api/cv/analyses/<id>/pdf/`
`POST /api/assessments/quick/start/` · `POST /api/assessments/quick/<id>/submit/`
`GET /api/assessments/efficiency/` · `POST /efficiency/<id>/start/` · `GET .../sessions/<sid>/current/` · `POST .../answer/ | event/ | snapshot/`
`POST /api/interviews/start/` · `POST /api/interviews/<id>/answer/ | finish/`
`GET /api/programs/?kind=` · `POST /api/programs/<id>/apply/` · `GET /api/programs/mine/`
`GET /api/jobs/?q=&major=&type=&channel=` · `GET /api/jobs/<id>/preview/` · `POST /api/jobs/<id>/apply/` · `POST /api/jobs/apply-bulk/` · `GET /api/jobs/matches/` · `GET/PUT /api/jobs/auto-apply/` · `POST /api/jobs/auto-apply/run/` · `GET /api/jobs/applications/` · `POST /api/jobs/applications/<id>/done|withdraw/` · `GET /api/jobs/employer/applicants/`
`GET/PUT /api/portfolio/mine/` · `GET /api/portfolio/prefill/` · `GET /api/portfolio/slug-check/?slug=` · `GET /api/portfolio/u/<slug>/` (public)
`GET /api/network/` · `GET /api/network/people/?q=` · `POST /api/network/connect/<user_id>/` · `POST /api/network/requests/<id>/accept|decline/` · `GET/POST /api/network/dm/<user_id>/?after=` · `GET/POST /api/network/rooms/<slug>/?after=`
`GET/POST /api/startups/pitches/` · `GET/PUT/DELETE /api/startups/pitches/<id>/` · `POST .../deck/` · `POST .../submit/` · `GET /api/startups/funded/` (public) · `GET /api/videos/` (public)
`GET /api/certificates/` · `GET /api/certificates/<id>/pdf/` · `GET /api/certificates/verify/<code>/` (public)

## Production notes
- Set `DJANGO_DEBUG=False`, a real `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `SITE_URL`; use PostgreSQL via the `POSTGRES_*` vars.
- `npm run build` → serve `frontend/dist` (Nginx/Vercel/Netlify) with SPA fallback to `index.html`; set `VITE_API_URL` to the API origin.
- Serve Django with gunicorn; store `media/` (CVs, proctoring snapshots) on private storage — they are personal data.
- Home-page numbers (18,400+ jobs etc.) and the demo job cards are placeholders.
- Certificate PDFs use built-in Latin fonts; add a Bangla TTF to `certifications/pdf.py` if names are written in Bangla.

## Story videos (Nov 2026 update)

- `frontend/public/stories/intro.mp4` — 10-second opening story (3 friends → golden deer → 3 paths → logo). Plays once per browser session before the track gate; "STORY ▶" on the gate replays it.
- `frontend/public/stories/<category>.mp4` — 6-second looping story for each category card
  (jobs: `it, business, agriculture, textile, engineering`; internships: `paid, unpaid, versity, corporate, remote`; plus `startup`).
  To use your own footage, replace a file with one of the same name (portrait 9:16 works best) and its `.jpg` poster.
- The clips are drawn in code: `tools/story-videos/scenes.html` + `render.js` (Playwright + ffmpeg). Copy the Hind Siliguri / Galada `.woff2` files next to `scenes.html` before rendering.
- Peek effect on the gate: `frontend/src/landing/GateFX.jsx` (fires when the girl in `wallpaper.mp4` pulls the curtain at ~1.15s).

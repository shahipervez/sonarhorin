# Sonarhorin — Architecture

```
 Browser (React 18 + Vite SPA)
   │  access token in memory · refresh token = HttpOnly cookie (/api/auth/ only)
   ▼
 nginx  ── static SPA, CSP + HSTS headers, rate limits, SSE pass-through
   │  /api/*  /admin/*
   ▼
 Django 5 + DRF (Gunicorn gthread)
   ├── apps.accounts     JWT auth, cookie refresh + rotation + blacklist, lockout, password change
   ├── apps.career  ✦    Resume vault · CV Tailor · Interview Kits · Practice · Streaming coach
   ├── apps.jobs         fresher job board, 1-click/email/portal apply, auto-apply
   ├── apps.cv           CV judge (score + rejection %)
   ├── apps.interviews   10-minute AI interviewer
   ├── … assessments, programs, certifications, portfolio, network, startups, stories
   └── apps.core         Claude client (ai.py), upload guard (uploads.py), security headers
   │
   ├── PostgreSQL (SQLite in dev)      ├── Redis (cache: throttles + login lockout)
   ├── /private  CVs, resumes, decks — never web-served, owner-checked download views
   └── Anthropic Messages API (Claude) — optional; rule engine fallback for every feature
```

## Career AI (`apps.career`)

| Endpoint | What it does |
|---|---|
| `POST /api/career/resumes/` | Upload PDF/DOCX/TXT (or paste text) → private file + extracted text + structured profile (Claude, or heuristic parser) |
| `PATCH /api/career/resumes/:id/` | Edit the structured profile / set as main CV |
| `POST /api/career/tailor/` | `{resume_id, job_id \| job_title+requirements+responsibilities, template}` → tailored CV + cover letter + ATS analysis |
| `PATCH /api/career/tailor/:id/` | Save edits; re-scored against the same job keywords |
| `GET /api/career/tailor/:id/export/?fmt=pdf\|docx&doc=resume\|cover` | Download (ReportLab / python-docx), 3 templates |
| `POST /api/career/kits/` | Job (+ optional CV) → interview kit: 12 predicted questions with *why they ask*, model answer from your CV, key points, pitfalls; 5-day plan; questions to ask them |
| `POST /api/career/kits/:id/practice/` | Your answer (typed or spoken) → score, STAR check, strengths, fixes, a stronger version |
| `POST /api/career/kits/:id/chat/` | Streaming coach (`text/event-stream`), context = job + kit + your CV |

**Truthfulness is enforced in code** (`services._guard_truth`): the tailored CV may re-order, re-phrase and emphasise,
but skills, employers, schools and certifications not present in the master CV are removed and reported as warnings.
Missing job keywords are shown as *gaps to close*, never silently added.

**ATS score** = keyword coverage (60) + prominence of the top keywords in headline/summary/top skills (20) + structure (20).

## Frontend

* `pages/Studio.jsx` — 3-step CV Studio, live paper preview (editable), template switcher, PDF/Word download.
* `pages/Coach.jsx` — kit view with Questions / Practice (voice input via Web Speech API) / Coach (streaming) / Plan.
* `components/career/kit.jsx` — shared UI + motion: Aurora backdrop with cursor spotlight, Magnetic CTA, 3D Tilt cards,
  animated ScoreRing, Typewriter, keyword flight, safe Markdown renderer (no `innerHTML`).
* All motion respects `prefers-reduced-motion`.

## Run

* Dev: `./start.sh` (or `start.bat`) — Django on :8000, Vite on :5173 (proxy).
* Production: `cp .env.example .env` → fill it → `docker compose up -d --build` → put HTTPS in front.
* Tests: `cd backend && python manage.py test` (41 tests incl. auth security + career flows).

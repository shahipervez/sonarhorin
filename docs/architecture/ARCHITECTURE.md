# Sonarhorin — Architecture (Team upgrade, Nov 2026)

Owner: Developer Architect. This file explains how the new features fit into the existing system and who owns what.

## System overview

```
Browser (React 18 + Vite SPA, PWA service worker, Lite mode)
   │  /api/*  (JWT via simplejwt)
   ▼
Django 5 + DRF  ──►  PostgreSQL (prod, pg_trgm + full-text) / SQLite (dev)
   │                 
   ├─ apps.jobs        jobs, companies, applications, scraper, trust (scam detector)
   ├─ apps.alerts      job alerts + deliveries (email / Telegram / web push)
   ├─ apps.insights    AI match score, salary insight
   ├─ apps.reviews     anonymous company reviews
   ├─ apps.push        web-push subscriptions (VAPID)
   ├─ apps.payments    SSLCommerz skeleton
   ├─ apps.dbtools     Postgres-only extensions & indexes
   └─ apps.accounts    + Google login, phone OTP (pluggable SMS backend)

Scheduled work (no threads in the web process in prod):
   GitHub Actions cron ─► run_job_scraper (6h) · send_job_alerts (1h) · check_job_trust (daily)
```

## Principles
1. **Everything optional is env-driven.** No key → feature degrades gracefully (AI, SMS, Telegram, Sentry, push, payments).
2. **New features live in new apps** to keep migrations independent and merges clean.
3. **Low-end Android first.** Lite mode, small media, PWA cache, no heavy canvas when `html.lite`.
4. **Trust is a feature.** Scam detection is rule-based first; AI can only *raise* caution, never mark a job verified.
5. **Bilingual by default.** Every user-facing string has `[en, bn]`.

## Team ownership (10 roles)
| Role | Owns |
|---|---|
| Developer Architect | this doc, integration branch, merges, final run |
| Product Analyst | `docs/product/*` (PRD, user stories, metrics, release plan) |
| UI/UX Designer | `/internships` redesign, Blender cartoons (`tools/blender/`, `public/cartoons/`) |
| Frontend Developer | home girl↔story sync, Lite mode, SEO/JSON-LD, PWA, Kanban tracker |
| Backend Developer | `apps.alerts`, `apps.insights`, applicant stage API |
| Database Engineer | search (FTS + trigram + Bangla synonyms), `apps.reviews`, `apps.dbtools` |
| Security Engineer | scam detector + TrustBadge, settings hardening, throttling, review doc |
| Integration Engineer | Google login, phone OTP, web push, Sentry/analytics, SSLCommerz |
| QA Engineer | Vitest, Playwright e2e, backend API tests, test plan |
| DevOps Engineer | CI, cron workflows, media compression, VS Code/Antigravity run setup |

## Branching
Each role works on its own branch; the architect merges them into `team/integration`, resolves conflicts in shared files (`settings.py`, `urls.py`, `package.json`, `requirements.txt`), runs all tests + build, then it goes to `main` via PR.

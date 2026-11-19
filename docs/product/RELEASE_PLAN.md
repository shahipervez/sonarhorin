# Release Plan — phased rollout, risks, open questions

Phases from the owner's proposal. Feature IDs refer to [PRD](PRD.md); events to [METRICS](METRICS.md).

## 0. Foundations first (week 0–1, "Always" track)
These go in before any P1 feature merges, so every feature ships measured and tested.
- **CI (A1):** GitHub Actions on every PR runs `python manage.py test` + frontend `npm run build` + lint. Protected `main`.
- **Sentry + PostHog (A2):** with PII scrubbing; record the **baseline** (WAF, retention, traffic sources, LCP) for 2 weeks before P1 flags open. Without a baseline we can't prove P1 worked.
- **Feature flags:** every feature below ships behind a PostHog flag, so it can be turned on for staff → 10% → 100% and killed without a deploy.
- **Pre-launch cleanup:** delete "(demo)" companies/jobs and sample stories (`is_demo=True`) before SEO goes live, or Google will index demo data.

## 1. Phase 1: Reach + Trust (weeks 1–5)
| Order | Feature | Rollout | Exit criteria (to 100%) |
|---|---|---|---|
| 1 | F14 Home popup timing | Direct (small UI fix) | `story_popup_shown` ≤ 1 + replays per session |
| 2 | F3 Scam detector | **Shadow mode 1 week** (score computed + admin queue, no public badge) → ✅ badges only → ⚠️ badges | ⚠️ precision ≥ 85% on the admin-reviewed sample |
| 3 | F4 Lite mode | Manual toggle → auto-detect at 10% → 100% | Lite `/jobs` < 300 KB, no core action broken (QA on a real ৳10k Android over 4G) |
| 4 | F2 SEO | Prerender/SSR job pages → sitemap → submit in Search Console | Rich Results 0 errors; ≥ 50% of active jobs indexed by week 4 |
| 5 | F1 Alerts | Email (daily digest) → Telegram → web push (needs F8; can come later) | CTR ≥ targets, unsubscribe < 5% |
| 6 | F13 Internship redesign | Behind a flag, A/B vs. old layout for 2 weeks | Category → `job_viewed` CTR not worse; video asset ready (see Q5) |

Dependencies: F1 must exclude ⚠️ jobs, so F3 ships first. SEO must index only clean jobs (F3 + demo cleanup).

## 2. Phase 2: Convert (weeks 6–10)
F6 Kanban (extends `/applications`; no data migration risk because it maps existing statuses) → F7 Search (Postgres `pg_trgm` + synonym table; SQLite fallback for dev) → F5 Match score (reuse the CV Studio ATS engine; ship as "beta") → F8 PWA (adds the push channel for F1).
Exit: no-results rate < 5%; ≥ 25% of applicants use the tracker; match score predicts apply rate.

## 3. Phase 3: Moat + Money (weeks 11+)
F11 Google login first (free) → F11 Phone OTP (rate-limited, with a cost cap) → F9 Reviews (moderation ready before opening) → F10 Salary (needs N ≥ 5 per cell; launch only for roles that have data) → F12 SSLCommerz **sandbox only** until the owner signs the merchant agreement.

## 4. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **SMS cost (OTP)**: bot/OTP-pumping attacks, ~৳0.25–0.50 per SMS, resend spam | Bill spikes; one attack can cost thousands of taka | Rate limits per number (3/hr) and per IP; CAPTCHA after the 1st resend; daily SMS budget cap with an alert; Google login and email remain free alternatives; prefer WhatsApp/Telegram OTP later if cheaper; watch `otp_requested` ÷ `otp_login_success` |
| **Scam detector false positives**: a real company gets ⚠️ | Lost employer trust, possible defamation complaint | Wording is "Caution: check before paying", never "Scam"; always show the reasons; shadow mode first; one-click "Request review" for employers; admin whitelist; partners always ✅; auto-hide only at a high threshold + reports |
| **False negatives**: a scam shows no badge and someone pays | User harm, reputation | No default ✅; persistent "সোনারহরিণ কখনো টাকা চায় না" notice on job pages; report button everywhere; never alert ⚠️ jobs |
| **Google indexing of the SPA**: React-only pages can be indexed late or badly, and JSON-LD injected by JS is unreliable for Google for Jobs | SEO goal fails | Serve job pages with HTML + JSON-LD from Django (or prerender at build/cron); canonical URLs `/jobs/<id>-<slug>`; `sitemap.xml` with `lastmod`; remove expired jobs fast (Google penalises stale `JobPosting`); keep `directApply` honest |
| **Scraping legality / ToS**: the current `scraper.py` hits "LinkedIn Guest" and job portals with rotating user agents | Account/IP bans, legal letters (LinkedIn has sued scrapers), Google may treat re-posted jobs as duplicates | Prefer sources that **publish** `JobPosting` JSON-LD (the `import_jobs` path already respects robots.txt); drop or pause the LinkedIn/Bdjobs scraping until legal is reviewed; identify our bot honestly instead of rotating UAs; always link to and credit the original source; honour takedown requests within 48h; long term, partner feeds / employer posting |
| **Duplicate content SEO**: scraped jobs already indexed on the original site | Low ranking, Google may skip them | Set `source_url` canonical where we re-host; focus JSON-LD on partner/admin/email jobs, which are unique content |
| **Telegram/email deliverability** | Alerts land in spam | SPF/DKIM/DMARC on the sending domain; digest by default; one-click unsubscribe header |
| **Lite mode drifts**: new features add weight | Nila's experience degrades again | Bundle-size and Lighthouse budget check in CI for the Lite routes |
| **Anonymous reviews**: defamation, fake reviews, employer pressure | Legal risk, trust | Moderation queue, PII auto-hold, verified-applicant tag, a clear policy, right of reply, no review-removal-for-pay |
| **Payments**: IPN spoofing, double credit | Money loss | Server-side validation API, amount + `tran_id` match, idempotency, sandbox until sign-off |
| **Parallel team, 10 branches**: merge conflicts in `Jobs.jsx`, `models.py`, `App.jsx` | Slow integration, regressions | Small PRs, migrations numbered per feature and rebased daily, flags default off, CI must pass |
| **Privacy (phone, CV, location)** | Trust, compliance (BD Personal Data Protection draft rules) | Consent for alerts/OTP, PII scrubbing in Sentry/PostHog, data deletion on request |

## 5. Open questions for the owner (মালিকের জন্য প্রশ্ন)

**Top 5 (needed to start P1):**
1. **Scraping policy:** do we keep scraping LinkedIn Guest / Bdjobs / other portals (ToS + legal risk), or limit to company career pages with JSON-LD + partner posting? This decides how many jobs we have at launch.
2. **Scam badge wording and liability:** is it OK to show "⚠️ Caution" on non-partner companies based on rules, and who reviews reports within 24h (owner, a moderator, the team)? Do you want a written policy / legal check before launch?
3. **Alert channels and budget:** Telegram bot + email in P1 is ~free. Do we need SMS alerts at all (cost)? Which email provider and sending domain (SES / Brevo / Zoho), and what monthly budget?
4. **SEO architecture:** may we serve job pages from Django (server-rendered HTML) or add prerendering, since it changes hosting? Is the current Vercel + Django deploy the final production setup, and what is the final domain?
5. **Internship story asset:** who makes the Blender cartoon, by when, and in what format/length (we suggest ≤ 20s, ≤ 2 MB WebM/MP4 + poster + EN/বাং captions)? Until then, do we ship the new no-box layout with a still poster?

**Also open:**
6. Lite mode: auto-on by default for slow networks, or only suggest it ("লাইট মোড চালু করবেন?")?
7. SMS gateway choice for OTP (SSL Wireless, BulkSMSBD, Alpha SMS …) and a monthly SMS cap in taka.
8. SSLCommerz: is there a merchant account / trade license, and what do we sell first (featured job post, premium CV review)? Prices?
9. Reviews: allow reviews of non-partner companies from day 1, and do employers get a right of reply?
10. Salary insights: may we use user-submitted salaries (from reviews/offers), or only job-post ranges?
11. Credit internships: should we collect a "gives supervisor letter / certificate" field from employers (it would make the Versity filter reliable)?
12. Analytics: PostHog Cloud (EU/US) or self-hosted? Any data-residency concern?

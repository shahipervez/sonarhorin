# Sonarhorin (সোনারহরিণ) — Product Requirements (Nov 2026)

Owner-facing. English with key Bangla terms. Companion docs: [USER_STORIES](USER_STORIES.md) · [METRICS](METRICS.md) · [RELEASE_PLAN](RELEASE_PLAN.md).

## 1. Problem (সমস্যা)

BD freshers (০–১ বছর experience) can't find a first job or internship efficiently:

- **Discovery is broken.** Jobs live on scattered company career portals, Facebook groups and Bdjobs. Freshers check manually every day and miss deadlines.
- **Scam/fake jobs (ভুয়া চাকরি).** "Registration fee", "security deposit" and bKash-advance posts target freshers, and nobody gives a trust signal.
- **Network and device reality.** Many users are outside Dhaka on low-end Android phones with patchy 4G. The current home page (canvas anime story, Job Galaxy, magnetic cursor) is heavy.
- **No feedback loop.** After "apply" the candidate has no single place to track status, and most portal applications go silent.

**Already built (extend it, don't rebuild it):** jobs board `/jobs` + `/internships` (models `Company`, `Job`, `JobApplication`, `AutoApplySettings`), 3 apply channels (partner 1-click / email / assisted portal), auto-apply, scraper + hourly scheduler (`apps/jobs/scraper.py`, `scheduler.py`), JSON-LD importer (`import_jobs`), CV Judge, CV Studio (ATS match), Quick Test, AI Interviewer, Efficiency Test, certificates, network, startup pitch builder, EN/বাং toggle (`useT()`), email + phone sign-up.

## 2. Personas

| # | Persona | Context | Core need | Biggest pain |
|---|---|---|---|---|
| P-A | **Rafi, Dhaka uni fresher** (CSE, DU/BUET/NSU/BRAC), 23 | Laptop + mid-range phone, good Wi-Fi, uses LinkedIn | A first full-time / MTO job, fast; know whether the CV fits | Too many portals, no responses, no idea of the salary range |
| P-B | **Nila, district-town fresher** (Rajshahi/Rangpur/Barishal, National University / govt college), 24 | ৳10–15k Android, 2–3 GB RAM, prepaid 4G that drops to 3G, uses the Bangla UI | Never miss a deadline; stay safe from scams; low data use | Heavy pages, data cost, fake "agency" jobs, English-only search |
| P-C | **Tanvir, final-year student** who needs a **credit internship** (BBA/EEE/Pharmacy), 22 | University requires a 3-month internship + supervisor letter | A verified, credit-eligible internship before the semester deadline | Can't tell which internships give a certificate/letter; unpaid exploitation |
| P-D | **Sadia, HR / employer** (SME or mid-size corporate), 30 | Desktop, posts 2–10 fresher roles a year | Qualified fresher applicants, low noise, low cost | Spam applications, no screening, Bdjobs cost |

## 3. Goals and non-goals

**Goals (next 2 quarters)**
1. Freshers come back **without being asked**: alerts drive ≥35% of weekly sessions.
2. Free organic acquisition: jobs indexed in **Google for Jobs**; ≥30% of new users from organic search.
3. **Trust**: every job carries a ✅ Verified / ⚠️ Caution signal; scam reports are handled within 24h.
4. **Works on Nila's phone**: Lite mode `/jobs` transfer < 300 KB; LCP < 3s on throttled "Slow 4G".
5. Measure everything (PostHog) and break nothing (CI, tests, Sentry).

**Non-goals (এখন না)**
- Bot-filling third-party portals (already a deliberate rule; keep it).
- A native Android/iOS app (the PWA covers this).
- A full employer ATS or paid job-posting marketplace (P3 adds only a payment skeleton).
- Government job (সরকারি চাকরি) / BCS exam prep.
- A chat redesign or video interviews.
- Named company reviews (reviews are anonymous only).

## 4. Feature list and priority

Phases follow the owner's proposal. "Always" means it runs alongside every phase.

| ID | Feature | Phase | Personas | Summary | Builds on |
|---|---|---|---|---|---|
| F1 | **Job Alerts** (email / Telegram / web push) | **P1** | A, B, C | Saved filters (major, location, type, salary, keyword) send instant or daily-digest alerts. Telegram because many BD users live there; web push for PWA users | `AutoApplySettings` filter shape, scraper |
| F2 | **Google-for-Jobs SEO** | **P1** | all | `JobPosting` JSON-LD per job page, Open Graph/Twitter cards (FB/WhatsApp share previews), `sitemap.xml`, server-rendered or prerendered job pages | `Job` fields map almost 1:1 to schema.org |
| F3 | **Scam/fake job detector** | **P1** | B, C | Rule score (fee asks, bKash/Nagad advance, WhatsApp-only contact, free-mail HR, unrealistic salary, no company website) gives a ✅ Verified / ⚠️ Caution badge; "Report scam" button; admin review queue | Scam content in `landing/Popups.jsx`, `Company.is_partner` |
| F4 | **Lite mode (লাইট মোড)** | **P1** | B | Toggle, plus auto-on for `Save-Data`, `effectiveType` 2g/3g or low `deviceMemory`. No canvas/anime/galaxy, system fonts, text-first job list, lazy images | Same pattern as the EN/বাং toggle |
| F13 | **Internship page redesign** | **P1 (UI)** | C | Left: Blender-made cartoon story (video, poster frame first). Right: categories as plain typography, **no boxes/cards**. Replaces the airport/boarding-pass layout | `pages/Internships.jsx`, `internshipStories.js` |
| F14 | **Home popup timing** | **P1 (UI)** | all | The girl popup on the right appears **only when the intro story starts or is replayed**, not on a loop | `landing/Popups.jsx`, `landing/anime/story.js` |
| F5 | **AI Match Score** | P2 | A, C | % fit between the user's profile/CV and a job, on every card, with the top 3 reasons and gaps | CV Studio ATS match engine |
| F6 | **Application Kanban tracker** | P2 | A, B, C | Columns Saved → Applied → Interview → Offer / Rejected; drag on desktop, "Move to" menu on mobile; deadline reminders | `JobApplication.status`, `/applications` |
| F7 | **Typo-tolerant + Bangla search** | P2 | B | "softwer enginer", "ইন্টার্নশিপ" and Banglish "chakri" all work; synonyms (MTO = management trainee); suggestions when nothing matches | Nav search `/jobs?q=` |
| F8 | **PWA** | P2 | B | Installable; saved jobs + tracker work offline; push channel for F1 | Lite mode assets |
| F9 | **Company reviews (anonymous)** | P3 | all | Interview and internship experience, "paid on time?", rating. Anonymous display, extra weight for verified applicants, moderation | `Company`, `JobApplication` |
| F10 | **Salary insights (বেতন)** | P3 | A, D | Median/range by role × city × major from `salary_min/max` + reviews; shows "not enough data" when N < 5 | `Job.salary_*` |
| F11 | **Phone OTP + Google login** | P3 | B (OTP), A (Google) | OTP via a BD SMS gateway; Google One Tap; links to existing accounts by phone/email | `User.phone`, phone sign-up |
| F12 | **SSLCommerz payments skeleton** | P3 | D (later A) | Sandbox only: featured job post / premium CV review; IPN validation; no live money until the owner approves | — |
| A1 | **CI/CD + tests** | Always | team | GitHub Actions: lint, backend tests, frontend build on every PR; a cron workflow runs the scraper | Existing test suite (41 tests) |
| A2 | **Sentry + PostHog** | Always | team | Frontend and backend errors + product analytics as defined in [METRICS](METRICS.md) | — |

### Why this order
- **P1 = acquisition + retention + trust.** SEO brings users for free, alerts bring them back, the scam badge earns trust, and Lite mode lets district users actually use the site. The pieces are mostly independent, so they can be built in parallel. The two UI changes are small and owner-requested, so they ship in P1.
- **P2 = conversion.** Once users return, help them apply better (match score), keep track (Kanban), find jobs (search) and install the app (PWA).
- **P3 = moat + money.** Reviews and salary need data volume first, OTP costs money per SMS, and payments only make sense with traffic.

## 5. Cross-cutting requirements
- **Bilingual:** every new string goes through `t(en, bn)`; use Bangla numerals where the UI already does.
- **Accessibility:** respect `prefers-reduced-motion` (already standard); badges are never colour-only (icon + text).
- **Privacy:** alerts and OTP need explicit consent; phone numbers are never shown publicly; employers never see who wrote a review.
- **Performance budget:** Lite mode `/jobs` < 300 KB transfer; full-mode first job list < 1 MB.
- **Don't break what works:** the 3 apply channels, auto-apply and certificates keep working, and the test suite stays green.

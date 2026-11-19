# User Stories + Acceptance Criteria

Format: **As a** persona, **I want**, **so that**, then Given/When/Then. Personas are defined in [PRD](PRD.md) §2: Rafi (Dhaka fresher), Nila (district, low-end Android), Tanvir (credit internship), Sadia (HR). Event names in `code` are defined in [METRICS](METRICS.md).

---

## P1

### F1 · Job Alerts
**US-1.1** As Nila, I want to save a job alert for my major + city so that I never miss a deadline.
- **Given** I'm on `/jobs` with filters (major = BBA, location = Rajshahi, type = internship), **when** I tap "🔔 Alert দাও", **then** an alert is saved with those filters and I choose a channel (Email / Telegram / Push) and a frequency (Instant / Daily digest at 9 AM BD time). `alert_created` fires.
- **Given** I'm not logged in, **when** I tap "🔔", **then** I can create an email-only alert after confirming my email (double opt-in), with no account needed.
- **Given** I already have 10 alerts, **when** I try to add an 11th, **then** I see "সর্বোচ্চ ১০টা alert" and nothing is saved.

**US-1.2** As Nila, I want alerts on Telegram because I check it more than email.
- **Given** I choose Telegram, **when** I tap "Connect Telegram", **then** the bot opens with a one-time deep-link token, and after I press Start the alert channel shows "Connected ✓".
- **Given** a new job matches my alert, **when** it is published (admin, partner or scraper), **then** I receive at most 1 instant message per job within 15 minutes, carrying a tracked link (`utm_source=telegram`). `alert_sent` fires, then `alert_click` on open.

**US-1.3** As any user, I want to stop alerts easily.
- **Given** any alert email or Telegram message, **when** I click "Unsubscribe" or send `/stop`, **then** that alert is paused right away without login. `alert_unsubscribed` fires.
- **Given** a job flagged ⚠️ Caution or scam-confirmed, **then** it is **never** sent in an alert.

### F2 · Google-for-Jobs SEO
**US-2.1** As Rafi, I want to find Sonarhorin jobs straight from Google search.
- **Given** an active job, **when** Googlebot fetches `/jobs/<id>-<slug>`, **then** the HTML response (without running JS) contains the title, company, description and a valid `JobPosting` JSON-LD (`title, description, datePosted, validThrough, employmentType, hiringOrganization, jobLocation, baseSalary` when known, `directApply` true only for partner/email jobs).
- **Given** a job whose deadline has passed or that is inactive, **then** the page returns 410 (or JSON-LD is removed and `validThrough` is in the past) within 24h, and the job leaves `sitemap.xml`.
- **Given** the Google Rich Results Test, **when** run on 10 random job URLs, **then** all 10 pass with 0 errors.

**US-2.2** As Nila, I want a job link shared on Facebook/WhatsApp to show a proper preview.
- **Given** a job URL is pasted into Facebook or WhatsApp, **then** the preview shows `og:title` "Job title — Company", `og:description` (location · salary · deadline) and an `og:image` (company logo or a generated card).

**US-2.3** As the owner, I don't want scam or demo jobs indexed.
- **Given** a job flagged ⚠️ or marked "(demo)", **then** its page has `noindex` and no JSON-LD.

### F3 · Scam / fake job detector
**US-3.1** As Nila, I want to see at a glance whether a job is safe.
- **Given** a job from a partner company (`is_partner`) or a verified company domain, **then** its card and detail page show "✅ Verified" with a tooltip explaining why.
- **Given** a job whose text asks for money ("registration fee", "জামানত", "bKash/Nagad করে পাঠান"), gives only a WhatsApp/personal number, uses a free-mail HR address for a "large company", or offers a salary far above the role median, **then** it shows "⚠️ সাবধান / Caution" plus the specific reasons ("টাকা চাওয়া হয়েছে").
- **Given** no signal either way, **then** no badge is shown (neutral). We never show "✅" by default.

**US-3.2** As any user, I want to report a scam.
- **Given** a job page, **when** I tap "Report scam" and pick a reason (asked for money / fake company / harassment / other + optional text), **then** the report is saved, I see "ধন্যবাদ — ২৪ ঘণ্টার মধ্যে দেখা হবে", and `scam_report` fires. One report per user per job.
- **Given** 3 independent reports **or** a rule score ≥ the high threshold, **then** the job is hidden from listings and alerts until an admin reviews it.

**US-3.3** As an admin, I want a review queue.
- **Given** Admin → Scam reports, **then** I see flagged jobs sorted by score/report count, can mark "Safe" (removes ⚠️, whitelists the company) or "Scam" (deactivates the job and blocks the company), and `scam_review_decision` is logged.

### F4 · Lite mode (লাইট মোড)
**US-4.1** As Nila on a slow 4G connection, I want the site to load fast and use little data.
- **Given** my browser sends `Save-Data: on`, or `navigator.connection.effectiveType` is `2g`/`3g`, or `deviceMemory` ≤ 2, **when** I first open the site, **then** Lite mode turns on automatically with a dismissible note "লাইট মোড চালু — data বাঁচাতে". `lite_mode_on {trigger: "auto"}` fires.
- **Given** Lite mode is on, **then** no canvas/anime/Job Galaxy/StormCloud/magnetic cursor/video autoplay loads, web fonts are replaced by system fonts, images are lazy and ≤ 30 KB, and `/jobs` transfers < 300 KB (measured with Lighthouse "Slow 4G").
- **Given** any page, **when** I toggle "Lite" in the nav, **then** the choice is saved per browser and survives reload; switching it off restores the full experience.
- All core actions (search, filter, apply, alerts, tracker) work in Lite mode.

### F13 · Internship page redesign (UI)
**US-13.1** As Tanvir, I want the internship page to feel like a story and make categories easy to pick.
- **Given** I open `/internships` on desktop (≥ 1024 px), **then** the left ~55% plays the Blender-made cartoon story (MP4/WebM, muted autoplay, poster frame shown first, captions in EN/বাং) and the right side lists categories (Paid, Unpaid/Learning, Versity credit, Corporate, Remote …) as **plain typographic rows, with no boxes, cards, borders or shadows**, each with a live count.
- **Given** I tap a category, **then** the internship list filters to it with no page reload, and `internship_category_click` fires.
- **Given** mobile (< 768 px), **then** the story becomes a short poster/video strip on top and the categories follow as a list; nothing scrolls horizontally.
- **Given** Lite mode or `prefers-reduced-motion`, **then** only the poster image shows (no video download).
- **Given** "Versity credit", **then** each listing states whether a certificate/supervisor letter is provided (field shown or "unknown").

### F14 · Home popup timing (UI)
**US-14.1** As a visitor, I don't want the girl popup repeating at me in a loop.
- **Given** the home page, **when** the intro story (`landing/anime/story.js`) **starts** for the first time, **then** the girl popup on the right appears once, in sync with the story.
- **Given** the story has finished and holds on the title card, **then** the popup does **not** reappear on any timer, scroll or interval.
- **Given** I press "STORY" (replay), **then** the popup appears again once for that replay.
- **Given** I dismiss the popup, **then** it stays closed for the rest of the playthrough.
- The scam-alert popups on the left are unaffected by this change.

---

## P2

### F5 · AI Match Score
**US-5.1** As Rafi, I want to see how well I fit each job.
- **Given** I'm logged in and my profile or uploaded CV has skills/major, **when** I view `/jobs`, **then** each card shows "Match 72%" and the detail page shows the top 3 matched items and the top 3 gaps.
- **Given** I have no CV/profile data, **then** cards show "Add CV to see match" (no fake number).
- **Given** a score is computed, **then** it is deterministic for the same CV + job (cached) and takes < 300 ms p95 per card batch. `match_score_viewed` fires on the detail view.

### F6 · Application Kanban tracker
**US-6.1** As Nila, I want one board for all my applications.
- **Given** `/applications`, **then** I see columns সেভ করা (Saved) → Applied → Interview → Offer → Rejected, holding every existing `JobApplication` mapped from its status (submitted/sent/done → Applied, needs_action → Applied with a "finish on portal" tag).
- **Given** desktop, **when** I drag a card to another column, **then** it saves (optimistic UI, rollback on error) and `kanban_move {from, to}` fires. **Given** mobile, **then** a "Move to…" menu does the same (no drag needed).
- **Given** a saved job whose deadline is 2 days away, **then** I get a reminder on my alert channel (if I have one).
- **Given** the PWA offline, **then** the board is readable from cache and moves sync when I'm back online.

### F7 · Typo-tolerant + Bangla search
**US-7.1** As Nila, I want search to understand my typos and Bangla.
- **Given** I search "softwer enginer", "accountent" or "intarnship", **then** relevant results appear (trigram/fuzzy, edit distance ≤ 2).
- **Given** I search "ইন্টার্নশিপ", "চাকরি ঢাকা" or Banglish "chakri", **then** I get the same results as the English equivalent (synonym/transliteration map).
- **Given** "MTO", **then** management-trainee jobs match.
- **Given** zero results, **then** I see "কিছু পাওয়া যায়নি" + 3 suggestions (closest spelling, broader filter, "Create an alert for this") and `search_no_results {q}` fires.

### F8 · PWA
**US-8.1** As Nila, I want to install Sonarhorin like an app.
- **Given** Android Chrome after my 2nd visit or after I save a job, **then** a custom "Home screen-এ যোগ করুন" prompt shows (never on first page load). Installing fires `pwa_install`.
- **Given** the installed app with no network, **then** the shell, my saved jobs and the tracker load from cache; other pages show a Bangla offline page.
- **Given** I enable push, **then** it becomes an F1 alert channel.
- Lighthouse PWA installability checks pass.

---

## P3

### F9 · Company reviews (anonymous)
**US-9.1** As Tanvir, I want to read honest internship reviews of a company.
- **Given** a company page, **then** I see ratings (overall, learning, "paid on time?", interview difficulty) and review text, shown as "Anonymous · CSE intern · 2026". Reviews appear only when the company has ≥ 3 approved reviews.
- **Given** I'm logged in, **when** I submit a review, **then** it enters moderation; a "Verified applicant" tag appears only if I have a `JobApplication` to that company. `review_submitted` fires.
- **Given** a review contains a phone number, email or full name, **then** it is auto-held for moderation. Employers can respond publicly but never see the reviewer's identity.

### F10 · Salary insights (বেতন)
**US-10.1** As Rafi, I want to know the realistic fresher salary for a role.
- **Given** role "Software Engineer" + Dhaka, **when** at least 5 data points exist, **then** I see the median and P25–P75 in BDT/month and the sample size.
- **Given** fewer than 5, **then** "এখনো যথেষ্ট data নেই" is shown, never a guessed number.
- **Given** a job card with a known salary, **then** it shows "above/below median" when data allows.

### F11 · Phone OTP + Google login
**US-11.1** As Nila, I want to log in with my phone number without a password.
- **Given** I enter a BD number (+8801XXXXXXXXX format validated), **when** I tap "OTP পাঠাও", **then** I get a 6-digit SMS within 30s that is valid for 5 min, and `otp_requested` fires.
- **Given** a correct OTP, **then** I'm logged in (or a new account is created if the number is new) and `otp_login_success` fires. **Given** 5 wrong tries, **then** that number is locked for 15 min.
- **Given** the same number or IP requests more than 3 OTPs per hour, **then** further requests are blocked (SMS cost control).

**US-11.2** As Rafi, I want one-tap Google login.
- **Given** "Continue with Google", **when** my Google email matches an existing account, **then** it links to that account (no duplicate); otherwise a new account is created with my name/email pre-filled. `google_login_success` fires.

### F12 · SSLCommerz payments skeleton
**US-12.1** As Sadia, I want to pay for a featured job post.
- **Given** sandbox mode, **when** I click "Feature this job — ৳X", **then** I'm redirected to SSLCommerz sandbox, and on success the IPN is validated server-side (validation API + amount/currency/tran_id match) before the job is marked featured.
- **Given** a failed or cancelled payment, **then** nothing changes and the order shows "Failed".
- **Given** the same IPN delivered twice, **then** it is processed once (idempotent).
- Live mode stays off until the owner enables it in settings.

---

## Always

### A1 · CI/CD + cron scraper
- **Given** any PR, **then** GitHub Actions runs backend tests, frontend lint + build, and blocks merge on failure.
- **Given** the scheduled workflow (e.g. every 6h), **then** the scraper runs, posts a summary (created/updated/failed per source), and new jobs pass through the scam detector before going live.

### A2 · Sentry + PostHog
- **Given** an unhandled exception on the frontend or backend, **then** it appears in Sentry with release + route, and with no PII (phone/email scrubbed).
- **Given** the events in [METRICS](METRICS.md), **then** each is visible in PostHog with the listed properties; analytics respects a "Do not track" toggle and loads lazily (not in the Lite-mode critical path).

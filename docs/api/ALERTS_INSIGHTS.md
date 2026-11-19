# Job alerts, match score, salary insight and application stage

All endpoints are JSON. "Auth" means `Authorization: Bearer <access token>` (simplejwt).

## Job alerts (`apps.alerts`)

### Model

| field | type | notes |
|---|---|---|
| `name` | string ≤80 | required |
| `keywords` | string | comma separated; a job matches if **any** keyword appears (whole word) in title, company, description or requirements. Blank = all jobs |
| `job_type` | `any` \| `job` \| `internship` | `job` = full-time, trainee, part-time |
| `majors` | string | comma separated (`CSE,EEE`). Jobs open to any major always match |
| `location` | string | city, substring match on the job location. Blank = anywhere |
| `remote_ok` | bool (default `true`) | also match remote jobs outside `location` |
| `min_salary` | int, BDT/month | compared with `salary_max` (or `salary_min`). Jobs with no salary still match |
| `email` / `telegram` / `webpush` | bool | delivery channels (`email` defaults to `true`) |
| `telegram_chat_id` | string | required when `telegram` is on; numeric id or `@channel` |
| `frequency` | `instant` \| `daily` (default) | |
| `is_active` | bool | |
| `last_sent_at` | datetime, read-only | |

Only open, fresher-friendly jobs (`experience_max_years <= 1`) are ever matched. A user can keep up to 20 alerts.

### Endpoints (auth required; users only ever see their own alerts, others' return 404)

| method | path | |
|---|---|---|
| GET | `/api/alerts/` | list own alerts (plain array, no pagination) |
| POST | `/api/alerts/` | create |
| GET / PATCH / PUT / DELETE | `/api/alerts/<id>/` | read / update / delete |
| POST | `/api/alerts/<id>/test/` | send a sample message (up to 3 recent matching jobs) on every enabled channel now. Does not record deliveries. Throttled to 10/hour per user |

Test response:

```json
{"matched_jobs": 2, "channels": {"email": {"ok": true, "skipped": false, "detail": ""},
                                 "telegram": {"ok": false, "skipped": true, "detail": "Channel not configured"}}}
```

### How delivery works

1. A `post_save` signal on `jobs.Job` (creation only, after the transaction commits) calls
   `apps.alerts.services.queue_instant(job)`. This creates `AlertDelivery(status="pending")` rows for every matching
   **instant** alert and channel. The save path does no network I/O. It covers admin posts, `import_jobs` and the
   scraper (`update_or_create`). Code that uses `bulk_create` must call `queue_instant(job)` itself.
2. `python manage.py send_job_alerts` (run it on a cron, e.g. every 10 minutes):
   * queues digests for **daily** alerts that are due (`last_sent_at` older than 23 h, or never sent; the window is
     the jobs posted since `last_sent_at`, or the last 24 h);
   * sends every pending delivery, grouped into **one message per alert and channel** (max 15 jobs; the rest go next run);
   * retries `failed` deliveries up to 3 attempts; jobs that closed in the meantime are marked `skipped`.
   * `--skip-daily` sends only already-queued (instant) items.
3. `AlertDelivery` has a unique constraint on `(alert, job, channel)`, so a job is never sent twice on one channel,
   however often the command or the signal runs.

Statuses: `pending`, `sent`, `failed`, `skipped` (channel not configured, e.g. no Telegram token or web push stub).

Messages are bilingual (English and Bangla), with Bangla numerals in the Bangla line, and link to
`SITE_URL/jobs/<id>` and `SITE_URL/alerts`.

### Channels (`apps/alerts/channels.py`)

```python
class Channel:
    name = "..."
    def available(self, alert) -> bool: ...
    def send(self, alert, jobs, message) -> Result: ...   # Result(ok, error="", skipped=False)

channels.register(MyChannel())   # replaces the built-in channel with the same name
```

`message` = `{"subject", "text", "title", "short", "url"}`.

* **email**: Django `send_mail` to `user.email`. The console backend is used by default; set the `EMAIL_*` vars for SMTP.
* **telegram**: `POST https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/sendMessage` with `chat_id` and `text`.
  Skipped when the token or chat id is missing. The user must `/start` the bot first. The bot can then report the
  user's chat id; a `/start` handler that fills `telegram_chat_id` automatically is not built yet.
* **webpush**: **stub** (`WebPushChannel`). Its `available()` returns `False`, so these deliveries are `skipped`.
  To implement it, store browser `PushSubscription`s per user, subclass `WebPushChannel`, and override `available`
  (does the user have a subscription?) and `send` (pywebpush with `title`/`short`/`url` as the payload). Then call
  `register()` from your app's `AppConfig.ready()`.

## AI match score (`apps.insights`)

`GET /api/jobs/<id>/match/` (auth)

```json
{"score": 72, "matched": ["python", "git"], "missing": ["docker", "django"],
 "tips": ["This job asks for docker, django. ..."],
 "breakdown": {"skills": 50, "major_fit": 100, "cv_quality": 85},
 "cv_id": 12, "source": "rules", "cached": false}
```

* Job skills: terms from the CV analyzer's keyword vocabulary (`apps.cv.analyzer.KEYWORDS`, all majors) found in the
  job title, description and requirements. Generic soft skills are dropped when the job names specific ones.
* User skills: `user.skills` + the latest `CVAnalysis` (`extracted_text` and `report.keywords.found`).
* Score = 65% skill overlap + 20% major fit + 15% latest CV score. If no skills are found in the job, skill overlap
  counts as a neutral 60%. Without a CV, CV quality counts as 40%.
* With `ANTHROPIC_API_KEY` set, `ai.complete_json` adds up to 3 tips and may nudge the score by at most ±10
  (`source: "ai"`). If the AI is missing or fails, the rule result is returned as is.
* Cached for 6 h per (user, job, latest CV id, hash of profile skills/major/CGPA and job content).

## Salary insight

`GET /api/insights/salary/?title=&location=&type=` (public)

* `title`: normalised to keywords (seniority and filler words removed: "Junior Software Engineer" → `software engineer`).
  A job matches if its title contains every keyword.
* `location`: normalised to a city (`Dhaka (Gulshan)` → `dhaka`, `Chittagong` → `chattogram`).
* `type`: a `Job.job_type` value, or `job` / `internship`.
* Uses `salary_min`/`salary_max` of all jobs (active or not) with `experience_max_years <= 3` that have at least one
  salary bound. Median is the median of range midpoints.
* If fewer than 3 data points match the city, the city filter is dropped (`scope: "title (all cities)"` plus a
  `message`). If there are still fewer than 3, `stats` is `null`, `enough_data` is `false` and a bilingual
  `message` explains why.

```json
{"query": {"title_keywords": ["software", "engineer"], "city": "dhaka", "type": null},
 "currency": "BDT", "period": "month", "scope": "title+city",
 "stats": {"min": 25000, "median": 34000, "max": 45000, "count": 3}, "count": 3, "enough_data": true}
```

## Applicant stage (Kanban)

Before this change, applicants could only `POST /api/jobs/applications/<id>/done|withdraw/`.
`JobApplication.status` records what the system or employer did. The candidate's own board column is a separate field.

`PATCH /api/jobs/applications/<id>/stage/` (auth, owner only; other users get 404)

```json
{"candidate_stage": "interview"}      // applied | screening | interview | offer | hired | rejected | archived | null
```

Returns the application (same shape as `/api/jobs/applications/`, which now includes `candidate_stage`).
Migration: `jobs/0004_jobapplication_candidate_stage` (nullable `CharField`).

## Environment variables

| var | used by | default |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Telegram channel (read from settings or env) | unset → Telegram skipped |
| `ALERTS_FROM_EMAIL` | sender address of alert emails | `DEFAULT_FROM_EMAIL` |
| `ALERTS_SEND_ON_SAVE` | `1` = also send instant alerts right after a job is created, instead of waiting for the cron | off |
| `EMAIL_BACKEND`, `EMAIL_HOST`, … | email channel | console backend |
| `SITE_URL` | links in alert messages | `http://localhost:5173` |
| `ANTHROPIC_API_KEY` | optional AI enrichment of the match score | unset → rules only |

## Cron (DevOps)

```
*/10 * * * *  cd backend && python manage.py send_job_alerts
```

# Job search and company reviews: database notes

This page covers three things: the ranked, typo-tolerant, bilingual job search (`apps/jobs/search.py`); the company reviews app (`apps/reviews`); and the database settings (`config/settings.py`).

## 1. Job search

`GET /api/jobs/?q=...` calls `apps.jobs.search.search_jobs(qs, q)`. The function takes the already-filtered queryset (active, fresher-friendly, not expired) and returns it filtered and ordered by relevance (`search_rank` desc, then `posted_at` desc). The other filters (`major`, `location`, `type`, `channel`) still apply on top.

### Query understanding (both databases)

1. **Tokenize.** Words are split with a regex that keeps Bangla vowel signs (`ি`, `্`, …). Python's `\w` drops these.
2. **Stopwords.** Generic words are removed: `job`, `jobs`, `চাকরি`, `কাজ`, `in`, `এর`, … So "ঢাকা চাকরি" behaves the same as "ঢাকা". A query made only of stopwords is a no-op.
3. **Synonyms.** `SYNONYM_GROUPS` holds bidirectional Bangla↔English groups. Some examples:

   | Group | Members |
   |---|---|
   | software | software, সফটওয়্যার, সফটওয়ার |
   | internship | internship, intern, ইন্টার্নশিপ, ইন্টার্ন, শিক্ষানবিশ |
   | bank | bank, banking, ব্যাংক, ব্যাংকিং |
   | marketing | marketing, মার্কেটিং, বিপণন |
   | dhaka | dhaka, ঢাকা (also chattogram/chittagong/ctg/চট্টগ্রাম, sylhet, khulna, …) |

   To add a term, append to (or create) a group. No migration is needed.
4. **Structured hints.** internship, trainee and part-time words also match `job_type`. remote words also match `remote=True`.
5. **Matching logic.** Words are ANDed together. The synonyms within a word's group are ORed. The text fields searched are title, company name, description, location, majors and company industry.

### PostgreSQL (production)

| Piece | What it does |
|---|---|
| `SearchVector(..., config="simple")` | Weights: title and company name **A**, location/majors/industry **B**, description **C**. Uses the `simple` config: no stemming and no stopword dictionary, so Bangla tokens are indexed verbatim. Verified on PG 16: `to_tsvector('simple','সফটওয়্যার ইঞ্জিনিয়ার')` gives two tokens. |
| `SearchQuery` | One query per word, with synonyms ORed (`|`) and words ANDed (`&`). The match uses `@@`, not `rank > 0`, because `ts_rank` returns `1e-20` for rows that don't match. |
| `TrigramWordSimilarity` (pg_trgm) | Scores each typed word (3+ characters) against title, company name and location. A score ≥ `TRIGRAM_THRESHOLD` (0.5) counts as a match for that word. Examples: "softwer" → "Software Engineer" (0.625), "sistems" → "Shapla Systems". |
| rank | `ts_rank + 0.1 × title/company bonus + mean(word trigram similarity)` |

A row matches if the full-text query matches, or if every word matches by text/synonym or by trigram.

**Migration `apps/dbtools/0001_pg_trgm_search_indexes`.** This is a `RunPython` migration that checks `schema_editor.connection.vendor == "postgresql"`:

- runs `CREATE EXTENSION IF NOT EXISTS pg_trgm`. This is a trusted extension on PG13+, so the database owner can install it without superuser.
- creates `jobs_job_title_trgm` and `jobs_company_name_trgm` as `GIN (... gin_trgm_ops)` indexes.
- does nothing on SQLite. If the extension can't be created, it logs a warning and skips the indexes. `search.py` checks `pg_extension` once at runtime and then falls back to full-text plus `icontains`.
- on reverse, drops the indexes and leaves the extension installed.

The indexes live in a separate app so that `apps/jobs` migrations, which other teammates are editing, never conflict with them. They are raw SQL, so `makemigrations jobs` never sees them.

> **Scale note.** The tsvector is computed per query, and the similarity scores are annotations, so the planner still scans the (small) candidate set of active jobs. The candidate set is already narrowed by `is_active` and `deadline`. This is fine up to tens of thousands of jobs. Beyond that:
> - add a stored `search_vector` column with a GIN index (this needs a field on Job, so coordinate with the jobs owners);
> - switch the trigram branch to the indexable `title__trigram_word_similar` lookup (`<%` operator), which uses the GIN indexes above.

### SQLite (development and tests)

- The same tokenizing, stopwords and synonyms, matched with `icontains`.
- **Fuzzy fallback.** If a word's group matches nothing, `difflib.get_close_matches` (cutoff 0.75) corrects it. The vocabulary is built from live job titles, company names and locations, plus every known synonym term. Examples: "softwer" → software, "markting" → marketing, "enginer" → engineer.
- Rank is a per-word bonus (3 if the word is in the title, 2 if it is in the company name), summed across words.

Tests are in `apps/jobs/test_search.py` and cover typos, Bangla synonyms, AND semantics, the endpoint, and that trigram indexes exist only on Postgres. They pass on both SQLite and PostgreSQL 16.

## 2. Company reviews (`apps.reviews`)

### Models

**`CompanyReview`** fields:

- `company` (FK to `jobs.Company`) and `author` (FK to user)
- `anonymous` (default **True**)
- `role_title`
- `review_type`: interview, internship or job
- `rating` (1–5) and `interview_difficulty` (1–5, nullable)
- `got_offer` (nullable bool)
- `pros`, `cons`, `interview_questions`
- `created_at`
- `is_approved` (default True) and `report_count`

Database constraints and indexes on `CompanyReview`:

- `UNIQUE (company, author, review_type)`. A user gets one review per type per company.
- `CHECK` constraints on the rating and difficulty ranges.
- an index on `(company, is_approved, -created_at)` for the public list.

**`ReviewReport`** stores `(review, reporter, reason)` with `UNIQUE (review, reporter)`, so one user can't inflate `report_count`.

### API

| Method | URL | Auth | Notes |
|---|---|---|---|
| GET | `/api/reviews/companies/<slug>/?type=` | public | Returns approved reviews (latest 100) plus `aggregate`. |
| POST | `/api/reviews/companies/<slug>/` | user | Creates a review. A duplicate returns 400 with a friendly message. The view checks for duplicates first, and the database constraint backs it up if two requests race. |
| POST | `/api/reviews/<id>/report/` | user | Body `{reason}`. Returns 201 for a new report and 200 if the user already reported it. Reporting your own review returns 400. |

The `aggregate` object contains `count`, `avg_rating`, `avg_interview_difficulty`, `offer_rate` (among reviews that said whether they got an offer), `rating_distribution` and `by_type`.

**Anonymity.** When `anonymous` is true, `author` is `null`. The response contains no name and no user id. `is_mine` tells only the author that the review is theirs. Named reviews expose only `full_name` and `university`, never the email or phone.

**Moderation.** A review hides itself (`is_approved=False`) after `AUTO_HIDE_REPORTS` (3) distinct reports. The admin has *Approve (and clear reports)* and *Hide from public* actions, plus an inline list of the reports.

### PII and profanity guard (`apps/reviews/sanitize.py`)

This runs on `role_title`, `pros`, `cons` and `interview_questions` before saving.

- Emails become `[email removed]`.
- BD mobiles (`01XXXXXXXXX`, `+880 1XXX-XXXXXX`, written with Bangla digits `০১৭…` or ASCII) and any run of 8+ digits become `[phone removed]`. Short numbers such as a salary (35000), a CGPA or a year are kept.
- WhatsApp, Telegram and Messenger links become `[link removed]`.
- A small English and Bangla/Banglish profanity list is masked with `***`. The match is a whole-word match, so "assessment" is untouched.

## 3. Database settings review

Changes in `config/settings.py`:

- **`DATABASE_URL`** is now supported (`postgres://user:pass@host:5432/db?sslmode=require`), with no extra dependency. It takes priority over the existing `POSTGRES_*` variables (docker-compose), which take priority over SQLite. Query parameters (for example `sslmode`) become `OPTIONS`.
- On Postgres only:
  - `CONN_MAX_AGE` defaults to **60s** (env `CONN_MAX_AGE`). This is a persistent connection per gunicorn worker, instead of a reconnect per request.
  - `CONN_HEALTH_CHECKS=True`, so a reused connection is pinged first. This survives database restarts and failovers.
  - `connect_timeout` defaults to 5s (env `DB_CONNECT_TIMEOUT`).
  - `DB_POOL=1` switches to Django 5.1+'s native psycopg pool (`DB_POOL_MIN`/`DB_POOL_MAX`) and sets `CONN_MAX_AGE=0`, because the two are mutually exclusive. This needs `psycopg[pool]` (`psycopg_pool`), which is **not** in `requirements.txt` yet.
  - `DB_PGBOUNCER=1` sets `DISABLE_SERVER_SIDE_CURSORS`. This is required behind PgBouncer in transaction-pooling mode.
- Sizing: with `CONN_MAX_AGE`, the open connections roughly equal workers × threads per web instance, plus the scheduler. Keep this below the plan's `max_connections`. Use PgBouncer if the app scales out.

### Index gaps on `jobs_job` (not changed here, to avoid migration conflicts)

`Job.Meta` defines **no indexes** apart from the FK and the partial unique `(company, external_id)`. The hot filters are:

- the job list and matches: `is_active=True AND experience_max_years <= N AND (deadline IS NULL OR deadline >= today)`, ordered by `-posted_at`, optionally filtered by `job_type`.
- the scheduler stats: `is_active`, `job_type`.

The recommended index, to be added by whoever owns the next `apps/jobs` migration:

```python
indexes = [
    models.Index(fields=["is_active", "job_type", "deadline"], name="job_active_type_deadline_idx"),
    models.Index(fields=["-posted_at"], name="job_posted_idx"),
]
```

On Postgres, a partial index `ON jobs_job (posted_at DESC) WHERE is_active` would be even tighter. `JobApplication` is fine: `UNIQUE (user, job)` covers `filter(user=...)`. The daily auto-apply cap query (`user, auto, created_at__date`) could use an index on `(user, created_at)` later.

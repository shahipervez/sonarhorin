# Metrics, KPIs and Analytics Events

Tool: **PostHog** (product events) + **Sentry** (errors/perf). Event names are `snake_case` `object_action`. Never send raw email, phone, CV text or review text as a property.

## 1. North Star + top KPIs

**North Star:** **Weekly Applying Freshers (WAF)**, the number of unique users with ≥ 1 `apply_click` or `apply_submitted` in the week. It captures both "found a relevant job" and "trusted it enough to apply".

| KPI | Definition | Target (3 mo after P1) |
|---|---|---|
| WAF | above | +50% vs. pre-P1 baseline |
| D30 retention | % new users active again on day 25–35 | ≥ 20% |
| Alert-driven sessions | sessions with `utm_source` in (email_alert, telegram, push) ÷ all sessions | ≥ 35% |
| Organic share | new users whose first-touch referrer is Google ÷ all new users | ≥ 30% |
| Scam exposure | applies to jobs later confirmed scam ÷ all applies | < 0.5% |
| Lite-mode LCP | p75 LCP for `lite=true` sessions | < 3.0s |
| Outside-Dhaka share | active users with city ≠ Dhaka | ≥ 40% |

**Guardrails:** crash-free sessions ≥ 99.5%; API p95 < 800 ms; alert unsubscribe rate < 5% per send; scam false-positive rate (admin "Safe" ÷ all ⚠️) < 15%.

## 2. Global properties (on every event)
`user_id` (hashed / PostHog distinct id), `is_logged_in`, `lang` (en|bn), `track` (job|internship|startup), `lite_mode` (bool), `is_pwa` (bool), `device_memory`, `effective_type`, `city` (from profile, else null), `app_version`.

## 3. Events per feature

### Core funnel (existing, instrument now)
| Event | Properties | Notes |
|---|---|---|
| `job_list_viewed` | `source` (nav, search, alert, category), `filters`, `result_count` | |
| `job_viewed` | `job_id`, `company_id`, `job_type`, `apply_channel`, `badge` (verified, caution, none), `match_score?`, `referrer_type` (google, alert, direct, social) | |
| `apply_click` | `job_id`, `apply_channel` (partner, email, portal), `badge`, `match_score?`, `from` (card, detail, bulk, kanban) | NS input |
| `apply_submitted` | `job_id`, `apply_channel`, `auto` (bool) | server-side, when `JobApplication` is created |
| `portal_submit_confirmed` | `job_id` | "I've submitted it ✓" |
| `signup_completed` | `method` (email, phone_otp, google), `cv_autofill` (bool) | |

### F1 Alerts
| Event | Properties |
|---|---|
| `alert_created` | `alert_id`, `channel` (email, telegram, push), `frequency` (instant, daily), `filter_keys` (e.g. major, location), `logged_in` |
| `alert_channel_connected` | `channel` |
| `alert_sent` (server) | `alert_id`, `channel`, `job_count`, `digest` (bool) |
| `alert_click` | `alert_id`, `channel`, `job_id`, `position` |
| `alert_unsubscribed` | `alert_id`, `channel`, `reason?` |
| `alert_delivery_failed` (server) | `channel`, `error_code` |

KPIs: alert CTR (`alert_click` ÷ `alert_sent`) ≥ 8% on Telegram, ≥ 3% on email; % of WAU with ≥ 1 alert ≥ 40%.

### F2 SEO
Measured mainly in **Google Search Console** (not PostHog): indexed job pages ÷ active jobs (target ≥ 80%), Google-for-Jobs impressions and clicks, Rich Results errors = 0.
| Event | Properties |
|---|---|
| `landing_from_search` | `job_id?`, `engine` (google, bing), `is_google_jobs` (from `utm`/referrer) |
| `share_click` | `job_id`, `target` (facebook, whatsapp, copy) |

### F3 Scam detector
| Event | Properties |
|---|---|
| `scam_badge_shown` | `job_id`, `badge` (verified, caution), `reasons` (list of rule ids) — sample 10% |
| `scam_badge_tooltip_open` | `job_id`, `badge` |
| `scam_report` | `job_id`, `reason` (money, fake_company, harassment, other), `job_badge_at_report` |
| `scam_review_decision` (server) | `job_id`, `decision` (safe, scam), `hours_to_decision`, `trigger` (rules, reports, both) |
| `job_auto_hidden` (server) | `job_id`, `score`, `report_count` |

KPIs: median `hours_to_decision` < 24; precision of ⚠️ (scam ÷ reviewed) ≥ 85%; % of confirmed scams that were flagged before the first report ≥ 60%.

### F4 Lite mode
| Event | Properties |
|---|---|
| `lite_mode_on` | `trigger` (auto_save_data, auto_network, auto_memory, manual) |
| `lite_mode_off` | `trigger` (manual), `seconds_in_lite` |
| `web_vitals` | `lcp`, `inp`, `cls`, `transfer_kb`, `route` — sampled 20% |

KPIs: % sessions in Lite; p75 LCP Lite vs. full; bounce rate of `effective_type in (2g, 3g)` sessions (should drop ≥ 20%).

### F13 Internship page
| Event | Properties |
|---|---|
| `internship_story_play` | `autoplay` (bool), `lite_mode` |
| `internship_story_complete` | `seconds_watched` |
| `internship_category_click` | `category` (paid, unpaid, versity, corporate, remote, …), `result_count` |

KPI: `/internships` → `job_viewed` CTR up vs. old layout (A/B or before/after for 2 weeks).

### F14 Home popup timing
| Event | Properties |
|---|---|
| `intro_story_start` | `replay` (bool) |
| `story_popup_shown` | `replay` (bool) |
| `story_popup_click` / `story_popup_dismiss` | `replay` |

Check: `story_popup_shown` count per session ≤ (1 + number of replays). Any session above that is a bug.

### F5 Match score
| Event | Properties |
|---|---|
| `match_score_viewed` | `job_id`, `score_bucket` (0-39, 40-59, 60-79, 80+), `has_cv` |
| `match_gap_clicked` | `job_id`, `gap` (skill id) → e.g. opens CV Studio |

KPI: apply rate for 80+ vs. < 40 buckets (the score should predict applying; if not, the model is wrong).

### F6 Kanban tracker
| Event | Properties |
|---|---|
| `job_saved` | `job_id`, `from` (card, detail) |
| `kanban_move` | `application_id`, `from`, `to`, `method` (drag, menu) |
| `kanban_viewed` | `card_count` |
| `deadline_reminder_sent` / `_click` | `job_id`, `days_left` |

KPI: % applicants with ≥ 1 `kanban_move` (≥ 25%); share reaching Interview/Offer (self-reported outcome, also a success-stories source).

### F7 Search
| Event | Properties |
|---|---|
| `search_performed` | `q_len`, `script` (bn, en, banglish), `result_count`, `corrected` (bool), `latency_ms` |
| `search_no_results` | `q` (truncated to 60 chars, PII-stripped), `script`, `filters` |
| `search_suggestion_click` | `type` (spelling, broader, create_alert) |
| `search_result_click` | `position`, `job_id` |

KPI: no-results rate < 5%; Bangla-script search share; search → `job_viewed` CTR ≥ 40%. Review the top `search_no_results` queries weekly to grow the synonym list.

### F8 PWA
| Event | Properties |
|---|---|
| `pwa_prompt_shown` | `trigger` (second_visit, job_saved) |
| `pwa_install` | `platform` |
| `pwa_launch` | `offline` (bool) |
| `push_permission` | `result` (granted, denied, dismissed) |

### F9 Reviews · F10 Salary
| Event | Properties |
|---|---|
| `review_started` / `review_submitted` | `company_id`, `type` (interview, internship, job), `verified_applicant` |
| `review_moderated` (server) | `decision`, `auto_held` (bool) |
| `company_reviews_viewed` | `company_id`, `review_count` |
| `salary_insight_viewed` | `role`, `city`, `n`, `has_data` |

### F11 OTP / Google
| Event | Properties |
|---|---|
| `otp_requested` | `is_new_number`, `resend` (bool) |
| `otp_login_success` | `attempts`, `seconds_to_verify`, `new_account` |
| `otp_failed` | `reason` (wrong, expired, locked, rate_limited, sms_failed) |
| `google_login_success` | `new_account`, `linked_existing` |

KPIs: OTP success rate ≥ 85%; **SMS cost per successful login** (gateway bill ÷ `otp_login_success`); SMS delivery failures by operator (GP/Robi/Banglalink/Teletalk).

### F12 Payments
| Event | Properties |
|---|---|
| `checkout_started` | `product` (featured_job, cv_review), `amount_bdt` |
| `payment_result` (server, after IPN validation) | `status` (valid, failed, cancelled), `gateway_method` (bkash, nagad, card), `sandbox` |

### A1/A2 Engineering health
CI pass rate, deploy frequency, scraper run success + jobs created per run (from the GitHub Actions summary), Sentry error rate per release, crash-free sessions.

## 4. Dashboards (PostHog)
1. **Weekly overview**: WAF, new users by source, D7/D30 retention, outside-Dhaka share.
2. **Acquisition funnel**: `landing_from_search` → `job_viewed` → `apply_click` → `signup_completed`.
3. **Alerts**: created → sent → click → apply; unsubscribe rate by channel.
4. **Trust**: badges shown, reports, decision time, precision.
5. **Performance**: web vitals by `lite_mode` × `effective_type`.

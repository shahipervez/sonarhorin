# 🦌 সোনারহরিণ (Sonarhorin) — Run Anywhere Guide (কিভাবে চালাবেন)

যেকোনো নতুন কম্পিউটার বা সার্ভারে এই প্রজেক্টটি হুবহু একইভাবে চালু করার সহজ নির্দেশিকা।

---

## ⚡ ১-ক্লিকে চালানো (সবচেয়ে সহজ পদ্ধতি)

### 🪟 Windows ব্যবহারকারীদের জন্য:
1. ফোল্ডারের ভেতর থাকা **`start.bat`** ফাইলটিতে ডাবল-ক্লিক (Double Click) করুন।
2. স্বয়ংক্রিয়ভাবে ব্যাকএন্ড ও ফ্রন্টএন্ড সেটআপ হয়ে ব্রাউজারে সাইটটি ওপেন হয়ে যাবে!

### 🍎 macOS এবং 🐧 Linux ব্যবহারকারীদের জন্য:
1. টার্মিনাল ওপেন করে প্রজেক্ট ফোল্ডারে যান এবং রান করুন:
   ```bash
   ./start.sh
   ```
   *(কিংবা ম্যাকবুক-এ সরাসরি **`start.command`** ফাইলটিতে ডাবল-ক্লিক করুন)*

---

## 🛠️ ম্যানুয়াল পদ্ধতি (টার্মিনাল দিয়ে চালাতে চাইলে)

### প্রয়োজনীয় সফটওয়্যার:
- **Python 3.11+** ([https://www.python.org/downloads/](https://www.python.org/downloads/))
- **Node.js 18+** ([https://nodejs.org](https://nodejs.org))

---

### ধাপ ১: ব্যাকএন্ড সার্ভার চালু করা (Django)
নতুন একটি টার্মিনাল ওপেন করুন:
```bash
cd backend

# ১. ভার্চুয়াল এনভায়রনমেন্ট তৈরি ও একটিভ করুন
python -m venv .venv

# Windows এ:
.venv\Scripts\activate
# Mac / Linux এ:
source .venv/bin/activate

# ২. ডিপেনডেন্সি ইন্সটল করুন
pip install -r requirements.txt

# ৩. ডাটাবেস মাইগ্রেশন
python manage.py migrate

# ৪. সার্ভার রান করুন
python manage.py runserver 127.0.0.1:8000
```
✅ ব্যাকএন্ড চালু হবে: **`http://127.0.0.1:8000/`**

---

### ধাপ ২: ফ্রন্টএন্ড সার্ভার চালু করা (Vite + React)
আরেকটি নতুন টার্মিনাল ওপেন করুন:
```bash
cd frontend

# ডিপেনডেন্সি ইন্সটল করুন
npm install

# ডেভেলপমেন্ট সার্ভার রান করুন
npm run dev
```
✅ ওয়েবসাইট চালু হবে: **`http://127.0.0.1:5173/`**

---

## 🔑 টেস্ট ও ডেমো অ্যাকাউন্ট ক্রেডেনশিয়াল:

### ১. 📱 সাধারণ ইউজার একাউন্ট (Phone Number):
- **ফোন নম্বর:** `01700000000`
- **পাসওয়ার্ড:** `demo1234`
*(অথবা রেজিস্ট্রেশন পেজে গিয়ে নিজের যেকোনো ফোন নম্বর দিয়ে নতুন অ্যাকাউন্ট খুলতে পারবেন)*

### ২. ⚡ অ্যাডমিন একাউন্ট (Gmail / Email):
- **জিমেইল:** `admin@sonarhorin.com`
- **পাসওয়ার্ড:** `admin1234`

---

## 🌟 প্রজেক্টে যা যা যুক্ত আছে:
- 👑 **নতুন গোল্ডেন হরিণ লোগো:** ব্র্যান্ডিং, ন্যাভবার, ফুটার ও ফ্যাভিকনে ব্যবহৃত।
- 🌲 **মায়াবী ফরেস্ট লগইন পেজ:** ফ্রস্টেড গ্লাস মরফিজম (`/login`)।
- 🕷️ **বিডি জব স্ক্র্যাপার ও অটো-পোস্টিং:** বিডি ক্যারিয়ার পোর্টাল থেকে স্বয়ংক্রিয় জব কালেকশন।
- 📱 **ফোন-নম্বর ভিত্তিক ইউজার অথেন্টিকেশন।**
- 💾 **সম্পূর্ণ প্রি-বিল্ট ডাটাবেস (`db.sqlite3`):** সকল ডেমো ইউজার, অ্যাডমিন ও জব পোস্টসহ সংরক্ষিত।

## Automatic job import (company job boards) + one-click apply

Sonarhorin pulls openings straight from companies' **public** job boards every hour — no scraping, no LinkedIn.

| ATS | Find the slug in | Import | One-click apply from Sonarhorin |
|---|---|---|---|
| Greenhouse | `boards.greenhouse.io/<slug>` or `job-boards.greenhouse.io/<slug>` | ✅ | ✅ with the company's Job Board API key |
| Lever | `jobs.lever.co/<slug>` | ✅ | ✅ with the company's postings API key |
| Workable | `apply.workable.com/<slug>` | ✅ | ❌ (needs a Workable partner token) → assisted apply |

1. Admin → Companies → add/open a company → **Automatic job import**: set `ats`, `ats_slug`, tick `auto_import`.
2. (Optional) Ask the company for its key and paste it in **One-click apply** → candidates apply in one tap and the
   application lands in the company's own ATS. Without a key the job uses assisted apply.
3. Run now: admin action "Import jobs now", or `python manage.py import_ats_jobs --logos`.

Only Bangladesh / remote-from-Bangladesh roles that ask ≤ 1 year of experience are imported (turn off `bd_only` per company).
Jobs that disappear from the board are closed automatically.

**Logos:** only real logos, downloaded from the company's own website (apple-touch-icon / site icon / favicon) or a
URL an admin provides. If none is found, the UI shows the company name — nothing is drawn.

The old LinkedIn guest scraper (`scraper.py`) is off. LinkedIn's terms forbid scraping; it only runs if
`ENABLE_LINKEDIN_GUEST_SCRAPER=1` is set deliberately.

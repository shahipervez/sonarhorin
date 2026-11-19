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

### ⚙️ স্ক্রিপ্ট যা যা নিজে থেকে করে:
- `backend/.venv` না থাকলে (বা নষ্ট হলে) নতুন করে তৈরি করে।
- `requirements.txt` বদলালে তবেই আবার `pip install` চালায় (পরের বার অনেক দ্রুত চালু হয়)।
- `backend/.env` না থাকলে লোকাল ডেভেলপমেন্টের জন্য একটি `.env` বানায় (`DJANGO_DEBUG=True`)।
- `migrate` চালায়; ডাটাবেস খালি হলে ডেমো ডাটা (`seed_data` + `seed --demo-user`) লোড করে।
- পোর্ট 8000 / 5173 আগে থেকেই ব্যস্ত থাকলে পরিষ্কার মেসেজ দেখায়।
- অপশন: `NO_BROWSER=1 ./start.sh` (ব্রাউজার খুলবে না), `SETUP_ONLY=1 ./start.sh` (শুধু সেটআপ),
  `FORCE_INSTALL=1 ./start.sh` (সব প্যাকেজ আবার ইন্সটল)।

---

## 🧑‍💻 VS Code / Google Antigravity দিয়ে চালানো

Antigravity (এবং Cursor) VS Code-ভিত্তিক, তাই একই সেটআপ সব জায়গায় কাজ করে।

1. প্রজেক্ট ফোল্ডারটি **File → Open Folder** দিয়ে ওপেন করুন।
2. ডানদিকে নিচে “Recommended extensions” এলে **Install All** চাপুন
   (Python, Python Debugger, ESLint, Prettier ইত্যাদি — `.vscode/extensions.json`)।
3. বাঁ দিকের **Run and Debug** (`Ctrl/Cmd + Shift + D`) প্যানেল থেকে **“Full stack”** বেছে **F5** চাপুন।
   - প্রথমবার এটি নিজে থেকে `Setup: install + migrate + seed` টাস্ক চালাবে, তারপর
     Django (`:8000`) ও Vite (`:5173`) দুটোই ডিবাগার সহ চালু হবে।
   - Python ফাইলে ব্রেকপয়েন্ট দিলে সরাসরি থামবে।
4. আলাদা করে চালাতে: `Django: runserver (API :8000)` বা `Vite: dev server (web :5173)`।
   React ডিবাগ করতে সাইট চালু থাকা অবস্থায় `Chrome: open site (debug React)`।
5. অন্যান্য কাজ: **Terminal → Run Task…** → `Backend: tests`, `Frontend: unit tests`,
   `Frontend: build`, `Backend: migrate`, `Scrape jobs now`।

> Python ইন্টারপ্রেটার হিসেবে `backend/.venv` নিজে থেকেই সিলেক্ট হয় (`.vscode/settings.json`)।
> না হলে `Ctrl/Cmd + Shift + P` → **Python: Select Interpreter** → `backend/.venv`।

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

---

## ⏰ জব স্ক্র্যাপার ও অটোমেটিক কাজ (Scheduler)

- **লোকাল ডেভেলপমেন্টে** (`DJANGO_DEBUG=True`) আগের মতোই `runserver`-এর ভেতরে একটি ব্যাকগ্রাউন্ড থ্রেড
  প্রতি ৬০ মিনিটে জব স্ক্র্যাপ করে (`AUTO_SCRAPE_INTERVAL_MINUTES` দিয়ে বদলানো যায়)।
- **প্রোডাকশন / Vercel-এ** এই থ্রেড ডিফল্টভাবে **বন্ধ** — সার্ভারলেস প্রসেস রিকোয়েস্টের মাঝে ঘুমিয়ে যায়,
  তাই থ্রেড নির্ভরযোগ্য নয়। চালু/বন্ধ জোর করে করতে: `ENABLE_INPROCESS_SCHEDULER=true` / `false`।
- প্রোডাকশনে কাজগুলো চালায় **GitHub Actions cron** (`.github/workflows/`):

| ওয়ার্কফ্লো | কখন | কমান্ড |
|---|---|---|
| `scrape-jobs.yml` | প্রতি ৬ ঘণ্টায় | `python manage.py run_job_scraper` |
| `job-alerts.yml` | প্রতি ১৫ মিনিটে | `python manage.py send_job_alerts` |
| `job-trust.yml` | প্রতিদিন (ঢাকা সময় রাত ৩:২৩) | `python manage.py check_job_trust` |

  সেটআপ: GitHub রিপো → **Settings → Secrets and variables → Actions** → `DATABASE_URL`
  (প্রোডাকশন Postgres), `DJANGO_SECRET_KEY` (প্রোডাকশনের মতো একই), আর দরকার মতো `EMAIL_*`,
  `VAPID_*`, `SMS_*` ইত্যাদি (`_manage-command.yml`-এর উপরে পুরো তালিকা)। **Actions** ট্যাব থেকে
  “Run workflow” চাপলে হাতেও চালানো যায়। কমান্ড এখনো না থাকলে ওয়ার্কফ্লো সবুজ হয়ে স্কিপ করে।
- ভবিষ্যতের বিকল্প: ট্রাফিক বাড়লে **Celery + Redis** (`celery beat`) — `docker-compose.yml`-এ Redis
  আগে থেকেই আছে; শুধু `worker` ও `beat` সার্ভিস যোগ করতে হবে। এখনো দরকার নেই।

---

## 🚀 CI ও ডেপ্লয় নোট

- প্রতিটি push / PR-এ `.github/workflows/ci.yml` চলে: ব্যাকএন্ড (Python 3.11 ও 3.12 —
  `check --deploy`, মাইগ্রেশন চেক, `manage.py test`), ফ্রন্টএন্ড (Node 20 — `npm test`, `npm run build`),
  আর Playwright e2e (ঐচ্ছিক, ফেল করলেও মার্জ আটকায় না)।
- ভিডিও/ছবি ছোট করার স্ক্রিপ্ট: `tools/optimize-media.sh` (ffmpeg লাগবে)। CDN-এ মিডিয়া সরানোর নিয়ম:
  `docs/MEDIA_CDN.md` (`VITE_MEDIA_BASE` + `frontend/src/media.js`)।
- ক্যাশ ও সিকিউরিটি হেডার: `frontend/nginx.conf` + `frontend/security_headers.conf` (Docker) এবং
  `vercel.json` (Vercel)। CSP এখন **Report-Only** — ব্রাউজার কনসোলে কোনো ভায়োলেশন না দেখলে পরে enforce করুন।

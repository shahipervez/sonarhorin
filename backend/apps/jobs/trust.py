"""Fake / scam job detector (রুল-ভিত্তিক প্রতারণা শনাক্তকরণ).

The #1 risk for freshers in Bangladesh is a "job" that asks for money (registration fee, security deposit,
bKash "processing charge", overseas visa fee …). This module scores a job posting with transparent, bilingual
rules — no API key needed. When Claude is configured, :func:`assess_job` can optionally ask it for extra
reasons, but the model can only *add* reasons / *raise* the level to caution; it can never lower a rule
verdict or mark anything verified.

Output (stored on ``Job.trust_*`` and exposed by the API)::

    {"level": "verified" | "ok" | "caution" | "danger",
     "score": 0-100,            # trust score — higher is safer (100 - risk)
     "reasons": [{"code", "en", "bn", "weight"}]}
"""
import logging
import re

log = logging.getLogger(__name__)

LEVELS = ("verified", "ok", "caution", "danger")
CAUTION_AT = 20      # risk >= this → caution
DANGER_AT = 55       # risk >= this → danger
REPORTS_FOR_CAUTION = 3
FRESHER_SALARY_CAP = 150_000  # BDT / month — above this for a 0–1 yr role is unrealistic

BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
# Python's \b does not work with Bangla vowel signs, so Bangla terms use explicit "not a Bangla letter" guards.
_B = r"(?<![ঀ-৿])"
_E = r"(?![ঀ-৿])"
FREE_MAIL = ("gmail.com", "yahoo.com", "ymail.com", "hotmail.com", "outlook.com", "live.com", "aol.com", "proton.me",
             "protonmail.com", "icloud.com", "mail.com", "gmx.com", "yandex.com")


def _rx(*parts):
    return re.compile("|".join(parts), re.I)


# Legit posts often say "no fee" / "কোনো ফি নেই" — strip those before looking for money requests.
NEGATED_MONEY = _rx(
    r"\b(?:no|zero|never|without|free\s+of|not\s+(?:required\s+to\s+)?(?:ask|charge|take|pay))\b[^.\n।]{0,30}?"
    r"\b(?:fees?|charges?|money|deposits?|payments?|cost)\b",
    r"\b(?:fees?|charges?|money|deposits?|payments?)\b[^.\n।]{0,20}?\b(?:not\s+required|free|never|waived)\b",
    r"\bfree\s+of\s+(?:cost|charge)\b",
    _B + r"(?:কোনো|কোন|কোনও)\s*(?:ধরনের\s*)?(?:ফি|টাকা|চার্জ|জামানত)" + _E + r"[^.\n।]{0,25}?(?:লাগবে\s*না|লাগে\s*না|নেই|নাই|নেওয়া\s*হয়\s*না|নিই\s*না)",
    _B + r"(?:ফি|টাকা|চার্জ|জামানত)" + _E + r"[^.\n।]{0,15}?(?:লাগবে\s*না|লাগে\s*না|নেই|নাই|প্রয়োজন\s*নেই|নেওয়া\s*হয়\s*না)",
    _B + r"(?:বিনামূল্যে|বিনা\s*খরচে|সম্পূর্ণ\s*ফ্রি)" + _E,
)

MONEY_ASK = _rx(
    r"\b(?:registration|processing|joining|training|application|security|service|form|visa|medical|admission|"
    r"enrol(?:l)?ment|kit|uniform|id\s*card|document(?:ation)?|verification|activation|courier)\s+"
    r"(?:fees?|charges?|deposits?|money|costs?)\b",
    r"\bsecurity\s+(?:money|deposit)\b",
    r"\brefundable\s+(?:fees?|deposits?|amount)\b",
    r"\b(?:pay|deposit|send|transfer)\s+(?:(?:a|the|an|us|only|just|your)\s+){0,2}(?:tk\.?|taka|bdt|৳|rs\.?|\d)",
    r"\b(?:advance|upfront)\s+(?:payment|fees?|money)\b",
    r"\b(?:tk\.?|taka|bdt|৳)\s*[\d,]+\s*(?:only\s+)?(?:fees?|charges?|deposit)\b",
    r"\bfees?\s*(?:of\s*)?(?::|-)?\s*(?:tk\.?|taka|bdt|৳)\s*[\d,]+",
    _B + r"(?:রেজিস্ট্রেশন|রেজিষ্ট্রেশন|নিবন্ধন|প্রসেসিং|ভর্তি|আবেদন|প্রশিক্ষণ|ট্রেনিং|সার্ভিস|ভিসা|মেডিকেল|জয়েনিং|ফরম|ফর্ম)\s*(?:ফি|চার্জ|খরচ)" + _E,
    _B + r"(?:জামানত|সিকিউরিটি\s*(?:মানি|ডিপোজিট)|অগ্রিম\s*(?:টাকা|পেমেন্ট))" + _E,
    _B + r"টাকা\s*(?:জমা|পাঠান|পাঠাতে|দিতে\s*হবে|দিয়ে|প্রদান|পরিশোধ)",
    _B + r"(?:ফি|চার্জ)\s*(?:বাবদ|হিসেবে|দিতে)",
)

PAY_APP = r"(?:bkash|b-kash|nagad|rocket|upay|বিকাশ|নগদ|রকেট)"
PAY_APP_MONEY = _rx(
    r"\b(?:send|pay|payment|deposit|transfer|cash\s*in|send\s*money|fees?|charges?)\b[^.\n।]{0,40}?" + PAY_APP,
    PAY_APP + r"[^.\n।]{0,30}?\b(?:personal|number|no\.?|payment|send\s*money|cash\s*in)\b",
    _B + r"(?:পাঠান|পেমেন্ট|জমা|সেন্ড\s*মানি|ক্যাশ\s*ইন|টাকা)" + _E + r"[^.\n।]{0,40}?" + PAY_APP,
    PAY_APP + r"[^.\n।]{0,30}?(?:পার্সোনাল|নম্বর|নাম্বার|পেমেন্ট|সেন্ড\s*মানি|ক্যাশ\s*ইন)",
)

CHAT_ONLY = _rx(r"\bwhats\s*app\b", r"\btelegram\b", r"\bimo\b", r"\bwa\.me/", r"\bt\.me/", r"\bviber\b",
                r"(?:হোয়াটসঅ্যাপ|হোয়াটসআপ|টেলিগ্রাম|ইমো)")
CHAT_STRICT = _rx(r"\b(?:only|just)\s+(?:via\s+|on\s+|through\s+)?(?:whats\s*app|telegram|imo|inbox)\b",
                  r"\b(?:whats\s*app|telegram|imo)\s+only\b", r"\binbox\s+(?:me|us)\b",
                  r"(?:হোয়াটসঅ্যাপ|টেলিগ্রাম|ইমো|ইনবক্স)[^.\n।]{0,20}?(?:যোগাযোগ\s*করুন|মেসেজ\s*দিন|নক\s*দিন|এ\s*নক)")

GUARANTEE = _rx(r"\b100\s*%\s*(?:job\s+)?(?:guarantee|guaranteed|placement)\b", r"\bjob\s+guarantee", r"\bguaranteed\s+(?:job|placement|selection|income)\b",
                r"\bsure\s+(?:job|selection)\b",
                _B + r"(?:১০০|100)\s*%?\s*(?:ভাগ\s*)?(?:চাকরি|চাকুরি|চাকরির|চাকুরির)\s*(?:নিশ্চয়তা|গ্যারান্টি|নিশ্চিত)",
                _B + r"(?:চাকরি|চাকুরি|চাকরির|চাকুরির)\s*(?:নিশ্চিত|গ্যারান্টি|নিশ্চয়তা)" + _E,
                _B + r"নিশ্চিত\s*(?:চাকরি|চাকুরি|আয়)" + _E)

TASK_SCAM = _rx(r"\blike\s+(?:(?:youtube|facebook|fb|tiktok|instagram|insta)\s+)?(?:videos?|posts?|pages?|photos?|reels?)\b", r"\b(?:watch|view)\s+(?:videos?|ads?|adverts?)\b[^.\n]{0,30}\b(?:earn|income|pay)",
                r"\bsubscribe\s+(?:to\s+)?(?:youtube|channels?)\b[^.\n]{0,30}\b(?:earn|income|pay)",
                r"\b(?:rate|review)\s+(?:products?|hotels?|apps?)\b[^.\n]{0,30}\b(?:earn|commission)",
                r"\b(?:simple|easy|online)\s+tasks?\b[^.\n]{0,40}\b(?:earn|income|commission|daily)",
                r"\btask[- ]based\s+(?:income|earning)\b", r"\b(?:crypto|forex|binary\s+option)s?\s+(?:trading\s+)?(?:job|income|earning|investment)\b",
                r"\b(?:investment|invest)\s+(?:and|&)\s+earn\b", r"\bdownload\s+(?:the\s+)?apps?\b[^.\n]{0,30}\bearn",
                _B + r"(?:ভিডিও\s*দেখে|লাইক\s*দিয়ে|অ্যাড\s*দেখে|বিজ্ঞাপন\s*দেখে|অ্যাপ\s*ডাউনলোড\s*করে|টাস্ক\s*করে|সাবস্ক্রাইব\s*করে)\s*(?:আয়|ইনকাম|টাকা)")
MLM = _rx(r"\b(?:mlm|multi[- ]level\s+marketing|network\s+marketing|pyramid|refer\s*(?:&|and)\s*earn|referral\s+income|joining\s+bonus\s+for\s+referr)",
          _B + r"(?:নেটওয়ার্ক\s*মার্কেটিং|এমএলএম|রেফার\s*করে\s*আয়)")
EASY_MONEY = _rx(r"\b(?:earn|income)\b[^.\n]{0,25}\b(?:from|at)\s+home\b", r"\bwork\s+from\s+home\b[^.\n]{0,40}\b(?:daily|per\s+day|weekly)\s+(?:income|earn|pay)",
                 r"\bpart[- ]time\s+(?:online\s+)?(?:income|earning)\b",
                 _B + r"(?:ঘরে\s*বসে|মোবাইল\s*দিয়ে|মোবাইলে)\s*(?:আয়|ইনকাম|উপার্জন)", _B + r"(?:অনলাইনে|অনলাইন)\s*(?:আয়|ইনকাম)" + _E)
DAILY_PAY = _rx(r"\b(?:daily|per\s+day|a\s+day|each\s+day|every\s+day|/\s*day)\b[^.\n]{0,20}?(?:tk\.?|taka|bdt|৳)?\s*([\d,]{3,7})",
                r"([\d,]{3,7})\s*(?:tk\.?|taka|bdt|৳|টাকা)\s*(?:daily|per\s+day|a\s+day|/\s*day)\b",
                r"(?:tk\.?|taka|bdt|৳)\s*([\d,]{3,7})\s*(?:daily|per\s+day|a\s+day|/\s*day)\b",
                _B + r"(?:দৈনিক|প্রতিদিন|প্রতি\s*দিন|রোজ|দিনে)" + _E + r"[^.\n।]{0,20}?([\d,]{3,7})\s*(?:টাকা|tk|৳)?",
                r"([\d,]{3,7})\s*(?:টাকা|tk|৳)\s*(?:দৈনিক|প্রতিদিন|প্রতি\s*দিন)")
SALARY_TEXT = _rx(r"\b(?:salary|pay|remuneration|income)\b[^.\n\d]{0,20}?(?:tk\.?|taka|bdt|৳)?\s*([\d,]{5,9})",
                  _B + r"(?:বেতন|সম্মানী|মাসিক\s*আয়)" + _E + r"[^.\n।\d]{0,20}?([\d,]{5,9})")

SENSITIVE = _rx(r"\bOTP\b", r"\b(?:verification|security)\s+code\b[^.\n]{0,25}\b(?:send|share|tell)", r"\bPIN\s*(?:number|code)?\b",
                r"\bCVV\b", r"\b(?:atm|debit|credit|bank)\s+card\s+(?:number|details|info|photo|copy|pin)\b", r"\bbank\s+(?:login|password)\b",
                r"\b(?:bkash|nagad|rocket)\s+(?:pin|password)\b",
                _B + r"(?:ওটিপি|পিন\s*নম্বর|পিন\s*কোড|ভেরিফিকেশন\s*কোড|এটিএম\s*কার্ড|ব্যাংক\s*কার্ড|কার্ডের\s*নম্বর)" + _E)
NID_TO_CHAT = _rx(r"\b(?:nid|national\s+id)\b[^.\n]{0,30}\b(?:whats\s*app|telegram|imo|inbox|messenger)\b",
                  r"\b(?:whats\s*app|telegram|imo|inbox|messenger)\b[^.\n]{0,30}\b(?:nid|national\s+id)\b",
                  r"(?:এনআইডি|জাতীয়\s*পরিচয়পত্র)[^.\n।]{0,30}(?:হোয়াটসঅ্যাপ|ইনবক্স|ইমো|টেলিগ্রাম)")
OVERSEAS = _rx(r"\b(?:dubai|saudi|ksa|uae|qatar|kuwait|oman|bahrain|malaysia|singapore|maldives|romania|poland|croatia|serbia|"
               r"portugal|italy|japan|korea|russia|europe|abroad|overseas|work\s+permit|visa)\b",
               _B + r"(?:বিদেশ|বিদেশে|দুবাই|সৌদি|মালয়েশিয়া|মালয়েশিয়া|সিঙ্গাপুর|কাতার|কুয়েত|ওমান|রোমানিয়া|ইউরোপ|ভিসা|ওয়ার্ক\s*পারমিট)")
NO_INTERVIEW = _rx(r"\bno\s+interview\b", r"\bwithout\s+(?:any\s+)?interview\b", r"\bdirect\s+(?:joining|appointment)\b",
                   _B + r"(?:ইন্টারভিউ|সাক্ষাৎকার)\s*(?:ছাড়াই|ছাড়া|লাগবে\s*না)", _B + r"সরাসরি\s*(?:নিয়োগ|জয়েনিং)" + _E)
EMAIL_RX = re.compile(r"[\w.+-]+@([\w-]+(?:\.[\w-]+)+)")


def _num(s: str) -> int:
    try:
        return int(re.sub(r"[^\d]", "", s or "") or 0)
    except ValueError:
        return 0


def _r(code, weight, en, bn):
    return {"code": code, "weight": weight, "en": en, "bn": bn}


def evaluate(*, title="", description="", requirements=None, company_name="", company_website="", is_partner=False,
             apply_email="", apply_url="", careers_url="", location="", salary_min=None, salary_max=None, experience_max_years=0,
             reports=0, **_ignored) -> dict:
    """Pure rule engine over plain values (easy to unit-test). See the module docstring for the output."""
    reqs = requirements or []
    if isinstance(reqs, str):
        reqs = [reqs]
    raw = "\n".join([title or "", description or "", "\n".join(str(r) for r in reqs)]).translate(BN_DIGITS)
    text = NEGATED_MONEY.sub(" ", raw)
    reasons = []

    money = bool(MONEY_ASK.search(text))
    pay_app = bool(PAY_APP_MONEY.search(text)) and "bkash" not in (company_name or "").lower() \
        and "nagad" not in (company_name or "").lower()
    if money:
        reasons.append(_r("money", 60, "Asks applicants to pay a fee / deposit. Real employers never charge to hire you.",
                          "আবেদনকারীর কাছ থেকে ফি/জামানত চাওয়া হয়েছে। আসল প্রতিষ্ঠান চাকরি দিতে কখনো টাকা নেয় না।"))
    if pay_app:
        reasons.append(_r("mobile_payment", 30 if money else 45,
                          "Asks for payment via bKash / Nagad / Rocket to a personal number.",
                          "বিকাশ/নগদ/রকেটে (পার্সোনাল নম্বরে) টাকা পাঠাতে বলা হয়েছে।"))

    emails = {e.lower() for e in EMAIL_RX.findall(raw)}
    if apply_email and "@" in apply_email:
        emails.add(apply_email.split("@", 1)[1].lower())
    free = sorted(d for d in emails if d in FREE_MAIL)
    corporate_contact = bool(apply_url or careers_url or any(d not in FREE_MAIL for d in emails))

    chat = bool(CHAT_ONLY.search(raw))
    if chat and (CHAT_STRICT.search(raw) or not corporate_contact):
        reasons.append(_r("chat_only", 20, "Contact is only via WhatsApp / Telegram / IMO — no official email or careers page.",
                          "শুধু হোয়াটসঅ্যাপ/টেলিগ্রাম/ইমোতে যোগাযোগ — অফিসিয়াল ইমেইল বা ওয়েবসাইট নেই।"))
    elif chat:
        reasons.append(_r("chat_contact", 5, "Asks you to contact on a chat app. Prefer the official email / careers page.",
                          "চ্যাট অ্যাপে যোগাযোগ করতে বলা হয়েছে — অফিসিয়াল ইমেইল/ওয়েবসাইট ব্যবহার করুন।"))

    if free and not is_partner:
        corp = bool(company_website) or len((company_name or "").split()) >= 2
        reasons.append(_r("free_email", 15 if corp else 8,
                          f"Uses a personal email ({free[0]}) instead of a company domain.",
                          f"কোম্পানির ডোমেইনের বদলে ব্যক্তিগত ইমেইল ({free[0]}) ব্যবহার করা হয়েছে।"))

    fresher = (experience_max_years or 0) <= 1
    lo, hi = salary_min or salary_max or 0, salary_max or salary_min or 0
    coherent = lo <= hi <= lo * 4  # scraped salaries are often garbled (min > max, 30x spread) — ignore those
    text_salaries = [_num(m.group(1) or "") for m in SALARY_TEXT.finditer(text)]
    if fresher and ((coherent and lo > FRESHER_SALARY_CAP) or any(s > FRESHER_SALARY_CAP for s in text_salaries)):
        reasons.append(_r("salary", 30, "Salary is unrealistically high for a fresher (over ৳150,000/month).",
                          "ফ্রেশারের জন্য অস্বাভাবিক বেশি বেতন (মাসে ৳১,৫০,০০০-এর বেশি)।"))
    daily = []
    for m in DAILY_PAY.finditer(text):
        daily.extend(_num(g) for g in m.groups() if g)
    if any(d >= 1000 for d in daily) or (daily and EASY_MONEY.search(text)):
        reasons.append(_r("daily_pay", 30, "Promises big daily earnings (e.g. ৳1000+ per day) — a classic scam hook.",
                          "দৈনিক বড় অঙ্কের আয়ের প্রতিশ্রুতি (যেমন দিনে ৳১০০০+) — প্রতারণার পরিচিত কৌশল।"))
    elif EASY_MONEY.search(text):
        reasons.append(_r("easy_money", 15, "\"Earn from home\" style easy-money promise.",
                          "\"ঘরে বসে আয়\" ধরনের সহজ টাকার প্রতিশ্রুতি।"))

    if GUARANTEE.search(text):
        reasons.append(_r("guarantee", 25, "Promises a \"100% job guarantee\". No real employer can guarantee selection.",
                          "\"১০০% চাকরির নিশ্চয়তা\" দেওয়া হয়েছে — কোনো আসল নিয়োগকর্তা এটা দিতে পারে না।"))
    if TASK_SCAM.search(text):
        reasons.append(_r("task_scam", 40, "Looks like a task scam (like videos / watch ads / rate products to earn).",
                          "টাস্ক স্ক্যামের মতো (ভিডিও লাইক/বিজ্ঞাপন দেখে/রিভিউ দিয়ে আয়)।"))
    if MLM.search(text):
        reasons.append(_r("mlm", 30, "Network marketing / MLM / refer-and-earn scheme, not a salaried job.",
                          "নেটওয়ার্ক মার্কেটিং/এমএলএম/রেফার করে আয় — এটা বেতনভিত্তিক চাকরি নয়।"))
    if SENSITIVE.search(text):
        reasons.append(_r("sensitive", 60, "Asks for an OTP, PIN or bank-card details. Never share these with anyone.",
                          "ওটিপি, পিন বা ব্যাংক কার্ডের তথ্য চাওয়া হয়েছে — এগুলো কখনো কাউকে দেবেন না।"))
    elif NID_TO_CHAT.search(raw):
        reasons.append(_r("nid_chat", 20, "Asks you to send your NID over WhatsApp / inbox.",
                          "হোয়াটসঅ্যাপ/ইনবক্সে এনআইডি পাঠাতে বলা হয়েছে।"))

    overseas = bool(OVERSEAS.search(text))
    abroad_role = bool(OVERSEAS.search(f"{title}\n{location}".translate(BN_DIGITS)))
    if overseas and (money or pay_app):
        reasons.append(_r("overseas_fee", 25, "Overseas job that charges a visa / processing fee — common trafficking & fraud pattern.",
                          "বিদেশে চাকরির জন্য ভিসা/প্রসেসিং ফি চাওয়া হচ্ছে — প্রতারণা ও মানব পাচারের পরিচিত ধরন।"))
    elif abroad_role and not company_website:
        reasons.append(_r("overseas_unverified", 10, "Overseas job from an unverified recruiter. Check BMET registration before applying.",
                          "অযাচাইকৃত এজেন্সির বিদেশি চাকরি। আবেদনের আগে বিএমইটি নিবন্ধন যাচাই করুন।"))

    if NO_INTERVIEW.search(text):
        reasons.append(_r("no_interview", 15, "\"No interview / direct joining\" — real employers assess candidates.",
                          "\"ইন্টারভিউ ছাড়াই / সরাসরি নিয়োগ\" — আসল প্রতিষ্ঠান যাচাই করে নিয়োগ দেয়।"))

    if not company_website and not apply_url and not careers_url and not is_partner:
        reasons.append(_r("no_company_info", 10, "No company website or careers page to verify the employer.",
                          "নিয়োগকর্তাকে যাচাই করার মতো কোম্পানির ওয়েবসাইট বা ক্যারিয়ার পেজ নেই।"))
    if len((description or "").strip()) < 60 and not reqs:
        reasons.append(_r("thin_post", 5, "Very little detail about the role.", "পদ সম্পর্কে খুব কম তথ্য দেওয়া আছে।"))

    if reports >= REPORTS_FOR_CAUTION:
        reasons.append(_r("reported", 25, f"Reported as a scam by {reports} users.", f"{reports} জন ব্যবহারকারী এটিকে প্রতারণা হিসেবে রিপোর্ট করেছেন।"))

    risk = min(100, sum(r["weight"] for r in reasons))
    if risk >= DANGER_AT:
        level = "danger"
    elif risk >= CAUTION_AT or reports >= REPORTS_FOR_CAUTION:
        level = "caution"
    elif is_partner and not reasons and reports == 0:
        level = "verified"
    else:
        level = "ok"
    reasons.sort(key=lambda r: -r["weight"])
    return {"level": level, "score": 100 - risk, "reasons": reasons}


def job_fields(job, reports=None) -> dict:
    c = job.company
    if reports is None:
        reports = job.scam_reports.filter(resolved=False).count() if job.pk else 0
    return {"title": job.title, "description": job.description, "requirements": job.requirements,
            "company_name": c.name, "company_website": c.website, "careers_url": c.careers_url, "is_partner": c.is_partner,
            "apply_email": job.apply_email or c.apply_email, "apply_url": job.apply_url, "location": job.location, "salary_min": job.salary_min,
            "salary_max": job.salary_max, "experience_max_years": job.experience_max_years, "reports": reports}


AI_SYSTEM = (
    "You help a Bangladeshi job board protect fresh graduates from fake jobs. Look at the job post and list concrete "
    "scam signals only (fees, deposits, bKash/Nagad payments, chat-only contact, unrealistic pay, guarantees, task/MLM "
    "schemes, requests for OTP/PIN/NID, overseas visa fees). Do not speculate. "
    'JSON: {"suspicious": true|false, "reasons": [{"en": "...", "bn": "... (Bangla)"}]} — at most 3 reasons.'
)


def ai_refine(result: dict, fields: dict) -> dict:
    """Optional Claude pass. It may only add reasons and raise ok/verified → caution — never lower or verify."""
    from apps.core import ai

    if not ai.enabled():
        return result
    post = f"Title: {fields.get('title')}\nCompany: {fields.get('company_name')}\n\n{fields.get('description')}\n" \
           + "\n".join(str(r) for r in fields.get("requirements") or [])
    out = ai.complete_json(AI_SYSTEM, ai.untrusted("job", post, limit=6000), max_tokens=500, timeout=30)
    if not isinstance(out, dict) or out.get("suspicious") is not True:
        return result
    added = []
    for r in (out.get("reasons") or [])[:3]:
        if isinstance(r, dict) and isinstance(r.get("en"), str) and r["en"].strip():
            bn = r.get("bn") if isinstance(r.get("bn"), str) else ""
            added.append({"code": "ai", "weight": 0, "en": r["en"].strip()[:240], "bn": bn.strip()[:240], "source": "ai"})
    if not added:
        return result
    res = dict(result, reasons=[*result["reasons"], *added])
    if res["level"] in ("verified", "ok"):
        res["level"] = "caution"
        res["score"] = min(res["score"], 100 - CAUTION_AT)
    return res


def assess_job(job, use_ai=False, reports=None) -> dict:
    fields = job_fields(job, reports)
    result = evaluate(**fields)
    if use_ai:
        try:
            result = ai_refine(result, fields)
        except Exception as exc:  # never let the AI path break saving a job
            log.warning("trust ai_refine failed: %s", exc)
    return result


def apply_to(job, result: dict):
    """Copy an assessment onto the (unsaved) Job instance."""
    from django.utils import timezone

    job.trust_level = result["level"]
    job.trust_score = result["score"]
    job.trust_reasons = [{k: r[k] for k in ("code", "en", "bn") if k in r} for r in result["reasons"]]
    job.trust_checked_at = timezone.now()


def refresh(job, use_ai=False):
    """Re-score a saved job and persist only the trust fields (no full save, no signals loop)."""
    from .models import Job

    apply_to(job, assess_job(job, use_ai=use_ai))
    Job.objects.filter(pk=job.pk).update(trust_level=job.trust_level, trust_score=job.trust_score,
                                         trust_reasons=job.trust_reasons, trust_checked_at=job.trust_checked_at)
    return job

"""Salary insight from posted salary ranges (Job.salary_min / salary_max, BDT per month).

Titles are normalised to their meaningful keywords ("Junior Software Engineer (Backend)" -> ["software", "engineer",
"backend"]) and a job matches when its title contains every keyword. Locations are normalised to a city
("Gulshan, Dhaka" -> "dhaka", "Chittagong" -> "chattogram"). If fewer than ``MIN_POINTS`` jobs match, the city filter
is dropped and the response says so; if there is still too little data the stats are null with a message.
"""
import re
from statistics import median

from apps.jobs.models import Job

MIN_POINTS = 3
STOP = {"junior", "jr", "senior", "sr", "lead", "head", "associate", "assistant", "trainee", "intern", "internship", "the",
        "and", "of", "for", "in", "at", "a", "an", "to", "fresher", "freshers", "fresh", "graduate", "entry", "level", "i",
        "ii", "iii", "officer", "executive", "remote", "full", "time", "part", "contract", "urgent", "hiring", "bd"}
CITY_ALIASES = {"chittagong": "chattogram", "ctg": "chattogram", "comilla": "cumilla", "jessore": "jashore",
                "barisal": "barishal", "bogra": "bogura", "dacca": "dhaka"}
TYPE_ALIASES = {"job": ["full_time", "trainee", "part_time"], "internship": ["internship"]}


def title_keywords(title):
    words = re.findall(r"[a-z][a-z+#.]*", (title or "").lower())
    keep = [w for w in words if w not in STOP and len(w) > 1]
    return (keep or [w for w in words if len(w) > 2])[:4]  # "Trainee" alone is still a usable title


CITIES = ["dhaka", "chattogram", "gazipur", "narayanganj", "sylhet", "khulna", "rajshahi", "cumilla", "mymensingh",
          "rangpur", "barishal", "bogura", "jashore", "savar", "cox's bazar", "remote"]


def normalise_city(location):
    """'Dhaka (Gulshan)', 'Hybrid · Dhaka', 'Gulshan, Dhaka' -> 'dhaka'; 'Chittagong' -> 'chattogram'."""
    loc = (location or "").lower().strip()
    if not loc:
        return ""
    for alias, canon in CITY_ALIASES.items():
        loc = re.sub(rf"\b{re.escape(alias)}\b", canon, loc)
    for city in CITIES:
        if city in loc:
            return city
    first = re.split(r"[,/|·&()\-]", loc)[0].strip()
    return first or loc


def _cities_for(city):
    return {city} | {alias for alias, canon in CITY_ALIASES.items() if canon == city}


def _points(qs):
    rows = []
    for lo, hi in qs.values_list("salary_min", "salary_max"):
        lo, hi = lo or hi, hi or lo
        if lo and hi:
            rows.append((min(lo, hi), max(lo, hi)))
    return rows


def _stats(rows):
    if len(rows) < MIN_POINTS:
        return None
    mids = [(a + b) / 2 for a, b in rows]
    return {"min": min(a for a, _ in rows), "median": round(median(mids)), "max": max(b for _, b in rows), "count": len(rows)}


def salary_insight(title="", location="", job_type=""):
    kws = title_keywords(title)
    city = normalise_city(location)
    qs = Job.objects.filter(experience_max_years__lte=3).exclude(salary_min__isnull=True, salary_max__isnull=True)
    for k in kws:
        qs = qs.filter(title__icontains=k)
    if job_type:
        qs = qs.filter(job_type__in=TYPE_ALIASES.get(job_type, [job_type]))

    out = {"query": {"title_keywords": kws, "city": city or None, "type": job_type or None}, "currency": "BDT", "period": "month"}
    scope = "title+city" if city else "title"
    rows = []
    if city:
        city_q = Job.objects.none()
        for c in _cities_for(city):
            city_q = city_q | qs.filter(location__icontains=c)
        rows = _points(city_q.distinct())
    if len(rows) < MIN_POINTS:
        if city:
            scope = "title (all cities)"
        rows = _points(qs)
    stats = _stats(rows)
    out.update({"scope": scope, "stats": stats, "count": len(rows), "enough_data": stats is not None})
    if stats is None:
        out["message"] = (f"Not enough salary data yet ({len(rows)} posting{'s' if len(rows) != 1 else ''} with a salary; we need "
                          f"{MIN_POINTS}). Try a broader title. / পর্যাপ্ত বেতনের তথ্য নেই — আরও সাধারণ পদের নাম দিয়ে চেষ্টা করুন।")
    elif city and scope != "title+city":
        out["message"] = f"Too few postings in {city.title()}; showing all cities. / {city.title()}-এ তথ্য কম, সব শহরের তথ্য দেখানো হচ্ছে।"
    return out

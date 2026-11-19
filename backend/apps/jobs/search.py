"""Job search: ranked full-text + typo tolerance + Bangla/English synonyms.

`search_jobs(qs, q)` returns a queryset (ordered by relevance) and works on both backends:

* PostgreSQL — `SearchVector`/`SearchRank` with the ``simple`` config (no stemming, so Bangla
  tokens survive untouched) plus `TrigramWordSimilarity` (pg_trgm) on job title and company name,
  so "softwer" still finds "Software Engineer". pg_trgm + GIN trigram indexes are created by the
  ``apps.dbtools`` migration; if the extension is missing we quietly degrade to FTS + icontains.
* SQLite (dev/tests) — token-based ``icontains`` (AND across words, OR across synonyms) and, for
  any word that matches nothing, a difflib correction against the vocabulary of live job titles /
  company names / locations.

The synonym groups below are bidirectional: searching any member searches all of them.
"""
from __future__ import annotations

import difflib
import re
from functools import lru_cache

from django.db import connection
from django.db.models import Case, ExpressionWrapper, F, FloatField, IntegerField, Q, Value, When
from django.db.models.functions import Greatest

# ---------------------------------------------------------------------------------------------
# Vocabulary
# ---------------------------------------------------------------------------------------------
SYNONYM_GROUPS: list[set[str]] = [
    {"internship", "internships", "intern", "interns", "ইন্টার্নশিপ", "ইন্টার্নশীপ", "ইন্টার্ন", "শিক্ষানবিশ"},
    {"trainee", "mto", "ট্রেইনি", "প্রশিক্ষণার্থী"},
    {"software", "সফটওয়্যার", "সফটওয়ার"},
    {"engineer", "engineering", "ইঞ্জিনিয়ার", "ইঞ্জিনিয়ারিং", "প্রকৌশলী"},
    {"developer", "dev", "ডেভেলপার"},
    {"programmer", "প্রোগ্রামার"},
    {"bank", "banking", "banker", "ব্যাংক", "ব্যাংকিং", "ব্যাঙ্ক"},
    {"marketing", "মার্কেটিং", "বিপণন"},
    {"sales", "সেলস", "বিক্রয়"},
    {"accounting", "accounts", "accountant", "অ্যাকাউন্টিং", "হিসাবরক্ষক", "হিসাব"},
    {"finance", "financial", "ফাইন্যান্স", "অর্থ"},
    {"teacher", "lecturer", "শিক্ষক", "প্রভাষক"},
    {"data", "ডেটা", "ডাটা"},
    {"designer", "design", "ডিজাইনার", "ডিজাইন"},
    {"hr", "এইচআর", "মানবসম্পদ"},
    {"officer", "অফিসার", "কর্মকর্তা"},
    {"executive", "এক্সিকিউটিভ"},
    {"manager", "management", "ম্যানেজার", "ব্যবস্থাপক"},
    {"telecom", "telecommunication", "টেলিকম"},
    {"pharma", "pharmacy", "pharmaceutical", "pharmaceuticals", "ফার্মা", "ফার্মেসি", "ঔষধ"},
    {"garments", "rmg", "textile", "apparel", "গার্মেন্টস", "টেক্সটাইল", "পোশাক"},
    {"government", "govt", "সরকারি"},
    {"ngo", "এনজিও"},
    {"remote", "wfh", "রিমোট"},
    {"fresher", "freshers", "graduate", "ফ্রেশার", "স্নাতক"},
    {"part-time", "parttime", "পার্টটাইম", "খণ্ডকালীন"},
    {"dhaka", "ঢাকা"},
    {"chattogram", "chittagong", "ctg", "চট্টগ্রাম"},
    {"sylhet", "সিলেট"},
    {"khulna", "খুলনা"},
    {"rajshahi", "রাজশাহী"},
    {"gazipur", "গাজীপুর"},
    {"narayanganj", "নারায়ণগঞ্জ"},
]
# Words that carry no search signal ("jobs in Dhaka" == "Dhaka"). চাকরি/job are generic on a job site.
STOPWORDS = {
    "job", "jobs", "work", "career", "vacancy", "vacancies", "position", "opening", "openings", "hiring",
    "চাকরি", "চাকুরি", "চাকরী", "কাজ", "নিয়োগ", "পদ",
    "in", "at", "for", "the", "a", "an", "of", "and", "or", "near", "এ", "জন্য", "এর", "ও", "এবং",
}
# Some terms are better answered by structured fields than by text.
TYPE_HINTS = {"internship": "internship", "trainee": "trainee", "part-time": "part_time"}

_SYN: dict[str, frozenset[str]] = {}
_CANON: dict[str, str] = {}
for _g in SYNONYM_GROUPS:
    _fz = frozenset(w.lower() for w in _g)
    _head = sorted(w for w in _fz if w.isascii())[0] if any(w.isascii() for w in _fz) else sorted(_fz)[0]
    for _w in _fz:
        _SYN[_w] = _fz
        _CANON[_w] = _head
for _w, _t in list(TYPE_HINTS.items()):
    for _member in _SYN.get(_w, ()):
        TYPE_HINTS[_member] = _t

# Bangla letters include combining vowel signs (Mn/Mc) that `\w` does not match.
_TOKEN_RE = re.compile(r"[\wঀ-৿+#-]+")
TEXT_FIELDS = ("title", "company__name", "description", "location", "majors", "company__industry")
FUZZY_CUTOFF = 0.75
TRIGRAM_THRESHOLD = 0.5


def tokenize(q: str) -> list[str]:
    return [t.strip("-").lower() for t in _TOKEN_RE.findall(q or "") if t.strip("-")]


def expand_pairs(q: str) -> list[tuple[str, frozenset[str]]]:
    """[(typed word, its synonym group)], stopwords and duplicate groups removed, max 8 words."""
    pairs, seen = [], set()
    for tok in tokenize(q):
        if tok in STOPWORDS:
            continue
        g = _SYN.get(tok, frozenset({tok}))
        if g not in seen:
            seen.add(g)
            pairs.append((tok, g))
    return pairs[:8]


def expand(q: str) -> list[frozenset[str]]:
    """'সফটওয়্যার jobs ঢাকা' -> [{software, সফটওয়্যার, …}, {dhaka, ঢাকা}] (stopwords removed)."""
    return [g for _, g in expand_pairs(q)]


def _group_q(group) -> Q:
    cond = Q()
    for word in group:
        for f in TEXT_FIELDS:
            cond |= Q(**{f"{f}__icontains": word})
        if word in TYPE_HINTS:
            cond |= Q(job_type=TYPE_HINTS[word])
        if word in _SYN.get("remote", ()):
            cond |= Q(remote=True)
    return cond


def _title_bonus(groups):
    """Per matched word: 3 if it is in the title, 2 if in the company name, else 0 — summed."""
    total = None
    for g in groups:
        whens = [When(Q(title__icontains=w), then=Value(3)) for w in sorted(g)]
        whens += [When(Q(company__name__icontains=w), then=Value(2)) for w in sorted(g)]
        part = Case(*whens, default=Value(0), output_field=IntegerField())
        total = part if total is None else total + part
    return total


# ---------------------------------------------------------------------------------------------
# SQLite / generic fallback
# ---------------------------------------------------------------------------------------------
def _vocabulary(qs) -> list[str]:
    words = set()
    for title, company, location in qs.values_list("title", "company__name", "location")[:2000]:
        words.update(tokenize(f"{title} {company} {location}"))
    words.update(_SYN)  # known synonym terms, so "markting" -> marketing even before such a job exists
    return [w for w in words if len(w) >= 3]


def correct_groups(qs, groups):
    """Replace any synonym group that matches nothing with its closest vocabulary words (difflib)."""
    vocab = None
    out = []
    for g in groups:
        if qs.filter(_group_q(g)).exists():
            out.append(g)
            continue
        vocab = vocab if vocab is not None else _vocabulary(qs)
        fixes = set()
        for word in g:
            for m in difflib.get_close_matches(word, vocab, n=3, cutoff=FUZZY_CUTOFF):
                fixes |= _SYN.get(m, {m})
        out.append(frozenset(g | fixes))
    return out


def _search_basic(qs, groups):
    groups = correct_groups(qs, groups)
    cond = Q()
    for g in groups:
        cond &= _group_q(g)
    return qs.filter(cond).annotate(search_rank=_title_bonus(groups)).order_by("-search_rank", "-posted_at")


# ---------------------------------------------------------------------------------------------
# PostgreSQL
# ---------------------------------------------------------------------------------------------
@lru_cache(maxsize=1)
def _has_trgm(alias="default") -> bool:
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'")
            return cur.fetchone() is not None
    except Exception:  # pragma: no cover - defensive
        return False


def _search_postgres(qs, pairs):
    from django.contrib.postgres.search import (SearchQuery, SearchRank, SearchVector,
                                                TrigramWordSimilarity)

    groups = [g for _, g in pairs]
    vector = (SearchVector("title", weight="A", config="simple")
              + SearchVector("company__name", weight="A", config="simple")
              + SearchVector("location", "majors", "company__industry", weight="B", config="simple")
              + SearchVector("description", weight="C", config="simple"))
    query = None
    for g in groups:  # AND across words, OR across synonyms
        gq = None
        for w in sorted(g):
            sq = SearchQuery(w, config="simple", search_type="plain")
            gq = sq if gq is None else gq | sq
        query = gq if query is None else query & gq

    # Match with `@@` (the `_doc=query` lookup): ts_rank returns 1e-20, not 0, for non-matching rows.
    qs = qs.annotate(_doc=vector, _fts_rank=SearchRank(vector, query))
    rank = F("_fts_rank") + _title_bonus(groups) * Value(0.1)
    trgm = _has_trgm()
    every_word = Q()
    for i, (tok, g) in enumerate(pairs):
        cond = _group_q(g)
        if trgm and len(tok) >= 3:
            # Per-word typo tolerance: "softwer dhaka" -> software (title) AND dhaka (location).
            name = f"_sim{i}"
            qs = qs.annotate(**{name: Greatest(TrigramWordSimilarity(tok, "title"),
                                               TrigramWordSimilarity(tok, "company__name"),
                                               TrigramWordSimilarity(tok, "location"))})
            cond |= Q(**{f"{name}__gte": TRIGRAM_THRESHOLD})
            rank = rank + F(name) * Value(1.0 / len(pairs))
        every_word &= cond
    return (qs.filter(Q(_doc=query) | every_word)
            .annotate(search_rank=ExpressionWrapper(rank, output_field=FloatField()))
            .order_by("-search_rank", "-posted_at"))


# ---------------------------------------------------------------------------------------------
def search_jobs(qs, q):
    """Filter + rank a Job queryset by a free-text query. Empty / stopword-only queries are a no-op."""
    pairs = expand_pairs((q or "").strip()[:200])
    if not pairs:
        return qs
    if connection.vendor == "postgresql":
        return _search_postgres(qs, pairs)
    return _search_basic(qs, [g for _, g in pairs])

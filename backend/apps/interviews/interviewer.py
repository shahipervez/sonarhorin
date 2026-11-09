"""Mitu — the AI interviewer.

Plan for a 10-minute fresher interview:
  intro → 3 major/technical → 2 behavioural → 1 situational → closing.

Each answer is scored on content, structure and communication.
With ANTHROPIC_API_KEY set, an LLM evaluates answers and asks adaptive
follow-up questions; otherwise a transparent rule-based evaluator is used.
"""
import random
import re

from apps.core import ai

INTRO = {"kind": "intro", "q": "Let's start. Tell me about yourself in under a minute — your studies, what you've built, and what kind of role you want.",
         "kw": ["study", "university", "project", "skill", "interested", "role", "graduat", "experience", "intern"]}
CLOSING = {"kind": "closing", "q": "Last one: why should we hire you as a fresher, and do you have any question for us?",
           "kw": ["learn", "skill", "contribute", "team", "project", "growth", "question", "company"]}

TECH = {
    "CSE": [
        ("Explain the difference between a process and a thread.", ["memory", "share", "independent", "lightweight", "context", "address"]),
        ("What happens when you type a URL in the browser and press Enter?", ["dns", "ip", "http", "server", "request", "response", "tcp", "render"]),
        ("How would you design a REST API for a simple to-do app?", ["get", "post", "put", "delete", "endpoint", "json", "status", "database"]),
        ("What is the difference between SQL and NoSQL databases? When would you use each?", ["schema", "relational", "table", "document", "scale", "join", "flexible"]),
        ("Describe a project you built. What was the hardest bug and how did you fix it?", ["bug", "debug", "log", "test", "fixed", "cause", "learned"]),
        ("Explain Big-O notation with an example.", ["time", "complexity", "n", "loop", "worst", "grow", "log"]),
    ],
    "EEE": [
        ("Explain how a transformer works and why we use high voltage for transmission.", ["induction", "flux", "turns", "loss", "current", "voltage", "i2r"]),
        ("What is power factor and how can it be improved in a factory?", ["phase", "reactive", "capacitor", "inductive", "kvar", "correction"]),
        ("How does a PLC work? Give an industrial example.", ["input", "output", "ladder", "program", "sensor", "scan", "automation"]),
        ("What safety steps do you follow before working on a live panel?", ["isolate", "lockout", "tagout", "ppe", "test", "earth", "permit"]),
        ("Explain the difference between a fuse and a circuit breaker.", ["reset", "melt", "trip", "overcurrent", "replace", "magnetic", "thermal"]),
    ],
    "BBA": [
        ("How would you launch a new product for young people in Dhaka with a small budget?", ["target", "social", "digital", "segment", "budget", "influencer", "campaign", "price"]),
        ("Explain the difference between profit and cash flow. Why can a profitable company fail?", ["cash", "receivable", "liquidity", "credit", "payable", "working capital"]),
        ("Walk me through how you'd analyze why sales dropped last month.", ["data", "compare", "region", "product", "customer", "trend", "excel", "cause"]),
        ("What KPIs would you track as a Management Trainee in sales?", ["target", "conversion", "revenue", "growth", "retention", "kpi", "visit"]),
        ("How do you handle an angry customer?", ["listen", "apolog", "solution", "calm", "follow", "empath"]),
    ],
}
GENERIC_TECH = [
    ("What skills from your degree are most useful for the job you want? Give an example.", ["skill", "project", "example", "course", "applied"]),
    ("Describe a piece of work you are proud of and the result it had.", ["result", "built", "led", "improved", "learned"]),
    ("How do you learn a new tool or topic quickly?", ["practice", "course", "project", "documentation", "mentor", "youtube"]),
]
BEHAVIOURAL = [
    ("Tell me about a time you worked in a team and there was a disagreement. What did you do?", ["team", "listen", "agree", "discuss", "resolved", "result"]),
    ("Tell me about a time you failed or made a mistake. What did you learn?", ["mistake", "learned", "improve", "responsib", "next time"]),
    ("Describe a time you had a tight deadline. How did you manage it?", ["prioriti", "plan", "deadline", "time", "deliver", "schedule"]),
    ("Tell me about a time you took the lead on something.", ["led", "organized", "initiative", "team", "result"]),
]
SITUATIONAL = [
    ("On your first week, your manager gives you a task you don't understand. What do you do?", ["ask", "clarify", "research", "note", "deadline", "confirm"]),
    ("You notice a senior colleague made an error in a report going to a client today. What do you do?", ["inform", "private", "polite", "check", "respect", "quick"]),
    ("You get two urgent tasks from two different managers. How do you handle it?", ["prioriti", "inform", "both", "deadline", "discuss", "clarify"]),
]

FILLERS = re.compile(r"\b(um+|uh+|erm|like|basically|actually|you know|i mean)\b", re.I)
HEDGES = re.compile(r"\b(i think maybe|not sure|i guess|i don'?t know|maybe)\b", re.I)
STAR = ["when", "situation", "task", "so i", "i decided", "result", "as a result", "finally", "we ", "learned"]


def build_plan(major: str, role: str = ""):
    tech = TECH.get(major, GENERIC_TECH)
    plan = [INTRO]
    plan += [{"kind": "technical", "q": q, "kw": kw} for q, kw in random.sample(tech, min(3, len(tech)))]
    plan += [{"kind": "behavioural", "q": q, "kw": kw} for q, kw in random.sample(BEHAVIOURAL, 2)]
    q, kw = random.choice(SITUATIONAL)
    plan.append({"kind": "situational", "q": q, "kw": kw})
    plan.append(CLOSING)
    if role:
        plan[0] = dict(INTRO, q=f"Let's start. You're interviewing for a {role} role. Tell me about yourself in under a minute — your studies, what you've built, and why this role.")
    return plan


def rule_evaluate(item, answer: str) -> dict:
    text = (answer or "").strip()
    low = text.lower()
    words = len(text.split())
    hits = [k for k in item.get("kw", []) if k in low]
    content = min(10, round(len(hits) / max(1, min(4, len(item.get("kw", [1])))) * 10)) if words else 0
    if words < 15:
        length = 2
    elif words < 35:
        length = 6
    elif words <= 220:
        length = 10
    else:
        length = 7
    fillers = len(FILLERS.findall(text))
    hedges = len(HEDGES.findall(text))
    communication = max(0, min(10, length - fillers // 3 - hedges))
    structure = 4
    if item["kind"] in ("behavioural", "situational"):
        structure = min(10, 3 + sum(1 for s in STAR if s in low) * 2)
    else:
        structure = min(10, 4 + (2 if re.search(r"\b(first|second|then|because|for example|e\.g\.)\b", low) else 0) + (2 if words >= 40 else 0) + (2 if re.search(r"\d", low) else 0))
    score = round(content * 0.45 + structure * 0.25 + communication * 0.30, 1)

    tips = []
    if words < 35:
        tips.append("Too short — give one concrete example from a project, class or job.")
    if item["kind"] in ("behavioural", "situational") and structure < 7:
        tips.append("Use STAR: Situation → Task → Action you took → Result (with a number if possible).")
    if content < 5 and words:
        missing = [k for k in item.get("kw", []) if k not in low][:3]
        if missing:
            tips.append("Strong answers usually touch on: " + ", ".join(missing) + ".")
    if fillers >= 3:
        tips.append(f"Cut filler words (heard {fillers}× “like/basically/um”). Pause instead.")
    if hedges:
        tips.append("Sound more confident — replace “I think maybe” with a clear statement.")
    if not tips:
        tips.append("Good answer — clear, relevant and structured.")
    return {"score": score, "content": content, "structure": structure, "communication": communication,
            "feedback": " ".join(tips), "keywords_hit": hits}


def evaluate_and_next(session, item, answer: str, next_item):
    """Return (evaluation, next_question_text). Uses the LLM when available."""
    ev = rule_evaluate(item, answer)
    nxt = next_item["q"] if next_item else None
    if ai.enabled():
        transcript = "\n".join(f"Q: {t.question}\nA: {t.answer}" for t in session.turns.exclude(answer="")[:12])
        data = ai.complete_json(
            "You are Mitu, a friendly but honest interviewer for fresh graduates in Bangladesh. "
            "Score answers 0-10 and give one or two specific, kind tips.",
            f"Candidate major: {session.major}. Target role: {session.role or 'fresher role'}.\n"
            f"Transcript so far:\n{transcript}\n\nCurrent question ({item['kind']}): {item['q']}\nAnswer: {answer}\n\n"
            f"Planned next question: {nxt or 'NONE - interview ends'}\n"
            'Return {"score":0-10,"content":0-10,"structure":0-10,"communication":0-10,"feedback":"...",'
            '"next_question":"the planned next question, or a short follow-up if the answer was vague (null if ending)"}',
            max_tokens=500,
        )
        if data:
            for k in ("score", "content", "structure", "communication"):
                try:
                    ev[k] = max(0, min(10, float(data.get(k, ev[k]))))
                except (TypeError, ValueError):
                    pass
            ev["feedback"] = data.get("feedback") or ev["feedback"]
            if nxt and data.get("next_question"):
                nxt = data["next_question"]
            ev["ai"] = True
    return ev, nxt


def final_report(turns):
    answered = [t for t in turns if t.answer]
    if not answered:
        return {"overall": 0, "verdict": "No answers recorded", "scores": {}, "strengths": [], "improvements": [], "per_question": []}

    def avg(key):
        return round(sum(t.evaluation.get(key, 0) for t in answered) / len(answered), 1)

    scores = {"content": avg("content"), "structure": avg("structure"), "communication": avg("communication")}
    by_kind = {}
    for t in answered:
        by_kind.setdefault(t.kind, []).append(t.evaluation.get("score", 0))
    kinds = {k: round(sum(v) / len(v), 1) for k, v in by_kind.items()}
    overall = round(sum(t.evaluation.get("score", 0) for t in answered) / len(answered) * 10)
    coverage = len(answered) / max(1, len(turns))
    overall = round(overall * (0.7 + 0.3 * coverage))

    strengths, improvements = [], []
    names = {"content": "Relevant content", "structure": "Structured answers", "communication": "Clear communication"}
    for k, v in scores.items():
        (strengths if v >= 7 else improvements if v < 5.5 else []).append(f"{names[k]} ({v}/10)")
    if kinds.get("technical", 10) < 6:
        improvements.append("Revise core concepts of your major — technical answers were thin.")
    if kinds.get("behavioural", 10) < 6:
        improvements.append("Prepare 3 STAR stories (team conflict, failure, leadership) before real interviews.")
    if coverage < 0.8:
        improvements.append("You ran out of time — keep answers to 60–90 seconds.")
    verdict = "Interview-ready" if overall >= 70 else "Getting there" if overall >= 50 else "Needs practice"
    return {
        "overall": overall, "verdict": verdict, "scores": scores, "by_kind": kinds,
        "answered": len(answered), "asked": len(turns),
        "strengths": strengths or ["You completed the interview — that's the first step."],
        "improvements": improvements or ["Keep practicing with different roles to stay sharp."],
        "per_question": [{"question": t.question, "kind": t.kind, "answer": t.answer, **t.evaluation} for t in turns],
    }

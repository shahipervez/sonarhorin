"""Pitch readiness — a transparent rubric, like the CV judge. Investors read a pitch in ~3 minutes."""
import re

NUM = re.compile(r"\d[\d,.]*\s*(%|k|lakh|crore|tk|৳|bdt|users|customers|orders|million|m\b|x\b)?", re.I)


def score(p) -> dict:
    checks = []

    def add(key, label, ok, pts, tip):
        checks.append({"key": key, "label": label, "ok": bool(ok), "points": pts if ok else 0, "max": pts, "tip": tip})

    add("one_liner", "One-line pitch", 20 <= len(p.one_liner or "") <= 160, 10, "Say who it's for and what changes: “X helps Y do Z”.")
    add("problem", "A real, specific problem", len(p.problem or "") >= 120, 15, "Describe one customer and their pain. Who suffers, how often, what does it cost them?")
    add("problem_num", "Problem has a number", bool(NUM.search(p.problem or "")), 5, "Add one fact: how many people, how much money or time is lost.")
    add("solution", "Clear solution", len(p.solution or "") >= 100, 12, "What does the product do on day one? Keep it concrete.")
    add("market", "Market size", len(p.market or "") >= 60 and bool(NUM.search(p.market or "")), 10, "Estimate customers in Bangladesh × what they'd pay.")
    add("model", "How you make money", len(p.business_model or "") >= 50, 10, "Who pays, how much, how often.")
    add("traction", "Traction or proof", len(p.traction or "") >= 40 and bool(NUM.search(p.traction or "")), 12, "Even 20 survey answers, a waitlist or a pilot counts — give numbers.")
    add("team", "Why this team", len(p.team or "") >= 60, 8, "Why are you the people to build this? Skills, story, unfair advantage.")
    add("ask", "Clear ask", bool(p.ask_amount) and len(p.use_of_funds or "") >= 40, 10, "How much, and what will it buy in the next 6–12 months?")
    add("deck", "Pitch deck (PDF)", bool(p.deck), 8, "10–12 slides. Problem → solution → market → model → traction → team → ask.")
    total = sum(c["points"] for c in checks)
    return {"score": total, "checks": checks, "ready": total >= 70,
            "verdict": "Ready to submit" if total >= 70 else "Almost there" if total >= 45 else "Keep building the story"}

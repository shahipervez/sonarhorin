import random

from .models import Question
from .question_bank import MAJOR_BANKS


def bank_for(major: str) -> str:
    return major if major in MAJOR_BANKS else "Aptitude"


def pick_questions(major: str, n: int, mix=(0.7, 0.2, 0.1)):
    """Major questions + aptitude + communication, randomly drawn."""
    cat = bank_for(major)
    n_major = round(n * mix[0]) if cat != "Aptitude" else 0
    n_apt = round(n * mix[1]) if cat != "Aptitude" else round(n * 0.65)
    n_com = n - n_major - n_apt
    chosen = []
    for c, k in ((cat, n_major), ("Aptitude", n_apt), ("Communication", n_com)):
        if k <= 0:
            continue
        ids = list(Question.objects.filter(category=c, active=True).values_list("id", flat=True))
        chosen += random.sample(ids, min(k, len(ids)))
    # top up if a bank is small
    if len(chosen) < n:
        pool = list(Question.objects.filter(active=True).exclude(id__in=chosen)
                    .filter(category__in=[cat, "Aptitude", "Communication"]).values_list("id", flat=True))
        chosen += random.sample(pool, min(n - len(chosen), len(pool)))
    random.shuffle(chosen)
    orders = {}
    for qid in chosen:
        o = [0, 1, 2, 3]
        random.shuffle(o)
        orders[str(qid)] = o
    return chosen, orders


def client_question(q: Question, order, index=None):
    """Question payload without the answer; options in shuffled order."""
    data = {"id": q.id, "text": q.text, "topic": q.topic, "category": q.category,
            "options": [q.options[i] for i in order]}
    if index is not None:
        data["index"] = index
    return data


def original_choice(order, displayed_index):
    if displayed_index is None:
        return None
    try:
        return order[int(displayed_index)]
    except (IndexError, ValueError, TypeError):
        return None


# Integrity penalties for the efficiency test
PENALTY = {"tab_hidden": 8, "window_blur": 3, "copy": 10, "paste": 10, "context_menu": 2, "fullscreen_exit": 6,
           "devtools": 15, "no_face": 5, "too_fast": 3, "timeout": 0}
TERMINATE_AFTER_TAB_SWITCHES = 4


def integrity_from_flags(flags: dict) -> int:
    return max(0, 100 - sum(PENALTY.get(k, 0) * v for k, v in flags.items()))

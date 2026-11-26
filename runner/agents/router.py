"""Legacy intent classifier used by the orchestrator and its tests.

The primary agent entrypoint (``agents.agent_loop``) no longer uses this
module: in-domain routing there is fully deterministic. This classifier remains
for the older scheduled/action entrypoints and falls back to the configured
model only when rules cannot decide.
"""

import re
from typing import Any, Dict, Optional

from runner.llm_provider import get_llm_provider

INTENTS = ("TASK", "GOAL", "HABIT", "PLAN", "INSIGHT")

EXACT = {
    "plan_tomorrow": "PLAN",
    "habit_insight": "INSIGHT",
    "task.create": "TASK",
    "task.complete": "TASK",
    "task.delete": "TASK",
    "goal.create": "GOAL",
    "goal.delete": "GOAL",
    "habit.create": "HABIT",
    "habit.delete": "HABIT",
}

RULES: Dict[str, tuple] = {
    "TASK": (
        r"\btasks?\b", r"\bto-?dos?\b", r"\bmark\b.*\bdone\b", r"\bcomplete\b",
        r"\bfinish\b.*\btask\b", r"\bcheck off\b",
    ),
    "GOAL": (
        r"\bgoals?\b", r"\bsave\s+\$?\d", r"\bmarathon\b", r"\bthis year\b.*\b(?:save|reach|earn)\b",
    ),
    "HABIT": (
        r"\bhabits?\b", r"\bevery\s+(?:day|morning|evening|week)\b", r"\bweekly\b",
    ),
    "PLAN": (
        r"\bplan\b", r"\bschedule\b", r"\bfocus blocks?\b", r"\bfocus time\b",
    ),
    "INSIGHT": (
        r"\banaly[sz]e\b", r"\bhow am i doing\b", r"\bpatterns?\b",
        r"\bstats?\b", r"\bstatistics\b", r"\binsight\b",
    ),
}

CLASSIFY_PROMPT = """Classify the user request into exactly one of:
TASK, GOAL, HABIT, PLAN, INSIGHT, UNKNOWN.

Rules:
- TASK: a one-time, completable action.
- GOAL: a measurable outcome over days/weeks/months.
- HABIT: a recurring behaviour.
- PLAN: arranging time or scheduling focus blocks.
- INSIGHT: analysis of habits or productivity.
- UNKNOWN: anything else.

Return only the label, nothing else.
User request: {text}
"""


def _rule_scores(text: str) -> Dict[str, int]:
    lowered = text.lower()
    scores = {}
    for intent, patterns in RULES.items():
        count = sum(1 for pattern in patterns if re.search(pattern, lowered))
        if count:
            scores[intent] = count
    return scores


def _llm_intent(text: str, llm: Any) -> Dict[str, Any]:
    response = llm.generate(CLASSIFY_PROMPT.format(text=text))
    raw = (response.content or "").strip()
    if raw.upper() not in INTENTS and raw.upper() != "UNKNOWN":
        return {"intent": "UNKNOWN", "stage": "llm_invalid", "raw": raw, "scores": {}}
    return {"intent": raw.upper(), "stage": "llm", "raw": raw, "scores": {}}


def classify_intent(text: str, session_id: Optional[str] = None, llm: Any = None) -> Dict[str, Any]:
    """Classify with exact rules first, then keyword rules, then the model."""
    value = (text or "").strip()
    key = value.lower()
    if key in EXACT:
        return {"intent": EXACT[key], "stage": "exact", "raw": value, "scores": {}}

    scores = _rule_scores(value)
    if scores:
        ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        if len(ranked) == 1 or ranked[0][1] > ranked[1][1]:
            return {"intent": ranked[0][0], "stage": "rule", "raw": value, "scores": scores}

    provider = llm if llm is not None else get_llm_provider()
    return _llm_intent(value, provider)

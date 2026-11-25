"""N-way intent router: exact triggers -> keyword rules -> LLM -> UNKNOWN."""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, Optional

from runner.llm_provider import BaseLLMProvider, get_llm_provider

logger = logging.getLogger(__name__)

VALID_INTENTS = ("TASK", "GOAL", "HABIT", "PLAN", "INSIGHT", "UNKNOWN")

# Scheduled / programmatic triggers. Checked before any keyword work.
EXACT_TRIGGERS = {
    "plan": "PLAN",
    "plan_today": "PLAN",
    "plan_tomorrow": "PLAN",
    "daily_plan": "PLAN",
    "weekly_plan": "PLAN",
    "insight": "INSIGHT",
    "weekly_insight": "INSIGHT",
    "habit_insight": "INSIGHT",
    "task.create": "TASK",
    "task.complete": "TASK",
    "task.delete": "TASK",
    "goal.create": "GOAL",
    "goal.delete": "GOAL",
    "habit.create": "HABIT",
    "habit.delete": "HABIT",
}

KEYWORDS = {
    "TASK": [
        "task", "tasks", "to-do", "todo", "finish", "mark done", "complete task",
        "remind me to", "buy groceries", "send report", "deadline",
    ],
    "GOAL": [
        "goal", "goals", "objective", "milestone", "quest", "ambition",
        "save money", "marathon", "this year", "by december",
    ],
    "HABIT": [
        "habit", "habits", "routine", "every day", "every morning", "every night",
        "daily", "streak", "meditate", "workout", "read 20 pages",
    ],
    "PLAN": [
        "plan", "schedule", "calendar", "time block", "focus block", "tomorrow",
        "my day", "agenda", "time-block",
    ],
    "INSIGHT": [
        "insight", "analyze", "analysis", "pattern", "correlation",
        "how am i doing", "weekly summary", "progress report",
    ],
}

CLASSIFIER_PROMPT = """Classify the user request into exactly one label:
TASK (one-time completable action), GOAL (measurable outcome over time),
HABIT (recurring behavior), PLAN (schedule/time blocks), INSIGHT (analysis of
existing data), UNKNOWN (cannot tell).

Reply with the label only. No explanation.

User request: {request}"""


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def _parse_label(raw: str) -> Optional[str]:
    upper = (raw or "").upper()
    for label in VALID_INTENTS:
        if re.search(rf"\b{label}\b", upper):
            return label
    return None


def _rule_scores(text: str) -> Dict[str, int]:
    normalized = _normalize(text)
    scores: Dict[str, int] = {}
    for intent, keywords in KEYWORDS.items():
        # Longest first so "tasks" is not double-counted via "task".
        matched: list = []
        for keyword in sorted(keywords, key=len, reverse=True):
            if keyword in normalized and not any(keyword in longer for longer in matched):
                matched.append(keyword)
        if matched:
            scores[intent] = len(matched)
    return scores


def classify_intent(
    text: str,
    llm: Optional[BaseLLMProvider] = None,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Return {intent, stage, raw, scores}. Never silently defaults to PLAN."""
    normalized = _normalize(text)

    if normalized in EXACT_TRIGGERS:
        result = {
            "intent": EXACT_TRIGGERS[normalized],
            "stage": "exact",
            "raw": text,
            "scores": {},
        }
        logger.info(
            "intent_classification session=%s raw=%r intent=%s stage=%s",
            session_id, text, result["intent"], result["stage"],
        )
        return result

    scores = _rule_scores(text)
    if scores:
        ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        best_intent, best_score = ranked[0]
        second_score = ranked[1][1] if len(ranked) > 1 else 0
        if best_score > second_score:
            result = {
                "intent": best_intent,
                "stage": "rule",
                "raw": text,
                "scores": scores,
            }
            logger.info(
                "intent_classification session=%s raw=%r intent=%s stage=%s scores=%s",
                session_id, text, result["intent"], result["stage"], scores,
            )
            return result

    provider = llm or get_llm_provider()
    try:
        raw = provider.generate(CLASSIFIER_PROMPT.format(request=text)).content
    except Exception as exc:
        logger.warning("intent_classifier_llm_failed session=%s error=%s", session_id, exc)
        raw = ""

    label = _parse_label(raw)
    intent = label or "UNKNOWN"
    stage = "llm" if label else "llm_invalid"
    result = {"intent": intent, "stage": stage, "raw": raw, "scores": scores}
    logger.info(
        "intent_classification session=%s raw=%r llm_raw=%r intent=%s stage=%s",
        session_id, text, raw, intent, stage,
    )
    return result

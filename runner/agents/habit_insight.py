import json
from datetime import datetime, timedelta
from typing import Any, Dict

from runner.api_client import api_client
from runner.llm_provider import get_llm_provider
from runner.services.stats import (
    build_preference_profile,
    format_habit_stats,
    summarize_habit_consistency,
)


def _strip_fences(content: str) -> str:
    content = (content or "").strip()
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    return content.strip()


def run_habit_insight_agent() -> Dict[str, Any]:
    """Compute stats in Python, then let the LLM narrate them.

    The model never calculates a correlation or a count; it only writes prose
    around the deterministic `stats` object.
    """
    llm = get_llm_provider()
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    start_str = start_date.isoformat()
    end_str = end_date.isoformat()

    consistency = api_client.get_habit_consistency(start_date=start_str, end_date=end_str)
    focus = api_client.get_focus_history(start_date=start_str, end_date=end_str)
    stats = summarize_habit_consistency(consistency, focus)
    stats_text = format_habit_stats(stats)
    try:
        profile = build_preference_profile(api_client.get_decision_logs())
    except Exception:
        profile = "No past proposal decisions recorded."

    prompt = f"""
You are a productivity analyst writing a short note for the user.

These numbers were computed in Python. Use them verbatim. Do NOT calculate,
estimate, infer or invent any number, percentage, streak or correlation.

Computed stats:
{stats_text}

{profile}

Return a single JSON object with keys:
"title": A short title.
"description": A 1-2 sentence narration of the numbers above.
"action": One concrete next step.
Output ONLY valid JSON.
"""

    response = llm.generate(prompt)
    content = _strip_fences(response.content)
    try:
        insight = json.loads(content)
        narrated = True
    except json.JSONDecodeError:
        insight = {
            "title": "Habit summary",
            "description": stats_text,
            "action": "Review the habit summary above.",
        }
        narrated = False

    insight["stats"] = stats
    insight["narrated"] = narrated
    if not narrated:
        insight["raw"] = content

    return api_client.create_proposal("habit_insight", insight)

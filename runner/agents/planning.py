import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from runner.api_client import api_client
from runner.llm_provider import get_llm_provider
from runner.services.stats import build_preference_profile


def _parse_datetime(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000.0, tz=timezone.utc)
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None


def _event_interval(event: Dict[str, Any]):
    start = _parse_datetime(event.get("start") or event.get("startTime"))
    end = _parse_datetime(event.get("end") or event.get("endTime"))
    if start and not end:
        end = start + timedelta(minutes=60)
    return start, end


def _block_interval(block: Dict[str, Any]):
    return _parse_datetime(block.get("startTime")), _parse_datetime(block.get("endTime"))


def check_schedule_constraints(
    blocks: List[Dict[str, Any]],
    events: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """Return an error string, or '' when blocks are valid and conflict-free."""
    parsed = []
    for block in blocks:
        start, end = _block_interval(block)
        if not start or not end:
            return "Invalid startTime or endTime format in one of the blocks."
        if end <= start:
            return f"Block '{block.get('title', '')}' ends before it starts."
        parsed.append((start, end))

    parsed.sort(key=lambda item: item[0])
    for index in range(len(parsed) - 1):
        if parsed[index][1] > parsed[index + 1][0]:
            return (
                f"Overlap detected between block ending at {parsed[index][1]} "
                f"and starting at {parsed[index + 1][0]}."
            )

    for event in events or []:
        event_start, event_end = _event_interval(event)
        if not event_start or not event_end:
            continue
        for start, end in parsed:
            if start < event_end and event_start < end:
                return (
                    f"Conflicts with calendar event '{event.get('title', 'Untitled')}' "
                    f"at {event_start.isoformat()}."
                )
    return ""


def _strip_fences(content: str) -> str:
    content = (content or "").strip()
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    return content.strip()


def run_planning_agent() -> Dict[str, Any]:
    llm = get_llm_provider()
    now = datetime.now(timezone.utc)
    start_str = now.isoformat()
    end_str = (now + timedelta(days=2)).isoformat()

    tasks = api_client.get_tasks(start_date=start_str, end_date=end_str)
    events: List[Dict[str, Any]] = []
    try:
        events = api_client.get_calendar_events(start_date=start_str, end_date=end_str)
    except Exception:
        events = []

    try:
        profile = build_preference_profile(api_client.get_decision_logs())
    except Exception:
        profile = "No past proposal decisions recorded."

    base_prompt = f"""
You are an AI schedule planner.
Propose 3 focus blocks for the upcoming 48 hours to tackle the highest priority tasks.

Upcoming Tasks:
{json.dumps(tasks, indent=2)}

Calendar events (hard constraint — do not overlap):
{json.dumps(events, indent=2)}

{profile}

Return a JSON array of objects with keys:
"taskId": ID of the task to focus on.
"title": Title of the focus block.
"startTime": ISO datetime string for block start.
"endTime": ISO datetime string for block end.

Blocks must not overlap each other or any calendar event.
Output ONLY valid JSON.
"""

    max_attempts = 3
    feedback = ""
    best_blocks: List[Dict[str, Any]] = []
    content = ""

    for _ in range(max_attempts):
        prompt = base_prompt
        if feedback:
            prompt += f"\n\nPREVIOUS ATTEMPT FAILED. FEEDBACK:\n{feedback}\nPlease fix it."
        response = llm.generate(prompt)
        content = _strip_fences(response.content)

        try:
            blocks = json.loads(content)
            if not isinstance(blocks, list):
                raise ValueError("Output is not a JSON array")
            best_blocks = blocks
            error = check_schedule_constraints(blocks, events)
            if not error:
                return api_client.create_proposal(
                    "schedule_proposal",
                    {
                        "blocks": blocks,
                        "flags": [],
                        "profile": profile,
                        "calendarChecked": bool(events),
                    },
                )
            feedback = error
        except Exception as exc:
            feedback = f"Parsing error: {str(exc)}"

    if not best_blocks:
        best_blocks = [{"error": "No valid JSON blocks after 3 attempts.", "raw": content}]

    return api_client.create_proposal(
        "schedule_proposal",
        {
            "blocks": best_blocks,
            "flags": ["constraint_violation"],
            "profile": profile,
            "calendarChecked": bool(events),
        },
    )

"""Deterministic in-domain agent: rules + local retrieval, no text generation.

Every in-domain request maps to an explicit tool plan. Missing arguments produce
a clarification question instead of an LLM guess. Out-of-domain text is left to
the caller, which may hand it to the local quantized model.
"""

import calendar as _calendar
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from runner.api_client import api_client

# Tool definitions are intentionally small and explicit. The LLM never sees
# them: the rule router below is the only caller.
TOOL_SPECS: List[Dict[str, Any]] = [
    {"name": "task.create", "description": "Create a task", "parameters": ["title", "due_date", "priority"]},
    {"name": "task.complete", "description": "Complete a task by id", "parameters": ["taskId"]},
    {"name": "task.delete", "description": "Delete a task by id", "parameters": ["taskId"]},
    {"name": "task.list", "description": "List tasks", "parameters": ["status"]},
    {"name": "goal.create", "description": "Create a goal", "parameters": ["title", "due_date"]},
    {"name": "goal.delete", "description": "Delete a goal by id", "parameters": ["goalId"]},
    {"name": "goal.list", "description": "List goals", "parameters": []},
    {"name": "habit.create", "description": "Create a habit", "parameters": ["name", "frequency_type"]},
    {"name": "habit.list", "description": "List habits", "parameters": []},
    {"name": "calendar.add", "description": "Add a focus block to the local calendar", "parameters": ["title", "startTime", "endTime"]},
    {"name": "calendar.list", "description": "List calendar events", "parameters": ["startDate", "endDate"]},
    {"name": "note.search", "description": "Search local notes with FTS5", "parameters": ["query"]},
    {"name": "status.get", "description": "Fetch the local status snapshot", "parameters": []},
    {"name": "metrics.get", "description": "Fetch weekly metrics", "parameters": []},
    {"name": "daily.update", "description": "Fetch the daily briefing data", "parameters": []},
]

TOOL_NAMES = {spec["name"] for spec in TOOL_SPECS}

_DAYS = {name.lower(): index for index, name in enumerate(_calendar.day_name)}
_DAYS.update({name.lower(): index for index, name in enumerate(_calendar.day_abbr)})


def _iso(moment: datetime) -> str:
    return moment.isoformat(timespec="seconds").replace("+00:00", "Z")


def parse_when(text: str, now: Optional[datetime] = None) -> Tuple[Optional[str], Optional[str], str]:
    """Extract (ISO datetime, day label, text with date/time phrases removed)."""
    now = now or datetime.now(timezone.utc)
    lowered = text.lower()
    cleaned = text
    day: Optional[datetime] = None

    iso_match = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", cleaned)
    if iso_match:
        try:
            day = datetime(int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3)), tzinfo=timezone.utc)
            cleaned = cleaned.replace(iso_match.group(0), " ")
        except ValueError:
            day = None

    if day is None:
        if re.search(r"\btomorrow\b", lowered):
            day = now + timedelta(days=1)
            cleaned = re.sub(r"\btomorrow\b", " ", cleaned, flags=re.I)
        elif re.search(r"\btoday\b", lowered):
            day = now
            cleaned = re.sub(r"\btoday\b", " ", cleaned, flags=re.I)
        elif re.search(r"\bnext week\b", lowered):
            day = now + timedelta(days=7)
            cleaned = re.sub(r"\bnext week\b", " ", cleaned, flags=re.I)
        else:
            for word, index in _DAYS.items():
                match = re.search(rf"\b{word}\b", lowered)
                if match:
                    delta = (index - now.weekday()) % 7 or 7
                    day = now + timedelta(days=delta)
                    cleaned = re.sub(rf"\b{word}\b", " ", cleaned, flags=re.I)
                    break

    hour: Optional[int] = None
    minute = 0
    time_match = re.search(
        r"\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(?:at\s+)(\d{1,2}):(\d{2})\b",
        cleaned,
        flags=re.I,
    )
    if time_match:
        if time_match.group(1):
            hour = int(time_match.group(1))
            minute = int(time_match.group(2) or 0)
            meridiem = time_match.group(3).lower()
            if meridiem == "pm" and hour < 12:
                hour += 12
            if meridiem == "am" and hour == 12:
                hour = 0
        else:
            hour, minute = int(time_match.group(4)), int(time_match.group(5))
        cleaned = cleaned.replace(time_match.group(0), " ")
    elif re.search(r"\b(at\s+)?noon\b", lowered):
        hour, minute = 12, 0
        cleaned = re.sub(r"\b(at\s+)?noon\b", " ", cleaned, flags=re.I)

    if day is None and hour is None:
        return None, None, cleaned

    base = day or now
    if hour is None:
        hour, minute = 9, 0
    moment = base.replace(hour=hour, minute=minute, second=0, microsecond=0)
    return _iso(moment), base.strftime("%A"), _tidy(cleaned)


def _tidy(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip(" ,.-")
    return re.sub(r"^(?:please|kindly)\s+", "", text, flags=re.I).strip(" ,.-")


def _subject(text: str, patterns: List[str]) -> str:
    cleaned = text
    for pattern in patterns:
        cleaned = re.sub(pattern, " ", cleaned, flags=re.I)
    return _tidy(cleaned)


def _id_or_title(text: str, field: str) -> Dict[str, Any]:
    id_match = re.search(r"\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{1,8})\b", text, flags=re.I)
    if id_match:
        return {field: id_match.group(1)}
    title = _subject(text, [
        r"\b(?:delete|remove|complete|finish|mark|done|the)\b",
        r"\b(?:task|goal|habit)\b",
        r"\bas\b.*",
    ])
    return {"title": title} if title else {}


def plan(text: str) -> Optional[Dict[str, Any]]:
    """Return a deterministic tool plan, or None for out-of-domain requests."""
    value = (text or "").strip()
    if not value:
        return None
    lowered = value.lower()
    when, day_label, without_when = parse_when(value)

    # Calendar additions come first: "schedule a focus block" must not become a task.
    if re.search(r"\b(?:add|put|block|schedule|book)\b", lowered) and re.search(
        r"\b(?:calendar|focus block|focus time|meeting|event)\b", lowered
    ):
        title = _subject(without_when, [
            r"\b(?:calendar|focus block|focus time|meeting|event)\b",
            r"\b(?:add|put|block|schedule|book)\b",
            r"\b(?:a|an|the|to|on|in|for)\b",
        ]) or "Focus block"
        start = when
        end = _iso(datetime.fromisoformat(start.replace("Z", "+00:00")) + timedelta(hours=1)) if start else None
        if not start or not end:
            return {"tool": None, "clarify": "When should I add that to the calendar? Try 'tomorrow at 3pm'."}
        return {"tool": "calendar.add", "args": {"title": title, "startTime": start, "endTime": end}, "intent": "CALENDAR_ADD", "invalidate": ["calendar"]}

    if re.search(r"\b(?:delete|remove|cancel)\b", lowered) and re.search(r"\btasks?\b", lowered):
        target = _id_or_title(value, "taskId")
        if "taskId" not in target and not target.get("title"):
            return {"tool": None, "clarify": "Which task should I delete?"}
        return {"tool": "task.delete", "args": target, "intent": "TASK_DELETE", "invalidate": ["tasks", "today"]}

    if re.search(r"\b(?:complete|finish|mark|done|check off)\b", lowered) and (
        re.search(r"\btasks?\b", lowered) or re.search(r"\bas\s+done\b", lowered)
    ):
        target = _id_or_title(value, "taskId")
        if "taskId" not in target and not target.get("title"):
            return {"tool": None, "clarify": "Which task should I mark as done?"}
        return {"tool": "task.complete", "args": target, "intent": "TASK_COMPLETE", "invalidate": ["tasks", "today"]}

    if re.search(r"\b(?:add|create|make|new|remind me to)\b", lowered) and (
        re.search(r"\btasks?\b", lowered) or re.search(r"\bto-?do\b", lowered)
    ):
        title = _subject(without_when, [
            r"\b(?:add|create|make|new)\b",
            r"\b(?:a|an|the)\b",
            r"\btasks?\b",
            r"\b(?:to|for|due)\b",
            r"\b(?:please|kindly)\b",
        ])
        if not title:
            return {"tool": None, "clarify": "What should the task be called?"}
        args: Dict[str, Any] = {"title": title}
        if when:
            args["due_date"] = when
        return {"tool": "task.create", "args": args, "intent": "TASK_CREATE", "invalidate": ["tasks", "today"]}

    if re.search(r"\b(?:delete|remove)\b", lowered) and re.search(r"\bgoals?\b", lowered):
        target = _id_or_title(value, "goalId")
        if "goalId" not in target and not target.get("title"):
            return {"tool": None, "clarify": "Which goal should I delete?"}
        return {"tool": "goal.delete", "args": target, "intent": "GOAL_DELETE", "invalidate": ["goals"]}

    if re.search(r"\b(?:add|create|make|new|set)\b", lowered) and (
        re.search(r"\bgoals?\b", lowered) or re.search(r"\b(?:save|reach|lose|earn)\s+\$?\d", lowered)
    ):
        title = _subject(without_when, [
            r"\b(?:add|create|make|new|set)\b", r"\b(?:a|an|the)\b", r"\bgoals?\b", r"\b(?:to|for)\b",
        ])
        if not title:
            return {"tool": None, "clarify": "What goal should I create?"}
        args = {"title": title}
        if when:
            args["due_date"] = when
        return {"tool": "goal.create", "args": args, "intent": "GOAL_CREATE", "invalidate": ["goals"]}

    if re.search(r"\b(?:add|create|make|start|build)\b", lowered) and re.search(r"\bhabits?\b", lowered):
        name = _subject(without_when, [
            r"\b(?:add|create|make|start|build)\b", r"\b(?:a|an|the)\b", r"\bhabits?\b", r"\b(?:of|to|for)\b",
        ])
        if not name:
            return {"tool": None, "clarify": "What habit should I create?"}
        frequency = "every_day" if re.search(r"\bevery\s+(?:day|morning|evening)\b", lowered) else "weekly"
        return {"tool": "habit.create", "args": {"name": name, "frequency_type": frequency}, "intent": "HABIT_CREATE", "invalidate": ["habits"]}

    if re.search(r"\b(?:plan my day|daily (?:update|briefing)|morning briefing|what'?s on today)\b", lowered):
        return {"tool": "daily.update", "args": {}, "intent": "DAILY_UPDATE", "invalidate": []}

    if re.search(r"\b(?:search|find|look up|notes? about|what did i (?:write|note))\b", lowered):
        query = _subject(value, [r"\b(?:search|find|look up|for|my|notes? about|what did i (?:write|note))\b"])
        if not query:
            return {"tool": None, "clarify": "What should I search your notes for?"}
        return {"tool": "note.search", "args": {"query": query}, "intent": "NOTE_SEARCH", "invalidate": []}

    if re.search(r"\b(?:show|list|what|give me|how many)\b", lowered):
        if re.search(r"\bcalendars?\b|\bschedule\b", lowered):
            return {"tool": "calendar.list", "args": {}, "intent": "FETCH", "invalidate": []}
        if re.search(r"\bhabits?\b", lowered):
            return {"tool": "habit.list", "args": {}, "intent": "FETCH", "invalidate": []}
        if re.search(r"\bgoals?\b", lowered):
            return {"tool": "goal.list", "args": {}, "intent": "FETCH", "invalidate": []}
        if re.search(r"\btasks?\b", lowered):
            status = "completed" if re.search(r"\bcompleted|done\b", lowered) else None
            args = {"status": status} if status else {}
            return {"tool": "task.list", "args": args, "intent": "FETCH", "invalidate": []}
        if re.search(r"\bmetrics?|statistics|stats\b", lowered):
            return {"tool": "metrics.get", "args": {}, "intent": "FETCH", "invalidate": []}
        if re.search(r"\bstatus|progress\b", lowered):
            return {"tool": "status.get", "args": {}, "intent": "FETCH", "invalidate": []}

    return None


def _data(result: Any) -> Any:
    if isinstance(result, dict) and "data" in result:
        return result["data"]
    return result


def execute_tool(name: str, args: Dict[str, Any], session_id: Optional[str] = None) -> Any:
    """Execute one whitelisted tool against the local Node API."""
    if name not in TOOL_NAMES:
        raise ValueError(f"Unknown tool: {name}")
    payload = dict(args or {})

    if name == "task.create":
        return _data(api_client._post("/tasks", payload))
    if name == "task.complete":
        task_id = payload["taskId"]
        return _data(api_client._post(f"/tasks/{task_id}/complete", {}))
    if name == "task.delete":
        if "taskId" not in payload:
            payload = _resolve_task(payload.get("title"))
        return _data(api_client._delete(f"/tasks/{payload['taskId']}"))
    if name == "task.list":
        return api_client.get_tasks(status=payload.get("status"))
    if name == "goal.create":
        return _data(api_client._post("/goals", payload))
    if name == "goal.delete":
        if "goalId" not in payload:
            matches = api_client._get("/goals").get("data", [])
            payload = _match_by_title(matches, payload.get("title"), "goalId", "Goal")
        return _data(api_client._delete(f"/goals/{payload['goalId']}"))
    if name == "goal.list":
        return api_client._get("/goals").get("data", [])
    if name == "habit.create":
        return _data(api_client._post("/habits", payload))
    if name == "habit.list":
        return api_client.get_habit_logs()
    if name == "calendar.add":
        return api_client.create_focus_block(payload)
    if name == "calendar.list":
        return api_client.get_calendar_events(
            start_date=payload.get("startDate"), end_date=payload.get("endDate")
        )
    if name == "note.search":
        return api_client.search_notes(payload["query"], limit=payload.get("limit", 5))
    if name == "status.get":
        return api_client.get_status()
    if name == "metrics.get":
        return api_client.get_metrics()
    if name == "daily.update":
        return {"context": api_client.get_context(), "status": api_client.get_status()}
    raise ValueError(f"Tool not implemented: {name}")


def _match_by_title(items: List[Dict[str, Any]], title: Optional[str], field: str, label: str) -> Dict[str, Any]:
    needle = (title or "").lower()
    matches = [item for item in items if needle and needle in str(item.get("title", item.get("name", ""))).lower()]
    if len(matches) == 1:
        return {field: matches[0].get("id")}
    if not matches:
        raise ValueError(f"No {label.lower()} found matching '{title}'.")
    raise ValueError(f"More than one {label.lower()} matches '{title}'. Please use its id.")


def _resolve_task(title: Optional[str]) -> Dict[str, Any]:
    tasks = api_client.get_tasks()
    return _match_by_title(tasks, title, "taskId", "Task")


def render_reply(tool: str, args: Dict[str, Any], result: Any) -> str:
    """Static, deterministic phrasing. Numbers come only from tool results."""
    if tool == "task.create":
        return f"Added task '{args.get('title', '')}'." + (f" Due {args['due_date']}." if args.get("due_date") else "")
    if tool == "task.complete":
        return "Marked the task as done."
    if tool == "task.delete":
        return "Task deleted."
    if tool == "goal.create":
        return f"Created goal '{args.get('title', '')}'."
    if tool == "goal.delete":
        return "Goal deleted."
    if tool == "habit.create":
        return f"Created habit '{args.get('name', '')}'."
    if tool == "calendar.add":
        return f"Added '{args.get('title', '')}' to your calendar at {args.get('startTime', '')}."
    if tool == "note.search":
        hits = result or []
        if not hits:
            return "No local notes matched that search."
        lines = [f"- {hit.get('title', 'Untitled')}: {hit.get('excerpt', '')}" for hit in hits[:5]]
        return "Found in your notes:\n" + "\n".join(lines)
    if tool == "task.list":
        items = result or []
        if not items:
            return "You have no matching tasks."
        lines = [f"- {item.get('title', 'Untitled')}" for item in items[:8]]
        return f"{len(items)} task(s):\n" + "\n".join(lines)
    if tool == "goal.list":
        items = result or []
        return "No goals yet." if not items else "Goals:\n" + "\n".join(
            f"- {item.get('title', 'Untitled')}" for item in items[:8]
        )
    if tool == "habit.list":
        items = result or []
        return "No habits yet." if not items else "Habits:\n" + "\n".join(
            f"- {item.get('name', item.get('title', 'Untitled'))}" for item in items[:8]
        )
    if tool == "calendar.list":
        items = result or []
        return "Nothing on your calendar." if not items else "Calendar:\n" + "\n".join(
            f"- {item.get('title', 'Untitled')} ({item.get('startTime', item.get('start_time', ''))})"
            for item in items[:8]
        )
    if tool == "metrics.get":
        return (result or {}).get("summary") or "Here are your weekly metrics."
    if tool == "status.get":
        return "Fetched your current status."
    if tool == "daily.update":
        return "Fetched today's context and status."
    return "Done."

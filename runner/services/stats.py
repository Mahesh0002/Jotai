"""Deterministic statistics. The LLM never computes these numbers."""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime
from statistics import median
from typing import Any, Dict, Iterable, List, Optional


def _task_ref(value: Any) -> str:
    if isinstance(value, dict):
        return str(value.get("_id") or value.get("id") or "")
    return str(value or "")


def _parse_dt(value: Any) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None


def _block_minutes(block: Dict[str, Any]) -> float:
    elapsed = block.get("elapsedSeconds")
    if elapsed:
        return float(elapsed) / 60.0
    duration = block.get("durationMinutes")
    if duration:
        return float(duration)
    start = _parse_dt(block.get("startTime"))
    end = _parse_dt(block.get("endTime"))
    if start and end and end > start:
        return (end - start).total_seconds() / 60.0
    return 0.0


def _similarity(task: Dict[str, Any], candidate: Dict[str, Any]) -> int:
    score = 0
    task_project = _task_ref(task.get("projectId"))
    candidate_project = _task_ref(candidate.get("projectId"))
    if task_project and task_project == candidate_project:
        score += 2
    shared_tags = set(task.get("tags") or []) & set(candidate.get("tags") or [])
    score += len(shared_tags)
    if task.get("priority") and task.get("priority") == candidate.get("priority"):
        score += 1
    return score


def estimate_duration(
    task: Dict[str, Any],
    completed_tasks: Iterable[Dict[str, Any]],
    focus_blocks: Iterable[Dict[str, Any]],
) -> Dict[str, Any]:
    """Median duration of similar completed tasks, in whole minutes.

    Prefers observed focus time (`elapsedSeconds`) attached to a completed
    task. Falls back to the stored `estimatedMinutes` of similar tasks when no
    focus history exists. No LLM is involved.
    """
    task_id = _task_ref(task.get("_id") or task.get("id"))
    candidates = [
        item
        for item in completed_tasks
        if str(item.get("status", "")) == "completed"
        and _task_ref(item.get("_id") or item.get("id")) != task_id
    ]

    scored = [(candidate, _similarity(task, candidate)) for candidate in candidates]
    similar = [candidate for candidate, score in scored if score > 0]
    pool = similar or candidates
    pool_ids = {_task_ref(candidate.get("_id") or candidate.get("id")) for candidate in pool}

    by_task: Dict[str, float] = defaultdict(float)
    for block in focus_blocks:
        ref = _task_ref(block.get("taskId"))
        if ref in pool_ids:
            by_task[ref] += _block_minutes(block)

    observed = [minutes for minutes in by_task.values() if minutes > 0]
    source = "focus_history"
    durations = observed

    if not durations:
        durations = [
            float(candidate["estimatedMinutes"])
            for candidate in pool
            if candidate.get("estimatedMinutes")
        ]
        source = "task_estimates" if durations else "no_history"

    if not durations:
        return {
            "minutes": None,
            "sample_size": 0,
            "source": "no_history",
            "candidate_task_ids": sorted(pool_ids),
        }

    return {
        "minutes": int(round(median(durations))),
        "sample_size": len(durations),
        "source": source,
        "candidate_task_ids": sorted(pool_ids),
        "used_similarity": bool(similar),
    }


def summarize_habit_consistency(
    consistency: Iterable[Dict[str, Any]],
    focus_blocks: Iterable[Dict[str, Any]],
) -> Dict[str, Any]:
    per_habit: List[Dict[str, Any]] = []
    scheduled = 0
    completed = 0

    for habit in consistency:
        days = [bool(day) for day in (habit.get("days") or [])]
        done = sum(1 for day in days if day)
        scheduled += len(days)
        completed += done
        per_habit.append(
            {
                "name": habit.get("name") or "Unnamed habit",
                "streak": int(habit.get("streak") or 0),
                "completed_days": done,
                "scheduled_days": len(days),
            }
        )

    focus_by_type: Dict[str, float] = defaultdict(float)
    focus_sessions = 0
    for block in focus_blocks:
        minutes = _block_minutes(block)
        if minutes <= 0:
            continue
        focus_sessions += 1
        focus_by_type[str(block.get("type") or "unknown")] += minutes

    return {
        "habit_count": len(per_habit),
        "scheduled_days": scheduled,
        "completed_days": completed,
        "completion_rate": round(completed / scheduled, 3) if scheduled else None,
        "per_habit": per_habit,
        "focus_sessions": focus_sessions,
        "focus_minutes_total": int(round(sum(focus_by_type.values()))),
        "focus_minutes_by_type": {key: int(round(value)) for key, value in sorted(focus_by_type.items())},
    }


def format_habit_stats(stats: Dict[str, Any]) -> str:
    """Compact, verbatim numbers for the narration prompt."""
    lines = [
        f"Tracking {stats['habit_count']} habits over {stats['scheduled_days']} scheduled habit-days.",
        f"Completed {stats['completed_days']} of {stats['scheduled_days']} "
        f"(completion rate {stats['completion_rate']}).",
        f"Focus: {stats['focus_minutes_total']} minutes across {stats['focus_sessions']} sessions.",
    ]
    for habit in stats["per_habit"]:
        lines.append(
            f"- {habit['name']}: {habit['completed_days']}/{habit['scheduled_days']} days, streak {habit['streak']}."
        )
    if stats["focus_minutes_by_type"]:
        breakdown = ", ".join(f"{key} {value} min" for key, value in stats["focus_minutes_by_type"].items())
        lines.append(f"Focus minutes by type: {breakdown}.")
    return "\n".join(lines)


_TIME_BUCKETS = [("morning", 5, 12), ("afternoon", 12, 17), ("evening", 17, 22), ("night", 22, 24)]


def _attribute(log: Dict[str, Any], key: str, default: Any = None) -> Any:
    attributes = log.get("attributes") or {}
    if key in attributes:
        return attributes[key]
    return log.get(key, default)


def _time_of_day(log: Dict[str, Any]) -> Optional[str]:
    explicit = _attribute(log, "timeOfDay")
    if explicit:
        return str(explicit).lower()
    start = _parse_dt(_attribute(log, "startTime"))
    if not start:
        return None
    hour = start.hour
    for name, low, high in _TIME_BUCKETS:
        if low <= hour < high:
            return name
    return "night"


def _duration_minutes(log: Dict[str, Any]) -> Optional[float]:
    explicit = _attribute(log, "durationMinutes")
    if explicit:
        try:
            return float(explicit)
        except (TypeError, ValueError):
            return None
    start = _parse_dt(_attribute(log, "startTime"))
    end = _parse_dt(_attribute(log, "endTime"))
    if start and end and end > start:
        return (end - start).total_seconds() / 60.0
    return None


def build_preference_profile(logs: Iterable[Dict[str, Any]], max_tokens: int = 150) -> str:
    """Aggregate accept/reject logs into a short, deterministic profile."""
    logs = [log for log in logs if log.get("decision") in ("accepted", "rejected")]
    if not logs:
        return "No past proposal decisions recorded."

    by_time_total: Counter = Counter()
    by_time_rejected: Counter = Counter()
    accepted_durations: List[float] = []
    focus_total: Counter = Counter()
    focus_accepted: Counter = Counter()

    for log in logs:
        decision = log["decision"]
        bucket = _time_of_day(log)
        if bucket:
            by_time_total[bucket] += 1
            if decision == "rejected":
                by_time_rejected[bucket] += 1

        if decision == "accepted":
            duration = _duration_minutes(log)
            if duration and duration > 0:
                accepted_durations.append(duration)

        focus_type = _attribute(log, "focusType")
        if focus_type:
            focus_total[str(focus_type)] += 1
            if decision == "accepted":
                focus_accepted[str(focus_type)] += 1

    parts: List[str] = []

    rejected_parts = []
    for name, _, _ in _TIME_BUCKETS:
        if by_time_rejected[name]:
            rejected_parts.append(
                f"{name} rejected {by_time_rejected[name]}/{by_time_total[name]}"
            )
    if rejected_parts:
        parts.append("; ".join(rejected_parts))

    if accepted_durations:
        parts.append(
            f"preferred block {int(round(median(accepted_durations)))} min "
            f"(accepted, n={len(accepted_durations)})"
        )

    focus_parts = [
        f"{name} accepted {focus_accepted[name]}/{total}"
        for name, total in sorted(focus_total.items())
    ]
    if focus_parts:
        parts.append("; ".join(focus_parts))

    text = "Past proposal decisions: " + "; ".join(parts) + "."
    # Hard cap keeps the prompt small; the profile is short by construction.
    if max_tokens and len(text.split()) > max_tokens:
        text = " ".join(text.split()[:max_tokens]) + " ..."
    return text

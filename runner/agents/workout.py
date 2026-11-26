import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List

from runner.api_client import api_client
from runner.agents.planning import check_schedule_constraints

logger = logging.getLogger(__name__)

WORKOUT_TYPES = ["strength", "cardio", "mobility"]


def suggest_workout() -> Dict[str, Any]:
    """Generate a workout proposal based on schedule gaps and habit history"""
    try:
        user_id = "local_user"

        # 1. Get preferences
        prefs = api_client.get_preferences()
        workout_days = prefs.get("workout_days", "mon,wed,fri").split(",")
        focus_minutes = prefs.get("focus_minutes", 25)
        chronotype = prefs.get("chronotype", "unknown")

        # 2. Get workout habit history (last 8 weeks)
        history = api_client.get_habit_logs()
        workout_completions = [
            h for h in history
            if h.get("category") == "workout" and h.get("status") == "completed"
        ]

        # Determine last workout type to alternate
        last_type = None
        if workout_completions:
            last_completion = max(workout_completions, key=lambda x: x.get("completed_at", ""))
            last_type = last_completion.get("name", "").lower()
            for wt in WORKOUT_TYPES:
                if wt in last_type:
                    last_type = wt
                    break

        # Pick next type (alternate)
        if last_type and last_type in WORKOUT_TYPES:
            idx = WORKOUT_TYPES.index(last_type)
            next_type = WORKOUT_TYPES[(idx + 1) % len(WORKOUT_TYPES)]
        else:
            next_type = WORKOUT_TYPES[0]

        # 3. Get calendar events and focus blocks for next 48h
        calendar = api_client.get_calendar_events()
        focus_blocks = api_client.get_focus_history()

        # 4. Find free slots (at least 20 minutes)
        now = datetime.now()
        search_end = now + timedelta(hours=48)

        # Combine all busy intervals
        busy = []
        for event in calendar:
            start = datetime.fromisoformat(event["start_time"].replace("Z", "+00:00"))
            end = datetime.fromisoformat(event["end_time"].replace("Z", "+00:00"))
            if start < search_end and end > now:
                busy.append((max(start, now), min(end, search_end)))

        for block in focus_blocks:
            if block.get("status") in ("scheduled", "active"):
                start = datetime.fromisoformat(block["start_time"].replace("Z", "+00:00"))
                end = datetime.fromisoformat(block["end_time"].replace("Z", "+00:00"))
                if start < search_end and end > now:
                    busy.append((max(start, now), min(end, search_end)))

        # Sort and merge
        busy.sort(key=lambda x: x[0])
        merged = []
        for interval in busy:
            if not merged or interval[0] > merged[-1][1]:
                merged.append(list(interval))
            else:
                merged[-1][1] = max(merged[-1][1], interval[1])

        # Find gaps >= 20 minutes
        gaps = []
        cursor = now
        for start, end in merged:
            if cursor < start:
                gap_minutes = (start - cursor).total_seconds() / 60
                if gap_minutes >= 20:
                    gaps.append((cursor, start, gap_minutes))
            cursor = max(cursor, end)

        if cursor < search_end:
            gap_minutes = (search_end - cursor).total_seconds() / 60
            if gap_minutes >= 20:
                gaps.append((cursor, search_end, gap_minutes))

        if not gaps:
            return {
                "success": False,
                "message": "No suitable time slots found in the next 48 hours",
            }

        # Pick shortest gap >= 20 min within preferred window
        # Preferred window based on chronotype
        preferred_start_hour = 17  # Default 5 PM
        if chronotype == "morning":
            preferred_start_hour = 7
        elif chronotype == "night":
            preferred_start_hour = 19

        best_gap = None
        for gap in gaps:
            gap_start, gap_end, gap_minutes = gap
            # Prefer gaps near preferred time
            if gap_start.hour <= preferred_start_hour <= gap_end.hour:
                best_gap = gap
                break
        if not best_gap:
            best_gap = min(gaps, key=lambda g: g[2])  # Shortest gap

        gap_start, gap_end, gap_minutes = best_gap
        duration = min(30, int(gap_minutes))  # Cap at 30 min

        # 5. Create proposal
        start_time = gap_start.isoformat()
        end_time = (gap_start + timedelta(minutes=duration)).isoformat()

        rationale = f"Found a {duration}-minute gap at {gap_start.strftime('%H:%M')}. " \
                   f"Suggesting {next_type} workout (alternating from last session)."

        proposal_data = {
            "type": next_type,
            "duration_minutes": duration,
            "start": start_time,
            "end": end_time,
            "rationale": rationale,
        }

        # Create proposal via API
        result = api_client.create_proposal("workout_plan", proposal_data)

        return {
            "success": True,
            "data": {
                "proposal": result.get("data", {}),
                "workout_plan": proposal_data,
            },
        }

    except Exception as e:
        logger.error(f"Workout suggestion failed: {e}")
        return {"success": False, "message": str(e)}
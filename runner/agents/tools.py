from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List

from runner.actions.registry import registry
from runner.api_client import api_client
from runner.llm_provider import get_llm_provider
from runner.services.stats import estimate_duration

# Importing registers the handlers.
import runner.actions.task_actions  # noqa: F401
import runner.actions.goal_actions  # noqa: F401
import runner.actions.habit_actions  # noqa: F401


def create_task(title: str, due_date: str = "") -> dict:
    """Create a one-time task. Args: title, due_date (ISO, default today)."""
    params = {"title": title}
    params["dueDate"] = due_date if due_date else f"{date.today().isoformat()}T00:00:00.000Z"
    try:
        return registry.execute("task.create", params)
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def complete_task(task_id: str) -> dict:
    """Mark a task completed. Args: task_id."""
    try:
        return registry.execute("task.complete", {"taskId": task_id})
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def delete_task(task_id: str) -> dict:
    """Delete a task permanently. Requires confirmation. Args: task_id."""
    try:
        return registry.execute("task.delete", {"taskId": task_id})
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def create_goal(title: str, description: str = "") -> dict:
    """Create a measurable goal. Args: title, description."""
    params = {"title": title}
    if description:
        params["description"] = description
    try:
        return registry.execute("goal.create", params)
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def delete_goal(goal_id: str) -> dict:
    """Delete a goal permanently. Requires confirmation. Args: goal_id."""
    try:
        return registry.execute("goal.delete", {"goalId": goal_id})
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def create_habit(name: str, frequency_type: str = "every_day") -> dict:
    """Create a recurring habit. Args: name, frequency_type."""
    try:
        return registry.execute(
            "habit.create",
            {"name": name, "frequencyType": frequency_type},
        )
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def delete_habit(habit_id: str) -> dict:
    """Delete a habit definition. Requires confirmation. Args: habit_id."""
    try:
        return registry.execute("habit.delete", {"habitId": habit_id})
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def estimate_task_duration(task_id: str) -> dict:
    """Estimate task minutes from similar completed tasks. Args: task_id."""
    try:
        task = api_client.get_task(task_id)
        completed = api_client.get_tasks()
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=90)
        focus = api_client.get_focus_history(
            start_date=start.isoformat(),
            end_date=end.isoformat(),
        )
        estimate = estimate_duration(task, completed, focus)
        return {"success": True, "taskId": task_id, **estimate}
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def suggest_subtasks(task_id: str) -> dict:
    """Propose subtasks for user approval. Never applies them. Args: task_id."""
    try:
        task = api_client.get_task(task_id)
        title = task.get("title") or "Untitled task"
        description = task.get("description") or ""
        prompt = f"""Break the task below into 3-6 concrete subtasks.
Return ONLY a JSON array of strings. Do not add commentary.

Task: {title}
Description: {description}
"""
        response = get_llm_provider().generate(prompt)
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        import json

        subtasks: List[str] = json.loads(content.strip())
        if not isinstance(subtasks, list):
            raise ValueError("LLM did not return a JSON array")
        cleaned = [str(item).strip() for item in subtasks if str(item).strip()][:8]
        proposal = api_client.create_proposal(
            "subtask_suggestion",
            {"taskId": task_id, "taskTitle": title, "subtasks": cleaned},
        )
        return {
            "success": True,
            "requiresConfirmation": True,
            "subtasks": cleaned,
            "proposal": proposal,
        }
    except Exception as exc:
        return {"success": False, "message": str(exc)}


TASK_TOOLS = [
    create_task, complete_task, delete_task, estimate_task_duration, suggest_subtasks,
]
GOAL_TOOLS = [create_goal, delete_goal]
HABIT_TOOLS = [create_habit, delete_habit]

TOOL_FUNCTIONS = {
    "create_task": create_task,
    "complete_task": complete_task,
    "delete_task": delete_task,
    "create_goal": create_goal,
    "delete_goal": delete_goal,
    "create_habit": create_habit,
    "delete_habit": delete_habit,
    "estimate_task_duration": estimate_task_duration,
    "suggest_subtasks": suggest_subtasks,
}

TOOLS_BY_INTENT: Dict[str, List[Any]] = {
    "TASK": TASK_TOOLS,
    "GOAL": GOAL_TOOLS,
    "HABIT": HABIT_TOOLS,
}

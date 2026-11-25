import requests

from runner.actions.registry import registry
from runner.config import HEADERS, settings


def habit_create_handler(params: dict):
    if not params.get("name"):
        raise ValueError("Habit name is required")

    valid_frequencies = ["every_day", "weekdays", "weekends", "custom"]
    if params.get("frequencyType") not in valid_frequencies:
        params["frequencyType"] = "every_day"

    try:
        response = requests.post(f"{settings.NODE_API_URL}/habits", headers=HEADERS, json=params, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def habit_delete_handler(params: dict):
    """Delete a habit definition. Marking today's completion is separate."""
    habit_id = params.get("habitId")
    if not habit_id:
        raise ValueError("habitId is required")
    try:
        response = requests.delete(f"{settings.NODE_API_URL}/habits/{habit_id}", headers=HEADERS, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        return {"success": False, "message": str(exc)}


registry.register(
    name="habit.create",
    description="Create a new recurring habit for the user to build",
    handler=habit_create_handler,
    requires_confirmation=False,
)

registry.register(
    name="habit.delete",
    description="Delete a habit definition permanently (not the same as marking it complete)",
    handler=habit_delete_handler,
    requires_confirmation=True,
)

import requests
from config import settings, HEADERS
from actions.registry import registry


def habit_create_handler(params: dict):
    """
    Creates a new recurring habit in the backend.
    Params: { name: str, frequencyType?: str, icon?: str, category?: str, description?: str }
    frequencyType must be one of: every_day | weekdays | weekends | custom
    """
    if not params.get("name"):
        raise ValueError("Habit name is required")

    # Ensure frequencyType is valid; default to every_day
    valid_frequencies = ["every_day", "weekdays", "weekends", "custom"]
    if params.get("frequencyType") not in valid_frequencies:
        params["frequencyType"] = "every_day"

    try:
        response = requests.post(
            f"{settings.NODE_API_URL}/habits",
            headers=HEADERS,
            json=params
        )
        response.raise_for_status()
        return response.json()  # Returns ActionResult with ui.invalidate
    except Exception as e:
        return {"success": False, "message": str(e)}


def habit_delete_handler(params: dict):
    """
    Deletes a habit permanently by ID.
    NOTE: This is for removing the habit definition entirely.
    To mark a habit as done for today, use habit.complete (not implemented yet).
    Params: { habitId: str }
    """
    habit_id = params.get("habitId")
    if not habit_id:
        raise ValueError("habitId is required")

    try:
        response = requests.delete(
            f"{settings.NODE_API_URL}/habits/{habit_id}",
            headers=HEADERS
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"success": False, "message": str(e)}


# Register actions in the registry
registry.register(
    name="habit.create",
    description="Create a new recurring habit for the user to build",
    handler=habit_create_handler,
    requires_confirmation=False
)

registry.register(
    name="habit.delete",
    description="Delete a habit definition permanently (not the same as marking it complete)",
    handler=habit_delete_handler,
    requires_confirmation=True
)

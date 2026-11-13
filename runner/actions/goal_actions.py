import requests
from config import settings, HEADERS
from actions.registry import registry


def goal_create_handler(params: dict):
    """
    Creates a new goal in the backend.
    Params: { title: str, description?: str }
    """
    if not params.get("title"):
        raise ValueError("Goal title is required")

    try:
        response = requests.post(
            f"{settings.NODE_API_URL}/goals",
            headers=HEADERS,
            json=params
        )
        response.raise_for_status()
        return response.json()  # Returns ActionResult with ui.invalidate
    except Exception as e:
        return {"success": False, "message": str(e)}


def goal_delete_handler(params: dict):
    """
    Deletes a goal permanently by ID.
    Params: { goalId: str }
    """
    goal_id = params.get("goalId")
    if not goal_id:
        raise ValueError("goalId is required")

    try:
        response = requests.delete(
            f"{settings.NODE_API_URL}/goals/{goal_id}",
            headers=HEADERS
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"success": False, "message": str(e)}


# Register actions in the registry
registry.register(
    name="goal.create",
    description="Create a new goal or quest for the user",
    handler=goal_create_handler,
    requires_confirmation=False
)

registry.register(
    name="goal.delete",
    description="Delete a goal permanently",
    handler=goal_delete_handler,
    requires_confirmation=True
)

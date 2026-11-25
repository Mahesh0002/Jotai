import requests

from runner.actions.registry import registry
from runner.config import HEADERS, settings


def goal_create_handler(params: dict):
    if not params.get("title"):
        raise ValueError("Goal title is required")
    try:
        response = requests.post(f"{settings.NODE_API_URL}/goals", headers=HEADERS, json=params, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def goal_delete_handler(params: dict):
    goal_id = params.get("goalId")
    if not goal_id:
        raise ValueError("goalId is required")
    try:
        response = requests.delete(f"{settings.NODE_API_URL}/goals/{goal_id}", headers=HEADERS, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        return {"success": False, "message": str(exc)}


registry.register(
    name="goal.create",
    description="Create a new goal or quest for the user",
    handler=goal_create_handler,
    requires_confirmation=False,
)

registry.register(
    name="goal.delete",
    description="Delete a goal permanently",
    handler=goal_delete_handler,
    requires_confirmation=True,
)

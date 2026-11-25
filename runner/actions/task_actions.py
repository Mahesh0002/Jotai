import requests

from runner.actions.registry import registry
from runner.config import HEADERS, settings


def task_create_handler(params: dict):
    if not params.get("title"):
        raise ValueError("Task title is required")
    try:
        response = requests.post(f"{settings.NODE_API_URL}/tasks", headers=HEADERS, json=params, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def task_complete_handler(params: dict):
    task_id = params.get("taskId")
    if not task_id:
        raise ValueError("taskId is required")
    try:
        response = requests.post(
            f"{settings.NODE_API_URL}/tasks/{task_id}/complete",
            headers=HEADERS,
            json={"actionId": params.get("actionId")},
            timeout=15,
        )
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def task_delete_handler(params: dict):
    task_id = params.get("taskId")
    if not task_id:
        raise ValueError("taskId is required")
    try:
        response = requests.delete(
            f"{settings.NODE_API_URL}/tasks/{task_id}",
            headers=HEADERS,
            json={"actionId": params.get("actionId")},
            timeout=15,
        )
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        return {"success": False, "message": str(exc)}


registry.register(
    name="task.create",
    description="Create a new task",
    handler=task_create_handler,
    requires_confirmation=False,
)

registry.register(
    name="task.complete",
    description="Mark a task as completed",
    handler=task_complete_handler,
    requires_confirmation=False,
)

registry.register(
    name="task.delete",
    description="Delete a task permanently",
    handler=task_delete_handler,
    requires_confirmation=True,
)

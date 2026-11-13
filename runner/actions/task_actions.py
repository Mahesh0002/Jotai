import requests
from config import settings, HEADERS
from actions.registry import registry

def task_create_handler(params: dict):
    """
    Preliminary validation occurs here (or in Pydantic models).
    Node is the final authority.
    """
    # Requires title
    if "title" not in params or not params["title"]:
        raise ValueError("Task title is required")
        
    try:
        response = requests.post(f"{settings.NODE_API_URL}/tasks", headers=HEADERS, json=params)
        response.raise_for_status()
        return response.json() # Returns the ActionResult
    except Exception as e:
        return {"success": False, "message": str(e)}

def task_complete_handler(params: dict):
    task_id = params.get("taskId")
    if not task_id:
        raise ValueError("taskId is required")
        
    try:
        response = requests.post(f"{settings.NODE_API_URL}/tasks/{task_id}/complete", headers=HEADERS, json={"actionId": params.get("actionId")})
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"success": False, "message": str(e)}

def task_delete_handler(params: dict):
    task_id = params.get("taskId")
    if not task_id:
        raise ValueError("taskId is required")
        
    try:
        # Assuming the backend route is DELETE /tasks/:id
        response = requests.delete(f"{settings.NODE_API_URL}/tasks/{task_id}", headers=HEADERS, json={"actionId": params.get("actionId")})
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"success": False, "message": str(e)}

# Register actions
registry.register(
    name="task.create", 
    description="Create a new task", 
    handler=task_create_handler,
    requires_confirmation=False
)

registry.register(
    name="task.complete", 
    description="Mark a task as completed", 
    handler=task_complete_handler,
    requires_confirmation=False
)

registry.register(
    name="task.delete", 
    description="Delete a task permanently", 
    handler=task_delete_handler,
    requires_confirmation=True
)

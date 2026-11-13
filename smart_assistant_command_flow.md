# Smart Assistant Command Flow

This document explains how commands—such as creating, completing, or deleting tasks—are processed by the Smart Assistant architecture.

## 1. User Intent (Frontend)
When the user types a message in the `SmartAssistant.tsx` chat (e.g., "Delete task"), the frontend sends the raw text to the Python Runner's trigger endpoint:

```http
POST http://localhost:8000/api/runner/trigger
Content-Type: application/json

{
  "intent": "Delete task 'Buy groceries'"
}W
```

## 2. Intent Processing (Runner)
The Python Runner processes this intent to figure out which action needs to run. It matches the intent against registered actions (such as `task.create`, `task.complete`, or `task.delete` found in `runner/actions/task_actions.py`).

- **If the action requires confirmation** (e.g., `task.delete` has `requires_confirmation=True`):
  The runner returns a response indicating `confirmationRequired: true`, along with the `actionName` and `params`.
- The frontend then renders a "Proposed Action" card in the chat, prompting the user to **Approve** or **Decline**.

## 3. Action Execution (Frontend to Runner)
If the user approves the action, the frontend calls the runner's execute endpoint:

```http
POST http://localhost:8000/api/runner/execute
Content-Type: application/json

{
  "actionName": "task.delete",
  "params": {
    "taskId": "12345",
    "actionId": "..."
  }
}
```

## 4. Action Handlers (Runner to Node Backend)
The runner routes the execution request to the appropriate handler registered in `registry.py`. 
For tasks, these handlers (`task_actions.py`) communicate directly with the main Node.js backend REST API to mutate the database:

- **Create Task (`task.create`)**: Makes a `POST` to `NODE_API_URL/tasks`
- **Complete Task (`task.complete`)**: Makes a `POST` to `NODE_API_URL/tasks/{id}/complete`
- **Delete Task (`task.delete`)**: Makes a `DELETE` to `NODE_API_URL/tasks/{id}`

```python
# Example from task_actions.py
def task_delete_handler(params: dict):
    task_id = params.get("taskId")
    response = requests.delete(f"{settings.NODE_API_URL}/tasks/{task_id}", ...)
    return response.json()
```

## 5. UI Invalidation
Once the Node backend completes the action and responds to the runner, the runner passes the result back to the frontend.

If the response contains `ui.invalidate` instructions, the frontend dispatches a custom event:
```javascript
window.dispatchEvent(
  new CustomEvent("jotai-invalidate", { detail: data.data.actionResult.ui.invalidate })
);
```
This triggers TanStack Query to refetch the necessary data, updating the dashboard UI seamlessly without a page reload.

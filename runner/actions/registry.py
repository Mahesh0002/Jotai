from typing import Dict, Any, Callable
import uuid

class ActionRegistry:
    def __init__(self):
        self.actions = {}

    def register(self, name: str, description: str, handler: Callable, requires_confirmation: bool = False):
        self.actions[name] = {
            "name": name,
            "description": description,
            "handler": handler,
            "requires_confirmation": requires_confirmation
        }

    def execute(self, name: str, params: Dict[str, Any]):
        if name not in self.actions:
            raise ValueError(f"Action {name} not found in registry")
            
        action = self.actions[name]
        
        # Check confirmation logic
        if action["requires_confirmation"] and not params.get("_confirmed", False):
            # Generate a stable action_id so the frontend can approve this specific action
            action_id = str(uuid.uuid4())
            return {
                "success": True,
                "confirmationRequired": True,
                "actionId": action_id,
                "actionName": name,
                "params": params,
                "message": f"Confirmation required for action: {action['description']}"
            }
        
        # Remove internal param before passing to node
        if "_confirmed" in params:
            del params["_confirmed"]
        
        # Generate an actionId for idempotency if it wasn't already generated during confirmation
        if "actionId" not in params:
            params["actionId"] = str(uuid.uuid4())
        
        # The handler (which makes the Node API request) executes
        return action["handler"](params)

registry = ActionRegistry()

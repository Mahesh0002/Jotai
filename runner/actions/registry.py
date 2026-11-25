import uuid
from typing import Any, Callable, Dict, Optional

from runner.services.confirmation_store import confirmation_store


class ActionRegistry:
    def __init__(self):
        self.actions: Dict[str, Dict[str, Any]] = {}

    def register(
        self,
        name: str,
        description: str,
        handler: Callable,
        requires_confirmation: bool = False,
    ) -> None:
        self.actions[name] = {
            "name": name,
            "description": description,
            "handler": handler,
            "requires_confirmation": requires_confirmation,
        }

    def unregister(self, name: str) -> None:
        self.actions.pop(name, None)

    def execute(
        self,
        name: str,
        params: Dict[str, Any],
        confirmed_action_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if name not in self.actions:
            raise ValueError(f"Action {name} not found in registry")

        action = self.actions[name]
        params = dict(params)

        if action["requires_confirmation"]:
            if not confirmed_action_id:
                action_id = confirmation_store.create(name, params)
                return {
                    "success": True,
                    "confirmationRequired": True,
                    "actionId": action_id,
                    "actionName": name,
                    "params": {**params, "actionId": action_id},
                    "message": f"Confirmation required for action: {action['description']}",
                }

            pending = confirmation_store.consume(confirmed_action_id, name)
            if not pending:
                return {
                    "success": False,
                    "confirmationRequired": True,
                    "message": "Confirmation expired or invalid. Please ask again.",
                }
            # Execute the stored params, not client-supplied ones, so a caller
            # cannot approve one action and swap its payload afterwards.
            params = {**pending["params"], "actionId": confirmed_action_id}

        params.setdefault("actionId", uuid.uuid4().hex)
        return action["handler"](params)


registry = ActionRegistry()

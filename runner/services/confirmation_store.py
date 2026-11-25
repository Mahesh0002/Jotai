import time
import uuid
from typing import Any, Dict, Optional

from runner.config import settings


class ConfirmationStore:
    """In-memory, single-process store of actions awaiting user approval.

    Local-only by design: the Runner runs as one local process. A restart
    invalidates pending approvals, which is safer than persisting them.
    """

    def __init__(self, ttl_seconds: Optional[int] = None):
        self.ttl_seconds = ttl_seconds or settings.PENDING_ACTION_TTL_SECONDS
        self._pending: Dict[str, Dict[str, Any]] = {}

    def _purge(self) -> None:
        now = time.monotonic()
        expired = [key for key, item in self._pending.items() if item["expires_at"] <= now]
        for key in expired:
            self._pending.pop(key, None)

    def create(self, action_name: str, params: Dict[str, Any]) -> str:
        self._purge()
        action_id = str(uuid.uuid4())
        self._pending[action_id] = {
            "actionId": action_id,
            "actionName": action_name,
            "params": dict(params),
            "expires_at": time.monotonic() + self.ttl_seconds,
        }
        return action_id

    def get(self, action_id: str) -> Optional[Dict[str, Any]]:
        self._purge()
        return self._pending.get(action_id)

    def consume(self, action_id: str, action_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        self._purge()
        item = self._pending.get(action_id)
        if not item:
            return None
        if action_name and item["actionName"] != action_name:
            return None
        self._pending.pop(action_id, None)
        return item

    def clear(self) -> None:
        self._pending.clear()


confirmation_store = ConfirmationStore()

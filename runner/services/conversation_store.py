from collections import deque
from typing import Any, Deque, Dict, List, Optional

from runner.config import settings


class ConversationStore:
    """In-memory chat state: bounded history + one pending confirmation.

    Only the last N turns are retained (one turn = one user message plus the
    assistant reply). History is trimmed server-side; it is never accepted
    from the client.
    """

    def __init__(self, max_turns: Optional[int] = None):
        self.max_turns = max_turns or settings.CHAT_HISTORY_TURNS
        self._history: Dict[str, Deque[Dict[str, str]]] = {}
        self._pending: Dict[str, Dict[str, Any]] = {}

    def append(self, session_id: str, role: str, content: str) -> None:
        history = self._history.setdefault(session_id, deque(maxlen=self.max_turns * 2))
        history.append({"role": role, "content": content})

    def history(self, session_id: str) -> List[Dict[str, str]]:
        return list(self._history.get(session_id, []))

    def format_history(self, session_id: str) -> str:
        lines = [f"{item['role']}: {item['content']}" for item in self.history(session_id)]
        return "\n".join(lines) if lines else "(no prior turns)"

    def set_pending(self, session_id: str, pending: Dict[str, Any]) -> None:
        self._pending[session_id] = dict(pending)

    def get_pending(self, session_id: str) -> Optional[Dict[str, Any]]:
        pending = self._pending.get(session_id)
        return dict(pending) if pending else None

    def clear_pending(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self._pending.pop(session_id, None)

    def clear(self, session_id: Optional[str] = None) -> None:
        if session_id is None:
            self._history.clear()
            self._pending.clear()
            return
        self._history.pop(session_id, None)
        self._pending.pop(session_id, None)


conversation_store = ConversationStore()

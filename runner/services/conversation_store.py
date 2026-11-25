import time
from collections import OrderedDict, deque
from typing import Any, Deque, Dict, List, Optional

from runner.config import settings


class ConversationStore:
    """Bounded in-memory chat state: LRU sessions, capped turns, pending action.

    Only the last N turns are retained (one turn = one user message plus the
    assistant reply). Sessions are evicted by least-recent use or TTL, and
    history is never accepted from the client.
    """

    def __init__(
        self,
        max_turns: Optional[int] = None,
        max_sessions: Optional[int] = None,
        session_ttl_seconds: Optional[float] = None,
    ):
        self.max_turns = max_turns or settings.CHAT_HISTORY_TURNS
        self.max_sessions = max(1, max_sessions or settings.CHAT_MAX_SESSIONS)
        self.session_ttl_seconds = (
            settings.CHAT_SESSION_TTL_SECONDS
            if session_ttl_seconds is None
            else session_ttl_seconds
        )
        self._history: Dict[str, Deque[Dict[str, str]]] = {}
        self._pending: Dict[str, Dict[str, Any]] = {}
        # session id -> last access time (monotonic); oldest first.
        self._sessions: "OrderedDict[str, float]" = OrderedDict()

    def _forget(self, session_id: str) -> None:
        self._history.pop(session_id, None)
        self._pending.pop(session_id, None)
        self._sessions.pop(session_id, None)

    def _prune(self) -> None:
        now = time.monotonic()
        ttl = self.session_ttl_seconds
        if ttl and ttl > 0:
            for session_id, touched in list(self._sessions.items()):
                if now - touched > ttl:
                    self._forget(session_id)
        while len(self._sessions) > self.max_sessions:
            self._forget(next(iter(self._sessions)))

    def _touch(self, session_id: str) -> None:
        self._prune()
        self._sessions[session_id] = time.monotonic()
        self._sessions.move_to_end(session_id)

    def append(self, session_id: str, role: str, content: str) -> None:
        self._touch(session_id)
        history = self._history.setdefault(session_id, deque(maxlen=self.max_turns * 2))
        history.append({"role": role, "content": content})

    def history(self, session_id: str) -> List[Dict[str, str]]:
        self._touch(session_id)
        return list(self._history.get(session_id, []))

    def format_history(self, session_id: str) -> str:
        lines = [f"{item['role']}: {item['content']}" for item in self.history(session_id)]
        return "\n".join(lines) if lines else "(no prior turns)"

    def set_pending(self, session_id: str, pending: Dict[str, Any]) -> None:
        self._touch(session_id)
        self._pending[session_id] = dict(pending)

    def get_pending(self, session_id: str) -> Optional[Dict[str, Any]]:
        self._touch(session_id)
        pending = self._pending.get(session_id)
        return dict(pending) if pending else None

    def clear_pending(self, session_id: str) -> Optional[Dict[str, Any]]:
        pending = self._pending.pop(session_id, None)
        if session_id not in self._history:
            self._sessions.pop(session_id, None)
        return pending

    def clear(self, session_id: Optional[str] = None) -> None:
        if session_id is None:
            self._history.clear()
            self._pending.clear()
            self._sessions.clear()
            return
        self._forget(session_id)


conversation_store = ConversationStore()

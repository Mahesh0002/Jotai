from typing import Any, Dict, List, Optional

import requests

from runner.config import HEADERS, settings


class APIClient:
    def __init__(self):
        self.base_url = settings.NODE_API_URL
        self.headers = dict(HEADERS)

    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        response = requests.get(f"{self.base_url}{endpoint}", headers=self.headers, params=params, timeout=15)
        response.raise_for_status()
        return response.json()

    def _post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.post(f"{self.base_url}{endpoint}", headers=self.headers, json=data, timeout=15)
        response.raise_for_status()
        return response.json()

    def _patch(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.patch(f"{self.base_url}{endpoint}", headers=self.headers, json=data, timeout=15)
        response.raise_for_status()
        return response.json()

    def _delete(self, endpoint: str) -> Dict[str, Any]:
        response = requests.delete(f"{self.base_url}{endpoint}", headers=self.headers, timeout=15)
        response.raise_for_status()
        return response.json()

    # Tasks
    def get_tasks(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        params = {}
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date
        if status:
            params["status"] = status
        if priority:
            params["priority"] = priority
        return self._get("/tasks", params=params).get("data", [])

    def get_task(self, task_id: str) -> Dict[str, Any]:
        return self._get(f"/tasks/{task_id}").get("data", {})

    # Habits
    def get_habit_logs(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        params = {}
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date
        return self._get("/habits", params=params).get("data", [])

    def get_habit_consistency(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        params = {"period": "week"}
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date
        return self._get("/habits/consistency", params=params).get("data", [])

    # Focus
    def get_focus_history(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        params = {}
        if start_date:
            params["start"] = start_date
        if end_date:
            params["end"] = end_date
        return self._get("/focus", params=params).get("data", [])

    # Calendar
    def get_calendar_events(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        params = {}
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date
        return self._get("/calendar/events", params=params).get("data", [])

    def sync_calendar(self) -> Dict[str, Any]:
        return self._get("/calendar/sync").get("data", {})

    def create_focus_block(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._post("/calendar/focus", payload)

    # Proposals & Decisions
    def get_decision_logs(self, limit: int = 200) -> List[Dict[str, Any]]:
        return self._get("/proposals/decisions", params={"limit": limit}).get("data", [])

    def create_proposal(self, proposal_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._post("/proposals", {"type": proposal_type, "data": data, "status": "pending"})

    # Context & Status
    def get_context(self) -> Dict[str, Any]:
        return self._get("/assistant/context").get("data", {})

    def get_status(self) -> Dict[str, Any]:
        return self._get("/status").get("data", {})

    def get_metrics(self) -> Dict[str, Any]:
        return self._get("/metrics/weekly").get("data", {})

    # Notes
    def get_notes(self) -> List[Dict[str, Any]]:
        return self._get("/notes").get("data", [])

    def get_note(self, note_id: str) -> Dict[str, Any]:
        return self._get(f"/notes/{note_id}").get("data", {})

    def search_notes(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        """Local FTS5 retrieval — no embeddings or network calls required."""
        return self._get("/notes/search", params={"q": query, "limit": limit}).get("data", [])

    # Preferences
    def get_preferences(self) -> Dict[str, Any]:
        return self._get("/preferences").get("data", {})

    def update_preferences(self, patch: Dict[str, Any]) -> Dict[str, Any]:
        return self._patch("/preferences", patch).get("data", {})

    # Conversations
    def get_conversation(self, session_id: str) -> Dict[str, Any]:
        return self._get(f"/conversations/{session_id}").get("data", {})

    def append_message(self, session_id: str, role: str, content: str, tool_calls: Optional[List] = None) -> Dict[str, Any]:
        data = {"role": role, "content": content}
        if tool_calls:
            data["toolCalls"] = tool_calls
        return self._post(f"/conversations/{session_id}/messages", data).get("data", {})

    # Events (long-poll)
    def get_events(self, after_id: int = 0, timeout: int = 20000) -> Dict[str, Any]:
        params = {"after": after_id, "timeout": timeout}
        response = requests.get(
            f"{self.base_url}/events",
            headers=self.headers,
            params=params,
            timeout=timeout / 1000 + 5,
        )
        response.raise_for_status()
        return response.json()


api_client = APIClient()
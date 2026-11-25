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

    def get_tasks(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        params = {}
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date
        return self._get("/tasks", params=params).get("data", [])

    def get_task(self, task_id: str) -> Dict[str, Any]:
        return self._get(f"/tasks/{task_id}").get("data", {})

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

    def get_calendar_events(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Calendar events exposed by the Node backend.

        The current backend endpoint returns synthetic events (see
        `backend/src/controllers/todayController.js`); it honors the date
        range but is not a real calendar integration.
        """
        params = {}
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date
        return self._get("/today/calendar", params=params).get("data", [])

    def get_decision_logs(self, limit: int = 200) -> List[Dict[str, Any]]:
        return self._get("/proposals/decisions", params={"limit": limit}).get("data", [])

    def create_proposal(self, proposal_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._post("/proposals", {"type": proposal_type, "data": data, "status": "pending"})


api_client = APIClient()

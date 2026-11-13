import requests
from typing import Optional, Dict, Any, List
from .config import settings

class APIClient:
    def __init__(self):
        self.base_url = settings.NODE_API_URL
        self.headers = {
            "Authorization": f"Bearer {settings.RUNNER_SERVICE_TOKEN}",
            "Content-Type": "application/json"
        }

    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        response = requests.get(f"{self.base_url}{endpoint}", headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()
        
    def _post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.post(f"{self.base_url}{endpoint}", headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

    def get_tasks(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        params = {}
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date
        return self._get("/tasks", params=params).get("data", [])

    def get_habit_logs(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        params = {}
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date
        return self._get("/habits", params=params).get("data", [])

    def get_focus_history(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        params = {}
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date
        return self._get("/focus", params=params).get("data", [])

    def create_proposal(self, proposal_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        payload = {
            "type": proposal_type,
            "data": data,
            "status": "pending"
        }
        return self._post("/proposals", data=payload)

api_client = APIClient()

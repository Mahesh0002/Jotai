import requests
import json
from config import settings, HEADERS

def get_aggregated_context():
    """
    Fetches the lightweight, structured context snapshot from the Node.js backend.
    """
    try:
        response = requests.get(f"{settings.NODE_API_URL}/assistant/context", headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        return data.get("data", {})
    except Exception as e:
        print(f"[ContextEngine] Failed to fetch context: {e}")
        return {}

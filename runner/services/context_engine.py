import requests

from runner.config import HEADERS, settings


def get_aggregated_context():
    """Fetch the lightweight context snapshot from the Node backend."""
    try:
        response = requests.get(f"{settings.NODE_API_URL}/assistant/context", headers=HEADERS, timeout=10)
        response.raise_for_status()
        return response.json().get("data", {})
    except Exception as exc:
        print(f"[ContextEngine] Failed to fetch context: {exc}")
        return {}

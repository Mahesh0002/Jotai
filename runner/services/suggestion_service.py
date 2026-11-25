import requests

from runner.config import HEADERS, settings


def create_suggestion(
    type: str,
    priority: str,
    title: str,
    message: str,
    targetModule: str,
    actions: list = None,
):
    """Push a proactive suggestion to Node. Node owns deduplication."""
    payload = {
        "type": type,
        "priority": priority,
        "title": title,
        "message": message,
        "targetModule": targetModule,
        "actions": actions or [],
    }
    try:
        response = requests.post(
            f"{settings.NODE_API_URL}/assistant/suggestions",
            headers=HEADERS,
            json=payload,
            timeout=10,
        )
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        print(f"[SuggestionService] Failed to create suggestion: {exc}")
        return None

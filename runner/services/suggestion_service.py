import requests
from config import settings, HEADERS

def create_suggestion(type: str, priority: str, title: str, message: str, targetModule: str, actions: list = None):
    """
    Pushes a new proactive suggestion to the Node.js backend.
    Node handles deduplication and persistence.
    """
    if actions is None:
        actions = []
        
    payload = {
        "type": type,
        "priority": priority,
        "title": title,
        "message": message,
        "targetModule": targetModule,
        "actions": actions
    }
    
    try:
        response = requests.post(f"{settings.NODE_API_URL}/assistant/suggestions", headers=HEADERS, json=payload)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[SuggestionService] Failed to create suggestion: {e}")
        return None

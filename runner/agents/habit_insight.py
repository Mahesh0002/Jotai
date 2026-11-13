import json
from datetime import datetime, timedelta
from typing import Dict, Any

from ..api_client import api_client
from ..llm_provider import get_llm_provider

def run_habit_insight_agent() -> Dict[str, Any]:
    llm = get_llm_provider()
    
    # Get past 7 days of data
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    start_str = start_date.isoformat()
    end_str = end_date.isoformat()
    
    habits = api_client.get_habit_logs(start_date=start_str, end_date=end_str)
    focus = api_client.get_focus_history(start_date=start_str, end_date=end_str)
    
    prompt = f"""
    You are an AI habit and productivity analyst.
    Analyze the user's habits and focus blocks over the last 7 days.
    Identify one actionable correlation or insight.
    
    Habit Data:
    {json.dumps(habits, indent=2)}
    
    Focus Block Data:
    {json.dumps(focus, indent=2)}
    
    Return a single JSON object with keys:
    "title": A short title for the insight.
    "description": A 1-2 sentence description.
    "action": A suggested action.
    
    Output ONLY valid JSON.
    """
    
    response = llm.generate(prompt)
    content = response.content.strip()
    
    # Strip markdown block if any
    if content.startswith("```json"):
        content = content[7:-3]
    elif content.startswith("```"):
        content = content[3:-3]
        
    try:
        insight = json.loads(content)
    except json.JSONDecodeError:
        insight = {
            "title": "Could not parse insight",
            "description": "The AI provided an insight but it was not in valid JSON format.",
            "action": "Check the raw AI output in logs.",
            "raw": content
        }
        
    # Submit to node backend
    proposal = api_client.create_proposal("habit_insight", insight)
    return proposal

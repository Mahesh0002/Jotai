import json
from datetime import datetime, timedelta
from typing import Dict, Any, List

from ..api_client import api_client
from ..llm_provider import get_llm_provider

def check_schedule_constraints(blocks: List[Dict[str, Any]]) -> str:
    """Check for overlaps and invalid times in proposed blocks."""
    # Assuming blocks have startTime and endTime as ISO strings
    parsed_blocks = []
    for b in blocks:
        try:
            start = datetime.fromisoformat(b.get("startTime", "").replace("Z", "+00:00"))
            end = datetime.fromisoformat(b.get("endTime", "").replace("Z", "+00:00"))
            parsed_blocks.append((start, end))
        except Exception:
            return "Invalid startTime or endTime format in one of the blocks."
            
    parsed_blocks.sort(key=lambda x: x[0])
    for i in range(len(parsed_blocks) - 1):
        if parsed_blocks[i][1] > parsed_blocks[i+1][0]:
            return f"Overlap detected between block ending at {parsed_blocks[i][1]} and starting at {parsed_blocks[i+1][0]}."
    
    return ""

def run_planning_agent() -> Dict[str, Any]:
    llm = get_llm_provider()
    
    # Get upcoming tasks and recent focus history context
    now = datetime.now()
    start_str = now.isoformat()
    end_str = (now + timedelta(days=2)).isoformat()
    
    tasks = api_client.get_tasks(start_date=start_str, end_date=end_str)
    
    base_prompt = f"""
    You are an AI schedule planner.
    Propose 3 focus blocks for the upcoming 48 hours to tackle the highest priority tasks.
    
    Upcoming Tasks:
    {json.dumps(tasks, indent=2)}
    
    Return a JSON array of objects with keys:
    "taskId": ID of the task to focus on.
    "title": Title of the focus block.
    "startTime": ISO datetime string for block start.
    "endTime": ISO datetime string for block end.
    
    Make sure no blocks overlap!
    Output ONLY valid JSON.
    """
    
    max_attempts = 3
    attempt = 0
    feedback = ""
    best_blocks = []
    flags = []
    
    while attempt < max_attempts:
        attempt += 1
        prompt = base_prompt
        if feedback:
            prompt += f"\n\nPREVIOUS ATTEMPT FAILED. FEEDBACK:\n{feedback}\nPlease fix it."
            
        response = llm.generate(prompt)
        content = response.content.strip()
        
        # Strip markdown block if any
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
            
        try:
            blocks = json.loads(content)
            if not isinstance(blocks, list):
                raise ValueError("Output is not a JSON array")
                
            error = check_schedule_constraints(blocks)
            if not error:
                # Success!
                proposal = api_client.create_proposal("schedule_proposal", blocks)
                return proposal
            else:
                feedback = error
                best_blocks = blocks
                
        except Exception as e:
            feedback = f"Parsing error: {str(e)}"
            
    # If we exit the loop, we failed to meet constraints
    flags.append("constraint_violation")
    if not best_blocks:
        best_blocks = [{"error": "Agent failed to produce valid JSON or blocks after 3 attempts.", "raw": content}]
        
    proposal = api_client.create_proposal("schedule_proposal", {"blocks": best_blocks, "flags": flags})
    return proposal

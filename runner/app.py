from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from events.consumer import start_consumer
from config import settings
from actions.registry import registry
import actions.task_actions  # registers task.create / task.complete / task.delete
import actions.goal_actions   # registers goal.create / goal.delete
import actions.habit_actions  # registers habit.create / habit.delete
# If using the orchestrator for full intent routing later, import it here.
# For Phase 1A, we'll build a simple proxy to test the registry.

app = FastAPI(title="Jötai Runner")

# Add CORS so the React frontend can call the Runner directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TriggerRequest(BaseModel):
    intent: str
    user_id: Optional[str] = "local_user"

class ExecuteRequest(BaseModel):
    actionName: str
    params: dict

# Start the Redis Stream Consumer in the background when the app starts
consumer_stop_event = None

@app.on_event("startup")
def startup_event():
    global consumer_stop_event
    print("Starting Redis Consumer...")
    consumer_stop_event = start_consumer()

@app.on_event("shutdown")
def shutdown_event():
    global consumer_stop_event
    if consumer_stop_event:
        print("Stopping Redis Consumer...")
        consumer_stop_event.set()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Jötai Runner"}

@app.post("/api/runner/trigger")
def trigger_agent(request: TriggerRequest):
    try:
        from agents.orchestrator import run_orchestrator
        return run_orchestrator(request.intent, request.user_id)
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.post("/api/runner/execute")
def execute_action(request: ExecuteRequest):
    try:
        # User confirmed, append _confirmed flag
        request.params["_confirmed"] = True
        result = registry.execute(request.actionName, request.params)
        return {
            "success": result.get("success", False) if isinstance(result, dict) else True,
            "data": {
                "reply": f"Action {request.actionName} executed successfully.",
                "actionResult": result
            }
        }
    except Exception as e:
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

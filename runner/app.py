import logging
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from runner.actions.registry import registry
import runner.actions.task_actions  # noqa: F401  (registers task actions)
import runner.actions.goal_actions  # noqa: F401
import runner.actions.habit_actions  # noqa: F401
from runner.agents.orchestrator import run_orchestrator
from runner.events.consumer import start_consumer

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Jötai Runner")

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
    sessionId: Optional[str] = None


class ExecuteRequest(BaseModel):
    actionName: str
    params: dict = {}
    actionId: Optional[str] = None


consumer_stop_event = None


@app.on_event("startup")
def startup_event():
    global consumer_stop_event
    print("Starting Redis Consumer...")
    consumer_stop_event = start_consumer()


@app.on_event("shutdown")
def shutdown_event():
    if consumer_stop_event:
        print("Stopping Redis Consumer...")
        consumer_stop_event.set()


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Jötai Runner"}


@app.post("/api/runner/trigger")
def trigger_agent(request: TriggerRequest):
    try:
        return run_orchestrator(request.intent, request.user_id, request.sessionId)
    except Exception as exc:
        return {"success": False, "message": str(exc)}


@app.post("/api/runner/execute")
def execute_action(request: ExecuteRequest):
    try:
        result = registry.execute(
            request.actionName,
            request.params,
            confirmed_action_id=request.actionId,
        )
        return {
            "success": result.get("success", False) if isinstance(result, dict) else True,
            "data": {
                "reply": f"Action {request.actionName} executed successfully.",
                "actionResult": result,
            },
        }
    except Exception as exc:
        return {"success": False, "message": str(exc)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from runner.actions.registry import registry
import runner.actions.task_actions  # noqa: F401
import runner.actions.goal_actions  # noqa: F401
import runner.actions.habit_actions  # noqa: F401
from runner.agents.agent_loop import run_agent
from runner.services.egress_guard import assert_egress_guard
from runner.services.scheduler import lifespan as scheduler_lifespan

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)


class TriggerRequest(BaseModel):
    intent: str
    user_id: Optional[str] = "local_user"
    sessionId: Optional[str] = None


class ExecuteRequest(BaseModel):
    actionName: str
    params: dict = {}
    actionId: Optional[str] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Jötai Runner...")

    # Egress guard assertion
    assert_egress_guard()

    # Start scheduler
    async with scheduler_lifespan(app):
        yield

    # Shutdown
    logger.info("Jötai Runner shutdown complete")


app = FastAPI(title="Jötai Runner", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    from runner.config import settings
    return {
        "status": "ok",
        "service": "Jötai Runner",
        "llm": settings.LLM_PROVIDER,
        "offline": settings.PRIVACY_MODE == "strict",
    }


@app.post("/api/runner/trigger")
async def trigger_agent(request: TriggerRequest):
    try:
        return await run_agent(request.intent, request.user_id, request.sessionId)
    except Exception as exc:
        logger.exception("Trigger error")
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
        logger.exception("Execute error")
        return {"success": False, "message": str(exc)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
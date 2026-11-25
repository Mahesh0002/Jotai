import inspect
import json
import logging
from datetime import date
from typing import Any, Dict, Optional

from runner.agents.habit_insight import run_habit_insight_agent
from runner.agents.planning import run_planning_agent
from runner.agents.router import classify_intent
from runner.actions.registry import registry
from runner.agents.tools import TOOL_FUNCTIONS, TOOLS_BY_INTENT
from runner.llm_provider import get_llm_provider
from runner.services.context_engine import get_aggregated_context
from runner.services.conversation_store import conversation_store

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Jötai Smart Assistant, a concise productivity companion.
Today's date: {today}

Current system context:
{context}

Conversation so far:
{history}

--- DOMAIN DEFINITIONS ---
TASK — a one-time, completable action with a clear done condition.
GOAL — a measurable outcome or milestone over days/weeks/months.
HABIT — a recurring behavior with a schedule.

OPERATION GUIDELINES
- Keep responses to 1-3 sentences.
- Use the tools for mutations; never invent IDs.
- Deletes require confirmation; the registry handles that.
- If the user does not specify which item to complete or delete, ask them to clarify.
- Never calculate durations, counts, streaks or correlations yourself. Use the
  deterministic tools; they return numbers computed in Python.
"""

ROUTINE_TOOLS = set(TOOL_FUNCTIONS)

AFFIRMATIVE = {
    "yes", "y", "yeah", "yep", "approve", "approved", "ok", "okay", "sure",
    "do it", "confirm", "confirmed", "go ahead", "proceed",
}
NEGATIVE = {"no", "n", "nope", "decline", "declined", "cancel", "stop", "don't", "dont"}


def _clean(text: str) -> str:
    return (text or "").strip().lower().strip(".!? ")


def _is_affirmative(text: str) -> bool:
    return _clean(text) in AFFIRMATIVE


def _is_negative(text: str) -> bool:
    return _clean(text) in NEGATIVE


def _call_tool(function_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    function = TOOL_FUNCTIONS.get(function_name)
    if not function:
        return {"success": False, "message": f"Unknown tool: {function_name}"}
    allowed = set(inspect.signature(function).parameters)
    filtered = {key: value for key, value in (args or {}).items() if key in allowed}
    return function(**filtered)


def _reply(message: str, **extra: Any) -> Dict[str, Any]:
    return {"success": True, "data": {"reply": message, **extra}}


def _static_reply(function_name: str, args: Dict[str, Any], result: Dict[str, Any]) -> str:
    if function_name == "create_task":
        return f"Got it. I've added the task: '{args.get('title', '')}'."
    if function_name == "complete_task":
        return "Task completed."
    if function_name == "delete_task":
        return "Task deleted."
    if function_name == "create_goal":
        return f"Goal created: '{args.get('title', '')}'."
    if function_name == "delete_goal":
        return "Goal deleted."
    if function_name == "create_habit":
        return f"Habit '{args.get('name', '')}' created successfully."
    if function_name == "delete_habit":
        return "Habit deleted."
    if function_name == "estimate_task_duration":
        minutes = result.get("minutes")
        if minutes is None:
            return "I don't have enough completed-task history to estimate that yet."
        return (
            f"Estimated duration: {minutes} minutes "
            f"({result.get('source')}, n={result.get('sample_size')})."
        )
    if function_name == "suggest_subtasks":
        count = len(result.get("subtasks") or [])
        return (
            f"I've prepared {count} subtasks for your review. "
            "They are a proposal only and are not applied automatically."
        )
    return "Action completed."


def _remember(session_id: str, user_text: str, result: Dict[str, Any]) -> None:
    conversation_store.append(session_id, "user", user_text)
    reply = (result.get("data") or {}).get("reply") or result.get("message") or ""
    if reply:
        conversation_store.append(session_id, "assistant", reply)


def _handle_pending(session_id: str, text: str) -> Optional[Dict[str, Any]]:
    pending = conversation_store.get_pending(session_id)
    if not pending:
        return None

    if _is_negative(text):
        conversation_store.clear_pending(session_id)
        return _reply("Okay, I cancelled that action.")

    if not _is_affirmative(text):
        return None

    action_result = registry.execute(
        pending["actionName"], {}, confirmed_action_id=pending["actionId"]
    )
    conversation_store.clear_pending(session_id)

    if action_result.get("success"):
        return _reply(
            _static_reply(pending["actionName"], pending.get("params", {}), action_result),
            actionResult=action_result,
        )
    return {
        "success": False,
        "data": {
            "reply": action_result.get("message", "That action could not be completed."),
            "actionResult": action_result,
        },
    }


def _run_action(session_id: str, intent: str, text: str) -> Dict[str, Any]:
    tools = TOOLS_BY_INTENT.get(intent, [])
    context_data = get_aggregated_context()
    system_prompt = SYSTEM_PROMPT.format(
        today=date.today().isoformat(),
        context=json.dumps(context_data, indent=2),
        history=conversation_store.format_history(session_id),
    )
    prompt = f"{system_prompt}\n\nUser Request: {text}"

    response = get_llm_provider().generate(prompt, tools=tools)

    if not response.tool_calls:
        return _reply(response.content or "I'm not sure what you'd like me to do.")

    tool_call = response.tool_calls[0]
    function_name = tool_call.name
    args = dict(tool_call.args or {})
    action_result = _call_tool(function_name, args)

    if action_result.get("confirmationRequired"):
        conversation_store.set_pending(
            session_id,
            {
                "actionId": action_result["actionId"],
                "actionName": action_result["actionName"],
                "params": action_result.get("params", {}),
            },
        )
        return _reply(
            action_result.get("message", "Are you sure you want to proceed?"),
            actionResult=action_result,
        )

    if not action_result.get("success", False):
        return {
            "success": False,
            "data": {
                "reply": f"Sorry, I couldn't do that: {action_result.get('message', 'unknown error')}",
                "actionResult": action_result,
            },
        }

    if function_name in ROUTINE_TOOLS:
        return _reply(
            _static_reply(function_name, args, action_result),
            actionResult=action_result,
        )

    # Optional narration path for non-trivial outcomes only.
    narration_prompt = f"""{system_prompt}

User Request: {text}
Tool `{function_name}` returned:
{json.dumps(action_result, indent=2)}

Write one concise sentence for the user. Do not add numbers that are not in the tool result.
"""
    narration = get_llm_provider().generate(narration_prompt)
    return _reply(narration.content, actionResult=action_result)


def _run(intent: str, session_id: str) -> Dict[str, Any]:
    pending_result = _handle_pending(session_id, intent)
    if pending_result is not None:
        return pending_result

    classification = classify_intent(intent, session_id=session_id)
    routed_intent = classification["intent"]

    if routed_intent == "UNKNOWN":
        return _reply(
            "I'm not sure what you want to do. I can create tasks, goals or habits, "
            "plan focus blocks, or analyze your habits. Could you rephrase?",
            classification=classification,
        )

    if routed_intent == "PLAN":
        result = run_planning_agent()
        return {"success": True, "data": {"reply": "I've prepared a schedule proposal for review.", "proposal": result, "classification": classification}}

    if routed_intent == "INSIGHT":
        result = run_habit_insight_agent()
        return {"success": True, "data": {"reply": "I've prepared a habit insight for review.", "proposal": result, "classification": classification}}

    result = _run_action(session_id, routed_intent, intent)
    result.setdefault("data", {})["classification"] = classification
    return result


def run_orchestrator(intent: str, user_id: str = "local_user", session_id: Optional[str] = None) -> Dict[str, Any]:
    """Classify, route, and execute one user message."""
    session = session_id or user_id
    try:
        result = _run(intent, session)
    except Exception as exc:
        logger.exception("orchestrator_error session=%s error=%s", session, exc)
        result = {
            "success": False,
            "data": {"reply": "I encountered an internal error while processing your request."},
        }
    _remember(session, intent, result)
    return result

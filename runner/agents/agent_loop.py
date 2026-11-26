"""Single entrypoint for assistant requests.

In-domain requests never call a model: a deterministic rule router selects a
tool and local FTS5 retrieval supplies note context. Only out-of-domain text is
handed to the configured (local, quantized) model.
"""

import json
import logging
from typing import Any, Dict, List, Optional

from runner.agents import deterministic
from runner.api_client import api_client
from runner.config import settings
from runner.llm_provider import get_llm_provider
from runner.services.conversation_store import conversation_store

logger = logging.getLogger(__name__)

DESTRUCTIVE_TOOLS = {"task.delete", "goal.delete"}
AFFIRMATIVE = {"yes", "y", "yeah", "yep", "ok", "okay", "sure", "confirm", "confirmed", "go ahead", "do it"}
NEGATIVE = {"no", "n", "nope", "cancel", "stop", "don't", "dont"}


def _clean(text: str) -> str:
    return (text or "").strip().lower().strip(".!? ")


def _reply(message: str, intent: str, stage: str, tools_used: Optional[List[str]] = None,
           invalidate: Optional[List[str]] = None, **extra: Any) -> Dict[str, Any]:
    return {
        "success": True,
        "data": {
            "reply": message,
            "classification": {
                "intent": intent,
                "stage": stage,
                "tools_used": tools_used or [],
            },
            "ui": {"invalidate": invalidate or []},
            **extra,
        },
    }


def _out_of_domain(text: str, session_id: str) -> Dict[str, Any]:
    """Use the configured local model only for requests outside the app domain."""
    try:
        notes = api_client.search_notes(text[:200], limit=3)
        context = api_client.get_context()
    except Exception as exc:
        logger.warning("Could not load local context for fallback: %s", exc)
        notes, context = [], {}

    if settings.PRIVACY_MODE == "strict" and settings.LLM_PROVIDER not in ("ollama", "stub"):
        raise RuntimeError("Out-of-domain model disabled in strict privacy mode")

    history = conversation_store.history(session_id)
    prompt = (
        "You are the local Jōtai assistant. All data stays on this machine.\n"
        "Answer in 1-3 sentences. Do not invent numbers or ids.\n"
        f"User: {text}\n"
        f"Relevant local notes: {json.dumps(notes, ensure_ascii=False)}\n"
        f"Local context: {json.dumps(context, ensure_ascii=False)[:2000]}\n"
        f"Recent conversation: {json.dumps(history[-6:], ensure_ascii=False)}\n"
    )
    response = get_llm_provider().generate(prompt)
    content = (response.content or "").strip()
    if not content:
        content = "I can only answer that with the local model, which is not available right now."
    return _reply(content, "OUT_OF_DOMAIN", "model", tools_used=["note.search"] if notes else [])


def _remember(session_id: str, user_text: str, result: Dict[str, Any]) -> None:
    conversation_store.append(session_id, "user", user_text)
    reply = (result.get("data") or {}).get("reply") or result.get("message") or ""
    if reply:
        conversation_store.append(session_id, "assistant", reply)
    # Best-effort persistence; the in-memory store is authoritative for routing.
    try:
        api_client.append_message(session_id, "user", user_text)
        if reply:
            api_client.append_message(session_id, "assistant", reply)
    except Exception as exc:
        logger.debug("Conversation persistence skipped: %s", exc)


async def run_agent(user_text: str, user_id: str = "local_user", session_id: Optional[str] = None) -> Dict[str, Any]:
    """Route one message deterministically, falling back to the local model."""
    session = session_id or user_id
    text = (user_text or "").strip()
    pending = conversation_store.get_pending(session)

    try:
        if pending:
            if _clean(text) in NEGATIVE:
                conversation_store.clear_pending(session)
                result = _reply("Okay, I cancelled that action.", "CONFIRM", "rule")
            elif _clean(text) in AFFIRMATIVE:
                conversation_store.clear_pending(session)
                tool = pending["tool"]
                args = pending.get("args") or {}
                try:
                    outcome = deterministic.execute_tool(tool, args, session)
                    result = _reply(
                        deterministic.render_reply(tool, args, outcome),
                        pending.get("intent", "MUTATION"),
                        "rule",
                        tools_used=[tool],
                        invalidate=pending.get("invalidate", []),
                        actionResult=outcome,
                    )
                except Exception as exc:
                    result = _reply(f"Sorry, I couldn't do that: {exc}", "ERROR", "rule")
            else:
                result = _reply("Please confirm with yes or no before I continue.", "CONFIRM", "rule")

        else:
            plan = deterministic.plan(text)
            if plan is None:
                result = _out_of_domain(text, session)
            elif plan.get("clarify"):
                result = _reply(plan["clarify"], plan.get("intent", "CLARIFY"), "rule")
            else:
                tool, args = plan["tool"], plan.get("args") or {}
                if tool in DESTRUCTIVE_TOOLS:
                    conversation_store.set_pending(session, {
                        "tool": tool,
                        "args": args,
                        "intent": plan.get("intent"),
                        "invalidate": plan.get("invalidate", []),
                    })
                    result = _reply(f"Are you sure you want to {tool.replace('.', ' ')}? Please confirm with yes or no.",
                                    "CONFIRM", "rule")
                else:
                    outcome = deterministic.execute_tool(tool, args, session)
                    result = _reply(
                        deterministic.render_reply(tool, args, outcome),
                        plan.get("intent", "TASK"),
                        "rule",
                        tools_used=[tool],
                        invalidate=plan.get("invalidate", []),
                        actionResult=outcome,
                    )
    except Exception as exc:
        logger.exception("Agent error for session %s: %s", session, exc)
        result = _reply("I encountered an internal error while processing your request.", "ERROR", "error")

    _remember(session, text, result)
    return result

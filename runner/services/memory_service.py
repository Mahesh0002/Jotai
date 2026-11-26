import json
import logging
from typing import Dict, Any, List, Optional

from runner.config import settings
from runner.api_client import api_client
from runner.llm_provider import get_llm_provider

logger = logging.getLogger(__name__)

SUMMARIZE_EVERY_N = 10
SUMMARIZE_OLDEST = 20
KEEP_RECENT = 8


class MemoryService:
    def __init__(self):
        self._user_model_cache: Dict[str, Dict] = {}

    async def get_memory(self, user_id: str, session_id: str) -> Dict[str, Any]:
        """Get memory summary + user model for a session"""
        # Get conversation history
        conv = api_client.get_conversation(session_id)
        messages = conv.get("messages", []) if conv else []

        # Get stored summary and user model from preferences
        prefs = api_client.get_preferences()
        summary = prefs.get("memory_summary", "")
        user_model = prefs.get("user_model", {})

        # If we have enough messages, maybe summarize
        if len(messages) >= SUMMARIZE_EVERY_N:
            await self.maybe_summarize(user_id, session_id, messages)

        return {
            "summary": summary,
            "user_model": user_model,
            "recent_messages": messages[-KEEP_RECENT:] if messages else [],
        }

    async def maybe_summarize(self, user_id: str, session_id: str, messages: List[Dict]) -> None:
        """Summarize oldest messages if enough new ones since last summary"""
        prefs = api_client.get_preferences()
        last_summary_count = prefs.get("last_summary_count", 0)

        if len(messages) - last_summary_count >= SUMMARIZE_EVERY_N:
            await self.summarize_session(user_id, session_id, messages)
            api_client.update_preferences({"last_summary_count": len(messages)})

    async def summarize_session(self, user_id: str, session_id: str, messages: List[Dict]) -> None:
        """Summarize the oldest messages into a rolling summary"""
        if len(messages) <= KEEP_RECENT:
            return

        to_summarize = messages[:-KEEP_RECENT]
        recent = messages[-KEEP_RECENT:]

        # Build summarization prompt
        conversation_text = "\n".join([
            f"{m['role']}: {m['content']}" for m in to_summarize[-SUMMARIZE_OLDEST:]
        ])

        prompt = f"""Summarize the following conversation in 3-4 sentences. Focus on:
- Key topics discussed
- Decisions made or actions taken
- User preferences or patterns revealed
- Any ongoing context needed for future conversations

Conversation:
{conversation_text}

Summary:"""

        try:
            provider = get_llm_provider()
            response = provider.generate(prompt)
            new_summary = response.content.strip()

            # Get existing summary and combine
            prefs = api_client.get_preferences()
            existing_summary = prefs.get("memory_summary", "")

            if existing_summary:
                combined_prompt = f"""Previous summary:
{existing_summary}

New summary:
{new_summary}

Combine into a single coherent summary (max 5 sentences):"""
                combined_response = provider.generate(combined_prompt)
                final_summary = combined_response.content.strip()
            else:
                final_summary = new_summary

            # Update preferences with new summary
            api_client.update_preferences({"memory_summary": final_summary})
            logger.info(f"Updated memory summary for session {session_id}")

        except Exception as e:
            logger.error(f"Failed to summarize session: {e}")

    async def update_user_model(self, user_id: str) -> None:
        """Update structured user model from decision logs (deterministic)"""
        # This would use stats.py to compute preferences
        # For now, fetch from Node preferences
        prefs = api_client.get_preferences()
        user_model = prefs.get("user_model", {})

        # Could enhance with decision log analysis
        # decision_logs = api_client.get_decision_logs()
        # ...

        api_client.update_preferences({"user_model": json.dumps(user_model)})

    def get_cached_user_model(self, user_id: str) -> Dict:
        return self._user_model_cache.get(user_id, {})


memory_service = MemoryService()
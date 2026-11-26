import json
import logging
from typing import Any, Callable, List, Optional

import requests
from pydantic import BaseModel

from runner.config import settings
from runner.llm_provider import BaseLLMProvider, LLMResponse

logger = logging.getLogger(__name__)


class ToolCall(BaseModel):
    name: str
    args: dict
    id: Optional[str] = None


class OllamaProvider(BaseLLMProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_HOST.rstrip('/')
        self.chat_model = settings.OLLAMA_CHAT_MODEL
        self.embed_model = settings.OLLAMA_EMBED_MODEL

    def _call_ollama(self, endpoint: str, payload: dict) -> dict:
        url = f"{self.base_url}{endpoint}"
        response = requests.post(url, json=payload, timeout=120)
        response.raise_for_status()
        return response.json()

    def generate(self, prompt: str, tools: Optional[List[Callable]] = None) -> LLMResponse:
        payload = {
            "model": self.chat_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
            },
        }

        if tools:
            # Convert tools to Ollama format
            payload["tools"] = [
                {
                    "type": "function",
                    "function": {
                        "name": t.__name__ if hasattr(t, '__name__') else t.get('name', 'unknown'),
                        "description": t.__doc__ if hasattr(t, '__doc__') else t.get('description', ''),
                        "parameters": t.parameters if hasattr(t, 'parameters') else t.get('parameters', {}),
                    },
                }
                for t in tools
            ]

        try:
            result = self._call_ollama("/api/generate", payload)
            response_text = result.get("response", "")

            # Parse tool calls from response if present
            tool_calls = None
            if "tool_calls" in result:
                tool_calls = [
                    ToolCall(name=tc["function"]["name"], args=tc["function"]["arguments"], id=tc.get("id"))
                    for tc in result["tool_calls"]
                ]

            return LLMResponse(content=response_text, tool_calls=tool_calls)
        except requests.RequestException as e:
            logger.error(f"Ollama generate error: {e}")
            raise

    def embed(self, text: str) -> List[float]:
        """Generate embedding for text using Ollama"""
        payload = {
            "model": self.embed_model,
            "prompt": text,
        }
        try:
            result = self._call_ollama("/api/embeddings", payload)
            return result.get("embedding", [])
        except requests.RequestException as e:
            logger.error(f"Ollama embed error: {e}")
            raise


def get_ollama_provider() -> OllamaProvider:
    return OllamaProvider()
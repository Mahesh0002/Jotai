import abc
from typing import Any, Callable, List, Optional

from pydantic import BaseModel
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from runner.config import settings


class LLMResponse(BaseModel):
    content: str
    tool_calls: Optional[List[Any]] = None


class ToolSpec(BaseModel):
    name: str
    description: str
    parameters_json_schema: dict
    handler: Callable
    requires_confirmation: bool = False


class ToolCall(BaseModel):
    name: str
    args: dict
    id: Optional[str] = None


class BaseLLMProvider(abc.ABC):
    @abc.abstractmethod
    def generate(self, prompt: str, tools: Optional[List[Callable]] = None) -> LLMResponse:
        raise NotImplementedError

    @abc.abstractmethod
    def embed(self, text: str) -> List[float]:
        raise NotImplementedError


def is_rate_limit_error(exception: Exception) -> bool:
    """True only for HTTP 429. Never retries 400/401/403/5xx."""
    code = getattr(exception, "code", None)
    if code is None:
        code = getattr(exception, "status_code", None)
    try:
        if int(code) == 429:
            return True
    except (TypeError, ValueError):
        pass
    return "429" in str(exception)


class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        # Lazy import to avoid requiring google-genai in strict mode
        from google import genai
        from google.genai import types

        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = settings.GEMINI_MODEL
        self._types = types

    @retry(
        retry=retry_if_exception(is_rate_limit_error),
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=60),
        reraise=True,
    )
    def _call_gemini_with_retry(self, prompt: str, config: Any) -> Any:
        return self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=config,
        )

    def generate(self, prompt: str, tools: Optional[List[Callable]] = None) -> LLMResponse:
        config = self._types.GenerateContentConfig(temperature=0.7)
        if tools:
            config.tools = tools
            config.automatic_function_calling = self._types.AutomaticFunctionCallingConfig(disable=True)

        response = self._call_gemini_with_retry(prompt, config)

        if response.function_calls:
            return LLMResponse(
                content=response.text or "",
                tool_calls=response.function_calls,
            )
        return LLMResponse(content=response.text or "")

    def embed(self, text: str) -> List[float]:
        # Gemini embeddings not implemented for local-only mode
        raise NotImplementedError("Gemini embeddings not available in local mode")


class StubProvider(BaseLLMProvider):
    """Deterministic provider for tests and local development.

    Set ``StubProvider.responses`` to a list of scripted strings; each
    ``generate`` call pops one. When empty, classifier prompts return
    ``UNKNOWN`` and all other prompts return a fixed sentence.
    """

    responses: List[str] = []
    calls: List[str] = []

    @classmethod
    def set_responses(cls, responses: List[str]) -> None:
        cls.responses = list(responses)
        cls.calls = []

    @classmethod
    def reset(cls) -> None:
        cls.responses = []
        cls.calls = []

    def generate(self, prompt: str, tools: Optional[List[Callable]] = None) -> LLMResponse:
        type(self).calls.append(prompt)
        if type(self).responses:
            return LLMResponse(content=type(self).responses.pop(0))
        if "classify" in prompt.lower():
            return LLMResponse(content="UNKNOWN")
        return LLMResponse(content="[Stub Provider] No live model configured.")

    def embed(self, text: str) -> List[float]:
        # Return a dummy embedding for tests
        return [0.0] * 768


def get_llm_provider() -> BaseLLMProvider:
    if settings.LLM_PROVIDER == "gemini":
        if settings.PRIVACY_MODE == "strict":
            raise RuntimeError("Gemini provider disabled in PRIVACY_MODE=strict")
        return GeminiProvider()
    if settings.LLM_PROVIDER == "ollama":
        from runner.services.ollama_provider import get_ollama_provider
        return get_ollama_provider()
    if settings.LLM_PROVIDER == "stub":
        return StubProvider()
    raise NotImplementedError(f"Provider {settings.LLM_PROVIDER} not implemented")
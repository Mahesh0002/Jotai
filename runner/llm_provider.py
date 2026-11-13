import abc
import json
from typing import List, Callable, Any, Optional
from pydantic import BaseModel
from google import genai
from google.genai import types
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential
from google.genai.errors import APIError

from config import settings

class LLMResponse(BaseModel):
    content: str
    tool_calls: Optional[List[Any]] = None

class BaseLLMProvider(abc.ABC):
    @abc.abstractmethod
    def generate(self, prompt: str, tools: Optional[List[Callable]] = None) -> LLMResponse:
        pass

def is_rate_limit_error(exception: Exception) -> bool:
    if isinstance(exception, APIError):
        # APIError has a code attribute or check string representation for 429
        return exception.code == 429 or "429" in str(exception)
    return False

class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = settings.GEMINI_MODEL

    @retry(
        retry=retry_if_exception(is_rate_limit_error),
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=60),
        reraise=True
    )
    def _call_gemini_with_retry(self, prompt: str, config: types.GenerateContentConfig) -> Any:
        return self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=config
        )

    def generate(self, prompt: str, tools: Optional[List[Callable]] = None) -> LLMResponse:
        config = types.GenerateContentConfig(
            temperature=0.7,
        )
        if tools:
            config.tools = tools
            config.automatic_function_calling = types.AutomaticFunctionCallingConfig(disable=True)

        response = self._call_gemini_with_retry(prompt, config)
        
        # Check if response has function calls
        if response.function_calls:
            # We wrap the function calls just to return them cleanly if needed,
            # though in genai SDK, function calling usually involves a chat loop.
            # For simplicity in this architecture, we return the content if any, 
            # and the raw tool calls to let the agent handle it.
            return LLMResponse(
                content=response.text if response.text else "",
                tool_calls=response.function_calls
            )
            
        return LLMResponse(content=response.text or "")

class StubProvider(BaseLLMProvider):
    def generate(self, prompt: str, tools: Optional[List[Callable]] = None) -> LLMResponse:
        return LLMResponse(content="[Stub Provider] Output generated successfully.")

def get_llm_provider() -> BaseLLMProvider:
    if settings.LLM_PROVIDER == "gemini":
        return GeminiProvider()
    elif settings.LLM_PROVIDER == "stub":
        return StubProvider()
    else:
        raise NotImplementedError(f"Provider {settings.LLM_PROVIDER} not implemented")

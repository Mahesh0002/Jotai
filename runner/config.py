import os

from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()


class Config(BaseModel):
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "stub").lower()
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    NODE_API_URL: str = os.getenv("NODE_API_URL", "http://localhost:5000/api/v1")
    RUNNER_SERVICE_TOKEN: str = os.getenv("RUNNER_SERVICE_TOKEN", "")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    CHAT_HISTORY_TURNS: int = int(os.getenv("CHAT_HISTORY_TURNS", "6"))
    PENDING_ACTION_TTL_SECONDS: int = int(os.getenv("PENDING_ACTION_TTL_SECONDS", "600"))


settings = Config()

HEADERS = {
    "Authorization": f"Bearer {settings.RUNNER_SERVICE_TOKEN}",
    "Content-Type": "application/json",
}

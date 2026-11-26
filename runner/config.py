import os
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()


class Config(BaseModel):
    # LLM settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama").lower()
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
    OLLAMA_CHAT_MODEL: str = os.getenv("OLLAMA_CHAT_MODEL", "qwen2.5:1.5b-instruct-q4_k_m")
    OLLAMA_EMBED_MODEL: str = os.getenv("OLLAMA_EMBED_MODEL", "all-minilm:l6-v2")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    # Node API connection
    NODE_API_URL: str = os.getenv("NODE_API_URL", "http://127.0.0.1:5000/api/v1")
    RUNNER_SERVICE_TOKEN: str = os.getenv("RUNNER_SERVICE_TOKEN", "")
    RUNNER_USER_ID: str = os.getenv("RUNNER_USER_ID", "local_user")

    # Privacy
    PRIVACY_MODE: str = os.getenv("PRIVACY_MODE", "strict")

    # Agent settings
    AGENT_MAX_STEPS: int = int(os.getenv("AGENT_MAX_STEPS", "6"))
    CHAT_HISTORY_TURNS: int = int(os.getenv("CHAT_HISTORY_TURNS", "6"))
    CHAT_MAX_SESSIONS: int = int(os.getenv("CHAT_MAX_SESSIONS", "100"))
    CHAT_SESSION_TTL_SECONDS: int = int(os.getenv("CHAT_SESSION_TTL_SECONDS", "3600"))
    MAX_MESSAGES: int = int(os.getenv("MAX_MESSAGES", "200"))
    PENDING_ACTION_TTL_SECONDS: int = int(os.getenv("PENDING_ACTION_TTL_SECONDS", "600"))

    # Knowledge index
    INDEX_REFRESH_SECONDS: int = int(os.getenv("INDEX_REFRESH_SECONDS", "300"))
    MIN_EMBEDDING_SCORE: float = float(os.getenv("MIN_EMBEDDING_SCORE", "0.25"))

    # Scheduler defaults
    BRIEFING_TIME: str = os.getenv("BRIEFING_TIME", "07:00")
    WORKOUT_TIME: str = os.getenv("WORKOUT_TIME", "17:00")


settings = Config()

HEADERS = {
    "Authorization": f"Bearer {settings.RUNNER_SERVICE_TOKEN}",
    "Content-Type": "application/json",
}
if settings.RUNNER_USER_ID:
    HEADERS["x-jotai-user-id"] = settings.RUNNER_USER_ID
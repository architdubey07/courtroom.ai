import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load .env file from the backend directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY") or None
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY") or None
    OPENAI_BASE_URL: Optional[str] = os.getenv("OPENAI_BASE_URL") or None
    LLM_MODEL: Optional[str] = os.getenv("LLM_MODEL") or None
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    @property
    def provider(self) -> Optional[str]:
        if self.GEMINI_API_KEY and self.GEMINI_API_KEY.strip():
            return "gemini"
        if self.OPENAI_API_KEY and self.OPENAI_API_KEY.strip():
            return "openai"
        return None

    @property
    def default_model(self) -> str:
        if self.LLM_MODEL and self.LLM_MODEL.strip():
            return self.LLM_MODEL.strip()
        if self.provider == "gemini":
            return "gemini-2.5-flash"
        return "gpt-4o-mini"

settings = Settings()

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load .env file from the backend directory, override so that re-loading reflects fresh values.
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


class Settings:
    """
    Application settings loaded from environment variables.

    Uses __init__ rather than class-level attributes so that os.getenv() is
    evaluated at instantiation time (after dotenv has loaded), not at class
    body parse-time. This prevents the 'frozen attribute' problem where changes
    to os.environ after the class definition are silently ignored.
    """

    def __init__(self):
        self.GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY") or None
        self.OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY") or None
        self.OPENAI_BASE_URL: Optional[str] = os.getenv("OPENAI_BASE_URL") or None
        self.LLM_MODEL: Optional[str] = os.getenv("LLM_MODEL") or None
        self.HOST: str = os.getenv("HOST", "0.0.0.0")
        self.PORT: int = int(os.getenv("PORT", "8000"))

    @property
    def provider(self) -> Optional[str]:
        """
        Returns the active LLM provider name, preferring Gemini when both keys
        are configured.
        """
        if self.GEMINI_API_KEY and self.GEMINI_API_KEY.strip():
            return "gemini"
        if self.OPENAI_API_KEY and self.OPENAI_API_KEY.strip():
            return "openai"
        return None

    @property
    def default_model(self) -> str:
        """
        Returns the configured model, or the sensible default for the active provider.
        Updated default for Gemini: gemini-3.8-flash (gemini-2.5-flash no longer
        available to new API keys as of October 2026).
        """
        if self.LLM_MODEL and self.LLM_MODEL.strip():
            return self.LLM_MODEL.strip()
        if self.provider == "gemini":
            return "gemini-3.8-flash"
        return "gpt-4o-mini"


settings = Settings()

"""
Application configuration loaded from environment variables.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # Google Gemini
    google_api_key: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""

    # App
    app_name: str = "RADIX Talent Match"
    debug: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()

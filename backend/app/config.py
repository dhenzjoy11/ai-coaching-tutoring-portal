from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "AI Coaching & Tutoring Portal"
    database_url: str = "sqlite:///./coaching_portal.db"
    secret_key: str = "change-this-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    anthropic_api_key: str = ""
    openai_api_key: str = ""  # for Whisper voice transcription

    class Config:
        env_file = ".env"


@lru_cache
def get_settings():
    return Settings()

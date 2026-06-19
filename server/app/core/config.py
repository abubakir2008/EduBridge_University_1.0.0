from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

# Placeholder values that must never reach a running (especially production) instance.
_INSECURE_SECRETS = {
    "",
    "change-me-to-a-very-long-random-secret",
    "changeme",
    "secret",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Environment: "production" enforces strict secret + cookie checks
    ENV: str = "development"

    # Database — no real credentials baked into source; must come from env in prod
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/edubridge"

    # JWT
    JWT_SECRET: str = ""
    JWT_ACCESS_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_EXPIRE_DAYS: int = 14

    # Auth cookies (httpOnly). Secure must be True in production (HTTPS).
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: str = ""

    # MinIO
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_PUBLIC_URL: str = "http://localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_SECURE: bool = False

    # SMTP
    SMTP_HOST: str = "smtp.sendgrid.net"
    SMTP_PORT: int = 587
    SMTP_USER: str = "apikey"
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "no-reply@edubridge.com"

    # Groq AI
    GROQ_API_KEY: str = ""

    # Resemble.ai TTS (основной голос Барашка). Если ключ задан — используется первым.
    RESEMBLE_API_KEY: str = ""
    RESEMBLE_VOICE_ID: str = ""          # женский — Varvara (voice_uuid)
    RESEMBLE_VOICE_ID_MALE: str = ""     # мужской — Михаил (voice_uuid)
    RESEMBLE_SAMPLE_RATE: str = "44100"

    # ElevenLabs TTS (голос Барашка). Если ключ пуст — фронт откатывается на браузерный голос.
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "cgSgspJ2msm6clMCkdW9"          # женский — Jessica (Playful, Warm)
    ELEVENLABS_VOICE_ID_MALE: str = "pNInz6obpgDQGcFmaJgB"     # мужской — Adam
    ELEVENLABS_MODEL: str = "eleven_multilingual_v2"

    # Edge TTS (Microsoft) — бесплатная озвучка, русские нейроголоса, без ключа. Основной провайдер.
    EDGE_TTS_ENABLED: bool = True
    EDGE_TTS_VOICE: str = "ru-RU-SvetlanaNeural"        # женский
    EDGE_TTS_VOICE_MALE: str = "ru-RU-DmitryNeural"     # мужской

    # OpenAI TTS (если задан ключ). Голоса: nova/shimmer (жен), onyx/echo (муж).
    OPENAI_API_KEY: str = ""
    OPENAI_TTS_MODEL: str = "tts-1"
    OPENAI_TTS_VOICE: str = "nova"
    OPENAI_TTS_VOICE_MALE: str = "onyx"

    # Groq Whisper (распознавание речи — работает во всех браузерах)
    GROQ_STT_MODEL: str = "whisper-large-v3-turbo"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() in ("production", "prod")

    @model_validator(mode="after")
    def _validate_secrets(self) -> "Settings":
        # Fail fast: never start with a missing/placeholder JWT secret.
        if self.JWT_SECRET in _INSECURE_SECRETS or len(self.JWT_SECRET) < 32:
            raise ValueError(
                "JWT_SECRET is missing, too short, or uses a known placeholder. "
                "Set a strong random JWT_SECRET (>= 32 chars) in the environment."
            )
        if self.is_production:
            if not self.COOKIE_SECURE:
                raise ValueError("COOKIE_SECURE must be true in production (HTTPS).")
            if self.MINIO_SECRET_KEY in ("", "minioadmin"):
                raise ValueError("Default MinIO credentials are not allowed in production.")
        return self

    def get_cors_origins(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()

MINIO_BUCKETS = ["lessons", "cases", "universities", "documents"]

"""
Application configuration using Pydantic BaseSettings.
Loads values from environment variables or `.env` file.
"""

from __future__ import annotations

import os
from pathlib import Path

from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────
    # Ensure three slashes for absolute path on windows: sqlite+aiosqlite:///C:\...
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR.as_posix()}/deepguard.db"

    # ── JWT / Auth ────────────────────────────────────────────────────────
    SECRET_KEY: str = "dev-secret-change-me"
    JWT_SECRET_KEY: str = "jwt-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── ML Models ─────────────────────────────────────────────────────────
    MODEL_WEIGHTS_DIR: str = str(BASE_DIR / "ml" / "weights")
    DEFAULT_MODEL: str = "cnn"

    # ── Upload ────────────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 500
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")

    # ── ECG Params ────────────────────────────────────────────────────────
    ECG_SAMPLE_RATE: int = 360  # Hz (MIT-BIH default)
    ECG_SEGMENT_LENGTH: int = 1000  # samples per segment

    # ── Class labels ──────────────────────────────────────────────────────
    ECG_CLASSES: list[str] = [
        "Normal",
        "Arrhythmia",
        "Atrial Fibrillation",
        "Myocardial Infarction",
        "Tachycardia",
        "Bradycardia",
    ]

    # ── Chatbot ──────────────────────────────────────────────────────────
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile" # Updated to a modern supported Groq model
    VECTOR_DB_DIR: str = str(BASE_DIR / "dbVector")
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_EMBED_MODEL: str = "nomic-embed-text"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.MODEL_WEIGHTS_DIR, exist_ok=True)

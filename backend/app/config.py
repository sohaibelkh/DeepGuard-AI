import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///deepguard.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Global request size limit (in bytes) – protects against oversized uploads.
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500 MB

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_TYPE = "Bearer"


__all__ = ["Config"]


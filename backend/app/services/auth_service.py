from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
)

from ..extensions import db
from ..models.user import User


@dataclass
class AuthResult:
    user: User
    access_token: str
    refresh_token: str


class AuthService:
    @staticmethod
    def register_user(full_name: str, email: str, password: str) -> AuthResult:
        existing = User.query.filter(User.email == email).first()
        if existing:
            raise ValueError("An account with this email is already registered.")

        user = User(full_name=full_name, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        return AuthService._generate_tokens(user)

    @staticmethod
    def authenticate_user(identifier: str, password: str) -> Optional[AuthResult]:
        user = User.query.filter(User.email == identifier.strip().lower()).first()
        if not user or not user.check_password(password):
            return None

        return AuthService._generate_tokens(user)

    @staticmethod
    def _generate_tokens(user: User) -> AuthResult:
        identity = str(user.id)
        access = create_access_token(identity=identity)
        refresh = create_refresh_token(identity=identity)
        return AuthResult(user=user, access_token=access, refresh_token=refresh)


__all__ = ["AuthService", "AuthResult"]

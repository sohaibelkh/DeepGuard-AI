"""
Authentication routes — register, login, refresh, me.
Maintains the same API contract the React frontend expects.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import create_access_token, create_refresh_token, decode_token, get_current_user
from database import get_db
from models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ── Request / Response schemas ────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    identifier: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    user: dict
    access_token: str
    refresh_token: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=AuthResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    full_name = body.full_name.strip()
    email = body.email.strip().lower()
    password = body.password

    if not full_name or not email or not password:
        raise HTTPException(status_code=400, detail="full_name, email and password are required")

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    user = User(full_name=full_name, email=email)
    user.set_password(password)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "user": user.to_safe_dict(),
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
    }


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with email + password."""
    identifier = body.identifier.strip().lower()
    password = body.password

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="identifier and password are required")

    result = await db.execute(select(User).where(User.email == identifier))
    user = result.scalar_one_or_none()

    if not user or not user.check_password(password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "user": user.to_safe_dict(),
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
    }


@router.post("/refresh")
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a refresh token for a new access + refresh pair."""
    user_id = decode_token(body.refresh_token, expected_type="refresh")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {
        "user": user.to_safe_dict(),
        "access_token": create_access_token(user_id),
        "refresh_token": create_refresh_token(user_id),
    }


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return {"user": user.to_safe_dict()}

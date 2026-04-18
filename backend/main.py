"""
DeepGuard-AI / ECG Cardiac AI — FastAPI Application Entry Point
=================================================================
Main application with CORS, lifespan events for DB initialization
and model loading, and route registration.

Run with:  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_tables
from routes.chat import get_vector_db

# ── Rate Limiting ─────────────────────────────────────────────────────────────
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown events."""
    # ── Startup ───────────────────────────────────────────────────────────
    await create_tables()
    print("✓ Database tables created")
    
    # Initialize Vector DB for Chatbot (PDF processing)
    try:
        get_vector_db()
        print("✓ Vector DB initialized for AI Assistant")
    except Exception as e:
        print(f"⚠ Warning: Could not initialize Vector DB: {e}")
        
    print(f"✓ Default model: {settings.DEFAULT_MODEL}")
    print("✓ ECG Cardiac AI backend ready")
    yield
    # ── Shutdown ──────────────────────────────────────────────────────────
    print("Shutting down ECG Cardiac AI backend…")


app = FastAPI(
    title="ECG Cardiac AI",
    description="Intelligent ECG-based cardiac diagnosis platform with multi-model ML pipeline.",
    version="2.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routes ───────────────────────────────────────────────────────────
from routes.auth import router as auth_router
from routes.ecg import router as ecg_router
from routes.models import router as models_router
from routes.streaming import router as streaming_router
from routes.chat import router as chat_router

app.include_router(auth_router)
app.include_router(ecg_router)
app.include_router(models_router)
app.include_router(streaming_router)
app.include_router(chat_router)


@app.get("/")
async def root():
    return {
        "name": "ECG Cardiac AI",
        "version": "2.0.0",
        "description": "Intelligent ECG-based cardiac diagnosis platform",
        "endpoints": {
            "auth": "/api/auth/",
            "ecg": "/api/",
            "models": "/api/models/",
            "streaming": "/api/ws/ecg-stream",
            "docs": "/docs",
        },
    }

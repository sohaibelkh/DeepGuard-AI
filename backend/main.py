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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown events."""
    # ── Startup ───────────────────────────────────────────────────────────
    await create_tables()
    print("✓ Database tables created")
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

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routes ───────────────────────────────────────────────────────────
from routes.auth import router as auth_router
from routes.ecg import router as ecg_router
from routes.models import router as models_router
from routes.streaming import router as streaming_router

app.include_router(auth_router)
app.include_router(ecg_router)
app.include_router(models_router)
app.include_router(streaming_router)


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

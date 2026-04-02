"""
ECG Routes — upload, predict, explain, history, analytics.
"""

from __future__ import annotations

import json
import os
import time
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Union
from http import HTTPStatus

import numpy as np
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from config import settings
from database import get_db
from models.ecg_record import ECGRecord
from models.user import User
from ml.model_registry import model_registry
from ml.explainability import explain_prediction
from ml.recommender import get_recommendations

router = APIRouter(prefix="/api", tags=["ecg"])

ALLOWED_EXTENSIONS = {".csv", ".txt"}


def _parse_ecg_file(content: str) -> list[float]:
    """Parse ECG file content (CSV/TXT) into a list of float values."""
    values: list[float] = []
    lines = content.strip().split("\n")
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.replace(",", " ").replace(";", " ").replace("\t", " ").split()
        for part in parts:
            try:
                values.append(float(part))
            except ValueError:
                continue
    return values


# ── POST /api/upload-ecg ──────────────────────────────────────────────────────

@router.post("/upload-ecg")
async def upload_ecg(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload an ECG file (.csv or .txt), parse it, and store the raw signal."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    ext = os.path.splitext(file.filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use .csv or .txt.")

    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    values = _parse_ecg_file(text)

    if len(values) < 10:
        raise HTTPException(status_code=400, detail="File contains too few data points.")

    record = ECGRecord(
        user_id=user.id,
        file_name=file.filename,
        raw_signal=json.dumps(values),
        signal_length=len(values),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return {
        "id": record.id,
        "file_name": record.file_name,
        "signal_length": record.signal_length,
        "created_at": record.created_at.isoformat(),
        "message": "ECG file uploaded successfully.",
    }


# ── POST /api/predict ─────────────────────────────────────────────────────────

@router.post("/predict")
async def predict(
    record_id: Optional[int] = Query(None, description="ECG record ID to predict"),
    model_name: Optional[str] = Query(None, description="Model to use"),
    file: UploadFile = File(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Run prediction on an uploaded ECG record or a new file upload.
    If record_id is provided, predict from stored signal.
    If file is provided, upload + predict in one step.
    """
    model = model_name or settings.DEFAULT_MODEL

    if record_id:
        # Load from database
        result = await db.execute(
            select(ECGRecord).where(ECGRecord.id == record_id, ECGRecord.user_id == user.id)
        )
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail="ECG record not found.")
        if not record.raw_signal:
            raise HTTPException(status_code=400, detail="No signal data in this record.")
        signal = np.array(json.loads(record.raw_signal), dtype=np.float64)
    elif file and file.filename:
        # Upload + predict in one step
        ext = os.path.splitext(file.filename.lower())[1]
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Unsupported file type.")
        content = await file.read()
        text = content.decode("utf-8", errors="ignore")
        values = _parse_ecg_file(text)
        if len(values) < 10:
            raise HTTPException(status_code=400, detail="File contains too few data points.")
        signal = np.array(values, dtype=np.float64)

        record = ECGRecord(
            user_id=user.id,
            file_name=file.filename,
            raw_signal=json.dumps(values),
            signal_length=len(values),
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)
    else:
        raise HTTPException(status_code=400, detail="Provide either record_id or a file.")

    # Run prediction
    pred_result = model_registry.predict(model, signal)

    # Get recommendations
    recommendations = get_recommendations(pred_result["prediction"], pred_result["confidence"])

    # Update record with prediction
    record.prediction = pred_result["prediction"]
    record.confidence = pred_result["confidence"]
    record.reliability_score = pred_result.get("reliability_score")
    record.is_reliable = 1 if pred_result.get("is_reliable") else 0
    record.model_used = pred_result["model_used"]
    record.processing_time_ms = pred_result["processing_time_ms"]
    record.class_probabilities = json.dumps(pred_result["class_probabilities"])
    record.recommendations = json.dumps(recommendations)
    await db.commit()

    return {
        "id": record.id,
        "prediction": pred_result["prediction"],
        "confidence": pred_result["confidence"],
        "reliability_score": pred_result.get("reliability_score"),
        "is_reliable": pred_result.get("is_reliable"),
        "class_probabilities": pred_result["class_probabilities"],
        "model_used": pred_result["model_used"],
        "processing_time_ms": pred_result["processing_time_ms"],
        "recommendations": recommendations,
        "created_at": record.created_at.isoformat(),
    }


# ── POST /api/analysis (backward-compatible with existing frontend) ───────────

@router.post("/analysis")
async def analysis_compat(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Backward-compatible endpoint: upload + predict using default model.
    Matches the contract expected by the existing DetectionPage.tsx.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    ext = os.path.splitext(file.filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use .csv or .txt.")

    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    values = _parse_ecg_file(text)

    if len(values) < 10:
        raise HTTPException(status_code=400, detail="File contains too few data points.")

    signal = np.array(values, dtype=np.float64)

    # Run prediction with default model
    pred_result = model_registry.predict(settings.DEFAULT_MODEL, signal)
    recommendations = get_recommendations(pred_result["prediction"], pred_result["confidence"])

    # Store record
    record = ECGRecord(
        user_id=user.id,
        file_name=file.filename,
        raw_signal=json.dumps(values),
        signal_length=len(values),
        prediction=pred_result["prediction"],
        confidence=pred_result["confidence"],
        model_used=pred_result["model_used"],
        processing_time_ms=pred_result["processing_time_ms"],
        class_probabilities=json.dumps(pred_result["class_probabilities"]),
        recommendations=json.dumps(recommendations),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return {
        "prediction": pred_result["prediction"],
        "confidence": pred_result["confidence"],
        "reliability_score": pred_result.get("reliability_score"),
        "is_reliable": pred_result.get("is_reliable"),
        "id": record.id,
        "created_at": record.created_at.isoformat(),
    }


# ── GET /api/explain/{record_id} ──────────────────────────────────────────────

@router.get("/explain/{record_id}")
async def explain(
    record_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return explainability data for a past prediction."""
    result = await db.execute(
        select(ECGRecord).where(ECGRecord.id == record_id, ECGRecord.user_id == user.id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="ECG record not found.")
    if not record.raw_signal or not record.prediction:
        raise HTTPException(status_code=400, detail="No prediction for this record. Run /predict first.")

    signal = np.array(json.loads(record.raw_signal), dtype=np.float64)
    model_name = record.model_used or settings.DEFAULT_MODEL

    explanation = explain_prediction(signal, model_name)

    return {
        "record_id": record.id,
        "prediction": record.prediction,
        "confidence": record.confidence,
        "model_used": model_name,
        "explanation": explanation,
    }


# ── GET /api/history ──────────────────────────────────────────────────────────

@router.get("/history/analyses")
async def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    prediction: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return paginated ECG analysis history for the current user."""
    query = select(ECGRecord).where(ECGRecord.user_id == user.id)

    if prediction:
        query = query.where(ECGRecord.prediction == prediction)

    # Count total
    count_query = select(func.count()).select_from(ECGRecord).where(ECGRecord.user_id == user.id)
    if prediction:
        count_query = count_query.where(ECGRecord.prediction == prediction)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    query = query.order_by(ECGRecord.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    records = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": [r.to_dict() for r in records],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }


# ── GET /api/analytics/summary ───────────────────────────────────────────────

@router.get("/analytics/summary")
async def analytics_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return analytics for the dashboard.
    Compatible with the existing DashboardHome.tsx component.
    """
    # Total analyses
    count_res = await db.execute(
        select(func.count()).select_from(ECGRecord).where(ECGRecord.user_id == user.id)
    )
    total_analyses = count_res.scalar() or 0

    # Last analysis
    last_res = await db.execute(
        select(ECGRecord)
        .where(ECGRecord.user_id == user.id)
        .order_by(ECGRecord.created_at.desc())
        .limit(1)
    )
    last_analysis = last_res.scalar_one_or_none()

    # All predictions for aggregation
    preds_res = await db.execute(
        select(ECGRecord.prediction)
        .where(ECGRecord.user_id == user.id, ECGRecord.prediction.isnot(None))
    )
    predictions = [r[0] for r in preds_res.all()]

    most_frequent = max(set(predictions), key=predictions.count) if predictions else None

    # Avg confidence
    avg_res = await db.execute(
        select(func.avg(ECGRecord.confidence))
        .where(ECGRecord.user_id == user.id)
    )
    avg_confidence = float(avg_res.scalar() or 0.0)

    # 7-day trend
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=6)
    trend_res = await db.execute(
        select(ECGRecord)
        .where(ECGRecord.user_id == user.id, ECGRecord.created_at >= start)
        .order_by(ECGRecord.created_at.asc())
    )
    recent_records = trend_res.scalars().all()
    per_day = Counter(r.created_at.date() for r in recent_records)
    trend = []
    for offset in range(7):
        day = (start + timedelta(days=offset)).date()
        trend.append({"label": day.strftime("%b %d"), "analyses": per_day.get(day, 0)})

    # By condition
    by_condition = [{"label": pred, "value": predictions.count(pred)} for pred in set(predictions)]

    # Recent 5
    recent5_res = await db.execute(
        select(ECGRecord)
        .where(ECGRecord.user_id == user.id)
        .order_by(ECGRecord.created_at.desc())
        .limit(5)
    )
    recent5 = recent5_res.scalars().all()

    return {
        "totals": {
            "total_analyses": total_analyses,
            "last_diagnosis": last_analysis.prediction if last_analysis else None,
            "last_diagnosis_at": last_analysis.created_at.isoformat() if last_analysis else None,
            "model_accuracy": 0.952,  # Best model (hybrid) accuracy
            "most_frequent_condition": most_frequent or "—",
            "avg_confidence": round(avg_confidence, 4),
        },
        "by_condition": by_condition,
        "trend": trend,
        "recent": [r.to_dict() for r in recent5],
    }

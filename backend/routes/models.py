"""
Model Management Routes — list models, get performance metrics.
"""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.model_metrics import ModelMetrics
from models.user import User
from models.ecg_record import ECGRecord
from ml.model_registry import model_registry
from ml.evaluation import generate_demo_metrics
from config import settings
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("/list")
async def list_models(user: User = Depends(get_current_user)):
    """Return list of all available ML models with descriptions."""
    return {"models": model_registry.list_models()}


@router.get("/performance")
async def model_performance(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return evaluation metrics for all models.
    If no metrics exist in DB yet, generates demo metrics and stores them.
    """
    result = await db.execute(select(ModelMetrics))
    existing = result.scalars().all()

    models_list = []
    if existing:
        models_list = [m.to_dict() for m in existing]
    else:
        # No metrics in DB — seed with demo data
        demo = generate_demo_metrics()
        for name, data in demo.items():
            metrics = ModelMetrics(
                model_name=data["model_name"],
                display_name=data["display_name"],
                model_type=data["model_type"],
                accuracy=data["accuracy"],
                precision=data["precision"],
                recall=data["recall"],
                f1_score=data["f1_score"],
                confusion_matrix=data["confusion_matrix"],
                roc_data=data["roc_data"],
                per_class_metrics=data["per_class_metrics"],
                training_samples=data["training_samples"],
                test_samples=data["test_samples"],
            )
            db.add(metrics)
            models_list.append(data)
        await db.commit()

    # Dynamic Overrides:
    # Extract Ground Truth records and re-calculate dynamically where verified data exists
    verified_res = await db.execute(select(ECGRecord).where(ECGRecord.true_diagnosis.is_not(None)))
    verified_records = verified_res.scalars().all()
    
    model_records = {}
    for r in verified_records:
        m = r.model_used
        if not m: continue
        if m not in model_records:
            model_records[m] = {"y_true": [], "y_pred": []}
        model_records[m]["y_true"].append(r.true_diagnosis)
        model_records[m]["y_pred"].append(r.prediction)
        
    classes = settings.ECG_CLASSES
    for i, m_data in enumerate(models_list):
        m_name = m_data["model_name"]
        if m_name in model_records and len(model_records[m_name]["y_true"]) > 0:
            y_true = model_records[m_name]["y_true"]
            y_pred = model_records[m_name]["y_pred"]
            
            acc = float(accuracy_score(y_true, y_pred))
            prec, rec, f1, _ = precision_recall_fscore_support(y_true, y_pred, labels=classes, average="weighted", zero_division=0)
            cm = confusion_matrix(y_true, y_pred, labels=classes)
            
            # Blend dynamic data in memory without permanently overwriting DB benchmarks
            models_list[i]["accuracy"] = acc
            models_list[i]["precision"] = float(prec)
            models_list[i]["recall"] = float(rec)
            models_list[i]["f1_score"] = float(f1)
            models_list[i]["confusion_matrix"] = json.dumps(cm.tolist())
            models_list[i]["test_samples"] = len(y_true)

    return {"models": models_list}


@router.get("/performance/{model_name}")
async def single_model_performance(
    model_name: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get performance metrics for a single model with dynamic verified blending."""
    result = await db.execute(select(ModelMetrics).where(ModelMetrics.model_name == model_name))
    metrics = result.scalar_one_or_none()

    if not metrics:
        raise HTTPException(status_code=404, detail=f"No metrics found for model: {model_name}")

    m_data = metrics.to_dict()
    
    # Dynamic blending
    verified_res = await db.execute(select(ECGRecord).where(ECGRecord.model_used == model_name, ECGRecord.true_diagnosis.is_not(None)))
    verified_records = verified_res.scalars().all()
    
    if verified_records:
        y_true = [r.true_diagnosis for r in verified_records]
        y_pred = [r.prediction for r in verified_records]
        classes = settings.ECG_CLASSES
        m_data["accuracy"] = float(accuracy_score(y_true, y_pred))
        prec, rec, f1, _ = precision_recall_fscore_support(y_true, y_pred, labels=classes, average="weighted", zero_division=0)
        m_data["precision"] = float(prec)
        m_data["recall"] = float(rec)
        m_data["f1_score"] = float(f1)
        m_data["confusion_matrix"] = json.dumps(confusion_matrix(y_true, y_pred, labels=classes).tolist())
        m_data["test_samples"] = len(y_true)

    return m_data

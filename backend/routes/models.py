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
from ml.model_registry import model_registry
from ml.evaluation import generate_demo_metrics

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

    if existing:
        return {"models": [m.to_dict() for m in existing]}

    # No metrics in DB — seed with demo data
    demo = generate_demo_metrics()
    models_list = []
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

    return {"models": models_list}


@router.get("/performance/{model_name}")
async def single_model_performance(
    model_name: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get performance metrics for a single model."""
    result = await db.execute(
        select(ModelMetrics).where(ModelMetrics.model_name == model_name)
    )
    metrics = result.scalar_one_or_none()

    if not metrics:
        raise HTTPException(status_code=404, detail=f"No metrics found for model: {model_name}")

    return metrics.to_dict()

"""
ModelMetrics ORM model – stores evaluation results for each ML model.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Integer, Float, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class ModelMetrics(Base):
    __tablename__ = "model_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    model_name: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    model_type: Mapped[str] = mapped_column(String(32), nullable=False)  # "classical" or "deep_learning"

    # Core metrics (weighted averages)
    accuracy: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    precision: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    recall: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    f1_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # JSON-serialized detailed data
    confusion_matrix: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON 2D array
    roc_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON [{fpr, tpr}, ...]
    per_class_metrics: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON per-class P/R/F1

    training_samples: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    test_samples: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "model_name": self.model_name,
            "display_name": self.display_name,
            "model_type": self.model_type,
            "accuracy": self.accuracy,
            "precision": self.precision,
            "recall": self.recall,
            "f1_score": self.f1_score,
            "confusion_matrix": self.confusion_matrix,
            "roc_data": self.roc_data,
            "per_class_metrics": self.per_class_metrics,
            "training_samples": self.training_samples,
            "test_samples": self.test_samples,
            "updated_at": self.updated_at.isoformat(),
        }

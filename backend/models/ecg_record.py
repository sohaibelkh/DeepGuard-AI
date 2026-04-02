"""
ECGRecord ORM model – stores uploaded ECG files, predictions, and metadata.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Integer, Float, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class ECGRecord(Base):
    __tablename__ = "ecg_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Raw signal stored as JSON array string for retrieval / streaming
    raw_signal: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    signal_length: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Prediction results
    prediction: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    model_used: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    processing_time_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reliability_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_reliable: Mapped[Optional[bool]] = mapped_column(Integer, nullable=True) # SQLite uses Integer for bool

    # Per-class probabilities stored as JSON string: {"Normal": 0.85, ...}
    class_probabilities: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Recommendations stored as JSON string
    recommendations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "file_name": self.file_name,
            "signal_length": self.signal_length,
            "prediction": self.prediction,
            "confidence": self.confidence,
            "reliability_score": self.reliability_score,
            "is_reliable": bool(self.is_reliable) if self.is_reliable is not None else None,
            "model_used": self.model_used,
            "processing_time_ms": self.processing_time_ms,
            "class_probabilities": self.class_probabilities,
            "recommendations": self.recommendations,
            "created_at": self.created_at.isoformat(),
        }

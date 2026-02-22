from __future__ import annotations

from datetime import datetime, timezone

from ..extensions import db


class Scan(db.Model):
    __tablename__ = "scans"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    file_type = db.Column(db.String(16), nullable=False)  # "image" or "video"
    prediction = db.Column(db.String(8), nullable=False)  # "Real" or "Fake"
    confidence = db.Column(db.Float, nullable=False)  # 0–1 probability
    processing_time = db.Column(db.Float, nullable=False)  # milliseconds
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "file_type": self.file_type,
            "prediction": self.prediction,
            "confidence": self.confidence,
            "processing_time": self.processing_time,
            "created_at": self.created_at.isoformat(),
        }


__all__ = ["Scan"]


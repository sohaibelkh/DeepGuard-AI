from __future__ import annotations

from datetime import datetime, timezone

from ..extensions import db


class Analysis(db.Model):
    __tablename__ = "analyses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    file_name = db.Column(db.String(255), nullable=False)
    prediction = db.Column(db.String(64), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "file_name": self.file_name,
            "prediction": self.prediction,
            "confidence": self.confidence,
            "created_at": self.created_at.isoformat(),
        }


__all__ = ["Analysis"]

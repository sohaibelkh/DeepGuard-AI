from __future__ import annotations

import os
import random
from http import HTTPStatus

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models.analysis import Analysis


analysis_bp = Blueprint("analysis", __name__)

ALLOWED_EXTENSIONS = {".csv", ".txt"}
MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024  # 500 MB
PREDICTION_CLASSES = [
    "Normal",
    "Arrhythmia",
    "Atrial Fibrillation",
    "Myocardial Infarction",
    "Tachycardia",
    "Bradycardia",
]


def _allowed_file(filename: str) -> bool:
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXTENSIONS


def _simulate_prediction() -> tuple[str, float]:
    """Placeholder: return a random prediction until a real model is integrated."""
    pred = random.choice(PREDICTION_CLASSES)
    conf = round(random.uniform(0.85, 0.98), 2)
    return pred, conf


@analysis_bp.post("/analysis")
@jwt_required()
def run_analysis():
    """
    Accept ECG file upload (.csv or .txt), run diagnosis (simulated for now),
    store result and return prediction + confidence.
    """
    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"message": "No file provided."}), HTTPStatus.BAD_REQUEST

    if not _allowed_file(file.filename):
        return jsonify({"message": "Unsupported file type. Use .csv or .txt."}), HTTPStatus.BAD_REQUEST

    file.stream.seek(0, os.SEEK_END)
    size = file.stream.tell()
    file.stream.seek(0)
    if size > MAX_FILE_SIZE_BYTES:
        return (
            jsonify({"message": "File size exceeds allowed limit."}),
            HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
        )

    prediction, confidence = _simulate_prediction()

    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid token identity"}), HTTPStatus.UNPROCESSABLE_ENTITY

    analysis = Analysis(
        user_id=user_id,
        file_name=file.filename,
        prediction=prediction,
        confidence=confidence,
    )
    db.session.add(analysis)
    db.session.commit()

    return (
        jsonify(
            {
                "prediction": prediction,
                "confidence": confidence,
                "id": analysis.id,
                "created_at": analysis.created_at.isoformat(),
            }
        ),
        HTTPStatus.OK,
    )

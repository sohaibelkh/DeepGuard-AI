from __future__ import annotations

import os
import tempfile
import time
from http import HTTPStatus
from typing import Iterable

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from PIL import Image, UnidentifiedImageError

from ..extensions import db
from ..models.scan import Scan
from ..services.image_model_service import image_model_service
from ..services.video_model_service import video_model_service


detection_bp = Blueprint("detection", __name__)


IMAGE_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_EXTENSIONS: set[str] = {".mp4", ".mov", ".avi", ".mkv"}

MAX_IMAGE_SIZE_MB = 25
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024


def _allowed_extension(filename: str, allowed: Iterable[str]) -> bool:
    _, ext = os.path.splitext(filename.lower())
    return ext in allowed


@detection_bp.post("/image")
@jwt_required()
def detect_image():
    """
    Image deepfake detection endpoint.

    Accepts a single image file upload, validates type and size, preprocesses
    to 224x224 with normalization, and returns prediction, confidence, and
    processing time.
    """
    start = time.perf_counter()
    file = request.files.get("file")

    if not file or not file.filename:
        return jsonify({"message": "No image file provided."}), HTTPStatus.BAD_REQUEST

    if not _allowed_extension(file.filename, IMAGE_EXTENSIONS):
        return jsonify({"message": "Unsupported image file type."}), HTTPStatus.BAD_REQUEST

    # Enforce per-image file size limit
    file.stream.seek(0, os.SEEK_END)
    size = file.stream.tell()
    file.stream.seek(0)
    if size > MAX_IMAGE_SIZE_BYTES:
        return (
            jsonify({"message": "Image file size exceeds allowed limit."}),
            HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
        )

    try:
        image = Image.open(file.stream)
    except UnidentifiedImageError:
        return jsonify({"message": "Uploaded file is not a valid image."}), HTTPStatus.BAD_REQUEST

    prediction = image_model_service.predict_image(image)
    total_ms = (time.perf_counter() - start) * 1000.0

    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid token identity"}), HTTPStatus.UNPROCESSABLE_ENTITY
    scan = Scan(
        user_id=user_id,
        file_type="image",
        prediction=prediction.label,
        confidence=prediction.confidence,
        processing_time=total_ms,
    )
    db.session.add(scan)
    db.session.commit()

    return (
        jsonify(
            {
                "prediction": prediction.label,
                "confidence": prediction.confidence,
                "processing_time_ms": total_ms,
            }
        ),
        HTTPStatus.OK,
    )


@detection_bp.post("/video")
@jwt_required()
def detect_video():
    """
    Video deepfake detection endpoint.

    Accepts mp4/mov/avi video uploads, validates type, size, and duration,
    samples frames at a fixed stride, runs each through the CNN classifier,
    and aggregates predictions.
    """
    start = time.perf_counter()
    file = request.files.get("file")

    if not file or not file.filename:
        return jsonify({"message": "No video file provided."}), HTTPStatus.BAD_REQUEST

    _, ext = os.path.splitext(file.filename.lower())
    if ext not in VIDEO_EXTENSIONS:
        return jsonify({"message": "Unsupported video file type."}), HTTPStatus.BAD_REQUEST

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp_path = tmp.name
            file.save(tmp_path)

        prediction = video_model_service.analyze_video(tmp_path)
        total_ms = (time.perf_counter() - start) * 1000.0

        identity = get_jwt_identity()
        try:
            user_id = int(identity)
        except (TypeError, ValueError):
            return jsonify({"message": "Invalid token identity"}), HTTPStatus.UNPROCESSABLE_ENTITY
        scan = Scan(
            user_id=user_id,
            file_type="video",
            prediction=prediction.label,
            confidence=prediction.confidence,
            processing_time=total_ms,
        )
        db.session.add(scan)
        db.session.commit()

        return (
            jsonify(
                {
                    "prediction": prediction.label,
                    "confidence": prediction.confidence,
                    "frames_analyzed": prediction.frames_analyzed,
                    "processing_time_ms": total_ms,
                }
            ),
            HTTPStatus.OK,
        )
    except ValueError as exc:
        return jsonify({"message": str(exc)}), HTTPStatus.BAD_REQUEST
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                # Best-effort cleanup; log in real deployment
                pass


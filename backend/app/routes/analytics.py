from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone
from http import HTTPStatus

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models.analysis import Analysis


analytics_bp = Blueprint("analytics", __name__)

# Mock model accuracy for dashboard display until real metrics are available
MOCK_MODEL_ACCURACY = 0.942


@analytics_bp.get("/summary")
@jwt_required()
def summary():
    """
    Return analytics for the dashboard based on the analyses table.
    Stats are scoped to the current authenticated user.
    """
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid token identity"}), HTTPStatus.UNPROCESSABLE_ENTITY

    base_query = Analysis.query.filter_by(user_id=user_id)

    total_analyses = base_query.count()

    last_analysis = base_query.order_by(Analysis.created_at.desc()).first()
    last_diagnosis = last_analysis.prediction if last_analysis else None
    last_diagnosis_at = last_analysis.created_at.isoformat() if last_analysis else None

    predictions = [a.prediction for a in base_query.all()]
    most_frequent_condition = (
        max(set(predictions), key=predictions.count) if predictions else None
    )

    avg_confidence_val = (
        db.session.query(db.func.avg(Analysis.confidence))
        .filter(Analysis.user_id == user_id)
        .scalar()
        or 0.0
    )

    # 7-day trend for charts
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=6)
    recent = (
        base_query.filter(Analysis.created_at >= start)
        .order_by(Analysis.created_at.asc())
        .all()
    )
    per_day = Counter(a.created_at.date() for a in recent)
    trend = []
    for offset in range(7):
        day = (start + timedelta(days=offset)).date()
        trend.append({"label": day.strftime("%b %d"), "analyses": per_day.get(day, 0)})

    # By condition for pie chart
    by_condition = []
    for pred in set(predictions):
        by_condition.append({"label": pred, "value": predictions.count(pred)})

    # Recent activity (last 5 analyses)
    recent_items = (
        Analysis.query.filter_by(user_id=user_id)
        .order_by(Analysis.created_at.desc())
        .limit(5)
        .all()
    )
    recent = [a.to_dict() for a in recent_items]

    response = {
        "totals": {
            "total_analyses": total_analyses,
            "last_diagnosis": last_diagnosis,
            "last_diagnosis_at": last_diagnosis_at,
            "model_accuracy": MOCK_MODEL_ACCURACY,
            "most_frequent_condition": most_frequent_condition or "—",
            "avg_confidence": float(avg_confidence_val),
        },
        "by_condition": by_condition,
        "trend": trend,
        "recent": recent,
    }

    return jsonify(response), HTTPStatus.OK

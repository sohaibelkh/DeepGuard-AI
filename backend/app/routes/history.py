from __future__ import annotations

from datetime import datetime
from http import HTTPStatus

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models.analysis import Analysis


history_bp = Blueprint("history", __name__)


@history_bp.get("/analyses")
@jwt_required()
def user_analysis_history():
    """
    Return paginated, user-specific ECG analysis history with optional filters.
    """
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid token identity"}), HTTPStatus.UNPROCESSABLE_ENTITY

    query = Analysis.query.filter_by(user_id=user_id)

    prediction = (request.args.get("prediction") or "").strip()
    if prediction:
        query = query.filter(Analysis.prediction == prediction)

    start_str = request.args.get("start")
    end_str = request.args.get("end")
    if start_str:
        try:
            start_dt = datetime.fromisoformat(start_str)
            query = query.filter(Analysis.created_at >= start_dt)
        except ValueError:
            pass
    if end_str:
        try:
            end_dt = datetime.fromisoformat(end_str)
            query = query.filter(Analysis.created_at <= end_dt)
        except ValueError:
            pass

    page = request.args.get("page", default=1, type=int)
    page_size = request.args.get("page_size", default=10, type=int)
    page = max(page, 1)
    page_size = max(1, min(page_size, 50))

    query = query.order_by(Analysis.created_at.desc())
    pagination = query.paginate(page=page, per_page=page_size, error_out=False)

    items = [a.to_dict() for a in pagination.items]

    return (
        jsonify(
            {
                "items": items,
                "page": pagination.page,
                "page_size": pagination.per_page,
                "total": pagination.total,
                "total_pages": pagination.pages,
            }
        ),
        HTTPStatus.OK,
    )

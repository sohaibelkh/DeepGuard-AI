from __future__ import annotations

from http import HTTPStatus

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models.user import User


profile_bp = Blueprint("profile", __name__)


@profile_bp.put("/profile")
@jwt_required()
def update_profile():
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid token identity"}), HTTPStatus.UNPROCESSABLE_ENTITY

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), HTTPStatus.NOT_FOUND

    data = request.get_json() or {}
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()

    if not full_name or not email:
        return (
            jsonify({"message": "full_name and email are required"}),
            HTTPStatus.BAD_REQUEST,
        )

    existing = (
        User.query.filter((User.email == email) & (User.id != user_id)).first()
    )
    if existing:
        return (
            jsonify({"message": "Another account is already using this email."}),
            HTTPStatus.CONFLICT,
        )

    user.full_name = full_name
    user.email = email
    db.session.commit()

    return jsonify({"user": user.to_safe_dict()}), HTTPStatus.OK


@profile_bp.post("/change-password")
@jwt_required()
def change_password():
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid token identity"}), HTTPStatus.UNPROCESSABLE_ENTITY

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), HTTPStatus.NOT_FOUND

    data = request.get_json() or {}
    current = data.get("current_password") or ""
    new = data.get("new_password") or ""

    if not current or not new:
        return (
            jsonify({"message": "current_password and new_password are required"}),
            HTTPStatus.BAD_REQUEST,
        )

    if not user.check_password(current):
        return jsonify({"message": "Current password is incorrect"}), HTTPStatus.BAD_REQUEST

    if len(new) < 8:
        return (
            jsonify({"message": "New password must be at least 8 characters long."}),
            HTTPStatus.BAD_REQUEST,
        )

    user.set_password(new)
    db.session.commit()

    return jsonify({"message": "Password updated successfully."}), HTTPStatus.OK

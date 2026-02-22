from http import HTTPStatus

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
    create_refresh_token,
)

from ..models.user import User
from ..services.auth_service import AuthService

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not full_name or not email or not password:
        return (
            jsonify({"message": "full_name, email and password are required"}),
            HTTPStatus.BAD_REQUEST,
        )

    if "@" not in email:
        return jsonify({"message": "Email address is invalid"}), HTTPStatus.BAD_REQUEST

    try:
        auth_result = AuthService.register_user(
            full_name=full_name, email=email, password=password
        )
    except ValueError as exc:
        return jsonify({"message": str(exc)}), HTTPStatus.CONFLICT

    return (
        jsonify(
            {
                "user": auth_result.user.to_safe_dict(),
                "access_token": auth_result.access_token,
                "refresh_token": auth_result.refresh_token,
            }
        ),
        HTTPStatus.CREATED,
    )


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    identifier = (data.get("identifier") or "").strip()
    password = data.get("password") or ""

    if not identifier or not password:
        return (
            jsonify({"message": "identifier and password are required"}),
            HTTPStatus.BAD_REQUEST,
        )

    auth_result = AuthService.authenticate_user(identifier=identifier, password=password)
    if not auth_result:
        return (
            jsonify({"message": "Invalid credentials"}),
            HTTPStatus.UNAUTHORIZED,
        )

    return (
        jsonify(
            {
                "user": auth_result.user.to_safe_dict(),
                "access_token": auth_result.access_token,
                "refresh_token": auth_result.refresh_token,
            }
        ),
        HTTPStatus.OK,
    )


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access = create_access_token(identity=identity)
    refresh_token = create_refresh_token(identity=identity)
    return jsonify({"access_token": access, "refresh_token": refresh_token}), HTTPStatus.OK


@auth_bp.get("/me")
@jwt_required()
def me():
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid token identity"}), HTTPStatus.UNPROCESSABLE_ENTITY

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), HTTPStatus.NOT_FOUND
    return jsonify({"user": user.to_safe_dict()}), HTTPStatus.OK

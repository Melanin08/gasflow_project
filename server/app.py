from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from functools import wraps
from pathlib import Path

from flask import Flask, g, jsonify, request


STAFF_EMAIL_DOMAIN = "@iitmz.ac.in"
TOKEN_TTL_SECONDS = 60 * 60 * 12
DATA_DIR = Path(__file__).resolve().parent / "data"
USERS_FILE = DATA_DIR / "staff_users.json"


def _json_b64(data: dict) -> str:
    payload = json.dumps(data, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return base64.urlsafe_b64encode(payload).decode("utf-8").rstrip("=")


def _decode_b64(value: str) -> dict:
    padded = value + ("=" * (-len(value) % 4))
    return json.loads(base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8"))


def _sign(value: str, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).hexdigest()


def _password_hash(password: str, salt: str) -> str:
    material = f"{salt}:{password}:{current_app_secret()}"
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def _load_users() -> dict:
    if not USERS_FILE.exists():
        return {}
    try:
        return json.loads(USERS_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _save_users(users: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    USERS_FILE.write_text(json.dumps(users, indent=2, sort_keys=True), encoding="utf-8")


def _public_user(user: dict) -> dict:
    return {"email": user["email"], "role": user["role"], "name": user.get("name", "")}


def _validate_staff_identity(role: str, email: str) -> tuple[dict | None, tuple]:
    if role not in {"admin", "rider", "supplier"}:
        return None, (jsonify({"error": "Choose admin, rider, or supplier access"}), 400)
    if not email.endswith(STAFF_EMAIL_DOMAIN):
        return None, (jsonify({"error": f"Use your {STAFF_EMAIL_DOMAIN} email"}), 400)
    return {"email": email, "role": role}, ()


def create_token(user: dict, secret: str) -> str:
    payload = {
        "email": user["email"],
        "role": user["role"],
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    body = _json_b64(payload)
    return f"{body}.{_sign(body, secret)}"


def verify_token(token: str, secret: str) -> dict | None:
    try:
      body, signature = token.split(".", 1)
    except ValueError:
      return None

    if not hmac.compare_digest(_sign(body, secret), signature):
      return None

    try:
      payload = _decode_b64(body)
    except (ValueError, json.JSONDecodeError):
      return None

    if payload.get("exp", 0) < int(time.time()):
      return None

    if payload.get("role") not in {"admin", "rider", "supplier"}:
      return None

    email = str(payload.get("email", "")).lower()
    if not email.endswith(STAFF_EMAIL_DOMAIN):
      return None

    return payload


def require_role(*roles):
    def decorator(handler):
        @wraps(handler)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            token = auth_header.removeprefix("Bearer ").strip()
            user = verify_token(token, current_app_secret())
            if not user:
                return jsonify({"error": "Authentication required"}), 401
            if user["role"] not in roles:
                return jsonify({"error": "You do not have permission for this action"}), 403
            g.user = user
            return handler(*args, **kwargs)

        return wrapper

    return decorator


def current_app_secret() -> str:
    return os.getenv("AUTH_SECRET", "dev-only-change-this-secret")


def create_app():
    app = Flask(__name__)

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = os.getenv("CLIENT_ORIGIN", "*")
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        return response

    @app.route("/", defaults={"path": ""}, methods=["OPTIONS"])
    @app.route("/<path:path>", methods=["OPTIONS"])
    def options(path):
        return ("", 204)

    @app.route("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.route("/api/auth/login", methods=["POST"])
    def login():
        data = request.get_json(silent=True) or {}
        role = str(data.get("role", "")).lower().strip()
        email = str(data.get("email", "")).lower().strip()
        password = str(data.get("password", "")).strip()

        _, error = _validate_staff_identity(role, email)
        if error:
            return error
        if not password:
            return jsonify({"error": "Password is required"}), 400

        user = _load_users().get(email)
        if not user or user.get("role") != role:
            return jsonify({"error": "Register this staff account first"}), 404
        if user.get("passwordHash") != _password_hash(password, user.get("salt", "")):
            return jsonify({"error": "Incorrect password"}), 401

        public_user = _public_user(user)
        return jsonify({
            "token": create_token(public_user, current_app_secret()),
            "user": public_user,
            "expiresIn": TOKEN_TTL_SECONDS,
        })

    @app.route("/api/auth/register", methods=["POST"])
    def register():
        data = request.get_json(silent=True) or {}
        role = str(data.get("role", "")).lower().strip()
        email = str(data.get("email", "")).lower().strip()
        password = str(data.get("password", "")).strip()
        name = str(data.get("name", "")).strip()

        base_user, error = _validate_staff_identity(role, email)
        if error:
            return error
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400

        users = _load_users()
        if email in users:
            return jsonify({"error": "This staff account is already registered"}), 409

        salt = secrets.token_hex(16)
        user = {
            **base_user,
            "name": name,
            "salt": salt,
            "passwordHash": _password_hash(password, salt),
            "createdAt": int(time.time()),
        }
        users[email] = user
        _save_users(users)

        public_user = _public_user(user)
        return jsonify({
            "token": create_token(public_user, current_app_secret()),
            "user": public_user,
            "expiresIn": TOKEN_TTL_SECONDS,
        }), 201

    @app.route("/api/auth/forgot-password", methods=["POST"])
    def forgot_password():
        data = request.get_json(silent=True) or {}
        role = str(data.get("role", "")).lower().strip()
        email = str(data.get("email", "")).lower().strip()

        _, error = _validate_staff_identity(role, email)
        if error:
            return error

        users = _load_users()
        user = users.get(email)
        if not user or user.get("role") != role:
            return jsonify({"error": "Register this staff account first"}), 404

        reset_token = secrets.token_urlsafe(24)
        user["resetTokenHash"] = _sign(reset_token, current_app_secret())
        user["resetExpiresAt"] = int(time.time()) + (15 * 60)
        users[email] = user
        _save_users(users)

        return jsonify({
            "message": "Password reset ready",
            "resetToken": reset_token,
            "expiresIn": 15 * 60,
        })

    @app.route("/api/auth/reset-password", methods=["POST"])
    def reset_password():
        data = request.get_json(silent=True) or {}
        role = str(data.get("role", "")).lower().strip()
        email = str(data.get("email", "")).lower().strip()
        reset_token = str(data.get("resetToken", "")).strip()
        password = str(data.get("password", "")).strip()

        _, error = _validate_staff_identity(role, email)
        if error:
            return error
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400

        users = _load_users()
        user = users.get(email)
        if not user or user.get("role") != role:
            return jsonify({"error": "Register this staff account first"}), 404
        if user.get("resetExpiresAt", 0) < int(time.time()):
            return jsonify({"error": "Reset link expired"}), 400
        if not hmac.compare_digest(user.get("resetTokenHash", ""), _sign(reset_token, current_app_secret())):
            return jsonify({"error": "Invalid reset token"}), 400

        salt = secrets.token_hex(16)
        user["salt"] = salt
        user["passwordHash"] = _password_hash(password, salt)
        user.pop("resetTokenHash", None)
        user.pop("resetExpiresAt", None)
        users[email] = user
        _save_users(users)

        public_user = _public_user(user)
        return jsonify({
            "token": create_token(public_user, current_app_secret()),
            "user": public_user,
            "expiresIn": TOKEN_TTL_SECONDS,
        })

    @app.route("/api/auth/google", methods=["POST"])
    def google_auth():
        data = request.get_json(silent=True) or {}
        role = str(data.get("role", "")).lower().strip()
        email = str(data.get("email", "")).lower().strip()
        name = str(data.get("name", "")).strip()

        base_user, error = _validate_staff_identity(role, email)
        if error:
            return error

        users = _load_users()
        user = users.get(email)
        if not user:
            user = {
                **base_user,
                "name": name,
                "google": True,
                "createdAt": int(time.time()),
            }
        elif user.get("role") != role:
            return jsonify({"error": "This email is registered for a different role"}), 409
        else:
            user["google"] = True
            user["name"] = user.get("name") or name

        users[email] = user
        _save_users(users)
        public_user = _public_user(user)
        return jsonify({
            "token": create_token(public_user, current_app_secret()),
            "user": public_user,
            "expiresIn": TOKEN_TTL_SECONDS,
        })

    @app.route("/api/auth/me")
    def me():
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.removeprefix("Bearer ").strip()
        user = verify_token(token, current_app_secret())
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        return jsonify({"user": {"email": user["email"], "role": user["role"]}})

    @app.route("/api/rider/profile")
    @require_role("rider")
    def rider_profile():
        return jsonify({"rider": {"email": g.user["email"], "role": g.user["role"]}})

    @app.route("/api/admin/summary")
    @require_role("admin")
    def admin_summary():
        return jsonify({"admin": {"email": g.user["email"], "role": g.user["role"]}})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5001)))

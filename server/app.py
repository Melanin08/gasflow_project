from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from functools import wraps

from flask import Flask, g, jsonify, request


STAFF_EMAIL_DOMAIN = "@iitmz.ac.in"
TOKEN_TTL_SECONDS = 60 * 60 * 12


def _json_b64(data: dict) -> str:
    payload = json.dumps(data, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return base64.urlsafe_b64encode(payload).decode("utf-8").rstrip("=")


def _decode_b64(value: str) -> dict:
    padded = value + ("=" * (-len(value) % 4))
    return json.loads(base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8"))


def _sign(value: str, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).hexdigest()


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

    if payload.get("role") not in {"admin", "rider"}:
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

        if role not in {"admin", "rider"}:
            return jsonify({"error": "Choose admin or rider access"}), 400
        if not email.endswith(STAFF_EMAIL_DOMAIN):
            return jsonify({"error": f"Use your {STAFF_EMAIL_DOMAIN} email"}), 400
        if not password:
            return jsonify({"error": "Password is required"}), 400

        user = {"email": email, "role": role}
        return jsonify({
            "token": create_token(user, current_app_secret()),
            "user": user,
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

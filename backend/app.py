from flask import Flask, jsonify
import os


def create_app():
    app = Flask(__name__)

    @app.route("/health")
    def health():
        return jsonify({"status": "ok"})

    # Example API proxy path; replace with your real routes in `backend/src`
    @app.route("/api/example")
    def example():
        return jsonify({"message": "Hello from Flask backend"})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))

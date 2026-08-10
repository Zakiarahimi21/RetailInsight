import os

from flask import Flask, jsonify

from app.config import config_by_name
from app.extensions import db, login_manager, migrate, mail, csrf, limiter, cors


def create_app(env: str | None = None) -> Flask:
    env = env or os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(env, config_by_name["development"]))

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["EXPORT_FOLDER"], exist_ok=True)

    # --- init extensions ---
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    csrf.init_app(app)
    limiter.init_app(app)
    cors.init_app(
        app,
        supports_credentials=True,
        origins=app.config["CORS_ORIGINS"],
    )

    from app.models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # --- register blueprints ---
    from app.auth import auth_bp
    app.register_blueprint(auth_bp)

    from app.routes.categories import categories_bp
    from app.routes.products import products_bp
    from app.routes.customers import customers_bp
    from app.routes.transactions import transactions_bp
    from app.routes.upload import upload_bp
    from app.routes.analytics import analytics_bp
    from app.routes.forecasting import forecasting_bp
    from app.routes.reports import reports_bp
    from app.routes.ai import ai_bp
    from app.routes.contact import contact_bp

    app.register_blueprint(categories_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(forecasting_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(contact_bp)

    # --- error handlers (JSON, since the frontend is a React SPA) ---
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found."}), 404

    @app.errorhandler(413)
    def file_too_large(e):
        max_mb = app.config["MAX_CONTENT_LENGTH"] // (1024 * 1024)
        return jsonify({"errors": {"file": [f"That file is larger than the {max_mb}MB upload limit."]}}), 413

    @app.errorhandler(429)
    def rate_limited(e):
        return jsonify({"error": "Too many requests. Please slow down."}), 429

    @app.errorhandler(500)
    def server_error(e):
        app.logger.exception(e)
        return jsonify({"error": "Internal server error."}), 500

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app

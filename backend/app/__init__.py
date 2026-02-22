from flask import Flask

from .config import Config
from .extensions import bcrypt, db, migrate, jwt
from .routes.auth import auth_bp
from .routes.analysis import analysis_bp
from .routes.history import history_bp
from .routes.analytics import analytics_bp
from .routes.profile import profile_bp


def create_app(config_class: type[Config] = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    register_extensions(app)
    register_blueprints(app)

    return app


def register_extensions(app: Flask) -> None:
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(analysis_bp, url_prefix="/api")
    app.register_blueprint(history_bp, url_prefix="/api/history")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(profile_bp, url_prefix="/api")


__all__ = ["create_app"]


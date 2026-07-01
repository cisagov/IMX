from flask import Flask

# Middlewares
from middleware.config import ProdConfig, DevConfig
from middleware.logging import configure_logging
from middleware.errors import register_error_handlers

# Route Blueprints
from routes.test import test_bp
from routes.misp_stix import misp_stix_bp
from routes.stix_1 import stix_1_bp


def init_app():
    app = Flask(__name__)

    try:
        if config_name == "development":
            app.config.from_object(DevConfig)
        else:
            app.config.from_object(ProdConfig)
    except NameError:
        app.config.from_object(DevConfig)

    # Middlewares
    configure_logging(app)
    register_error_handlers(app)

    # Blueprints
    app.register_blueprint(test_bp)
    app.register_blueprint(misp_stix_bp)
    app.register_blueprint(stix_1_bp)

    return app

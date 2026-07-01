from flask import jsonify


def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(e):
        app.logger.exception("Not found: " + str(e))
        return jsonify(error="not_found", message="Resource not found"), 404

    @app.errorhandler(400)
    def bad_request(e):
        app.logger.exception("Bad Request: " + str(e))
        return jsonify(error="bad_request", message=str(e)), 400

    @app.errorhandler(Exception)
    def internal_error(e):
        app.logger.exception("Unhandled exception: " + str(e))
        return jsonify(error="interal_error", message="Something went wrong"), 500

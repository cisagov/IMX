from flask import Blueprint, abort

test_bp = Blueprint("test", __name__)


@test_bp.get("/test")
def test():
    # Logging example if needed
    # current_app.logger.info("Test endpoint reached")
    return "You have successfully reached the IMX Py Service"


@test_bp.get("/test-400")
def test400():
    # Logging example if needed
    # current_app.logger.info("Test endpoint reached")
    e = "THIS IS AN ERROR"
    abort(400, f"TEST: {e}")

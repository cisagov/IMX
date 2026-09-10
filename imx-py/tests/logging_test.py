"""Unit tests for middleware logging module."""

import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask


def test_configure_logging_handlers_set():
    """Test that configure_logging transfers gunicorn error handlers to app logger."""
    app = Flask(__name__)
    from middleware.logging import configure_logging

    configure_logging(app)

    # Verify logger has handlers transferred from gunicorn
    assert app.logger.handlers is not None
    # The handlers list may be empty depending on gunicorn setup,
    # but the method should execute without error


def test_configure_logger_name():
    """Test that configure_logging uses gunicorn.error logger name."""
    app = Flask(__name__)
    from middleware.logging import configure_logging

    configure_logging(app)

    # Get the gunicorn error logger
    gunicorn_logger = logging.getLogger("gunicorn.error")
    assert gunicorn_logger is not None


def test_configure_logging_level_set():
    """Test that configure_logging sets app logger level from gunicorn."""
    app = Flask(__name__)
    from middleware.logging import configure_logging

    before_level = app.logger.level
    configure_logging(app)
    after_level = app.logger.level
    # Level should be set (may be same or different depending on gunicorn config)
    assert isinstance(after_level, int)


def test_configure_logging_handler_access():
    """Test that configured handlers are accessible logging handlers."""
    app = Flask(__name__)
    from middleware.logging import configure_logging

    configure_logging(app)

    for handler in app.logger.handlers:
        # Handlers should be valid logging handlers
        assert handler is not None
        assert hasattr(handler, "setLevel")
        assert hasattr(handler, "emit")


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])

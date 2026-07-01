import logging


def configure_logging(app):
    logger = logging.getLogger("gunicorn.error")
    app.logger.handlers = logger.handlers
    app.logger.setLevel(logger.level)

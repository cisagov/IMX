import os


class BaseConfig:
    APP_NAME = "imx-py"
    ENV = os.getenv("FLASK_ENV", "production")
    DEBUG = ENV == "development"
    TESTING = False

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_JSON = True

    # Elasticsearch
    ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")
    ELASTICSEARCH_USER = os.getenv("ELASTICSEARCH_USER", "elastic")
    ELASTICSEARCH_PASS = os.getenv("ELASTICSEARCH_PASS")

    VERSION = "v4.2.2"


class DevConfig(BaseConfig):
    ENV = "development"
    DEBUG = True


class ProdConfig(BaseConfig):
    ENV = "production"
    DEBUG = False

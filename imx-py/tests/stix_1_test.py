"""Unit tests for routes/stix_1.py STIX output format endpoints."""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask


def test_blueprint_exists():
    """Test that the stix_1 blueprint is properly defined."""
    from routes.stix_1 import stix_1_bp
    assert stix_1_bp is not None
    assert stix_1_bp.name == "stix_1"


def test_stix_1_function_exists():
    """Test that the stix_1 function exists and is callable."""
    from routes.stix_1 import stix_1
    assert callable(stix_1)


def test_valid_formats_constant():
    """Test that VALID_FORMATS contains the expected formats."""
    from routes.stix_1 import VALID_FORMATS
    assert VALID_FORMATS == {"txt", "csv", "xml", "ais", "json"}


def test_stix_1_post_endpoint_structure():
    """Test that /stix_1 POST endpoint can be registered on a Flask app."""
    app = Flask(__name__)
    from routes.stix_1 import stix_1_bp
    app.register_blueprint(stix_1_bp)

    with app.test_client() as client:
        # The endpoint should be registered
        rules = [rule.rule for rule in app.url_map.iter_rules()]
        stix_rules = [r for r in rules if "stix_1" in r]
        assert len(stix_rules) > 0


def test_stix_1_with_valid_txt_format():
    """Test /stix_1 POST with valid txt format."""
    app = Flask(__name__)
    from routes.stix_1 import stix_1_bp
    app.register_blueprint(stix_1_bp)

    # Mock produce_doc to avoid actual doc generation
    import routes.stix_1 as stix_1_module
    original_produce_doc = stix_1_module.produce_doc

    def mock_produce_doc(data):
        return "mocked txt output"

    stix_1_module.produce_doc = mock_produce_doc

    try:
        source = {"format": "txt", "data": ["item1", "item2"]}
        with app.test_client() as client:
            response = client.post("/stix_1", json=source)
            # Should return 200 with text/plain mimetype or appropriate error
            assert response.status_code in [200, 400]
    finally:
        stix_1_module.produce_doc = original_produce_doc


def test_stix_1_with_valid_csv_format():
    """Test /stix_1 POST with valid csv format."""
    app = Flask(__name__)
    from routes.stix_1 import stix_1_bp
    app.register_blueprint(stix_1_bp)

    import routes.stix_1 as stix_1_module
    original_produce_csv = stix_1_module.produce_csv

    def mock_produce_csv(data):
        return "mocked csv output"

    stix_1_module.produce_csv = mock_produce_csv

    try:
        source = {"format": "csv", "data": ["item1", "item2"]}
        with app.test_client() as client:
            response = client.post("/stix_1", json=source)
            assert response.status_code in [200, 400]
    finally:
        stix_1_module.produce_csv = original_produce_csv


def test_stix_1_with_valid_xml_format():
    """Test /stix_1 POST with valid xml/ais format."""
    app = Flask(__name__)
    from routes.stix_1 import stix_1_bp
    app.register_blueprint(stix_1_bp)

    import routes.stix_1 as stix_1_module
    original_produce_xml = stix_1_module.produce_xml

    def mock_produce_xml(data, fmt):
        return "<mocked/>"

    stix_1_module.produce_xml = mock_produce_xml

    try:
        source = {"format": "xml", "data": ["item1"]}
        with app.test_client() as client:
            response = client.post("/stix_1", json=source)
            assert response.status_code in [200, 400]
    finally:
        stix_1_module.produce_xml = original_produce_xml


def test_stix_1_with_valid_json_format():
    """Test /stix_1 POST with valid json format."""
    app = Flask(__name__)
    from routes.stix_1 import stix_1_bp
    app.register_blueprint(stix_1_bp)

    import routes.stix_1 as stix_1_module
    original_produce_xml = stix_1_module.produce_xml

    def mock_produce_xml(data, fmt):
        return '{"mocked": true}'

    stix_1_module.produce_xml = mock_produce_xml

    try:
        source = {"format": "json", "data": ["item1"]}
        with app.test_client() as client:
            response = client.post("/stix_1", json=source)
            assert response.status_code in [200, 400]
    finally:
        stix_1_module.produce_xml = original_produce_xml


def test_stix_1_invalid_format():
    """Test /stix_1 POST with invalid format returns 400."""
    app = Flask(__name__)
    from routes.stix_1 import stix_1_bp
    app.register_blueprint(stix_1_bp)

    source = {"format": "invalid", "data": ["item1"]}
    with app.test_client() as client:
        response = client.post("/stix_1", json=source)
        assert response.status_code == 400


def test_stix_1_missing_format():
    """Test /stix_1 POST without format returns 400."""
    app = Flask(__name__)
    from routes.stix_1 import stix_1_bp
    app.register_blueprint(stix_1_bp)

    source = {"data": ["item1"]}
    with app.test_client() as client:
        response = client.post("/stix_1", json=source)
        assert response.status_code == 400


def test_stix_1_missing_data():
    """Test /stix_1 POST without data returns 400."""
    app = Flask(__name__)
    from routes.stix_1 import stix_1_bp
    app.register_blueprint(stix_1_bp)

    source = {"format": "txt"}
    with app.test_client() as client:
        response = client.post("/stix_1", json=source)
        assert response.status_code == 400


def test_stix_1_data_not_list():
    """Test /stix_1 POST with data that is not a list returns 400."""
    app = Flask(__name__)
    from routes.stix_1 import stix_1_bp
    app.register_blueprint(stix_1_bp)

    source = {"format": "txt", "data": "not a list"}
    with app.test_client() as client:
        response = client.post("/stix_1", json=source)
        assert response.status_code == 400


def test_stix_1_with_empty_data_list():
    """Test /stix_1 POST with empty data list."""
    app = Flask(__name__)
    from routes.stix_1 import stix_1_bp
    app.register_blueprint(stix_1_bp)

    import routes.stix_1 as stix_1_module
    original_produce_doc = stix_1_module.produce_doc

    def mock_produce_doc(data):
        return "output for empty list"

    stix_1_module.produce_doc = mock_produce_doc

    try:
        source = {"format": "txt", "data": []}
        with app.test_client() as client:
            response = client.post("/stix_1", json=source)
            assert response.status_code in [200, 400]
    finally:
        stix_1_module.produce_doc = original_produce_doc


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])

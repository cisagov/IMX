"""Unit tests for routes/misp_stix.py MISP-STIX converter endpoints."""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask


def test_blueprint_exists():
    """Test that the misp_stix blueprint is properly defined."""
    from routes.misp_stix import misp_stix_bp
    assert misp_stix_bp is not None
    assert misp_stix_bp.name == "misp_stix"


def test_misp_to_stix_function_exists():
    """Test that the misp_to_stix function exists and is callable."""
    from routes.misp_stix import misp_to_stix
    assert callable(misp_to_stix)


def test_stix_to_misp_function_exists():
    """Test that the stix_to_misp function exists and is callable."""
    from routes.misp_stix import stix_to_misp
    assert callable(stix_to_misp)


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])

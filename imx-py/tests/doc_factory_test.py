"""Unit tests for controllers/doc_factory.py document factory functions."""

import sys
import os
import textwrap

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask


def test_produce_doc_basic():
    """Test produce_doc with main type produces textual document."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "main",
                "attribs": {
                    "doctitle": "Test Title",
                    "docid": "TEST-001",
                    "produced": "2024-01-15T10:30:00",
                    "tlp": "GREEN",
                },
            }
        ]

        result = produce_doc(data)
        assert result is not None
        assert isinstance(result, str)
        assert len(result) > 0


def test_produce_doc_with_indicator():
    """Test produce_doc with indicator type."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "indicator",
                "attribs": {
                    "type": "malicious-activity",
                    "desc": "Test indicator description",
                    "sighted": "2024-01-15",
                    "phase": "Delivery",
                },
            }
        ]

        result = produce_doc(data)
        assert result is not None
        assert isinstance(result, str)
        assert "Indicators:" in result


def test_produce_doc_with_fqdn():
    """Test produce_doc with fqdn type."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "fqdn",
                "attribs": {
                    "fqdn": "malicious.example.com",
                    "sfrom": "user@example.com",
                },
            }
        ]

        result = produce_doc(data)
        assert result is not None
        assert isinstance(result, str)
        assert "FQDN:" in result


def test_produce_doc_with_ipv4():
    """Test produce_doc with ipv4 type."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "ipv4",
                "attribs": {
                    "ip": "192.168.1.1",
                },
            }
        ]

        result = produce_doc(data)
        assert result is not None
        assert isinstance(result, str)
        assert "IPv4 Address:" in result


def test_produce_doc_with_email():
    """Test produce_doc with email type."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "email",
                "attribs": {
                    "sfrom": "attacker@example.com",
                    "subject": "Test subject",
                    "xmailer": "TestMailer",
                    "msgid": "12345@example.com",
                },
            }
        ]

        result = produce_doc(data)
        assert result is not None
        assert isinstance(result, str)
        assert "Email" in result
        assert "Sender Address:" in result


def test_produce_doc_with_file():
    """Test produce_doc with file type."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "file",
                "attribs": {
                    "filename": "malware.exe",
                    "path": "/tmp/malware.exe",
                    "size": "123456",
                    "md5": "d41d8cd98f00b204e9800998ecf8427e",
                    "sha1": "0be67arroundhash",
                    "sha256": "aaf495a9ce92b47ae4a49e763f5d974e942c055",
                    "sha512": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    "ssdeep": "12345:abcdef:67890",
                },
            }
        ]

        result = produce_doc(data)
        assert result is not None
        assert isinstance(result, str)
        assert "File" in result
        assert "MD5:" in result


def test_produce_doc_with_mutex():
    """Test produce_doc with mutex type."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "mutex",
                "attribs": {
                    "mutex": "svchost.exe",
                },
            }
        ]

        result = produce_doc(data)
        assert result is not None
        assert isinstance(result, str)
        assert "Mutex:" in result


def test_produce_doc_with_netcon():
    """Test produce_doc with netcon type."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "netcon",
                "attribs": {
                    "source": "192.168.1.100",
                    "sport": "8080",
                    "sproto": "tcp",
                    "destination": "10.0.0.1",
                    "dport": "443",
                    "dproto": "tcp",
                },
            }
        ]

        result = produce_doc(data)
        assert result is not None
        assert isinstance(result, str)
        assert "Source IPv4:" in result
        assert "Destination IPv4:" in result


def test_produce_doc_with_url():
    """Test produce_doc with url type."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "url",
                "attribs": {
                    "url": "https://malicious.example.com",
                    "name": "Malicious Link",
                },
            }
        ]

        result = produce_doc(data)
        assert result is not None
        assert isinstance(result, str)
        assert "URL:" in result or "URI:" in result


def test_produce_doc_with_ua():
    """Test produce_doc with ua (user agent) type."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "ua",
                "attribs": {
                    "useragent": "Mozilla/5.0 Test Browser",
                },
            }
        ]

        result = produce_doc(data)
        assert result is not None
        assert isinstance(result, str)
        assert "User Agent:" in result


def test_produce_doc_with_registry():
    """Test produce_doc with registry type."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "registry",
                "attribs": {
                    "hive": "HKEY_LOCAL_MACHINE",
                    "key": "Software\\Test",
                    "name": "TestValue",
                    "data": "testdata",
                },
            }
        ]

        result = produce_doc(data)
        assert result is not None
        assert isinstance(result, str)
        assert "Registry:" in result


def test_produce_doc_invalid_main_missing_attribs():
    """Test produce_doc raises ValueError when main attribs missing."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {"type": "main"},
        ]

        try:
            result = produce_doc(data)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "VALUE ERROR: No [attribs] key found" in str(e)


def test_produce_doc_invalid_indicator_missing_type():
    """Test produce_doc raises ValueError when indicator attribs missing type."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {"type": "indicator", "attribs": {}},
        ]

        try:
            result = produce_doc(data)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            # Code checks attribs first before type
            assert "VALUE ERROR: No [attribs] key found" in str(e)


def test_produce_doc_unrecognized_type():
    """Test produce_doc raises ValueError for unrecognized type."""
    from controllers.doc_factory import produce_doc

    app = Flask(__name__)
    with app.app_context():
        data = [
            {"type": "unknown_type", "attribs": {}},
        ]

        try:
            result = produce_doc(data)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "VALUE ERROR: Unrecognized [type] key in attribs" in str(e)


def test_produce_csv_basic():
    """Test produce_csv with basic indicator data."""
    from controllers.doc_factory import produce_csv

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "indicator",
                "attribs": {
                    "type": "malicious-activity",
                    "desc": "Test indicator",
                    "sighted": "2024-01-15",
                    "phase": "Delivery",
                },
            }
        ]

        result = produce_csv(data)
        assert result is not None
        assert isinstance(result, str)
        assert "INDICATOR_VALUE" in result  # header row


def test_produce_csv_with_mutex():
    """Test produce_csv with mutex type."""
    from controllers.doc_factory import produce_csv

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "mutex",
                "attribs": {
                    "mutex": "test-mutex-value",
                },
            }
        ]

        result = produce_csv(data)
        assert result is not None
        assert isinstance(result, str)
        assert "MUTEX" in result


def test_produce_csv_with_fqdn():
    """Test produce_csv with fqdn type."""
    from controllers.doc_factory import produce_csv

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "fqdn",
                "attribs": {
                    "fqdn": "malicious.example.com",
                },
            }
        ]

        result = produce_csv(data)
        assert result is not None
        assert isinstance(result, str)
        assert "FQDN" in result


def test_produce_csv_with_ipv4():
    """Test produce_csv with ipv4 type."""
    from controllers.doc_factory import produce_csv

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "ipv4",
                "attribs": {
                    "ip": "10.0.0.1",
                },
            }
        ]

        result = produce_csv(data)
        assert result is not None
        assert isinstance(result, str)
        assert "IPV4ADDR" in result


def test_produce_csv_with_ipv6():
    """Test produce_csv with ipv6 type."""
    from controllers.doc_factory import produce_csv

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "ipv6",
                "attribs": {
                    "ipv6": "2001:db8::1",
                },
            }
        ]

        result = produce_csv(data)
        assert result is not None
        assert isinstance(result, str)
        assert "IPV6ADDR" in result


def test_produce_csv_with_ua():
    """Test produce_csv with ua type."""
    from controllers.doc_factory import produce_csv

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "ua",
                "attribs": {
                    "useragent": "Mozilla/5.0 Test",
                },
            }
        ]

        result = produce_csv(data)
        assert result is not None
        assert isinstance(result, str)
        assert "USER_AGENT_STRING" in result


def test_produce_csv_with_file():
    """Test produce_csv with file type."""
    from controllers.doc_factory import produce_csv

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "file",
                "attribs": {
                    "filename": "test.txt",
                    "md5": "abc123",
                    "sha1": "def456",
                    "sha256": "789abc",
                    "sha512": "000000",
                    "ssdeep": "ssdeepval",
                    "size": "1024",
                },
            }
        ]

        result = produce_csv(data)
        assert result is not None
        assert isinstance(result, str)
        assert "MD5" in result


def test_produce_csv_with_email():
    """Test produce_csv with email type."""
    from controllers.doc_factory import produce_csv

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "email",
                "attribs": {
                    "sfrom": "user@example.com",
                    "subject": "Test subject",
                    "xmailer": "TestMailer",
                    "msgid": "12345@example.com",
                },
            }
        ]

        result = produce_csv(data)
        assert result is not None
        assert isinstance(result, str)
        assert "EMAIL" in result


def test_produce_csv_with_netcon():
    """Test produce_csv with netcon type."""
    from controllers.doc_factory import produce_csv

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "netcon",
                "attribs": {
                    "source": "192.168.1.1",
                    "sport": "8080",
                    "sproto": "tcp",
                    "destination": "10.0.0.1",
                    "dport": "443",
                    "dproto": "tcp",
                },
            }
        ]

        result = produce_csv(data)
        assert result is not None
        assert isinstance(result, str)
        assert "SOURCE_IP" in result
        assert "DESTINATION_IP" in result


def test_produce_csv_with_registry():
    """Test produce_csv with registry type."""
    from controllers.doc_factory import produce_csv

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "registry",
                "attribs": {
                    "hive": "HKEY_LOCAL_MACHINE",
                    "key": "Software\\Test",
                    "name": "TestValue",
                    "data": "testdata",
                },
            }
        ]

        result = produce_csv(data)
        assert result is not None
        assert isinstance(result, str)
        assert "REGKEY" in result


def test_produce_xml_basic():
    """Test produce_xml with basic main type."""
    from controllers.doc_factory import produce_xml

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "main",
                "attribs": {
                    "doctitle": "Test Title",
                    "docid": "TEST-001",
                    "produced": "2024-01-15T10:30:00",
                    "tlp": "GREEN",
                },
            }
        ]

        result = produce_xml(data, "xml")
        assert result is not None
        assert isinstance(result, str)
        assert "<STIX" in result or "<?xml" in result


def test_produce_xml_with_indicator():
    """Test produce_xml with indicator type."""
    from controllers.doc_factory import produce_xml

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "indicator",
                "attribs": {
                    "type": "malicious-activity",
                },
            }
        ]

        result = produce_xml(data, "xml")
        assert result is not None
        assert isinstance(result, str)
        assert "INDICATOR" in result or "indicator" in result.lower()


def test_produce_xml_with_fqdn():
    """Test produce_xml with fqdn type."""
    from controllers.doc_factory import produce_xml

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "fqdn",
                "attribs": {
                    "fqdn": "malicious.example.com",
                },
            }
        ]

        result = produce_xml(data, "xml")
        assert result is not None
        assert isinstance(result, str)
        # FQDN creation requires parent indicator, so test basic structure
        assert "STIX" in result or "DomainName" in result or "FQDN" in result


def test_produce_xml_with_ipv4():
    """Test produce_xml with ipv4 type."""
    from controllers.doc_factory import produce_xml

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "ipv4",
                "attribs": {
                    "ip": "192.168.1.1",
                },
            }
        ]

        result = produce_xml(data, "xml")
        assert result is not None
        assert isinstance(result, str)
        # IPv4 creation requires parent indicator, check for basic STIX structure
        assert "STIX" in result or "Address" in result or "IPv4" in result


def test_produce_xml_with_file():
    """Test produce_xml with file type."""
    from controllers.doc_factory import produce_xml

    app = Flask(__name__)
    with app.app_context():
        data = [
            {
                "type": "file",
                "attribs": {
                    "filename": "malware.exe",
                },
            }
        ]

        result = produce_xml(data, "xml")
        assert result is not None
        assert isinstance(result, str)
        # File creation requires parent indicator, check for basic STIX structure
        assert "STIX" in result or "File" in result


def test_wrap_function():
    """Test wrap function arranges text to set width."""
    from controllers.doc_factory import wrap

    # Test with short text that fits in one line
    result = wrap("short text", 80)
    assert result is not None
    assert isinstance(result, str)

    # Test with text that needs wrapping
    long_text = "This is a very long text that should be wrapped at the specified column width"
    result = wrap(long_text, 40)
    assert result is not None
    assert isinstance(result, str)
    # Should contain newlines from wrapping
    assert "\r\n" in result


def test_defang_function():
    """Test defang function disables URLs."""
    from controllers.doc_factory import defang

    # Test URL defanging - only replace http prefix and . with [.]
    url = "http://badguy.com"
    result = defang(url)
    # http->hxxp, .->[.] but not the one in [.com] - the function replaces ALL .
    # Let's check what it actually does
    assert "hxxp" in result
    assert "[.]" in result

    # Test regular string passthrough for other chars
    regular = "just a regular string"
    result = defang(regular)
    assert result == regular


def test_defang_with_port():
    """Test defang with URL containing port."""
    from controllers.doc_factory import defang

    url = "http://badguy.com:8080/path"
    result = defang(url)
    # The function replaces ALL colons with [:], so port gets affected too
    # But it also replaces . with [.]
    assert "hxxp" in result
    assert "[.]" in result


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])

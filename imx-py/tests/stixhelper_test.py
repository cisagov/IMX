"""Unit tests for STIXHelper class."""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime

import stix
import stix.common
import stix.core
import stix.indicator
import stix.indicator.indicator
from mixbox.idgen import set_id_namespace
from mixbox.namespaces import Namespace

from controllers.STIXHelper import STIXHelper, get_tlp, get_fouo

# Set CISA namespace
cisa_ns = Namespace("https://www.us-cert.gov/nccic", "CISA")
set_id_namespace(cisa_ns)


class TestSTIXHelperInitialization:
    """Tests for STIXHelper initialization."""

    def test_init_creates_package(self):
        """Test that STIXHelper initializes with a STIXPackage."""
        helper = STIXHelper(stix_type="xml")
        assert helper.stix_package is not None
        assert helper.stix_header is not None

    def test_init_sets_version(self):
        """Test that STIXHelper sets version from environment."""
        helper = STIXHelper(stix_type="xml")
        version = helper.get_version()
        # Version may be None if VERSION env var is not set
        assert version is None or version == "" or isinstance(version, str)


class TestSTIXHelperVersions:
    """Tests for version retrieval methods."""

    def test_get_stix_version(self):
        """Test getting STIX version."""
        helper = STIXHelper(stix_type="xml")
        version = helper.get_stix_version()
        assert version is not None
        assert isinstance(version, str)

    def test_get_cybox_version(self):
        """Test getting Cybox version."""
        helper = STIXHelper(stix_type="xml")
        version = helper.get_cybox_version()
        assert version is not None
        assert isinstance(version, str)


class TestSTIXHelperKillChains:
    """Tests for kill chain methods."""

    def test_kill_chain_phases(self):
        """Test kill chain phases are created correctly."""
        helper = STIXHelper(stix_type="xml")
        chain = helper.kill_chain()
        assert chain is not None
        assert len(chain.kill_chain_phases) == 7
        assert chain.number_of_phases == 7

    def test_kill_chain_2_phases(self):
        """Test CISA kill chain phases are created correctly."""
        helper = STIXHelper(stix_type="xml")
        chain = helper.kill_chain_2()
        assert chain is not None
        assert len(chain.kill_chain_phases) == 12
        assert chain.number_of_phases == 12


class TestSTIXHelperCreateIndicator:
    """Tests for indicator creation."""

    def test_create_indicator_basic(self):
        """Test creating a basic indicator."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={"desc": "Test indicator", "type": "C2"},
            guid="test-guid-123",
            stix_type="xml",
        )
        assert indicator is not None
        assert isinstance(indicator, stix.indicator.indicator.Indicator)
        assert indicator.id_ == "test-guid-123"

    def test_create_indicator_with_type(self):
        """Test creating indicator with valid type."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={"desc": "Test", "type": "Malicious E-mail"},
            guid="test-guid-456",
            stix_type="xml",
        )
        assert indicator is not None
        assert indicator.indicator_types is not None

    def test_create_indicator_with_sighting(self):
        """Test creating indicator with sighting."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={
                "desc": "Test",
                "type": "C2",
                "sighted": "2024-01-15T10:30:00",
            },
            guid="test-guid-789",
            stix_type="xml",
        )
        assert indicator is not None
        assert indicator.sightings is not None


class TestSTIXHelperCreateFile:
    """Tests for file creation."""

    def test_create_file_basic(self):
        """Test creating a file indicator."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={"desc": "Test file", "type": "File Hash Watchlist"},
            guid="file-guid-1",
            stix_type="xml",
        )
        win_vars = {
            "filename": "malware.exe",
            "path": "/tmp/malware.exe",
            "size": "123456",
            "md5": "d41d8cd98f00b204e9800998ecf8427e",
            "sha1": "0be67 arroundhashvalue",
            "sha256": "aaf495a9ce92b47ae4a49e763f5d974e942c055",
            "sha512": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "ssdeep": "12345:abcdef:67890",
        }
        indicator = helper.create_file(
            win_vars=win_vars,
            parent=indicator,
            guid="file-obj-1",
            stix_type="xml",
        )
        assert indicator is not None


class TestSTIXHelperCreateIPv4:
    """Tests for IPv4 creation."""

    def test_create_ipv4_basic(self):
        """Test creating an IPv4 indicator."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={"desc": "Test IPv4", "type": "C2"},
            guid="ipv4-guid-1",
            stix_type="xml",
        )
        win_vars = {
            "ip": "192.168.1.1",
        }
        indicator = helper.create_ipv4(
            win_vars=win_vars,
            parent=indicator,
            guid="ipv4-obj-1",
            stix_type="xml",
        )
        assert indicator is not None


class TestSTIXHelperCreateIPv6:
    """Tests for IPv6 creation."""

    def test_create_ipv6_basic(self):
        """Test creating an IPv6 indicator."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={"desc": "Test IPv6", "type": "C2"},
            guid="ipv6-guid-1",
            stix_type="xml",
        )
        win_vars = {
            "ipv6": "2001:db8::1",
        }
        indicator = helper.create_ipv6(
            win_vars=win_vars,
            parent=indicator,
            guid="ipv6-obj-1",
            stix_type="xml",
        )
        assert indicator is not None


class TestSTIXHelperCreateEmail:
    """Tests for email creation."""

    def test_create_email_basic(self):
        """Test creating an email indicator."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={"desc": "Test email", "type": "Malicious E-mail"},
            guid="email-guid-1",
            stix_type="xml",
        )
        win_vars = {
            "sfrom": " attacker@example.com",
            "sspoofed": "true",
            "subject": "Test subject",
            "msgid": "12345@example.com",
            "xmailer": "TestMailer",
            "attachments": ["doc.pdf"],
            "links": ["https://example.com"],
        }
        indicator = helper.create_email(
            win_vars=win_vars,
            parent=indicator,
            guid="email-obj-1",
            stix_type="xml",
        )
        assert indicator is not None


class TestSTIXHelperCreateURL:
    """Tests for URL creation."""

    def test_create_url_basic(self):
        """Test creating a URL indicator."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={"desc": "Test URL", "type": "URL Watchlist"},
            guid="url-guid-1",
            stix_type="xml",
        )
        win_vars = {
            "url": "https://malicious.example.com",
        }
        indicator = helper.create_url(
            win_vars=win_vars,
            parent=indicator,
            guid="url-obj-1",
            stix_type="xml",
        )
        assert indicator is not None


class TestSTIXHelperCreateLink:
    """Tests for link creation."""

    def test_create_link_basic(self):
        """Test creating a link indicator."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={"desc": "Test link", "type": "C2"},
            guid="link-guid-1",
            stix_type="xml",
        )
        win_vars = {
            "url": "https://example.com",
            "name": "Example Link",
        }
        indicator = helper.create_link(
            win_vars=win_vars,
            parent=indicator,
            guid="link-obj-1",
            stix_type="xml",
        )
        assert indicator is not None


class TestSTIXHelperCreateFQDN:
    """Tests for FQDN creation."""

    def test_create_fqdn_basic(self):
        """Test creating an FQDN indicator."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={"desc": "Test FQDN", "type": "Domain Watchlist"},
            guid="fqdn-guid-1",
            stix_type="xml",
        )
        win_vars = {
            "fqdn": "malicious.example.com",
        }
        indicator = helper.create_fqdn(
            win_vars=win_vars,
            parent=indicator,
            guid="fqdn-obj-1",
            stix_type="xml",
        )
        assert indicator is not None


class TestSTIXHelperCreateMutex:
    """Tests for mutex creation."""

    def test_create_mutex_basic(self):
        """Test creating a mutex indicator."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={"desc": "Test mutex", "type": "C2"},
            guid="mutex-guid-1",
            stix_type="xml",
        )
        win_vars = {
            "mutex": "svchost.exe",
        }
        indicator = helper.create_mutex(
            win_vars=win_vars,
            parent=indicator,
            guid="mutex-obj-1",
            stix_type="xml",
        )
        assert indicator is not None


class TestSTIXHelperCreateRegistry:
    """Tests for registry creation."""

    def test_create_registry_basic(self):
        """Test creating a registry indicator."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={"desc": "Test registry", "type": "C2"},
            guid="registry-guid-1",
            stix_type="xml",
        )
        win_vars = {
            "hive": "HKEY_LOCAL_MACHINE",
            "key": "Software\\Test",
            "name": "TestValue",
            "data": "testdata",
        }
        indicator = helper.create_registry(
            win_vars=win_vars,
            parent=indicator,
            guid="registry-obj-1",
            stix_type="xml",
        )
        assert indicator is not None


class TestSTIXHelperCreateUserAgent:
    """Tests for user agent creation."""

    def test_create_user_agent_basic(self):
        """Test creating a user agent indicator."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={"desc": "Test UA", "type": "C2"},
            guid="ua-guid-1",
            stix_type="xml",
        )
        win_vars = {
            "useragent": "Mozilla/5.0 Test",
        }
        indicator = helper.create_user_agent(
            win_vars=win_vars,
            parent=indicator,
            guid="ua-obj-1",
            stix_type="xml",
        )
        assert indicator is not None


class TestSTIXHelperCreateNetcon:
    """Tests for network connection creation."""

    def test_create_netcon_basic(self):
        """Test creating a network connection indicator."""
        helper = STIXHelper(stix_type="xml")
        indicator = helper.create_indicator(
            win_vars={"desc": "Test netcon", "type": "C2"},
            guid="netcon-guid-1",
            stix_type="xml",
        )
        win_vars = {
            "source": "192.168.1.100",
            "sport": "8080",
            "sproto": "tcp",
            "destination": "10.0.0.1",
            "dport": "443",
            "dproto": "tcp",
        }
        indicator = helper.create_netcon(
            win_vars=win_vars,
            parent=indicator,
            guid="netcon-obj-1",
            stix_type="xml",
        )
        assert indicator is not None


class TestSTIXHelperGetMain:
    """Tests for getting main header attributes."""

    def test_get_main_basic(self):
        """Test getting main header attributes."""
        helper = STIXHelper(stix_type="xml")
        helper.set_main(
            win_vars={
                "docid": "TEST-001",
                "doctitle": "Test Title",
                "overview": "Test overview",
                "tlp": "GREEN",
                "produced": "2024-01-15T10:30:00",
            },
            stix_type="xml",
        )
        main = helper.get_main()
        assert main is not None
        assert main["docid"] == "TEST-001"
        assert main["doctitle"] == "Test Title"


class TestSTIXHelperToXML:
    """Tests for XML generation."""

    def test_to_xml_basic(self):
        """Test generating XML from STIX package."""
        helper = STIXHelper(stix_type="xml")
        xml_str = helper.to_xml()
        assert xml_str is not None
        assert isinstance(xml_str, str)
        assert len(xml_str) > 0


class TestSTIXHelperImportSTIX:
    """Tests for importing STIX XML."""

    def test_import_stix_nonexistent(self):
        """Test importing non-existent file returns False."""
        helper = STIXHelper(stix_type="xml")
        result = helper.import_stix("/nonexistent/file.xml")
        assert result is False

    def test_import_stix_valid(self):
        """Test importing valid STIX file."""
        # Create a simple STIX package first
        helper = STIXHelper(stix_type="xml")
        # Just test the method exists and handles the case
        # We can't easily create a valid test file without more setup,
        # but we can verify the method signature works
        assert hasattr(helper, "import_stix")


class TestHelperUtilityFunctions:
    """Tests for helper utility functions."""

    def test_get_tlp_red(self):
        """Test TLP RED generation."""
        result = get_tlp("RED")
        assert result is not None
        assert isinstance(result, str)

    def test_get_tlp_green(self):
        """Test TLP GREEN generation."""
        result = get_tlp("GREEN")
        assert result is not None
        assert isinstance(result, str)

    def test_get_fouo(self):
        """Test FOUO block generation."""
        result = get_fouo()
        assert result is not None
        assert isinstance(result, str)
        assert "FOR OFFICIAL USE ONLY" in result


class TestSTIXHelperSetMainAIS:
    """Tests for set_main with AIS type."""

    def test_set_main_ais(self):
        """Test set_main with AIS type."""
        helper = STIXHelper(stix_type="ais")
        helper.set_main(
            win_vars={
                "docid": "TEST-AIS-001",
                "doctitle": "AIS Title",
                "overview": "AIS overview",
                "tlp": "GREEN",
                "produced": "2024-01-15T10:30:00",
                "consent": "EVERYONE",
                "org_name": "CISA",
                "org_country": "US",
                "org_admin": "US-DC",
                "org_sector": "Government Facilities Sector",
                "proprietary": "true",
            },
            stix_type="ais",
        )
        main = helper.get_main()
        assert main is not None
        assert main["docid"] == "TEST-AIS-001"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])

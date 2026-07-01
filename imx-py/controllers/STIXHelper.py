"""
STIXHelper

This class wraps the Mitre STIX API to provide a simple to use
interface to build and publish a STIX xml object.  STIX stands
for Structured Threat Information eXpression and was developed
by Mitre.  This class accepts "chunks" of attributes contained
in dictionaries to dynamically form the stix object.  The user
can also dynamically query the stix object.  This class is the
Mitre stix  object  creator  that  is  part  of the IBTool GUI
application.  The dictionary "chunk" is mapped to the contents
of the  stix  IBTool editor.  These  chunks  must typically be
processed together because of  their  close association.  STIX
also uses  the  Cyber Observalbe  eXpression (CybOX) to encode
metadata within the STIX xml structure.

When a user creates an  indicator  or  an  observable,  a node
reference is returned which  they  can use to set and attached
to the main xml structure.  Once you have an object reference,
you can  get  the  attributes   associated  with  it  via  the
getAttributes  method.  Top-level  nodes  consist  of both  an
Indicator and the observation.  Lower-level nodes contain only
an observation.  All STIX attributes in the stix package  that
start with an underscore are private.

Public methods:
  create_indicator -  Returns an empty indicator
  debug_off -         Turn off debugs
  debug_on -          Turn on debugs
  find()* -          Returns a list of dictionaries of xml
  find_first() -      Initializes the Indicator finder
  find_next() -       Returns an Indicator reference
  get_attributres -    Get dict of attributes from stix node
  get_kill_chain_info - Returns tuple of data from guid
  get_cybox_version -  Returns the Cybox version
  get_main -          Returns dict of attributes in header
  get_root -          Returns a high-level xml reference
  get_stix_version -   Returns the STIX version
  get_version -       Returns the version of this class
  import_stix -       Takes a stix xml filename and reads it
  set_fqdn -          Takes dict of attributes to set FQDN
  set_main -          Takes dict of attributes to set header
  find_first -        iterator accessing stix object schema
  find_next -         iterator accessing stix object schema
  create_file -       takes dict of attributes to set File
  create_email -      takes dict of attributes to set email
  create_ipv4 -       takes dict of attributes to set IPv4
  create_ipv6 -       takes dict of attributes to set IPv6
  create_link -       takes dict of attributes to set Link
  create_netcon -     takes dict of attributes to set Netcon
  create_registry -   takes dict of attributes to set Registry
  create_user_agent -  takes dict of attributes to set UserAgent
  create_url -        takes dict of attributes to set Url
  to_xml() -         Returns the xml string for current xml

Assumptions:
  8/13/2014 - We will not use composites

Changes:
  4/12/2020 Refactored docFactory.0.3.0 for Python 3.8.4
            stix 1.1.1.8/cybox 2.1.0.21/lxml 4.5.0
  4/20/2020 Fixed foreign characters
  4/29/2020 Build AIS with API
  6/15/2020 Added the Metadata block on line 518 for tools
  6/22/2020 NSPADG-1095: Added the Contributing_SOurces and Source wrapper line 482
  4/12/2021 Removed parsePattern (expanded ATT&CK Pattern Desc)
  4/28/2021 Added SHA512 to FILE indicator
  10/30/2023 - TPGIBv1.4 #66 - Modified to handle indicators of type ipv6.
"""

import json
import os
import sys
import time
from datetime import datetime

import cybox.common.hashes
import cybox.helper
import cybox.objects.address_object
import cybox.objects.domain_name_object
import cybox.objects.email_message_object
import cybox.objects.file_object
import cybox.objects.http_session_object
import cybox.objects.link_object
import cybox.objects.mutex_object
import cybox.objects.network_connection_object
import cybox.objects.port_object
import cybox.objects.socket_address_object
import cybox.objects.uri_object
import cybox.objects.win_registry_key_object
import stix
import stix.common
import stix.common.kill_chains
import stix.core
import stix.core.ttps
import stix.data_marking
import stix.extensions.identity.ciq_identity_3_0
import stix.extensions.marking.simple_marking
import stix.extensions.marking.terms_of_use_marking
import stix.extensions.marking.tlp
import stix.indicator
import stix.indicator.indicator
import stix.indicator.sightings
from cybox.common import Metadata, ToolInformation, ToolInformationList
from flask import current_app
from mixbox.idgen import set_id_namespace
from mixbox.namespaces import Namespace
from stix.common.information_source import ContributingSources, InformationSource
from stix.common.vocabs import VocabString
from stix.extensions.marking.ais import add_ais_marking
from stix.ttp import TTP, Behavior
from stix.ttp.attack_pattern import AttackPattern

__version__ = os.getenv("VERSION")
__revised__ = "4/28/2021"


# Standard Dictionary key parameters
WHICH_KEY = "which"  # Generic key to find WHICH_VALUE type
RELATED_KEY = "related"  # Copied_By, Copied_From, Created...

MAIN_WHICH_VALUE = "main"  # Value for which key
MAIN_DOCID_KEY = "docid"  # Main attribute
MAIN_PRODUCED_KEY = "produced"  # Main attribute
MAIN_TITLE_KEY = "doctitle"  # Main attribute
MAIN_INTENT_KEY = "intent"  # Main attribute
MAIN_OVERVIEW_KEY = "overview"  # Main attribute
MAIN_TLP_KEY = "tlp"  # Main attribute
MAIN_FOUO_KEY = "fouo"  # Main attribute
MAIN_PATTERNS_KEY = "patterns"  # Main attribute
MAIN_CONSENT_KEY = "consent"  # ais attribute
MAIN_NAME_KEY = "org_name"  # ais attribute
MAIN_PROP_KEY = "proprietary"  # ais attribute
MAIN_CTRY_KEY = "org_country"  # ais attribute
MAIN_ADMIN_KEY = "org_admin"  # ais attribute
MAIN_SECTOR_KEY = "org_sector"  # ais attribute
MAIN_SOURCE_KEY = "org_source"  # ais attribute

FQDN_WHICH_VALUE = "fqdn"  # Value for which key
FQDN_VALUE_KEY = "fqdn"  # Value for which key

FILE_WHICH_VALUE = "file"  # Value for which key
FILE_NAME_KEY = "filename"  # File attribute
FILE_PATH_KEY = "path"  # File attribute
FILE_SIZE_KEY = "size"  # File attribute
FILE_MD5_KEY = "md5"  # File attribute
FILE_SHA1_KEY = "sha1"  # File attribute
FILE_SHA256_KEY = "sha256"  # File attribute
FILE_SHA512_KEY = "sha512"  # File attribute
FILE_SSDEEP_KEY = "ssdeep"  # File attribute

EMAIL_WHICH_VALUE = "email"  # Value for which key
EMAIL_FROM_KEY = "sfrom"  # Email attribute
EMAIL_SPOOFED_KEY = "sspoofed"  # Email attribute
EMAIL_SUBJECT_KEY = "subject"  # Email attribute
EMAIL_MSGID_KEY = "msgid"  # Email attribute
EMAIL_XMAILER_KEY = "xmailer"  # Email attribute
EMAIL_ATTACH_KEY = "attachments"  # Email attribute
EMAIL_LINKS_KEY = "links"  # Email attribute

IPV4_WHICH_VALUE = "ipv4"  # Value for which key
IPV4_IP_KEY = "ip"  # IPv4 attribute
IPV4_SPOOFED_KEY = "spoofed"  # IPv4 attribute

IPV6_WHICH_VALUE = "ipv6"  # Value for which key
IPV6_IP_KEY = "ipv6"  # IPv6 attribute
IPV6_SPOOFED_KEY = "spoofed"  # IPv6 attribute

LINK_WHICH_VALUE = "link"  # Value for which key
LINK_URL_KEY = "url"  # Link attribute
LINK_NAME_KEY = "name"  # Link attribute

MUTEX_WHICH_VALUE = "mutex"  # Value for which key
MUTEX_VALUE_KEY = "mutex"  # Mutex attribute

NETCON_WHICH_VALUE = "netcon"  # Value for which key
NETCON_SOURCE_KEY = "source"  # Netcon attribute
NETCON_SSPOOFED_KEY = "sspoofed"  # Netcon attribute
NETCON_SPORT_KEY = "sport"  # Netcon attribute
NETCON_SPROTO_KEY = "sproto"  # Netcon attribute
NETCON_DEST_KEY = "destination"  # Netcon attribute
NETCON_DSPOOFED_KEY = "dspoofed"  # Netcon attribute
NETCON_DPORT_KEY = "dport"  # Netcon attribute
NETCON_DPROTO_KEY = "dproto"  # Netcon attribute
NETCON_SPOOFED_TRUE = "1"  # Netcon attribute SPOOFED is True
NETCON_SPOOFED_FALSE = "0"  # Netcon attribute SPOOFED is False

REG_WHICH_VALUE = "registry"  # Value for which key
REG_HIVE_KEY = "hive"  # Registry attribute
REG_KEY_KEY = "key"  # Registry attribute
REG_NAME_KEY = "name"  # Registry attribute
REG_DATA_KEY = "data"  # Registry attribute

URL_WHICH_VALUE = "url"  # Value for which key
URL_VALUE_KEY = "url"  # URL attribute

UA_WHICH_VALUE = "ua"  # Value for which key
UA_VALUE_KEY = "useragent"  # UserAgent attribute

IND_WHICH_VALUE = "indicator"  # Value for which indicator
IND_DESC_KEY = "desc"  # Indicator description
IND_TYPE_KEY = "type"  # Indicator type (C2, Exfiltration, ...)
IND_TLP_KEY = "tlp"  # Indicator tlp (WHITE, GREEN, AMBER, RED)
IND_FOUO_KEY = "fouo"  # Indicator fouo (True, False)
IND_SIGHTED_KEY = "sighted"  # Indicator sighted YYYY-MM-DD[THH:MM:SS]
IND_PHASE_KEY = "phase"  # Indicator (Delivery, Installation, ...)


class STIXHelper:
    def __init__(self, stix_type):
        """
        Constructor for class
        Forms a skeletal stix package
        @param stix_type - The type of STIX: xml or ais
        """
        self.DEBUG = False  # MKPMKP
        self.__version__ = os.getenv("VERSION")
        self.walker = None
        self.indicators = []

        # Change all id attributes from example to CISA
        cisa_ns = Namespace("http://www.us-cert.gov/nccic", "CISA")
        set_id_namespace(cisa_ns)

        datestamp = time.strftime("%Y-%m-%dT%H:%M:%S")
        self.stix_package = stix.core.STIXPackage(timestamp=datestamp)
        self.stix_header = stix.core.STIXHeader()
        self.stix_package.stix_header = self.stix_header

        # MKPISSUE Benign and Compromised not valid (causes exception)
        self.indicator_types = [
            "Malicious E-mail",
            "IP Watchlist",
            "Domain Watchlist",
            "URL Watchlist",
            "Malware Artifacts",
            "C2",
            "Anonymization",
            "Exfiltration",
            "Host Characteristics",
            "File Hash Watchlist",
            "Benign",
            "Compromised",
        ]
        # Not set in GUI
        #'Compromised PKI Certificate', 'Login Name',
        #'IMEI Watchlist', 'IMSI Watchlist']

        # Fixed 20150619-02/20150619-04 MKP
        self.kill_chains = [
            [
                1,
                "Reconnaissance",
                "stix:KillChainPhase-af1016d6-a744-4ed7-ac91-00fe2272185a",
            ],
            [
                2,
                "Weaponization",
                "stix:KillChainPhase-445b4827-3cca-42bd-8421-f2e947133c16",
            ],
            [3, "Delivery", "stix:KillChainPhase-79a0e041-9d5f-49bb-ada4-8322622b162d"],
            [
                4,
                "Exploitation",
                "stix:KillChainPhase-f706e4e7-53d8-44ef-967f-81535c9db7d0",
            ],
            [
                5,
                "Installation",
                "stix:KillChainPhase-e1e4e3f7-be3b-4b39-b80a-a593cfd99a4f",
            ],
            [
                6,
                "Command and Control",
                "stix:KillChainPhase-d6dc32b9-2538-4951-8733-3cb9ef1daae2",
            ],
            [
                7,
                "Actions on Objectives",
                "stix:KillChainPhase-786ca8f9-2d9a-4213-b38e-399af4a2e5d6",
            ],
        ]

        self.patterns = [
            [
                1,
                "Initial Access",
                "CISA:KillChainPhase-d7dcc502-4084-4f94-bbbf-082628eeab1f",
            ],
            [
                2,
                "Execution",
                "CISA:KillChainPhase-09de39a7-fd05-4650-9216-4676008644b9",
            ],
            [
                3,
                "Persistence",
                "CISA:KillChainPhase-ae90bca2-ef95-4007-8518-bcbdfe9aca8f",
            ],
            [
                4,
                "Privilege Escalation",
                "CISA:KillChainPhase-c2044d94-6fcb-40a8-bc93-31e9a64b3b31",
            ],
            [
                5,
                "Defense Evasion",
                "CISA:KillChainPhase-26903764-b2d4-4e67-94b7-85bd4702cc4a",
            ],
            [
                6,
                "Credential Access",
                "CISA:KillChainPhase-fd05b7de-702b-494b-93f1-4317ee4f8a3e",
            ],
            [
                7,
                "Discovery",
                "CISA:KillChainPhase-fbd6dd2f-5c07-4089-908d-3931eb27dfed",
            ],
            [
                8,
                "Lateral Movement",
                "CISA:KillChainPhase-c90a5d62-9f66-4a41-adef-ffa6cb2d2f94",
            ],
            [
                9,
                "Collection",
                "CISA:KillChainPhase-b9ee5299-93a2-4580-a100-ae7752cdfa3f",
            ],
            [
                10,
                "Command and Control",
                "CISA:KillChainPhase-5740037d-87bd-4825-a174-722f4db359bc",
            ],
            [
                11,
                "Exfiltration",
                "CISA:KillChainPhase-0db0901a-007c-452f-833a-b73e772b0dd0",
            ],
            [12, "Impact", "CISA:KillChainPhase-d3aaef09-1a3a-4b12-8edc-fc4a68d7e3e7"],
        ]

        # Set up reference kill_chain (once only)
        ttps = stix.core.ttps.TTPs()
        self.stix_package.ttps = ttps

        if stix_type == "xml":
            self.stix_package.ttps.kill_chains.append(self.kill_chain())
            self.stix_package.ttps.kill_chains.append(self.kill_chain_2())

    # End of __init__

    def log(the_string, reset=False):
        current_app.logger.info(the_string)
        # print(reset)

    # End of log

    def get_root(self):
        """
        Return the package reference object
        """
        if self.DEBUG:
            print("STIXHelper(200) entering get_root\n")
        return self.stix_package

    # End of getRoto

    def get_stix_version(self):
        """
        Get the stix version
        @returns<string> stix version, e.g., "1.1.1.0"
        """
        if self.DEBUG:
            print("STIXHelper(300) entering get_stix_version\n")
        return stix.__version__

    # End of get_stix_version

    def get_cybox_version(self):
        """
        Get the cybox version
        @returns<string> cybox version, e.g., "2.1.0.4"
        """
        if self.DEBUG:
            print("STIXHelper(400) entering get_cybox_version\n")
        return cybox.__version__

    # End of get_cybox_version

    def get_version(self):
        """
        Get the STIXHelper version
        @returns<string> STIXHelper version, e.g., "2.1.0.4"
        """
        if self.DEBUG:
            print("STIXHelper(500) entering get_version\n")
        return self.__version__

    # End of get_version

    def get_kill_chain_info(self, guid):
        """
        Returns common name given the phase number
        @param guid<string> Phase e.g., 79a0e041-9d5f-49bb-ada4-8322622b162d
        @return tuple of (ordinality, short name, KillChainBlock id)
        """
        order = 0
        name = ""
        kc_id = ""
        for i in range(0, 6):
            if self.kill_chains[i][2] == guid:
                order = self.kill_chains[i][0]
                name = self.kill_chains[i][1]
                kc_id = "stix:KillChain-af3e707f-2fb9-49e5-8c37-14026ca0a5ff"
        return order, name, kc_id

    # End of get_kill_chain_info

    def kill_chain(self):
        """
        Creates a stix:Kill_Chains reference block
        @returns chain<stix.common.kill_chains.kill_chain>
        """
        if self.DEBUG:
            print("STIXHelper(600) entering kill_chains\n")

        phases = []
        for item in self.kill_chains:
            phases.append(
                stix.common.kill_chains.KillChainPhase(
                    ordinality=item[0], phase_id=item[2], name=item[1]
                )
            )

        chain = stix.common.kill_chains.KillChain(
            id_="stix:KillChain-af3e707f-2fb9-49e5-8c37-14026ca0a5ff",
            name="LM Cyber Kill Chain",
        )
        chain.kill_chain_phases = phases
        chain.number_of_phases = 7
        chain.definer = "LMCO"
        chain.reference = "http://www.lockheedmartin.com/content/dam/lockheed/data/corporate/documents/LM-White-Paper-Intel-Driven-Defense.pdf"
        return chain

    # End of killChain

    def kill_chain_2(self):
        """
        Creates a CISA:Kill_Chains ATT&CK reference block
        @todo Can't find how to add definer, number_of_phases, reference
        @returns chain<stix.common.kill_chains.KillChain>
        """
        if self.DEBUG:
            print("STIXHelper(601) entering Patterns\n")

        phases = []
        for item in self.patterns:
            phases.append(
                stix.common.kill_chains.KillChainPhase(
                    ordinality=item[0], phase_id=item[2], name=item[1]
                )
            )

        chain = stix.common.kill_chains.KillChain(
            id_="CISA:KillChain-968782b1-64f0-4eab-8f85-ddf63cf0afbe",
            name="ATT&CK Tactics",
        )
        chain.kill_chain_phases = phases
        chain.number_of_phases = 12
        chain.definer = "MITRE"
        chain.reference = "https://attack.mitre.org/tactics/enterprise/"
        return chain

    # End of kill_chain_2

    def to_xml(self):
        """
        Return the current STIX object as xml
        @return<string> STIX xml
        """
        if self.DEBUG:
            print("STIXHelper(700) entering to_xml()\n")

        return self.stix_package.to_xml(
            pretty=True, encoding=None, include_schemalocs=True
        )

    # End of to_xml

    def gather(self, node=None):
        """
        Returns children from a node
        @param node<stix.indicator or cybox.objects>
        @return list of children
        """
        if self.DEBUG:
            print("STIXHelper(900) Entering, node=", type(node))
            print("STIXHelper(1000) Entering, node=", dir(node))

        rtn = []
        if node is None:
            for ind in self.stix_package.indicators:
                rtn.append(ind)
        elif "stix.indicator.indicator.Indicator" in str(node.__class__):
            if hasattr(node, "observable"):
                if hasattr(node.observable, "object_"):
                    if hasattr(node.observable.object_, "properties"):
                        rtn.append(node.observable.object_.properties)
        elif "cybox.objects." in str(node.__class__):
            rtn.append(node)

        if self.DEBUG:
            print("STIXHelper(1100) Exiting, len=", len(rtn))
        return rtn

    # End of gather

    def dump(self, indent, parent=None):
        """
        Display a dump of the current stix object
        @param index<int> Initially should be zero, control display indentation
        @param parent<stix obj> Initially should be None
        """
        if self.DEBUG:
            print(
                "STIXHelper(1200) Entering, indent=", indent, " parent=", type(parent)
            )

        top = False
        if parent is None:
            parent = self.stix_package.indicators
            top = True
            print("Main:   ", self.get_main())

        for ind in parent:
            # self.show_dictionary("top", ind.to_dict())
            the_dict = self.get_attributres(ind)
            ind_dict = {}
            obs_dict = {}
            for i in the_dict:
                if i in ["desc", "type", "tlp", "fouo", "sighted", "phase"]:
                    ind_dict[i] = the_dict[i]
                else:
                    obs_dict[i] = the_dict[i]
            spaces = ""
            for i in range(0, indent):
                spaces = spaces + "    "
            if ind_dict != {}:
                print(spaces + "Ind: ", ind_dict)
            print(spaces + "Obs: ", obs_dict)

            if top:
                offset = ind
                if hasattr(offset, "observable"):
                    offset = offset.observable
                if hasattr(offset, "object_"):
                    offset = offset.object_
                if hasattr(offset, "related_objects"):
                    offset = offset.related_objects
                self.dump(indent + 1, offset)
            else:
                offset = ind
                if hasattr(offset, "related_objects"):
                    offset = offset.related_objects
                    self.dump(indent + 1, offset)

    # End of dump

    def set_main(self, win_vars, stix_type):
        """
        Handle all attributes from the main GUI page (relates to stix_header)
        @param win_vars<dict> Contains key:value attributes from GUI
               Keys:  which, produced, tlp, docid, overview, fouo, doctitle,
                      composite, intent
        @param stix_type - String, type of STIX: xml or ais
        """
        tlp_set = ["RED", "WHITE", "GREEN", "AMBER"]
        con_set = ["EVERYONE", "NONE", "USG"]
        pro_set = ["false", "true"]
        sec_set = [
            "Government Facilities Sector",
            "Chemical Sector",
            "Commercial Facilities Sector",
            "Communications Sector",
            "Critical Manufacturing Sector",
            "Dams Sector",
            "Defense Industrial Base Sector",
            "Emergency Services Sector",
            "Energy Sector",
            "Financial Services Sector",
            "Food and Agriculture Sector",
            "Government Facilities Sector",
            "Healthcare and Public Health Sector",
            "Information Technology Sector",
            "Nuclear Reactors, Materials, and Waste Sector",
            "Transportation Systems Sector",
            "Water and Wastewater Systems Sector",
        ]
        if self.DEBUG:
            print("STIXHelper(1300) set_main: win_vars=", win_vars, "\n")

        if MAIN_DOCID_KEY in win_vars:
            self.stix_package.id_ = win_vars[MAIN_DOCID_KEY]
        if MAIN_TITLE_KEY in win_vars:
            self.stix_header.title = win_vars[MAIN_TITLE_KEY]
        if MAIN_OVERVIEW_KEY in win_vars:
            self.stix_header.description = win_vars[MAIN_OVERVIEW_KEY]
        ###################MKPATTACK#####################
        if MAIN_PATTERNS_KEY in win_vars:
            for item in win_vars[MAIN_PATTERNS_KEY]:
                ttp = TTP()
                ap = AttackPattern(title=item)
                ttp.behavior = Behavior()
                ttp.behavior.add_attack_pattern(ap)
                self.stix_package.add_ttp(ttp)
        ###################MKPATTACK#####################

        if MAIN_INTENT_KEY in win_vars:
            self.stix_header.package_intents = win_vars[MAIN_INTENT_KEY]
        do_tlp = False
        if MAIN_TLP_KEY in win_vars:
            if win_vars[MAIN_TLP_KEY] != "" and win_vars[MAIN_TLP_KEY] is not None:
                do_tlp = True
        if MAIN_PRODUCED_KEY in win_vars:
            # Fixed 20150611-02
            the_time = win_vars[MAIN_PRODUCED_KEY]
            if the_time.strip() != "":
                self.stix_header.information_source = stix.common.InformationSource()
                self.stix_header.information_source.time = cybox.common.Time()
                self.stix_header.information_source.time.produced_time = the_time
            marking_specification = stix.data_marking.MarkingSpecification()
            marking_specification.controlled_structure = "//node() | //@*"

            if stix_type == "ais":
                consent = "EVERYONE"
                org_name = "CISA"
                org_prop = True
                org_country = "US"
                org_admin = "US-DC"
                org_sector = "Government Facilities Sector"
                tlp = "RED"
                if do_tlp:
                    if win_vars[MAIN_TLP_KEY] in tlp_set:
                        tlp = win_vars[MAIN_TLP_KEY]
                if MAIN_CONSENT_KEY in win_vars:
                    if win_vars[MAIN_CONSENT_KEY] in con_set:
                        consent = win_vars[MAIN_CONSENT_KEY]
                if MAIN_NAME_KEY in win_vars:
                    org_name = win_vars[MAIN_NAME_KEY]
                if MAIN_PROP_KEY in win_vars:
                    if win_vars[MAIN_PROP_KEY] in pro_set:
                        if win_vars[MAIN_PROP_KEY] == "true":
                            org_prop = True
                        else:
                            org_prop = False
                if MAIN_CTRY_KEY in win_vars:
                    org_country = win_vars[MAIN_CTRY_KEY]
                if MAIN_ADMIN_KEY in win_vars:
                    org_admin = win_vars[MAIN_ADMIN_KEY]
                if MAIN_SECTOR_KEY in win_vars:
                    if win_vars[MAIN_SECTOR_KEY] in sec_set:
                        org_sector = win_vars[MAIN_SECTOR_KEY]
                try:
                    add_ais_marking(
                        self.stix_package,
                        org_prop,
                        consent,
                        tlp.upper(),
                        country_name_code=org_country,
                        country_name_code_type="ISO 3166-1 alpha-2",
                        admin_area_name_code=org_admin,
                        admin_area_name_code_type="ISO 3166-2",
                        organisation_name=org_name,
                        industry_type=[org_sector],
                    )
                except ValueError as e:
                    raise ValueError(f"Caught error: {e}")

                # Build the Tools tag with the Org Name as the value
                meta = Metadata()
                meta.value = org_name
                meta.country_name_code = org_country
                meta.country_name_code_type = "ISO 3166-1 alpha-2"

                datetime_obj = datetime.now()
                the_date = (str(datetime_obj)).replace(" ", "T")
                the_date = the_date[:-7] + "Z"
                tool = ToolInformation()

                tool.metadata.append(meta)
                info_source = InformationSource()
                info_source.tools = ToolInformationList(tool)

                contributing_sources = ContributingSources()
                contributing_sources.source.append(info_source)

                self.stix_header.information_source.contributing_sources = (
                    contributing_sources
                )
            else:
                if do_tlp:
                    tlp = stix.extensions.marking.tlp.TLPMarkingStructure()
                    tlp.color = win_vars[MAIN_TLP_KEY]

                tou = get_tlp(tlp.color)
                simple = stix.extensions.marking.terms_of_use_marking.TermsOfUseMarkingStructure(
                    tou
                )
                marking_specification.marking_structures.append(simple)
                marking_specification.marking_structures.append(tlp)

                do_fouo = False
                if MAIN_FOUO_KEY in win_vars:
                    if (
                        win_vars[MAIN_FOUO_KEY] == "1"
                        or win_vars[MAIN_FOUO_KEY] == True
                    ):
                        do_fouo = True
                if do_fouo:
                    warn = get_fouo()
                    simple = stix.extensions.marking.terms_of_use_marking.TermsOfUseMarkingStructure(
                        warn
                    )
                    marking_specification.marking_structures.append(simple)

                if do_tlp or do_fouo:
                    handling = stix.data_marking.Marking()
                    handling.add_marking(marking_specification)
                    self.stix_header.handling = handling

    # End of set_main

    def get_main(self):
        """
        Returns a dictionary of attributes for the given stix object reference
        @param parent<stix object> Parent xml node in which to attach indicator


                self.stix_header.information_source.time = cybox.common.Time()
                self.stix_header.information_source.time.produced_time = the_time
                #toolInformationList = cybox.common.ToolInformationList(entityList)
                #self.stix_header.information_source.tools(toolInformationList)

        #if 'composite' in win_vars and win_vars['composite'] in ("AND", "OR"):

        do_fouo = False
        if MAIN_FOUO_KEY in win_vars:
            if win_vars[MAIN_FOUO_KEY] == '1' or win_vars[MAIN_FOUO_KEY] == True:
                do_fouo = True
        if do_tlp or do_fouo:
            handling = stix.data_marking.Marking()


               if None, returns main (header) addtributes
        @returns <dict> Attributes associated with parent
        """
        if self.DEBUG:
            print("STIXHelper(1400) get_main: Entering")

        rtn = {}
        rtn[WHICH_KEY] = MAIN_WHICH_VALUE
        rtn[MAIN_DOCID_KEY] = self.stix_package.id_

        if self.stix_package.stix_header is not None:
            hdr_dict = self.stix_package.stix_header.to_dict()
            if "information_source" in hdr_dict:
                if "time" in hdr_dict["information_source"]:
                    if "produced_time" in hdr_dict["information_source"]["time"]:
                        rtn[MAIN_PRODUCED_KEY] = hdr_dict["information_source"]["time"][
                            "produced_time"
                        ]
            if "title" in hdr_dict:
                rtn[MAIN_TITLE_KEY] = hdr_dict["title"]
            if "description" in hdr_dict:
                rtn[MAIN_OVERVIEW_KEY] = hdr_dict["description"]
            for item in self.stix_package.stix_header.package_intents:
                if "Indicator" in str(item) or "Character" in str(item):
                    rtn[MAIN_INTENT_KEY] = str(item)
            if hasattr(self.stix_package.stix_header.handling, "markings"):
                for marking_spec in self.stix_package.stix_header.handling.markings:
                    for marking in marking_spec.marking_structures:
                        if hasattr(marking, "color"):
                            rtn[MAIN_TLP_KEY] = marking.color
                        elif hasattr(marking, "terms_of_use"):
                            if "FOUO" in marking.terms_of_use:
                                rtn[MAIN_FOUO_KEY] = True
        return rtn

    # End of get_main

    def show_object(self, label, node):
        """
        Debugging aid
        @param label<string> Display title
        @param node
        """
        print("==========" + label + "===============")
        the_dict = node.to_dict()
        print(json.dumps(the_dict, indent=1))
        print("=======================================")

    # ENd of show_object

    def show_dictionary(self, label, the_dict):
        """
        Debugging aid
        @param label<string> Display title
        """
        print("==========" + label + "===============")
        print(json.dumps(the_dict, indent=1))
        print("=======================================")

    # End of show_dictionary

    def extract(self, thekey, the_dict):
        """
        Get value associated with key from dictionary
        The dictionary encoding can vary
        @param thekey The key of the value to extract
        @param the_dict The dictionary to extract value from
        @return the value associated with key
        """
        rtn = ""
        if type(the_dict) is dict:
            if thekey in the_dict:
                rtn = the_dict[thekey]
                if type(rtn) is dict:
                    if "value" in rtn:
                        rtn = rtn["value"]
            elif "custom_properties" in the_dict:
                proplist = the_dict["custom_properties"]
                for item in proplist:
                    if "name" in item and "value" in item:
                        rtn = item["value"]
                        break
        return rtn

    # End of extract

    def get_attributres(self, parent):
        """
        Returns a dictionary of attributes for the given stix object reference
        Handles both indicator and observable attributes
        @todo  use key to extract all values then assign WHICH
        @param parent<stix object> Parent xml node in which to parse object
           if None, returns main (header) atttributes
           Expecting either a stix.indicator.indictor.Indicator or a
           cybox.objects... object
        @returns <dict> Attributes associated with parent; otherwise {}
        """
        rtn = {}

        if parent is None:
            print("get_attributres: parent is null")
            return rtn

        propdict = parent.to_dict()
        if self.DEBUG:
            print(
                "STIXHelper(1500): Top================>",
                type(parent),
                " ",
                parent.__class__,
                "\n",
            )
            print("STIXHelper(1600): Entering, ", parent.to_dict())
            print("STIXHelper(1700): ==>, ", dir(parent))
            if "id" in propdict:
                print("STIXHelper(1800) get_attributres: @@@==>, ", propdict["id"])

        offset = parent

        # Determine which type block and guid (indicator or an observable)
        if parent.__class__ == stix.indicator.indicator.Indicator:
            rtn[WHICH_KEY] = IND_WHICH_VALUE
            offset = offset.observable

            rtn = self.get_indicator(rtn, parent)
            propdict = parent.to_dict()
            if "id" in propdict:
                id = propdict["id"]
                if ":" in id:
                    compound_name = id.index(":")
                    if compound_name > 0:
                        id = id[compound_name + 1 :]
                rtn["id"] = id
        else:
            propdict = parent.to_dict()
            if parent.__class__ == cybox.objects.file_object.File:
                rtn[WHICH_KEY] = FILE_WHICH_VALUE
                value = self.extract("file_name", propdict)
                if value != "":
                    rtn[FILE_NAME_KEY] = value
                value = self.extract("file_path", propdict)
                if value != "":
                    rtn[FILE_PATH_KEY] = value
                value = self.extract("size_in_bytes", propdict)
                if value != "":
                    rtn[FILE_SIZE_KEY] = value
                # 20150610-01
                if "hashes" in propdict:
                    for item in propdict["hashes"]:
                        hash_type = (self.extract("type", item)).lower()
                        simple_hash = self.extract("simple_hash_value", item)
                        if simple_hash == "":
                            simple_hash = self.extract("fuzzy_hash_value", item)
                        if simple_hash != "":
                            rtn[hash_type] = simple_hash
            elif parent.__class__ == cybox.objects.email_message_object.EmailMessage:
                rtn[WHICH_KEY] = EMAIL_WHICH_VALUE
                if "header" in propdict:
                    obs = propdict["header"]
                    value = self.extract("subject", obs)
                    if value != "":
                        rtn[EMAIL_SUBJECT_KEY] = value
                    value = self.extract("x_mailer", obs)
                    if value != "":
                        rtn[EMAIL_XMAILER_KEY] = value
                    value = self.extract("message_id", obs)
                    if value != "":
                        rtn[EMAIL_MSGID_KEY] = value
                    if "from" in obs:
                        token = obs["from"]
                        if "address_value" in token:
                            rtn[EMAIL_FROM_KEY] = self.extract("address_value", token)
                        if (
                            self.extract("is_spoofed", token) == "true"
                            or self.extract("is_spoofed", token) == True
                        ):
                            rtn[EMAIL_SPOOFED_KEY] = True

                # Need attachments and links
                flist = []
                if "attachments" in propdict:
                    obj = propdict["attachments"]
                    for f in obj:
                        if "object_reference" in f:
                            flist.append(f["object_reference"])

                ulist = []
                if "links" in propdict:
                    obj = propdict["links"]
                    for u in obj:
                        if "object_reference" in u:
                            ulist.append(u["object_reference"])

                if len(flist) > 0:
                    rtn[EMAIL_ATTACH_KEY] = flist
                if len(ulist) > 0:
                    rtn[EMAIL_LINKS_KEY] = ulist
            elif parent.__class__ == cybox.objects.uri_object.URI:
                rtn[WHICH_KEY] = URL_WHICH_VALUE
                if "value" in propdict:
                    item = propdict["value"]
                    if "value" in item:
                        item = item["value"]
                    rtn[URL_VALUE_KEY] = item
            elif parent.__class__ == cybox.objects.link_object.Link:
                rtn[WHICH_KEY] = LINK_WHICH_VALUE
                if "value" in propdict:
                    item = propdict["value"]
                    if "value" in item:
                        item = item["value"]
                    rtn[LINK_URL_KEY] = item
                url_label = self.extract("url_label", propdict)
                if url_label != "":
                    rtn[LINK_NAME_KEY] = url_label
            elif parent.__class__ == cybox.objects.domain_name_object.DomainName:
                rtn[WHICH_KEY] = FQDN_WHICH_VALUE
                if "value" in propdict:
                    item = propdict["value"]
                    if "value" in item:
                        item = item["value"]
                    rtn[FQDN_VALUE_KEY] = item
            elif parent.__class__ == cybox.objects.address_object.Address:
                rtn[WHICH_KEY] = IPV4_WHICH_VALUE
                value = self.extract("address_value", propdict)
                if value != "":
                    rtn[IPV4_IP_KEY] = value
                # Fixed bug 20150609-02
                rtn[IPV4_SPOOFED_KEY] = False
                if (
                    self.extract("is_spoofed", propdict) == "true"
                    or self.extract("is_spoofed", propdict) == True
                ):
                    rtn[IPV4_SPOOFED_KEY] = True
            elif parent.__class__ == cybox.objects.mutex_object.Mutex:
                rtn[WHICH_KEY] = MUTEX_WHICH_VALUE
                value = self.extract("name", propdict)
                if value != "":
                    rtn[MUTEX_VALUE_KEY] = value
            elif (
                parent.__class__ == cybox.objects.win_registry_key_object.WinRegistryKey
            ):
                rtn[WHICH_KEY] = REG_WHICH_VALUE
                value = self.extract("hive", propdict)
                if value != "":
                    rtn[REG_HIVE_KEY] = value
                value = self.extract("key", propdict)
                if value != "":
                    rtn[REG_KEY_KEY] = value
                if "values" in propdict:
                    for item in propdict["values"]:
                        value = self.extract("name", item)
                        if value != "":
                            rtn[REG_NAME_KEY] = value
                        value = self.extract("data", item)
                        if value != "":
                            rtn[REG_DATA_KEY] = value
            elif (
                parent.__class__
                == cybox.objects.network_connection_object.NetworkConnection
            ):
                rtn[WHICH_KEY] = NETCON_WHICH_VALUE
                if "source_socket_address" in propdict:
                    offset = propdict["source_socket_address"]
                    if "ip_address" in offset:
                        if "address_value" in offset["ip_address"]:
                            item = offset["ip_address"]["address_value"]
                            if "value" in item:
                                rtn[NETCON_SOURCE_KEY] = item["value"]
                            else:
                                rtn[NETCON_SOURCE_KEY] = item
                        ipaddr = offset["ip_address"]
                        if (
                            self.extract("is_spoofed", ipaddr) == "true"
                            or self.extract("is_spoofed", ipaddr) == True
                        ):
                            rtn[NETCON_SSPOOFED_KEY] = True
                    if "port" in offset:
                        if "port_value" in offset["port"]:
                            item = offset["port"]["port_value"]
                            if type(item) == type({}):
                                rtn[NETCON_SPORT_KEY] = item["value"]
                            else:
                                rtn[NETCON_SPORT_KEY] = item
                        if "layer4_protocol" in offset["port"]:
                            if "value" in offset["port"]["layer4_protocol"]:
                                rtn[NETCON_SPROTO_KEY] = offset["port"][
                                    "layer4_protocol"
                                ]["value"]
                            else:
                                rtn[NETCON_SPROTO_KEY] = offset["port"][
                                    "layer4_protocol"
                                ]
                if "destination_socket_address" in propdict:
                    offset = propdict["destination_socket_address"]
                    if "ip_address" in offset:
                        if "address_value" in offset["ip_address"]:
                            item = offset["ip_address"]["address_value"]
                            if "value" in item:
                                rtn[NETCON_DEST_KEY] = item["value"]
                            else:
                                rtn[NETCON_DEST_KEY] = item
                        ipaddr = offset["ip_address"]
                        if (
                            self.extract("is_spoofed", ipaddr) == "true"
                            or self.extract("is_spoofed", ipaddr) == True
                        ):
                            rtn[NETCON_DSPOOFED_KEY] = True
                    if "port" in offset:
                        if "port_value" in offset["port"]:
                            item = offset["port"]["port_value"]
                            if type(item) == type({}):
                                rtn[NETCON_DPORT_KEY] = item["value"]
                            else:
                                rtn[NETCON_DPORT_KEY] = item
                        if "layer4_protocol" in offset["port"]:
                            if "value" in offset["port"]["layer4_protocol"]:
                                rtn[NETCON_DPROTO_KEY] = offset["port"][
                                    "layer4_protocol"
                                ]["value"]
                            else:
                                rtn[NETCON_DPROTO_KEY] = offset["port"][
                                    "layer4_protocol"
                                ]
            elif parent.__class__ == cybox.objects.http_session_object.HTTPSession:
                rtn[WHICH_KEY] = UA_WHICH_VALUE
                found_list = self.finditem(propdict, "user_agent")
                for token in found_list:
                    if type(token) == type({}):
                        rtn[UA_VALUE_KEY] = token["value"]
                    else:
                        rtn[UA_VALUE_KEY] = token

        if "id" in propdict:
            id = propdict["id"]
            if ":" in id:
                compound_name = id.index(":")
                if compound_name > 0:
                    id = id[compound_name + 1 :]
            rtn["id"] = id

        if self.DEBUG:
            print("STIXHelper(1900) ", rtn)
            print("STIXHelper(2000) ", offset.to_dict())
        return rtn

    # End of get_attributres

    def import_stix(self, filename):
        """
        Takes a stix xml file and reads it in, assigns to internal stix object
        @param filename<string> filename and optional path of xml file
        @status<bool> True if successful; otherwise False
        """
        if self.DEBUG:
            print("STIXHelper(2500) import_stix: filename=", filename, "\n")

        status = False
        if os.path.isfile(filename):
            try:
                self.stix_package = stix.core.stix_package.STIXPackage.from_xml(
                    filename
                )
                # MKPMKP
                if self.DEBUG:
                    print("STIXHelper(2501) import_stix:")
                    print(self.show_dictionary("DUMP", self.stix_package.to_dict()))
                docid = self.stix_package.id_

                if docid is None:
                    docid = filename

                if docid is not None:
                    if ":" in docid:
                        compound_name = docid.index(":")
                        if compound_name > 0:
                            docid = docid[compound_name + 1 :]
                            self.stix_package.id_ = docid
                status = True
            except:
                e = sys.exc_info()[0]
                if self.DEBUG:
                    print("STIXHelper(3000): stix parse error on '" + filename + "'", e)
                raise
        else:
            print("STIXHelper(3100): filename '" + filename + "' was not found!")
        return status

    # End of import_stix

    def create_fqdn(self, win_vars, parent, guid, stix_type, update=False):
        """
        Creates a new observable and subordinates to indicator
        FQDN is Fully Qualified Domain Name
        If root: node is Observable and parent is Indicator
        If sub:  node is Observable and parent is Observable
        @param win_vars<dict> Contains key:value attributes from GUI
               keys:  fqdn, related
        @param parent<cybox.objects.*> Null if root level
        @param stix_type - The type of STIX: xml or ais
        @param update<bool> False(default) if new; True if updating
        @return observable reference
        """
        if self.DEBUG:
            print(
                "STIXHelper(3200) set_fqdn: vars=",
                win_vars,
                " guid=",
                guid,
                " parent=",
                type(parent),
                parent.to_dict(),
                "\n",
            )
            print("STIXHelper(3210) set_fqdn: ", dir(parent))

        if stix_type == "xml":
            parent.title = "Malicious FQDN Indicator"

        node = cybox.objects.domain_name_object.DomainName()
        if FQDN_VALUE_KEY in win_vars:
            node.value = win_vars[FQDN_VALUE_KEY]
            node.value.condition = "Equals"
        node.type_ = "FQDN"
        if parent.__class__ == stix.indicator.indicator.Indicator:
            if not update:
                obj = cybox.core.Object(node)
                obj.id_ = guid
                obs = cybox.core.Observable(obj)
                parent.add_observable(obs)
            if self.DEBUG:
                print("STIXHelper::set_fqdn: FQDN")
        else:
            if self.DEBUG:
                print("STIXHelper(3300) set_fqdn: SubFQDN")
                print("STIXHelper(3300) set_fqdn: SubFQDN ", win_vars)

        if RELATED_KEY in win_vars and win_vars[RELATED_KEY] != "":
            if not update:
                parent.add_related(node, win_vars[RELATED_KEY], inline=True)

        return node

    # End of create_fqdn

    def create_mutex(self, win_vars, parent, guid, stix_type, update=False):
        """
        Creates a new observable attached to given node
        If root: node is Observable and parent is Indicator
        If sub:  node is Observable and parent is Observable
        @param win_vars<dict> Contains key:value attributes from GUI
               Keys:  mutex, related
        @param parent<stix.core.stix_package.STIXPackage> attaches indicator to
        @param stix_type - The type of STIX: xml or ais
        @param update<bool> False(default) if new; True if updating
        @return observable reference
        """
        if self.DEBUG:
            print(
                "STIXHelper(4800) setMutex: vars=",
                win_vars,
                " guid=",
                guid,
                " parent=",
                type(parent),
                parent.to_dict(),
                "\n",
            )
            print("STIXHelper(4810) setMutex: ", dir(parent))

        if stix_type == "xml":
            parent.title = "Malicious Mutex Indicator"

        node = cybox.objects.mutex_object.Mutex()
        if MUTEX_VALUE_KEY in win_vars:
            node.name = win_vars[MUTEX_VALUE_KEY]
            node.name.condition = "Equals"
        if parent.__class__ == stix.indicator.indicator.Indicator:
            if not update:
                obj = cybox.core.Object(node)
                obj.id_ = guid
                obs = cybox.core.Observable(obj)
                parent.add_observable(obs)
            if self.DEBUG:
                print("STIXHelper(4900) setMutex: Mutex")
        else:
            if self.DEBUG:
                print("STIXHelper(5000) setMutex: subMutex")

        if RELATED_KEY in win_vars and win_vars[RELATED_KEY] != "":
            if not update:
                parent.add_related(node, win_vars[RELATED_KEY], inline=True)

        return node

    # End of create_mutex

    def create_ipv4(self, win_vars, parent, guid, stix_type, update=False):
        """
        Creates a new observable attached to given node
        If root: node is Observable and parent is Indicator
        If sub:  node is Observable and parent is Observable
        @param win_vars<dict> Contains key:value attributes from GUI
               Keys:  ip, spoofed, related
        @param parent<stix.core.stix_package.STIXPackage> attaches indicator to
        @param stix_type - The type of STIX: xml or ais
        @param update<bool> False(default) if new; True if updating
        @return observable reference
        """
        if self.DEBUG:
            print(
                "STIXHelper(3700) setIPv4: vars=",
                win_vars,
                " guid=",
                guid,
                " parent=",
                type(parent),
                "\n",
            )

        if stix_type == "xml":
            parent.title = "Malicious IPv4 Indicator"

        node = cybox.objects.address_object.Address()
        if IPV4_IP_KEY in win_vars:
            node.address_value = win_vars[IPV4_IP_KEY]
            node.address_value.condition = "Equals"
            node.category = cybox.objects.address_object.Address.CAT_IPV4

        # Fixed BUG 20150609-02
        node.is_spoofed = False
        if IPV4_SPOOFED_KEY in win_vars:
            if (win_vars[IPV4_SPOOFED_KEY] == True) or (
                win_vars[IPV4_SPOOFED_KEY] == "1"
            ):
                node.is_spoofed = True
        if parent.__class__ == stix.indicator.indicator.Indicator:
            if not update:
                obj = cybox.core.Object(node)
                obj.id_ = guid
                obs = cybox.core.Observable(obj)
                parent.add_observable(obs)
            if self.DEBUG:
                print("STIXHelper(3800) create_ipv4: IPv4")
        else:
            if self.DEBUG:
                print("STIXHelper(3900) create_ipv4: subIPv4")

        if RELATED_KEY in win_vars and win_vars[RELATED_KEY] != "":
            if not update:
                parent.add_related(node, win_vars[RELATED_KEY], inline=True)

        if self.DEBUG:
            print("STIXHelper(4000) setIPv4: node=", node.to_dict())

        return node

    # End of create_ipv4

    def create_ipv6(self, win_vars, parent, guid, stix_type, update=False):
        """
        Creates a new observable attached to given node
        If root: node is Observable and parent is Indicator
        If sub:  node is Observable and parent is Observable
        @param win_vars<dict> Contains key:value attributes from GUI
               Keys:  ip, spoofed, related
        @param parent<stix.core.stix_package.STIXPackage> attaches indicator to
        @param stix_type - The type of STIX: xml or ais
        @param update<bool> False(default) if new; True if updating
        @return observable reference
        """
        if self.DEBUG:
            print(
                "STIXHelper(3701) setIPv6: vars=",
                win_vars,
                " guid=",
                guid,
                " parent=",
                type(parent),
                "\n",
            )

        if stix_type == "xml":
            parent.title = "Malicious IPv6 Indicator"

        node = cybox.objects.address_object.Address()
        if IPV6_IP_KEY in win_vars:
            node.address_value = win_vars[IPV6_IP_KEY]
            node.address_value.condition = "Equals"
            node.category = cybox.objects.address_object.Address.CAT_IPV6

        # Fixed BUG 20150609-02
        node.is_spoofed = False
        if IPV6_SPOOFED_KEY in win_vars:
            if (win_vars[IPV6_SPOOFED_KEY] == True) or (
                win_vars[IPV6_SPOOFED_KEY] == "1"
            ):
                node.is_spoofed = True
        if parent.__class__ == stix.indicator.indicator.Indicator:
            if not update:
                obj = cybox.core.Object(node)
                obj.id_ = guid
                obs = cybox.core.Observable(obj)
                parent.add_observable(obs)
            if self.DEBUG:
                print("STIXHelper(3801) create_ipv6: IPv6")
        else:
            if self.DEBUG:
                print("STIXHelper(3901) create_ipv6: subIPv6")

        if RELATED_KEY in win_vars and win_vars[RELATED_KEY] != "":
            if not update:
                parent.add_related(node, win_vars[RELATED_KEY], inline=True)

        if self.DEBUG:
            print("STIXHelper(4001) setIPv6: node=", node.to_dict())

        return node

    # End of create_ipv6

    def create_email(self, win_vars, parent, guid, stix_type, update=False):
        """
        Creates a new observable attached to given node
        If root: node is Observable and parent is Indicator
        If sub:  node is Observable and parent is Observable
        @param win_vars<dict> Contains key:value attributes from GUI
               Keys:  sfrom, sspoofed, subject, msgid, xmailer,
                      attachments, links, related
        @param parent<cybox.objects.*> Null if root level
        @param stix_type - The type of STIX: xml or ais
        @param update<bool> False(default) if new; True if updating
        @return observable reference
        """
        if self.DEBUG:
            print(
                "STIXHelper(3400) setEmail: vars=",
                win_vars,
                " guid=",
                guid,
                " parent=",
                type(parent),
                "\n",
            )

        if stix_type == "xml":
            parent.title = "Malicious E-mail Indicator"

        node = cybox.objects.email_message_object.EmailMessage()
        node.header = cybox.objects.email_message_object.EmailHeader()
        if EMAIL_FROM_KEY in win_vars and win_vars[EMAIL_FROM_KEY] != "":
            node.header.from_ = win_vars[EMAIL_FROM_KEY]
            node.header.from_.condition = "Equals"
        if EMAIL_SPOOFED_KEY in win_vars and win_vars[EMAIL_SPOOFED_KEY] != "":
            if node.from_ is not None:
                node.from_.is_spoofed = win_vars[EMAIL_SPOOFED_KEY]
        if EMAIL_MSGID_KEY in win_vars and win_vars[EMAIL_MSGID_KEY] != "":
            node.message_id = win_vars[EMAIL_MSGID_KEY]
            node.message_id.condition = "Equals"
        if EMAIL_SUBJECT_KEY in win_vars and win_vars[EMAIL_SUBJECT_KEY] != "":
            item = win_vars[EMAIL_SUBJECT_KEY]
            node.header.subject = item
            node.header.subject.condition = "Equals"
        if EMAIL_XMAILER_KEY in win_vars and win_vars[EMAIL_XMAILER_KEY] != "":
            node.header.x_mailer = win_vars[EMAIL_XMAILER_KEY]
            node.header.x_mailer.condition = "Equals"

        if EMAIL_ATTACH_KEY in win_vars:
            # print("EMAIL_ATTACH: ",type(win_vars[EMAIL_ATTACH_KEY]))
            file_list = win_vars[EMAIL_ATTACH_KEY]
            if len(file_list) > 0:
                node.attachments = cybox.objects.email_message_object.Attachments()
                for fn in file_list:
                    f = cybox.objects.file_object.File()
                    f.file_name = fn
                    f.file_name.condition = "Equals"
                    node.add_related(f, "Contains", inline=True)
                    node.attachments.append(fn)

        if EMAIL_LINKS_KEY in win_vars and type(win_vars[EMAIL_LINKS_KEY]) is list:
            # print("EMAIL LINKS")
            links_list = win_vars[EMAIL_LINKS_KEY]
            if len(links_list) > 0:
                node.links = cybox.objects.email_message_object.Links()
                for link in links_list:
                    uri = cybox.objects.uri_object.URI(
                        link, cybox.objects.uri_object.URI.TYPE_URL
                    )
                    uri.value.condition = "Equals"
                    node.add_related(uri, "Contains", inline=True)
                    node.links.append(link)

        if parent.__class__ == stix.indicator.indicator.Indicator:
            if not update:
                obj = cybox.core.Object(node)
                obj.id_ = guid
                obs = cybox.core.Observable(obj)
                parent.add_observable(obs)
            if self.DEBUG:
                print("STIXHelper::setEmail: Email")
        else:
            if self.DEBUG:
                print("STIXHelper::setEmail: SubEmail")

        if RELATED_KEY in win_vars and win_vars[RELATED_KEY] != "":
            if not update:
                parent.add_related(node, win_vars[RELATED_KEY], inline=True)

        return node

    # End of create_email

    def create_file(self, win_vars, parent, guid, stix_type, update=False):
        """
        Creates a new observable attached to given node
        If root: node is Observable and parent is Indicator
        If sub:  node is Observable and parent is Observable
        @param win_vars<dict> Contains key:value attributes from GUI
               Keys:  filename, path, size, md5, sha1, sha256, sha512, ssdeep, related
        @param node<stix.indicator.indicator.Indicator> parent node
        @param parent<cybox.objects.*> Null if root level
        @param stix_type - The type of STIX: xml or ais
        @param update<bool> False(default) if new; True if updating
        @return observable reference
        """
        if self.DEBUG:
            print(
                "STIXHelper(3500) setFile: vars=",
                win_vars,
                " guid=",
                guid,
                " parent=",
                type(parent),
                "\n",
            )

        if stix_type == "xml":
            parent.title = "Malicious File Indicator"

        node = cybox.objects.file_object.File()
        if FILE_NAME_KEY in win_vars and win_vars[FILE_NAME_KEY] != "":
            node.file_name = win_vars[FILE_NAME_KEY]
            node.file_name.condition = "Equals"

        if FILE_PATH_KEY in win_vars and win_vars[FILE_PATH_KEY] != "":
            node.file_path = win_vars[FILE_PATH_KEY]
            node.file_path.condition = "Equals"
        if FILE_SIZE_KEY in win_vars and win_vars[FILE_SIZE_KEY] != "":
            try:
                node.size = win_vars[FILE_SIZE_KEY]
                node.size.condition = "Equals"
            except:
                print("setFile: bad filesize")

        # MKPMKP v1.1d ssdeep fix--------
        if FILE_MD5_KEY in win_vars and win_vars[FILE_MD5_KEY] != "":
            h = cybox.common.Hash()
            h.simple_hash_value = win_vars[FILE_MD5_KEY]
            h.simple_hash_value.condition = "Equals"
            h.type_ = cybox.common.hashes.Hash.TYPE_MD5
            h.type_.condition = "Equals"
            node.add_hash(h)
        if FILE_SHA1_KEY in win_vars and win_vars[FILE_SHA1_KEY] != "":
            h = cybox.common.Hash()
            h.simple_hash_value = win_vars[FILE_SHA1_KEY]
            h.simple_hash_value.condition = "Equals"
            h.type_ = cybox.common.hashes.Hash.TYPE_SHA1
            h.type_.condition = "Equals"
            node.add_hash(h)
        if FILE_SHA256_KEY in win_vars and win_vars[FILE_SHA256_KEY] != "":
            h = cybox.common.Hash()
            h.simple_hash_value = win_vars[FILE_SHA256_KEY]
            h.simple_hash_value.condition = "Equals"
            h.type_ = cybox.common.hashes.Hash.TYPE_SHA256
            h.type_.condition = "Equals"
            node.add_hash(h)
        if FILE_SHA512_KEY in win_vars and win_vars[FILE_SHA512_KEY] != "":
            h = cybox.common.Hash()
            h.simple_hash_value = win_vars[FILE_SHA512_KEY]
            h.simple_hash_value.condition = "Equals"
            h.type_ = cybox.common.hashes.Hash.TYPE_SHA512
            h.type_.condition = "Equals"
            node.add_hash(h)
        if FILE_SSDEEP_KEY in win_vars and win_vars[FILE_SSDEEP_KEY] != "":
            h = cybox.common.Hash()
            h.fuzzy_hash_value = win_vars[FILE_SSDEEP_KEY]
            h.fuzzy_hash_value.condition = "Equals"
            h.type_ = cybox.common.hashes.Hash.TYPE_SSDEEP
            h.type_.condition = "Equals"
            node.add_hash(h)
        if parent.__class__ == stix.indicator.indicator.Indicator:
            if not update:
                obj = cybox.core.Object(node)
                obj.id_ = guid
                obs = cybox.core.Observable(obj)
                parent.add_observable(obs)
            if self.DEBUG:
                print("STIXHelper::setFile: File")
        else:
            if self.DEBUG:
                print("STIXHelper(3600) setFile: SubFile")

            if RELATED_KEY in win_vars and win_vars[RELATED_KEY] != "":
                if not update:
                    parent.add_related(node, win_vars[RELATED_KEY], inline=True)
        return node

    # End of create_file

    def create_link(self, win_vars, parent, guid, stix_type, update=False):
        """
        Creates a new observable attached to given node
        @param win_vars<dict> Contains key:value attributes from GUI
               Keys:  url, name, related
        @param parent<stix.core.stix_package.STIXPackage> attaches indicator to
        @param stix_type - The type of STIX: xml or ais
        @param update<bool> False(default) if new; True if updating
        @return observable reference
        """
        if self.DEBUG:
            print(
                "STIXHelper(4100) setLink: vars=",
                win_vars,
                " guid=",
                guid,
                " parent=",
                type(parent),
                "\n",
            )

        if stix_type == "xml":
            parent.title = "Malicious Link Indicator"

        node = cybox.objects.link_object.Link()
        # Below is okay, now wrap in cybox:Properties
        if LINK_URL_KEY in win_vars:
            node.value = win_vars[LINK_URL_KEY]
            node.value.condition = "Equals"
            node.type = cybox.objects.uri_object.URI.TYPE_URL
        if LINK_NAME_KEY in win_vars:
            node.url_label = win_vars[LINK_NAME_KEY]
            node.url_label.condition = "Equals"
            node.type = cybox.objects.uri_object.URI.TYPE_URL

        if parent.__class__ == stix.indicator.indicator.Indicator:
            if not update:
                obj = cybox.core.Object(node)
                obj.id_ = guid
                obs = cybox.core.Observable(obj)
                parent.add_observable(obs)
            if self.DEBUG:
                print("STIXHelper(4200) setLink: Link")
        else:
            if self.DEBUG:
                print("STIXHelper(4300) setLink: subLink")

        if RELATED_KEY in win_vars and win_vars[RELATED_KEY] != "":
            if not update:
                parent.add_related(node, win_vars[RELATED_KEY], inline=True)

        return node

    # End of create_link

    def create_url(self, win_vars, parent, guid, stix_type, update=False):
        """
        Creates a new observable attached to given node
        If root: node is Observable and parent is Indicator
        If sub:  node is Observable and parent is Observable
        @param win_vars<dict> Contains key:value attributes from GUI
               Keys:  url, related
        @param stix_type - The type of STIX: xml or ais
        @param update<bool> False(default) if new; True if updating
        @return observable reference
        """
        if self.DEBUG:
            print(
                "STIXHelper(4500) setUrl: vars=",
                win_vars,
                " guid=",
                guid,
                " parent=",
                type(parent),
                "\n",
            )

        if stix_type == "xml":
            parent.title = "Malicious URL Indicator"

        node = cybox.objects.uri_object.URI()

        if URL_VALUE_KEY in win_vars:
            node.value = win_vars[URL_VALUE_KEY]
            node.value.condition = "Equals"
            node.type_ = cybox.objects.uri_object.URI.TYPE_URL
            node.condition = "Equals"
        if parent.__class__ == stix.indicator.indicator.Indicator:
            if not update:
                obj = cybox.core.Object(node)
                obj.id_ = guid
                obs = cybox.core.Observable(obj)
                parent.add_observable(obs)
            if self.DEBUG:
                print("STIXHelper(4600) setUrl: Url")
        else:
            if self.DEBUG:
                print("STIXHelper(4700) setUrl: subUrl")

        if RELATED_KEY in win_vars and win_vars[RELATED_KEY] != "":
            if not update:
                parent.add_related(node, win_vars[RELATED_KEY], inline=True)

        return node

    # End of create_url

    def create_netcon(self, win_vars, parent, guid, stix_type, update=False):
        """
        Creates a new observable attached to given node
        If root: node is Observable and parent is Indicator
        If sub:  node is Observable and parent is Observable
        @param win_vars<dict> Contains key:value attributes from GUI
               Keys:  source, sspoofed, sport, sproto, destination, dport, dproto
        @param parent<stix.core.stix_package.STIXPackage> attaches indicator to
        @param stix_type - The type of STIX: xml or ais
        @param update<bool> False(default) if new; True if updating
        @return observable reference
        """
        if self.DEBUG:
            print(
                "STIXHelper(5100) setNetcon: vars=",
                win_vars,
                " guid=",
                guid,
                " parent=",
                type(parent),
                "\n",
            )

        node = cybox.objects.network_connection_object.NetworkConnection()
        if parent.__class__ == stix.indicator.indicator.Indicator:
            if stix_type == "xml":
                parent.title = "Malicious Network Connection Indicator"

            if not update:
                parent.add_observable(node)
            if self.DEBUG:
                print("STIXHelper(5200) setNetcon: Netcon")
        else:
            if self.DEBUG:
                print("STIXHelper(5300) setNetcon: subNetcon")

        if RELATED_KEY in win_vars and win_vars[RELATED_KEY] != "":
            if not update:
                parent.add_related(node, win_vars[RELATED_KEY], inline=True)

        src_addr = cybox.objects.socket_address_object.SocketAddress()
        dst_addr = cybox.objects.socket_address_object.SocketAddress()

        # Source
        src_ip = cybox.objects.address_object.Address()
        if NETCON_SPORT_KEY in win_vars or NETCON_SPROTO_KEY in win_vars:
            sport = cybox.objects.port_object.Port()
            if NETCON_SPORT_KEY in win_vars and win_vars[NETCON_SPORT_KEY] != "":
                sport.port_value = win_vars[NETCON_SPORT_KEY]
                sport.port_value.condition = "Equals"
            if NETCON_SPROTO_KEY in win_vars and win_vars[NETCON_SPROTO_KEY] != "":
                sport.layer4_protocol = win_vars[NETCON_SPROTO_KEY]
                sport.layer4_protocol.condition = "Equals"
            src_addr.port = sport
        if NETCON_SOURCE_KEY in win_vars and win_vars[NETCON_SOURCE_KEY] != "":
            src_ip.category = "ipv4-addr"
            src_ip.is_source = True
            src_ip.address_value = win_vars[NETCON_SOURCE_KEY]
            src_ip.address_value.condition = "Equals"
        if NETCON_SSPOOFED_KEY in win_vars:
            if (win_vars[NETCON_SSPOOFED_KEY] == True) or (
                win_vars[NETCON_SSPOOFED_KEY] == "1"
            ):
                src_ip.is_spoofed = True
            else:
                src_ip.is_spoofed = False
        src_addr.ip_address = src_ip

        # Destination
        dst_ip = cybox.objects.address_object.Address()
        if NETCON_DPORT_KEY in win_vars or NETCON_DPROTO_KEY in win_vars:
            dport = cybox.objects.port_object.Port()
            if NETCON_DPORT_KEY in win_vars and win_vars[NETCON_DPORT_KEY] != "":
                dport.port_value = win_vars[NETCON_DPORT_KEY]
                dport.port_value.condition = "Equals"
            if NETCON_DPROTO_KEY in win_vars and win_vars[NETCON_DPROTO_KEY] != "":
                dport.layer4_protocol = win_vars[NETCON_DPROTO_KEY]
                dport.layer4_protocol.condition = "Equals"
            dst_addr.port = dport
        if NETCON_DEST_KEY in win_vars and win_vars[NETCON_DEST_KEY] != "":
            dst_ip.category = "ipv4-addr"
            dst_ip.is_source = False
            dst_ip.address_value = win_vars[NETCON_DEST_KEY]
            dst_ip.address_value.condition = "Equals"
        if NETCON_DSPOOFED_KEY in win_vars:
            if (win_vars[NETCON_DSPOOFED_KEY] == True) or (
                win_vars[NETCON_DSPOOFED_KEY] == "1"
            ):
                dst_ip.is_spoofed = True
            else:
                dst_ip.is_spoofed = False
        dst_addr.ip_address = dst_ip

        # Attach src/dst to connection
        node.source_socket_address = src_addr
        node.destination_socket_address = dst_addr

        return node

    # ENd of create_netcon

    def create_user_agent(self, win_vars, parent, guid, stix_type, update=False):
        """
        Creates a new observable attached to given node
        If root: node is Observable and parent is Indicator
        If sub:  node is Observable and parent is Observable
        @param win_vars<dict> Contains key:value attributes from GUI
               Keys:  useragent, related
        @param stix_type - The type of STIX: xml or ais
        @param update<bool> False(default) if new; True if updating
        @return observable reference
        """
        if self.DEBUG:
            print(
                "STIXHelper(5400) setUserAgent: vars=",
                win_vars,
                " guid=",
                guid,
                " parent=",
                type(parent),
                "\n",
            )

        if stix_type == "xml":
            parent.title = "Malicious User-Agent Indicator"

        node = cybox.objects.http_session_object.HTTPSession()
        # Add UA
        if UA_VALUE_KEY in win_vars:
            fields = cybox.objects.http_session_object.HTTPRequestHeaderFields()
            fields.user_agent = win_vars[UA_VALUE_KEY]
            fields.user_agent.condition = "Equals"
            header = cybox.objects.http_session_object.HTTPRequestHeader()
            header.parsed_header = fields
            request = cybox.objects.http_session_object.HTTPClientRequest()
            request.http_request_header = header
            req_res = cybox.objects.http_session_object.HTTPRequestResponse()
            req_res.http_client_request = request
            node.http_request_response = [req_res]
        if parent.__class__ == stix.indicator.indicator.Indicator:
            if not update:
                obj = cybox.core.Object(node)
                obj.id_ = guid
                obs = cybox.core.Observable(obj)
                parent.add_observable(obs)
            if self.DEBUG:
                print("STIXHelper(5500) setUserAgent: UserAgent")
        else:
            if self.DEBUG:
                print("STIXHelper(5600) setUserAgent: subUserAgent")

        if RELATED_KEY in win_vars and win_vars[RELATED_KEY] != "":
            if not update:
                parent.add_related(node, win_vars[RELATED_KEY], inline=True)

        return node

    # End create_user_agent

    def create_registry(self, win_vars, parent, guid, stix_type, update=False):
        """
        Creates a new observable attached to given node
        If root: node is Observable and parent is Indicator
        If sub:  node is Observable and parent is Observable
        @param win_vars<dict> Contains key:value attributes from GUI
               Keys:  hive, key, name, data, related
        @param node<stix.indicator.indicator.Indicator> parent node
        @param top<bool> True if top level; otherwise sub-observable
        @param stix_type - The type of STIX: xml or ais
        @param update<bool> False(default) if new; True if updating
        @return observable reference
        """
        if self.DEBUG:
            print(
                "STIXHelper(6000) setRegistry: vars=",
                win_vars,
                " guid=",
                guid,
                " parent=",
                type(parent),
                "\n",
            )

        if stix_type == "xml":
            parent.title = "Malicious Registry Indicator"

        node = cybox.objects.win_registry_key_object.WinRegistryKey()
        if REG_HIVE_KEY in win_vars and win_vars[REG_HIVE_KEY] != "":
            node.hive = win_vars[REG_HIVE_KEY]
            node.hive.condition = "Equals"
        if REG_KEY_KEY in win_vars and win_vars[REG_KEY_KEY] != "":
            node.key = win_vars[REG_KEY_KEY]
            node.key.condition = "Equals"
        if REG_NAME_KEY in win_vars or REG_DATA_KEY in win_vars:
            val = cybox.objects.win_registry_key_object.RegistryValue()
            if REG_NAME_KEY in win_vars and win_vars[REG_NAME_KEY] != "":
                val.name = win_vars[REG_NAME_KEY]
                val.name.condition = "Equals"
            if REG_DATA_KEY in win_vars and win_vars[REG_DATA_KEY] != "":
                val.data = win_vars[REG_DATA_KEY]
                val.data.condition = "Equals"
            node.values = cybox.objects.win_registry_key_object.RegistryValues(val)

        if parent.__class__ == stix.indicator.indicator.Indicator:
            if not update:
                obj = cybox.core.Object(node)
                obj.id_ = guid
                obs = cybox.core.Observable(obj)
                parent.add_observable(obs)
            if self.DEBUG:
                print("STIXHelper(6100) setRegistry: Registry")
        else:
            if self.DEBUG:
                print("STIXHelper(6200) setRegistry: subRegistry")

        if RELATED_KEY in win_vars and win_vars[RELATED_KEY] != "":
            if not update:
                parent.add_related(node, win_vars[RELATED_KEY], inline=True)

        return node

    # End create_registry

    def get_indicator(self, rtn, parent):
        """
        This is a private method called on only top level indicators
        Reads in parsed XML and creates a dictionary of attributes
        @param parent<> The xml node
        @return rtn<dict> the found attributes in the xml node
        """

        if self.DEBUG:
            print(
                "STIXHelper(6300) get_indicator: rtn=",
                rtn,
                " parent=",
                type(parent),
                "\n",
            )

        if hasattr(parent, "description") and hasattr(parent.description, "value"):
            rtn[IND_DESC_KEY] = parent.description.value

        if hasattr(parent, "kill_chain_phases"):
            if self.DEBUG:
                print(
                    "STIXHelper(6400) get_indicator, killchain=",
                    dir(parent.kill_chain_phases),
                )

            if hasattr(parent.kill_chain_phases, "to_dict"):
                kill_dict = parent.kill_chain_phases.to_dict()
                if "kill_chain_phases" in kill_dict.keys():
                    kill_list = kill_dict["kill_chain_phases"]
                    kill_phase = kill_list[0]
                    if "phase_id" in kill_phase:
                        kill_id = kill_phase["phase_id"]
                    if "kill_chain_id" in kill_phase:
                        kill_id = kill_phase["phase_id"]
                    for item in self.kill_chains:
                        if item[2] == kill_id:
                            rtn[IND_PHASE_KEY] = item[1]
                            break

        # Get TLP and FOUO
        if hasattr(parent.handling, "markings"):
            for item in parent.handling.markings:
                for z in item.marking_structures:
                    if hasattr(z, "color"):
                        rtn[IND_TLP_KEY] = z.color
                    elif hasattr(z, "terms_of_use"):
                        fouo = z.terms_of_use
                        if fouo is not None and "FOUO" in fouo:
                            rtn[IND_FOUO_KEY] = True

        # Get type
        if len(parent.indicator_types) > 0:
            rtn[IND_TYPE_KEY] = parent.indicator_types[0].value

        # Sighting
        node = parent.sightings
        if node != {} and node is not None:
            for item in node:
                timestamp = list(str(item.timestamp))
                if len(timestamp) > 10:
                    timestamp[10] = "T"
                rtn[IND_SIGHTED_KEY] = "".join(timestamp)

        if self.DEBUG:
            print("STIXHelper(6500) get_indicator: Exiting, node=", node)
        return rtn

    # End of get_indicator

    def create_indicator(self, win_vars, guid, stix_type):
        """
        Creates a stix indicator structure
        @param win_vars<dict> Contains key:value attributes from GUI
               Keys:  which, tlp, desc, url, sighted, phase, type
        @param guid<string> The id= value
        @param stix_type - The type of STIX: xml or ais
        @return<stix.indicator.indicator.Indicator> indicator
        """
        indicator = stix.indicator.Indicator(id_=guid)
        self.stix_package.add_indicator(indicator)

        if self.DEBUG:
            print(
                "STIXHelper(6600) setIndicator: vars=",
                win_vars,
                " indicator=",
                type(indicator),
                "\n",
            )

        if indicator is not None:
            if "desc" in win_vars:
                indicator.description = win_vars["desc"]
            if "type" in win_vars:
                if win_vars["type"] in self.indicator_types:
                    if (win_vars["type"] == "Benign") or (
                        win_vars["type"] == "Compromised"
                    ):
                        term = VocabString(win_vars["type"])
                    else:
                        term = win_vars["type"]
                    indicator.indicator_types = [term]
                else:
                    print("setIndicator: Bad indicator type! " + win_vars["type"])
            if "sighted" in win_vars:
                indicator.sightings.sightings_count = 1

                s = stix.indicator.sightings.Sighting(win_vars["sighted"])
                indicator.sightings.append(s)

            if "phase" in win_vars:
                index = -1
                if win_vars["phase"] == "Reconnaissance":
                    index = 0
                if win_vars["phase"] == "Weaponization":
                    index = 1
                if win_vars["phase"] == "Delivery":
                    index = 2
                if win_vars["phase"] == "Exploitation":
                    index = 3
                if win_vars["phase"] == "Installation":
                    index = 4
                if win_vars["phase"] == "Command and Control":
                    index = 5
                if win_vars["phase"] == "Actions on Objectives":
                    index = 6
                if index != -1:
                    which = self.kill_chains[index]
                    ordinality = which[0]
                    name = which[1]
                    ident = which[2]
                    phase = stix.common.kill_chains.KillChainPhaseReference()
                    phase.phase_id = ident
                    phase._ordinality = ordinality
                    phase.name = name
                    phase.reference = "http://www.lockheedmartin.com/content/dam/lockheed/data/corporate/documents/LM-White-Paper-Intel-Driven-Defense.pdf"
                    phase.kill_chain_id = (
                        "stix:KillChain-af3e707f-2fb9-49e5-8c37-14026ca0a5ff"
                    )
                    indicator.kill_chain_phases.append(phase)

        return indicator

    # End of create_indicator


def get_fouo():
    """
    Returns the standard FOR OFFICIAL USE ONLY BLOCK
    @returns String containing FOUO block
    """
    rtn = "WARNING: This document is FOR OFFICIAL USE ONLY (FOUO). "
    rtn = rtn + "It contains information that may be exempt from public "
    rtn = rtn + "release under the Freedom of Information Act (5 U.S.C. 552). It"
    rtn = rtn + " is to be controlled, stored, handled, transmitted, distributed,"
    rtn = rtn + " and disposed of in accordance with DHS policy relating to FOUO "
    rtn = rtn + "information and is not to be released to the public or other "
    rtn = rtn + 'personnel who do not have a valid "need-to-know" without prior '
    rtn = rtn + "approval of an authorized DHS official."
    return rtn


# End of get_fouo


def get_tlp(color):
    """
    Returns the Traffic Light Protocol associated with a color
    @param color - String like "RED" or "GREEN" or "WHITE" or "AMBER"
    @return Sting containing text related to TLP color
    """
    tou = "DISCLAIMER: CISA has not independently verified this information. CISA does not provide "
    tou = (
        tou
        + "any warranties of any kind regarding this information. The information in this report "
    )
    tou = (
        tou
        + 'is being provided "as is" for informational purposes only. CISA does not endorse any '
    )
    tou = (
        tou
        + "commercial entity, product, company, or service, including any entities, products, or "
    )
    tou = (
        tou
        + "services linked or referenced within this document. Any reference to specific commercial "
    )
    tou = (
        tou
        + "entities, products, processes, or services by service mark, trademark, manufacturer, or "
    )
    tou = (
        tou
        + "otherwise, does not constitute or imply endorsement, recommendation, or favoring by CISA. "
    )
    tou = tou + "This "
    if color == "RED":
        tou = tou + "This document is distributed as TLP:RED: "
        tou = tou + "Not for disclosure, restricted to participants only. "
        tou = tou + "Recipients may not share TLP:RED information with any "
        tou = tou + "parties outside of their specific exchange, meeting, or "
        tou = tou + "conversation in which it was originally disclosed. In the "
        tou = tou + "context of a meeting, for example, TLP:RED information is "
        tou = tou + "limited to those present at the meeting. In most "
        tou = tou + "circumstances, TLP:RED should be exchanged verbally or in "
        tou = tou + "person. "
    elif color == "AMBER":
        tou = (
            tou
            + "document is being shared subject to Traffic Light Protocol (TLP) marking TLP:AMBER. "
        )
        tou = (
            tou
            + "TLP:AMBER means that recipients may share TLP:AMBER information with members of their "
        )
        tou = (
            tou
            + "own organization and its clients on a need-to-know basis to protect their organization "
        )
        tou = tou + "and its clients and prevent further harm. "
    elif color == "GREEN":
        tou = (
            tou
            + "document is being shared subject to Traffic Light Protocol (TLP) marking TLP:GREEN. "
        )
        tou = (
            tou
            + "TLP:GREEN means that recipients may share TLP:GREEN information with peers and partner "
        )
        tou = (
            tou
            + "organizations within their community, but not via publicly accessible channels. Unless "
        )
        tou = (
            tou
            + "otherwise specified, TLP:GREEN information may not be shared outside of the cybersecurity "
        )
        tou = tou + "or cyber defense community. "
    elif color == "WHITE":
        tou = (
            tou
            + "document is being shared subject to Traffic Light Protocol (TLP) marking TLP:WHITE. "
        )
        tou = (
            tou
            + "TLP:WHITE means that recipients may share this information without restriction. Information "
        )
        tou = tou + "is subject to standard copyright rules "
    tou = tou + "For more information on the Traffic Light Protocol, "
    tou = (
        tou
        + "see https://www.cisa.gov/news-events/news/traffic-light-protocol-tlp-definitions-and-usage. "
    )
    return tou


# End of get_tlp

# MKPATT

if __name__ == "__main__" and len(sys.argv) == 1:
    print(__doc__)

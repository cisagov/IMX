from flask import current_app

from controllers.STIXLinks import Node
import uuid
import os

__version__ = os.getenv("VERSION")
__revised__ = "5/5/2026"
__author__ = "Joseph King"


def produce_doc(data):
    """
    Given a String in JSON format, display a textual document
    @param data - String in JSON format
    @returns doc - The String textual document
    """
    log("docFactory.produce_doc: Entering")
    sighted = ""
    desc = ""
    kill_chain = ""
    characterization = ""
    doc = ""

    for item in data:
        line = ""
        if "attribs" not in item:
            raise ValueError("VALUE ERROR: No [attribs] key found")
        attribs = item["attribs"]
        if "type" not in item:
            raise ValueError("VALUE ERROR: No [type] key in attribs")
        if item["type"] == "main":
            log("docFactory.produce_doc: Found:main ")
            if "doctitle" in attribs:
                doc = doc + attribs["doctitle"]
            else:
                doc = doc + "No Document Title provided"
            doc = doc + "\r\n"
            if "tlp" in attribs:
                if "fouo" in attribs:
                    if attribs["fouo"] == "1":
                        doc = doc + "FOUO\r\n"
                doc = doc + "\r\n"
            doc = doc + "Department of Homeland Security\r\n"
            doc = doc + "Cybersecurity and Infrastructure Security Agency (CISA) \r\n"
            doc = doc + "Reference Number: " + attribs["docid"] + "\r\n"
            doc = doc + "Report Date: " + attribs["produced"] + "\r\n"
            doc = doc + "\r\n"
            doc = doc + "Notification:\r\n"
            doc = doc + "\r\n"
            doc = (
                doc
                + "DISCLAIMER: CISA has not independently verified this information. CISA does not provide\r\n"
            )
            doc = (
                doc
                + "any warranties of any kind regarding this information. The information in this report\r\n"
            )
            doc = (
                doc
                + 'is being provided "as is" for informational purposes only. CISA does not endorse any\r\n'
            )
            doc = (
                doc
                + "commercial entity, product, company, or service, including any entities, products, or\r\n"
            )
            doc = (
                doc
                + "services linked or referenced within this document. Any reference to specific commercial\r\n"
            )
            doc = (
                doc
                + "entities, products, processes, or services by service mark, trademark, manufacturer, or\r\n"
            )
            doc = (
                doc
                + "otherwise, does not constitute or imply endorsement, recommendation, or favoring by CISA.\r\n"
            )
            doc = doc + "This "
            if attribs["tlp"] == "RED":
                doc = doc + "document is distributed as TLP:RED: Not for "
                doc = doc + "disclosure, restricted to\r\nparticipants only. "
                doc = doc + "Recipients may not share TLP:RED information with "
                doc = doc + "any parties outside of\r\nthe specific exchange, meeting,"
                doc = doc + " or conversation in which it was originally disclosed.\r\n"
            elif attribs["tlp"] == "AMBER":
                doc = (
                    doc
                    + "document is being shared subject to Traffic Light Protocol (TLP) marking TLP:AMBER.\r\n"
                )
                doc = (
                    doc
                    + "TLP:AMBER means that recipients may share TLP:AMBER information with members of their\r\n"
                )
                doc = (
                    doc
                    + "own organization and its clients on a need-to-know basis to protect their organization\r\n"
                )
                doc = doc + "and its clients and prevent further harm.\r\n"
            elif attribs["tlp"] == "GREEN":
                doc = (
                    doc
                    + "document is being shared subject to Traffic Light Protocol (TLP) marking TLP:GREEN.\r\n"
                )
                doc = (
                    doc
                    + "TLP:GREEN means that recipients may share TLP:GREEN information with peers and partner\r\n"
                )
                doc = (
                    doc
                    + "organizations within their community, but not via publicly accessible channels. Unless\r\n"
                )
                doc = (
                    doc
                    + "otherwise specified, TLP:GREEN information may not be shared outside of the cybersecurity\r\n"
                )
                doc = doc + "or cyber defense community.\r\n"
            elif attribs["tlp"] == "WHITE":
                doc = (
                    doc
                    + "document is being shared subject to Traffic Light Protocol (TLP) marking TLP:WHITE.\r\n"
                )
                doc = (
                    doc
                    + "TLP:WHITE means that recipients may share this information without restriction. Information\r\n"
                )
                doc = doc + "is subject to standard copyright rules.\r\n"
            #            if attribs['tlp'] == 'WHITE':
            #                doc = doc + 'document is distributed as TLP:WHITE: Disclosure is not limited. For more\r\n'
            #            else:
            #                doc = doc + 'document is distributed as TLP:'+attribs['tlp']+': Disclosure is limited. For more\r\n'
            doc = doc + "For more information on the Traffic Light Protocol, see\r\n"
            doc = (
                doc
                + "https://www.cisa.gov/news-events/news/traffic-light-protocol-tlp-definitions-and-usage\r\n"
            )
            doc = doc + "\r\n"

            if ("fouo" in attribs) and (attribs["fouo"] == "1"):
                doc = (
                    doc
                    + "WARNING: This document is FOR OFFICIAL USE ONLY (FOUO). It contains information\r\n"
                )
                doc = (
                    doc
                    + "that may be exempt from public release under the Freedom of Information Act (5\r\n"
                )
                doc = (
                    doc
                    + "U.S.C. 552). It is to be controlled, stored, handled, transmitted, distributed,\r\n"
                )
                doc = (
                    doc
                    + "and disposed of in accordance with DHS policy relating to FOUO information and\r\n"
                )
                doc = (
                    doc
                    + "is not to be released to the public or other personnel who do not have a valid\r\n"
                )
                doc = (
                    doc
                    + '"need-to-know" without prior approval of an authorized DHS official.\r\n'
                )
            doc = doc + "\r\n"
            doc = doc + "Summary:\r\n\r\n"

            if "overview" in attribs:
                overview = attribs["overview"]

                doc = doc + wrap(overview, 80) + "\r\n"
                doc = doc + "\r\n"
            if "patterns" in attribs:
                doc = doc + "Attack Patterns:\r\n"
                patterns = attribs["patterns"]
                for pattern in patterns:
                    doc = doc + pattern + "\r\n"
                doc = doc + "\r\n"
        elif item["type"] == "indicator":
            log("docFactory.produce_doc: Found:indicator")
            doc = doc + "Indicators:\r\n"
            doc = doc + "\r\n"
            if "tlp" in attribs:
                line = "TLP: " + attribs["tlp"]
                if "fouo" in attribs:
                    if attribs["fouo"] == "1":
                        line = line + " FOUO"
                doc = doc + line + "\r\n"

            if "sighted" in attribs:
                sighted = attribs["sighted"]
            else:
                sighted = ""

            if "phase" in attribs:
                kill_chain = attribs["phase"]
            else:
                kill_chain = ""

            if "type" in attribs:
                characterization = attribs["type"]
            else:
                characterization = ""

            if "desc" in attribs:
                desc = attribs["desc"]
            else:
                desc = ""
        else:
            host_string = "Host\r\n"
            if item["type"] == "fqdn":
                log("docFactory.produce_doc: Found:fqdn")
                doc = doc + host_string
            elif item["type"] == "email":
                log("docFactory.produce_doc: Found:email")
                doc = doc + "Email\r\n"
            elif item["type"] == "file":
                log("docFactory.produce_doc: Found:file")
                doc = doc + "File\r\n"
            elif item["type"] == "ipv4":
                log("docFactory.produce_doc: Found:ipv4")
                doc = doc + host_string
            elif item["type"] == "ipv6":
                log("docFactory.produce_doc: Found:ipv6")
                doc = doc + host_string
            elif item["type"] == "link":
                log("docFactory.produce_doc: Found:link")
                doc = doc + "Link\r\n"
            elif item["type"] == "mutex":
                log("docFactory.produce_doc: Found:mutex")
                doc = doc + "Mutex\r\n"
            elif item["type"] == "netcon":
                log("docFactory.produce_doc: Found:netcon")
                doc = doc + host_string
            elif item["type"] == "url":
                log("docFactory.produce_doc: Found:url")
                doc = doc + host_string
            elif item["type"] == "ua":
                log("docFactory.produce_doc: Found:ua")
                doc = doc + host_string
            elif item["type"] == "registry":
                log("docFactory.produce_doc: Found:registry")
                doc = doc + "File\r\n"
            else:
                raise ValueError("VALUE ERROR: Unrecognized [type] key in attribs")

            for key, value in attribs.items():
                # print(key, value)
                if key == "sfrom":
                    if ("sspoofed" in attribs) and (attribs["sspoofed"] == "1"):
                        doc = doc + "  Sender Address: " + value + " [spoofed]\r\n"
                    else:
                        doc = doc + "  Sender Address: " + value + "\r\n"
                elif key == "fqdn":
                    doc = doc + "  FQDN: " + value + "\r\n"
                elif key == "msgid":
                    doc = doc + "  Message ID: " + value + "\r\n"
                elif key == "xmailer":
                    doc = doc + "  X-Mailer: " + value + "\r\n"
                elif key == "subject":
                    doc = doc + "  Subject: " + value + "\r\n"
                elif key == "filename":
                    doc = doc + "  Filename: " + value + "\r\n"
                elif key == "path":
                    doc = doc + "  Path: " + value + "\r\n"
                elif key == "size":
                    doc = doc + "  Size: " + value + "\r\n"
                elif key == "md5":
                    doc = doc + "  MD5: " + value + "\r\n"
                elif key == "sha1":
                    doc = doc + "  Sha1: " + value + "\r\n"
                elif key == "sha256":
                    doc = doc + "  SHA256: " + value + "\r\n"
                elif key == "sha512":
                    doc = doc + "  SHA512: " + value + "\r\n"
                elif key == "mutex":
                    doc = doc + "  Mutex: " + value + "\r\n"
                elif (key == "url") and (item["type"] == "link"):
                    doc = doc + "  URI: " + value + "\r\n"
                elif (key == "url") and (item["type"] == "url"):
                    doc = doc + "  URL: " + value + "\r\n"
                elif key == "name":
                    doc = doc + "  Link visible text: " + value + "\r\n"
                elif key == "useragent":
                    doc = doc + "  User Agent: " + value + "\r\n"
                elif key == "ip":
                    if ("spoofed" in attribs) and (attribs["spoofed"] == "1"):
                        doc = doc + "  IPv4 Address: " + value + " [spoofed]\r\n"
                    else:
                        doc = doc + "  IPv4 Address: " + value + "\r\n"
                elif key == "ipv6":
                    if ("spoofed" in attribs) and (attribs["spoofed"] == "1"):
                        doc = doc + "  IPv6 Address: " + value + " [spoofed]\r\n"
                    else:
                        doc = doc + "  IPv6 Address: " + value + "\r\n"
                elif key == "source":
                    if ("sspoofed" in attribs) and (attribs["sspoofed"] == "1"):
                        doc = doc + "  Source IPv4: " + value + " [spoofed]\r\n"
                    else:
                        doc = doc + "  Source IPv4: " + value + "\r\n"
                elif key == "destination":
                    if ("dspoofed" in attribs) and (attribs["dspoofed"] == "1"):
                        doc = doc + "  Destination IPv4: " + value + " [spoofed]\r\n"
                    else:
                        doc = doc + "  Destination IPv4: " + value + "\r\n"
                elif key == "sport":
                    doc = doc + "  Source Port: " + value + "\r\n"
                elif key == "dport":
                    doc = doc + "  Destination Port: " + value + "\r\n"
                elif key == "sproto":
                    doc = doc + "  Source Protocol: " + value + "\r\n"
                elif key == "dproto":
                    doc = doc + "  Destination Protocol: " + value + "\r\n"
                elif key == "hive":
                    key = ""
                    name = ""
                    data = ""
                    if "key" in attribs:
                        key = attribs["key"]
                    if "rname" in attribs:
                        name = attribs["name"]
                    if "data" in attribs:
                        data = attribs["data"]
                    doc = (
                        doc
                        + "  Registry: "
                        + value
                        + "\\"
                        + key
                        + "\\"
                        + name
                        + " = "
                        + data
                        + "\r\n"
                    )
            if sighted != "":
                doc = (
                    doc + "  Sighted: " + sighted + " [only single sightings used]\r\n"
                )
            if kill_chain != "":
                doc = doc + "  Kill Chain Phase: " + kill_chain + "\r\n"
            if characterization != "":
                doc = doc + "  Characterization: " + characterization + "\r\n"

            doc = doc + "  Notes: " + wrap(desc, 80) + "\r\n"
            doc = doc + "\r\n"

    log("docFactory.produce_doc: Exiting")
    return doc


# End of produce_doc


def produce_csv(json):
    """
    This method takes a list of JSON objects and returns a comma-separated document
    @param json - A list of json nodes
    @returns String with CSV text
    """
    log("docFactory.produce_csv: Entering")

    phase = ""
    ob_date = ""
    ob_tlp = ""
    ob_fouo = ""
    ob_desc = ""
    ind_type = ""
    doc = ""

    tlp_string = ",TLP:"

    doc = (
        doc
        + "INDICATOR_VALUE,TYPE,COMMENT,ROLE,ATTACK_PHASE,OBSERVED_DATE,HANDLING,DESCRIPTION\n"
    )
    for item in json:
        if ("attribs" in item) and ("type" in item):
            attribs = item["attribs"]
            item_type = item["type"]
            log("docFactory.produce_csv: type=" + item_type)

            if item_type == "main":
                if "patterns" in attribs:
                    for pattern in attribs["patterns"]:
                        doc = (
                            doc
                            + pattern
                            + ","
                            + "ATT&CK Technique"
                            + ",,Behavior / TTP,,,,\n"
                        )
            elif item_type == "indicator":
                if "tlp" in attribs:
                    ob_tlp = ((attribs["tlp"])[:8]).upper()
                else:
                    ob_tlp = ""
                if "fouo" in attribs:
                    ob_fouo = attribs["fouo"]
                    if ob_fouo == "1":
                        ob_fouo = "FOUO"
                    else:
                        ob_fouo = ""
                if "phase" in attribs:
                    phase = ((attribs["phase"])[:50]).upper()
                    if phase == "COMMAND AND CONTROL":
                        phase = "C2"
                else:
                    phase = ""
                if "desc" in attribs:
                    ob_desc = (attribs["desc"])[:5000]
                    ob_desc = ob_desc.replace("\n", " ")
                    ob_desc = ob_desc.replace("\r", " ")
                    ob_desc = ob_desc.replace("\t", " ")
                    ob_desc = ob_desc.replace('"', "'")
                    ob_desc = '"' + ob_desc + '"'
                else:
                    ob_desc = ""
                if "sighted" in attribs:
                    ob_date = (attribs["sighted"])[:100]
                else:
                    ob_date = ""
                if "type" in attribs:
                    ind_type = ((attribs["type"])[:100]).upper()
                else:
                    ind_type = ""
            elif item_type == "mutex":
                if "mutex" in attribs:
                    line = (
                        '"'
                        + (attribs["mutex"])[:500]
                        + '",STRING,,MUTEX,'
                        + phase
                        + ","
                        + ob_date
                        + tlp_string
                        + ob_tlp
                        + " "
                        + ob_fouo
                        + ","
                        + ob_desc
                        + "\r\n"
                    )
                    doc = doc + line
            elif item_type == "fqdn":
                if "fqdn" in attribs:
                    line = (
                        defang(attribs["fqdn"])
                        + ",FQDN,,"
                        + ind_type
                        + ","
                        + phase
                        + ","
                        + ob_date
                        + tlp_string
                        + ob_tlp
                        + " "
                        + ob_fouo
                        + ","
                        + ob_desc
                        + "\r\n"
                    )
                    doc = doc + line
            elif (item_type == "link") or (item_type == "url"):
                if "url" in attribs:
                    name = ""
                    if "name" in attribs:
                        name = '"LINK_NAME=""' + attribs["name"] + '""|EMBEDDED_LINK"'

                    line = (
                        defang(attribs["url"])
                        + ",URL,"
                        + name
                        + ","
                        + ind_type
                        + ","
                        + phase
                        + ","
                        + ob_date
                        + tlp_string
                        + ob_tlp
                        + " "
                        + ob_fouo
                        + ","
                        + ob_desc
                        + "\r\n"
                    )
                    doc = doc + line
            elif item_type == "ipv4":
                if "ip" in attribs:
                    spoofed = ""
                    if ("spoofed" in attribs) and (attribs["spoofed"] == "1"):
                        spoofed = "SPOOFED"
                    line = (
                        defang(attribs["ip"])
                        + ",IPV4ADDR,"
                        + spoofed
                        + ","
                        + ind_type
                        + ","
                        + phase
                        + ","
                        + ob_date
                        + tlp_string
                        + ob_tlp
                        + " "
                        + ob_fouo
                        + ","
                        + ob_desc
                        + "\r\n"
                    )
                    doc = doc + line
            elif item_type == "ipv6":
                if "ipv6" in attribs:
                    spoofed = ""
                    if ("spoofed" in attribs) and (attribs["spoofed"] == "1"):
                        spoofed = "SPOOFED"
                    line = (
                        defang(attribs["ipv6"])
                        + ",IPV6ADDR,"
                        + spoofed
                        + ","
                        + ind_type
                        + ","
                        + phase
                        + ","
                        + ob_date
                        + tlp_string
                        + ob_tlp
                        + " "
                        + ob_fouo
                        + ","
                        + ob_desc
                        + "\r\n"
                    )
                    doc = doc + line
            elif item_type == "ua":
                if "useragent" in attribs:
                    line = (
                        '"'
                        + (attribs["useragent"])[:500]
                        + '",STRING,USER_AGENT_STRING,'
                        + ind_type
                        + ","
                        + phase
                        + ","
                        + ob_date
                        + tlp_string
                        + ob_tlp
                        + " "
                        + ob_fouo
                        + ","
                        + ob_desc
                        + "\r\n"
                    )
                    doc = doc + line
            elif item_type == "file":
                md5 = ""
                comment = ""
                if "md5" in attribs:
                    md5 = attribs["md5"]
                if "filename" in attribs:
                    comment = comment + "FILENAME:" + attribs["filename"]
                if "sha1" in attribs:
                    if len(comment) == 0:
                        comment = "SHA1:" + attribs["sha1"]
                    else:
                        comment = comment + "|SHA1:" + attribs["sha1"]
                if "sha256" in attribs:
                    if len(comment) == 0:
                        comment = "SHA256:" + attribs["sha256"]
                    else:
                        comment = comment + "|SHA256:" + attribs["sha256"]
                if "sha512" in attribs:
                    if len(comment) == 0:
                        comment = "SHA512:" + attribs["sha512"]
                    else:
                        comment = comment + "|SHA512:" + attribs["sha512"]
                if "ssdeep" in attribs:
                    if len(comment) == 0:
                        comment = "SSDEEP:" + attribs["ssdeep"]
                    else:
                        comment = comment + "|SSDEEP:" + attribs["ssdeep"]
                if "size" in attribs:
                    if len(comment) == 0:
                        comment = "SIZE: " + attribs["size"]
                    else:
                        comment = comment + "|FILE_SIZE:" + attribs["size"]

                doc = (
                    doc
                    + md5
                    + ",MD5,"
                    + comment
                    + ","
                    + ind_type
                    + ","
                    + phase
                    + ","
                    + ob_date
                    + ",TLP:"
                    + ob_tlp
                    + " "
                    + ob_fouo
                    + ","
                    + ob_desc
                    + "\r\n"
                )
            elif item_type == "netcon":
                if "sproto" in attribs:
                    proto = attribs["sproto"]
                    if "sport" in attribs:
                        proto = proto + ":" + attribs["sport"]
                else:
                    proto = ""
                if ("sspoofed" in attribs) and (attribs["sspoofed"] == "1"):
                    proto = proto + "|SPOOFED"
                if "source" in attribs:
                    line = (
                        defang(attribs["source"])
                        + ",IPV4ADDR,SOURCE_IP|"
                        + proto
                        + ","
                        + ind_type
                        + ","
                        + phase
                        + ","
                        + ob_date
                        + tlp_string
                        + ob_tlp
                        + " "
                        + ob_fouo
                        + ","
                        + ob_desc
                        + "\r\n"
                    )
                    doc = doc + line
                if "dproto" in attribs:
                    proto = attribs["dproto"]
                    if "dport" in attribs:
                        proto = proto + ":" + attribs["dport"]
                else:
                    proto = ""
                if "destination" in attribs:
                    line = (
                        defang(attribs["destination"])
                        + ",IPV4ADDR,DESTINATION_IP|"
                        + proto
                        + ","
                        + ind_type
                        + ","
                        + phase
                        + ","
                        + ob_date
                        + tlp_string
                        + ob_tlp
                        + " "
                        + ob_fouo
                        + ","
                        + ob_desc
                        + "\r\n"
                    )
                    doc = doc + line
            elif item_type == "email":
                if "sfrom" in attribs:
                    if ("sspoofed" in attribs) and (attribs["sspoofed"] == "1"):
                        proto = "SPOOFED"
                    else:
                        proto = ""
                    line = (
                        attribs["sfrom"]
                        + ",EMAIL,"
                        + proto
                        + ",EMAIL_SOURCE_ADDRESS,"
                        + phase
                        + ","
                        + ob_date
                        + tlp_string
                        + ob_tlp
                        + " "
                        + ob_fouo
                        + ","
                        + ob_desc
                        + "\r\n"
                    )
                    doc = doc + line
                if "subject" in attribs:
                    line = (
                        (attribs["subject"])[:500]
                        + ",EMAIL,,SUBJECT,"
                        + phase
                        + ","
                        + ob_date
                        + tlp_string
                        + ob_tlp
                        + " "
                        + ob_fouo
                        + ","
                        + ob_desc
                        + "\r\n"
                    )
                    doc = doc + line
                if "xmailer" in attribs:
                    line = (
                        (attribs["xmailer"])[:500]
                        + ",EMAIL,,X-MAILER,"
                        + phase
                        + ","
                        + ob_date
                        + tlp_string
                        + ob_tlp
                        + " "
                        + ob_fouo
                        + ","
                        + ob_desc
                        + "\r\n"
                    )
                    doc = doc + line
                if "msgid" in attribs:
                    line = (
                        (attribs["msgid"])[:500]
                        + ",EMAIL,,MESSAGE-ID,"
                        + phase
                        + ","
                        + ob_date
                        + tlp_string
                        + ob_tlp
                        + " "
                        + ob_fouo
                        + ","
                        + ob_desc
                        + "\r\n"
                    )
                    doc = doc + line
            elif item_type == "registry":
                hive = ""
                key = ""
                name = ""
                data = ""
                if "hive" in attribs:
                    hive = (attribs["hive"])[:500]
                if "key" in attribs:
                    key = (attribs["key"])[:500]
                if "rname" in attribs:
                    name = (attribs["name"])[:500]
                if "data" in attribs:
                    data = (attribs["data"])[:500]
                line = (
                    hive
                    + "/"
                    + key
                    + "/"
                    + name
                    + "/"
                    + data
                    + ",REGKEY,,MALICIOUS_PROCESS,"
                    + phase
                    + ","
                    + ob_date
                    + tlp_string
                    + ob_tlp
                    + " "
                    + ob_fouo
                    + ","
                    + ob_desc
                    + "\r\n"
                )
                doc = doc + line
            else:
                raise ValueError(
                    "VALUE ERROR: Unrecognized detail [type] key found! " + item_type
                )
        else:
            raise ValueError(
                "VALUE ERROR: Either [attribs] or [type] keys are missing!"
            )

    log("docFactory.produce_csv: Exiting")
    return doc


# End produce_csv


def produce_xml(jlist, stix_type):
    """
    Given a list of JSON nodes, produce a STIX 1 document
    @param jlist - List of JSON objects
    @param stix_type - The type of STIX: xml or ais
    @returns String output with xml (STIX1)
    """
    log("docFactory.produce_xml: Entering")

    n = Node()
    fed_flag = ""
    for item in jlist:
        if ("type" in item) and (item["type"] == "main"):
            if "guid" in item:
                n.set_guid(item["guid"])
            if "type" in item:
                n.set_type(item["type"])
            if "attribs" in item:
                if stix_type == "ais":
                    attrib_payload = item["attribs"]
                    if "org_source" in attrib_payload:
                        setting = attrib_payload["org_source"]
                        if setting == "NONFED":
                            log("docFactory.productXml: AIS NONFED")
                            fed_flag = "NONFED"
                        else:
                            log("docFactory.productXml: AIS FED")
                            fed_flag = "FED"
                n.set_attribs(item["attribs"])
                log("docFactory.productXml: main_attribs=" + str(item["attribs"]))
        elif "type" in item:
            n1 = Node()
            n1.set_type(item["type"])
            if item["type"] == "indicator":
                n1.set_guid("CISA:Indicator-" + str(uuid.uuid4()))
            else:
                n1.set_guid("CISA:Object-" + str(uuid.uuid4()))

            if "attribs" in item:
                n1.set_attribs(item["attribs"])
                log("docFactory.produce_xml: attribs=" + str(item["attribs"]))
                n.children.append(n1)

    log("docFactory.produce_xml: Exiting")
    try:
        the_xml = n.deploy2(__version__, stix_type)
    except ValueError as e:
        log(f"Value Error: {e}")
        raise ValueError(
            f"Value Error. Report contains values incompatible with STIX 1.1: {e}"
        )

    if stix_type == "ais":
        the_xml = the_xml.replace(
            "<stix:STIX_Header>",
            "<!-- SOURCE: " + fed_flag + " -->\n<stix:STIX_Header>",
        )
        # ----------------- temporary fix 7/1/2020 mkp ------------------------------
        chunk = ""
        pattern = '<stixCommon:Identity xsi:type="stix-ciqidentity:CIQIdentity3.0InstanceType">'
        s_index = the_xml.find(pattern)
        if s_index > 0:
            pattern = "</stixCommon:Identity>"
            e_index = the_xml.find(pattern, s_index)
            if e_index > 0:
                chunk = the_xml[s_index : e_index + len(pattern)]
        if len(chunk) > 0:
            pattern = "<stixCommon:Source>"
            s_index = the_xml.find(pattern, e_index)
            if s_index > 0:
                temp_xml = the_xml[0 : s_index + len(pattern)] + chunk
                temp_xml = temp_xml + the_xml[s_index + len(pattern) :]
                the_xml = temp_xml
        # ----------------- end temporary fix mkp -----------------------------------
    return the_xml


# End of produce_xml


def wrap(sample, cols):
    """
    Takes unnormalized text and arranges it to a set width
    @param sample - The unnormalized text
    @param cols - How many characters before CRLF to wrap
    @returns String formatted line
    """
    sample = sample.replace("EOL_EOL_EOL_rEOL_EOL_EOL_n", "\r\n")
    sample = sample.replace("EOL_EOL_EOL_nEOL_EOL_EOL_r", "\r\n")
    sample = sample.replace("EOL_EOL_EOL_n", "\r\n")
    sample = sample.replace("EOL_EOL_EOL_r", "\r\n")
    sample_list = sample.splitlines()
    output_text = ""
    for line in sample_list:
        output_text += "\r\n".join(textwrap.wrap(line, width=cols))
        output_text += "\r\n"

    return output_text


# End of wrap


def log(the_string, reset=False):
    current_app.logger.info(the_string)
    # print(reset)


# End of log


def defang(url):
    """
    Change a url to disable it from accidental invocation
    @param url - String ex.: http://badguy.com
    @return String such as hxxp://badguy[.]com
    """
    url = url.replace("http", "hxxp")
    url = url.replace(".", "[.]")

    # For ipv6 values the colons will be surrounded by the square brackets.
    url = url.replace(":", "[:]")

    return url


# End of defang

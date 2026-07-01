import { QuestionBase } from '../../question-base';
export default function tooltipHelper(question: QuestionBase<any>, displayName: string, object_type: string): string {
    let tooltip = '';

    switch (question.key) {
        case 'abstract': {
            tooltip = 'A brief summary of the note content.';
            break;
        }
        case 'additional_header_fields': {
            tooltip =
                'Specifies any other header fields (except for date, received_lines, content_type, from_ref, sender_ref, to_refs, cc_refs, bcc_refs, and subject) found in the email message.';
            break;
        }
        case 'administrative_area': {
            tooltip =
                'The state, province or other sub-national administrative area that this Location describes. This property SHOULD contain a valid ISO 3166-2 Code.';
            break;
        }
        case 'account_login': {
            tooltip =
                'Specifies the account login string in cases where the user_id property<br>is different than what a user would type when they login.<br>For example, in the case of a Unix account with user_id 0, the account_login might be root.';
            break;
        }
        case 'aliases': {
            tooltip = 'Alternative names used to identify this ' + displayName + '.';
            break;
        }
        case 'analysis_definition_version': {
            tooltip = 'The version of the analysis definitions used by the analysis tool (including AV tools).';
            break;
        }
        case 'analysis_engine_version': {
            tooltip = 'The version of the analysis engine or product (including AV engines)<br>that was used to perform the analysis.';
            break;
        }
        case 'analysis_sco_refs': {
            tooltip = 'This property contains the references to the STIX Cyber-observable<br>Objects that were captured during the analysis process.';
            break;
        }
        case 'analysis_started': {
            tooltip = 'The date and time that the malware analysis was initiated.';
            break;
        }
        case 'analysis_ended': {
            tooltip = 'The date and time that the malware analysis ended.';
            break;
        }
        case 'authors': {
            switch (object_type) {
                case 'note': {
                    tooltip = 'The name of the author(s) of this note (e.g., the analyst(s) that created it).';
                    break;
                }
                case 'opinion': {
                    tooltip = 'The name of the authors/analysts of this Opinion.';
                    break;
                }
            }
            break;
        }
        case 'bcc_refs': {
            tooltip = '"BCC:" recipients of the email message.';
            break;
        }
        //Should probably edit either email addr or ipv4/ipv6 to be the same.
        case 'belongs_to_ref': {
            switch (object_type) {
                case 'email-addr': {
                    tooltip = 'The user account that the email address belongs to, as a reference to a User Account object.';
                    break;
                }
            }
            break;
        }
        case 'belongs_to_refs': {
            switch (object_type) {
                case 'ipv4-addr': {
                    tooltip = 'References to one or more autonomous systems (AS) that the IPv4 addresses belongs to.';
                    break;
                }
                case 'ipv6-addr': {
                    tooltip =
                        'Specifies a list of references to one or more autonomous systems (AS) that the<br>IPv6 address belongs to. Relevant objects in the bundle will be in dropdown.';
                    break;
                }
            }
            break;
        }
        case 'body': {
            tooltip = 'Contents of the MIME part if the content type is not provided or starts with a text.';
            break;
        }
        case 'cc_refs': {
            tooltip = '"CC:" recipients of the email message.';
            break;
        }
        case 'count': {
            tooltip = 'The number of times the object was sighted.';
            break;
        }
        case 'child_refs': {
            switch (object_type) {
                case 'process': {
                    tooltip = 'Other processes that were spawned from this process object.';
                    break;
                }
            }
            break;
        }
        case 'confidence': {
            tooltip =
                "The confidence property reflects the object creator's trust in the accuracy of their data. The confidence value MUST <br> be a number in the range of 0-100.";
            break;
        }
        case 'configuration_version': {
            tooltip = 'The named configuration of additional product configuration parameters for this analysis run.';
            break;
        }
        case 'contact_information': {
            tooltip = 'The contact information (e-mail, phone number, etc.) for this identity.';
            break;
        }
        case 'contains_ref': {
            switch (object_type) {
                case 'directory': {
                    tooltip = 'The list of references to other File and/or Directory objects contained within the directory.';
                    break;
                }
                case 'file': {
                    tooltip =
                        'Specifies a list of references to other Cyber-observable Objects contained within the file. Relevant objects in the bundle will be in dropdown.';
                    break;
                }
            }
            break;
        }
        case 'content_ref': {
            switch (object_type) {
                case 'file': {
                    tooltip =
                        'The object referenced in this property MUST be a type of artifact.<br>Relevant objects in the bundle will be in the dropdown.';
                    break;
                }
            }
            break;
        }
        case 'contents': {
            tooltip = 'The actual Language Content (translation) MUST be RFC5646<br>Language codes for which language content is being provided.';
            break;
        }
        case 'content_type': {
            tooltip = 'Examples: "text", "images", "application/zip"';
            break;
        }
        case 'context': {
            tooltip = 'A short descriptor of the particular context shared by the content referenced by this object.';
            break;
        }
        case 'cpe': {
            tooltip =
                'The value for this property MUST be a CPE v2.3 entry from the official NVD CPE Dictionary if the value exists, e.g.<br>cpe:2.3:o:microsoft:windows_7:-:sp1:-:*:*:*:x64:*';
            break;
        }
        case 'created_by_ref': {
            tooltip =
                'Defines the id property of the identity object, describing the entity responsible<br>for creating this object. Relevant objects within the bundle will be listed in a dropdown menu.';
            break;
        }
        case 'creator_user_ref': {
            switch (object_type) {
                case 'process': {
                    tooltip = 'Specifies the user-account object that created the process.';
                    break;
                }
                case 'windows-registry-key': {
                    tooltip = 'The User Account Object that created the registry key.';
                    break;
                }
            }
            break;
        }
        case 'credential': {
            tooltip = 'Cleartext credential used in capturing metadata from malware<br>analysis. SHOULD NOT be used for sharing of PII.';
            break;
        }
        case 'description':
        case 'incident_description': {
            switch (object_type) {
                case 'location': {
                    tooltip = 'A description of the location, e.g. house, apartment, business, etc.';
                    break;
                }
                default: {
                    tooltip =
                        'A description that provides more details and context about the ' +
                        displayName +
                        ', <br>potentially including its purpose and its key characteristics.';
                }
            }
            break;
        }
        case 'decryption_key': {
            tooltip = 'Specifies the decryption key for the encrypted binary data.';
            break;
        }
        case 'definition': {
            tooltip = 'The marking object itself: the TLP or the Statement marking.';
            break;
        }
        case 'definition_type': {
            tooltip = 'The type of Marking Definition: Statement or TLP (see sections 7.2.1.3 and 7.2.1.4)';
            break;
        }
        case 'display_name': {
            switch (object_type) {
                case 'email-addr': {
                    tooltip = 'The name that is displayed to the human user of a mail application, e.g., Jane Smith.';
                    break;
                }
                case 'user-account': {
                    tooltip = 'Specifies the display name of the account, if applicable.';
                    break;
                }
            }
            break;
        }
        case 'dst_byte_count': {
            tooltip = 'The number of bytes, as a positive integer, sent from the destination to the source.';
            break;
        }
        case 'dst_packets': {
            tooltip = 'The number of packets, as a positive integer, sent from the destination to the source.';
            break;
        }
        case 'dst_payload_ref': {
            switch (object_type) {
                case 'network-traffic': {
                    tooltip = 'The type of bytes/artifact objects sent from the destination to the source.';
                    break;
                }
            }
            break;
        }
        case 'dst_port': {
            tooltip = 'Port used in the network traffic, as an integer. Value MUST be in the range of 0-65535.';
            break;
        }
        case 'dst_ref': {
            switch (object_type) {
                case 'network-traffic': {
                    tooltip =
                        'Destination of the network traffic, as a reference to a Cyber-observable<br>Object: ipv4-addr, ipv6-addr, mac-addr, or domain-name.';
                    break;
                }
            }
            break;
        }
        case 'encapsulated_by_ref': {
            tooltip = 'Network-traffic object which encapsulates this object.';
            break;
        }
        case 'encapsulates_refs': {
            tooltip = 'Other network-traffic objects encapsulated by this network-traffic object.';
            break;
        }
        case 'environment_variables': {
            tooltip =
                'Specifies the list of environment variables associated with the process as a dictionary. Each key in the dictionary MUST be a case preserved version of the name of the environment variable, and each corresponding value MUST be the environment variable value as a string.';
            break;
        }
        case 'explanation': {
            tooltip = 'An explanation of why the producer has this Opinion.';
            break;
        }
        case 'first_observed': {
            tooltip = 'The beginning of the time window during which the data was seen.';
            break;
        }
        case 'first_seen': {
            switch (object_type) {
                case 'infrastructure':
                case 'intrusion': {
                    tooltip = 'The time that this ' + displayName + ' was first seen performing malicious activities.';
                    break;
                }
                case 'malware': {
                    tooltip = 'The time that the malware instance or family was first seen.';
                    break;
                }
                default:
                    {
                        tooltip = 'The time that this ' + displayName + ' was first seen.';
                    }
                    break;
            }
            break;
        }
        case 'from_ref': {
            tooltip = 'The email-address(es) of the person or system responsible for WRITING the message.';
            break;
        }
        case 'goals': {
            tooltip = 'What the desired end state is, e.g., disrupt financial system, political unrest, etc.';
            break;
        }
        case 'host_vm_ref': {
            tooltip =
                'Description of the virtual machine environment used to host the guest operating system<br>(if applicable) that was used for the dynamic analysis of the malware instance or family';
            break;
        }
        case 'identity_class': {
            tooltip = 'The type of entity that this identity describes, e.g., an individual or organization.';
            break;
        }
        case 'ipfix': {
            tooltip =
                'Specifies any IP Flow Information data for the traffic, as a dictionary. Key SHOULD be a case-preserved version of the IPFIX element name. Value MUST be either an integer or a string, as well as a valid IPFIX property.';
            break;
        }
        case 'image_ref': {
            switch (object_type) {
                case 'process': {
                    tooltip = 'Specifies the binary that was executed as the process image, with a reference to a File object.';
                    break;
                }
            }
            break;
        }
        case 'installed_software_refs': {
            tooltip =
                'Any non-standard software installed on the OS (specified through the OS value)<br>used for the dynamic analysis of the malware instance or family.';
            break;
        }
        case 'is_active': {
            tooltip = 'Indicates whether the network traffic is still ongoing.';
            break;
        }
        case 'is_family': {
            tooltip = 'Whether the object represents a malware family (True) or a malware instance (False).';
            break;
        }
        //To be determined
        case 'is_multipart': {
            tooltip = '';
            break;
        }
        case 'issuer': {
            tooltip = 'Name of the Certificate Authority that issued the certificate.';
            break;
        }
        case 'key': {
            tooltip =
                'Specifies the full registry key including the hive CASE-PRESERVED. The<br>hive portion of the key MUST be fully expanded and not truncated.';
            break;
        }
        case 'last_observed': {
            tooltip = 'The end of the time window during which the data was seen.';
            break;
        }
        case 'last_seen': {
            switch (object_type) {
                case 'infrastructure':
                case 'intrusion': {
                    tooltip = 'The time that this ' + displayName + ' was last seen performing malicious activities.';
                    break;
                }
                case 'malware': {
                    tooltip = 'The time that the malware instance or family was last seen.';
                    break;
                }
                default:
                    {
                        tooltip = 'The time that this ' + displayName + ' was last seen.';
                    }
                    break;
            }
            break;
        }
        case 'latitude': {
            tooltip = 'The latitutde of the Location in decimal degrees. The value of this property MUST be between -90.0 and 90.0, inclusive.';
            break;
        }
        case 'longitude': {
            tooltip = 'The longitude of the location in decimal degrees. The value of this property MUST be between -180.0 and 180.0, inclusive';
            break;
        }
        case 'modules': {
            tooltip = 'The specific analysis modules that were used and configured in the product during this run.';
            break;
        }
        case 'name': {
            switch (object_type) {
                case 'autonomous-system': {
                    tooltip = 'Name of the autonomous-system.';
                    break;
                }
            }
            break;
        }
        case 'number': {
            tooltip = 'The number assigned to the AS. Typically assigned by a Regional Internet Registry (RIR)';
            break;
        }
        case 'number_of_subkeys': {
            tooltip = 'The number of subkeys contained under the registry key.';
            break;
        }
        case 'object_modified': {
            tooltip =
                'The modified time of the object that this Language Content applies to. It MUST be<br>an exact match for the modified time of the STIX Object being referenced.';
            break;
        }
        case 'object_ref': {
            switch (object_type) {
                case 'language-content': {
                    tooltip = 'Object ID that this Language Content applies to. It MUST be the identifier for a STIX Object.';
                    break;
                }
            }
            break;
        }
        case 'object_refs': {
            switch (object_type) {
                case 'grouping':
                case 'report': {
                    tooltip = 'Specifies the STIX Objects that are referred to by this ' + displayName + '.';
                    break;
                }
                case 'observed-data': {
                    tooltip =
                        'A list of SCOs and SROs representing the observation. This MUST contain at least<br>one SCO reference if defined. Relevant objects in the bundle will be in dropdown.';
                    break;
                }
                default: {
                    tooltip = 'The STIX Objects that the ' + displayName + ' is being applied to.';
                }
            }
            break;
        }
        case 'objective': {
            tooltip =
                'The Campaign’s primary goal, objective, desired outcome, or intended effect — what the Threat Actor or Intrusion Set hopes to accomplish with this Campaign..';
            break;
        }
        case 'observed_data_refs': {
            tooltip = 'ID Reference of Observed Data SDOs that were actually seen on systems and network.';
            break;
        }
        case 'opened_connection_refs': {
            switch (object_type) {
                case 'process': {
                    tooltip = 'List of network connections opened by the process, as a<br>reference to one or more Network Traffic objects.';
                    break;
                }
            }
            break;
        }
        case 'operating_system_ref': {
            tooltip =
                'The operating system used for the dynamic analysis of the malware instance<br>or family: actual and virtualized operating systems.';
            break;
        }
        case 'parent_ref': {
            switch (object_type) {
                case 'process': {
                    tooltip = 'The other process that this process object spawned from.';
                    break;
                }
            }
            break;
        }
        case 'path': {
            tooltip = 'The originally observed path to the directory on the file system, e.g. C:/example/';
            break;
        }
        case 'path_enc': {
            tooltip = 'The observed encoding for the path.';
            break;
        }
        case 'pattern': {
            tooltip = 'The detection pattern MAY be expressed as a STIX Pattern <br> or another appropriate language such as SNORT, YARA, etc.';
            break;
        }
        case 'payload_bin': {
            tooltip =
                'The binary data contained in the artifact as a base64-encoded string. If a non-base64 input is entered, it will be encrypted on form submission';
            break;
        }
        case 'phase_name': {
            tooltip = 'The name of the phase in the kill chain.';
            break;
        }
        case 'precision': {
            tooltip = 'Precision of the coordinates measured in meters.';
            break;
        }
        case 'product': {
            tooltip =
                'The name of the analysis engine or product that was used. Product<br>names SHOULD be all lowercase with words separated by a dash "-".';
            break;
        }
        case 'protocols': {
            tooltip =
                'Protocols MUST be listed in low to high order, from outer to inner in terms of packet encapsulation. That is, the protocols in the outer level of the packet, such as IP, MUST be listed first.';
            break;
        }
        case 'raw_email_ref': {
            tooltip = 'The raw binary contents of the email message, including<br>both the headers, and body referenced to an Artifact object.';
            break;
        }
        case 'received_lines': {
            tooltip =
                'Specifies one or more "Received" header fields that may be included in the email headers.<br>List values MUST appear in the same order as present in the email message.';
            break;
        }
        case 'resolves_to_refs': {
            switch (object_type) {
                case 'domain-name': {
                    tooltip =
                        'References to one or more IP addresses or domain names that the domain name<br>resolves to. MUST be of type ipv4-addr or ipv6-addr or domain-name.';
                    break;
                }
                case 'ipv4-addr': {
                    tooltip =
                        'References to one or more Layer 2 Media Access Control<br>(mac-addr objects) addresses that the IPv4 address resolves to.';
                    break;
                }
                case 'ipv6-addr': {
                    tooltip =
                        'Specifies a list of references to one or more Layer 2 Media Access Control (MAC) addresses<br>that the IPv6 address resolves to. Relevant objects in the bundle will be in dropdown.';
                    break;
                }
            }
            break;
        }
        case 'result_name': {
            tooltip = 'The classification result or name assigned to the malware instance by the scanner tool.';
            break;
        }
        case 'rir': {
            tooltip = 'The name of the Regional Internet Registry (RIR) that assigned the number to the AS.';
            break;
        }
        case 'roles': {
            tooltip = 'The list of roles that this object performs.';
            break;
        }
        case 'sample_refs': {
            switch (object_type) {
                //to be determined
                case 'malware': {
                    tooltip = 'Specifies a list of identifiers of the SCO file or artifact objects associated with this malware instance or family.';
                    break;
                }
                case 'malware-analysis': {
                    tooltip = 'Reference the SCO file, network traffic or artifact object that this malware analysis was performed against.';
                    break;
                }
            }
            break;
        }
        case 'schema': {
            tooltip = 'The definition of the extension, either as a URL<br>or as plain text explaining the definition.';
            break;
        }
        case 'sectors': {
            tooltip = 'The list of industry sectors that this identity belongs to.';
            break;
        }
        case 'sender_ref': {
            tooltip = 'The email-address(es) of the person or system responsible for SENDING the message.';
            break;
        }
        case 'signature_algorithm': {
            tooltip = 'Name of the algorithm used to sign the certificate.';
            break;
        }
        case 'size': {
            tooltip = 'Specifies the size of the file, in bytes. The value of this property MUST NOT be negative.';
            break;
        }
        case 'src_byte_count': {
            tooltip = 'The number of bytes, as positive integer, sent from the source to the destination.';
            break;
        }
        case 'src_packets': {
            tooltip = 'The number of packets, as a positive integer, sent from the source to the destination.';
            break;
        }
        case 'src_payload_ref': {
            switch (object_type) {
                case 'network-traffic': {
                    tooltip = 'The type of bytes/artifact objects sent from the source to the destination.';
                    break;
                }
            }
            break;
        }
        case 'src_port': {
            tooltip = 'Port used in the network traffic, as an integer. Value MUST be in the range of 0 - 65535.';
            break;
        }
        case 'src_ref': {
            switch (object_type) {
                case 'network-traffic': {
                    tooltip =
                        'Source of the network traffic, as a reference to a Cyber-observable<br>Object: ipv4-addr, ipv6-addr, mac-addr, or domain-name.';
                    break;
                }
            }
            break;
        }
        case 'subject': {
            switch (object_type) {
                case 'email-message': {
                    tooltip = 'The subject of the email message.';
                    break;
                }
                case 'x509-certificate': {
                    tooltip = 'Name stored in the subject public key field of the certificate.';
                    break;
                }
            }

            break;
        }
        case 'subject_public_key_algorithm': {
            tooltip = 'Name of the algorithm with which to encrypt data being sent to the subject.';
            break;
        }
        case 'subject_public_key_exponent': {
            tooltip = "Exponent portion of the subject's public RSA key, as an integer.";
            break;
        }
        case 'subject_public_key_modulus': {
            tooltip = "Modulus portion of the subject's public RSA key.";
            break;
        }
        case 'summary': {
            //To be determined
            tooltip = '';
            break;
        }
        case 'swid': {
            tooltip = 'Specifies the Software Identification (SWID) Tags entry for the software, if available.';
            break;
        }
        case 'tool_version': {
            tooltip = 'The version identifier associated with the Tool.';
            break;
        }
        case 'to_refs': {
            tooltip = '"To:" recipients of the email message.';
            break;
        }
        case 'user_id': {
            tooltip =
                'Specifies the identifier of the account. The format of the identifier depends on the system the user account is maintained in, and may be a numeric ID, a GUID, an account name, an email address, etc. The user_id property should be populated with whatever field is the unique identifier for the system the account is a member of. For example, on UNIX systems it would be populated with the UID.';
            break;
        }
        case 'valid_from': {
            tooltip = 'The time from which this indicator should be considered valuable intelligence.';
            break;
        }
        case 'valid_until': {
            tooltip = 'The time at which this indicator should no longer be considered valuable intelligence.';
            break;
        }
        case 'value': {
            switch (object_type) {
                case 'domain-name': {
                    tooltip = 'Specifies the value of the domain name, e.g. example.com';
                    break;
                }
                case 'email-addr': {
                    tooltip = 'The value of the email address, not the display name, e.g. jane.smith@example.com';
                    break;
                }
                case 'ipv4-addr': {
                    tooltip = 'One or more IPv4 addresses expressed using CIDR notation, e.g. 0.0.0.0';
                    break;
                }
                case 'ipv6-addr': {
                    tooltip = 'One or more IPv6 addresses expressed using CIDR notation, e.g. 0:0:0:0:0:0:0:0';
                    break;
                }
                case 'mac-addr': {
                    tooltip =
                        'MAC address value MUST be represented as a single colon-delimited, lowercase<br>MAC-48 address, include leading zeros for each octet: 00:00:ab:cd:ef:01';
                    break;
                }
                case 'url': {
                    tooltip = 'Specifies the value of the URL, e.g. https://www.example.com';
                    break;
                }
            }
            break;
        }
        case 'version': {
            switch (object_type) {
                case 'extension-definition': {
                    tooltip = 'The version of this extension.';
                    break;
                }
            }
            break;
        }
        case 'where_sighted_refs': {
            tooltip = "ID Reference of who had a sighting of the object and/or Location of SDO's where sighting occured.";
            break;
        }
        default: {
            tooltip = '';
        }
    }
    return tooltip;
}

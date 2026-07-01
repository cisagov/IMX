//global contents

import { Artifact } from './artifact';
import { AttackPattern } from './attack-pattern';
import { Autonomous } from './autonomous';
import { Campaign } from './campaign';
import { Coa } from './coa';
import { Directory } from './directory';
import { DomainName } from './domain-name';
import { EmailAddress } from './email-address';
import { EmailMessage } from './email-message';
import { File } from './file';
import { Grouping } from './grouping';
import { Identity } from './identity';
import { Incident } from './incident';
import { Indicator } from './indicator';
import { Infrastructure } from './infrastructure';
import { IntrusionSet } from './intrusion-set';
import { Ipv4Addr } from './ipv4';
import { Ipv6Addr } from './ipv6';
import { LanguageContent } from './language-content';
import { ExtensionDefinition } from './extension-definition';
import { Location } from './location';
import { MacAddress } from './mac-address';
import { Malware } from './malware';
import { MalwareAnalysis } from './malware-analysis';
import { MarkingDefinition } from './marking-definition';
import { Mutex } from './mutex';
import { NetworkTraffic } from './network-traffic';
import { Note } from './note';
import { ObservedData } from './observed-data';
import { Opinion } from './opinion';
import { Process } from './process';
import { Relationship } from './relationship';
import { Report } from './report';
import { Sighting } from './sighting';
import { Software } from './software';
import { ThreatActor } from './threat-actor';
import { Tool } from './tool';
import { Url } from './url';
import { UserAccount } from './user-account';
import { Vulnerability } from './vulnerability';
import { WindowsRegistryKey } from './windows-registry-key';
import { XCert } from './x-cert';
import { StixService } from '../stix-service.service';

let modelMap = new Map<string, Object>();

export const COMPONENT_MAP = modelMap;

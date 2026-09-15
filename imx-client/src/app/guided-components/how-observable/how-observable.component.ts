import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { faEye, faAngleDoubleDown, faAngleDown, faAngleUp, faQuestionCircle, faPlus, faTrash, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { PROTOCOL } from 'src/app/models/protocols';
import { StixService } from 'src/app/stix-service.service';
import { MatDialog } from '@angular/material/dialog';
import { MultipartDialogComponent } from 'src/app/dialogs/multipart-dialog/multipart-dialog.component';
import { EnvService } from 'src/app/env-service/env.service';
import { GuidedService } from 'src/app/guided.service';
import * as moment from 'moment';
import * as moment_tz from 'moment-timezone';
import all_schemas from '../../bundle/schemas.json';

@Component({
    selector: 'app-how-observable',
    templateUrl: './how-observable.component.html',
    styleUrls: ['./how-observable.component.css'],
    standalone: false,
})
export class HowObservableComponent implements OnInit, OnDestroy {
    //With Parent
    @Output() showAssistance = new EventEmitter<any>();
    @Output() changePage = new EventEmitter<any>();

    component: string = 'how-observable';

    private cartSubscriptions: Subscription[] = [];

    faAngleDoubleDown = faAngleDoubleDown;
    faAngleDown = faAngleDown;
    faAngleUp = faAngleUp;
    faPlus = faPlus;
    faTrash = faTrash;
    faQuestionCircle = faQuestionCircle;
    faEye = faEye;
    faInfoCircle = faInfoCircle;

    observed = null;
    currentObservableType: string = '';
    currentObservableAlignment: string = '';
    currentAttacker: string = '';
    currentTarget: string = '';
    // timeZone: string = '';
    numberObserved: string = '';
    firstObserved: string = '';
    lastObserved: string = '';
    firstObservedTimeZone: string = '';
    lastObservedTimeZone: string = '';
    first_seen: Date;
    last_seen: Date;
    currentObservableInfo: any[] = [];
    currentObservableInput: any[] = [];
    listOfAttackers: any[] = [];
    listOfTargets: any[] = [];
    previousAlignment: string;
    alignment: any;

    timeZoneOptions: any[] = [];
    moment = moment;
    moment_tz = moment_tz;

    observableTypeDropdown: boolean = false;
    observableValueDropdown: boolean = false;
    observableTimeDropdown: boolean = false;
    observableAlignmentDropdown: boolean = false;
    showObservableAlignment: boolean = false;
    showObservableTime: boolean = false;
    observableErrorMessage: string | null = null;
    cartIds: number[] = [];
    objectIds: string[] = [];
    editMode: boolean = false;

    firstDateStart: Date;
    lastDateStart: Date;

    networkTrafficOptions: string[] = this.getNetworkTrafficOptions();
    filteredProtocolOptions: string[] = this.getNetworkTrafficOptions();
    showProtocolDropdown: boolean = false;

    malwareAnalysisResultOptions = ['Malicious', 'Suspicious', 'Benign', 'Unknown'];

    observableOptions: any[] = [
        'Artifact',
        'Autonomous System',
        'Directory',
        'Domain Name',
        'Email Address',
        'Email Message',
        'File',
        'IPv4 Address',
        'IPv6 Address',
        'Mac Address',
        'Malware',
        'Malware Analysis',
        'Mutex',
        'Network Traffic',
        'Process',
        'Software',
        'URL',
        'User Account',
        'Windows Registry Key',
        'X509 Certificate',
    ];

    observableInfo: any = {
        Artifact: ['An array of bytes (8-bit) as a base64 encoded string', 'A link to a file-like payload'],
        'Autonomous System': [
            'Properties of one or more an Autonomous System (AS)',
            'Suggested details include: Name, Number, and Regional Internet Registry (RIR)',
        ],
        Directory: [
            'Properties of one or more file system directory paths and associated meta-data',
            'Suggested details include: full path (example “c:windowssystem32” OR “/tmp” ), path encoding, creation time, modification time, and access time',
        ],
        'Domain Name': [
            'Properties of one or more network domain name and associated meta-data',
            'Suggested details include: domain name, canonical name, and IPv4 or IPV6 address(es) the domain resolves to',
        ],
        'Email Address': [
            'Properties of one or more email addresses',
            'Suggested details include: email address, display name, and associated user account',
        ],
        'Email Message': ['The headers are raw content of one or more email messages'],
        File: [
            'Properties of one or more file system directory paths and associated meta-data',
            'Suggested details include: full path (example “c:windowssystem32” OR “/tmp” ), path encoding, creation time, modification time, and access time',
        ],
        'IPv4 Address': ['One or more IPv4 addresses', 'Suggested details include: IPv4 addresses'],
        'IPv6 Address': ['One or more IPv6 addresses', 'Suggested details include: IPv6 addresses'],
        'Mac Address': [
            'Specifies the value of a single MAC address.',
            'The MAC address value MUST be represented as a single colon-delimited, lowercase MAC-48 address, which MUST include leading zeros for each octet.',
        ],
        Malware: [
            'Name: Name of the malware described',
            'Is Family: Whether the object represents a malware family (True) or a malware instance (False)',
        ],
        'Malware Analysis': [
            'Product Name: Should be ALL lowercase with words separated by a dash "-"',
            'Result or Analysis Refs is required to create a Malware Analysis Object',
        ],
        Mutex: ['Properties of a Mutual Exclusion Object', 'Suggested details include: name and if known associated application or system resource'],
        'Network Traffic': [
            'Network traffic that originates from a source and is addressed to a destination',
            'Suggested Details include: start date & time, end date & time, source ip(s), destination ip(s), source port(s), destination port(s), protocol(s), session flags, packet counts, byte counts, netflow snippets, ipfix data ( must be in key:value pair format ), Zeek log snippets, and other traffic log snippets',
        ],
        Process: [
            'Properties of one or more system processes',
            'Suggested details include: name, process id, created time, command line, environment variables, process parent(s), process child(ren), is process hidden, current working directory, is ASLR enabled, is dep enabled, window title, integrity level, and hash ( must include hash algorithm and hash value separated by a colon, example md5:d41d8cd98f00b204e9800998ecf8427e )',
        ],
        Software: ['Properties of one or more software applications', 'Suggested details include: name, version, and vendor'],
        URL: [
            'The properties of a Uniform Resource Locator (URL)',
            'Suggested details include: the string value of URL OR string value of the URL and associated Uniform Resource Information (URI)',
        ],
        'User Account': [
            'Properties of one or more instances of any type of user account, including but not limited to operating system, device, messaging service, and social media platform accounts.',
            'Suggested details include: user id, account login string, account type, display name, identity management service, is this a service account, is this a privileged account, can this account escalate privileges, creation date, credential change date, first logon date, last logon date, is Multi-Factor Authentication (MFA) enabled, MFA type, MFA service provider, is the credential hardcoded, groups the account is a member of, the home directory, and command shell',
        ],
        'Windows Registry Key': [
            'Properties of one or more instances of any type of user account, including but not limited to operating system, device, messaging service, and social media platform accounts.',
            'Suggested details include: user id, account login string, account type, display name, identity management service, is this a service account, is this a privileged account, can this account escalate privileges, creation date, credential change date, first logon date, last logon date, is Multi-Factor Authentication (MFA) enabled, MFA type, MFA service provider, is the credential hardcoded, groups the account is a member of, the home directory, and command shell',
        ],
        'X509 Certificate': [
            'Properties and values of an X.509 certificate.',
            'Suggested details include: is it self signed, version, serial number, signature algorithm, issuer, valid not before date, valid not after date, certificate hash ( calculated for the entire contents of the hash ), subject, and subject public key algorithm',
            'Suggested X.509 extension details include: basic constraints, name constraints, policy constraints, key usage, extended key usage, subject key identifier, authority key identifier, subject alternative name, issuer, alternative name, issuer alternative name, crl distribution points, inhibit any policy value, private key usage period not before, private key usage period not after, and certificate policies value(s)',
        ],
    };

    observableInputFields: any = {
        Artifact: [
            {
                index: 0,
                header: 'Payload Bin / URL',
                field_options: ['URL', 'Payload Bin'],
                placeholders: {
                    URL: 'Enter URL or URI',
                    'Payload Bin': 'Enter Payload Bin',
                },
                select_placeholder: 'Select Field',
                currentPlaceholder: '',
                currentField: '',
                type: 'hybrid',
                value: '',
                show: true,
                error: '',
            },
            {
                index: 1,
                header: 'Hash Type',
                field_options: ['MD5', 'SHA-1', 'SHA-256', 'SHA-512', 'SHA3-256', 'SHA3-512', 'SSDEEP', 'TLSH'],
                placeholders: {
                    MD5: 'Enter MD5',
                    'SHA-1': 'Enter SHA-1',
                    'SHA-256': 'Enter SHA-256',
                    'SHA-512': 'Enter SHA-512',
                    'SHA3-256': 'Enter SHA3-256',
                    'SHA3-512': 'Enter SHA3-512',
                    SSDEEP: 'Enter SSDEEP',
                    TLSH: 'Enter TLSH',
                },
                select_placeholder: 'Select Hash Type',
                currentPlaceholder: '',
                type: 'hybrid',
                value: '',
                currentField: '',
                show: false,
                error: '',
            },
        ],
        'Autonomous System': [
            {
                placeholder: 'Enter Number',
                header: 'Number',
                type: 'number',
                value: '',
                currentField: 'number',
                show: true,
                error: '',
            },
        ],
        Directory: [
            {
                placeholder: 'Enter Path',
                header: 'Path',
                type: 'text',
                value: '',
                currentField: 'path',
                show: true,
                error: '',
            },
        ],
        'Domain Name': [
            {
                placeholder: 'Enter Domain Name',
                header: 'Domain Name',
                type: 'text',
                value: '',
                currentField: 'value',
                show: true,
                error: '',
            },
        ],
        'Email Address': [
            {
                placeholder: 'Enter Email Address',
                header: 'Email Address',
                type: 'text',
                value: '',
                currentField: 'value',
                show: true,
                error: '',
            },
        ],
        'Email Message': [
            {
                index: 0,
                placeholder: 'Is Body Multipart?',
                header: 'Is Body Multipart?',
                type: 'select',
                options: ['true', 'false'],
                value: '',
                currentField: 'is_multipart',
                show: true,
                error: '',
            },
            {
                index: 1,
                header: 'Body Multipart',
                currentPlaceholder: 'Build Body Multipart -->',
                type: 'text-modal-add',
                value: '',
                currentField: 'body_multipart',
                show: false,
                error: '',
                arr: [],
            },
            {
                placeholder: 'Subject',
                type: 'text',
                header: 'Subject',
                value: '',
                currentField: 'subject',
                show: true,
                error: '',
            },
        ],
        File: [
            {
                index: 0,
                placeholder: 'Enter Name',
                header: 'Name',
                type: 'text',
                value: '',
                currentField: 'name',
                show: true,
                error: '',
            },
            {
                index: 1,
                header: 'Hash Type',
                field_options: ['MD5', 'SHA-1', 'SHA-256', 'SHA-512', 'SHA3-256', 'SHA3-512', 'SSDEEP', 'TLSH'],
                placeholders: {
                    MD5: 'Enter MD5',
                    'SHA-1': 'Enter SHA-1',
                    'SHA-256': 'Enter SHA-256',
                    'SHA-512': 'Enter SHA-512',
                    'SHA3-256': 'Enter SHA3-256',
                    'SHA3-512': 'Enter SHA3-512',
                    SSDEEP: 'Enter SSDEEP',
                    TLSH: 'Enter TLSH',
                },
                select_placeholder: 'Select Hash Type',
                currentPlaceholder: '',
                type: 'hybrid',
                value: '',
                currentField: '',
                show: true,
                error: '',
            },
        ],
        'IPv4 Address': [
            {
                placeholder: 'Enter IPv4',
                header: 'IPv4 Address',
                type: 'text',
                value: '',
                currentField: 'value',
                show: true,
                error: '',
            },
        ],
        'IPv6 Address': [
            {
                placeholder: 'Enter IPv6',
                header: 'IPv6 Address',
                type: 'text',
                value: '',
                currentField: 'value',
                show: true,
                error: '',
            },
        ],
        'Mac Address': [
            {
                placeholder: 'Enter Mac Address',
                header: 'MAC Address',
                type: 'text',
                value: '',
                currentField: 'value',
                show: true,
                error: '',
            },
        ],
        Malware: [
            {
                index: 0,
                header: 'Name',
                placeholder: 'Enter Name',
                type: 'text',
                value: '',
                currentField: 'name',
                show: true,
                error: '',
            },
            {
                index: 1,
                header: 'Is Family?',
                placeholder: 'Is Family?',
                type: 'select',
                options: [true, false],
                value: '',
                currentField: 'is_family',
                show: true,
                error: '',
            },
        ],
        'Malware Analysis': [
            {
                index: 0,
                header: 'Product',
                placeholder: 'Enter Product',
                type: 'text',
                value: '',
                currentField: 'product',
                show: true,
                error: '',
            },
            {
                index: 1,
                header: 'Result or Analysis References',
                field_options: ['Result', 'Analysis References'],
                placeholders: {
                    Result: 'Enter Result',
                    'Analysis References': 'Enter Ref',
                },
                hybrid_placeholder: '',
                hybrid_options: [],
                select_placeholder: 'Select Field',
                currentPlaceholder: '',
                currentField: '',
                type: 'hybrid-hybrid-add',
                type_options: {
                    Result: 'hybrid-hybrid-add',
                    'Analysis References': 'hybrid-hybrid-add',
                },
                value: '',
                show: true,
                error: '',
                arr: [],
                resultArr: [],
            },
        ],
        Mutex: [
            {
                placeholder: 'Enter Name',
                header: 'Name',
                type: 'text',
                value: '',
                currentField: 'name',
                show: true,
                error: '',
            },
        ],
        'Network Traffic': [
            {
                index: 0,
                header: 'Protocol',
                field_options: this.networkTrafficOptions,
                placeholders: {},
                currentPlaceholder: 'Enter Protocol',
                currentField: 'protocols',
                select_placeholder: 'Select Protocol',
                type: 'hybrid-add',
                value: '',
                show: true,
                error: '',
                arr: [],
            },
            {
                index: 1,
                field_options: [],
                placeholders: {
                    'Enter Source Ref': 'Enter Source',
                },
                header: 'Source Ref',
                select_placeholder: 'Select Source',
                currentPlaceholder: 'Enter Source',
                currentField: 'src_ref',
                type: 'hybrid',
                value: '',
                show: true,
                error: '',
            },
            {
                index: 2,
                field_options: [],
                placeholders: {
                    'Enter Destination Ref': 'Enter Destination',
                },
                header: 'Destination Ref',
                select_placeholder: 'Select Destination',
                currentPlaceholder: 'Enter Destination',
                currentField: 'dst_ref',
                type: 'hybrid',
                value: '',
                show: true,
                error: '',
            },
        ],
        Process: [
            {
                placeholder: 'Enter Process ID',
                header: 'Process ID',
                type: 'number',
                value: '',
                currentField: 'pid',
                show: true,
                error: '',
            },
        ],
        Software: [
            {
                placeholder: 'Enter Name',
                header: 'Name',
                type: 'text',
                value: '',
                currentField: 'name',
                show: true,
                error: '',
            },
        ],
        URL: [
            {
                placeholder: 'Enter URL or URI',
                header: 'URL',
                type: 'text',
                value: '',
                currentField: 'value',
                show: true,
                error: '',
            },
        ],
        'User Account': [
            {
                placeholder: 'Enter User ID',
                header: 'User ID',
                type: 'text',
                value: '',
                currentField: 'user_id',
                show: true,
                error: '',
            },
        ],
        'Windows Registry Key': [
            {
                placeholder: 'Enter Registry Key',
                header: 'Registry Key',
                type: 'text',
                value: '',
                currentField: 'key',
                show: true,
                error: '',
            },
        ],
        'X509 Certificate': [
            {
                placeholder: 'Enter Serial Number',
                header: 'Serial Number',
                type: 'text',
                value: '',
                currentField: 'serial_number',
                show: true,
                error: '',
            },
        ],
    };

    validationRegex = {
        url: new RegExp('^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:[0-9]{1,5})?(\/[^\s]*)?$'),
        payload_bin: new RegExp(/^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/),
        path: new RegExp('^(?=^.{1,200})(.*)(/|\\\\)+([^/]*)$'),
        domain_name: new RegExp('^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$'),
        email_address: new RegExp(
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        ),
        ipv4_address: new RegExp(
            '^((' +
                '(((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])[.]){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9]))' +
                '([/](3[0-2]|2[0-9]|[1-9]))?)|((' +
                '(((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])[.]){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9]))' +
                '[/](3[0-2]|2[0-9]|[1-9]))+))$'
        ),
        ipv6_address: new RegExp(
            '^((' +
                '\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))\s*' +
                '([/](12[0-8]|1[01][0-9]|[1-9][0-9]|[1-9]))?)|((' +
                '\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))\s*' +
                '[/](12[0-8]|1[01][0-9]|[1-9][0-9]|[1-9]))+))$'
        ),
        mac_address: new RegExp('^([0-9a-f]{2}[:]){5}([0-9a-f]{2})|([0-9a-f]{2}[-]){5}([0-9a-f]{2})$'),
        pid: new RegExp('^-?[1-9][0-9]*|0$'),
        key: new RegExp(
            '^HKEY_CURRENT_CONFIG|^HKEY_CURRENT_USER|^HKEY_LOCAL_MACHINE|^HKEY_USERS|^hkey_current_config|^hkey_current_user|^hkey_local_machine|^hkey_users$'
        ),
        ref: new RegExp('^(ipv4-addr|ipv6-addr|mac-addr|domain-name)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$'),
    };

    alignmentPlaceholder: any = {
        '': '',
        Target: 'Target Name',
        Attacker: 'Attacker Name',
        Unknown: '',
        Benign: '',
    };

    firstTimeZoneSearch = '';
    lastTimeZoneSearch = '';

    filteredTimeZoneOptions: string[] = [];

    showFirstTimezoneDropdown = false;
    showLastTimezoneDropdown = false;

    constructor(
        private stixService: StixService,
        public multipartDialog: MatDialog,
        public guidedService: GuidedService,
        private envService: EnvService
    ) {}

    ngOnInit(): void {
        this.cartSubscriptions.push(
            this.guidedService.addItemClicked$.subscribe((cancel) => this.addCartItem(cancel)),
            this.guidedService.updateItemClicked$.subscribe((data) => this.editCartItem(data))
        );
        this.timeZoneOptions = this.moment_tz.tz.names();

        this.stixService.bundle.objects.forEach((obj) => {
            if (obj.type == 'identity') this.listOfTargets.push(obj);
            else if (obj.type == 'threat-actor') this.listOfAttackers.push(obj);
        });

        if (this.guidedService.cart['who-individual']) {
            if (this.guidedService.cart['who-individual']['Identity'])
                this.guidedService.cart['who-individual']['Identity'].forEach((identity) => this.listOfTargets.push(identity));
            if (this.guidedService.cart['who-individual']['Threat Actor'])
                this.guidedService.cart['who-individual']['Threat Actor'].forEach((threatActor) => this.listOfAttackers.push(threatActor));
        }

        const editCartTimeout = setTimeout(() => {
            if (this.guidedService.editCartObject.component && this.guidedService.editCartObject.component === this.component) {
                this.guidedService.getEditItemTrigger$.next(this.guidedService.editCartObject);
            }
        }, 100);

        this.filteredTimeZoneOptions = this.sortTimezones(this.timeZoneOptions);

        if (this.firstObservedTimeZone) {
            this.firstTimeZoneSearch = this.guidedService.showTimezoneAndOffset(this.firstObservedTimeZone);
        }

        if (this.lastObservedTimeZone) {
            this.lastTimeZoneSearch = this.guidedService.showTimezoneAndOffset(this.lastObservedTimeZone);
        }
    }

    addCartItem(cancel) {
        if (cancel) {
            this.reset();
            this.editMode = false;
            return;
        }

        let stixObject: any = {};
        let lowercaseType: string = '';
        let objectType: string = '';

        lowercaseType = this.currentObservableType.toLowerCase();
        objectType = lowercaseType.split(' ').join('-');
        objectType = objectType.replace('address', 'addr');

        stixObject.type = objectType;
        stixObject.spec_version = '2.1';

        for (let field of this.currentObservableInput) {
            if (field.show === false) {
                continue;
            }

            field.currentField = this.getCurrentFieldName(field.currentField);
            switch (field.currentField) {
                case 'hashes':
                    stixObject['hashes'] = this.identifyHashes(field.value);
                    break;
                case 'md5':
                case 'sha-1':
                case 'sha-256':
                case 'sha-512':
                case 'sha3-256':
                case 'sha3-512':
                    stixObject['hashes'] = this.identifyHashes(field.value, field.currentField.toUpperCase());
                    break;
                case 'protocols':
                case 'body_multipart':
                    if (field.arr.length !== 0 && field.show === true) stixObject[`${field.currentField}`] = field.arr;
                    break;
                case 'analysis_sco_refs':
                    if (field.arr && field.arr.length !== 0 && field.show === true) stixObject['analysis_sco_refs'] = field.arr;
                    if (field.resultArr && field.resultArr.length > 0) stixObject['result'] = field.resultArr[0];
                    break;
                case 'result':
                    if (field.resultArr && field.resultArr.length > 0) stixObject['result'] = field.resultArr[0];
                    else if (field.value) stixObject['result'] = field.value;
                    if (field.arr && field.arr.length > 0) stixObject['analysis_sco_refs'] = field.arr;
                    break;
                case 'src_ref':
                    if (field.value && field.value !== 'Enter Source Ref') {
                        stixObject['src_ref'] = field.value.replace(/^\d+:\s*/, ''); // Quick fix for field.value forming at '1:ipv4-addr--'
                    }
                    break;
                case 'dst_ref':
                    if (field.value && field.value !== 'Enter Destination Ref') {
                        stixObject['dst_ref'] = field.value.replace(/^\d+:\s*/, ''); // Quick fix for field.value forming at '1:ipv4-addr--'
                    }
                    break;
                default:
                    stixObject[`${field.currentField}`] = field.value;
            }
        }

        let now = new Date();

        switch (this.currentObservableType) {
            case 'Malware':
                stixObject['created_by_ref'] = this.envService.env.defaultIdentity.id;
                stixObject['created'] = now.toISOString();
                break;
            case 'Malware Analysis':
                stixObject['created'] = now.toISOString();
                break;
        }

        stixObject['cartId'] = this.cartIds[0] ? this.cartIds[0] : null;
        // stixObject['id'] = this.objectIds[0] ? this.objectIds[0] : this.getStixId(stixObject);
        stixObject['id'] = this.getStixId(stixObject);

        if (this.showObservableAlignment === true) {
            stixObject['alignment'] = this.currentObservableAlignment !== '' ? this.currentObservableAlignment : null;
            stixObject['target'] = this.currentObservableAlignment === 'Target' ? this.currentTarget : null;
            stixObject['attacker'] = this.currentObservableAlignment === 'Attacker' ? this.currentAttacker : null;
        }

        if (stixObject['result']) {
            stixObject['result'] = stixObject['result'].toLowerCase();
        }

        let emitObj = {
            mode: this.component,
            push: [stixObject],
        };

        let observed = this.getObserved(stixObject.id);

        if (!observed && this.observed && this.observed.id) {
            this.guidedService.observablesToRemove.push(this.observed.id);
        }

        if (observed !== false) {
            emitObj.push.push(observed);
        }

        this.guidedService.newCartItem$.next(emitObj);
        this.guidedService.cartDisabled$.next(true);
        this.reset();
    }

    getStixId(object) {
        // let typeName = this.getObjectTypeName(object.type);
        // if (this.guidedService.editCart && this.guidedService.editCart[this.component] && this.guidedService.editCart[this.component][typeName]) {
        //     for (let oldObject of this.guidedService.editCart[this.component][typeName]) {
        //         if (oldObject.cartId === object.cartId) {
        //             return oldObject.id;
        //         }
        //     }
        // }

        return `${object.type}--${this.stixService.getUUIDFrIdContributingProperties(object)}`;
    }

    getObjectTypeName(type) {
        let result = '';
        let split = type.split('-');
        for (let i in split) {
            let word = split[i];

            if (word === 'addr') {
                split[i] = 'Address';
                continue;
            } else if (word === 'url') {
                split[i] = 'URL';
                continue;
            } else if (word.startsWith('ip')) {
                let firstLetter = word.charAt(0).toUpperCase();
                let secondLetter = word.charAt(1).toUpperCase();

                split[i] = `${firstLetter}${secondLetter}${word.slice(2)}`;
                continue;
            }

            let firstLetter = word.charAt(0).toUpperCase();
            split[i] = `${firstLetter}${word.slice(1)}`;
        }

        result = split.join(' ');

        return result;
    }

    addComponents() {
        if (this.guidedService.cartLengths[this.component] === 0) {
            this.reset();
            return;
        }
        let types = [];
        let data = [];

        for (let type in this.guidedService.cart[this.component]) {
            let objects = this.guidedService.cart[this.component][type];

            for (let obj of objects) {
                types.push(obj.type);
                let times: any;

                switch (obj.type) {
                    case 'sighting':
                        times = this.convertToUTC(obj.timeZone, obj.first_seen, obj.last_seen);
                        if (times.first) {
                            obj.first_seen = times.first.toISOString();
                        }
                        if (times.last) {
                            obj.last_seen = times.last.toISOString();
                        }
                        break;
                    case 'observed-data':
                        times = this.convertToUTC(obj.timeZone, obj.first_observed, obj.last_observed);
                        if (times.first) {
                            obj.first_observed = times.first.toISOString();
                        }
                        if (times.last) {
                            obj.last_observed = times.last.toISOString();
                        }
                }

                if (obj.timeZone) delete obj.timeZone;
                if (obj.display_name) delete obj.display_name;
                if (obj.cartId) delete obj.cartId;
                if (obj.linkId) delete obj.linkId;

                if (obj.alignment) {
                    this.guidedService.observablesWithAlignment.push(JSON.parse(JSON.stringify(obj)));
                    if (obj.alignment === 'Attacker') {
                        this.guidedService.addAttacker(obj.attacker);
                        delete obj.attacker;
                    }

                    delete obj.alignment;
                }

                data.push(obj);
            }
        }

        this.guidedService.addComponents(types, data);
        this.reset();

        if (this.guidedService.autoGenRelationships) {
            // Build relationship: Observable target alignment --- Identity (map each observable target alignment to identity sequentially)
            setTimeout(() => {
                this.guidedService.findPreviouslyAddedObjects('identity', 'identity-observable');
                this.guidedService.addedObjects.subscribe((addedObjects) => {
                    if (addedObjects.eventType === 'identity-observable' && addedObjects.objects && addedObjects.objects.length > 0) {
                        let identities = addedObjects.objects;
                        identities.sort(function (a, b) {
                            if (a.created < b.created) {
                                return -1;
                            }
                            if (a.created > b.created) {
                                return 1;
                            }
                            return 0;
                        });
                        let identityCounter = 0;

                        const targets = this.guidedService.observablesWithAlignment.filter((o) => o.alignment === 'Target');
                        identities.forEach((i) => {
                            if (i.id !== this.envService.env.defaultIdentity.id) {
                                if (targets.length > 0 && targets[identityCounter]) {
                                    this.guidedService.createRelationships('related-to', targets[identityCounter].id, i.id);
                                }

                                ++identityCounter;
                            }
                        });
                    }
                });
            }, 300);
        }
    }

    addFieldArr(field) {
        if (this.currentObservableType === 'Malware Analysis' && field.currentField === 'Result') {
            const inHybrid = field.hybrid_options.some((opt) => opt.value === field.value);
            if (inHybrid) {
                field.resultArr = [field.value];
                field.value = '';
            }
        } else {
            const hybridList = Array.isArray(field.hybrid_options) ? field.hybrid_options : [];
            const fieldList = Array.isArray(field.field_options) ? field.field_options : [];

            const inHybrid = hybridList.some((opt) => (typeof opt === 'object' ? opt.value === field.value : opt === field.value));

            const inFieldOptions = fieldList.some((opt) => (typeof opt === 'object' ? opt.value === field.value : opt === field.value));

            if (!field.arr.includes(field.value) && (inHybrid || inFieldOptions)) {
                field.arr.push(field.value);
                field.value = '';
            }
        }

        this.disableAddToCart(false);
    }

    deleteResultArr(field) {
        field.resultArr = [];
        this.disableAddToCart(false);
    }

    changeObservableType(resetInput) {
        if (resetInput) {
            this.currentObservableInput = [];
            for (let input of this.observableInputFields[this.currentObservableType]) {
                let tempObj = {};
                for (let field in input) {
                    if (field === 'arr' || field === 'resultArr') {
                        tempObj[field] = [];
                        continue;
                    }
                    tempObj[field] = input[field];
                }
                this.currentObservableInput.push(tempObj);
            }
        }

        this.currentObservableInfo = this.observableInfo[this.currentObservableType];

        switch (this.currentObservableType) {
            case '':
                this.observableValueDropdown = false;
                this.showObservableAlignment = false;
                this.showObservableTime = false;
                this.observableTimeDropdown = false;
                break;
            case 'IPv4 Address':
            case 'IPv6 Address':
            case 'Email Message':
                this.observableValueDropdown = true;
                this.showObservableAlignment = true;
                this.observableTypeDropdown = true;
                this.observableAlignmentDropdown = true;
                this.observableTimeDropdown = true;
                this.showObservableTime = true;
                break;
            case 'Malware':
            case 'Malware Analysis':
                this.observableValueDropdown = true;
                this.showObservableAlignment = false;
                this.observableTypeDropdown = true;
                this.observableAlignmentDropdown = false;
                this.observableTimeDropdown = true;
                this.showObservableTime = true;
                break;
            case 'Network Traffic':
                if (!this.editMode) {
                    this.updateCurrentPlaceholder({ target: { value: 'Enter Source Ref' } }, 1);
                    this.updateCurrentPlaceholder({ target: { value: 'Enter Destination Ref' } }, 2);
                }
                this.observableValueDropdown = true;
                this.showObservableAlignment = false;
                this.observableTypeDropdown = true;
                this.observableAlignmentDropdown = false;
                this.observableTimeDropdown = true;
                this.showObservableTime = true;
                break;
            default:
                this.observableValueDropdown = true;
                this.showObservableAlignment = false;
                this.observableTypeDropdown = true;
                this.observableAlignmentDropdown = false;
                this.observableTimeDropdown = true;
                this.showObservableTime = true;
        }

        if (this.editMode === true) {
            this.editMode = false;
            this.guidedService.editModeChange$.next(false);
        }
    }

    convertToUTC(timeZone, first: string, last: string) {
        let utc = moment.tz(timeZone).format('Z');

        let result = {};

        if (utc !== '') {
            if (first) {
                result['first'] = new Date(`${first.toString().substring(0, 24)} ${utc}`);
            }

            if (last) {
                result['last'] = new Date(`${last.toString().substring(0, 24)} ${utc}`);
            }

            return result;
        }

        return result;
    }

    deleteFieldArr(index, field) {
        field.arr.splice(index, 1);

        if (this.currentObservableType == 'Network Traffic') {
        } else if (field.arr.length === 0 && this.currentObservableType !== 'Email Message' && this.currentObservableType !== 'Malware Analysis')
            this.currentObservableInput[1].show = false;

        this.disableAddToCart(false);
    }

    disableAddToCart(isDate) {
        if (this.currentObservableInput.length === 0) {
            this.guidedService.cartDisabled$.next(true);
            return;
        }

        if (isDate === true && this.firstObserved !== '') {
            this.first_seen = new Date(this.firstObserved);
            if (this.first_seen > new Date() || this.first_seen > this.firstDateStart) this.firstDateStart = this.first_seen;
        }

        if (isDate === true && this.lastObserved !== '') {
            this.last_seen = new Date(this.lastObserved);
            if (this.last_seen < new Date() || this.last_seen < this.lastDateStart) this.lastDateStart = this.last_seen;
        }

        for (let input of this.currentObservableInput) {
            if (this.currentObservableType === 'Network Traffic') {
                const protocol = this.currentObservableInput.find((f) => f.currentField === 'protocols');
                const src = this.currentObservableInput.find((f) => f.header === 'Source Ref');
                const dst = this.currentObservableInput.find((f) => f.header === 'Destination Ref');

                const protocolFilled = protocol.arr?.length > 0;
                const srcFilled = !!src?.value && src.value !== 'Enter Source Ref';
                const dstFilled = !!dst?.value && dst.value !== 'Enter Destination Ref';

                // Protocols must be populated
                if (!protocolFilled) {
                    this.guidedService.cartDisabled$.next(true);
                    return;
                }
                // At least one must be selected
                if (!srcFilled && !dstFilled) {
                    this.guidedService.cartDisabled$.next(true);
                    return;
                }
                if (srcFilled || dstFilled) continue;
            }

            if (this.currentObservableType === 'Email Message' && input.header === 'Subject') {
                continue;
            }

            let valid = this.isValid(input);

            if (!valid && input.show === true) {
                this.guidedService.cartDisabled$.next(true);
                return;
            }
        }

        let disable = false;
        if (this.firstObserved === null) this.firstObserved = '';
        if (this.lastObserved === null) this.lastObserved = '';

        if ((this.firstObservedTimeZone !== '' && this.firstObserved === '') || (this.lastObservedTimeZone !== '' && this.lastObserved === '')) {
            disable = true;
        } else if (
            (this.firstObservedTimeZone === '' && this.firstObserved !== '') ||
            (this.lastObservedTimeZone === '' && this.lastObserved !== '')
        ) {
            disable = true;
        }

        if ((this.firstObserved === '' && this.lastObserved !== '') || (this.firstObserved !== '' && this.lastObserved === '')) {
            disable = true;
        }

        if (this.numberObserved !== '' && this.numberObserved !== null) {
            if (this.firstObserved === '' || this.lastObserved === '') disable = true;
        }

        if ((this.firstObserved !== '' || this.lastObserved !== '') && (this.numberObserved === '' || this.numberObserved === null)) {
            disable = true;
        }

        if (this.showObservableAlignment === true && this.currentObservableAlignment === 'Attacker' && this.currentAttacker === '') {
            disable = true;
        }

        if (this.showObservableAlignment === true && this.currentObservableAlignment === 'Target' && this.currentTarget === '') {
            disable = true;
        }
        this.guidedService.cartDisabled$.next(disable);
    }

    editCartItem(event: any) {
        this.reset();

        let observed: any = {};
        if (event.main && event.observed) {
            observed = event.observed;
            event = event.main;
            this.cartIds = [event.cartId, observed.cartId];
            this.objectIds = [event.id, observed.id];
        } else {
            this.cartIds = [event.cartId];
            this.objectIds = [event.id];
        }

        if (observed) {
            for (let field in observed) {
                switch (field) {
                    case 'lastObservedTimeZone':
                        this.lastObservedTimeZone = observed.lastObservedTimeZone;
                        if (this.lastObservedTimeZone) {
                            this.lastTimeZoneSearch = this.guidedService.showTimezoneAndOffset(this.lastObservedTimeZone);
                        }
                        break;
                    case 'firstObservedTimeZone':
                        this.firstObservedTimeZone = observed.firstObservedTimeZone;
                        if (this.firstObservedTimeZone) {
                            this.firstTimeZoneSearch = this.guidedService.showTimezoneAndOffset(this.firstObservedTimeZone);
                        }
                        break;
                    case 'first_seen':
                        this.firstObserved = observed.first_seen;
                        break;
                    case 'last_seen':
                        this.lastObserved = observed.last_seen;
                        break;
                    case 'count':
                        this.numberObserved = observed.count;
                        break;
                    case 'first_observed':
                        this.firstObserved = observed.first_observed;
                        break;
                    case 'last_observed':
                        this.lastObserved = observed.last_observed;
                        break;
                    case 'number_observed':
                        this.numberObserved = observed.number_observed;
                        break;
                }
            }

            this.observed = observed;
        }

        if (!this.firstObserved) this.firstObservedTimeZone = '';
        if (!this.lastObserved) this.lastObservedTimeZone = '';

        let type = this.guidedService.getObjectTypeName(event.type);

        this.currentObservableType = type;
        this.currentObservableInfo = this.observableInfo[type];

        if (event.alignment) {
            this.currentObservableAlignment = event.alignment;
            if (event.target) {
                this.currentTarget = event.target;
                this.previousAlignment = `target-${event.target}`;
            } else if (event.attacker) {
                this.previousAlignment = `attacker-${event.attacker}`;
                this.currentAttacker = event.attacker ? event.attacker : '';
            }
        }

        //Has to be copy for value not reference
        this.currentObservableInput = [];
        for (let i in this.observableInputFields[this.currentObservableType]) {
            let input = this.observableInputFields[this.currentObservableType][i];
            let tempObj = {};
            for (let field in input) {
                let doNotTouch = [];

                switch (this.currentObservableType) {
                    case 'Artifact':
                        doNotTouch = ['currentField', 'currentPlaceholder', 'show'];
                        // --- Row 0: URL / Payload Bin ---
                        if (field === 'value' && input.index === 0) {
                            if (event.url) {
                                tempObj['value'] = event.url;
                                tempObj['currentField'] = 'URL';
                                tempObj['currentPlaceholder'] = input.placeholders['URL'];
                                tempObj['show'] = true;
                            } else if (event.payload_bin) {
                                tempObj['value'] = event.payload_bin;
                                tempObj['currentField'] = 'Payload Bin';
                                tempObj['currentPlaceholder'] = input.placeholders['Payload Bin'];
                                tempObj['show'] = true;
                            }
                            continue;
                        }

                        // --- Row 1: Hash Type / Hash Value ---
                        if (field === 'value' && input.index === 1) {
                            if (event.hashes) {
                                const hashType = Object.keys(event.hashes)[0];
                                const hashValue = event.hashes[hashType];

                                tempObj['value'] = hashValue;
                                tempObj['currentField'] = hashType; // e.g., MD5, SHA-256
                                tempObj['currentPlaceholder'] = input.placeholders[hashType];
                                tempObj['select_placeholder'] = input.select_placeholder;
                                tempObj['show'] = true;
                            } else {
                                tempObj['value'] = '';
                                tempObj['currentField'] = '';
                                tempObj['currentPlaceholder'] = '';
                                // tempObj['show'] = false;
                            }
                            continue;
                        }

                        // Skip protected fields
                        if (doNotTouch.includes(field)) {
                            continue;
                        }

                        // Default behavior:
                        tempObj[field] = input[field];
                        break;
                    case 'Email Message':
                        doNotTouch = ['show'];
                        if (this.currentObservableInput.length === 0) {
                            if (field === 'value') {
                                tempObj['value'] = event[input.currentField];
                                tempObj['show'] = true;
                                continue;
                            }
                        } else {
                            if (field === 'arr') {
                                if (event.is_multipart === 'true') {
                                    tempObj['arr'] = event.body_multipart;
                                    tempObj['show'] = true;

                                    tempObj['type'] = 'text-modal-add';
                                    tempObj['currentField'] = 'body_multipart';
                                } else {
                                    tempObj['arr'] = [];
                                    tempObj['show'] = false;
                                }
                                continue;
                            }
                        }

                        if (field === 'header') {
                            tempObj['value'] = event[input.currentField];
                            tempObj['header'] = 'Subject';
                            tempObj['show'] = true;
                            break;
                        }

                        if (doNotTouch.includes(field)) continue;

                        if (!tempObj['value']) {
                            tempObj[field] = input[field];
                        }

                        break;
                    case 'File':
                        doNotTouch = ['currentField', 'currentPlaceholder'];
                        if (field === 'value') {
                            if (input.currentField === 'name') {
                                tempObj['value'] = event.name;
                                tempObj['currentField'] = 'Name';
                                tempObj['currentPlaceholder'] = input.placeholder;
                            } else {
                                // Hash Type
                                tempObj['value'] = event.hashes[Object.keys(event.hashes)[0]];
                                tempObj['currentField'] = Object.keys(event.hashes)[0];
                                tempObj['currentPlaceholder'] = `Enter ${Object.keys(event.hashes)[0]}`;
                                tempObj['select_placeholder'] = 'Hash Type';
                            }
                            continue;
                        } else if (doNotTouch.includes(field)) {
                            continue;
                        }
                        tempObj[field] = input[field];
                        break;
                    case 'Malware Analysis':
                        doNotTouch = ['currentField', 'currentPlaceholder', 'type', 'arr', 'resultArr', 'hybrid_options', 'hybrid_placeholder'];

                        if (this.currentObservableInput.length === 0 && field === 'value') {
                            tempObj['value'] = event.product;
                            continue;
                        } else if (field === 'value') {
                            let target = '';
                            tempObj['resultArr'] = [];
                            tempObj['arr'] = [];
                            tempObj['value'] = '';

                            if (event.result) {
                                target = 'Result';
                                let capitalizedResult = event.result.charAt(0).toUpperCase() + event.result.slice(1);
                                tempObj['resultArr'] = [capitalizedResult];
                            }
                            if (event.analysis_sco_refs) {
                                if (!target) target = 'Analysis References';
                                tempObj['arr'] = event.analysis_sco_refs;
                            }

                            if (!target) target = '';

                            if (target) {
                                tempObj['currentField'] = target;
                                tempObj['currentPlaceholder'] = input.placeholders[target];
                                tempObj['type'] = input.type_options[target];
                                tempObj['hybrid_placeholder'] = input.placeholders[target].replace('Enter', 'Select');
                                tempObj['hybrid_options'] = this.getMalwareAnalysisOptions(tempObj);
                            } else {
                                tempObj['currentField'] = '';
                            }
                            continue;
                        } else if (this.currentObservableInput.length !== 0 && doNotTouch.includes(field)) {
                            continue;
                        }

                        tempObj[field] = input[field];
                        break;
                    case 'Network Traffic':
                        doNotTouch = ['currentPlaceholder', 'currentField', 'hybird_options', 'hybrid_placeholder', 'show'];

                        if (this.currentObservableInput.length === 0 && (field === 'value' || field === 'arr')) {
                            tempObj['value'] = '';
                            tempObj['arr'] = event.protocols;

                            continue;
                        } else if (field === 'value') {
                            let target = '';

                            if (input.currentField == 'src_ref') {
                                target = 'src_ref';
                                if (event.src_ref) tempObj['value'] = event.src_ref;
                            }

                            if (input.currentField == 'dst_ref') {
                                target = 'dst_ref';
                                if (event.dst_ref) tempObj['value'] = event.dst_ref;
                            }

                            tempObj['currentField'] = target;
                            tempObj['currentPlaceholder'] = input.currentPlaceholder;
                            tempObj['field_options'] = this.getNetworkTafficAllowedRefs();
                            tempObj['show'] = true;

                            continue;
                        } else if (this.currentObservableInput.length !== 0 && doNotTouch.includes(field)) {
                            continue;
                        }

                        tempObj[field] = input[field];
                        break;
                    default:
                        if (field === 'value') {
                            tempObj[field] = event[input.currentField];
                            continue;
                        }

                        tempObj[field] = input[field];
                }
            }
            this.currentObservableInput.push(tempObj);
        }
        this.editMode = true;
        this.changeObservableType(false);
        this.disableAddToCart(false);
    }

    getCurrentFieldName(currentField) {
        let result = '';
        switch (currentField) {
            case 'Hash':
                result = `${currentField.toLowerCase()}es`;
                break;
            case 'URL':
                result = `${currentField.toLowerCase()}`;
                break;
            case 'Payload Bin':
                result = `${currentField.toLowerCase()}`;
                result = result.replace(' ', '_');
                break;
            case 'Source Ref':
                result = 'src_ref';
                break;
            case 'Target Ref':
                result = 'dst_ref';
                break;
            case 'Analysis Sco Refs':
            case 'Analysis References':
                result = 'analysis_sco_refs';
                break;
            default:
                result = currentField ? currentField.toLowerCase() : null;
        }

        return result;
    }

    getEmailMessageAllowedRefs() {
        let allowedRefs: string[] = ['Artifact'];
        let result = [];

        for (let title of allowedRefs) {
            const items = this.guidedService.cart?.[this.component]?.[title];
            if (!items) continue;

            for (let obj of items) {
                result.push(obj);
            }
        }

        return result;
    }

    getMalwareAnalysisOptions(field) {
        switch (field.currentField) {
            case 'Result':
                return this.malwareAnalysisResultOptions.map((r) => ({
                    label: r,
                    value: r,
                }));
            case 'Analysis Sco Refs':
            case 'Analysis References':
                const options = [];

                this.stixService.bundle.objects.forEach((obj) => {
                    if (!all_schemas.SCOs.includes(obj.type)) return;

                    const label = obj.value || obj.display_name || obj.name || obj.type || '(unknown)';
                    options.push({
                        label: String(label),
                        value: String(obj.id),
                    });
                });

                for (let key in this.guidedService.cart[this.component]) {
                    if (key !== 'Malware' && key !== 'Malware Analysis') {
                        for (let i in this.guidedService.cart[this.component][key]) {
                            const item = this.guidedService.cart[this.component][key][i];

                            const label =
                                item.value || // ipv4, domain, email, many SCOs
                                item.display_name || // sometimes used in STIX
                                item.name || // fallback
                                item.type || // last-resort fallback
                                '(unknown)'; // guaranteed non-empty string

                            options.push({
                                label: String(label),
                                value: String(item.id),
                            });
                        }
                    }
                }

                return options;
        }

        return [];
    }

    getMalwareRefLabel(id: string): string {
        const cart = this.guidedService.cart?.['how-observable'] || {};

        for (const type in cart) {
            const match = cart[type].find((o) => o.id === id);
            if (match) {
                return match.display_name;
            }
        }
        return id; // fallback
    }

    getNetworkRefLabel(id: string): string {
        const cart = this.guidedService.cart?.['how-observable'];
        if (!cart) return id;

        for (const type in cart) {
            const match = cart[type].find((o) => o.id === id);
            if (match) {
                return match.display_name;
            }
        }

        // fallback
        return id;
    }
    getModalAddName(obj) {
        if (obj.body) return obj.body;
        if (obj.body_raw_ref) return obj.body_raw_ref;
    }

    getNetworkTafficAllowedRefs() {
        let allowedRefs: string[] = ['IPv4 Address', 'IPv6 Address', 'Mac Address', 'Domain Name'];
        let result = [];

        this.stixService.bundle.objects.filter((obj) => allowedRefs.includes(obj.type)).forEach((obj) => result.push(obj.id));
        for (let title of allowedRefs) {
            if (this.guidedService.cart?.[this.component]?.[title] === undefined) continue;

            for (let obj of this.guidedService.cart[this.component][title]) {
                result.push(obj.id);
            }
        }

        return result;
    }

    getNetworkTrafficOptions(): string[] {
        let options: string[] = [];

        for (let map of PROTOCOL) {
            options.push(map.value);
        }

        return options;
    }

    getObserved(id) {
        let observed = {};
        let observedType = 'observed-data';
        let isSighting = false;

        if (this.firstObservedTimeZone !== '' || this.lastObservedTimeZone !== '') {
            observed['firstObservedTimeZone'] = this.firstObservedTimeZone;
            observed['lastObservedTimeZone'] = this.lastObservedTimeZone;
            isSighting = true;
        }
        if (this.firstObserved !== '') {
            let thisType = '';
            switch (observedType) {
                case 'sighting':
                    thisType = 'first_seen';
                    break;
                case 'observed-data':
                    thisType = 'first_observed';
                    break;
            }

            observed[thisType] = this.firstObserved;
            isSighting = true;
        }
        if (this.lastObserved !== '') {
            let thisType = '';
            switch (observedType) {
                case 'sighting':
                    thisType = 'last_seen';
                    break;
                case 'observed-data':
                    thisType = 'last_observed';
                    break;
            }

            observed[thisType] = this.lastObserved;
            isSighting = true;
        }
        if (this.numberObserved !== '') {
            if (!this.firstObserved && !this.lastObserved) {
                this.numberObserved = '';
            } else {
                let thisType = '';
                switch (observedType) {
                    case 'sighting':
                        thisType = 'count';
                        break;
                    case 'observed-data':
                        thisType = 'number_observed';
                        break;
                }

                observed[thisType] = Number(this.numberObserved);
                isSighting = true;
            }
        }

        if (isSighting === false) return isSighting;

        observed['type'] = observedType;
        observed['cartId'] = this.cartIds[1] ? this.cartIds[1] : null;

        observed['spec_version'] = '2.1';
        observed['id'] = this.getStixId(observed);
        if (observed['type'] === 'sighting') {
            observed['sighting_of_ref'] = id;
        } else {
            observed['object_refs'] = [id];
        }

        return observed;
    }

    private identifyHashes(hash, hashType?: string) {
        let regex = {
            MD5: new RegExp('^[a-fA-F0-9]{32}$'),
            'SHA-1': new RegExp('^[0-9a-f]{5,40}$'),
            'SHA-256': new RegExp('^[A-Fa-f0-9]{64}$'),
            'SHA-512': new RegExp('^[a-f0-9]{128}$'),
            'SHA3-256': new RegExp('^[A-Fa-f0-9]{64}$'),
            'SHA3-512': new RegExp('^[A-Fa-f0-9]{128}$'),
            SSDEEP: new RegExp('^(\d{3}):(\w*)\+(\w*):(\w*)$'),
            TLSH: new RegExp('^T1[a-fA-F0-9]{70}$'),
        };

        if (hashType) {
            const key = hashType.trim();
            if (regex[key] && regex[key].test(hash)) {
                const result = {};
                result[key] = hash;
                return result;
            }
        } else {
            for (let exp in regex) {
                if (regex[exp].test(hash)) {
                    let result = {};
                    result[`${exp}`] = hash;
                    return result;
                }
            }
        }
        return undefined;
    }

    isValid(input) {
        if (input.value === '' && !input.type.includes('-add')) {
            if (input.type !== 'hybrid-hybrid' && input.currentPlaceholder !== 'No Refs Available') input.error = '';
            return false;
        }

        switch (input.currentField) {
            case 'Hash':
            case 'hashes':
                if (this.identifyHashes(input.value) !== undefined) {
                    input.error = '';
                } else {
                    input.error = 'Must be a valid hash (MD5, SHA-1, SHA-256, SHA-512, SSDEEP, TLSH)';
                    return false;
                }
                break;
            case 'MD5':
            case 'SHA-1':
            case 'SHA-256':
            case 'SHA-512':
            case 'SHA3-256':
            case 'SHA3-512':
            case 'SSDEEP':
            case 'TLSH':
                if (this.identifyHashes(input.value, input.currentField) !== undefined) {
                    input.error = '';
                } else {
                    input.error = `Must be a valid ${input.currentField} hash`;
                    return false;
                }
                break;
            case 'is_multipart':
                if (input.value?.length > 0) {
                    return true;
                }
                return false;
            case 'Name':
            case 'name':
            case 'user_id':
            case 'serial_number':
            case 'is_multipart':
            case 'is_family':
            case 'product':
            case 'result':
                input.error = '';
                break;
            case 'Result':
                if ((input.resultArr && input.resultArr.length > 0) || (input.arr && input.arr.length > 0)) {
                    input.error = '';
                } else {
                    return false;
                }
                break;
            case 'number':
                if (!isNaN(input.value) && input.value !== null) {
                    input.error = '';
                } else {
                    input.error = 'Must be a valid Number';
                    return false;
                }
                break;
            case 'Payload Bin':
            case 'payload_bin':
                if (this.validationRegex['payload_bin'].test(input.value)) {
                    input.error = '';
                } else {
                    input.error = 'Must be a valid Payload Bin';
                    return false;
                }
                break;
            case 'protocols':
            case 'body_multipart':
                const multiPartFound = this.currentObservableInput.filter((i) => i.currentField === 'is_multipart');

                let isMultipart = false;
                if (multiPartFound.length > 1) {
                    isMultipart = multiPartFound[0].value;
                }

                if (input.arr.length === 0 && isMultipart) return false;

                return true;
            case 'Analysis Sco Refs':
            case 'analysis_sco_refs':
            case 'Analysis References':
                if ((input.arr && input.arr.length > 0) || (input.resultArr && input.resultArr.length > 0)) {
                    input.error = '';
                } else {
                    return false;
                }
                break;
            case '':
                return false;
            case 'Source Ref':
            case 'src_ref':
            case 'Target Ref':
            case 'dst_ref':
                if (this.validationRegex['ref'].test(input.value)) {
                    input.error = '';
                } else {
                    input.error = 'Must be a valid Reference ID';
                    return false;
                }
                break;
            case 'URL':
            case 'url':
                if (this.validationRegex['url'].test(input.value)) {
                    input.error = '';
                } else {
                    input.error = 'Must be a valid URL or URI';
                    return false;
                }
                break;
            case 'value':
                let identifier = this.currentObservableType.toLowerCase();
                identifier = identifier.replace(' ', '_');

                if (this.validationRegex[identifier].test(input.value)) {
                    input.error = '';
                } else {
                    input.error = `Not a valid ${this.currentObservableType}`;
                    return false;
                }

                break;
            default:
                if (this.validationRegex[input.currentField].test(input.value)) {
                    input.error = '';
                } else {
                    let firstLetter = input.currentField.charAt(0);
                    let rest = input.currentField.slice(1);
                    input.error = `Not a valid ${firstLetter.toUpperCase() + rest}`;
                    return false;
                }
        }
        return true;
    }

    openModal(field) {
        let tempRefs = this.getEmailMessageAllowedRefs();

        switch (this.currentObservableType) {
            case 'Email Message':
                const multipartRef = this.multipartDialog.open(MultipartDialogComponent, {
                    data: { allowedRefs: tempRefs, mode: 'guided', body: '', body_raw_ref: '', content_type: '', content_disposition: '' },
                    height: '600px',
                    width: `${window.innerWidth / 1.25}px`,
                });

                multipartRef.afterClosed().subscribe((result) => {
                    if (result) field.arr.push(result);
                    this.disableAddToCart(false);
                });
        }
    }

    reset() {
        this.currentObservableType = '';
        this.currentObservableAlignment = '';
        this.currentAttacker = '';
        this.currentObservableInfo = [];
        this.currentObservableInput = [];
        this.currentTarget = '';
        this.previousAlignment = '';

        this.firstObservedTimeZone = '';
        this.lastObservedTimeZone = '';
        this.firstObserved = '';
        this.lastObserved = '';
        this.numberObserved = '';
        this.first_seen = undefined;
        this.last_seen = undefined;
        this.lastDateStart = undefined;
        this.firstDateStart = undefined;

        this.observableTypeDropdown = false;
        this.observableValueDropdown = false;
        this.observableAlignmentDropdown = false;
        this.showObservableAlignment = false;
        this.showObservableTime = false;
        this.observableTimeDropdown = false;

        this.editMode = false;
        this.cartIds = [];
        this.objectIds = [];

        this.observed = null;
    }

    redirectCart(event) {
        if (event.component !== this.component) {
            this.changePage.emit(event);
        } else {
            this.guidedService.getEditItemTrigger$.next(event);
        }
    }

    syncCart(event) {
        if (event === this.component) {
            this.guidedService.syncCartTrigger$.next();
        }
    }

    selectChange(event) {
        if (this.currentObservableType === 'Email Message') {
            switch (event.target.value) {
                case 'true':
                    this.currentObservableInput[1].show = true;
                    break;
                case 'false':
                    this.currentObservableInput[1].show = false;
            }
        }

        this.disableAddToCart(false);
    }

    showAssistanceTrigger() {
        this.showAssistance.emit();
    }

    filterProtocolOptions(field: any, value: string): void {
        const search = (value || '').toLowerCase();
        this.filteredProtocolOptions = field.field_options.filter((opt: string) => opt.toLowerCase().includes(search));
    }

    selectProtocol(field: any, opt: string): void {
        field.value = opt;
        this.filteredProtocolOptions = field.field_options;
        this.showProtocolDropdown = false;
    }

    updateCurrentPlaceholder(event, index) {
        let currentObservable = this.currentObservableInput[index];
        if (this.currentObservableType === 'Network Traffic' && (index === 1 || index === 2)) {
            const select = event.target as HTMLSelectElement;
            currentObservable.value = select.value;
            currentObservable.field_options = this.getNetworkTafficAllowedRefs();
            if (currentObservable.field_options.length !== 0) {
            } else {
                currentObservable.hybrid_placeholder = 'No Refs Available';
                currentObservable.currentPlaceholder = 'No Refs Available';
                currentObservable.error = 'Add IPv4, IPv6, Mac Address, or Domain Name to Cart';
                return;
            }
        } else if (this.currentObservableType === 'Malware Analysis' && index === 1) {
            currentObservable.value = '';
            currentObservable.error = '';
            currentObservable.hybrid_options = this.getMalwareAnalysisOptions(currentObservable);
            if (currentObservable.hybrid_options.length !== 0) {
                currentObservable.hybrid_placeholder = currentObservable.placeholders[event.target.value].replace('Enter', 'Select');
            } else {
                currentObservable.hybrid_placeholder = 'No Refs Available';
                currentObservable.currentPlaceholder = 'No Refs Available';
                currentObservable.error = 'Add another item to the cart';
            }
        } else if (this.currentObservableType === 'Artifact') {
            if (index === 0) {
                // URL → show hash row
                if (event.target.value === 'URL') {
                    this.currentObservableInput[1].show = true;
                }
                // Payload Bin → hide hash row entirely
                else if (event.target.value === 'Payload Bin') {
                    this.currentObservableInput[1].show = false;
                    this.currentObservableInput[1].value = ''; // reset hash
                    this.currentObservableInput[1].currentField = ''; // reset hash type
                    this.currentObservableInput[1].currentPlaceholder = '';
                }
            }
        }

        if (currentObservable.type_options) {
            currentObservable.type = currentObservable.type_options[event.target.value];
        }

        currentObservable.currentPlaceholder = currentObservable.placeholders[event.target.value];

        this.disableAddToCart(false);
    }

    checkObserved(observed: 'first' | 'last') {
        if (observed === 'first' && !this.firstObserved) {
            this.firstObservedTimeZone = '';
        } else if (observed === 'last' && !this.lastObserved) {
            this.lastObservedTimeZone = '';
        }
    }

    clearObserved(observed: 'first' | 'last') {
        if (observed === 'first') {
            this.firstObserved = '';
            this.firstObservedTimeZone = '';
        } else {
            this.lastObserved = '';
            this.lastObservedTimeZone = '';
        }

        this.disableAddToCart(true);
    }

    onYearSelected(normalizedYear: Date, field: 'first' | 'last'): void {
        const current = field === 'first' ? this.firstObserved : this.lastObserved;
        const base = current || new Date();
        const updated = this.guidedService.applyNewYear(normalizedYear, base);
        if (!updated) return;
        if (field === 'first') this.firstObserved = updated as any;
        else this.lastObserved = updated as any;
    }

    sortTimezones(timezones: string[]): string[] {
        return [...timezones].sort((a, b) => {
            const offsetA = this.getTimezoneOffset(a);
            const offsetB = this.getTimezoneOffset(b);

            if (offsetA !== offsetB) {
                return offsetA - offsetB;
            }

            return this.guidedService.showTimezoneAndOffset(a).localeCompare(this.guidedService.showTimezoneAndOffset(b));
        });
    }

    getTimezoneOffset(timezone: string): number {
        const match = this.guidedService.showTimezoneAndOffset(timezone).match(/GMT([+-]\d+)?/);

        if (!match || !match[1]) {
            return 0;
        }

        return Number(match[1]);
    }

    filterTimezones(searchText: string): void {
        const search = searchText.toLowerCase();

        this.filteredTimeZoneOptions = this.sortTimezones(
            this.timeZoneOptions.filter((tz) => this.guidedService.showTimezoneAndOffset(tz).toLowerCase().includes(search))
        );
    }

    selectFirstTimezone(tz: string): void {
        this.firstObservedTimeZone = tz;
        this.lastObservedTimeZone = this.firstObservedTimeZone;

        this.firstTimeZoneSearch = this.guidedService.showTimezoneAndOffset(tz);
        this.lastTimeZoneSearch = this.guidedService.showTimezoneAndOffset(this.firstObservedTimeZone);

        this.showFirstTimezoneDropdown = false;

        this.disableAddToCart(false);
    }

    hideFirstTimezoneDropdown(): void {
        setTimeout(() => {
            this.showFirstTimezoneDropdown = false;
        }, 200);
    }

    selectLastTimezone(tz: string): void {
        this.lastObservedTimeZone = tz;

        this.lastTimeZoneSearch = this.guidedService.showTimezoneAndOffset(tz);

        this.showLastTimezoneDropdown = false;

        this.disableAddToCart(false);
    }

    hideLastTimezoneDropdown(): void {
        setTimeout(() => {
            this.showLastTimezoneDropdown = false;
        }, 200);
    }

    ngOnDestroy(): void {
        this.cartSubscriptions.forEach((sub) => sub.unsubscribe());
    }

    ngDoCheck() {
        let missing: string[] = [];

        if (this.firstObserved === '' || this.firstObservedTimeZone === '') {
            missing.push('First Observed');
        }
        if (this.lastObserved === '' || this.lastObservedTimeZone === '') {
            missing.push('Last Observed');
        }
        if (this.numberObserved === '' || this.numberObserved === null) {
            missing.push('Number Observed');
        }

        let anyFilled = this.firstObserved !== '' || this.lastObserved !== '' || (this.numberObserved !== '' && this.numberObserved !== null);

        if (anyFilled && missing.length) {
            this.observableErrorMessage = `Please complete the following: ${missing.join(', ')}.`;
        } else {
            this.observableErrorMessage = null;
        }
    }
}

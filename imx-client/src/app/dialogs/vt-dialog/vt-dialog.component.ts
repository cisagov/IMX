import { Component, Inject, Optional, Input, Output, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
    faBan,
    faCheck,
    faPlay,
    faArrowLeft,
    faFileImport,
    faFileUpload,
    faChevronRight,
    faAngleDoubleUp,
    faExclamationTriangle,
    faCheckCircle,
    faDownload,
    faFileDownload,
    faCaretDown,
} from '@fortawesome/free-solid-svg-icons';
import { IdentifyStixService } from '../copy-paste-dialog/identify-stix/identify-stix.service';
import { VtSearchService } from '../vt-dialog/vt-search/vt-search.service';
import { StixService } from 'src/app/stix-service.service';
import { Bundle } from '../../models/bundle';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EnvService } from 'src/app/env-service/env.service';
import { COUNTRIES } from 'src/app/models/countries';
import { v4 } from 'uuid';

export interface VtDataInput {}

type IpRelationKey = 'resolutions' | 'communicatingFiles' | 'referrerFiles' | 'historicalWhois' | 'historicalSslCerts';
type DomainRelationKey = 'resolutions' | 'subdomains' | 'communicatingFiles' | 'referrerFiles' | 'historicalWhois' | 'historicalSslCerts';
type UrlRelationKey = 'servingIp';

@Component({
    selector: 'app-vt-dialog',
    imports: [CommonModule, FormsModule, FontAwesomeModule],
    templateUrl: './vt-dialog.component.html',
    styleUrl: './vt-dialog.component.css',
})
export class VtDialogComponent {
    @Input() mode: 'standalone' | 'embedded' = 'standalone';
    @Input() preloadIndicator: string = '';
    @Input() preloadType: 'hash' | 'ip' | 'domain' | null = null;
    @Input() cachedData: any = null;
    @Output() stixObjectsSelected = new EventEmitter<any[]>();
    @Output() vtDataLoaded = new EventEmitter<any>();

    faBan = faBan;
    faCheck = faCheck;
    faPlay = faPlay;
    faArrowLeft = faArrowLeft;
    faFileImport = faFileImport;
    faFileUpload = faFileUpload;
    faAngleDoubleUp = faAngleDoubleUp;
    faExclamationTriangle = faExclamationTriangle;
    faCheckCircle = faCheckCircle;
    faChevronRight = faChevronRight;
    faFileDownload = faFileDownload;
    faCaretDown = faCaretDown;
    faDownload = faDownload;

    textBody: String = '';
    lineCount = 0;
    linesMax = 100;

    isParsed: boolean = false;
    isConfirm: boolean = false;
    selectAll: boolean = false;
    parsedObjects: any = {};
    allObjects: any[] = [];
    selectedObjects: any = {};
    showId: String = '';
    activeTab = 'jsonViewer';
    isLoading: boolean = false;
    isExtracting: boolean = false;
    extractionMessage: string = '';
    extractionError: string = '';
    collapsedCategories: Set<string> = new Set();

    imxServerConnectionError: string = '';

    tab: string = 'copy-paste';
    targetFile: File;
    formData: FormData;

    selectedFile = undefined;
    selectedFiles = [];
    acceptFileTypes = ['.json', '.txt', '.xml', '.html', '.csv', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.rtf'];
    acceptFileString = this.acceptFileTypes.join(',');

    tempBundle = new Bundle([]);
    disableParse = true;

    responseTab = 'textResponse';

    objects2DArray = [
        ['artifact', 'Artifact'],
        ['directory', 'Directory'],
        ['domain-name', 'Domain Name'],
        ['email-addr', 'Email Address'],
        ['file', 'File'],
        ['ipv4-addr', 'IPv4 Address'],
        ['ipv6-addr', 'IPv6 Address'],
        ['autonomous-system', 'Autonomous System'],
        ['mac-addr', 'Mac Address'],
        ['process', 'Process'],
        ['url', 'URL'],
        ['windows-registry-key', 'Windows Registry Key'],
        ['x509-certificate', 'X509 Certificate'],
        ['malware-analysis', 'Malware Analysis'],
        ['malware', 'Malware'],
        ['indicator', 'Indicator'],
    ];

    vtHashResult: any = {};
    vtTtpResult: any = {};

    vtResultsByHash: Map<
        string,
        {
            hash: string;
            hashResult: any;
            ttpResult: any;
            hasData: boolean;
        }
    > = new Map();

    expandedHashes: Set<string> = new Set();
    expandedWhoisRecords: Set<string> = new Set();
    expandedIdsRules: Set<string> = new Set();
    selectedIdsSeverityFilter: Map<string, string> = new Map();
    expandedSigmaRules: Set<string> = new Set();
    selectedSigmaSeverityFilter: Map<string, string> = new Map();
    sigmaFullRules: Map<string, string> = new Map();

    vtResultsByIp: Map<
        string,
        {
            ip: string;
            ipResult: any;
            hasData: boolean;
            relations?: {
                resolutions?: {
                    data: any;
                    loading: boolean;
                    loadingMore: boolean;
                    error?: string;
                    cursor: string | null;
                };
                communicatingFiles?: {
                    data: any;
                    loading: boolean;
                    loadingMore: boolean;
                    error?: string;
                    cursor: string | null;
                };
                referrerFiles?: {
                    data: any;
                    loading: boolean;
                    loadingMore: boolean;
                    error?: string;
                    cursor: string | null;
                };
                historicalWhois?: {
                    data: any;
                    loading: boolean;
                    loadingMore: boolean;
                    error?: string;
                    cursor: string | null;
                };
                historicalSslCerts?: {
                    data: any;
                    loading: boolean;
                    loadingMore: boolean;
                    error?: string;
                    cursor: string | null;
                };
            };
        }
    > = new Map();

    expandedIps: Set<string> = new Set();

    ipResultTabs: Map<string, string> = new Map();

    private convertedDomains: Map<string, Set<string>> = new Map();
    private convertedDomainResolutionIps: Map<string, Set<string>> = new Map();
    private convertedDomainCommunicatingFileHashes: Map<string, Set<string>> = new Map();
    private convertedUrlServingIps: Map<string, Set<string>> = new Map();
    private createdIpIndicators: Set<string> = new Set();
    private combinedIpPdnsIndicatorIds: Map<string, string> = new Map();
    private ipStixObjectIds: Map<string, string[]> = new Map();
    private ipExcludedObjectsStore: Map<string, any[]> = new Map();
    ipIncluded: Map<string, boolean> = new Map();

    private hashStixObjectIds: Map<string, string[]> = new Map();
    private hashExcludedObjectsStore: Map<string, any[]> = new Map();
    hashIncluded: Map<string, boolean> = new Map();

    vtResultsByDomain: Map<
        string,
        {
            domain: string;
            domainResult: any;
            hasData: boolean;
            relations?: {
                resolutions?: { data: any; loading: boolean; loadingMore: boolean; error?: string; cursor: string | null };
                subdomains?: { data: any; loading: boolean; loadingMore: boolean; error?: string; cursor: string | null };
                communicatingFiles?: { data: any; loading: boolean; loadingMore: boolean; error?: string; cursor: string | null };
                referrerFiles?: { data: any; loading: boolean; loadingMore: boolean; error?: string; cursor: string | null };
                historicalWhois?: { data: any; loading: boolean; loadingMore: boolean; error?: string; cursor: string | null };
                historicalSslCerts?: { data: any; loading: boolean; loadingMore: boolean; error?: string; cursor: string | null };
            };
        }
    > = new Map();

    expandedDomains: Set<string> = new Set();
    domainResultTabs: Map<string, string> = new Map();
    private domainStixObjectIds: Map<string, string[]> = new Map();
    private domainExcludedObjectsStore: Map<string, any[]> = new Map();
    domainIncluded: Map<string, boolean> = new Map();

    vtResultsByUrl: Map<
        string,
        {
            url: string;
            urlResult: any;
            hasData: boolean;
            relations?: {
                servingIp?: { data: any; loading: boolean; loadingMore: boolean; error?: string; cursor: string | null };
            };
        }
    > = new Map();

    expandedUrls: Set<string> = new Set();
    urlResultTabs: Map<string, string> = new Map();
    private urlStixObjectIds: Map<string, string[]> = new Map();
    private urlExcludedObjectsStore: Map<string, any[]> = new Map();
    urlIncluded: Map<string, boolean> = new Map();

    placeholderTextarea;

    searchedHashCount = 0;
    searchedIpCount = 0;
    searchedIpv4Count = 0;
    searchedIpv6Count = 0;
    searchedDomainCount = 0;
    searchedUrlCount = 0;

    get totalSearchedCount(): number {
        return this.searchedHashCount + this.searchedIpCount + this.searchedDomainCount + this.searchedUrlCount;
    }

    isMalicious = false;

    fileIds = [];

    errorAnnouncements = [];

    constructor(
        @Optional() public dialogRef: MatDialogRef<VtDialogComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: VtDataInput,
        private vtSearchService: VtSearchService,
        private stixService: StixService,
        private http: HttpClient,
        private announcementService: AnnouncementService,
        private identifyStix: IdentifyStixService,
        private envService: EnvService
    ) {}

    ngOnInit(): void {
        this.disableParse = false;

        this.placeholderTextarea = 'Enter file hashes, IP addresses, domains, or URLs (one per line), or paste any text to auto-extract indicators';

        if (this.mode === 'embedded' && this.preloadIndicator) {
            if (this.cachedData) {
                this.restoreFromCache(this.cachedData);
            } else {
                this.textBody = this.preloadIndicator;
                setTimeout(() => this.onParse(), 0);
            }
        }
    }

    private restoreFromCache(data: any): void {
        this.parsedObjects = data.parsedObjects || {};
        this.allObjects = data.allObjects || [];
        this.selectedObjects = data.selectedObjects || {};
        this.tempBundle = data.tempBundle || new Bundle([]);
        this.isParsed = data.isParsed || false;
        this.isConfirm = data.isConfirm || false;
        this.textBody = data.textBody || '';
        this.vtResultsByHash = data.vtResultsByHash || new Map();
        this.vtResultsByIp = data.vtResultsByIp || new Map();
        this.expandedHashes = data.expandedHashes || new Set();
        this.expandedIps = data.expandedIps || new Set();
        this.ipResultTabs = data.ipResultTabs || new Map();
        this.hashStixObjectIds = data.hashStixObjectIds || new Map();
        this.ipStixObjectIds = data.ipStixObjectIds || new Map();
        this.hashIncluded = data.hashIncluded || new Map();
        this.ipIncluded = data.ipIncluded || new Map();
        this.hashExcludedObjectsStore = data.hashExcludedObjectsStore || new Map();
        this.ipExcludedObjectsStore = data.ipExcludedObjectsStore || new Map();
        this.vtResultsByDomain = data.vtResultsByDomain || new Map();
        this.expandedDomains = data.expandedDomains || new Set();
        this.domainResultTabs = data.domainResultTabs || new Map();
        this.domainStixObjectIds = data.domainStixObjectIds || new Map();
        this.domainIncluded = data.domainIncluded || new Map();
        this.domainExcludedObjectsStore = data.domainExcludedObjectsStore || new Map();
        this.vtResultsByUrl = data.vtResultsByUrl || new Map();
        this.expandedUrls = data.expandedUrls || new Set();
        this.urlResultTabs = data.urlResultTabs || new Map();
        this.urlStixObjectIds = data.urlStixObjectIds || new Map();
        this.urlIncluded = data.urlIncluded || new Map();
        this.urlExcludedObjectsStore = data.urlExcludedObjectsStore || new Map();
        this.selectAll = data.selectAll || false;
        this.isLoading = false;
    }

    private emitCacheData(): void {
        if (this.mode === 'embedded') {
            this.vtDataLoaded.emit({
                parsedObjects: this.parsedObjects,
                allObjects: this.allObjects,
                selectedObjects: this.selectedObjects,
                tempBundle: this.tempBundle,
                isParsed: this.isParsed,
                isConfirm: this.isConfirm,
                textBody: this.textBody,
                vtResultsByHash: this.vtResultsByHash,
                vtResultsByIp: this.vtResultsByIp,
                expandedHashes: this.expandedHashes,
                expandedIps: this.expandedIps,
                ipResultTabs: this.ipResultTabs,
                hashStixObjectIds: this.hashStixObjectIds,
                ipStixObjectIds: this.ipStixObjectIds,
                hashIncluded: this.hashIncluded,
                ipIncluded: this.ipIncluded,
                hashExcludedObjectsStore: this.hashExcludedObjectsStore,
                ipExcludedObjectsStore: this.ipExcludedObjectsStore,
                vtResultsByDomain: this.vtResultsByDomain,
                expandedDomains: this.expandedDomains,
                domainResultTabs: this.domainResultTabs,
                domainStixObjectIds: this.domainStixObjectIds,
                domainIncluded: this.domainIncluded,
                domainExcludedObjectsStore: this.domainExcludedObjectsStore,
                vtResultsByUrl: this.vtResultsByUrl,
                expandedUrls: this.expandedUrls,
                urlResultTabs: this.urlResultTabs,
                urlStixObjectIds: this.urlStixObjectIds,
                urlIncluded: this.urlIncluded,
                urlExcludedObjectsStore: this.urlExcludedObjectsStore,
                selectAll: this.selectAll,
            });
        }
    }

    onNoClick(): void {
        if (this.dialogRef) this.dialogRef.close();
    }

    onX(): void {
        if (this.dialogRef) this.dialogRef.close();
    }

    setTab(tab) {
        this.tab = tab;
        switch (this.tab) {
            case 'copy-paste':
                if (this.textBody === '') {
                    this.disableParse = true;
                    break;
                }

                this.disableParse = false;
                break;
            default:
                this.disableParse = false;
        }
    }

    onBack(): void {
        if (this.isParsed && this.isConfirm) this.isConfirm = false;
        else if (this.isParsed) {
            this.isParsed = false;
            this.searchedHashCount = 0;
            this.searchedIpCount = 0;
            this.searchedIpv4Count = 0;
            this.searchedIpv6Count = 0;
            this.searchedDomainCount = 0;
            this.searchedUrlCount = 0;
        }
    }

    textBodyChange() {
        if (this.textBody === '') {
            this.disableParse = true;
        } else {
            this.disableParse = false;
        }
    }

    countLines(): void {
        this.lineCount = this.textBody ? this.textBody.split('\n').length : 0;
    }

    onFileChanged(event) {
        this.selectedFiles = event.target.files;
        this.targetFile = event.target.files[0];

        this.formData = new FormData();
        this.formData.append('file', this.targetFile, this.targetFile.name);

        this.extractionMessage = '';
        this.extractionError = '';
    }

    async readFileAsText(currentFile): Promise<string> {
        return new Promise((resolve) => {
            const fileReader = new FileReader();
            fileReader.readAsText(currentFile, 'UTF-8');
            fileReader.onload = () => resolve(JSON.stringify(fileReader.result));
        });
    }

    async getFilesAsString() {
        return new Promise(async (resolve) => {});
    }

    async onExtractFromFile(): Promise<void> {
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            this.extractionError = 'Please select a file first.';
            return;
        }

        this.isExtracting = true;
        this.extractionMessage = '';
        this.extractionError = '';

        try {
            const current = this.selectedFiles[0];
            const nameSplit = current.name.split('.');
            const postfix = nameSplit[nameSplit.length - 1].toLowerCase();

            let result: any = undefined;

            switch (postfix) {
                case 'json':
                case 'txt':
                case 'csv':
                case 'html':
                case 'xml':
                    let text = await this.readFileAsText(current);
                    text = text
                        .replace(/\\n/g, ' ')
                        .replace(/\\t/g, ' ')
                        .replace(/\\r/g, ' ')
                        .replace(/\\\\\\\\/g, ' ')
                        .replace(/\\\\/g, '\\');
                    result = await this.identifyStix.postIdentifyStix(text);
                    break;
                case 'pdf':
                case 'docx':
                case 'doc':
                case 'xls':
                case 'xlsx':
                case 'rtf':
                    result = await this.identifyStix.postIdentifyStixFile(this.formData, this.targetFile.name);
                    break;
                default:
                    this.extractionError = `Unsupported file type: .${postfix}`;
                    this.isExtracting = false;
                    return;
            }

            if (!result || !result.objects || result.objects.length === 0) {
                this.extractionError = 'No indicators found in the uploaded file.';
                this.isExtracting = false;
                return;
            }

            const values: string[] = [];

            for (const obj of result.objects) {
                switch (obj.type) {
                    case 'ipv4-addr':
                    case 'ipv6-addr':
                        if (obj.value) values.push(obj.value);
                        break;
                    case 'domain-name':
                        if (obj.value) values.push(obj.value);
                        break;
                    case 'file':
                        if (obj.hashes) {
                            const hash =
                                obj.hashes['SHA-256'] ||
                                obj.hashes['SHA-1'] ||
                                obj.hashes['MD5'] ||
                                obj.hashes['SHA-512'] ||
                                obj.hashes['SSDEEP'] ||
                                obj.hashes['TLSH'];
                            if (hash) values.push(hash);
                        }
                        break;
                }
            }

            const unique = [...new Set(values)];

            if (unique.length === 0) {
                this.extractionError = 'No VT-relevant indicators (IPs, domains, hashes) found in the file.';
                this.isExtracting = false;
                return;
            }

            const extracted = unique.join('\n');
            if (this.textBody && this.textBody.toString().trim().length > 0) {
                this.textBody = this.textBody.toString().trimEnd() + '\n' + extracted;
            } else {
                this.textBody = extracted;
            }

            this.disableParse = false;
            this.extractionMessage = `Extracted ${unique.length} indicator${unique.length !== 1 ? 's' : ''} from ${current.name}`;
            this.selectedFile = undefined;
            this.selectedFiles = [];
        } catch (e) {
            console.error('Error extracting IOCs from file:', e);
            this.extractionError = 'An error occurred while extracting indicators from the file.';
        } finally {
            this.isExtracting = false;
        }
    }

    async onParse(): Promise<void> {
        await this.envService.checkAuth('/bundle');

        this.selectAll = false;
        this.parsedObjects = {};
        this.allObjects = [];
        this.isLoading = true;

        this.vtResultsByHash.clear();
        this.expandedHashes.clear();
        this.vtResultsByIp.clear();
        this.expandedIps.clear();
        this.ipResultTabs.clear();
        this.convertedDomains.clear();
        this.createdIpIndicators.clear();
        this.combinedIpPdnsIndicatorIds.clear();
        this.ipStixObjectIds.clear();
        this.ipIncluded.clear();
        this.ipExcludedObjectsStore.clear();
        this.hashStixObjectIds.clear();
        this.hashIncluded.clear();
        this.hashExcludedObjectsStore.clear();
        this.vtResultsByDomain.clear();
        this.expandedDomains.clear();
        this.domainResultTabs.clear();
        this.domainStixObjectIds.clear();
        this.convertedDomainResolutionIps.clear();
        this.convertedDomainCommunicatingFileHashes.clear();
        this.domainIncluded.clear();
        this.domainExcludedObjectsStore.clear();
        this.vtResultsByUrl.clear();
        this.expandedUrls.clear();
        this.urlResultTabs.clear();
        this.urlStixObjectIds.clear();
        this.urlIncluded.clear();
        this.urlExcludedObjectsStore.clear();
        this.convertedUrlServingIps.clear();

        let classification = this.validateAndClassifyInputs(this.textBody.toString());

        // Auto-detect free-form text: if there are invalid entries, try to extract IPs/hashes
        if (classification.invalid.length > 0) {
            const extracted = await this.extractIndicatorsFromText(this.textBody.toString());
            if (extracted) {
                this.textBody = extracted;
                classification = this.validateAndClassifyInputs(extracted);
            }
            // If extraction found nothing or still has issues, fall through to existing error handling
        }

        if (classification.cidr.length > 0) {
            const cidrList = classification.cidr.join(', ');
            this.announcementService.show(
                'Invalid Input',
                `CIDR ranges are not supported, please enter individual IP addresses: ${cidrList}`,
                'warning',
                false
            );
            this.isLoading = false;
            return;
        }

        if (classification.invalid.length > 0) {
            const invalidList = classification.invalid.join(', ');
            this.announcementService.show(
                'Invalid Input',
                `The following entries are not valid IP addresses, hashes, domains, or URLs: ${invalidList}`,
                'warning',
                false
            );
            if (
                classification.ips.length === 0 &&
                classification.hashes.length === 0 &&
                classification.domains.length === 0 &&
                classification.urls.length === 0
            ) {
                this.isLoading = false;
                return;
            }
        }

        this.searchedHashCount = classification.hashes.length;
        this.searchedIpCount = classification.ips.length;
        this.searchedIpv4Count = classification.ipv4.length;
        this.searchedIpv6Count = classification.ipv6.length;
        this.searchedDomainCount = classification.domains.length;
        this.searchedUrlCount = classification.urls.length;
        const totalIndicators = classification.ips.length + classification.hashes.length + classification.domains.length + classification.urls.length;
        if (totalIndicators > this.linesMax) {
            this.announcementService.show(
                'Too Many Indicators',
                `Found ${totalIndicators} indicators but the maximum is ${this.linesMax}. Please reduce the number of indicators.`,
                'warning',
                false
            );
            this.isLoading = false;
            return;
        }

        try {
            // --- IP Processing ---
            if (classification.ips.length > 0) {
                await this.handleIpSearch(classification.ips);
            }

            // --- Domain Processing ---
            if (classification.domains.length > 0) {
                await this.handleDomainSearch(classification.domains);
            }

            // --- URL Processing ---
            if (classification.urls.length > 0) {
                await this.handleUrlSearch(classification.urls);
            }

            // --- Hash Processing ---
            if (classification.hashes.length > 0) {
                const hashOnlyText = classification.hashes.join('\n');
                let result: any = await this.identifyStix.postIdentifyStixVirusTotal(hashOnlyText);
                if (result == undefined || !result.objects || result.objects.length === 0) {
                    this.announcementService.show('Parse Error', 'Not supported data type', 'error', false);
                } else {
                    // Add initial parsed objects
                    for (let obj of result.objects) {
                        this.allObjects.push(obj);

                        if (this.parsedObjects[obj['type']]) {
                            this.parsedObjects[obj['type']].push(obj);
                        } else {
                            this.parsedObjects[obj['type']] = [obj];
                        }
                    }

                    const promises = [];
                    const processedHashes = new Set<string>();

                    this.allObjects.forEach((obj) => {
                        switch (obj.type) {
                            case 'file':
                                if (obj.hashes && Object.keys(obj.hashes).length > 0) {
                                    // Prefer SHA-256 for searching and deduplication
                                    const sha256 = obj.hashes['SHA-256'] || obj.hashes['sha256'];
                                    const sha1 = obj.hashes['SHA-1'] || obj.hashes['sha1'];
                                    const md5 = obj.hashes['MD5'] || obj.hashes['md5'];

                                    const hashToSearch = sha256 || sha1 || md5 || Object.values(obj.hashes)[0];
                                    const dedupKey = sha256 || hashToSearch;

                                    // Only search if we haven't already searched this file
                                    if (!processedHashes.has(dedupKey)) {
                                        processedHashes.add(dedupKey);
                                        promises.push(this.searchVtHash(hashToSearch, obj));
                                    }
                                }
                                break;
                        }
                    });

                    const results = await Promise.all(promises);

                    // Process results and store VT data per hash
                    results.forEach((result) => {
                        if (result && result.success) {
                            // Store VT results for this hash for display
                            if (result.vtData) {
                                this.vtResultsByHash.set(result.vtData.hash, {
                                    hash: result.vtData.hash,
                                    hashResult: result.vtData.hashResult,
                                    ttpResult: result.vtData.ttpResult,
                                    hasData: result.vtData.hasData,
                                });
                            }

                            // Track all STIX object IDs belonging to this hash
                            const hashKey = result.vtData?.hash;
                            if (hashKey) {
                                const ids: string[] = [...(result.fileIds || [])];
                                result.newFiles.forEach((f) => ids.push(f.id));
                                result.newIndicators.forEach((ind) => ids.push(ind.id));
                                result.newMalwareAnalyses.forEach((ma) => ids.push(ma.id));
                                result.newMalware.forEach((m) => ids.push(m.id));
                                this.hashStixObjectIds.set(hashKey, ids);
                            }

                            // Add new file objects to STIX bundle
                            result.newFiles.forEach((fileObj) => {
                                this.allObjects.push(fileObj);
                                if (this.parsedObjects['file']) {
                                    this.parsedObjects['file'].push(fileObj);
                                } else {
                                    this.parsedObjects['file'] = [fileObj];
                                }
                            });

                            // Add new indicators
                            result.newIndicators.forEach((indicator) => {
                                this.allObjects.push(indicator);
                                if (this.parsedObjects['indicator']) {
                                    this.parsedObjects['indicator'].push(indicator);
                                } else {
                                    this.parsedObjects['indicator'] = [indicator];
                                }
                            });

                            // Add new malware analysis objects
                            result.newMalwareAnalyses.forEach((ma) => {
                                this.allObjects.push(ma);
                                if (this.parsedObjects['malware-analysis']) {
                                    this.parsedObjects['malware-analysis'].push(ma);
                                } else {
                                    this.parsedObjects['malware-analysis'] = [ma];
                                }
                            });

                            // Add new malware objects
                            result.newMalware.forEach((malware) => {
                                this.allObjects.push(malware);
                                if (this.parsedObjects['malware']) {
                                    this.parsedObjects['malware'].push(malware);
                                } else {
                                    this.parsedObjects['malware'] = [malware];
                                }
                            });
                        }
                    });

                    // Fetch full Sigma rule YAMLs for all hashes in parallel
                    const sigmaFetchPromises = results
                        .filter((r) => r && r.success && r.vtData?.hash)
                        .map((r) => this.fetchAllSigmaRules(r.vtData.hash));
                    await Promise.allSettled(sigmaFetchPromises);

                    // Create STIX Indicator SDOs for IDS and Sigma rules
                    for (const result of results) {
                        if (result && result.success && result.vtData?.hash) {
                            const ruleIndicators = this.createRuleIndicatorsForHash(result.vtData.hash);
                            ruleIndicators.forEach((ind) => this.addStixObject(ind));
                        }
                    }

                    // Aggregate all errors
                    const allErrors = results.filter((r) => r && r.errors && r.errors.length > 0).flatMap((r) => r.errors);

                    if (allErrors.length > 0) {
                        this.announcementService.show('VirusTotal Data Not Found', allErrors.join('\n\n'), 'error', false);
                    }
                }
            }
        } catch (error) {
            console.error('Error processing VT results:', error);
            this.announcementService.show('Processing Error', 'An error occurred while processing VirusTotal results', 'error', false);
        } finally {
            if (this.parsedObjects) this.isParsed = true;
            this.selectAll = false;
            this.updateSelectAll();
            this.isLoading = false;
            this.emitCacheData();
        }
    }

    async handleIpSearch(ips: string[]): Promise<void> {
        const promises = ips.map((ip) => this.searchVtIp(ip));

        try {
            const results = await Promise.all(promises);

            const relationPromises: Promise<void>[] = [];

            results.forEach((result) => {
                if (result && result.success) {
                    if (result.vtData) {
                        this.vtResultsByIp.set(result.vtData.ip, {
                            ip: result.vtData.ip,
                            ipResult: result.vtData.ipResult,
                            hasData: result.vtData.hasData,
                        });

                        if (result.vtData.hasData) {
                            relationPromises.push(this.loadAllIpRelations(result.vtData.ip));
                        }
                    }

                    if (result.ipObj) {
                        this.allObjects.push(result.ipObj);
                        if (this.parsedObjects[result.ipObj.type]) {
                            this.parsedObjects[result.ipObj.type].push(result.ipObj);
                        } else {
                            this.parsedObjects[result.ipObj.type] = [result.ipObj];
                        }
                        this.trackIpStixObject(result.vtData.ip, result.ipObj.id);

                        // Create a simple IP indicator upfront; replaced by combined pDNS indicator when domains load
                        const simpleIpIndicator = this.createIpIndicatorObject(result.vtData.ip);
                        this.allObjects.push(simpleIpIndicator);
                        if (!this.parsedObjects['indicator']) this.parsedObjects['indicator'] = [];
                        this.parsedObjects['indicator'].push(simpleIpIndicator);
                        this.trackIpStixObject(result.vtData.ip, simpleIpIndicator.id);
                    }
                }
            });

            await Promise.all(relationPromises);

            const allErrors = results.filter((r) => r && r.errors && r.errors.length > 0).flatMap((r) => r.errors);

            if (allErrors.length > 0) {
                this.announcementService.show('VirusTotal Data Not Found', allErrors.join('\n\n'), 'error', false);
            }
        } catch (error) {
            console.error('Error processing VT IP results:', error);
            this.announcementService.show('Processing Error', 'An error occurred while processing VirusTotal IP results', 'error', false);
        }
    }

    async handleDomainSearch(domains: string[]): Promise<void> {
        const promises = domains.map((domain) => this.searchVtDomain(domain));

        try {
            const results = await Promise.all(promises);

            const relationPromises: Promise<void>[] = [];

            results.forEach((result) => {
                if (result && result.success) {
                    if (result.vtData) {
                        this.vtResultsByDomain.set(result.vtData.domain, {
                            domain: result.vtData.domain,
                            domainResult: result.vtData.domainResult,
                            hasData: result.vtData.hasData,
                        });

                        if (result.vtData.hasData) {
                            relationPromises.push(this.loadAllDomainRelations(result.vtData.domain));
                        }
                    }

                    if (result.domainObj) {
                        this.addStixObject(result.domainObj);
                        this.trackDomainStixObject(result.vtData.domain, result.domainObj.id);

                        const domainIndicator = this.createDomainSearchIndicatorObject(result.vtData.domain);
                        this.addStixObject(domainIndicator);
                        this.trackDomainStixObject(result.vtData.domain, domainIndicator.id);
                    }

                    if (result.x509CertObj) {
                        this.addStixObject(result.x509CertObj);
                        this.trackDomainStixObject(result.vtData.domain, result.x509CertObj.id);
                    }
                }
            });

            await Promise.all(relationPromises);

            const allErrors = results.filter((r) => r && r.errors && r.errors.length > 0).flatMap((r) => r.errors);

            if (allErrors.length > 0) {
                this.announcementService.show('VirusTotal Data Not Found', allErrors.join('\n\n'), 'error', false);
            }
        } catch (error) {
            console.error('Error processing VT domain results:', error);
            this.announcementService.show('Processing Error', 'An error occurred while processing VirusTotal domain results', 'error', false);
        }
    }

    async handleUrlSearch(urls: string[]): Promise<void> {
        const promises = urls.map((url) => this.searchVtUrl(url));

        try {
            const results = await Promise.all(promises);

            const relationPromises: Promise<void>[] = [];

            results.forEach((result) => {
                if (result && result.success) {
                    if (result.vtData) {
                        this.vtResultsByUrl.set(result.vtData.url, {
                            url: result.vtData.url,
                            urlResult: result.vtData.urlResult,
                            hasData: result.vtData.hasData,
                        });

                        if (result.vtData.hasData) {
                            relationPromises.push(this.loadAllUrlRelations(result.vtData.url));
                        }
                    }

                    if (result.urlObj) {
                        this.addStixObject(result.urlObj);
                        this.trackUrlStixObject(result.vtData.url, result.urlObj.id);

                        const urlIndicator = this.createUrlSearchIndicatorObject(result.vtData.url);
                        this.addStixObject(urlIndicator);
                        this.trackUrlStixObject(result.vtData.url, urlIndicator.id);

                        // Distinct final URL (redirect target) as its own SCO, linked to the submitted URL.
                        if (result.finalUrlObj) {
                            this.addStixObject(result.finalUrlObj);
                            this.trackUrlStixObject(result.vtData.url, result.finalUrlObj.id);

                            const finalRel = this.createRelationshipObject(result.urlObj.id, result.finalUrlObj.id, 'related-to');
                            this.addStixObject(finalRel);
                            this.trackUrlStixObject(result.vtData.url, finalRel.id);
                        }

                        // One malware-analysis per malicious/suspicious engine.
                        const malwareAnalyses = this.createUrlMalwareAnalysisObjects(result.vtData.url, result.urlObj.id);
                        malwareAnalyses.forEach((ma) => {
                            this.addStixObject(ma);
                            this.trackUrlStixObject(result.vtData.url, ma.id);
                        });
                    }
                }
            });

            await Promise.all(relationPromises);

            const allErrors = results.filter((r) => r && r.errors && r.errors.length > 0).flatMap((r) => r.errors);

            if (allErrors.length > 0) {
                this.announcementService.show('VirusTotal Data Not Found', allErrors.join('\n\n'), 'error', false);
            }
        } catch (error) {
            console.error('Error processing VT URL results:', error);
            this.announcementService.show('Processing Error', 'An error occurred while processing VirusTotal URL results', 'error', false);
        }
    }

    async searchVtHash(data: any, obj: any): Promise<any> {
        try {
            const vtHashResult: any = await this.vtSearchService.postVtHashSearch(data);
            const vtTtpResult: any = await this.vtSearchService.postVtHashTtpSearch(data);

            let names: string[] = [];
            const fileIds: string[] = [];
            let indicatorPattern = '';
            let isMalicious = false;

            const newFiles: any[] = [];
            const newIndicators: any[] = [];
            const newMalwareAnalyses: any[] = [];
            const newMalware: any[] = [];
            const errors: string[] = [];

            // Clean filenames from VT results
            if (vtHashResult && vtHashResult.data && vtHashResult.data.attributes && vtHashResult.data.attributes.names) {
                vtHashResult.data.attributes.names = this.cleanFilenames(vtHashResult.data.attributes.names);
            }

            // Store VT data for display (even if processing fails)
            const vtData = {
                hash: data,
                hashResult: vtHashResult,
                ttpResult: vtTtpResult,
                hasData: !!(vtHashResult && vtHashResult.data && vtHashResult.data.attributes),
            };
            // Get VT Hash values
            if (vtHashResult && vtHashResult.data && vtHashResult.data.attributes) {
                const vtHashTypes = ['md5', 'sha1', 'sha256', 'ssdeep'];
                const stixHashTypes = ['MD5', 'SHA-1', 'SHA-256', 'SSDEEP'];
                names = vtHashResult.data.attributes.names || [];

                if (names.length >= 1) {
                    obj.name = names[0];
                }

                if (vtHashResult.data.attributes.size) {
                    obj.size = vtHashResult.data.attributes.size;
                }

                vtHashTypes.forEach((vtHashType, i) => {
                    if (vtHashResult.data.attributes[vtHashType]) {
                        const hashExists = Object.values(obj.hashes).includes(vtHashResult.data.attributes[vtHashType]);
                        if (!hashExists) {
                            obj.hashes[stixHashTypes[i]] = vtHashResult.data.attributes[vtHashType];
                        }

                        if (i > 0) {
                            indicatorPattern += ' OR ';
                        }
                        indicatorPattern += `file:hashes.'${stixHashTypes[i]}' = '${obj.hashes[stixHashTypes[i]]}'`;
                    }
                });

                const date = new Date();
                obj['ctime'] = date.toISOString();
                obj['mtime'] = date.toISOString();
                obj['atime'] = date.toISOString();

                obj.id = obj.type + '--' + this.stixService.getUUIDFrIdContributingPropertiesVT(obj);

                fileIds.push(obj.id);

                if (names.length > 1) {
                    names.slice(1).forEach((name, i) => {
                        const newFileObj = this.createFileObject(obj, i, name, fileIds);
                        newFiles.push(newFileObj);
                    });

                    const indicators = this.createIndicators(names, indicatorPattern, obj.size);
                    newIndicators.push(...indicators);
                }

                if (vtHashResult.data.attributes.last_analysis_results) {
                    const chunks = vtHashResult.data.attributes.last_analysis_results;
                    Object.values(chunks).forEach((chunk: any, i) => {
                        if (chunk && chunk.category && !chunk.category.includes('undetected') && !chunk.category.includes('type-unsupported')) {
                            if (chunk.category.includes('malicious')) {
                                isMalicious = true;
                            }

                            const malwareAnalysis = this.createMalwareAnalysisObject(i, chunk, fileIds);
                            newMalwareAnalyses.push(malwareAnalysis);
                        }
                    });
                }
            } else if (vtHashResult && vtHashResult.message) {
                console.info(vtHashResult.message);
                errors.push(
                    `No hash content were returned from VirusTotal for ${data}. We have generated STIX object to be included in your report.`
                );
            }

            const kill_chain_phases: any[] = [];
            const external_references: any[] = [];

            if (vtTtpResult && vtTtpResult.data && isMalicious) {
                Object.keys(vtTtpResult.data).forEach((key) => {
                    if (vtTtpResult.data[key] && vtTtpResult.data[key].tactics) {
                        vtTtpResult.data[key].tactics.forEach((ta: any) => {
                            if (ta.name) {
                                const phase_object = {
                                    kill_chain_name: 'mitre-attack',
                                    phase_name: ta.name.toLowerCase().replaceAll(' ', '-'),
                                };

                                const exists = kill_chain_phases.some((phase) => JSON.stringify(phase) === JSON.stringify(phase_object));
                                if (!exists) {
                                    kill_chain_phases.push(phase_object);
                                }

                                if (ta.techniques && ta.techniques.length > 0) {
                                    ta.techniques.forEach((tq: any) => {
                                        const urlResource = tq.id.split('.').join('/');

                                        const newObj = {
                                            external_id: tq.name,
                                            source_name: 'mitre_attack',
                                            url: 'https://attack.mitre.org/techniques/' + urlResource,
                                        };

                                        const exists = external_references.some((ref) => JSON.stringify(ref) === JSON.stringify(newObj));
                                        if (!exists) {
                                            external_references.push(newObj);
                                        }
                                    });
                                }
                            }
                        });
                    }
                });

                if (kill_chain_phases.length > 0 || external_references.length > 0) {
                    const malwareObj = this.createMalwareObject(names, kill_chain_phases, external_references, fileIds);
                    newMalware.push(malwareObj);
                }
            } else if (vtTtpResult && vtTtpResult.message) {
                console.info('TTP data not available:', vtTtpResult.message);
            }

            return {
                success: true,
                errors,
                fileIds,
                newFiles,
                newIndicators,
                newMalwareAnalyses,
                newMalware,
                vtData, // Include VT data for display
            };
        } catch (e) {
            console.error(`Error in searchVtHash for ${data}:`, e);
            return {
                success: false,
                errors: [`Error encountered for ${data}: ${e}`],
                fileIds: [],
                newFiles: [],
                newIndicators: [],
                newMalwareAnalyses: [],
                newMalware: [],
                vtData: {
                    hash: data,
                    hashResult: null,
                    ttpResult: null,
                    hasData: false,
                },
            };
        }
    }

    private createFileObject(baseObject: any, index: number, name: string, fileIds: string[]): any {
        const date = new Date();
        const millSec = date.getMilliseconds();
        date.setMilliseconds(millSec + index * 10);

        const fileObject: any = {
            type: 'file',
            spec_version: '2.1',
            name: name,
            hashes: { ...baseObject.hashes },
            ctime: date.toISOString(),
            mtime: date.toISOString(),
            atime: date.toISOString(),
        };

        if (baseObject.size) {
            fileObject.size = baseObject.size;
        }

        fileObject.id = fileObject.type + '--' + this.stixService.getUUIDFrIdContributingPropertiesVT(fileObject);
        fileIds.push(fileObject.id);

        return fileObject;
    }

    private createIndicators(names: string[], indicatorPattern: string, size: number): any[] {
        const indicators: any[] = [];

        let indicatorPatternCombined = '(' + indicatorPattern + ')';
        let indicatorPatternName = '';

        for (const name of names) {
            if (indicatorPatternName) {
                indicatorPatternName += ' OR ';
            }

            let patternName = name;
            if (name.includes("'")) {
                patternName = name.replace(/'/g, "\\'");
            }

            indicatorPatternName += `file:name = '${patternName}'`;
        }

        if (indicatorPatternName) {
            indicatorPatternCombined += ` AND (${indicatorPatternName})`;
        }
        if (size) {
            indicatorPatternCombined += ` AND (file:size = ${size})`;
        }

        const date = new Date();

        const indicator: any = {
            type: 'indicator',
            spec_version: '2.1',
            created: date.toISOString(),
            modified: date.toISOString(),
            valid_from: date.toISOString(),
            indicator_types: ['malicious-activity'],
            pattern_type: 'stix',
            pattern_version: '2.1',
            pattern: '[ ' + indicatorPatternCombined + ' ]',
        };

        if (names[0]) {
            indicator.name = names[0];
        }

        indicator.id = indicator.type + '--' + this.stixService.getUUIDFrIdContributingPropertiesVT(indicator);

        indicators.push(indicator);
        return indicators;
    }

    private createMalwareAnalysisObject(index: number, chunk: any, fileIds: string[]): any {
        const date = new Date();
        const millSec = date.getMilliseconds();
        date.setMilliseconds(millSec + index * 10);

        const malwareAnalysis: any = {
            type: 'malware-analysis',
            spec_version: '2.1',
            created: date.toISOString(),
            modified: date.toISOString(),
        };

        if (chunk.engine_name) {
            malwareAnalysis.product = chunk.engine_name.toLowerCase();
        }

        if (chunk.result) {
            malwareAnalysis.result_name = chunk.result;
        }

        if (fileIds && fileIds.length > 0) {
            malwareAnalysis.analysis_sco_refs = [...fileIds];
        }

        malwareAnalysis.id = malwareAnalysis.type + '--' + this.stixService.getUUIDFrIdContributingProperties(malwareAnalysis);

        return malwareAnalysis;
    }

    /** Builds one malware-analysis SDO per URL engine that reported malicious or suspicious,
     *  each referencing the URL SCO. Harmless/undetected/type-unsupported engines are skipped. */
    private createUrlMalwareAnalysisObjects(url: string, urlObjId: string): any[] {
        const detections = this.getUrlDetectionResults(url).filter(
            (d) => d.category === 'malicious' || d.category === 'suspicious'
        );

        return detections.map((chunk, index) => {
            const date = new Date();
            date.setMilliseconds(date.getMilliseconds() + index * 10);

            const malwareAnalysis: any = {
                type: 'malware-analysis',
                spec_version: '2.1',
                created: date.toISOString(),
                modified: date.toISOString(),
            };

            if (chunk.engine_name) malwareAnalysis.product = chunk.engine_name.toLowerCase();
            if (chunk.category) malwareAnalysis.result = chunk.category;
            if (chunk.result) malwareAnalysis.result_name = chunk.result;
            malwareAnalysis.analysis_sco_refs = [urlObjId];

            malwareAnalysis.id = malwareAnalysis.type + '--' + this.stixService.getUUIDFrIdContributingProperties(malwareAnalysis);
            return malwareAnalysis;
        });
    }

    private createMalwareObject(names: string[], kill_chain_phases: any[], external_references: any[], fileIds: string[]): any {
        const date = new Date();
        const millSec = date.getMilliseconds();
        date.setMilliseconds(millSec + 1 * 10);

        const malwareObject: any = {
            type: 'malware',
            spec_version: '2.1',
            created: date.toISOString(),
            modified: date.toISOString(),
            is_family: false,
        };

        const name = names.length >= 1 ? names[0] : '';

        if (name) {
            malwareObject.name = name;
        }

        if (fileIds.length > 0) {
            malwareObject.sample_refs = [...fileIds];
        }

        if (kill_chain_phases && kill_chain_phases.length > 0) {
            malwareObject.kill_chain_phases = kill_chain_phases;
        }

        if (external_references && external_references.length > 0) {
            malwareObject.external_references = external_references;
        }

        malwareObject.id = malwareObject.type + '--' + this.stixService.getUUIDFrIdContributingProperties(malwareObject);

        return malwareObject;
    }

    onConfirm() {
        let temp = [];

        for (let id of this.selectedObjects) {
            for (let obj of this.allObjects) {
                if (id === obj.id) {
                    temp.push(obj);
                    break;
                }
            }
        }

        this.tempBundle = new Bundle(temp);

        this.isConfirm = true;

        this.onAddToBundle();
    }

    getStixPreview() {
        return this.tempBundle;
    }

    onAddToBundle(): void {
        if (this.mode === 'embedded') {
            this.stixObjectsSelected.emit(this.tempBundle.objects || []);
        } else if (this.dialogRef) {
            this.dialogRef.close({ selectedObjects: this.tempBundle });
        }
    }

    updateSelectAll() {
        this.selectedObjects = [];

        if (this.selectAll === false) {
            for (let obj of this.allObjects) {
                this.selectedObjects.push(obj.id);
            }
        }

        if (this.selectAll === true) this.selectAll = false;
        else this.selectAll = true;

        for (const ip of this.ipStixObjectIds.keys()) {
            this.rebuildIndicatorForIp(ip);
        }
    }

    updateSelectedObjects(id) {
        let found = false;

        for (let i in this.selectedObjects) {
            if (this.selectedObjects[i] === id) {
                found = true;
                this.selectedObjects.splice(i, 1);
            }
        }

        if (!found) this.selectedObjects.push(id);
        if (this.allObjects.length === this.selectedObjects.length) {
            this.selectAll = true;
        } else {
            this.selectAll = false;
        }

        // Sync the paired observed-data object when a domain is toggled
        if (id.startsWith('domain-name--')) {
            const pairedObserved = this.allObjects.find(
                (o) => o.type === 'observed-data' && Array.isArray(o.object_refs) && o.object_refs.includes(id)
            );
            if (pairedObserved) {
                const domainIsNowSelected = !found;
                const observedIdx = this.selectedObjects.indexOf(pairedObserved.id);
                if (domainIsNowSelected && observedIdx === -1) {
                    this.selectedObjects.push(pairedObserved.id);
                } else if (!domainIsNowSelected && observedIdx !== -1) {
                    this.selectedObjects.splice(observedIdx, 1);
                }
            }
        }

        // Rebuild the pDNS indicator to reflect the newly selected/deselected domain
        this.onDomainObjectToggled(id);
    }

    /** Called after a STIX Objects tab checkbox toggles. If the toggled object is a domain-name
     *  belonging to an IP cluster, rebuilds the indicator to only include selected domains.
     *  Falls back to a simple IP indicator when no domains remain selected. */
    private onDomainObjectToggled(toggledId: string): void {
        if (!toggledId.startsWith('domain-name--')) return;

        // Find which IP cluster this domain belongs to
        let ownerIp: string | null = null;
        for (const [ip, ids] of this.ipStixObjectIds) {
            if (ids.includes(toggledId)) {
                ownerIp = ip;
                break;
            }
        }
        if (!ownerIp) return;

        this.rebuildIndicatorForIp(ownerIp);
    }

    /** Rebuilds the indicator for an IP cluster based on currently selected domain objects.
     *  Creates a combined pDNS indicator when domains are selected, or reverts to a simple
     *  IP indicator when no domains are selected. */
    private rebuildIndicatorForIp(ownerIp: string): void {
        const allDomainIdsForIp = (this.ipStixObjectIds.get(ownerIp) || []).filter((id) => id.startsWith('domain-name--'));

        const selectedHostnames = allDomainIdsForIp
            .filter((id) => this.selectedObjects.includes(id))
            .map((id) => this.allObjects.find((o) => o.id === id)?.value)
            .filter((v): v is string => !!v);

        // Remove the existing indicator (simple or combined) for this IP
        const existingIndicatorId =
            this.combinedIpPdnsIndicatorIds.get(ownerIp) || this.ipStixObjectIds.get(ownerIp)?.find((id) => id.startsWith('indicator--'));

        let oldIndicatorWasSelected = false;
        if (existingIndicatorId) {
            oldIndicatorWasSelected = Array.isArray(this.selectedObjects) && this.selectedObjects.includes(existingIndicatorId);

            // Remove relationships pointing from the old indicator before removing the indicator itself
            this.removeRelationshipsForIndicator(ownerIp, existingIndicatorId);

            this.allObjects = this.allObjects.filter((o) => o.id !== existingIndicatorId);
            if (this.parsedObjects['indicator']) {
                this.parsedObjects['indicator'] = this.parsedObjects['indicator'].filter((o: any) => o.id !== existingIndicatorId);
                if (this.parsedObjects['indicator'].length === 0) delete this.parsedObjects['indicator'];
            }
            if (oldIndicatorWasSelected && Array.isArray(this.selectedObjects)) {
                const idx = this.selectedObjects.indexOf(existingIndicatorId);
                if (idx !== -1) this.selectedObjects.splice(idx, 1);
            }
            this.ipStixObjectIds.set(
                ownerIp,
                (this.ipStixObjectIds.get(ownerIp) || []).filter((id) => id !== existingIndicatorId)
            );
            this.combinedIpPdnsIndicatorIds.delete(ownerIp);
        }

        // Build the replacement indicator
        let newIndicator: any;
        if (selectedHostnames.length > 0) {
            newIndicator = this.createCombinedIpDomainIndicatorObject(ownerIp, selectedHostnames);
            this.combinedIpPdnsIndicatorIds.set(ownerIp, newIndicator.id);
        } else {
            // No domains selected — revert to simple IP indicator
            newIndicator = this.createIpIndicatorObject(ownerIp);
        }

        this.allObjects.push(newIndicator);
        if (!this.parsedObjects['indicator']) this.parsedObjects['indicator'] = [];
        this.parsedObjects['indicator'].push(newIndicator);
        this.trackIpStixObject(ownerIp, newIndicator.id);

        // Carry the old indicator's selection state onto the new one
        if (oldIndicatorWasSelected && Array.isArray(this.selectedObjects)) {
            if (!this.selectedObjects.includes(newIndicator.id)) {
                this.selectedObjects.push(newIndicator.id);
            }
        }

        // Create based-on relationships for each selected observed-data (combined indicator only)
        if (selectedHostnames.length > 0) {
            const selectedObsIds = selectedHostnames
                .map((hostname) => {
                    const domainObj = this.allObjects.find((o) => o.type === 'domain-name' && o.value === hostname);
                    if (!domainObj) return null;
                    return (
                        this.allObjects.find(
                            (o) => o.type === 'observed-data' && Array.isArray(o.object_refs) && o.object_refs.includes(domainObj.id)
                        )?.id || null
                    );
                })
                .filter((id): id is string => !!id);

            for (const obsId of selectedObsIds) {
                const rel = this.createRelationshipObject(newIndicator.id, obsId);
                this.allObjects.push(rel);
                if (!this.parsedObjects['relationship']) this.parsedObjects['relationship'] = [];
                this.parsedObjects['relationship'].push(rel);
                this.trackIpStixObject(ownerIp, rel.id);
                if (oldIndicatorWasSelected && !this.selectedObjects.includes(rel.id)) {
                    this.selectedObjects.push(rel.id);
                }
            }
        }

        // Re-evaluate selectAll after the indicator swap
        this.selectAll = this.allObjects.length === this.selectedObjects.length;
    }

    getSelected(id) {
        return this.selectedObjects?.includes(id);
    }

    changeShow(id) {
        if (this.showId === id) {
            this.showId = '';
            return;
        }

        this.showId = id;
    }

    toggleCategory(categoryKey: string) {
        if (this.collapsedCategories.has(categoryKey)) {
            this.collapsedCategories.delete(categoryKey);
        } else {
            this.collapsedCategories.add(categoryKey);
        }
    }

    isCategoryCollapsed(categoryKey: string): boolean {
        return this.collapsedCategories.has(categoryKey);
    }

    getComponentDisplay(component: any): string {
        if (component.type) {
            let componentDisplay = '';
            switch (component.type) {
                case 'malware-analysis': {
                    componentDisplay = component.id;
                    break;
                }
                case 'artifact': {
                    if (component.payload_bin) componentDisplay = component.payload_bin;
                    else componentDisplay = component.url;
                    break;
                }
                case 'autonomous-system': {
                    componentDisplay = `${component.number} ${component.name ? '(' + component.name + ')' : ''}`;
                    break;
                }
                case 'directory': {
                    componentDisplay = component.path;
                    break;
                }
                case 'email-message': {
                    componentDisplay = `${component.subject ? component.subject : `No Subject Included: (${component.id})`}`;
                    break;
                }
                case 'file': {
                    if (component.name) componentDisplay = component.name;
                    else if (component.hashes)
                        componentDisplay = `${Object.keys(component.hashes)[0]}: ${component.hashes[Object.keys(component.hashes)[0]]}`;
                    else componentDisplay = `<NO NAME> (${component.id})`;
                    break;
                }
                case 'domain-name':
                case 'email-addr':
                case 'url':
                case 'ipv4-addr':
                case 'ipv6-addr':
                case 'mac-addr': {
                    componentDisplay = component.value;
                    break;
                }
                case 'mutex':
                case 'software': {
                    componentDisplay = component.name;
                    break;
                }
                case 'process': {
                    if (component.pid) componentDisplay = component.pid;
                    else if (component.cwd) componentDisplay = component.cwd;
                    else componentDisplay = `<NO NAME> (${component.id})`;
                    break;
                }
                case 'relationship': {
                    if (component.source_ref && component.target_ref) {
                        let sourceRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === component.source_ref),
                            targetRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === component.target_ref);
                        if (sourceRefObject.length > 0 && targetRefObject.length > 0)
                            componentDisplay = `${this.getComponentDisplay(sourceRefObject[0])} -> ${this.getComponentDisplay(targetRefObject[0])}`;
                        else componentDisplay = `<NO NAME> (${component.id})`;
                    } else componentDisplay = `<NO NAME> (${component.id})`;
                    break;
                }
                case 'user-account': {
                    if (component.user_id) componentDisplay = component.user_id;
                    else if (component.account_login) componentDisplay = component.account_login;
                    else if (component.display_name) componentDisplay = component.display_name;
                    else componentDisplay = `<NO NAME> (${component.id})`;
                    break;
                }
                case 'windows-registry-key': {
                    if (component.key) componentDisplay = component.key;
                    else componentDisplay = `<NO NAME> (${component.id})`;
                    break;
                }
                case 'x509-certificate': {
                    if (component.subject) componentDisplay = component.subject;
                    else if (component.serial_number) componentDisplay = component.serial_number;
                    else if (component.hashes)
                        componentDisplay = `${Object.keys(component.hashes)[0]}: ${component.hashes[Object.keys(component.hashes)[0]]}`;
                    else if (component.issuer) componentDisplay = component.issuer;
                    else componentDisplay = `<NO NAME> (${component.id})`;
                    break;
                }
                default:
                    return component.name ? component.name : `<NO NAME> (${component.id})`;
            }

            return componentDisplay;
        } else return component.name ? component.name : '<NO NAME>';
    }

    headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
    });

    toggleHashExpansion(hash: string): void {
        if (this.expandedHashes.has(hash)) {
            this.expandedHashes.delete(hash);
        } else {
            this.expandedHashes.add(hash);
        }
    }

    isHashExpanded(hash: string): boolean {
        return this.expandedHashes.has(hash);
    }

    getHashesWithResults(): string[] {
        return Array.from(this.vtResultsByHash.keys());
    }

    getVtResultForHash(hash: string): any {
        return this.vtResultsByHash.get(hash);
    }

    // --- Crowdsourced IDS Rules helpers ---

    getIdsStatsForHash(hash: string): { high: number; medium: number; low: number; info: number } {
        const rules = this.getIdsResultsForHash(hash);
        const stats = { high: 0, medium: 0, low: 0, info: 0 };
        for (const rule of rules) {
            const severity = rule.alert_severity?.toLowerCase();
            if (severity && severity in stats) {
                stats[severity]++;
            }
        }
        return stats;
    }

    getIdsResultsForHash(hash: string): any[] {
        const result = this.getVtResultForHash(hash);
        const raw = result?.hashResult?.data?.attributes?.crowdsourced_ids_results ?? [];

        // Deduplicate by rule_id — keep latest rev, merge all alert_context
        const ruleMap = new Map<string, any>();
        for (const rule of raw) {
            const id = rule.rule_id;
            if (!id) continue;
            if (ruleMap.has(id)) {
                const existing = ruleMap.get(id);
                const newContexts = rule.alert_context ?? [];
                existing.alert_context = [...(existing.alert_context ?? []), ...newContexts];
                const existingRev = this.extractRevFromRuleRaw(existing.rule_raw);
                const newRev = this.extractRevFromRuleRaw(rule.rule_raw);
                if (newRev > existingRev) {
                    existing.rule_raw = rule.rule_raw;
                }
            } else {
                ruleMap.set(id, { ...rule, alert_context: [...(rule.alert_context ?? [])] });
            }
        }
        return Array.from(ruleMap.values());
    }

    private extractRevFromRuleRaw(ruleRaw: string): number {
        if (!ruleRaw) return 0;
        const match = ruleRaw.match(/rev[:\s]*(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }

    getFilteredIdsResults(hash: string): any[] {
        const allResults = this.getIdsResultsForHash(hash);
        const activeFilter = this.getIdsSeverityFilter(hash);
        if (activeFilter === 'all') {
            return allResults;
        }
        return allResults.filter((rule: any) => rule.alert_severity === activeFilter);
    }

    getIdsSeverityFilter(hash: string): string {
        return this.selectedIdsSeverityFilter.get(hash) ?? 'all';
    }

    setIdsSeverityFilter(hash: string, severity: string): void {
        this.selectedIdsSeverityFilter.set(hash, severity);
        // Collapse all expanded rules when filter changes
        this.expandedIdsRules.clear();
    }

    getIdsRuleId(hash: string, index: number): string {
        return hash + '-ids-' + index;
    }

    toggleIdsRule(ruleId: string): void {
        if (this.expandedIdsRules.has(ruleId)) {
            this.expandedIdsRules.delete(ruleId);
        } else {
            this.expandedIdsRules.add(ruleId);
        }
    }

    isIdsRuleExpanded(ruleId: string): boolean {
        return this.expandedIdsRules.has(ruleId);
    }

    getIdsSeverityBadgeClass(severity: string): string {
        switch (severity?.toLowerCase()) {
            case 'high':
                return 'badge bg-danger';
            case 'medium':
                return 'badge bg-warning text-dark';
            case 'low':
                return 'badge bg-info text-dark';
            case 'info':
                return 'badge bg-secondary';
            default:
                return 'badge bg-secondary';
        }
    }

    getIdsTotalCount(hash: string): number {
        const stats = this.getIdsStatsForHash(hash);
        return stats.high + stats.medium + stats.low + stats.info;
    }

    async copyIdsRule(ruleRaw: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(ruleRaw);
            this.announcementService.show('Copied', 'IDS rule copied to clipboard', 'success', false);
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = ruleRaw;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.announcementService.show('Copied', 'IDS rule copied to clipboard', 'success', false);
        }
    }

    // --- Sigma Rules helpers ---

    getSigmaRulesForHash(hash: string): any[] {
        const result = this.getVtResultForHash(hash);
        const raw = result?.hashResult?.data?.attributes?.sigma_analysis_results ?? [];

        // Deduplicate by rule_id — merge all match_context
        const ruleMap = new Map<string, any>();
        for (const rule of raw) {
            const id = rule.rule_id;
            if (!id) continue;
            if (ruleMap.has(id)) {
                const existing = ruleMap.get(id);
                const newContexts = rule.match_context ?? [];
                existing.match_context = [...(existing.match_context ?? []), ...newContexts];
            } else {
                ruleMap.set(id, { ...rule, match_context: [...(rule.match_context ?? [])] });
            }
        }
        return Array.from(ruleMap.values());
    }

    getSigmaRuleStats(hash: string): { critical: number; high: number; medium: number; low: number; informational: number } {
        const rules = this.getSigmaRulesForHash(hash);
        const stats = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
        for (const rule of rules) {
            const level = rule.rule_level?.toLowerCase();
            if (level && level in stats) {
                stats[level]++;
            }
        }
        return stats;
    }

    getSigmaTotalCount(hash: string): number {
        return this.getSigmaRulesForHash(hash).length;
    }

    getFilteredSigmaRules(hash: string): any[] {
        const allRules = this.getSigmaRulesForHash(hash);
        const activeFilter = this.getSigmaSeverityFilter(hash);
        if (activeFilter === 'all') {
            return allRules;
        }
        return allRules.filter((rule: any) => rule.rule_level?.toLowerCase() === activeFilter);
    }

    getSigmaSeverityFilter(hash: string): string {
        return this.selectedSigmaSeverityFilter.get(hash) ?? 'all';
    }

    setSigmaSeverityFilter(hash: string, severity: string): void {
        this.selectedSigmaSeverityFilter.set(hash, severity);
        this.expandedSigmaRules.clear();
    }

    getSigmaRuleId(hash: string, index: number): string {
        return hash + '-sigma-' + index;
    }

    toggleSigmaRule(ruleId: string): void {
        if (this.expandedSigmaRules.has(ruleId)) {
            this.expandedSigmaRules.delete(ruleId);
        } else {
            this.expandedSigmaRules.add(ruleId);
        }
    }

    isSigmaRuleExpanded(ruleId: string): boolean {
        return this.expandedSigmaRules.has(ruleId);
    }

    getSigmaSeverityBadgeClass(level: string): string {
        switch (level?.toLowerCase()) {
            case 'critical':
                return 'badge bg-danger';
            case 'high':
                return 'badge bg-danger';
            case 'medium':
                return 'badge bg-warning text-dark';
            case 'low':
                return 'badge bg-info text-dark';
            case 'informational':
                return 'badge bg-secondary';
            default:
                return 'badge bg-secondary';
        }
    }

    formatSigmaRuleForCopy(rule: any): string {
        const lines: string[] = [];
        if (rule.rule_title) lines.push(`Title: ${rule.rule_title}`);
        if (rule.rule_level) lines.push(`Level: ${rule.rule_level}`);
        if (rule.rule_author) lines.push(`Author: ${rule.rule_author}`);
        if (rule.rule_description) lines.push(`Description: ${rule.rule_description}`);
        if (rule.rule_source) lines.push(`Source: ${rule.rule_source}`);
        if (rule.source_category) lines.push(`Category: ${rule.source_category}`);
        if (rule.rule_id) lines.push(`Rule ID: ${rule.rule_id}`);
        if (rule.match_context?.length) {
            lines.push('');
            lines.push('Match Context:');
            for (const ctx of rule.match_context) {
                if (ctx.values) {
                    for (const [key, value] of Object.entries(ctx.values)) {
                        lines.push(`  ${key}: ${value}`);
                    }
                }
            }
        }
        return lines.join('\n');
    }

    async copySigmaRule(rule: any): Promise<void> {
        const fullRule = this.sigmaFullRules.get(rule.rule_id);
        const text = fullRule ?? this.formatSigmaRuleForCopy(rule);
        try {
            await navigator.clipboard.writeText(text);
            this.announcementService.show('Copied', 'Sigma rule copied to clipboard', 'success', false);
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.announcementService.show('Copied', 'Sigma rule copied to clipboard', 'success', false);
        }
    }

    async fetchAllSigmaRules(hash: string): Promise<void> {
        const rules = this.getSigmaRulesForHash(hash);
        const uniqueIds = [...new Set(rules.map((r) => r.rule_id).filter(Boolean))];
        const toFetch = uniqueIds.filter((id) => !this.sigmaFullRules.has(id));
        if (toFetch.length === 0) return;

        const results = await Promise.allSettled(toFetch.map((id) => this.vtSearchService.postGetSigmaRule(id).then((resp: any) => ({ id, resp }))));
        for (const result of results) {
            if (result.status === 'fulfilled') {
                const yamlRule = result.value.resp?.data?.attributes?.rule;
                if (yamlRule) {
                    this.sigmaFullRules.set(result.value.id, yamlRule);
                }
            }
        }
    }

    getSigmaFullRule(ruleId: string): string | null {
        return this.sigmaFullRules.get(ruleId) ?? null;
    }

    objectEntries(obj: any): [string, any][] {
        return obj ? Object.entries(obj) : [];
    }

    objectHasKeys(obj: any): boolean {
        return obj && Object.keys(obj).length > 0;
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    formatLastAnalysisDate(timestamp: number): string {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const absoluteDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

        let relativeTime: string;
        if (diffDays === 0) {
            relativeTime = 'today';
        } else if (diffDays === 1) {
            relativeTime = '1 day ago';
        } else if (diffDays < 30) {
            relativeTime = `${diffDays} days ago`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            relativeTime = months === 1 ? '1 month ago' : `${months} months ago`;
        } else {
            const years = Math.floor(diffDays / 365);
            relativeTime = years === 1 ? '1 year ago' : `${years} years ago`;
        }

        return `${absoluteDate} (${relativeTime})`;
    }

    getDetectionCategory(result: string | null | undefined, category?: string): string {
        if (category) {
            const lowerCategory = category.toLowerCase();
            if (lowerCategory === 'harmless' || lowerCategory === 'undetected' || lowerCategory === 'unrated') {
                return 'clean';
            }
            if (lowerCategory === 'suspicious') {
                return 'suspicious';
            }
            if (lowerCategory === 'malicious') {
                return 'malicious';
            }
            if (lowerCategory === 'type-unsupported' || lowerCategory === 'timeout' || lowerCategory === 'failure') {
                return 'error';
            }
        }

        if (!result) {
            return 'clean';
        }

        const lowerResult = result.toLowerCase();
        if (lowerResult === 'clean' || lowerResult === 'undetected' || lowerResult === 'unrated') {
            return 'clean';
        }

        if (lowerResult === 'suspicious') {
            return 'suspicious';
        }

        if (
            lowerResult.includes('unable') ||
            lowerResult.includes('unsupported') ||
            lowerResult.includes('timeout') ||
            lowerResult.includes('failure')
        ) {
            return 'error';
        }

        return 'malicious';
    }

    getDetectionDisplayText(result: string | null | undefined, category?: string): string {
        if (result) {
            return result;
        }
        if (category) {
            const lowerCategory = category.toLowerCase();
            if (lowerCategory === 'type-unsupported') {
                return 'Unsupported';
            }
            if (lowerCategory === 'timeout') {
                return 'Timeout';
            }
            if (lowerCategory === 'failure') {
                return 'Failed';
            }
            if (lowerCategory === 'unrated') {
                return 'Unrated';
            }
            if (lowerCategory === 'harmless' || lowerCategory === 'undetected') {
                return 'Clean';
            }
        }
        return 'Clean';
    }

    getSortedDetections(hash: string): any[] {
        const vtResult = this.vtResultsByHash.get(hash);
        if (!vtResult?.hashResult?.data?.attributes?.last_analysis_results) {
            return [];
        }

        const results = Object.entries(vtResult.hashResult.data.attributes.last_analysis_results).map(([key, value]: [string, any]) => ({
            key,
            value,
        }));

        const categoryPriority = { malicious: 0, suspicious: 1, error: 2, clean: 3 };

        return results.sort((a, b) => {
            const catA = this.getDetectionCategory(a.value?.result, a.value?.category);
            const catB = this.getDetectionCategory(b.value?.result, b.value?.category);
            const priorityA = categoryPriority[catA] ?? 3;
            const priorityB = categoryPriority[catB] ?? 3;

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return (a.value?.engine_name || a.key).localeCompare(b.value?.engine_name || b.key);
        });
    }

    getAggregatedTtpsForHash(hash: string): any[] {
        const vtResult = this.vtResultsByHash.get(hash);
        if (!vtResult || !vtResult.ttpResult?.data) {
            return [];
        }

        // Map to track unique tactics by ID
        const tacticsMap = new Map<string, any>();

        // Iterate through all sandbox sources
        Object.values(vtResult.ttpResult.data).forEach((source: any) => {
            if (!source?.tactics?.length) return;

            source.tactics.forEach((tactic: any) => {
                if (!tactic.id) return;

                // If tactic doesn't exist, add it
                if (!tacticsMap.has(tactic.id)) {
                    tacticsMap.set(tactic.id, {
                        id: tactic.id,
                        name: tactic.name,
                        techniques: new Map<string, any>(),
                    });
                }

                // Add techniques to this tactic
                const existingTactic = tacticsMap.get(tactic.id);
                if (existingTactic && tactic.techniques?.length) {
                    tactic.techniques.forEach((technique: any) => {
                        if (technique.id && !existingTactic.techniques.has(technique.id)) {
                            existingTactic.techniques.set(technique.id, {
                                id: technique.id,
                                name: technique.name,
                            });
                        }
                    });
                }
            });
        });

        // Convert maps to arrays for template use
        return Array.from(tacticsMap.values()).map((tactic) => ({
            id: tactic.id,
            name: tactic.name,
            techniques: Array.from(tactic.techniques.values()),
        }));
    }

    getAllAggregatedTtps(): any[] {
        const tacticsMap = new Map<string, any>();

        for (const [hash, vtResult] of this.vtResultsByHash) {
            if (!vtResult?.ttpResult?.data) continue;

            Object.values(vtResult.ttpResult.data).forEach((source: any) => {
                if (!source?.tactics?.length) return;

                source.tactics.forEach((tactic: any) => {
                    if (!tactic.id) return;

                    if (!tacticsMap.has(tactic.id)) {
                        tacticsMap.set(tactic.id, {
                            id: tactic.id,
                            name: tactic.name,
                            techniques: new Map<string, any>(),
                        });
                    }

                    const existingTactic = tacticsMap.get(tactic.id);
                    if (existingTactic && tactic.techniques?.length) {
                        tactic.techniques.forEach((technique: any) => {
                            if (technique.id && !existingTactic.techniques.has(technique.id)) {
                                existingTactic.techniques.set(technique.id, {
                                    id: technique.id,
                                    name: technique.name,
                                });
                            }
                        });
                    }
                });
            });
        }

        return Array.from(tacticsMap.values()).map((tactic) => ({
            id: tactic.id,
            name: tactic.name,
            techniques: Array.from(tactic.techniques.values()),
        }));
    }

    private cleanFilenames(names: string[]): string[] {
        let cleaned = this.stripDirectoryPaths(names);

        cleaned = this.filterCorruptedFilenames(cleaned);

        cleaned = [...new Set(cleaned)];

        return cleaned;
    }

    private stripDirectoryPaths(names: string[]): string[] {
        return names.map((name) => {
            let filename = name;

            if (filename.includes('/')) {
                const splitArr = filename.split('/');
                filename = splitArr[splitArr.length - 1];
            }

            if (filename.includes('\\')) {
                const splitArr = filename.split('\\');
                filename = splitArr[splitArr.length - 1];
            }

            return filename;
        });
    }

    private filterCorruptedFilenames(names: string[]): string[] {
        return names.filter((name) => {
            // 1. Exclude Unicode replacement character (U+FFFD) - definite encoding error
            if (name.includes('�')) {
                return false;
            }

            // 2. Exclude multiple consecutive question marks (3+) - likely encoding error
            if (name.includes('???')) {
                return false;
            }

            // 3. Exclude C1 control characters (0x80-0x9f) - common in mojibake
            // These are control characters that shouldn't appear in legitimate filenames
            for (let i = 0; i < name.length; i++) {
                const code = name.codePointAt(i);
                if (code >= 0x80 && code <= 0x9f) {
                    return false;
                }
            }

            // 4. Detect mojibake pattern: accented letter followed by currency symbol
            // Pattern from ftfy library - this virtually never occurs in legitimate filenames
            const mojibakePattern = /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ][¢£¥€]/i;
            if (mojibakePattern.test(name)) {
                return false;
            }

            // 5. Check for "bad" characters that are ~100% mojibake indicators (from ftfy)
            // These characters rarely appear in legitimate filenames but are common in mojibake
            const badMojibakeChars = /[¦¨¯´¸¼½¾]/;
            if (badMojibakeChars.test(name)) {
                return false;
            }

            // 6. Check for Greek letters mixed with Latin (strong mojibake indicator)
            // Greek letters should not appear in typical filenames
            const greekLetters = /[Α-Ωα-ω]/;
            if (greekLetters.test(name)) {
                return false;
            }

            // 7. Check for multiple different Latin-1 special characters (mojibake pattern)
            // Count distinct special chars like ¥, ¬, ¡, ¿, etc.
            const specialChars = name.match(/[¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿]/g);
            if (specialChars && specialChars.length >= 3) {
                return false;
            }

            return true;
        });
    }

    private validateAndClassifyInputs(text: string): {
        ips: string[];
        ipv4: string[];
        ipv6: string[];
        hashes: string[];
        domains: string[];
        urls: string[];
        invalid: string[];
        cidr: string[];
        hasMixed: boolean;
    } {
        const urlRegex = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s]+$/;
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex =
            /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
        const hashRegex = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/;
        const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        const cidrRegex = /\/\d{1,3}$/;

        const ips: string[] = [];
        const ipv4: string[] = [];
        const ipv6: string[] = [];
        const hashes: string[] = [];
        const domains: string[] = [];
        const urls: string[] = [];
        const invalid: string[] = [];
        const cidr: string[] = [];

        const lines = text.split(/\r?\n/);

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            const defanged = trimmed
                .replace(/\[\.?\]/g, '.')
                .replace(/\[|\]/g, '')
                .replace(/^h[xX]{2}p/, 'http');

            if (urlRegex.test(defanged)) {
                urls.push(defanged);
            } else if (cidrRegex.test(defanged)) {
                cidr.push(trimmed);
            } else if (ipv4Regex.test(defanged)) {
                ips.push(defanged);
                ipv4.push(defanged);
            } else if (ipv6Regex.test(defanged)) {
                ips.push(defanged);
                ipv6.push(defanged);
            } else if (hashRegex.test(defanged)) {
                hashes.push(defanged);
            } else if (domainRegex.test(defanged)) {
                domains.push(defanged.toLowerCase());
            } else {
                invalid.push(trimmed);
            }
        });

        const uniqueIps = [...new Set(ips)];
        const uniqueIpv4 = [...new Set(ipv4)];
        const uniqueIpv6 = [...new Set(ipv6)];
        const uniqueHashes = [...new Set(hashes)];
        const uniqueDomains = [...new Set(domains)];
        const uniqueUrls = [...new Set(urls)];
        const hasMixed = uniqueIps.length > 0 && uniqueHashes.length > 0;

        return {
            ips: uniqueIps,
            ipv4: uniqueIpv4,
            ipv6: uniqueIpv6,
            hashes: uniqueHashes,
            domains: uniqueDomains,
            urls: uniqueUrls,
            invalid,
            cidr,
            hasMixed,
        };
    }

    private async extractIndicatorsFromText(text: string): Promise<string | null> {
        try {
            const result: any = await this.identifyStix.postIdentifyStix(text);
            if (!result || !result.objects || result.objects.length === 0) {
                return null;
            }

            const values: string[] = [];

            for (const obj of result.objects) {
                switch (obj.type) {
                    case 'ipv4-addr':
                    case 'ipv6-addr':
                        if (obj.value) {
                            values.push(obj.value);
                        }
                        break;
                    case 'domain-name':
                        if (obj.value) {
                            values.push(obj.value);
                        }
                        break;
                    case 'url':
                        if (obj.value) {
                            values.push(obj.value);
                        }
                        break;
                    case 'file':
                        if (obj.hashes) {
                            const hash =
                                obj.hashes['SHA-256'] ||
                                obj.hashes['SHA-1'] ||
                                obj.hashes['MD5'] ||
                                obj.hashes['SHA-512'] ||
                                obj.hashes['SSDEEP'] ||
                                obj.hashes['TLSH'];
                            if (hash) {
                                values.push(hash);
                            }
                        }
                        break;
                }
            }

            const unique = [...new Set(values)];
            return unique.length > 0 ? unique.join('\n') : null;
        } catch (e) {
            console.error('Error extracting indicators from text:', e);
            return null;
        }
    }

    async searchVtIp(ip: string): Promise<any> {
        try {
            const vtIpResult: any = await this.vtSearchService.postVtIpSearch(ip);

            const errors: string[] = [];
            let ipObj: any = null;

            const vtData = {
                ip: ip,
                ipResult: vtIpResult,
                hasData: !!(vtIpResult && vtIpResult.data && vtIpResult.data.attributes),
            };

            if (vtIpResult && vtIpResult.data) {
                const ipType = this.detectIpType(ip);
                ipObj = this.createIpObject(ip, ipType);
            } else if (vtIpResult && vtIpResult.message) {
                console.info(vtIpResult.message);
                errors.push(`No IP data returned from VirusTotal for ${ip}. We have generated a STIX object to be included in your report.`);

                const ipType = this.detectIpType(ip);
                ipObj = this.createIpObject(ip, ipType);
            }

            return {
                success: true,
                errors,
                ipObj,
                vtData,
            };
        } catch (e) {
            console.error(`Error in searchVtIp for ${ip}:`, e);

            const ipType = this.detectIpType(ip);
            const ipObj = this.createIpObject(ip, ipType);

            return {
                success: false,
                errors: [`Error encountered for ${ip}: ${e}`],
                ipObj,
                vtData: {
                    ip: ip,
                    ipResult: null,
                    hasData: false,
                },
            };
        }
    }

    async searchVtDomain(domain: string): Promise<any> {
        try {
            const vtDomainResult: any = await this.vtSearchService.postVtDomainSearch(domain);

            const errors: string[] = [];
            let domainObj: any = null;
            let x509CertObj: any = null;

            const vtData = {
                domain: domain,
                domainResult: vtDomainResult,
                hasData: !!(vtDomainResult && vtDomainResult.data && vtDomainResult.data.attributes),
            };

            if (vtDomainResult && vtDomainResult.data) {
                domainObj = this.createDomainSearchObject(domain);
                const cert = vtDomainResult.data.attributes?.last_https_certificate;
                if (cert) {
                    x509CertObj = this.createX509CertificateObject(cert);
                }
            } else if (vtDomainResult && vtDomainResult.message) {
                console.info(vtDomainResult.message);
                errors.push(`No domain data returned from VirusTotal for ${domain}. We have generated a STIX object to be included in your report.`);
                domainObj = this.createDomainSearchObject(domain);
            }

            return { success: true, errors, domainObj, x509CertObj, vtData };
        } catch (e) {
            console.error(`Error in searchVtDomain for ${domain}:`, e);
            const domainObj = this.createDomainSearchObject(domain);

            return {
                success: false,
                errors: [`Error encountered for ${domain}: ${e}`],
                domainObj,
                x509CertObj: null,
                vtData: { domain: domain, domainResult: null, hasData: false },
            };
        }
    }

    private createX509CertificateObject(cert: any): any {
        const formatDistinguishedName = (dnObj: any): string =>
            Object.entries(dnObj || {})
                .map(([k, v]) => `${k}=${v}`)
                .join(', ');

        const formatValidityDate = (dateStr: string): string =>
            dateStr ? dateStr.replace(' ', 'T').replace(/(\d{2}:\d{2}:\d{2})$/, '$1Z') : dateStr;

        const x509Obj: any = {
            type: 'x509-certificate',
            spec_version: '2.1',
        };

        if (cert.thumbprint || cert.thumbprint_sha256) {
            x509Obj.hashes = {};
            if (cert.thumbprint) x509Obj.hashes['SHA-1'] = cert.thumbprint;
            if (cert.thumbprint_sha256) x509Obj.hashes['SHA-256'] = cert.thumbprint_sha256;
        }

        if (cert.version) x509Obj.version = cert.version.replace(/^V/i, '');
        if (cert.serial_number) x509Obj.serial_number = cert.serial_number;
        if (cert.issuer) x509Obj.issuer = formatDistinguishedName(cert.issuer);
        if (cert.subject) x509Obj.subject = formatDistinguishedName(cert.subject);
        if (cert.validity?.not_before) x509Obj.validity_not_before = formatValidityDate(cert.validity.not_before);
        if (cert.validity?.not_after) x509Obj.validity_not_after = formatValidityDate(cert.validity.not_after);

        if (cert.public_key?.algorithm) {
            x509Obj.subject_public_key_algorithm = cert.public_key.algorithm;
        }
        if (cert.public_key?.rsa?.modulus) {
            x509Obj.subject_public_key_modulus = cert.public_key.rsa.modulus;
        }
        if (cert.public_key?.rsa?.exponent) {
            x509Obj.subject_public_key_exponent = parseInt(cert.public_key.rsa.exponent, 16);
        }

        x509Obj.id = 'x509-certificate--' + this.stixService.getUUIDFrIdContributingPropertiesVT(x509Obj);
        return x509Obj;
    }

    private createDomainSearchObject(domain: string): any {
        const domainObj: any = {
            type: 'domain-name',
            spec_version: '2.1',
            value: domain,
        };
        domainObj.id = 'domain-name--' + this.stixService.getUUIDFrIdContributingPropertiesVT(domainObj);
        return domainObj;
    }

    private createDomainSearchIndicatorObject(domain: string): any {
        const now = new Date().toISOString();
        const indicator: any = {
            type: 'indicator',
            spec_version: '2.1',
            created_by_ref: this.envService.env.defaultIdentity.id,
            created: now,
            modified: now,
            name: `Malicious Domain - ${domain}`,
            indicator_types: ['malicious-activity'],
            pattern: `[domain-name:value = '${domain}']`,
            pattern_type: 'stix',
            pattern_version: '2.1',
            valid_from: now,
        };
        indicator.id = 'indicator--' + this.stixService.getUUIDFrIdContributingPropertiesVT(indicator);
        return indicator;
    }

    private trackDomainStixObject(domain: string, objectId: string): void {
        const ids = this.domainStixObjectIds.get(domain) || [];
        ids.push(objectId);
        this.domainStixObjectIds.set(domain, ids);
    }

    async searchVtUrl(url: string): Promise<any> {
        try {
            const vtUrlResult: any = await this.vtSearchService.postVtUrlSearch(url);

            const errors: string[] = [];
            let urlObj: any = null;
            let finalUrlObj: any = null;

            const vtData = {
                url: url,
                urlResult: vtUrlResult,
                hasData: !!(vtUrlResult && vtUrlResult.data && vtUrlResult.data.attributes),
            };

            if (vtUrlResult && vtUrlResult.data) {
                urlObj = this.createUrlSearchObject(url);
            } else if (vtUrlResult && vtUrlResult.message) {
                console.info(vtUrlResult.message);
                errors.push(`No URL data returned from VirusTotal for ${url}. We have generated a STIX object to be included in your report.`);
                urlObj = this.createUrlSearchObject(url);
            }

            const finalUrl = vtUrlResult?.data?.attributes?.last_final_url;
            if (finalUrl && finalUrl !== url) {
                finalUrlObj = this.createUrlSearchObject(finalUrl);
            }

            return { success: true, errors, urlObj, finalUrlObj, vtData };
        } catch (e) {
            console.error(`Error in searchVtUrl for ${url}:`, e);
            const urlObj = this.createUrlSearchObject(url);

            return {
                success: false,
                errors: [`Error encountered for ${url}: ${e}`],
                urlObj,
                finalUrlObj: null,
                vtData: { url: url, urlResult: null, hasData: false },
            };
        }
    }

    private createUrlSearchObject(url: string): any {
        const urlObj: any = {
            type: 'url',
            spec_version: '2.1',
            value: url,
        };
        urlObj.id = 'url--' + this.stixService.getUUIDFrIdContributingPropertiesVT(urlObj);
        return urlObj;
    }

    private createUrlSearchIndicatorObject(url: string): any {
        const now = new Date().toISOString();
        const indicator: any = {
            type: 'indicator',
            spec_version: '2.1',
            created_by_ref: this.envService.env.defaultIdentity.id,
            created: now,
            modified: now,
            name: `Malicious URL - ${url}`,
            indicator_types: ['malicious-activity'],
            pattern: `[url:value = '${url}']`,
            pattern_type: 'stix',
            pattern_version: '2.1',
            valid_from: now,
        };
        indicator.id = 'indicator--' + this.stixService.getUUIDFrIdContributingPropertiesVT(indicator);
        return indicator;
    }

    private trackUrlStixObject(url: string, objectId: string): void {
        const ids = this.urlStixObjectIds.get(url) || [];
        if (!ids.includes(objectId)) ids.push(objectId);
        this.urlStixObjectIds.set(url, ids);
    }

    detectIpType(ip: string): 'ipv4-addr' | 'ipv6-addr' {
        return ip.includes(':') ? 'ipv6-addr' : 'ipv4-addr';
    }

    private createIpObject(ip: string, type: 'ipv4-addr' | 'ipv6-addr'): any {
        const ipObj: any = {
            type: type,
            spec_version: '2.1',
            value: ip,
        };

        ipObj.id = ipObj.type + '--' + this.stixService.getUUIDFrIdContributingPropertiesVT(ipObj);

        return ipObj;
    }

    private createAutonomousSystemObject(asn: number, asOwner?: string, rir?: string): any {
        const asObj: any = {
            type: 'autonomous-system',
            spec_version: '2.1',
            number: asn,
        };
        if (asOwner) asObj.name = asOwner;
        if (rir) asObj.rir = rir;
        asObj.id = 'autonomous-system--' + this.stixService.getUUIDFrIdContributingPropertiesVT(asObj);
        return asObj;
    }

    private createDomainObject(hostname: string, ipId: string): any {
        const domainObj: any = {
            type: 'domain-name',
            spec_version: '2.1',
            value: hostname,
            resolves_to_refs: [ipId],
        };
        domainObj.id = 'domain-name--' + this.stixService.getUUIDFrIdContributingPropertiesVT(domainObj);
        return domainObj;
    }

    private createObservedDataObject(
        objectRefs: string[],
        date: number,
        lastAnalysisStats?: any,
        description?: string,
        numberObserved?: number
    ): any {
        const now = new Date().toISOString();
        const observed = date ? new Date(date * 1000).toISOString() : now;
        const obj: any = {
            type: 'observed-data',
            spec_version: '2.1',
            id: 'observed-data--' + this.stixService.getUUIDFrIdContributingPropertiesVT({ type: 'observed-data' }),
            created_by_ref: this.envService.env.defaultIdentity.id,
            created: now,
            modified: now,
            first_observed: observed,
            last_observed: observed,
            number_observed: numberObserved && numberObserved > 0 ? numberObserved : 1,
            object_refs: [...objectRefs],
        };
        if (description) {
            obj.description = description;
        } else if (lastAnalysisStats) {
            const malicious = lastAnalysisStats.malicious ?? 0;
            const suspicious = lastAnalysisStats.suspicious ?? 0;
            const total = Object.values(lastAnalysisStats).reduce((sum: number, v: any) => sum + (v ?? 0), 0);
            obj.description = `VirusTotal passive DNS resolution. Domain threat score: ${malicious} malicious, ${suspicious} suspicious out of ${total} engines.`;
        }
        return obj;
    }

    private addStixObject(obj: any): void {
        this.allObjects.push(obj);
        if (this.parsedObjects[obj.type]) {
            this.parsedObjects[obj.type].push(obj);
        } else {
            this.parsedObjects[obj.type] = [obj];
        }
        if (Array.isArray(this.selectedObjects)) {
            this.selectedObjects.push(obj.id);
        }
    }

    private createIdsIndicatorObject(rule: any): any {
        const now = new Date().toISOString();
        const indicator: any = {
            type: 'indicator',
            spec_version: '2.1',
            created_by_ref: this.envService.env.defaultIdentity.id,
            created: now,
            modified: now,
            name: rule.rule_msg || `IDS Rule ${rule.rule_id}`,
            description: `Source: ${rule.rule_source || 'Unknown'}. Category: ${rule.rule_category || 'Unknown'}. Severity: ${rule.alert_severity || 'Unknown'}.`,
            indicator_types: ['malicious-activity'],
            pattern: rule.rule_raw.trim(),
            pattern_type: 'snort',
            valid_from: now,
        };
        indicator.id = 'indicator--' + this.stixService.getUUIDFrIdContributingPropertiesVT(indicator);
        return indicator;
    }

    private createSigmaIndicatorObject(rule: any): any {
        const now = new Date().toISOString();
        const fullYaml = this.sigmaFullRules.get(rule.rule_id);
        const indicator: any = {
            type: 'indicator',
            spec_version: '2.1',
            created_by_ref: this.envService.env.defaultIdentity.id,
            created: now,
            modified: now,
            name: rule.rule_title || `Sigma Rule ${rule.rule_id}`,
            description: `Author: ${rule.rule_author || 'Unknown'}. Source: ${rule.rule_source || 'Unknown'}. Level: ${rule.rule_level || 'Unknown'}.`,
            indicator_types: ['malicious-activity'],
            pattern: (fullYaml || rule.rule_title).trim(),
            pattern_type: 'sigma',
            valid_from: now,
        };
        indicator.id = 'indicator--' + this.stixService.getUUIDFrIdContributingPropertiesVT(indicator);
        return indicator;
    }

    private createRuleIndicatorsForHash(hash: string): any[] {
        const indicators: any[] = [];

        const idsRules = this.getIdsResultsForHash(hash);
        for (const rule of idsRules) {
            if (rule.rule_raw) {
                indicators.push(this.createIdsIndicatorObject(rule));
            }
        }

        const sigmaRules = this.getSigmaRulesForHash(hash);
        for (const rule of sigmaRules) {
            indicators.push(this.createSigmaIndicatorObject(rule));
        }

        return indicators;
    }

    private createIpIndicatorObject(ip: string): any {
        const now = new Date().toISOString();
        const ipType = this.detectIpType(ip);
        const scoType = ipType === 'ipv6-addr' ? 'ipv6-addr' : 'ipv4-addr';
        const indicator: any = {
            type: 'indicator',
            spec_version: '2.1',
            created_by_ref: this.envService.env.defaultIdentity.id,
            created: now,
            modified: now,
            name: `Malicious IP - ${ip}`,
            indicator_types: ['malicious-activity'],
            pattern: `[${scoType}:value = '${ip}']`,
            pattern_type: 'stix',
            pattern_version: '2.1',
            valid_from: now,
        };
        indicator.id = 'indicator--' + this.stixService.getUUIDFrIdContributingPropertiesVT(indicator);
        return indicator;
    }

    private createDomainIndicatorObject(hostname: string, resolutionDate: number, lastAnalysisStats?: any): any {
        const now = new Date().toISOString();
        const validFrom = resolutionDate ? new Date(resolutionDate * 1000).toISOString() : now;
        const indicator: any = {
            type: 'indicator',
            spec_version: '2.1',
            created_by_ref: this.envService.env.defaultIdentity.id,
            created: now,
            modified: now,
            name: `pDNS Domain - ${hostname}`,
            indicator_types: ['malicious-activity'],
            pattern: `[domain-name:value = '${hostname}']`,
            pattern_type: 'stix',
            pattern_version: '2.1',
            valid_from: validFrom,
        };
        if (lastAnalysisStats) {
            const malicious = lastAnalysisStats.malicious ?? 0;
            const suspicious = lastAnalysisStats.suspicious ?? 0;
            const total = Object.values(lastAnalysisStats).reduce((sum: number, v: any) => sum + (v ?? 0), 0);
            indicator.description = `VirusTotal passive DNS domain. Threat score: ${malicious} malicious, ${suspicious} suspicious out of ${total} engines.`;
        }
        indicator.id = 'indicator--' + this.stixService.getUUIDFrIdContributingPropertiesVT(indicator);
        return indicator;
    }

    private createRelationshipObject(sourceRef: string, targetRef: string, relationshipType = 'based-on'): any {
        const now = new Date().toISOString();
        const rel: any = {
            type: 'relationship',
            spec_version: '2.1',
            created_by_ref: this.envService.env.defaultIdentity.id,
            created: now,
            modified: now,
            relationship_type: relationshipType,
            source_ref: sourceRef,
            target_ref: targetRef,
        };
        rel.id = 'relationship--' + this.stixService.getUUIDFrIdContributingPropertiesVT(rel);
        return rel;
    }

    private convertResolutionsToStixObjects(ip: string): void {
        const resolutions = this.getIpResolutions(ip);
        if (!resolutions.length) return;

        const ipObj = this.allObjects.find((o) => (o.type === 'ipv4-addr' || o.type === 'ipv6-addr') && o.value === ip);
        if (!ipObj) return;

        if (!this.convertedDomains.has(ip)) {
            this.convertedDomains.set(ip, new Set());
        }
        const converted = this.convertedDomains.get(ip)!;

        let anyNewDomains = false;

        for (const resolution of resolutions) {
            const hostname = resolution.attributes?.host_name;
            if (!hostname || converted.has(hostname)) continue;

            const lastAnalysisStats = resolution.attributes?.last_analysis_stats ?? resolution.attributes?.host_name_last_analysis_stats;
            const domainObj = this.createDomainObject(hostname, ipObj.id);
            const observedObj = this.createObservedDataObject([ipObj.id, domainObj.id], resolution.attributes.date, lastAnalysisStats);

            this.allObjects.push(domainObj);
            this.allObjects.push(observedObj);

            if (this.selectAll) {
                this.selectedObjects.push(domainObj.id);
                this.selectedObjects.push(observedObj.id);
            }

            if (!this.parsedObjects['domain-name']) this.parsedObjects['domain-name'] = [];
            if (!this.parsedObjects['observed-data']) this.parsedObjects['observed-data'] = [];
            this.parsedObjects['domain-name'].push(domainObj);
            this.parsedObjects['observed-data'].push(observedObj);

            this.trackIpStixObject(ip, domainObj.id);
            this.trackIpStixObject(ip, observedObj.id);

            converted.add(hostname);
            anyNewDomains = true;
        }

        // Build/update combined pDNS indicator whenever new domains are processed
        if (anyNewDomains) {
            this.updateCombinedIpDomainIndicator(ip);
        }
    }

    private convertDomainResolutionsToStixObjects(domain: string): void {
        const resolutions = this.getDomainResolutions(domain);
        if (!resolutions.length) return;

        const domainObj = this.allObjects.find((o) => o.type === 'domain-name' && o.value === domain);
        if (!domainObj) return;

        if (!this.convertedDomainResolutionIps.has(domain)) {
            this.convertedDomainResolutionIps.set(domain, new Set());
        }
        const converted = this.convertedDomainResolutionIps.get(domain)!;

        const newIpIds: string[] = [];

        for (const resolution of resolutions) {
            const ip = resolution.attributes?.ip_address;
            if (!ip || converted.has(ip)) continue;

            const existing = this.allObjects.find((o) => (o.type === 'ipv4-addr' || o.type === 'ipv6-addr') && o.value === ip);
            if (existing) {
                if (!newIpIds.includes(existing.id)) newIpIds.push(existing.id);
                converted.add(ip);
                continue;
            }

            const ipType = this.detectIpType(ip);
            const ipObj = this.createIpObject(ip, ipType);
            this.addStixObject(ipObj);
            this.trackDomainStixObject(domain, ipObj.id);
            newIpIds.push(ipObj.id);
            converted.add(ip);
        }

        if (newIpIds.length) {
            const existing: string[] = domainObj.resolves_to_refs || [];
            domainObj.resolves_to_refs = Array.from(new Set([...existing, ...newIpIds]));
        }
    }

    private convertDomainCommunicatingFilesToStixObjects(domain: string): void {
        const files = this.getDomainCommunicatingFiles(domain);
        if (!files.length) return;

        const domainObj = this.allObjects.find((o) => o.type === 'domain-name' && o.value === domain);
        if (!domainObj) return;

        if (!this.convertedDomainCommunicatingFileHashes.has(domain)) {
            this.convertedDomainCommunicatingFileHashes.set(domain, new Set());
        }
        const converted = this.convertedDomainCommunicatingFileHashes.get(domain)!;

        for (const file of files) {
            const sha256 = file.attributes?.sha256;
            if (!sha256 || converted.has(sha256)) continue;

            const existing = this.allObjects.find((o) => o.type === 'file' && o.hashes?.['SHA-256'] === sha256);
            if (existing) {
                converted.add(sha256);
                const rel = this.createRelationshipObject(existing.id, domainObj.id, 'communicates-with');
                this.addStixObject(rel);
                this.trackDomainStixObject(domain, rel.id);
                continue;
            }

            const fileObj: any = { type: 'file', spec_version: '2.1', hashes: { 'SHA-256': sha256 } };
            if (file.attributes?.names?.[0]) fileObj.name = file.attributes.names[0];
            if (file.attributes?.size != null) fileObj.size = file.attributes.size;
            fileObj.id = 'file--' + this.stixService.getUUIDFrIdContributingPropertiesVT(fileObj);

            this.addStixObject(fileObj);
            this.trackDomainStixObject(domain, fileObj.id);

            const rel = this.createRelationshipObject(fileObj.id, domainObj.id, 'communicates-with');
            this.addStixObject(rel);
            this.trackDomainStixObject(domain, rel.id);

            converted.add(sha256);
        }
    }

    /** Builds STIX objects from a URL's serving-IP relation and response attributes:
     *  the serving ipv4/6-addr, its autonomous-system, the resolved domain-name, the HTTPS
     *  x509-certificate, the response-body file, and an observed-data grouping them with the URL.
     *  SCOs are deduped against the bundle so an address reached by multiple paths appears once. */
    private convertUrlServingIpToStixObjects(url: string): void {
        const urlObj = this.allObjects.find((o) => o.type === 'url' && o.value === url);
        if (!urlObj) return;

        const ip = this.getUrlServingIp(url);
        if (!ip) return;

        // Re-entrancy guard: only process a given serving IP once per URL.
        if (!this.convertedUrlServingIps.has(url)) this.convertedUrlServingIps.set(url, new Set());
        const converted = this.convertedUrlServingIps.get(url)!;
        if (converted.has(ip)) return;
        converted.add(ip);

        const attrs = this.getUrlAttributes(url) ?? {};
        const ipAttrs = this.getUrlRelation(url, 'servingIp')?.data?.data?.attributes ?? {};

        const objectRefs: string[] = [urlObj.id];

        // --- Autonomous System (created first so the IP can reference it) ---
        let asObj: any = null;
        if (ipAttrs.asn != null) {
            const existingAs = this.allObjects.find((o) => o.type === 'autonomous-system' && o.number === ipAttrs.asn);
            if (existingAs) {
                asObj = existingAs;
            } else {
                asObj = this.createAutonomousSystemObject(ipAttrs.asn, ipAttrs.as_owner, ipAttrs.regional_internet_registry);
                this.addStixObject(asObj);
                this.trackUrlStixObject(url, asObj.id);
            }
        }

        // --- Serving IP (deduped: may already exist from an IP search, a domain resolution, or the URL host literal) ---
        let ipObj = this.allObjects.find((o) => (o.type === 'ipv4-addr' || o.type === 'ipv6-addr') && o.value === ip);
        if (!ipObj) {
            ipObj = this.createIpObject(ip, this.detectIpType(ip));
            if (asObj) ipObj.belongs_to_refs = [asObj.id];
            this.addStixObject(ipObj);
            this.trackUrlStixObject(url, ipObj.id);
        } else if (asObj && !ipObj.belongs_to_refs?.includes(asObj.id)) {
            ipObj.belongs_to_refs = Array.from(new Set([...(ipObj.belongs_to_refs || []), asObj.id]));
        }
        objectRefs.push(ipObj.id);

        // --- Resolved domain (only when the URL host is a hostname, not an IP literal) ---
        const hostname = this.getUrlHostname(url);
        const hostIsDomain = !!hostname && /[a-zA-Z]/.test(hostname) && !hostname.includes(':') && !hostname.startsWith('[');
        if (hostIsDomain) {
            let domainObj = this.allObjects.find((o) => o.type === 'domain-name' && o.value === hostname);
            if (!domainObj) {
                domainObj = this.createDomainObject(hostname, ipObj.id);
                this.addStixObject(domainObj);
                this.trackUrlStixObject(url, domainObj.id);
            } else {
                domainObj.resolves_to_refs = Array.from(new Set([...(domainObj.resolves_to_refs || []), ipObj.id]));
            }
            objectRefs.push(domainObj.id);
        }

        // --- HTTPS certificate (lives on the serving-IP object; absent for plain-HTTP URLs) ---
        const cert = ipAttrs.last_https_certificate;
        if (cert) {
            const x509Obj = this.createX509CertificateObject(cert);
            if (!this.allObjects.some((o) => o.id === x509Obj.id)) {
                this.addStixObject(x509Obj);
                this.trackUrlStixObject(url, x509Obj.id);
            }
            objectRefs.push(x509Obj.id);
        }

        // --- Response body file ---
        const bodySha256 = attrs.last_http_response_content_sha256;
        if (bodySha256) {
            let fileObj = this.allObjects.find((o) => o.type === 'file' && o.hashes?.['SHA-256'] === bodySha256);
            if (!fileObj) {
                fileObj = { type: 'file', spec_version: '2.1', hashes: { 'SHA-256': bodySha256 } };
                if (attrs.last_http_response_content_length != null) fileObj.size = attrs.last_http_response_content_length;
                fileObj.id = 'file--' + this.stixService.getUUIDFrIdContributingPropertiesVT(fileObj);
                this.addStixObject(fileObj);
                this.trackUrlStixObject(url, fileObj.id);
            }
            objectRefs.push(fileObj.id);
        }

        // --- Observed-data grouping (carries the VT detection/serving-IP summary) ---
        const observedDate = attrs.last_analysis_date || attrs.last_submission_date;
        const observedObj = this.createObservedDataObject(
            objectRefs,
            observedDate,
            undefined,
            this.buildUrlObservedDescription(url, ip, ipAttrs),
            attrs.times_submitted
        );
        this.addStixObject(observedObj);
        this.trackUrlStixObject(url, observedObj.id);

        // --- Indicator --based-on--> observed-data ---
        const indicatorObj = this.allObjects.find((o) => o.type === 'indicator' && o.pattern === `[url:value = '${url}']`);
        if (indicatorObj) {
            const rel = this.createRelationshipObject(indicatorObj.id, observedObj.id, 'based-on');
            this.addStixObject(rel);
            this.trackUrlStixObject(url, rel.id);
        }
    }

    private buildUrlObservedDescription(url: string, ip: string, ipAttrs: any): string {
        const stats = this.getUrlAnalysisStats(url);
        const total = this.getUrlTotalEngines(url);
        const attrs = this.getUrlAttributes(url) ?? {};
        const headers = attrs.last_http_response_headers ?? {};
        const contentType = headers['content-type'] || headers['Content-Type'] || 'unknown';
        const code = attrs.last_http_response_code ?? 'N/A';
        const length = attrs.last_http_response_content_length ?? 'unknown';

        let desc = `VirusTotal URL analysis. ${stats.malicious} malicious, ${stats.suspicious} suspicious out of ${total} engines.`;
        desc += ` HTTP ${code}, content-type ${contentType}, ${length} bytes.`;

        const asParts: string[] = [];
        if (ipAttrs.asn != null) asParts.push(`AS${ipAttrs.asn}`);
        if (ipAttrs.as_owner) asParts.push(ipAttrs.as_owner);
        if (ipAttrs.country) asParts.push(ipAttrs.country);
        desc += asParts.length ? ` Served by ${ip} (${asParts.join(' ')}).` : ` Served by ${ip}.`;

        const ipStats = ipAttrs.last_analysis_stats;
        if (ipStats && (ipStats.malicious || ipStats.suspicious)) {
            desc += ` Serving IP scored ${ipStats.malicious ?? 0} malicious, ${ipStats.suspicious ?? 0} suspicious.`;
        }

        if (Array.isArray(attrs.threat_names) && attrs.threat_names.length) {
            desc += ` Threat names: ${attrs.threat_names.join(', ')}.`;
        }
        return desc;
    }

    private trackIpStixObject(ip: string, id: string): void {
        if (!this.ipStixObjectIds.has(ip)) {
            this.ipStixObjectIds.set(ip, []);
        }
        const ids = this.ipStixObjectIds.get(ip)!;
        if (!ids.includes(id)) ids.push(id);
    }

    /** Removes all relationship objects tracked for an IP whose source_ref points to indicatorId. */
    private removeRelationshipsForIndicator(ip: string, indicatorId: string): void {
        const relIds = (this.ipStixObjectIds.get(ip) || [])
            .filter((id) => id.startsWith('relationship--'))
            .filter((id) => this.allObjects.find((o) => o.id === id)?.source_ref === indicatorId);

        for (const relId of relIds) {
            this.allObjects = this.allObjects.filter((o) => o.id !== relId);
            if (this.parsedObjects['relationship']) {
                this.parsedObjects['relationship'] = this.parsedObjects['relationship'].filter((o: any) => o.id !== relId);
                if (this.parsedObjects['relationship'].length === 0) delete this.parsedObjects['relationship'];
            }
            const idx = this.selectedObjects.indexOf(relId);
            if (idx !== -1) this.selectedObjects.splice(idx, 1);
            this.ipStixObjectIds.set(
                ip,
                (this.ipStixObjectIds.get(ip) || []).filter((id) => id !== relId)
            );
        }
    }

    /** Removes any existing indicator for this IP (simple or combined) and creates an updated
     *  combined pDNS indicator covering all accumulated domains for this IP. */
    private updateCombinedIpDomainIndicator(ip: string): void {
        const allDomains = Array.from(this.convertedDomains.get(ip) || []);
        if (allDomains.length === 0) return;

        // Remove any previously tracked indicator for this IP (simple upfront OR prior combined)
        const existingIndicatorId =
            this.combinedIpPdnsIndicatorIds.get(ip) || this.ipStixObjectIds.get(ip)?.find((id) => id.startsWith('indicator--'));

        let oldIndicatorWasSelected = false;
        if (existingIndicatorId) {
            // Track whether the old indicator was selected so we carry that through to the new one
            oldIndicatorWasSelected = Array.isArray(this.selectedObjects) && this.selectedObjects.includes(existingIndicatorId);

            // Remove relationships that pointed from the old indicator before removing the indicator itself
            this.removeRelationshipsForIndicator(ip, existingIndicatorId);

            this.allObjects = this.allObjects.filter((o) => o.id !== existingIndicatorId);
            if (this.parsedObjects['indicator']) {
                this.parsedObjects['indicator'] = this.parsedObjects['indicator'].filter((o: any) => o.id !== existingIndicatorId);
                if (this.parsedObjects['indicator'].length === 0) delete this.parsedObjects['indicator'];
            }
            // Remove old indicator from selectedObjects to avoid orphaned IDs
            if (oldIndicatorWasSelected && Array.isArray(this.selectedObjects)) {
                const idx = this.selectedObjects.indexOf(existingIndicatorId);
                if (idx !== -1) this.selectedObjects.splice(idx, 1);
            }
            // Remove from tracked IDs so we don't accumulate stale entries
            const ids = this.ipStixObjectIds.get(ip) || [];
            this.ipStixObjectIds.set(
                ip,
                ids.filter((id) => id !== existingIndicatorId)
            );
        }

        const combinedIndicator = this.createCombinedIpDomainIndicatorObject(ip, allDomains);
        this.allObjects.push(combinedIndicator);
        if (!this.parsedObjects['indicator']) this.parsedObjects['indicator'] = [];
        this.parsedObjects['indicator'].push(combinedIndicator);
        this.combinedIpPdnsIndicatorIds.set(ip, combinedIndicator.id);
        this.trackIpStixObject(ip, combinedIndicator.id);

        // Select the new combined indicator if the old one was selected or selectAll is active
        if ((oldIndicatorWasSelected || this.selectAll) && Array.isArray(this.selectedObjects)) {
            if (!this.selectedObjects.includes(combinedIndicator.id)) {
                this.selectedObjects.push(combinedIndicator.id);
            }
        }

        // Create based-on relationships from the new indicator to each observed-data for this IP
        const observedIds = (this.ipStixObjectIds.get(ip) || []).filter((id) => id.startsWith('observed-data--'));
        for (const obsId of observedIds) {
            const rel = this.createRelationshipObject(combinedIndicator.id, obsId);
            this.allObjects.push(rel);
            if (!this.parsedObjects['relationship']) this.parsedObjects['relationship'] = [];
            this.parsedObjects['relationship'].push(rel);
            this.trackIpStixObject(ip, rel.id);
            if ((oldIndicatorWasSelected || this.selectAll) && !this.selectedObjects.includes(rel.id)) {
                this.selectedObjects.push(rel.id);
            }
        }
    }

    private createCombinedIpDomainIndicatorObject(ip: string, domains: string[]): any {
        const now = new Date().toISOString();
        const pattern = domains.map((domain) => `[domain-name:value = '${domain}' AND domain-name.resolves_to_refs[*].value = '${ip}']`).join(' OR ');

        const indicator: any = {
            type: 'indicator',
            spec_version: '2.1',
            created_by_ref: this.envService.env.defaultIdentity.id,
            created: now,
            modified: now,
            name: `pDNS Resolutions - ${ip}`,
            description: `Passive DNS resolutions observed for IP ${ip}.`,
            indicator_types: ['malicious-activity'],
            pattern,
            pattern_type: 'stix',
            pattern_version: '2.1',
            valid_from: now,
        };
        indicator.id = 'indicator--' + this.stixService.getUUIDFrIdContributingPropertiesVT(indicator);
        return indicator;
    }

    toggleIpExpansion(ip: string): void {
        if (this.expandedIps.has(ip)) {
            this.expandedIps.delete(ip);
        } else {
            this.expandedIps.add(ip);
        }
    }

    isIpExpanded(ip: string): boolean {
        return this.expandedIps.has(ip);
    }

    getIpsWithResults(): string[] {
        return Array.from(this.vtResultsByIp.keys());
    }

    getVtResultForIp(ip: string): any {
        return this.vtResultsByIp.get(ip);
    }

    hasIpSectionData(ip: string, section: 'network' | 'analysis'): boolean {
        const vtResult = this.vtResultsByIp.get(ip);
        if (!vtResult || !vtResult.ipResult?.data?.attributes) {
            return false;
        }

        const attrs = vtResult.ipResult.data.attributes;

        switch (section) {
            case 'network':
                return !!(attrs.as_owner || attrs.asn || attrs.network || attrs.country);
            case 'analysis':
                return !!attrs.last_analysis_stats;
            default:
                return false;
        }
    }

    getIpDetectionResults(ip: string): any[] {
        const vtResult = this.vtResultsByIp.get(ip);
        if (!vtResult || !vtResult.ipResult?.data?.attributes?.last_analysis_results) {
            return [];
        }

        const results = Object.entries(vtResult.ipResult.data.attributes.last_analysis_results).map(([key, value]: [string, any]) => ({
            engine: key,
            engine_name: value.engine_name,
            result: value.result,
            category: value.category,
        }));

        const categoryPriority: Record<string, number> = { malicious: 0, suspicious: 1, error: 2, clean: 3 };

        return results.sort((a, b) => {
            const catA = this.getDetectionCategory(a.result, a.category);
            const catB = this.getDetectionCategory(b.result, b.category);
            const priorityA = categoryPriority[catA] ?? 3;
            const priorityB = categoryPriority[catB] ?? 3;

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return (a.engine_name || a.engine).localeCompare(b.engine_name || b.engine);
        });
    }

    setIpResultTab(ip: string, tab: string): void {
        this.ipResultTabs.set(ip, tab);
    }

    getIpResultTab(ip: string): string {
        return this.ipResultTabs.get(ip) || 'detection';
    }

    getIpAttributes(ip: string): any {
        const vtResult = this.vtResultsByIp.get(ip);
        return vtResult?.ipResult?.data?.attributes || {};
    }

    hasRdapData(ip: string): boolean {
        const attrs = this.getIpAttributes(ip);
        return !!(attrs.rdap || attrs.regional_internet_registry);
    }

    getRdapData(ip: string): any {
        const attrs = this.getIpAttributes(ip);
        return attrs.rdap || null;
    }

    formatWhoisDate(timestamp: number): string {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    formatCertificateDN(dn: any): string {
        if (!dn) return 'N/A';
        if (typeof dn === 'string') return dn;

        const parts: string[] = [];
        if (dn.C) parts.push(`C=${dn.C}`);
        if (dn.ST) parts.push(`ST=${dn.ST}`);
        if (dn.L) parts.push(`L=${dn.L}`);
        if (dn.O) parts.push(`O=${dn.O}`);
        if (dn.OU) parts.push(`OU=${dn.OU}`);
        if (dn.CN) parts.push(`CN=${dn.CN}`);

        return parts.length > 0 ? parts.join(', ') : JSON.stringify(dn);
    }

    private getRelation(ip: string, key: IpRelationKey): any {
        return this.vtResultsByIp.get(ip)?.relations?.[key];
    }

    private readonly allRelationKeys: IpRelationKey[] = [
        'resolutions',
        'communicatingFiles',
        'referrerFiles',
        'historicalWhois',
        'historicalSslCerts',
    ];

    isRelationsTabLoading(ip: string): boolean {
        return this.allRelationKeys.some((key) => this.getRelation(ip, key)?.loading ?? true);
    }

    private async loadIpRelation(
        ip: string,
        key: IpRelationKey,
        label: string,
        fetchData: (ip: string, limit: number, cursor?: string | null) => Promise<any>
    ): Promise<void> {
        const vtResult = this.vtResultsByIp.get(ip);
        if (!vtResult) return;
        if (!vtResult.relations) vtResult.relations = {};
        if (vtResult.relations[key]?.data !== undefined) return;

        vtResult.relations[key] = { data: null, loading: true, loadingMore: false, cursor: null };
        this.vtResultsByIp.set(ip, vtResult);

        try {
            const result: any = await fetchData(ip, 40);
            if (result?.data) {
                vtResult.relations[key]!.data = result;
                vtResult.relations[key]!.cursor = result.meta?.cursor || null;
            } else if (result?.message) {
                vtResult.relations[key]!.data = null;
                vtResult.relations[key]!.error = result.message;
            }
        } catch (e) {
            console.error(`Error fetching ${label} for ${ip}:`, e);
            vtResult.relations[key]!.error = `Error fetching ${label}: ${e}`;
        } finally {
            vtResult.relations[key]!.loading = false;
            this.vtResultsByIp.set(ip, vtResult);
        }
    }

    // Appends the next page of results for any relation type.
    // fetchData is the same VT service method, called this time with the cursor.
    private async loadMoreIpRelation(
        ip: string,
        key: IpRelationKey,
        label: string,
        fetchData: (ip: string, limit: number, cursor?: string | null) => Promise<any>
    ): Promise<void> {
        const vtResult = this.vtResultsByIp.get(ip);
        if (!vtResult?.relations?.[key]?.cursor) return;

        vtResult.relations[key]!.loadingMore = true;
        this.vtResultsByIp.set(ip, vtResult);

        try {
            const result: any = await fetchData(ip, 40, vtResult.relations[key]!.cursor);
            if (result?.data) {
                vtResult.relations[key]!.data.data = [...vtResult.relations[key]!.data.data, ...result.data];
                vtResult.relations[key]!.cursor = result.meta?.cursor || null;
            }
        } catch (e) {
            console.error(`Error fetching more ${label} for ${ip}:`, e);
            vtResult.relations[key]!.error = `Error fetching more ${label}: ${e}`;
        } finally {
            vtResult.relations[key]!.loadingMore = false;
            this.vtResultsByIp.set(ip, vtResult);
        }
    }

    // ─── Resolutions ──────────────────────────────────────────────────────────

    async loadIpResolutions(ip: string): Promise<void> {
        await this.loadIpRelation(ip, 'resolutions', 'resolutions', (ip, limit, cursor) =>
            this.vtSearchService.postVtIpResolutions(ip, limit, cursor)
        );
        this.convertResolutionsToStixObjects(ip);
    }

    async loadMoreIpResolutions(ip: string): Promise<void> {
        await this.loadMoreIpRelation(ip, 'resolutions', 'resolutions', (ip, limit, cursor) =>
            this.vtSearchService.postVtIpResolutions(ip, limit, cursor)
        );
        this.convertResolutionsToStixObjects(ip);
    }

    async loadAllIpRelations(ip: string): Promise<void> {
        await Promise.all([
            this.loadIpResolutions(ip),
            this.loadIpCommunicatingFiles(ip),
            this.loadIpReferrerFiles(ip),
            this.loadIpHistoricalWhois(ip),
            this.loadIpHistoricalSslCerts(ip),
        ]);
    }

    onIpRelationsTabClick(ip: string): void {
        this.setIpResultTab(ip, 'relations');
        this.loadAllIpRelations(ip);
    }

    getIpResolutions(ip: string): any[] {
        return this.getRelation(ip, 'resolutions')?.data?.data ?? [];
    }
    getIpResolutionsMeta(ip: string): any {
        return this.vtResultsByIp.get(ip)?.relations?.resolutions?.data?.meta || null;
    }
    isResolutionsLoading(ip: string): boolean {
        return this.getRelation(ip, 'resolutions')?.loading ?? false;
    }
    getResolutionsError(ip: string): string | undefined {
        return this.getRelation(ip, 'resolutions')?.error;
    }
    hasMoreResolutions(ip: string): boolean {
        return !!this.getRelation(ip, 'resolutions')?.cursor;
    }
    isResolutionsLoadingMore(ip: string): boolean {
        return this.getRelation(ip, 'resolutions')?.loadingMore ?? false;
    }

    formatResolutionDate(timestamp: number): string {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // ─── Communicating Files ──────────────────────────────────────────────────

    async loadIpCommunicatingFiles(ip: string): Promise<void> {
        return this.loadIpRelation(ip, 'communicatingFiles', 'communicating files', (ip, limit, cursor) =>
            this.vtSearchService.postVtIpCommunicatingFiles(ip, limit, cursor)
        );
    }

    async loadMoreIpCommunicatingFiles(ip: string): Promise<void> {
        return this.loadMoreIpRelation(ip, 'communicatingFiles', 'communicating files', (ip, limit, cursor) =>
            this.vtSearchService.postVtIpCommunicatingFiles(ip, limit, cursor)
        );
    }

    getIpCommunicatingFiles(ip: string): any[] {
        return this.getRelation(ip, 'communicatingFiles')?.data?.data ?? [];
    }
    isCommunicatingFilesLoading(ip: string): boolean {
        return this.getRelation(ip, 'communicatingFiles')?.loading ?? false;
    }
    getCommunicatingFilesError(ip: string): string | undefined {
        return this.getRelation(ip, 'communicatingFiles')?.error;
    }
    hasMoreCommunicatingFiles(ip: string): boolean {
        return !!this.getRelation(ip, 'communicatingFiles')?.cursor;
    }
    isCommunicatingFilesLoadingMore(ip: string): boolean {
        return this.getRelation(ip, 'communicatingFiles')?.loadingMore ?? false;
    }

    // ─── Referrer Files ───────────────────────────────────────────────────────

    async loadIpReferrerFiles(ip: string): Promise<void> {
        return this.loadIpRelation(ip, 'referrerFiles', 'referrer files', (ip, limit, cursor) =>
            this.vtSearchService.postVtIpReferrerFiles(ip, limit, cursor)
        );
    }

    async loadMoreIpReferrerFiles(ip: string): Promise<void> {
        return this.loadMoreIpRelation(ip, 'referrerFiles', 'referrer files', (ip, limit, cursor) =>
            this.vtSearchService.postVtIpReferrerFiles(ip, limit, cursor)
        );
    }

    getIpReferrerFiles(ip: string): any[] {
        return this.getRelation(ip, 'referrerFiles')?.data?.data ?? [];
    }
    isReferrerFilesLoading(ip: string): boolean {
        return this.getRelation(ip, 'referrerFiles')?.loading ?? false;
    }
    getReferrerFilesError(ip: string): string | undefined {
        return this.getRelation(ip, 'referrerFiles')?.error;
    }
    hasMoreReferrerFiles(ip: string): boolean {
        return !!this.getRelation(ip, 'referrerFiles')?.cursor;
    }
    isReferrerFilesLoadingMore(ip: string): boolean {
        return this.getRelation(ip, 'referrerFiles')?.loadingMore ?? false;
    }

    // ─── Historical WHOIS ─────────────────────────────────────────────────────

    async loadIpHistoricalWhois(ip: string): Promise<void> {
        return this.loadIpRelation(ip, 'historicalWhois', 'historical WHOIS', (ip, limit, cursor) =>
            this.vtSearchService.postVtIpHistoricalWhois(ip, limit, cursor)
        );
    }

    async loadMoreIpHistoricalWhois(ip: string): Promise<void> {
        return this.loadMoreIpRelation(ip, 'historicalWhois', 'historical WHOIS', (ip, limit, cursor) =>
            this.vtSearchService.postVtIpHistoricalWhois(ip, limit, cursor)
        );
    }

    getIpHistoricalWhois(ip: string): any[] {
        return this.getRelation(ip, 'historicalWhois')?.data?.data ?? [];
    }
    isHistoricalWhoisLoading(ip: string): boolean {
        return this.getRelation(ip, 'historicalWhois')?.loading ?? false;
    }
    getHistoricalWhoisError(ip: string): string | undefined {
        return this.getRelation(ip, 'historicalWhois')?.error;
    }
    hasMoreHistoricalWhois(ip: string): boolean {
        return !!this.getRelation(ip, 'historicalWhois')?.cursor;
    }
    isHistoricalWhoisLoadingMore(ip: string): boolean {
        return this.getRelation(ip, 'historicalWhois')?.loadingMore ?? false;
    }

    toggleWhoisRecord(id: string): void {
        if (this.expandedWhoisRecords.has(id)) {
            this.expandedWhoisRecords.delete(id);
        } else {
            this.expandedWhoisRecords.add(id);
        }
    }

    isWhoisRecordExpanded(id: string): boolean {
        return this.expandedWhoisRecords.has(id);
    }

    getWhoisOrganization(record: any): string {
        const map = record.attributes?.whois_map || {};
        return map['org-name'] || map['OrgName'] || map['descr'] || map['Organization'] || map['organisation'] || '';
    }

    getWhoisEmail(record: any): string {
        const map = record.attributes?.whois_map || {};
        return map['OrgAbuseEmail'] || map['abuse-mailbox'] || map['OrgTechEmail'] || map['e-mail'] || map['Email'] || '';
    }

    getWhoisRawText(record: any): string {
        const map = record.attributes?.whois_map;
        if (!map) return '';
        return Object.entries(map)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
    }

    // ─── Historical SSL Certs ─────────────────────────────────────────────────

    async loadIpHistoricalSslCerts(ip: string): Promise<void> {
        return this.loadIpRelation(ip, 'historicalSslCerts', 'historical SSL certs', (ip, limit, cursor) =>
            this.vtSearchService.postVtIpHistoricalSslCerts(ip, limit, cursor)
        );
    }

    async loadMoreIpHistoricalSslCerts(ip: string): Promise<void> {
        return this.loadMoreIpRelation(ip, 'historicalSslCerts', 'historical SSL certs', (ip, limit, cursor) =>
            this.vtSearchService.postVtIpHistoricalSslCerts(ip, limit, cursor)
        );
    }

    getIpHistoricalSslCerts(ip: string): any[] {
        return this.getRelation(ip, 'historicalSslCerts')?.data?.data ?? [];
    }
    isHistoricalSslCertsLoading(ip: string): boolean {
        return this.getRelation(ip, 'historicalSslCerts')?.loading ?? false;
    }
    getHistoricalSslCertsError(ip: string): string | undefined {
        return this.getRelation(ip, 'historicalSslCerts')?.error;
    }
    hasMoreHistoricalSslCerts(ip: string): boolean {
        return !!this.getRelation(ip, 'historicalSslCerts')?.cursor;
    }
    isHistoricalSslCertsLoadingMore(ip: string): boolean {
        return this.getRelation(ip, 'historicalSslCerts')?.loadingMore ?? false;
    }

    isIpIncluded(ip: string): boolean {
        return this.ipIncluded.get(ip) ?? true;
    }

    toggleIpIncluded(ip: string): void {
        const currentlyIncluded = this.isIpIncluded(ip);
        if (currentlyIncluded) {
            this.ipIncluded.set(ip, false);
            const idsToRemove = this.ipStixObjectIds.get(ip) || [];
            const removedObjs = this.allObjects.filter((o) => idsToRemove.includes(o.id));
            this.ipExcludedObjectsStore.set(ip, removedObjs);
            this.allObjects = this.allObjects.filter((o) => !idsToRemove.includes(o.id));
            for (const type of Object.keys(this.parsedObjects)) {
                this.parsedObjects[type] = this.parsedObjects[type].filter((o: any) => !idsToRemove.includes(o.id));
                if (this.parsedObjects[type].length === 0) delete this.parsedObjects[type];
            }
        } else {
            this.ipIncluded.set(ip, true);
            const toRestore = this.ipExcludedObjectsStore.get(ip) || [];
            for (const obj of toRestore) {
                this.allObjects.push(obj);
                if (!this.parsedObjects[obj.type]) this.parsedObjects[obj.type] = [];
                this.parsedObjects[obj.type].push(obj);
            }
            this.ipExcludedObjectsStore.delete(ip);
        }
    }

    isHashIncluded(hash: string): boolean {
        return this.hashIncluded.get(hash) ?? true;
    }

    toggleHashIncluded(hash: string): void {
        const currentlyIncluded = this.isHashIncluded(hash);
        if (currentlyIncluded) {
            this.hashIncluded.set(hash, false);
            const idsToRemove = this.hashStixObjectIds.get(hash) || [];
            const removedObjs = this.allObjects.filter((o) => idsToRemove.includes(o.id));
            this.hashExcludedObjectsStore.set(hash, removedObjs);
            this.allObjects = this.allObjects.filter((o) => !idsToRemove.includes(o.id));
            for (const type of Object.keys(this.parsedObjects)) {
                this.parsedObjects[type] = this.parsedObjects[type].filter((o: any) => !idsToRemove.includes(o.id));
                if (this.parsedObjects[type].length === 0) delete this.parsedObjects[type];
            }
        } else {
            this.hashIncluded.set(hash, true);
            const toRestore = this.hashExcludedObjectsStore.get(hash) || [];
            for (const obj of toRestore) {
                this.allObjects.push(obj);
                if (!this.parsedObjects[obj.type]) this.parsedObjects[obj.type] = [];
                this.parsedObjects[obj.type].push(obj);
            }
            this.hashExcludedObjectsStore.delete(hash);
        }
    }

    // ─── Domain Relation Loading ──────────────────────────────────────────────

    private getDomainRelation(domain: string, key: DomainRelationKey): any {
        return this.vtResultsByDomain.get(domain)?.relations?.[key];
    }

    private readonly allDomainRelationKeys: DomainRelationKey[] = [
        'resolutions',
        'subdomains',
        'communicatingFiles',
        'referrerFiles',
        'historicalWhois',
        'historicalSslCerts',
    ];

    isDomainRelationsTabLoading(domain: string): boolean {
        return this.allDomainRelationKeys.some((key) => this.getDomainRelation(domain, key)?.loading ?? true);
    }

    private async loadDomainRelation(
        domain: string,
        key: DomainRelationKey,
        label: string,
        fetchData: (domain: string, limit: number, cursor?: string | null) => Promise<any>
    ): Promise<void> {
        const vtResult = this.vtResultsByDomain.get(domain);
        if (!vtResult) return;
        if (!vtResult.relations) vtResult.relations = {};
        if (vtResult.relations[key]?.data !== undefined) return;

        vtResult.relations[key] = { data: null, loading: true, loadingMore: false, cursor: null };
        this.vtResultsByDomain.set(domain, vtResult);

        try {
            const result: any = await fetchData(domain, 40);
            if (result?.data) {
                vtResult.relations[key]!.data = result;
                vtResult.relations[key]!.cursor = result.meta?.cursor || null;
            } else if (result?.message) {
                vtResult.relations[key]!.data = null;
                vtResult.relations[key]!.error = result.message;
            }
        } catch (e) {
            console.error(`Error fetching ${label} for ${domain}:`, e);
            vtResult.relations[key]!.error = `Error fetching ${label}: ${e}`;
        } finally {
            vtResult.relations[key]!.loading = false;
            this.vtResultsByDomain.set(domain, vtResult);
        }
    }

    private async loadMoreDomainRelation(
        domain: string,
        key: DomainRelationKey,
        label: string,
        fetchData: (domain: string, limit: number, cursor?: string | null) => Promise<any>
    ): Promise<void> {
        const vtResult = this.vtResultsByDomain.get(domain);
        if (!vtResult?.relations?.[key]?.cursor) return;

        vtResult.relations[key]!.loadingMore = true;
        this.vtResultsByDomain.set(domain, vtResult);

        try {
            const result: any = await fetchData(domain, 40, vtResult.relations[key]!.cursor);
            if (result?.data) {
                vtResult.relations[key]!.data.data = [...vtResult.relations[key]!.data.data, ...result.data];
                vtResult.relations[key]!.cursor = result.meta?.cursor || null;
            }
        } catch (e) {
            console.error(`Error fetching more ${label} for ${domain}:`, e);
            vtResult.relations[key]!.error = `Error fetching more ${label}: ${e}`;
        } finally {
            vtResult.relations[key]!.loadingMore = false;
            this.vtResultsByDomain.set(domain, vtResult);
        }
    }

    // Domain Resolutions
    async loadDomainResolutions(domain: string): Promise<void> {
        await this.loadDomainRelation(domain, 'resolutions', 'resolutions', (d, limit, cursor) =>
            this.vtSearchService.postVtDomainResolutions(d, limit, cursor)
        );
        this.convertDomainResolutionsToStixObjects(domain);
    }
    async loadMoreDomainResolutions(domain: string): Promise<void> {
        await this.loadMoreDomainRelation(domain, 'resolutions', 'resolutions', (d, limit, cursor) =>
            this.vtSearchService.postVtDomainResolutions(d, limit, cursor)
        );
        this.convertDomainResolutionsToStixObjects(domain);
    }
    getDomainResolutions(domain: string): any[] {
        return this.getDomainRelation(domain, 'resolutions')?.data?.data ?? [];
    }
    isDomainResolutionsLoading(domain: string): boolean {
        return this.getDomainRelation(domain, 'resolutions')?.loading ?? false;
    }
    getDomainResolutionsError(domain: string): string | undefined {
        return this.getDomainRelation(domain, 'resolutions')?.error;
    }
    hasMoreDomainResolutions(domain: string): boolean {
        return !!this.getDomainRelation(domain, 'resolutions')?.cursor;
    }
    isDomainResolutionsLoadingMore(domain: string): boolean {
        return this.getDomainRelation(domain, 'resolutions')?.loadingMore ?? false;
    }

    // Domain Subdomains
    async loadDomainSubdomains(domain: string): Promise<void> {
        return this.loadDomainRelation(domain, 'subdomains', 'subdomains', (d, limit, cursor) =>
            this.vtSearchService.postVtDomainSubdomains(d, limit, cursor)
        );
    }
    async loadMoreDomainSubdomains(domain: string): Promise<void> {
        return this.loadMoreDomainRelation(domain, 'subdomains', 'subdomains', (d, limit, cursor) =>
            this.vtSearchService.postVtDomainSubdomains(d, limit, cursor)
        );
    }
    getDomainSubdomains(domain: string): any[] {
        return this.getDomainRelation(domain, 'subdomains')?.data?.data ?? [];
    }
    isDomainSubdomainsLoading(domain: string): boolean {
        return this.getDomainRelation(domain, 'subdomains')?.loading ?? false;
    }
    getDomainSubdomainsError(domain: string): string | undefined {
        return this.getDomainRelation(domain, 'subdomains')?.error;
    }
    hasMoreDomainSubdomains(domain: string): boolean {
        return !!this.getDomainRelation(domain, 'subdomains')?.cursor;
    }
    isDomainSubdomainsLoadingMore(domain: string): boolean {
        return this.getDomainRelation(domain, 'subdomains')?.loadingMore ?? false;
    }

    // Domain Communicating Files
    async loadDomainCommunicatingFiles(domain: string): Promise<void> {
        await this.loadDomainRelation(domain, 'communicatingFiles', 'communicating files', (d, limit, cursor) =>
            this.vtSearchService.postVtDomainCommunicatingFiles(d, limit, cursor)
        );
        this.convertDomainCommunicatingFilesToStixObjects(domain);
    }
    async loadMoreDomainCommunicatingFiles(domain: string): Promise<void> {
        await this.loadMoreDomainRelation(domain, 'communicatingFiles', 'communicating files', (d, limit, cursor) =>
            this.vtSearchService.postVtDomainCommunicatingFiles(d, limit, cursor)
        );
        this.convertDomainCommunicatingFilesToStixObjects(domain);
    }
    getDomainCommunicatingFiles(domain: string): any[] {
        return this.getDomainRelation(domain, 'communicatingFiles')?.data?.data ?? [];
    }
    isDomainCommunicatingFilesLoading(domain: string): boolean {
        return this.getDomainRelation(domain, 'communicatingFiles')?.loading ?? false;
    }
    getDomainCommunicatingFilesError(domain: string): string | undefined {
        return this.getDomainRelation(domain, 'communicatingFiles')?.error;
    }
    hasMoreDomainCommunicatingFiles(domain: string): boolean {
        return !!this.getDomainRelation(domain, 'communicatingFiles')?.cursor;
    }
    isDomainCommunicatingFilesLoadingMore(domain: string): boolean {
        return this.getDomainRelation(domain, 'communicatingFiles')?.loadingMore ?? false;
    }

    // Domain Referrer Files
    async loadDomainReferrerFiles(domain: string): Promise<void> {
        return this.loadDomainRelation(domain, 'referrerFiles', 'referrer files', (d, limit, cursor) =>
            this.vtSearchService.postVtDomainReferrerFiles(d, limit, cursor)
        );
    }
    async loadMoreDomainReferrerFiles(domain: string): Promise<void> {
        return this.loadMoreDomainRelation(domain, 'referrerFiles', 'referrer files', (d, limit, cursor) =>
            this.vtSearchService.postVtDomainReferrerFiles(d, limit, cursor)
        );
    }
    getDomainReferrerFiles(domain: string): any[] {
        return this.getDomainRelation(domain, 'referrerFiles')?.data?.data ?? [];
    }
    isDomainReferrerFilesLoading(domain: string): boolean {
        return this.getDomainRelation(domain, 'referrerFiles')?.loading ?? false;
    }
    getDomainReferrerFilesError(domain: string): string | undefined {
        return this.getDomainRelation(domain, 'referrerFiles')?.error;
    }
    hasMoreDomainReferrerFiles(domain: string): boolean {
        return !!this.getDomainRelation(domain, 'referrerFiles')?.cursor;
    }
    isDomainReferrerFilesLoadingMore(domain: string): boolean {
        return this.getDomainRelation(domain, 'referrerFiles')?.loadingMore ?? false;
    }

    // Domain Historical WHOIS
    async loadDomainHistoricalWhois(domain: string): Promise<void> {
        return this.loadDomainRelation(domain, 'historicalWhois', 'historical WHOIS', (d, limit, cursor) =>
            this.vtSearchService.postVtDomainHistoricalWhois(d, limit, cursor)
        );
    }
    async loadMoreDomainHistoricalWhois(domain: string): Promise<void> {
        return this.loadMoreDomainRelation(domain, 'historicalWhois', 'historical WHOIS', (d, limit, cursor) =>
            this.vtSearchService.postVtDomainHistoricalWhois(d, limit, cursor)
        );
    }
    getDomainHistoricalWhois(domain: string): any[] {
        return this.getDomainRelation(domain, 'historicalWhois')?.data?.data ?? [];
    }
    isDomainHistoricalWhoisLoading(domain: string): boolean {
        return this.getDomainRelation(domain, 'historicalWhois')?.loading ?? false;
    }
    getDomainHistoricalWhoisError(domain: string): string | undefined {
        return this.getDomainRelation(domain, 'historicalWhois')?.error;
    }
    hasMoreDomainHistoricalWhois(domain: string): boolean {
        return !!this.getDomainRelation(domain, 'historicalWhois')?.cursor;
    }
    isDomainHistoricalWhoisLoadingMore(domain: string): boolean {
        return this.getDomainRelation(domain, 'historicalWhois')?.loadingMore ?? false;
    }

    // Domain Historical SSL Certs
    async loadDomainHistoricalSslCerts(domain: string): Promise<void> {
        return this.loadDomainRelation(domain, 'historicalSslCerts', 'historical SSL certs', (d, limit, cursor) =>
            this.vtSearchService.postVtDomainHistoricalSslCerts(d, limit, cursor)
        );
    }
    async loadMoreDomainHistoricalSslCerts(domain: string): Promise<void> {
        return this.loadMoreDomainRelation(domain, 'historicalSslCerts', 'historical SSL certs', (d, limit, cursor) =>
            this.vtSearchService.postVtDomainHistoricalSslCerts(d, limit, cursor)
        );
    }
    getDomainHistoricalSslCerts(domain: string): any[] {
        return this.getDomainRelation(domain, 'historicalSslCerts')?.data?.data ?? [];
    }
    isDomainHistoricalSslCertsLoading(domain: string): boolean {
        return this.getDomainRelation(domain, 'historicalSslCerts')?.loading ?? false;
    }
    getDomainHistoricalSslCertsError(domain: string): string | undefined {
        return this.getDomainRelation(domain, 'historicalSslCerts')?.error;
    }
    hasMoreDomainHistoricalSslCerts(domain: string): boolean {
        return !!this.getDomainRelation(domain, 'historicalSslCerts')?.cursor;
    }
    isDomainHistoricalSslCertsLoadingMore(domain: string): boolean {
        return this.getDomainRelation(domain, 'historicalSslCerts')?.loadingMore ?? false;
    }

    async loadAllDomainRelations(domain: string): Promise<void> {
        await Promise.all([
            this.loadDomainResolutions(domain),
            this.loadDomainSubdomains(domain),
            this.loadDomainCommunicatingFiles(domain),
            this.loadDomainReferrerFiles(domain),
            this.loadDomainHistoricalWhois(domain),
            this.loadDomainHistoricalSslCerts(domain),
        ]);
    }

    onDomainRelationsTabClick(domain: string): void {
        this.setDomainResultTab(domain, 'relations');
    }

    // ─── Domain Tab & Expansion ─────────────────────────────────────────────

    getDomainsWithResults(): string[] {
        return Array.from(this.vtResultsByDomain.keys());
    }
    getVtResultForDomain(domain: string): any {
        return this.vtResultsByDomain.get(domain);
    }

    toggleDomainExpansion(domain: string): void {
        if (this.expandedDomains.has(domain)) {
            this.expandedDomains.delete(domain);
        } else {
            this.expandedDomains.add(domain);
        }
    }
    isDomainExpanded(domain: string): boolean {
        return this.expandedDomains.has(domain);
    }

    setDomainResultTab(domain: string, tab: string): void {
        this.domainResultTabs.set(domain, tab);
    }
    getDomainResultTab(domain: string): string {
        return this.domainResultTabs.get(domain) || 'detection';
    }

    // ─── Domain Include/Exclude ─────────────────────────────────────────────

    isDomainIncluded(domain: string): boolean {
        return this.domainIncluded.get(domain) ?? true;
    }

    toggleDomainIncluded(domain: string): void {
        const currentlyIncluded = this.isDomainIncluded(domain);
        if (currentlyIncluded) {
            this.domainIncluded.set(domain, false);
            const idsToRemove = this.domainStixObjectIds.get(domain) || [];
            const removedObjs = this.allObjects.filter((o) => idsToRemove.includes(o.id));
            this.domainExcludedObjectsStore.set(domain, removedObjs);
            this.allObjects = this.allObjects.filter((o) => !idsToRemove.includes(o.id));
            for (const type of Object.keys(this.parsedObjects)) {
                this.parsedObjects[type] = this.parsedObjects[type].filter((o: any) => !idsToRemove.includes(o.id));
                if (this.parsedObjects[type].length === 0) delete this.parsedObjects[type];
            }
        } else {
            this.domainIncluded.set(domain, true);
            const toRestore = this.domainExcludedObjectsStore.get(domain) || [];
            for (const obj of toRestore) {
                this.allObjects.push(obj);
                if (!this.parsedObjects[obj.type]) this.parsedObjects[obj.type] = [];
                this.parsedObjects[obj.type].push(obj);
            }
            this.domainExcludedObjectsStore.delete(domain);
        }
    }

    // ─── Domain Display Helpers ─────────────────────────────────────────────

    getDomainDetectionResults(domain: string): any[] {
        const vtResult = this.vtResultsByDomain.get(domain);
        if (!vtResult?.domainResult?.data?.attributes?.last_analysis_results) return [];
        const results = vtResult.domainResult.data.attributes.last_analysis_results;
        return Object.entries(results)
            .map(([engine, data]: [string, any]) => ({ engine, ...data }))
            .sort((a, b) => {
                const order: any = { malicious: 0, suspicious: 1, harmless: 2, undetected: 3 };
                return (order[a.category] ?? 4) - (order[b.category] ?? 4);
            });
    }

    getDomainCategories(domain: string): { vendor: string; category: string }[] {
        const vtResult = this.vtResultsByDomain.get(domain);
        const cats = vtResult?.domainResult?.data?.attributes?.categories;
        if (!cats) return [];
        return Object.entries(cats).map(([vendor, category]: [string, any]) => ({ vendor, category }));
    }

    getDomainPopularityRanks(domain: string): { source: string; rank: number }[] {
        const vtResult = this.vtResultsByDomain.get(domain);
        const ranks = vtResult?.domainResult?.data?.attributes?.popularity_ranks;
        if (!ranks) return [];
        return Object.entries(ranks).map(([source, data]: [string, any]) => ({
            source,
            rank: data.rank,
        }));
    }

    getDomainDnsRecords(domain: string): any[] {
        const vtResult = this.vtResultsByDomain.get(domain);
        return vtResult?.domainResult?.data?.attributes?.last_dns_records ?? [];
    }

    getDomainWhois(domain: string): string {
        const vtResult = this.vtResultsByDomain.get(domain);
        return vtResult?.domainResult?.data?.attributes?.whois ?? '';
    }

    getDomainLastHttpsCertificate(domain: string): any {
        const vtResult = this.vtResultsByDomain.get(domain);
        return vtResult?.domainResult?.data?.attributes?.last_https_certificate ?? null;
    }

    // ─── URL Tab & Expansion ────────────────────────────────────────────────

    getUrlsWithResults(): string[] {
        return Array.from(this.vtResultsByUrl.keys());
    }
    getVtResultForUrl(url: string): any {
        return this.vtResultsByUrl.get(url);
    }

    toggleUrlExpansion(url: string): void {
        if (this.expandedUrls.has(url)) {
            this.expandedUrls.delete(url);
        } else {
            this.expandedUrls.add(url);
        }
    }
    isUrlExpanded(url: string): boolean {
        return this.expandedUrls.has(url);
    }

    setUrlResultTab(url: string, tab: string): void {
        this.urlResultTabs.set(url, tab);
    }
    getUrlResultTab(url: string): string {
        return this.urlResultTabs.get(url) || 'summary';
    }

    // ─── URL Include/Exclude ────────────────────────────────────────────────

    isUrlIncluded(url: string): boolean {
        return this.urlIncluded.get(url) ?? true;
    }

    toggleUrlIncluded(url: string): void {
        const currentlyIncluded = this.isUrlIncluded(url);
        if (currentlyIncluded) {
            this.urlIncluded.set(url, false);
            const idsToRemove = this.urlStixObjectIds.get(url) || [];
            const removedObjs = this.allObjects.filter((o) => idsToRemove.includes(o.id));
            this.urlExcludedObjectsStore.set(url, removedObjs);
            this.allObjects = this.allObjects.filter((o) => !idsToRemove.includes(o.id));
            for (const type of Object.keys(this.parsedObjects)) {
                this.parsedObjects[type] = this.parsedObjects[type].filter((o: any) => !idsToRemove.includes(o.id));
                if (this.parsedObjects[type].length === 0) delete this.parsedObjects[type];
            }
        } else {
            this.urlIncluded.set(url, true);
            const toRestore = this.urlExcludedObjectsStore.get(url) || [];
            for (const obj of toRestore) {
                this.allObjects.push(obj);
                if (!this.parsedObjects[obj.type]) this.parsedObjects[obj.type] = [];
                this.parsedObjects[obj.type].push(obj);
            }
            this.urlExcludedObjectsStore.delete(url);
        }
    }

    // ─── URL Relations (tier-agnostic; degrade to N/A when unavailable) ──────

    private getUrlRelation(url: string, key: UrlRelationKey): any {
        return this.vtResultsByUrl.get(url)?.relations?.[key];
    }

    private async loadUrlRelation(
        url: string,
        key: UrlRelationKey,
        label: string,
        fetchData: (url: string) => Promise<any>
    ): Promise<void> {
        const vtResult = this.vtResultsByUrl.get(url);
        if (!vtResult) return;
        if (!vtResult.relations) vtResult.relations = {};
        if (vtResult.relations[key]?.data !== undefined) return;

        vtResult.relations[key] = { data: null, loading: true, loadingMore: false, cursor: null };
        this.vtResultsByUrl.set(url, vtResult);

        try {
            const result: any = await fetchData(url);
            if (result?.data) {
                vtResult.relations[key]!.data = result;
                vtResult.relations[key]!.cursor = result.meta?.cursor || null;
            } else if (result?.message) {
                // Includes the Enterprise-gated 403 case surfaced by the server as a message.
                vtResult.relations[key]!.data = null;
                vtResult.relations[key]!.error = result.message;
            }
        } catch (e) {
            console.error(`Error fetching ${label} for ${url}:`, e);
            vtResult.relations[key]!.error = `Error fetching ${label}: ${e}`;
        } finally {
            vtResult.relations[key]!.loading = false;
            this.vtResultsByUrl.set(url, vtResult);
        }
    }

    async loadAllUrlRelations(url: string): Promise<void> {
        await Promise.all([
            this.loadUrlRelation(url, 'servingIp', 'serving IP', (u) => this.vtSearchService.postVtUrlServingIp(u)),
        ]);
        this.convertUrlServingIpToStixObjects(url);
    }

    // ─── URL Display Helpers ────────────────────────────────────────────────

    private getUrlAttributes(url: string): any {
        return this.vtResultsByUrl.get(url)?.urlResult?.data?.attributes ?? null;
    }

    getUrlDetectionResults(url: string): any[] {
        const attrs = this.getUrlAttributes(url);
        if (!attrs?.last_analysis_results) return [];
        return Object.entries(attrs.last_analysis_results)
            .map(([engine, data]: [string, any]) => ({ engine, ...data }))
            .sort((a, b) => {
                const order: any = { malicious: 0, suspicious: 1, harmless: 2, undetected: 3 };
                return (order[a.category] ?? 4) - (order[b.category] ?? 4);
            });
    }

    getUrlAnalysisStats(url: string): { malicious: number; suspicious: number; harmless: number; undetected: number; timeout: number } {
        const stats = this.getUrlAttributes(url)?.last_analysis_stats ?? {};
        return {
            malicious: stats.malicious ?? 0,
            suspicious: stats.suspicious ?? 0,
            harmless: stats.harmless ?? 0,
            undetected: stats.undetected ?? 0,
            timeout: stats.timeout ?? 0,
        };
    }
    getUrlMaliciousCount(url: string): number {
        return this.getUrlAnalysisStats(url).malicious;
    }
    getUrlTotalEngines(url: string): number {
        const s = this.getUrlAnalysisStats(url);
        return s.malicious + s.suspicious + s.harmless + s.undetected + s.timeout;
    }

    getUrlFinalUrl(url: string): string {
        return this.getUrlAttributes(url)?.last_final_url || url;
    }
    getUrlHostname(url: string): string {
        try {
            return new URL(this.getUrlFinalUrl(url)).hostname;
        } catch {
            return '';
        }
    }
    getUrlServingIp(url: string): string {
        const relData = this.getUrlRelation(url, 'servingIp')?.data?.data;
        return relData?.id || relData?.attributes?.ip_address || this.getUrlAttributes(url)?.last_serving_ip_address || '';
    }
    getUrlCountry(url: string): string {
        const servingCountry = this.getUrlRelation(url, 'servingIp')?.data?.data?.attributes?.country;
        return this.countryCodeToName(servingCountry || this.getUrlAttributes(url)?.proxy_country);
    }
    getUrlStatusCode(url: string): number | null {
        return this.getUrlAttributes(url)?.last_http_response_code ?? null;
    }
    getUrlTitle(url: string): string {
        return this.getUrlAttributes(url)?.title || '';
    }

    getUrlCategories(url: string): { vendor: string; category: string }[] {
        const cats = this.getUrlAttributes(url)?.categories;
        if (!cats) return [];
        return Object.entries(cats).map(([vendor, category]: [string, any]) => ({ vendor, category }));
    }
    getUrlCategoryValues(url: string): string[] {
        return [...new Set(this.getUrlCategories(url).map((c) => c.category))];
    }
    getUrlTags(url: string): string[] {
        return this.getUrlAttributes(url)?.tags ?? [];
    }

    getUrlHtmlMeta(url: string): { name: string; value: string }[] {
        const meta = this.getUrlAttributes(url)?.html_meta;
        if (!meta) return [];
        return Object.entries(meta).map(([name, values]: [string, any]) => ({
            name,
            value: Array.isArray(values) ? values.join(', ') : String(values),
        }));
    }
    getUrlTrackers(url: string): string[] {
        const trackers = this.getUrlAttributes(url)?.trackers;
        return trackers ? Object.keys(trackers) : [];
    }

    getUrlFirstSubmission(url: string): number | null {
        return this.getUrlAttributes(url)?.first_submission_date ?? null;
    }
    getUrlLastSubmission(url: string): number | null {
        return this.getUrlAttributes(url)?.last_submission_date ?? null;
    }
    getUrlLastAnalysis(url: string): number | null {
        return this.getUrlAttributes(url)?.last_analysis_date ?? null;
    }

    formatVtTimestampUtc(timestamp: number | null | undefined): string {
        if (!timestamp) return 'N/A';
        return new Date(timestamp * 1000)
            .toISOString()
            .replace('T', ' ')
            .replace(/\.\d{3}Z$/, ' UTC');
    }

    getUrlResponseHeaders(url: string): { name: string; value: string }[] {
        const headers = this.getUrlAttributes(url)?.last_http_response_headers;
        if (!headers) return [];
        return Object.entries(headers).map(([name, value]: [string, any]) => ({ name, value: String(value) }));
    }
    getUrlBodyLength(url: string): number | null {
        return this.getUrlAttributes(url)?.last_http_response_content_length ?? null;
    }
    getUrlResponseSizeDisplay(url: string): string {
        const len = this.getUrlBodyLength(url);
        return len === null ? 'N/A' : this.formatFileSize(len);
    }

    getUrlWebTechnologies(url: string): { technology: string; version: string }[] {
        const raw = this.getUrlAttributes(url)?.['web_technologies'];
        if (!raw) return [];
        const out: { technology: string; version: string }[] = [];
        for (const [technology, entries] of Object.entries(raw as Record<string, any>)) {
            const versions = Array.isArray(entries) ? entries : [entries];
            const version = versions
                .map((e: any) => e?.version)
                .filter(Boolean)
                .join(', ');
            out.push({ technology, version: version || '-' });
        }
        return out;
    }

    getUrlCookieCount(url: string): number {
        const cookies = this.getUrlAttributes(url)?.last_http_response_cookies;
        return cookies ? Object.keys(cookies).length : 0;
    }

    getUrlJavascriptVariables(url: string): { name: string; type: string; value: string }[] {
        const vars = this.getUrlAttributes(url)?.javascript_variables;
        if (!Array.isArray(vars)) return [];
        return vars.map((v: any) => ({
            name: v?.name ?? '-',
            type: v?.type ?? '-',
            value: v?.value == null ? '-' : String(v.value),
        }));
    }

    getUrlHttpTransactions(
        url: string
    ): { url: string; status: number | null; contentType: string; malicious: number; total: number; date: number | null }[] {
        const attrs = this.getUrlAttributes(url);
        if (!attrs) return [];
        const headers = attrs.last_http_response_headers ?? {};
        return [
            {
                url: this.getUrlFinalUrl(url),
                status: attrs.last_http_response_code ?? null,
                contentType: headers['content-type'] || headers['Content-Type'] || '',
                malicious: this.getUrlMaliciousCount(url),
                total: this.getUrlTotalEngines(url),
                date: attrs.last_analysis_date ?? null,
            },
        ];
    }

    getUrlConsoleMessages(url: string): { sourceFile: string; source: string; level: string; message: string }[] {
        const msgs = this.getUrlAttributes(url)?.console_messages;
        if (!Array.isArray(msgs)) return [];
        return msgs.map((m: any) => ({
            sourceFile: m?.source_file ?? '',
            source: 'Javascript',
            level: (m?.level ?? '').replace('LOG_LEVEL_', '').toLowerCase() || '-',
            message: m?.content ?? '',
        }));
    }
    consoleLevelBadgeClass(level: string): string {
        switch (level) {
            case 'error':
                return 'bg-danger';
            case 'warning':
                return 'bg-warning text-dark';
            default:
                return 'bg-secondary';
        }
    }

    getHashType(hash: string): string {
        const length = hash.length;
        switch (length) {
            case 32:
                return 'MD5';
            case 40:
                return 'SHA-1';
            case 64:
                return 'SHA-256';
            case 128:
                return 'SHA-512';
            default:
                return 'Hash';
        }
    }

    // ─── Intel Summary ───────────────────────────────────────────────────────

    private countryCodeToName(code?: string): string {
        if (!code) return '';
        const entry = COUNTRIES.find((c) => c.key === code.toUpperCase());
        return entry ? entry.value : code;
    }

    getIntelSummaryText(): string {
        const lines: string[] = [];

        for (const ip of this.getIpsWithResults()) {
            const vtResult = this.getVtResultForIp(ip);
            if (!vtResult?.hasData) continue;
            const attrs = vtResult.ipResult?.data?.attributes;

            const maliciousCount = attrs?.last_analysis_stats?.malicious || 0;
            let vendorNote = '';
            if (maliciousCount > 0) {
                vendorNote = `flagged as malicious by ${maliciousCount} third party security vendor${maliciousCount !== 1 ? 's' : ''}`;
            } else if (attrs?.last_analysis_stats) {
                vendorNote = 'not flagged as malicious by third party security vendors';
            }

            lines.push(`IP Address: ${ip}`);
            lines.push(`Geolocation: ${this.countryCodeToName(attrs?.country) || 'N/A'}`);
            lines.push(`Organization: ${attrs?.as_owner || ''}`);
            lines.push(`Domains Hosted:`);
            lines.push(`pDNS Resolutions:`);
            lines.push(`JARM fingerprint: ${attrs?.jarm || 'N/A'}`);
            lines.push(`Activity: ${vendorNote}`);
            lines.push('');
        }

        for (const domain of this.getDomainsWithResults()) {
            const vtResult = this.getVtResultForDomain(domain);
            if (!vtResult?.hasData) continue;
            const attrs = vtResult.domainResult?.data?.attributes;

            const maliciousCount = attrs?.last_analysis_stats?.malicious || 0;
            let vendorNote = '';
            if (maliciousCount > 0) {
                vendorNote = `flagged as malicious by ${maliciousCount} third party security vendor${maliciousCount !== 1 ? 's' : ''}`;
            } else if (attrs?.last_analysis_stats) {
                vendorNote = 'not flagged as malicious by third party security vendors';
            }

            const aRecords = (attrs?.last_dns_records ?? [])
                .filter((r: any) => r.type === 'A')
                .map((r: any) => r.value)
                .join(', ');

            lines.push(`Domain: ${domain}`);
            lines.push(`Host IP: ${aRecords}`);
            lines.push(`Created Date: ${this.formatResolutionDate(attrs?.creation_date)}`);
            lines.push(`Registrant: ${attrs?.registrar || ''}`);
            lines.push(`JARM Fingerprint: ${attrs?.jarm || 'N/A'}`);
            lines.push(`Activity: ${vendorNote}`);
            lines.push('');
        }

        for (const url of this.getUrlsWithResults()) {
            const vtResult = this.getVtResultForUrl(url);
            if (!vtResult?.hasData) continue;

            const maliciousCount = this.getUrlMaliciousCount(url);
            let vendorNote = '';
            if (maliciousCount > 0) {
                vendorNote = `flagged as malicious by ${maliciousCount} third party security vendor${maliciousCount !== 1 ? 's' : ''}`;
            } else if (this.getUrlTotalEngines(url) > 0) {
                vendorNote = 'not flagged as malicious by third party security vendors';
            }

            lines.push(`URL: ${url}`);
            lines.push(`Geolocation: ${this.getUrlCountry(url) || 'N/A'}`);
            lines.push(`Organization: ${this.getUrlRelation(url, 'servingIp')?.data?.data?.attributes?.as_owner || ''}`);
            lines.push(`Domains Hosted:`);
            lines.push(`pDNS Resolutions:`);
            lines.push(`Activity: ${vendorNote}`);
            lines.push('');
        }

        for (const hash of this.getHashesWithResults()) {
            const vtResult = this.getVtResultForHash(hash);
            if (!vtResult?.hasData) continue;
            const attrs = vtResult.hashResult?.data?.attributes;

            const sha256 = attrs?.sha256 || hash;
            lines.push(`File: [SHA256: ${sha256.toUpperCase()}]`);
            const cleanedNames = this.cleanFilenames(attrs?.names || []);
            lines.push(`File Name: ${cleanedNames.join(', ') || ''}`);
            lines.push(`File Type: ${attrs?.type_description || attrs?.type_tags?.join(', ') || ''}`);

            const detections = this.getSortedDetections(hash);
            const maliciousResults = detections
                .filter((d) => this.getDetectionCategory(d.value?.result, d.value?.category) === 'malicious')
                .map((d) => d.value?.result)
                .filter((r) => r && r.toLowerCase() !== 'malicious');
            const uniqueDetections = [...new Set(maliciousResults)];
            lines.push(`Detection: ${uniqueDetections.join('; ')}`);

            const activityParts: string[] = [];
            const trustedOrg = attrs?.trusted_verdict?.organization;
            if (trustedOrg) {
                activityParts.push(`This file is published by a renown company (${trustedOrg})`);
            }
            const hashMaliciousCount = attrs?.last_analysis_stats?.malicious || 0;
            if (hashMaliciousCount > 0) {
                activityParts.push(`flagged as malicious by ${hashMaliciousCount} third party security vendor${hashMaliciousCount !== 1 ? 's' : ''}`);
            } else if (attrs?.last_analysis_stats) {
                activityParts.push('not flagged as malicious by security vendors');
            }
            lines.push(`Activity: ${activityParts.join(', ')}`);

            const sigmaOrder = ['critical', 'high', 'medium'];
            const sigmaRules = this.getSigmaRulesForHash(hash)
                .filter((r: any) => sigmaOrder.includes(r.rule_level?.toLowerCase()))
                .sort((a: any, b: any) => sigmaOrder.indexOf(a.rule_level?.toLowerCase()) - sigmaOrder.indexOf(b.rule_level?.toLowerCase()))
                .slice(0, 100);
            if (sigmaRules.length > 0) {
                lines.push(`Sigma Rules:`);
                for (const rule of sigmaRules) {
                    lines.push(`- ${rule.rule_title}`);
                }
            }

            const idsOrder = ['high', 'medium'];
            const idsRules = this.getIdsResultsForHash(hash)
                .filter((r: any) => idsOrder.includes(r.alert_severity?.toLowerCase()))
                .sort((a: any, b: any) => idsOrder.indexOf(a.alert_severity?.toLowerCase()) - idsOrder.indexOf(b.alert_severity?.toLowerCase()))
                .slice(0, 100);
            if (idsRules.length > 0) {
                lines.push(`IDS Rules:`);
                for (const rule of idsRules) {
                    lines.push(`- ${rule.rule_msg}`);
                }
            }

            lines.push('');
        }

        // Append aggregated Attack Patterns across all hashes
        const allTtps = this.getAllAggregatedTtps();
        if (allTtps.length > 0) {
            lines.push('');
            lines.push('Attack Patterns:');
            for (const tactic of allTtps) {
                for (const tech of tactic.techniques || []) {
                    lines.push(`${tactic.name} / ${tech.name} [${tech.id}] (ENT)`);
                }
            }
        }

        return lines.join('\n').trimEnd();
    }

    async copyIntelSummary(): Promise<void> {
        const text = this.getIntelSummaryText();
        try {
            await navigator.clipboard.writeText(text);
            this.announcementService.show('Copied', 'Intel summary copied to clipboard', 'success', false);
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.announcementService.show('Copied', 'Intel summary copied to clipboard', 'success', false);
        }
    }

    downloadByHash(hash: string, type: 'vt' | 'stix') {
        const files = [];

        if (type == 'vt') {
            const hashes = this.vtResultsByHash.get(hash);

            if (hashes?.hasData == false) return;

            const hashObject: any = {};

            if (hashes.hashResult?.data) {
                hashObject['Hash Result'] = hashes.hashResult.data;
            }

            if (hashes.ttpResult?.data) {
                hashObject['Hash TTP Result'] = hashes.ttpResult.data;
            }

            if (Object.keys(hashObject).length > 0) {
                files.push({
                    name: `${hash}.json`,
                    data: JSON.stringify(hashObject),
                });
            }
        } else if (type == 'stix') {
            const idsToAdd = this.hashStixObjectIds.get(hash) || [];

            const checkedObjects = this.allObjects.filter((o) => idsToAdd.includes(o.id));
            const uncheckedObjects = this.hashExcludedObjectsStore.get(hash) || [];

            const combinedObjects = [...checkedObjects, ...uncheckedObjects];

            const bundle = new Bundle(combinedObjects);
            bundle.id = `bundle--${v4()}`;

            files.push({
                name: `${hash}-stix.json`,
                data: JSON.stringify(bundle),
            });
        }

        if (files.length == 0) return;

        this.downloadFiles(files, hash);
    }

    async downloadByIp(ip: string, type: 'stix' | 'vt') {
        const files = [];

        if (type == 'vt') {
            const ips = this.vtResultsByIp.get(ip);
            const ipObj: any = {};

            if (ips?.hasData == false) return;

            if (ips.ipResult) ipObj['IP Result'] = ips.ipResult.data;

            while (
                ips.relations.communicatingFiles.loading ||
                ips.relations.historicalSslCerts.loading ||
                ips.relations.historicalWhois.loading ||
                ips.relations.referrerFiles.loading ||
                ips.relations.resolutions.loading
            ) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            if (ips.relations) {
                if (ips.relations.communicatingFiles.data) ipObj['Communicating Files'] = ips.relations.communicatingFiles.data;

                if (ips.relations.historicalSslCerts.data) ipObj['Historical SSL Certs'] = ips.relations.historicalSslCerts.data;

                if (ips.relations.historicalWhois.data) ipObj['Historical Whois'] = ips.relations.historicalWhois.data;

                if (ips.relations.referrerFiles.data) ipObj['Referral Files'] = ips.relations.referrerFiles.data;

                if (ips.relations.resolutions.data) ipObj['Resolutions'] = ips.relations.resolutions.data;
            }

            if (Object.keys(ipObj).length > 0)
                files.push({
                    name: `${ip}.json`,
                    data: JSON.stringify(ipObj),
                });
        } else if (type == 'stix') {
            const idsToAdd = this.ipStixObjectIds.get(ip) || [];

            const checkedObjects = this.allObjects.filter((o) => idsToAdd.includes(o.id));
            const uncheckedObjects = this.ipExcludedObjectsStore.get(ip) || [];

            const combinedObjects = [...checkedObjects, ...uncheckedObjects];

            const bundle = new Bundle(combinedObjects);
            bundle.id = `bundle--${v4()}`;

            files.push({
                name: `${ip}-stix.json`,
                data: JSON.stringify(bundle),
            });
        }

        if (files.length == 0) return;

        this.downloadFiles(files, ip);
    }

    async downloadByDomain(domain: string, type: 'stix' | 'vt') {
        const files = [];

        if (type == 'vt') {
            const domains = this.vtResultsByDomain.get(domain);
            if (domains?.hasData == false) return;

            const domainObj: any = {};
            if (domains.domainResult) domainObj['Domain Result'] = domains.domainResult.data;

            const relations = domains.relations;
            if (relations) {
                while (
                    relations.resolutions?.loading ||
                    relations.subdomains?.loading ||
                    relations.communicatingFiles?.loading ||
                    relations.referrerFiles?.loading ||
                    relations.historicalWhois?.loading ||
                    relations.historicalSslCerts?.loading
                ) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
                if (relations.resolutions?.data) domainObj['Resolutions'] = relations.resolutions.data;
                if (relations.subdomains?.data) domainObj['Subdomains'] = relations.subdomains.data;
                if (relations.communicatingFiles?.data) domainObj['Communicating Files'] = relations.communicatingFiles.data;
                if (relations.referrerFiles?.data) domainObj['Referral Files'] = relations.referrerFiles.data;
                if (relations.historicalWhois?.data) domainObj['Historical Whois'] = relations.historicalWhois.data;
                if (relations.historicalSslCerts?.data) domainObj['Historical SSL Certs'] = relations.historicalSslCerts.data;
            }

            if (Object.keys(domainObj).length > 0) files.push({ name: `${domain}.json`, data: JSON.stringify(domainObj) });
        } else if (type == 'stix') {
            const idsToAdd = this.domainStixObjectIds.get(domain) || [];
            const checkedObjects = this.allObjects.filter((o) => idsToAdd.includes(o.id));
            const uncheckedObjects = this.domainExcludedObjectsStore.get(domain) || [];
            const combinedObjects = [...checkedObjects, ...uncheckedObjects];
            const bundle = new Bundle(combinedObjects);
            bundle.id = `bundle--${v4()}`;
            files.push({ name: `${domain}-stix.json`, data: JSON.stringify(bundle) });
        }

        if (files.length == 0) return;
        this.downloadFiles(files, domain);
    }

    async downloadByUrl(url: string, type: 'stix' | 'vt') {
        const files = [];

        if (type == 'vt') {
            const urlResult = this.vtResultsByUrl.get(url);
            if (urlResult?.hasData == false) return;

            const urlObj: any = {};
            if (urlResult.urlResult) urlObj['URL Result'] = urlResult.urlResult.data;

            if (Object.keys(urlObj).length > 0) files.push({ name: `${this.getUrlHostname(url) || 'url'}.json`, data: JSON.stringify(urlObj) });
        } else if (type == 'stix') {
            const idsToAdd = this.urlStixObjectIds.get(url) || [];
            const checkedObjects = this.allObjects.filter((o) => idsToAdd.includes(o.id));
            const uncheckedObjects = this.urlExcludedObjectsStore.get(url) || [];
            const combinedObjects = [...checkedObjects, ...uncheckedObjects];
            const bundle = new Bundle(combinedObjects);
            bundle.id = `bundle--${v4()}`;
            files.push({ name: `${this.getUrlHostname(url) || 'url'}-stix.json`, data: JSON.stringify(bundle) });
        }

        if (files.length == 0) return;
        this.downloadFiles(files, url);
    }

    async downloadFiles(files, name) {
        files.forEach((file) => {
            const blob = new Blob([file.data], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            link.click();
            window.URL.revokeObjectURL(url);
        });
    }
}

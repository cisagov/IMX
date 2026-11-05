import { Component, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
    faBan,
    faCheck,
    faPlay,
    faArrowLeft,
    faFileImport,
    faFileUpload,
    faAngleUp,
    faCheckCircle,
    faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { IdentifyStixService } from './identify-stix/identify-stix.service';
import { MispStixService } from 'src/app/misp-stix-service/misp-stix.service';
import { StixService } from 'src/app/stix-service.service';
import { Bundle } from '../../models/bundle';
import { HttpHeaders } from '@angular/common/http';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';
import { EnvService } from 'src/app/env-service/env.service';

@Component({
    selector: 'app-copy-paste-dialog',
    templateUrl: './copy-paste-dialog.component.html',
    styleUrls: ['./copy-paste-dialog.component.css'],
    standalone: false,
})
export class CopyPasteDialogComponent implements OnDestroy {
    faBan = faBan;
    faCheck = faCheck;
    faPlay = faPlay;
    faArrowLeft = faArrowLeft;
    faFileImport = faFileImport;
    faFileUpload = faFileUpload;
    faAngleUp = faAngleUp;
    faCheckCircle = faCheckCircle;
    faExclamationTriangle = faExclamationTriangle;

    textBody: String = '';
    mispBody: string = '';

    isParsed: boolean = false;
    isConfirm: boolean = false;
    selectAll: boolean = false;
    parsedObjects: any = {};
    allObjects: any[] = [];
    selectedObjects = new Set<string>();
    showId: String = '';
    activeTab = 'jsonViewer';
    isLoading: boolean = false;

    imxServerConnectionError: string = '';

    tab: string = 'copy-paste';
    targetFile: File;
    formData: FormData;

    selectedFile = undefined;
    selectedFiles = [];
    acceptFileTypes = ['.json', '.txt', '.log', '.xml', '.html', '.csv', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.rtf'];
    acceptFileString = this.acceptFileTypes.join(',');
    uploadMessage = '';
    uploadError = '';
    largeResult: { fileName: string; total: number; counts: [string, number][]; blob: Blob } | null = null;
    maxObjects = IdentifyStixService.MAX_OBJECTS;
    parseProgress: number | null = null;
    private parseAbort: AbortController | null = null;

    tempBundle = new Bundle([]);
    disableParse = true;

    collapsedCategories: Set<string> = new Set();

    objects2DArray = [
        ['artifact', 'Artifact'],
        ['autonomous-system', 'Autonomous System'],
        ['directory', 'Directory'],
        ['domain-name', 'Domain Name'],
        ['email-addr', 'Email Address'],
        ['file', 'File'],
        ['grouping', 'Grouping'],
        ['identity', 'Identity'],
        ['ipv4-addr', 'IPv4 Address'],
        ['ipv6-addr', 'IPv6 Address'],
        ['mac-addr', 'Mac Address'],
        ['observed-data', 'Observed Data'],
        ['process', 'Process'],
        ['url', 'URL'],
        ['windows-registry-key', 'Windows Registry Key'],
    ];

    constructor(
        public activeModal: NgbActiveModal,
        private identifyStix: IdentifyStixService,
        private stixService: StixService,
        private announcementService: AnnouncementService,
        private envService: EnvService,
        private mispStix: MispStixService
    ) {}

    ngOnDestroy(): void {
        this.parseAbort?.abort();
    }

    onNoClick(): void {
        this.activeModal.dismiss();
    }

    onX(): void {
        this.activeModal.dismiss();
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
            case 'misp-stix':
                if (this.mispBody === '') {
                    this.disableParse = true;
                    break;
                }

                this.disableParse = false;
                break;
            case 'upload-file':
                if (this.selectedFiles.length === 0) {
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
        else if (this.isParsed) this.isParsed = false;
    }

    textBodyChange() {
        switch (this.tab) {
            case 'copy-paste':
                if (this.textBody === '') {
                    this.disableParse = true;
                    break;
                }

                this.disableParse = false;
                break;
            case 'misp-stix':
                if (this.mispBody === '') {
                    this.disableParse = true;
                    break;
                }

                this.disableParse = false;
                break;
        }
        if (this.textBody === '' && this.mispBody === '') {
            this.disableParse = true;
        } else {
            this.disableParse = false;
        }
    }

    onFileChanged(event) {
        this.uploadMessage = '';
        this.uploadError = '';
        this.largeResult = null;

        const sizeError = event.target.files[0] ? this.identifyStix.validateUploadSize(event.target.files[0]) : null;
        if (sizeError) {
            this.uploadError = sizeError;
            event.target.value = '';
            this.selectedFile = undefined;
            this.selectedFiles = [];
            this.targetFile = undefined;
            this.formData = undefined;
            this.disableParse = true;
            return;
        }

        this.selectedFiles = event.target.files;
        this.targetFile = event.target.files[0];

        this.formData = new FormData();
        this.formData.append('file', this.targetFile, this.targetFile.name);

        if (this.selectedFiles.length === 0) {
            this.disableParse = true;
        } else {
            this.disableParse = false;
        }
    }

    async getFilesAsString() {
        return new Promise(async (resolve) => {});
    }

    async onParse(): Promise<void> {
        this.selectAll = false;
        this.parsedObjects = {};
        this.allObjects = [];
        this.largeResult = null;
        this.isLoading = true;

        let result: any = undefined;

        switch (this.tab) {
            case 'upload-file':
                let current = this.selectedFiles[0];
                let nameSplit = current.name.split('.');
                let postfix = nameSplit[nameSplit.length - 1];

                this.uploadMessage = '';
                this.uploadError = this.identifyStix.validateUploadSize(current) || '';
                if (this.uploadError) {
                    this.isLoading = false;
                    return;
                }

                switch (postfix) {
                    case 'json':
                    case 'txt':
                    case 'log':
                    case 'csv':
                    case 'html':
                    case 'xml':
                        this.parseProgress = 0;
                        this.parseAbort = new AbortController();
                        result = await this.identifyStix.postIdentifyStixChunked(
                            current,
                            (p) => (this.parseProgress = p),
                            undefined,
                            this.parseAbort.signal,
                            true
                        );
                        this.parseProgress = null;
                        if (result?.aborted) return;
                        if (result?.overLimit) {
                            this.showLargeResult(result.iocsByType, current.name);
                            return;
                        }
                        break;
                    case 'pdf':
                    case 'docx':
                    case 'doc':
                    case 'xls':
                    case 'xlsx':
                    case 'rtf':
                        result = await this.identifyStix.postIdentifyStixFile(this.formData, this.targetFile.name);
                        if (result?.objects?.length > IdentifyStixService.MAX_OBJECTS) {
                            this.showLargeResult(this.identifyStix.groupIocsByType(result.objects), current.name);
                            return;
                        }
                        break;
                    default:
                        this.uploadError = `Unsupported file type: .${postfix}`;
                        this.isLoading = false;
                        return;
                }

                break;
            case 'copy-paste':
                result = await this.identifyStix.postIdentifyStix(this.textBody);
                break;
            case 'misp-stix':
                const parsedBody = JSON.parse(this.mispBody);
                const misp = parsedBody['response'] ? JSON.stringify(parsedBody['response'][0]) : this.mispBody;
                result = await this.mispStix.mispToStix(misp);

                if (result?.status == 200) result = result.data;
                break;
            default:
                break;
        }

        if (result == undefined || !result.objects) {
            let errorCode = result.status ? result.status : '0';
            let errorMessage = result.message
                ? result.message
                : `Cannot connect to IMX Server at: ${this.envService.env.imxServer.url} Please create a support request using the link in the bottom right for further assistance.`;
            this.imxServerConnectionError = `Error code [${errorCode}]: ${errorMessage}`;
            this.announcementService.show('Error in Connecting to IMX Server', this.imxServerConnectionError, 'error', false);
            result = false;
        } else {
            if (this.tab !== 'misp-stix') result.objects = this.identifyStix.dedupeObjects(result.objects);

            for (let obj of result.objects) {
                this.allObjects.push(obj);

                if (this.parsedObjects[obj['type']]) {
                    this.parsedObjects[obj['type']].push(obj);
                } else {
                    this.parsedObjects[obj['type']] = [obj];
                }
            }

            if (this.tab === 'upload-file') {
                this.uploadMessage = `Parsed ${result.objects.length} indicator${result.objects.length !== 1 ? 's' : ''} from ${this.targetFile.name}`;
            }

            if (this.parsedObjects) this.isParsed = true;
            this.updateSelectAll();

            this.isLoading = false;
        }
    }

    showLargeResult(iocsByType: Map<string, Map<string, any>>, sourceName: string) {
        const counts: [string, number][] = [...iocsByType].map(([type, entries]) => [type, entries.size]);
        this.largeResult = {
            fileName: `${sourceName.replace(/\.[^.]+$/, '')}-iocs.json`,
            total: counts.reduce((sum, [, count]) => sum + count, 0),
            counts,
            blob: this.identifyStix.buildIocJson(iocsByType, sourceName),
        };
        this.isLoading = false;
        this.downloadLargeResult();
    }

    downloadLargeResult() {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(this.largeResult.blob);
        a.download = this.largeResult.fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    getTypeLabel(type: string): string {
        const match = this.objects2DArray.find((map) => map[0] === type);
        return match ? match[1] : type;
    }

    onConfirm() {
        let temp = this.allObjects.filter((obj) => this.selectedObjects.has(obj.id));

        this.tempBundle = new Bundle(temp);

        this.isConfirm = true;
    }

    getStixPreview() {
        return this.tempBundle;
    }

    onAddToBundle(): void {
        this.activeModal.close({ selectedObjects: this.tempBundle });
    }

    updateSelectAll() {
        this.selectedObjects = new Set<string>();

        if (this.selectAll === false) {
            for (let obj of this.allObjects) {
                this.selectedObjects.add(obj.id);
            }
        }

        if (this.selectAll === true) this.selectAll = false;
        else this.selectAll = true;
    }

    updateSelectedObjects(id) {
        if (this.selectedObjects.has(id)) this.selectedObjects.delete(id);
        else this.selectedObjects.add(id);

        if (this.allObjects.length === this.selectedObjects.size) {
            this.selectAll = true;
        } else {
            this.selectAll = false;
        }
    }

    getSelected(id) {
        return this.selectedObjects.has(id);
    }

    isCategorySelected(type: string): boolean {
        return this.parsedObjects[type].every((obj) => this.selectedObjects.has(obj.id));
    }

    toggleCategorySelection(type: string) {
        const select = !this.isCategorySelected(type);
        for (let obj of this.parsedObjects[type]) {
            if (select) this.selectedObjects.add(obj.id);
            else this.selectedObjects.delete(obj.id);
        }

        this.selectAll = this.allObjects.length === this.selectedObjects.size;
    }

    toggleCategory(key: string) {
        if (this.collapsedCategories.has(key)) {
            this.collapsedCategories.delete(key);
        } else {
            this.collapsedCategories.add(key);
        }
    }

    isCategoryCollapsed(key: string): boolean {
        return this.collapsedCategories.has(key);
    }

    changeShow(id) {
        if (this.showId === id) {
            this.showId = '';
            return;
        }

        this.showId = id;
    }

    getComponentDisplay(component: any): string {
        if (component.type) {
            let componentDisplay = '';
            switch (component.type) {
                case 'malware-analysis':
                case 'observed-data': {
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
                case 'grouping':
                case 'identity': {
                    if (component.name) componentDisplay = component.name;
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
}

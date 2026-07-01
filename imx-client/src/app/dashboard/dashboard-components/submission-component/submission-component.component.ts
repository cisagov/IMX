import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';
import { EnvService } from 'src/app/env-service/env.service';
import { LoggingService } from 'src/app/logging-service/logging.service';
import { StixService } from 'src/app/stix-service.service';
import { SubmissionsService } from 'src/app/submissions-service/submissions.service';
import {
    faCloudUploadAlt,
    faClock,
    faStop,
    faCheck,
    faDownload,
    faGlasses,
    faCircle,
    faPlus,
    faArrowRight,
    faUndo,
    faSearch,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { lastValueFrom } from 'rxjs';

@Component({
    selector: 'app-submission-component',
    templateUrl: './submission-component.component.html',
    styleUrls: ['./submission-component.component.css', '../../dashboard.component.css', '../../../app.component.css'],
    standalone: false,
})
export class SubmissionComponentComponent {
    @Input() currentSelection: String;
    @Input() submissionLoading: boolean;
    @Output() loadingChange = new EventEmitter<boolean>();

    faUndo = faUndo;
    faPlus = faPlus;
    faArrowRight = faArrowRight;
    faCircle = faCircle;
    faGlasses = faGlasses;
    faCloudUploadAlt = faCloudUploadAlt;
    faClock = faClock;
    faStop = faStop;
    faCheck = faCheck;
    faDownload = faDownload;
    faSearch = faSearch;
    faTimes = faTimes;

    environment = this.envService.env;

    totalStatusPages: number = 1;
    currentStatusPage: number = 1;
    statusRowNumber: number = -1;

    selectionOptions: String[] = [];

    // submissionLoading:        boolean = false;

    statusTable: any[] = [];
    filteredStatusTable: any[] = [];
    searchText: string = '';
    isSearching: boolean = false;
    searchDebounceTimer: any = null;
    statusQueryError: String = '';
    // sortKey:          String = '';

    init: boolean = true;

    constructor(
        private stixService: StixService,
        private envService: EnvService,
        private submissions: SubmissionsService,
        private httpClient: HttpClient,
        private loggingService: LoggingService,
        private announcement: AnnouncementService
    ) {}

    async ngOnInit() {
        await this.getSubmissions();
    }

    async ngOnChanges(changes: SimpleChanges) {
        if (changes['currentSelection']) {
            this.currentStatusPage = 1;
            this.getSubmissions();
        }
    }

    public async getSubmissions() {
        if (this.submissionLoading) return;
        if (!this.currentSelection) {
            this.currentSelection = this.envService.getUsername();
        }

        this.submissionLoading = true;
        this.loadingChange.emit(this.submissionLoading);
        this.statusQueryError = '';

        await this.getPage();
        this.init = false;
        this.submissionLoading = false;
        this.loadingChange.emit(this.submissionLoading);
    }

    private async getPage() {
        let page: any = await this.submissions.getPage(this.currentStatusPage, this.currentSelection);

        if (!page.hits) {
            let errorCode = page.status ? page.status : '0';
            let errorMessage = page.message
                ? page.message
                : `Cannot connect to IMX Server at: ${this.envService.env.imxServer.url} Please create a support request using the link in the bottom right for further assistance.`;
            this.stixService.imxServerConnectionError = `Error code [${errorCode}]: ${errorMessage}`;
            this.submissionLoading = false;
            this.loadingChange.emit(this.submissionLoading);
            return;
        }
        this.stixService.imxServerConnectionError = '';

        this.totalStatusPages = Math.ceil(page.total.value / 10);

        let resTable = [];
        for (let i = 0; i < page.hits.length; i++) {
            let obj = page.hits[i];

            obj._source.root_collection = `${obj._source.root}/`;
            let isCollectionFound = false;
            for (let root of this.stixService.apiRoots2) {
                if (obj._source.root === root.title) {
                    for (let col of root.collections) {
                        if (obj._source.collection && col.id === obj._source.collection.id) {
                            obj._source.root_collection += `${col.title}`;
                            isCollectionFound = true;
                            break;
                        }
                    }
                    break;
                }
            }

            if (this.stixService.apiRoots2.length === 0 || !isCollectionFound) {
                if (obj._source.collection && obj._source.collection.title) obj._source.root_collection += obj._source.collection.title;
            }

            let httpHeaders = new HttpHeaders()
                .set('Accept', 'application/taxii+json;version=2.1')
                .set('Content-Type', 'application/taxii+json;version=2.1')
                .set('Authorization', `Basic ${btoa(this.stixService.taxiiServer.username + ':' + this.stixService.taxiiServer.password)}`);

            try {
                let isDisabled = this.isTaxiiServerDisabled(obj._source.url);

                if (
                    (!isDisabled &&
                        obj._source.res.id !== 'N/A' &&
                        obj._source.res.status === 'pending' &&
                        (obj._source.taxiiServer === this.envService.env.taxiiServer.url ||
                            obj._source.taxiiServer === this.envService.env.aisTaxiiProxy.url ||
                            obj._source.taxiiServer === this.stixService.taxiiServer.url)) ||
                    (obj._source.taxiiServer === this.envService.env.aisTaxiiProxy.url &&
                        obj.source.res.message &&
                        (obj._source.res.message.includes('cyberservices@cisa.dhs.gov') || obj._source.res.message.includes('Pending human review')))
                ) {
                    try {
                        const data: any = await lastValueFrom(this.httpClient.get(obj._source.url, { headers: httpHeaders }));

                        data['original_submission'] = obj._source.res.original_submission;
                        obj._source.res = data;
                        resTable.push(obj._source);
                        resTable = this.sortResultsAsc('created_timestamp', resTable);

                        let updateResp = this.submissions.updateSubmission(obj);
                    } catch (err) {
                        console.debug(`**Error code: ${err.status}, URL: ${err.url}**`);
                        resTable.push(obj._source);
                    }
                } else {
                    if (!isDisabled && obj._source.res.status === 'pending') {
                        this.announcement.show(
                            'Cannot Poll Custom Taxii Server',
                            `Can only poll status of a Custom Taxii Server if currently connected. Try establishing a connection to the server with a red square and try again`,
                            'error',
                            false
                        );
                    }
                    resTable.push(obj._source);
                }
            } catch (e) {
                console.debug(`**Error Name: ${e.name} Error Message ${e.message}**`);
                resTable.push(obj._source);
            }
        }

        this.statusTable = [...resTable];
        this.filteredStatusTable = [...this.statusTable];
    }

    private sortResultsAsc(col: string, tableArray: any[]) {
        switch (col) {
            case 'status':
                return tableArray.sort((a, b) =>
                    this.sortToLowercase(a.res[col]) < this.sortToLowercase(b.res[col])
                        ? 1
                        : this.sortToLowercase(a.res[col]) > this.sortToLowercase(b.res[col])
                          ? -1
                          : 0
                );
            case 'created_timestamp':
            case 'updated_timestamp':
                return tableArray.sort((a, b) => this.sortDate(a[`@${col}`], b[`@${col}`], 'asc'));
            case 'created':
            case 'modified':
            case 'date_added':
            case 'version':
                return tableArray.sort((a, b) => this.sortDate(a[col], b[col], 'asc'));
            default:
                return tableArray.sort((a, b) =>
                    this.sortToLowercase(a[col]) < this.sortToLowercase(b[col])
                        ? 1
                        : this.sortToLowercase(a[col]) > this.sortToLowercase(b[col])
                          ? -1
                          : 0
                );
        }
    }

    private isTaxiiServerDisabled(url) {
        let splitUrl = url.split('/');
        let index = 0;

        for (let i = 0; i < splitUrl.length; i++) {
            if (splitUrl[i] === 'taxii') {
                index = i - 1;
                break;
            }
        }

        for (let server of this.envService.env.disabledTaxiiServers) {
            if (server.includes(splitUrl[index])) return true;
        }

        return false;
    }

    private sortToLowercase(item) {
        if (typeof item === 'string') return item.toLowerCase();

        return item;
    }

    private sortDate(a: any, b: any, type: string) {
        a = new Date(a);
        b = new Date(b);

        if (type === 'asc') {
            if (!this.isValidDate(a) && !this.isValidDate(b)) return 0;
            else if (!this.isValidDate(a)) return 1;
            else if (!this.isValidDate(b)) return -1;
            else return a < b ? 1 : a > b ? -1 : 0;
        }
        if (type === 'des') {
            if (!this.isValidDate(a) && !this.isValidDate(b)) return 0;
            else if (!this.isValidDate(a)) return 1;
            else if (!this.isValidDate(b)) return -1;
            else return a > b ? 1 : a < b ? -1 : 0;
        }

        return 0;
    }

    private isValidDate(date) {
        return date instanceof Date && !isNaN(date.getTime());
    }

    getDate(dateString, obj = null) {
        if (!dateString && obj) dateString = obj.res.request_timestamp;

        const date = new Date(dateString);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    public getTaxiiServer(server) {
        switch (server) {
            case `${this.envService.env.taxiiServer.url}`:
                return 'Default';
            case `${this.envService.env.aisTaxiiProxy.url}`:
                return 'AIS';
            default:
                return server;
        }
    }

    downloadSubmission(obj) {
        if (this.submissionLoading) return;

        let data = obj;

        let file = new Blob([JSON.stringify(data)], { type: 'text/plain' });
        let a = document.createElement('a'),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = obj.docName && obj.docName.endsWith('json') ? obj.docName : 'submission.json';
        a.click();
        a.remove();
    }

    previewSubmission(obj) {
        if (this.submissionLoading) return;

        let data = obj;

        let file = new Blob([JSON.stringify(data)], { type: 'text/plain' });
        let a = document.createElement('a'),
            url = URL.createObjectURL(file);
        const newTab = window.open(url);
        newTab?.document.write('<pre>', JSON.stringify(data, null, 2), '</pre>');
        newTab?.document.close();
    }

    public async nextPage(direction) {
        if (this.submissionLoading) return;

        switch (direction) {
            case 'right':
                if (this.currentStatusPage === this.totalStatusPages) return;
                this.currentStatusPage++;
                break;
            case 'left':
                if (this.currentStatusPage === 1) return;

                this.currentStatusPage--;
                break;
        }

        this.getSubmissions();
    }

    public async selectPage(pageNum) {
        if (this.submissionLoading) return;

        if (this.currentStatusPage === pageNum) return;

        this.currentStatusPage = pageNum;

        this.getSubmissions();
    }

    onSubmissionSearchInput() {
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        if (!this.searchText.trim()) {
            this.clearSearch();
            return;
        }

        this.searchDebounceTimer = setTimeout(() => {
            this.searchSubmissions();
        }, 300);
    }

    async searchSubmissions() {
        if (this.submissionLoading) return;

        const query = {
            wildcard: {
                'docName.keyword': {
                    value: `*${this.searchText}*`,
                    case_insensitive: true,
                },
            },
        };

        this.submissionLoading = true;
        this.loadingChange.emit(this.submissionLoading);

        try {
            const result: any = await this.submissions.searchSubmissions(query);

            if (result?.data?.hits) {
                const hits = result.data.hits;
                const processed = hits.map((hit) => {
                    const src = hit._source;
                    if (typeof src.res === 'string') src.res = JSON.parse(src.res);
                    if (typeof src.collection === 'string') src.collection = JSON.parse(src.collection);

                    src.root_collection = `${src.root}/`;
                    if (src.collection?.title) src.root_collection += src.collection.title;

                    return src;
                });

                this.filteredStatusTable = processed;
                this.isSearching = true;
            }
        } catch (err) {
            console.error('Search submissions error:', err);
        }

        this.submissionLoading = false;
        this.loadingChange.emit(this.submissionLoading);
    }

    clearSearch() {
        this.searchText = '';
        if (this.isSearching) {
            this.isSearching = false;
            this.filteredStatusTable = [...this.statusTable];
        } else {
            this.filteredStatusTable = [...this.statusTable];
        }
    }

    createArray(i: number) {
        return Array.from({ length: i }, (_, i) => i);
    }
}

import { Component, DOCUMENT, Inject, OnInit } from '@angular/core';
import {
    faAngleUp,
    faAngleDown,
    faArrowRight,
    faArrowLeft,
    faClock,
    faStop,
    faCheck,
    faDownload,
    faAngleDoubleRight,
    faFile,
    faCloud,
    faSave,
    faCaretDown,
    faCaretUp,
    faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons';
import { StixService } from '../stix-service.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LoggingService } from '../logging-service/logging.service';
import { SubmissionsService } from '../submissions-service/submissions.service';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { EnvService } from '../env-service/env.service';
import { faBell } from '@fortawesome/free-regular-svg-icons';

@Component({
    selector: 'app-user-data',
    templateUrl: './user-data.component.html',
    styleUrls: ['./user-data.component.css', '../dashboard/dashboard.component.css'],
    standalone: false,
})
export class UserDataComponent implements OnInit {
    activeTab: string = '';
    statusQueryError: string = '';
    sortKey: string = '';
    currentSelection: string = '';

    isLoading: boolean = false;
    init: boolean = true;
    initAuth: boolean = false;

    totalStatusPages: number = 1;
    currentStatusPage: number = 1;
    statusRowNumber: number = -1;

    statusQueryResults: any = {};

    statusTable: any[] = [];
    unsortedResults: any[] = [];
    statusIDs: any[] = [];
    selectionOptions: any[] = [];

    faArrowRight = faArrowRight;
    faArrowLeft = faArrowLeft;
    faAngleUp = faAngleUp;
    faAngleDown = faAngleDown;
    faClock = faClock;
    faStop = faStop;
    faCheck = faCheck;
    faDownload = faDownload;
    faRight = faAngleDoubleRight;
    faFile = faFile;
    faCloud = faCloud;
    faBell = faBell;
    faSave = faSave;
    faCaretDown = faCaretDown;
    faCaretUp = faCaretUp;
    faExternalLink = faExternalLinkAlt;

    expandSidebar = false;
    submissionExpanded = true;

    constructor(
        public stixService: StixService,
        private readonly httpClient: HttpClient,
        private readonly loggingService: LoggingService,
        private readonly submissions: SubmissionsService,
        private readonly announcement: AnnouncementService,
        private readonly envService: EnvService,
        @Inject(DOCUMENT) private readonly document: any
    ) {}

    private async getSubmissions() {
        this.isLoading = true;
        this.statusQueryResults = {};
        this.unsortedResults = [];
        this.statusTable = [];
        this.statusIDs = [];
        this.sortKey = '';
        this.statusQueryError = '';
        await this.envService.checkAuth('/my-profile');
        await this.getPage();
        if (this.init && this.stixService.imxServerConnectionError !== '') this.activeTab = 'bundles';
        this.init = false;
        this.isLoading = false;
    }

    private async getSavedBundles() {
        this.isLoading = true;
        await this.envService.checkAuth('/my-profile');
        await this.stixService.getSavedBundles(1, '', undefined);
        this.isLoading = false;
    }

    downloadSubmission(obj) {
        let data = obj;

        let file = new Blob([JSON.stringify(data)], { type: 'text/plain' });
        let a = document.createElement('a'),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = obj.docName?.endsWith('json') ? obj.docName : 'submission.json';
        a.click();
        a.remove();
    }

    async onUserChange(event) {
        this.statusRowNumber = -1;
        this.statusQueryResults = {};

        this.getSubmissions();
    }

    async ngOnInit(): Promise<void> {
        this.currentSelection = this.envService.getUsername();
        this.selectionOptions = [this.currentSelection];
        if (this.envService.taxiiUsers === undefined) {
            await this.envService.waitUser();
        }

        for (let group in this.envService.groupInfo) {
            for (let user of this.envService.groupInfo?.[group]) {
                if (this.selectionOptions.includes(user.user)) continue;

                this.selectionOptions.push(user.user);
            }
        }

        for (let group in this.envService.groupInfo) {
            this.selectionOptions.push(`${group} (group)`);
        }

        if (history.state.activeTab) {
            this.activeTab = history.state.activeTab;
        } else {
            this.setTab('submissions');
        }
    }

    public changeStatusShow(i) {
        if (this.statusRowNumber === i) {
            this.statusRowNumber = -1;
            this.statusQueryResults = {};
        } else {
            this.statusRowNumber = i;
            this.statusQueryResults = this.statusTable[i].res;
        }
    }

    public async nextPage(direction) {
        switch (direction) {
            case 'right':
                this.currentStatusPage++;
                break;
            case 'left':
                this.currentStatusPage--;
                break;
        }
        this.getSubmissions();
    }

    public setTab(tab) {
        if (this.activeTab === tab) return;
        this.activeTab = tab;

        if (this.initAuth === false) {
            this.initAuth = true;
        } else {
            this.envService.checkAuth('/my-profile');
        }

        switch (tab) {
            case 'submissions':
                this.getSubmissions();
                break;
            case 'bundles':
                this.getSavedBundles();
                break;
        }
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

    private refreshBeforeSort(table) {
        if (this.statusRowNumber !== null) this.statusRowNumber = null;
        if (!this.sortKey) {
            this.sortKey = '';
            this.unsortedResults = [];

            if (table === 'status') {
                for (let status of this.statusTable) {
                    this.unsortedResults.push(status);
                }
            }
        }
    }

    public sort(col: string, table: string) {
        if (this.statusTable.length === 0 && table === 'status') return;

        this.refreshBeforeSort(table);

        if (this.sortKey === '') {
            this.statusTable = this.sortResultsDes(col, this.statusTable, table);

            this.sortKey = `${col}-des`;
        } else {
            let keyArr = this.sortKey.split('-');
            if (col === keyArr[0] && keyArr[1] === 'des') {
                this.statusTable = this.sortResultsAsc(col, this.statusTable, table);

                this.sortKey = `${col}-asc`;
            } else if (col === keyArr[0] && keyArr[1] === 'asc') {
                this.statusTable = this.unsortedResults;

                this.sortKey = '';
            } else {
                this.statusTable = this.sortResultsDes(col, this.statusTable, table);

                this.sortKey = `${col}-des`;
            }
        }
    }

    private sortResultsDes(col: string, tableArray: any[], table) {
        if (table !== 'status') return this.statusTable;

        switch (col) {
            case 'status':
                return tableArray.sort((a, b) => this.sortToLowercase(a.res[col], b.res[col], 'des'));
            case 'created_timestamp':
            case 'updated_timestamp':
                return tableArray.sort((a, b) => this.sortDate(a[`@${col}`], b[`@${col}`], 'des'));
            case 'created':
            case 'modified':
            case 'date_added':
            case 'version':
                return tableArray.sort((a, b) => this.sortDate(a[col], b[col], 'des'));
            default:
                return tableArray.sort((a, b) => this.sortToLowercase(a[col], b[col], 'des'));
        }
    }

    private sortResultsAsc(col: string, tableArray: any[], table) {
        if (table !== 'status') return this.statusTable;
        switch (col) {
            case 'status':
                return tableArray.sort((a, b) => this.sortToLowercase(a.res[col], b.res[col], 'asc'));
            case 'created_timestamp':
            case 'updated_timestamp':
                return tableArray.sort((a, b) => this.sortDate(a[`@${col}`], b[`@${col}`], 'asc'));
            case 'created':
            case 'modified':
            case 'date_added':
            case 'version':
                return tableArray.sort((a, b) => this.sortDate(a[col], b[col], 'asc'));
            default:
                return tableArray.sort((a, b) => this.sortToLowercase(a[col], b[col], 'asc'));
        }
    }

    private sortToLowercase(a, b, mode) {
        if (typeof a === 'string') a = a.toLowerCase();
        if (typeof b === 'string') b = b.toLowerCase();

        if (a < b) return mode === 'asc' ? 1 : -1;
        else if (a > b) return mode === 'asc' ? -1 : 1;
        else return 0;
    }

    private sortDate(a: any, b: any, type: string) {
        a = new Date(a);
        b = new Date(b);

        if (!this.isValidDate(a) && !this.isValidDate(b)) return 0;
        else if (!this.isValidDate(a)) return 1;
        else if (!this.isValidDate(b)) return -1;

        switch (type) {
            case 'asc':
                return this.sortDateAsc(a, b);
            case 'des':
                return this.sortDateDes(a, b);
            default:
                return 0;
        }
    }

    sortDateAsc(a, b) {
        if (a < b) return 1;
        else if (a > b) return -1;
        else return 0;
    }

    sortDateDes(a, b) {
        if (a < b) return -1;
        else if (a > b) return 1;
        else return 0;
    }

    private isValidDate(date) {
        return date instanceof Date && !isNaN(date.getTime());
    }

    private async getPage() {
        let page: any = await this.submissions.getPage(this.currentStatusPage, this.currentSelection);

        if (!page.hits) {
            let errorCode = page.status ? page.status : '0';
            let errorMessage = page.message
                ? page.message
                : `Cannot connect to IMX Server at: ${this.envService.env.imxServer.url} Please create a support request using the link in the bottom right for further assistance.`;
            this.stixService.imxServerConnectionError = `Error code [${errorCode}]: ${errorMessage}`;
            this.isLoading = false;
            return;
        }
        this.stixService.imxServerConnectionError = '';

        let httpHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Content-Type', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.stixService.taxiiServer.username + ':' + this.stixService.taxiiServer.password)}`);

        this.totalStatusPages = Math.ceil(page.total.value / 10);
        for (let obj of page.hits) {
            obj._source.root_collection = this.getObjRootCollection(obj);

            try {
                await this.pollAndPushStatus(obj, httpHeaders);
            } catch (e) {
                console.debug(`**Error Name: ${e.name} Error Message ${e.message}**`);
                this.statusTable.push(obj._source);
            }
        }
    }

    getObjRootCollection(obj) {
        let result = `${obj._source.root}/`;

        let isCollectionFound = false;
        for (let root of this.stixService.apiRoots2) {
            if (obj._source.root === root.title) {
                for (let col of root.collections) {
                    if (obj._source.collection && col.id === obj._source.collection.id) {
                        result += `${col.title}`;
                        isCollectionFound = true;
                        break;
                    }
                }
                break;
            }
        }

        if ((this.stixService.apiRoots2.length === 0 || !isCollectionFound) && obj._source.collection?.title) {
            result += obj._source.collection.title;
        }

        return result;
    }

    async pollAndPushStatus(obj, httpHeaders) {
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
            this.httpClient.get<any>(obj._source.url, { headers: httpHeaders }).subscribe({
                next: (data) => {
                    data['original_submission'] = obj._source.res.original_submission;
                    obj._source.res = data;

                    this.statusTable.push(obj._source);
                    this.statusTable = this.sortResultsAsc('created_timestamp', this.statusTable, 'status');

                    let updateResp = this.submissions.updateSubmission(obj);
                },
                error: (err) => {
                    console.error(err);

                    console.debug(`**Error code: ${err.status}, URL: ${err.url}**`);
                    this.statusTable.push(obj._source);
                },
            });
        } else {
            if (obj._source.res.status === 'pending' && !isDisabled) {
                this.announcement.show(
                    'Cannot Poll Custom Taxii Server',
                    `Can only poll status of a Custom Taxii Server if currently connected. Try establishing a connection to the server with a red square and try again`,
                    'warning',
                    false
                );
            }
            this.statusTable.push(obj._source);
        }
    }

    isTaxiiServerDisabled(url) {
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

    //Sidebar

    toggleSidebar() {
        this.expandSidebar = !this.expandSidebar;
    }

    enableSidebar() {
        this.expandSidebar = true;
    }

    disableSidebar() {
        this.expandSidebar = false;
    }

    clickSubmission(event) {
        event.stopPropagation();

        if (!this.expandSidebar) {
            this.expandSidebar = true;
            this.submissionExpanded = true;
        } else {
            this.submissionExpanded = !this.submissionExpanded;
        }
    }
}

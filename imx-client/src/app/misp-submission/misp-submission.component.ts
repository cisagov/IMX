import { Component, DOCUMENT, Inject, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { StixService } from '../stix-service.service';
import { HttpClient } from '@angular/common/http';
import { LoggingService } from '../logging-service/logging.service';
import { SubmissionsService } from '../submissions-service/submissions.service';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { EnvService } from '../env-service/env.service';
import {
    faAngleDoubleRight,
    faAngleDown,
    faAngleUp,
    faArrowLeft,
    faArrowRight,
    faBell,
    faCaretDown,
    faCaretUp,
    faCheck,
    faClock,
    faCloud,
    faDownload,
    faExternalLinkAlt,
    faFile,
    faSave,
    faStop,
    faUndo,
} from '@fortawesome/free-solid-svg-icons';
import { JsonViewComponent } from './json-view/json-view.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-misp-submission',
    templateUrl: './misp-submission.component.html',
    styleUrls: ['./misp-submission.component.css', '../dashboard/dashboard.component.css'],
    standalone: false,
})
export class MispSubmissionComponent implements OnInit {
    @Input() selectionOptions: any;
    @Input() userOverride: boolean;
    @Input() user: string;

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
    faUndo = faUndo;

    mispPage = 0;
    mispTable = [];
    mispHasMore = false;

    isLoading = false;

    currentSelection = '';

    sortKey = '';

    unsortedResults = [];

    constructor(
        public stixService: StixService,
        private httpClient: HttpClient,
        private readonly loggingService: LoggingService,
        private submissions: SubmissionsService,
        private announcement: AnnouncementService,
        public envService: EnvService,
        private readonly modalService: NgbModal,
        @Inject(DOCUMENT) private readonly document: any
    ) {}

    ngOnInit(): void {
        if (this.userOverride) this.currentSelection = this.user;
        else {
            this.currentSelection = this.envService.getUsername();
            this.getMisp();
        }
    }
    async onUserChange() {
        await this.envService.checkAuth('/my-profile');
        this.mispPage = 0;
        this.mispTable = [];
        this.mispHasMore = false;
        this.getMisp();
    }

    //MISP
    async getMisp() {
        await this.envService.checkAuth('/my-profile');
        this.isLoading = true;

        if (this.userOverride) {
            this.currentSelection = this.user;
        }

        const res: any = await this.submissions.getMispSubmission(this.mispPage, this.currentSelection);

        if (!res || !res.data) {
            let errorCode = res.status ? res.status : '0';
            let errorMessage = res.message
                ? res.message
                : `Cannot connect to IMX Server at: ${this.envService.env.imxServer.url} Please create a support request using the link in the bottom right for further assistance.`;
            this.stixService.imxServerConnectionError = `Error code [${errorCode}]: ${errorMessage}`;
            this.isLoading = false;
            return;
        }

        this.stixService.imxServerConnectionError = '';

        if (res.hasMore) {
            this.mispHasMore = true;
            this.mispPage += 10;
        } else {
            this.mispHasMore = false;
        }

        this.mispTable = this.mispTable.concat(res.data);
        this.unsortedResults = [...this.mispTable];

        if (this.sortKey) {
            let keyArr = this.sortKey.split('-');
            if (keyArr[1] == 'des') {
                this.sortResultDes(keyArr[0]);
            } else if (keyArr[1] == 'asc') {
                this.sortResultAsc(keyArr[0]);
            }
        }
        this.isLoading = false;
    }

    openMispLink(event, url, id) {
        let link;
        event.stopPropagation();

        if (url.endsWith('/')) link = `${url}events/view/${id}`;
        else link = `${url}/events/view/${id}`;

        window.open(link, '_blank');
    }

    downloadMisp(event, misp, docName) {
        event.stopPropagation();

        const a = this.document.createElement('a');
        const file = new Blob([misp], { type: 'application/json' });
        a.href = URL.createObjectURL(file);

        a.download = docName + '_misp.json';

        setTimeout(() => {
            a.click();
        }, 400);
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

    sort(col: string) {
        if (this.mispTable.length == 0) return;

        if (this.sortKey === '') {
            this.sortResultDes(col);
            this.sortKey = `${col}-des`;
        } else {
            let keyArr = this.sortKey.split('-');
            if (col === keyArr[0] && keyArr[1] === 'des') {
                this.sortResultAsc(col);

                this.sortKey = `${col}-asc`;
            } else if (col === keyArr[0] && keyArr[1] === 'asc') {
                this.mispTable = [...this.unsortedResults];

                this.sortKey = '';
            } else {
                this.sortResultDes(col);

                this.sortKey = `${col}-des`;
            }
        }
    }

    sortResultAsc(col) {
        switch (col) {
            case 'update':
                this.mispTable.sort((a, b) => this.sortDate(a[`@updated_timestamp`], b[`@updated_timestamp`], 'asc'));
                break;
            case 'submission':
                this.mispTable.sort((a, b) => this.sortDate(a[`@created_timestamp`], b[`@created_timestamp`], 'asc'));
                break;
            case 'url':
            case 'userId':
            case 'docName':
            case 'status':
                this.mispTable.sort((a, b) => this.sortToLowercase(a[col], b[col], 'asc'));
                break;
        }
    }

    sortResultDes(col) {
        switch (col) {
            case 'update':
                this.mispTable.sort((a, b) => this.sortDate(a[`@updated_timestamp`], b[`@updated_timestamp`], 'des'));
                break;
            case 'submission':
                this.mispTable.sort((a, b) => this.sortDate(a[`@created_timestamp`], b[`@created_timestamp`], 'des'));
                break;
            case 'url':
            case 'userId':
            case 'docName':
            case 'status':
                this.mispTable.sort((a, b) => this.sortToLowercase(a[col], b[col], 'des'));
                break;
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

    openJson(event, misp, docName) {
        event.stopPropagation();
        const modalRef = this.modalService.open(JsonViewComponent, { size: 'xl' });
        modalRef.componentInstance.misp = misp;
        modalRef.componentInstance.docName = docName;
    }

    async ngOnChanges(changes: SimpleChanges) {
        if (changes['user']) {
            this.onUserChange();
        }
    }
}

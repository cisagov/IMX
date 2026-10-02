import { HttpHeaders } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { faAngleDown, faAngleUp, faArrowLeft, faCheck, faClock, faSearch, faStop, faUndo } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { OidcService } from 'src/app/auth/oidc-service/oidc.service';
import { EnvService } from 'src/app/env-service/env.service';
import { StixService } from 'src/app/stix-service.service';
import { SubmissionsService } from 'src/app/submissions-service/submissions.service';
import { SubmissionInfoComponent } from './submission-info/submission-info.component';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';

@Component({
    selector: 'app-taxii-submissions',
    standalone: false,
    templateUrl: './taxii-submissions.component.html',
    styleUrls: ['./taxii-submissions.component.css', '../taxii-search.component.css'],
})
export class TaxiiSubmissionsComponent implements OnInit {
    @Input() selectedColl;
    @Input() selectedRoot;
    @Input() roots: any[];
    @Input() collections;
    @Input() statusPage: boolean;
    @Output() selectCollection: EventEmitter<any>;
    @Output() selectStatus: EventEmitter<boolean>;

    protected isLoading = false;
    protected isSearching = false;

    protected currentSelection = '';
    protected selectionOptions: string[] = [];

    protected statusTable: any[];
    protected currentStatusPage: number;
    protected totalStatusPages: number;

    protected statusId = '';

    protected sortKey: string = '';
    private unsortedQueryResults: any[];

    private httpHeaders: HttpHeaders;
    private taxiiServer: string = '';

    protected faArrowLeft = faArrowLeft;
    protected faCheck = faCheck;
    protected faStop = faStop;
    protected faClock = faClock;
    protected faAngleDown = faAngleDown;
    protected faAngleUp = faAngleUp;
    protected faSearch = faSearch;
    protected faUndo = faUndo;

    constructor(
        private stixService: StixService,
        private submissions: SubmissionsService,
        private envService: EnvService,
        private keycloak: KeycloakService,
        private oidc: OidcService,
        private modalService: NgbModal,
        private announcementService: AnnouncementService
    ) {
        this.selectCollection = new EventEmitter();
        this.selectStatus = new EventEmitter();
    }

    async ngOnInit(): Promise<void> {
        this.statusTable = [];
        this.currentStatusPage = 1;
        this.isLoading = false;

        await this.getUsers();
        this.setStatusTable();

        this.httpHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);
        this.taxiiServer = `${this.envService.env.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion}/`;
    }

    back() {
        this.selectCollection.emit(null);
        this.selectStatus.emit(false);
    }

    async setStatusTable() {
        this.statusTable = [];
        this.isLoading = true;
        let page: any = await this.submissions.getPage(this.currentStatusPage, this.currentSelection);
        if (page.status === 0) {
            this.isLoading = false;
            return;
        }

        this.totalStatusPages = Math.ceil(page.total.value / 2);
        for (let obj of page.hits) {
            obj._source.root_collection = `${obj._source.root}/`;
            let isCollectionFound = false;
            for (let root of this.stixService.apiRoots2) {
                if (obj._source.root === root.title) {
                    for (let col of root.collections) {
                        if (obj?._source?.collection && col.id === obj._source.collection.id) {
                            obj._source.root_collection += `${col.title}`;
                            isCollectionFound = true;
                            break;
                        }
                    }
                    break;
                }
            }

            if (this.stixService.apiRoots2.length === 0 || !isCollectionFound) {
                if (obj?._source?.collection?.title) obj._source.root_collection += obj._source.collection.title;
            }

            let httpHeaders = new HttpHeaders()
                .set('Accept', 'application/taxii+json;version=2.1')
                .set('Content-Type', 'application/taxii+json;version=2.1')
                .set('Authorization', `Basic ${btoa(this.stixService.taxiiServer.username + ':' + this.stixService.taxiiServer.password)}`);

            try {
                if (obj._source.taxiiServer === this.stixService.taxiiServer.url) {
                    if (obj._source.res.id !== 'N/A' && obj._source.res.status === 'pending') {
                        this.stixService.getCert(httpHeaders, (header: HttpHeaders) => {
                            this.stixService.taxiiHttpReq('get', obj._source.url, { headers: header }).subscribe(
                                (data: any) => {
                                    let resp = {
                                        status: 200,
                                    };

                                    obj._source.res = data;
                                    this.statusTable.push(obj._source);

                                    this.submissions.updateSubmission(obj);
                                },
                                (err) => {
                                    console.error(err);

                                    console.debug(`**Error code: ${err.status}, URL: ${err.url}**`);
                                    this.statusTable.push(obj._source);
                                }
                            );
                        });
                    } else {
                        this.statusTable.push(obj._source);
                    }
                }
            } catch (e) {
                console.debug(`**Error Name: ${e.name} Error Message ${e.message}**`);
                this.statusTable.push(obj._source);
            }
        }
        this.isLoading = false;
    }

    async nextPage(direction) {
        switch (direction) {
            case 'right':
                this.currentStatusPage++;
                break;
            case 'left':
                this.currentStatusPage--;
                break;
        }

        await this.setStatusTable();
    }

    async getUsers() {
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

        const ignoreRole = ['offline_access', 'imx-user', 'imx-relay', 'imx-admin', 'uma_authorization', 'default-roles-tie'];
        if (this.envService.env.keycloak.enabled) {
            this.keycloak.getUserRoles().forEach((role) => {
                if (ignoreRole.includes(role)) return;

                const newRole = `${role} (group)`;
                if (!this.selectionOptions.includes(newRole)) this.selectionOptions.push(newRole);
            });
        } else if (this.envService.env.oidc.enabled) {
            this.oidc.getRoles().forEach((role) => {
                if (ignoreRole.includes(role)) return;

                const newRole = `${role} (group)`;
                if (!this.selectionOptions.includes(newRole)) this.selectionOptions.push(newRole);
            });
        }
    }

    sort(col: string, table: string) {
        if (this.statusTable.length === 0 && table === 'status') return;

        if (!this.sortKey) {
            this.sortKey = '';
            this.unsortedQueryResults = [];
            if (table === 'status') {
                for (let status of this.statusTable) {
                    this.unsortedQueryResults.push(status);
                }
            }
        }

        if (this.sortKey === '') {
            if (table === 'status') this.statusTable = this.sortResultsDes(col, this.statusTable);

            this.sortKey = `${col}-des`;
        } else {
            let keyArr = this.sortKey.split('-');
            if (col === keyArr[0] && keyArr[1] === 'des') {
                if (table === 'status') this.statusTable = this.sortResultsAsc(col, this.statusTable);

                this.sortKey = `${col}-asc`;
            } else if (col === keyArr[0] && keyArr[1] === 'asc') {
                if (table === 'status') this.statusTable = this.unsortedQueryResults;

                this.sortKey = '';
            } else {
                if (table === 'status') this.statusTable = this.sortResultsDes(col, this.statusTable);

                this.sortKey = `${col}-des`;
            }
        }
    }

    sortResultsDes(col: string, tableArray: any[]) {
        switch (col) {
            case 'name':
                return tableArray.sort((a, b) =>
                    this.getComponentDisplayLowercase(a) > this.getComponentDisplayLowercase(b)
                        ? 1
                        : this.getComponentDisplayLowercase(a) < this.getComponentDisplayLowercase(b)
                          ? -1
                          : 0
                );
            case 'status':
                return tableArray.sort((a, b) =>
                    this.sortToLowercase(a.res[col]) > this.sortToLowercase(b.res[col])
                        ? 1
                        : this.sortToLowercase(a.res[col]) < this.sortToLowercase(b.res[col])
                          ? -1
                          : 0
                );
            case 'request_timestamp':
                return tableArray.sort((a, b) => this.sortDate(a.res[col], b.res[col], 'des'));
            default:
                return tableArray.sort((a, b) =>
                    this.sortToLowercase(a[col]) > this.sortToLowercase(b[col])
                        ? 1
                        : this.sortToLowercase(a[col]) < this.sortToLowercase(b[col])
                          ? -1
                          : 0
                );
        }
    }

    sortResultsAsc(col: string, tableArray: any[]) {
        switch (col) {
            case 'name':
                return tableArray.sort((a, b) =>
                    this.getComponentDisplayLowercase(a) < this.getComponentDisplayLowercase(b)
                        ? 1
                        : this.getComponentDisplayLowercase(a) > this.getComponentDisplayLowercase(b)
                          ? -1
                          : 0
                );
            case 'status':
                return tableArray.sort((a, b) =>
                    this.sortToLowercase(a.res[col]) < this.sortToLowercase(b.res[col])
                        ? 1
                        : this.sortToLowercase(a.res[col]) > this.sortToLowercase(b.res[col])
                          ? -1
                          : 0
                );
            case 'request_timestamp':
                return tableArray.sort((a, b) => this.sortDate(a.res[col], b.res[col], 'asc'));
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

    sortDate(a: any, b: any, type: string) {
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

    sortToLowercase(item) {
        if (typeof item === 'string') return item.toLowerCase();

        return item;
    }

    isValidDate(date) {
        return date instanceof Date && !isNaN(date.getTime());
    }

    getComponentDisplayLowercase(component: any) {
        let result = this.getComponentDisplay(component);

        if (typeof result === 'string') return result.toLowerCase();

        return result;
    }

    getComponentDisplay(component: any): string {
        if (component.type) {
            let componentDisplay = '';

            switch (component.type) {
                case 'artifact': {
                    if (component.payload_bin) {
                        if (component.hashes) {
                            const keys = Object.keys(component.hashes);
                            componentDisplay = component.hashes[keys[0]];
                        } else componentDisplay = component.id;
                    } else componentDisplay = component.url;
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

    clear(): void {
        this.unsortedQueryResults = [];
        this.statusId = '';
    }

    async getStatus() {
        await this.envService.checkAuth('/query-stix');

        if (!this.statusId) {
            return null;
        }
        this.isSearching = true;

        try {
            this.stixService
                .taxiiHttpReq('get', this.taxiiServer + this.envService.env.customConfiguration.sandbox.apiRoot + '/status/' + this.statusId + '/', {
                    headers: this.httpHeaders,
                })
                .subscribe(
                    (data: any) => {
                        this.openSubmission(data, true);
                        this.isSearching = false;
                    },
                    (err) => {
                        this.announcementService.show(
                            'Failed to retrieve status',
                            `Failed to retrieve status for ${this.statusId}. Error: ${err}`,
                            'error',
                            false
                        );
                        this.isSearching = false;
                        return null;
                    }
                );
        } catch (e) {
            this.announcementService.show('Failed to retrieve status', `Failed to retrieve status for ${this.statusId}. Error: ${e}`, 'error', false);
            this.isSearching = false;
            return null;
        }
    }

    openSubmission(submission, search = false) {
        let modalRef = this.modalService.open(SubmissionInfoComponent, { size: 'xl' });
        modalRef.componentInstance.submission = submission;
        modalRef.componentInstance.search = search;
    }
}

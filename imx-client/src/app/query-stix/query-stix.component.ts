import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, OnDestroy, ComponentRef, ViewContainerRef, ViewChild, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Observable, of, throwError, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { STIXObjectTypes } from './query-stix-constants';
import { DateTimeAdapter } from '@danielmoncada/angular-datetime-picker';
import { StixService } from '../stix-service.service';
import {
    faEdit,
    faFileArchive,
    faFileImport,
    faTrash,
    faQuestionCircle,
    faAngleUp,
    faAngleDown,
    faAngleDoubleDown,
    faAngleDoubleUp,
    faCog,
    faArrowRight,
    faArrowLeft,
    faClock,
    faStop,
    faCheck,
    faPlay,
    faUndo,
    faFilter,
    faLink,
    faFileExport,
    faPlus,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { SCO_LIST } from 'src/app/models/sco_list';
import { AdditionalFiltersComponent } from './additional-filters/additional-filters.component';
import { CustomizeColumnsComponent } from '../dialogs/customize-columns/customize-columns.component';
import { MatDialog } from '@angular/material/dialog';
import { RelationshipDialogComponent } from './relationship-dialog/relationship-dialog/relationship-dialog.component';
import { MessageService } from './message.service';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { SubmissionsService } from '../submissions-service/submissions.service';
import { EnvService } from '../env-service/env.service';
import { db } from '../db.service';

@Component({
    selector: 'app-query-stix',
    templateUrl: './query-stix.component.html',
    styleUrls: ['./query-stix.component.css'],
    standalone: false,
})
export class QueryStixComponent implements OnInit, OnDestroy {
    @Input() public analyst1View: any = false;

    faEdit = faEdit;
    faFileArchive = faFileArchive;
    faTrash = faTrash;
    faQuestionCircle = faQuestionCircle;
    faAngleUp = faAngleUp;
    faAngleDown = faAngleDown;
    faAngleDoubleDown = faAngleDoubleDown;
    faAngleDoubleUp = faAngleDoubleUp;
    faCog = faCog;
    faAddToBundle = faFileImport;
    faArrowRight = faArrowRight;
    faArrowLeft = faArrowLeft;
    faClock = faClock;
    faStop = faStop;
    faCheck = faCheck;
    faPlay = faPlay;
    faUndo = faUndo;
    faFilter = faFilter;
    faLink = faLink;
    faFileExport = faFileExport;
    faPlus = faPlus;
    faInfoCircle = faInfoCircle;

    currentAlert: any = undefined;
    currentApiRoot: string = '';
    currentCollection: string = '';
    localTimezone: string = '';

    nextAddedAfter: string = '';
    exportObjects: any[] = [];
    loadingExport: boolean = false;
    disableExport: boolean = true;

    form: UntypedFormGroup;
    APIRoots = [];
    collections = [];
    latency_collection_display: any[] = [];
    isCollapsed = false;
    customtaxiiServer = '';
    customTaxiiServerAuthType = this.stixService.taxiiServerAuthType;
    customTaxiiServerCreds: any = {};
    isLoadingRoots: boolean = false;
    isLoadingStix = false;
    isLoadingStixNext = false;
    selectedAPIRoot;
    selectedCollection;
    isObjects: boolean = false;
    isSpecificVersion: boolean = false;
    isExpanded: boolean = false;
    queryParams = {
        addedAfter: '',
        limit: this.envService.env.queryResultLimit + '',
        next: '',
        id: '',
        type: [],
        version: '',
        specific_version: '',
        specification_version: '',
        more: false,
        date_added_last: '',
    };
    noResults = true;
    apiRootProcessingError = '';
    objectsQueryResults: any[] = [];
    objectsCount: number = 0;
    unsortedQueryResults: any[];
    objectsQueryError = '';
    objectsQueryErrorURL = '';
    taxiiServer: string = '';
    taxiiServerType = this.stixService.taxiiServerType;
    versions = ['last', 'first', 'all', '<value>'];
    typeOptions = STIXObjectTypes;
    scoList = SCO_LIST;
    serverDiscoveryResults = '';
    serverDiscoveryQueryError = '';
    isServerDiscovery: boolean = false;
    isAPIRootInformation: boolean = false;
    APIRootInformationQueryError = '';
    APIRootInformationResults = '';
    collectionsQueryError = '';
    collectionsResults = '';
    isCollections = false;
    manifestsQueryResults: any[];
    publishedDict: {};
    manifestsQueryError = '';
    isManifests = false;
    statusQueryResults: '';
    statusQueryError = '';
    isStatus = false;
    statusid = '';
    public rownumber: number;
    activeMenuItem: any;
    isAllCheckboxSelected: boolean;
    openNewWindow: boolean;
    isOmitRevoked: boolean;
    addFilters: boolean = false;
    customServer: boolean = false;
    showMainSearch: boolean = true;
    showCustomServerConfig: boolean = false;
    showCustomizeColumns: boolean = false;
    modalRef: any;
    screenWidth;
    selectedCount: number = 0;
    cleaned: boolean = false;

    sortKey: string;
    objectReturnedCount: number = 0;
    obJson: any;

    setFirstRoot = false;
    setFirstCollection = false;

    isAdmin = false;

    userRoles = [];

    statusTable: any[];
    statusIDs: any[];
    currentStatusPage: number;
    totalStatusPages: number;
    isLoadingStatus: boolean;
    statusRowNumber: number;
    showStatusTable: boolean;

    globalSearch = false;
    globalSearchTerm = '';
    globalSearchPage = 1;
    globalQueryBody = '';

    tooltip = `You can select multiple items at once in Object Type using Ctrl+Click in Windows or
    Command+Click in macOS.`;

    @ViewChild('viewContainerRef', { read: ViewContainerRef })
    VCR: ViewContainerRef;

    @HostListener('window:resize', ['$event'])
    onWindowResize() {
        this.screenWidth = window.innerWidth;
    }

    child_unique_key: number = 0;
    componentsReferences = Array<ComponentRef<AdditionalFiltersComponent>>();
    existingCISAIdentity;
    customizeColumnsSubscription: Subscription;
    columns: any;

    constructor(
        public announcementService: AnnouncementService,
        private httpClient: HttpClient,
        private formBuilder: UntypedFormBuilder,
        dateTimeAdapter: DateTimeAdapter<any>,
        public stixService: StixService,
        private router: Router,
        public modalService: NgbModal,
        public relationshipDialog: MatDialog,
        public messageService: MessageService,
        private keycloak: KeycloakService,
        private submissions: SubmissionsService,
        private envService: EnvService
    ) {
        this.getTimeZone();
        switch (this.stixService.taxiiServerType) {
            case 'default':
            case 'a1':
            case 'sandbox':
            case 'cma':
                this.taxiiServer = `${this.stixService.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion}/`;
                break;
            case 'custom':
                this.taxiiServer = this.stixService.getCustomURL();
                break;
            default:
                this.taxiiServer = this.stixService.taxiiServer.url.replace(
                    `${this.envService.env.taxiiServer.apiVersion}/taxii2/`,
                    `${this.envService.env.taxiiServer.apiVersion}/`
                );
        }

        this.form = this.formBuilder.group({
            APIRoots: [''],
            collections: [''],
        });
        dateTimeAdapter.setLocale('en-US');
        this.isAllCheckboxSelected = false;

        this.typeOptions.sort(function (a, b) {
            let nameA = a.toLowerCase(),
                nameB = b.toLowerCase();
            if (nameA < nameB)
                //sort string ascending
                return -1;
            if (nameA > nameB) return 1;
            return 0; //default return value (no sorting)
        });

        this.openNewWindow = true; // Change to false for debugging

        this.columns = [
            { name: 'Name', checked: true },
            { name: 'Type', checked: true },
            { name: 'Published', checked: true },
            { name: 'Created', checked: true },
            { name: 'Modified', checked: true },
            { name: 'Actions', checked: true },
        ];

        this.statusIDs = [];
        this.statusTable = [];
        this.currentStatusPage = 1;
        this.isLoadingStatus = true;
        this.statusRowNumber = null;
        this.showStatusTable = false;

        if (this.taxiiServer === this.envService.env.aisTaxiiProxy.url) {
            this.queryParams.limit = '';
        }
    }

    ngOnInit(): void {
        this.stixService.getUnreadAlerts();
        this.isAdminUser();
        new Promise(async (resolve, reject) => {
            try {
                if (this.taxiiServerType === 'custom') {
                    const customUrl = localStorage.getItem('customUrl');
                    const imxHeaders = new HttpHeaders().set(
                        'Authorization',
                        `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`
                    );

                    const resp: any = await this.httpClient
                        .get(`${this.envService.env.imxServer.url}/taxii/${customUrl.replace('https://', '').replace('/', '')}`, {
                            headers: imxHeaders,
                        })
                        .toPromise();
                    this.stixService.taxiiServer.password = resp.password;
                    this.stixService.taxiiServer.username = resp.username;
                    if (resp.useCert) this.stixService.useCert = true;
                }

                this.customTaxiiServerCreds['username'] = this.stixService.taxiiServer.username;
                this.customTaxiiServerCreds['password'] = this.stixService.taxiiServer.password;
                this.customTaxiiServerCreds['certificate'] = null;
                this.screenWidth = window.innerWidth;
                this.existingCISAIdentity = this.envService.env.defaultIdentity.id;

                this.customizeColumnsSubscription = this.stixService.getData().subscribe((data) => {
                    if (data && data.data && data.data !== this.columns) {
                        this.objectsQueryResults = this.unsortedQueryResults;
                        this.sortKey = '';
                    }

                    if (data.data) {
                        this.columns = [];
                        for (let col of data.data) {
                            this.columns.push(col);
                        }
                    }
                });
                if (this.stixService.latencyInit === true) this.stixService.updateLatency(this.announcementService);

                if (this.envService.env.keycloak.enabled) {
                    this.userRoles = this.keycloak.getUserRoles();
                }

                try {
                    this.currentAlert = JSON.parse(localStorage['currentAlert']);
                    localStorage['currentAlert'] = undefined;
                } catch (e) {
                    console.error('not able to get currentAlert');
                }

                this.APIRoots = this.getAvailableAPIRoots();
                resolve(true);
            } catch (err) {
                console.error('Error while loading TAXII Client: ', err);
                resolve(true);
            }
        });
    }

    getTimeZone() {
        let date = new Date();
        let parts = new Intl.DateTimeFormat('en-US', {
            timeZoneName: 'short',
        }).formatToParts(date);

        this.localTimezone = parts.find((p) => p.type === 'timeZoneName')?.value;
    }

    showFilters = async () => {
        this.addFilters = !this.addFilters;

        if (!this.addFilters) {
            this.componentsReferences = [];
        }
    };

    createBundle(obj) {
        // Marks all objects as new_version_objects
        let new_version_objects = JSON.parse(localStorage.getItem('new_version_objects'));
        if (!new_version_objects) new_version_objects = [];
        let previous_new_version_objects = [...new_version_objects];
        if (new_version_objects) {
            if (!new_version_objects.includes(obj.id)) {
                new_version_objects.push(obj.id);
            } else {
                previous_new_version_objects = previous_new_version_objects.filter((element) => element !== obj.id);
            }
            obj.object_refs.forEach((ref) => {
                if (!new_version_objects.includes(ref)) new_version_objects.push(ref);
                else previous_new_version_objects = previous_new_version_objects.filter((element) => element !== ref);
            });
            localStorage.setItem('new_version_objects', JSON.stringify(new_version_objects));
            localStorage.setItem('previous_new_version_objects', JSON.stringify(previous_new_version_objects));
        }

        const index = this.announcementService.show(
            'Loading Objects from Report',
            'Please be patient. This process can take several minutes, depending on the number of objects and latency of the server used. You will be automatically redirected once this process is complete.',
            'warn',
            false,
            '',
            false,
            '',
            null,
            900000
        );

        localStorage.setItem('creating-bundle-from-report', 'true');
        localStorage.setItem('creating-bundle-from-report-name', obj.name);

        window.addEventListener(
            'storage',
            (event: StorageEvent) => {
                if (
                    event.storageArea &&
                    (event.storageArea['creating-bundle-from-report'] === 'false' || !event.storageArea['creating-bundle-from-report'])
                ) {
                    window.removeAllListeners('storage');
                    this.announcementService.toasts.splice(index, 1);
                    this.announcementService.show(
                        'Finished loading objects from Report',
                        'Successfully imported objets from Report to Bundle',
                        'success',
                        false
                    );
                }
            },
            false
        );

        let objs = obj.object_refs;
        objs.push(obj.id);
        this.getObjectsFromID(objs, true);
    }

    createFilterComponent() {
        let childComponentRef = this.VCR.createComponent(AdditionalFiltersComponent);

        let childComponent = childComponentRef.instance;
        childComponent.unique_key = ++this.child_unique_key;
        childComponent.parentRef = this;

        // add reference for newly created component
        this.componentsReferences.push(childComponentRef);
    }

    remove(key: number) {
        console.info('value of key received is: ', key);
        if (this.VCR.length < 1) return;

        let componentRef = this.componentsReferences.filter((x) => x.instance.unique_key == key)[0];

        componentRef.destroy();

        this.componentsReferences = this.componentsReferences.filter((x) => x.instance.unique_key !== key);
    }

    sort(col: string, table: string) {
        if (this.objectsQueryResults.length === 0 && table === 'objects') return;
        if (this.manifestsQueryResults.length === 0 && table === 'manifests') return;
        if (this.statusTable.length === 0 && table === 'status') return;

        if (this.rownumber !== null) this.rownumber = null;
        if (this.statusRowNumber !== null) this.statusRowNumber = null;

        if (!this.sortKey) {
            this.sortKey = '';
            this.unsortedQueryResults = [];

            if (table === 'objects') {
                for (let obj of this.objectsQueryResults) {
                    this.unsortedQueryResults.push(obj);
                }
            } else if (table === 'manifests') {
                for (let manifest of this.manifestsQueryResults) {
                    this.unsortedQueryResults.push(manifest);
                }
            } else if (table === 'status') {
                for (let status of this.statusTable) {
                    this.unsortedQueryResults.push(status);
                }
            }
        }

        if (this.sortKey === '') {
            if (table === 'objects') this.objectsQueryResults = this.sortResultsDes(col, this.objectsQueryResults);
            else if (table === 'manifests') this.manifestsQueryResults = this.sortResultsDes(col, this.manifestsQueryResults);
            else if (table === 'status') this.statusTable = this.sortResultsDes(col, this.statusTable);

            this.sortKey = `${col}-des`;
        } else {
            let keyArr = this.sortKey.split('-');
            if (col === keyArr[0] && keyArr[1] === 'des') {
                if (table === 'objects') this.objectsQueryResults = this.sortResultsAsc(col, this.objectsQueryResults);
                else if (table === 'manifests') this.manifestsQueryResults = this.sortResultsAsc(col, this.manifestsQueryResults);
                else if (table === 'status') this.statusTable = this.sortResultsAsc(col, this.statusTable);

                this.sortKey = `${col}-asc`;
            } else if (col === keyArr[0] && keyArr[1] === 'asc') {
                if (table === 'objects') this.objectsQueryResults = this.unsortedQueryResults;
                else if (table === 'manifests') this.manifestsQueryResults = this.unsortedQueryResults;
                else if (table === 'status') this.statusTable = this.unsortedQueryResults;

                this.sortKey = '';
            } else {
                if (table === 'objects') this.objectsQueryResults = this.sortResultsDes(col, this.objectsQueryResults);
                else if (table === 'manifests') this.manifestsQueryResults = this.sortResultsDes(col, this.manifestsQueryResults);
                else if (table === 'status') this.statusTable = this.sortResultsDes(col, this.statusTable);

                this.sortKey = `${col}-des`;
            }
        }
    }

    sortToLowercase(item) {
        if (typeof item === 'string') return item.toLowerCase();

        return item;
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
            case 'created':
            case 'modified':
            case 'date_added':
            case 'version':
                return tableArray.sort((a, b) => this.sortDate(a[col], b[col], 'des'));
            case 'published':
                return tableArray.sort((a, b) =>
                    this.sortDate(this.manifestsQueryResults[this.publishedDict[a.id]], this.manifestsQueryResults[this.publishedDict[b.id]], 'des')
                );
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
            case 'created':
            case 'modified':
            case 'date_added':
            case 'version':
                return tableArray.sort((a, b) => this.sortDate(a[col], b[col], 'asc'));
            case 'published':
                return tableArray.sort((a, b) =>
                    this.sortDate(this.manifestsQueryResults[this.publishedDict[a.id]], this.manifestsQueryResults[this.publishedDict[b.id]], 'asc')
                );
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

    isValidDate(date) {
        return date instanceof Date && !isNaN(date.getTime());
    }
    private httpHeaders = new HttpHeaders()
        .set('Accept', 'application/taxii+json;version=2.1')
        .set('Authorization', `Basic ${btoa(this.stixService.taxiiServer.username + ':' + this.stixService.taxiiServer.password)}`);

    clear(): void {
        this.queryParams = {
            addedAfter: '',
            limit: '',
            id: '',
            type: [],
            version: '',
            specific_version: '',
            specification_version: '',
            more: false,
            next: '',
            date_added_last: '',
        };
        this.globalSearchTerm = '';
        this.objectsQueryResults = [];
        this.unsortedQueryResults = [];
        this.objectsCount = 0;
        this.objectsQueryError = '';
        this.objectsQueryErrorURL = '';
        this.noResults = true;
        this.statusid = '';
        this.manifestsQueryResults = [];
        this.manifestsQueryError = '';
        this.isAllCheckboxSelected = false;
        this.componentsReferences.forEach((x) => {
            this.remove(x.instance.unique_key);
        });
        this.showStatusTable = true;
        this.statusRowNumber = null;
    }

    isQueryDisabled(): boolean {
        if (this.isLoadingStix) {
            return true;
        }

        if ((this.taxiiServerType === 'default' || this.taxiiServerType === 'cma') && this.isLoadingRoots) {
            return true;
        }

        if (
            this.taxiiServerType === 'custom' &&
            this.customTaxiiServerAuthType !== 'keycloak' &&
            (!this.customTaxiiServerCreds.username || !this.customTaxiiServerCreds.password)
        ) {
            return true;
        }

        return false;
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

    queryString = '';

    getNextObjects(): void {
        this.sortKey = '';
        this.isLoadingStixNext = true;

        for (let object of this.objectsQueryResults) {
            if (!object['published']) {
                object['published'] = this.getPublished(object);
            } else {
                object['manifest_published'] = this.getPublished(object);
            }
            this.exportObjects.push(object);
        }

        if (this.envService.env.aisTaxiiProxy.url === this.taxiiServer && this.nextAddedAfter !== '') {
            this.queryParams.addedAfter = `${this.nextAddedAfter}`;
        }

        this.getObjects(true);
    }

    selectedObjects = [];
    deleteSelectedObjects(): void {
        this.objectsQueryResults.forEach((stixObject) => {
            if (stixObject.checked) {
                if (stixObject.type === 'identity') {
                    let idStorage: any = localStorage.getItem('identities');
                    if (idStorage) {
                        try {
                            idStorage = JSON.parse(idStorage);
                            const idStorageIndex = idStorage.arr.findIndex((idStorage) => idStorage.id === stixObject.id);
                            if (idStorageIndex !== -1) {
                                idStorage.arr.splice(idStorageIndex, 1);
                                localStorage.setItem('identities', JSON.stringify(idStorage));
                            }
                        } catch (e) {
                            console.error('Error parsing saved identities with message: ', e);
                            localStorage.removeItem('identities');
                        }
                    }
                }
                this.objectsQueryResults = this.objectsQueryResults.filter((h) => h !== stixObject);
                this.unsortedQueryResults = this.objectsQueryResults;
                this.deleteObject(this.taxiiServer, this.selectedAPIRoot, this.selectedCollection, stixObject.id, stixObject.modified).subscribe(() =>
                    this.isAllCheckBoxChecked()
                );
            }
        });
    }

    updateSelectedObjects(id: number, modified: string, checked: boolean) {
        if (checked === true) {
            this.selectedObjects.push(id);
        } else {
            for (let i = 0; i < this.selectedObjects.length; i++) {
                if (id === this.selectedObjects[i]) this.selectedObjects.splice(i, 1);
            }
        }
        this.isAllCheckBoxChecked();
    }

    isAllCheckBoxChecked() {
        if (this.objectsQueryResults.length) {
            this.isAllCheckboxSelected = this.objectsQueryResults.every((p) => p.checked);
        } else {
            this.isAllCheckboxSelected = false;
        }
    }

    checkAllCheckBox(ev: any) {
        this.objectsQueryResults.forEach((x) => (x.checked = ev.target.checked));
        this.unsortedQueryResults.forEach((x) => (x.checked = ev.target.checked));
    }

    public onOmitRevokedChanged(value: any) {
        this.isOmitRevoked = value.target.checked;
    }

    async getPublishedDate(header) {
        let getURL = this.taxiiServer + this.selectedAPIRoot + '/collections/' + this.selectedCollection + '/manifest/' + this.queryString;
        console.info(`Manifest Request URL: ${getURL}`);
        return new Promise((resolve) => {
            try {
                this.stixService.taxiiHttpReq('get', getURL, { headers: header, observe: 'response' }).subscribe(
                    (manifestResp: any) => {
                        console.info('Manifest Resp:', manifestResp);
                        try {
                            if (manifestResp.body['objects']) {
                                for (let j = 0; j < manifestResp.body['objects'].length; j++) {
                                    let localDate = new Date(manifestResp.body['objects'][j].date_added);
                                    this.manifestsQueryResults.push(localDate.toString().replace(/GMT.*/g, ''));
                                }
                                resolve('succeeded');
                            } else {
                                this.manifestsQueryError = 'No objects were returned by the TAXII server. Check your parameters and try again';
                                resolve('error');
                            }
                        } catch (err) {
                            this.manifestsQueryError = `**Error Name: ${err.name} Error Message: ${err.message}**`;
                            resolve('error');
                        }

                        this.noResults = false;
                        this.isLoadingStix = false;
                    },
                    (err) => {
                        console.error('Unable to get query results. Error code: %s, URL: %s ', err.status, err.url);
                        this.manifestsQueryError = `**Error Code: ${err.status}, URL: ${err.url}**`;
                        this.isLoadingStix = false;
                        this.noResults = false;
                        resolve('error');
                    }
                );
            } catch (err) {
                this.manifestsQueryError = `**Error Name: ${err.name} Error Message: ${err.message}**`;
                this.isLoadingStix = false;
                resolve('error');
            }
        });
    }

    refreshTaxiiCreds() {
        switch (this.stixService.taxiiServerType) {
            case 'default':
            case 'a1':
            case 'sandbox':
            case 'cma':
                this.taxiiServer = `${this.stixService.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion}/`;
                this.httpHeaders = new HttpHeaders()
                    .set('Accept', 'application/taxii+json;version=2.1')
                    .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);
                break;
            case 'custom':
                this.taxiiServer = this.stixService.getCustomURL();
                break;
            default:
                this.taxiiServer = this.stixService.taxiiServer.url.replace(
                    `${this.envService.env.taxiiServer.apiVersion}/taxii2/`,
                    `${this.envService.env.taxiiServer.apiVersion}/`
                );
        }
    }

    async getObjects(nextObjects: boolean = false) {
        await this.envService.checkAuth('/query-stix');

        this.nextAddedAfter = '';

        if (!nextObjects) {
            this.isLoadingStix = true;
        }
        this.objectsQueryError = '';
        this.objectsQueryErrorURL = '';
        this.objectsQueryResults.splice(0);
        this.unsortedQueryResults = [];
        this.sortKey = undefined;
        this.objectsCount = 0;
        this.isAllCheckboxSelected = false;
        this.rownumber = null;
        this.statusRowNumber = null;
        this.cleaned = false;
        try {
            if (nextObjects === true) {
                if (!this.globalSearch) {
                    if (this.queryParams.next) {
                        if (this.queryString.indexOf('next=') != -1) {
                            this.queryString = this.queryString.substring(0, this.queryString.indexOf('next=') + 5) + this.queryParams.next;
                        } else {
                            if (
                                this.queryParams.addedAfter ||
                                this.queryParams.type.length > 0 ||
                                this.queryParams.id ||
                                this.queryParams.limit ||
                                this.queryParams.version ||
                                this.queryParams.specific_version ||
                                this.queryParams.specification_version
                            ) {
                                this.queryString = this.queryString.concat('&next=' + this.queryParams.next);
                            } else {
                                this.queryString = this.queryString.concat('?next=' + this.queryParams.next);
                            }
                        }
                    } else {
                        if (this.queryString.indexOf('added_after=') != -1) {
                            let startIndex = this.queryString.indexOf('added_after=') + 12;
                            let endIndex = this.queryString.indexOf('&', startIndex) != -1 ? this.queryString.indexOf('&', startIndex) : -1;
                            if (endIndex != -1) {
                                this.queryString =
                                    this.queryString.substring(0, startIndex) +
                                    this.queryParams.date_added_last +
                                    this.queryString.substring(endIndex, this.queryString.length);
                            } else {
                                this.queryString = this.queryString.substring(0, startIndex) + this.queryParams.date_added_last;
                            }
                        } else {
                            if (
                                this.queryParams.type.length > 0 ||
                                this.queryParams.id ||
                                this.queryParams.limit ||
                                this.queryParams.version ||
                                this.queryParams.specific_version ||
                                this.queryParams.specification_version
                            ) {
                                this.queryString = this.queryString.concat('&added_after=' + this.queryParams.date_added_last);
                            } else {
                                this.queryString = this.queryString.concat('?added_after=' + this.queryParams.date_added_last);
                            }
                        }
                    }
                } else {
                    this.globalSearchPage++;
                }
            } else {
                this.queryString = '';
                this.globalQueryBody = '';
                this.globalSearchPage = 1;
                if (!this.globalSearch && (!this.selectedAPIRoot || !this.selectedCollection)) {
                    this.objectsQueryError = '**You must select an API Root and a Collection first**';
                    this.isLoadingStix = false;
                    return;
                }
                let firstParamExists = false;

                if (this.queryParams.addedAfter !== null && typeof this.queryParams.addedAfter === 'object') {
                    if (!this.globalSearch) {
                        this.queryString += '?added_after=' + `${this.toISOLocal(this.queryParams.addedAfter)}`;
                        firstParamExists = true;
                    } else {
                        this.globalQueryBody += 'created:[' + `${this.toISOLocal(this.queryParams.addedAfter)}` + ' TO *]';
                    }
                }
                if (this.queryParams.type.length > 0) {
                    if (!this.globalSearch) {
                        if (firstParamExists === true) {
                            this.queryString = this.queryString + '&';
                        } else {
                            this.queryString = this.queryString + '?';
                        }
                        this.queryString += `match[type]=`;
                        for (let i = 0; i < this.queryParams.type.length; i++) {
                            this.queryString += `${this.queryParams.type[i]}${i + 1 == this.queryParams.type.length ? '' : ','}`;
                        }
                        firstParamExists = true;
                    } else {
                        if (this.globalQueryBody.length > 0) {
                            this.globalQueryBody += ' AND ';
                        }
                        this.globalQueryBody += `type.keyword:`;
                        for (let i = 0; i < this.queryParams.type.length; i++) {
                            this.globalQueryBody += `${this.queryParams.type[i]}${i + 1 == this.queryParams.type.length ? '' : ','}`;
                        }
                    }
                }
                if (this.queryParams.id.length > 0) {
                    if (firstParamExists === true) {
                        this.queryString = this.queryString + '&match[id]=' + this.queryParams.id;
                    } else {
                        this.queryString = this.queryString + '?match[id]=' + this.queryParams.id;
                    }
                    firstParamExists = true;
                }
                if (this.queryParams.version.length > 0) {
                    if (firstParamExists === true) {
                        if (this.queryParams.version === '<value>') {
                            if (this.queryParams.specific_version.length > 0) {
                                this.queryString += `&match[version]=` + this.queryParams.specific_version;
                            } else {
                                throwError(() => new Error('Please provide the timestamp value of the Version in the Specific Version field.'));
                            }
                        } else {
                            this.queryString += `&match[version]=` + this.queryParams.version;
                        }
                        firstParamExists = true;
                    } else {
                        throwError(() => new Error('A request must contain other parameters in addition to Version.'));
                    }
                }
                if (this.queryParams.limit.length > 0) {
                    if (!this.globalSearch) {
                        if (firstParamExists === true) {
                            this.queryString = this.queryString + '&';
                        } else {
                            this.queryString = this.queryString + '?';
                        }
                        this.queryString += `limit=` + this.queryParams.limit;
                        firstParamExists = true;
                    }
                }
                if (this.queryParams.specification_version.length > 0) {
                    if (firstParamExists === true) {
                        this.queryString = this.queryString + '&';
                    } else {
                        this.queryString = this.queryString + '?';
                    }
                    this.queryString += `match[spec_version]=` + this.queryParams.specification_version;
                    firstParamExists = true;
                }

                if (this.componentsReferences.length > 0 && this.addFilters) {
                    this.componentsReferences.forEach((cr) => {
                        if (
                            cr.instance.type === 'top-level property' ||
                            cr.instance.type === 'top-level property of type list' ||
                            cr.instance.type === 'property within nested structures'
                        ) {
                            if (firstParamExists === true) {
                                this.queryString = this.queryString + '&';
                            } else {
                                this.queryString = this.queryString + '?';
                            }

                            let matchType = `match[${cr.instance.attribute}]=`;
                            let index = this.queryString.indexOf(matchType);
                            if (index >= 0) {
                                let newValue = cr.instance.value + ',';
                                let prevValue = this.queryString.slice(index + matchType.length);
                                this.queryString = this.queryString.slice(0, index + matchType.length) + newValue + prevValue;
                            } else {
                                this.queryString += matchType + cr.instance.value;
                            }
                            firstParamExists = true;
                        }

                        if (cr.instance.type === 'relationships') {
                            if (firstParamExists === true) {
                                this.queryString = this.queryString + '&';
                            } else {
                                this.queryString = this.queryString + '?';
                            }

                            let matchType = 'match[relationships-all]=';
                            let index = this.queryString.indexOf(matchType);
                            if (index >= 0) {
                                let newValue = cr.instance.value + ',';
                                let prevValue = this.queryString.slice(index + matchType.length);
                                this.queryString = this.queryString.slice(0, index + matchType.length) + newValue + prevValue;
                            } else {
                                this.queryString += matchType + cr.instance.value;
                            }
                            firstParamExists = true;
                        }

                        if (cr.instance.type === 'created by') {
                            if (firstParamExists === true) {
                                this.queryString = this.queryString + '&';
                            } else {
                                this.queryString = this.queryString + '?';
                            }
                            const sign = cr.instance.sign;

                            let matchType = 'match[created_by_ref]=';
                            let index = this.queryString.indexOf(matchType);
                            if (index >= 0) {
                                let newValue = cr.instance.value + ',';
                                let prevValue = this.queryString.slice(index + matchType.length);
                                this.queryString = this.queryString.slice(0, index + matchType.length) + newValue + prevValue;
                            } else {
                                this.queryString += matchType + cr.instance.value;
                            }
                            firstParamExists = true;
                        }

                        if (cr.instance.type === 'calculations') {
                            if (firstParamExists === true) {
                                this.queryString = this.queryString + '&';
                            } else {
                                this.queryString = this.queryString + '?';
                            }
                            const sign = cr.instance.sign === '>=' ? 'gte' : 'lte';
                            let value: any = null;
                            if (
                                cr.instance.type === 'calculations' &&
                                (cr.instance.attribute === 'modified' ||
                                    cr.instance.attribute === 'valid_until' ||
                                    cr.instance.attribute === 'valid_from')
                            ) {
                                value = cr.instance.value;
                                if (value) {
                                    value.setSeconds(0, 0);
                                    value = value.toISOString();
                                }
                            } else {
                                value = cr.instance.value;
                            }

                            let matchType = `match[${cr.instance.attribute}-${sign}]=`;
                            let index = this.queryString.indexOf(matchType);
                            if (index >= 0) {
                                let newValue = cr.instance.value + ',';
                                let prevValue = this.queryString.slice(index + matchType.length);
                                this.queryString = this.queryString.slice(0, index + matchType.length) + newValue + prevValue;
                            } else {
                                this.queryString += matchType + value;
                            }
                            firstParamExists = true;
                        }
                    });
                }
            }
        } catch (e) {
            this.objectsQueryError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
            this.isLoadingStix = false;
        }

        this.loadingExport = true;
        this.disableExport = true;

        try {
            if (!this.globalSearch) {
                let getURL = this.taxiiServer + this.selectedAPIRoot + '/collections/' + this.selectedCollection + '/objects/' + this.queryString;
                this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                    this.stixService.taxiiHttpReq('get', getURL, { headers: header, observe: 'response' }).subscribe(
                        async (resp: any) => {
                            try {
                                this.nextAddedAfter = resp.headers.get('X-TAXII-Date-Added-Last') ? resp.headers.get('X-TAXII-Date-Added-Last') : '';
                            } catch (e) {
                                this.nextAddedAfter = '';
                            }

                            this.objectReturnedCount = 0;
                            try {
                                if (resp.body['objects']) {
                                    this.objectsQueryResults = new Array();
                                    this.manifestsQueryResults = new Array();
                                    this.publishedDict = {};

                                    await this.getPublishedDate(header);

                                    if (this.isOmitRevoked == true) {
                                        for (let i = 0; i < resp.body['objects'].length; i++) {
                                            if (
                                                typeof resp.body['objects'][i]['revoked'] !== undefined &&
                                                resp.body['objects'][i]['revoked'] !== true
                                            ) {
                                                this.objectsQueryResults.push(resp.body['objects'][i]);
                                                this.publishedDict[resp.body['objects'][i].id] = this.objectsCount;
                                                this.objectsCount++;
                                            }
                                        }
                                    } else {
                                        for (let i = 0; i < resp.body['objects'].length; i++) {
                                            this.objectsQueryResults.push(resp.body['objects'][i]);
                                            this.publishedDict[resp.body['objects'][i].id] = this.objectsCount;
                                            this.objectsCount++;
                                        }
                                    }

                                    this.loadingExport = false;
                                    this.disableExport = false;
                                    this.isLoadingStixNext = false;

                                    if (resp.body['more'] && resp.body['more'] === true) {
                                        this.queryParams.more = resp.body['more'];
                                        if (resp.body['next']) {
                                            this.queryParams.next = resp.body['next'];
                                        } else if (resp.headers.get('X-TAXII-Date-Added-Last')) {
                                            this.queryParams.date_added_last = resp.headers.get('X-TAXII-Date-Added-Last');
                                        }
                                    } else {
                                        this.queryParams.more = false;
                                    }
                                } else {
                                    this.objectsQueryError = 'No objects were returned by the TAXII server. Check your parameters and try again';
                                    this.loadingExport = false;
                                }
                            } catch (e) {
                                this.objectsQueryError = `**Error Name: ${e.name}, Error Message: ${e.message}**`;
                                return;
                            }
                            this.noResults = false;
                            this.isLoadingStix = false;
                        },
                        (err) => {
                            this.isLoadingStix = false;
                            let status = err.status;
                            if (!status) {
                                status = err.http_status;
                            }
                            let errMessage = `Error code [${err.status}]: ${this.stixService.generateHTTPError(err.status)}`;
                            if (err.error.title && err.error.description && err.error.description.length > 0 && err.error.title.length > 0) {
                                errMessage = err.error.title + ' - ' + err.error.description;
                            }
                            let errCode = '';
                            err.status == '0' ? (errCode = 'CORS/Firewall') : (errCode = err.staus);
                            console.error('Unable to get query results. Error code: %s, URL: %s ', errCode, err.url);
                            this.objectsQueryError = errMessage;
                            this.noResults = false;
                        }
                    );
                });
            } else {
                let getUrl = this.stixService.taxiiServer.url + 'ext/v1.0/search/' + this.queryString;

                if (this.globalSearchTerm) {
                    if (this.globalQueryBody.length > 0) this.globalQueryBody += ' AND ';
                    this.globalQueryBody += `"${this.globalSearchTerm}"`;
                }

                if (this.globalQueryBody.length === 0) {
                    for (const type of this.typeOptions) {
                        if (this.globalQueryBody.length > 0) this.globalQueryBody += ' OR ';
                        this.globalQueryBody += 'type.keyword: ' + type;
                    }
                }

                this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                    this.stixService
                        .taxiiHttpReq(
                            'post',
                            getUrl,
                            { headers: header.set('Accept', '*/*').set('Content-Type', 'application/json'), observe: 'response' },
                            {
                                query: this.globalQueryBody,
                                from: (this.globalSearchPage - 1) * Number(this.queryParams.limit),
                                size: this.queryParams.limit,
                            }
                        )
                        .subscribe(
                            async (resp: any) => {
                                this.objectReturnedCount = 0;
                                try {
                                    if (resp?.body?.founds) {
                                        this.objectsQueryResults = new Array();
                                        this.manifestsQueryResults = new Array();
                                        this.publishedDict = {};

                                        if (this.isOmitRevoked == true) {
                                            for (let i = 0; i < resp.body.founds.length; i++) {
                                                if (typeof resp.body.founds[i].object['revoked'] !== undefined) {
                                                    if (resp.body.founds[i].object['revoked'] !== true) {
                                                        this.objectsQueryResults.push(resp.body.founds[i].object);
                                                        this.publishedDict[resp.body.founds[i].object.id] = this.objectsCount;
                                                        this.objectsCount++;
                                                        try {
                                                            for (const apiRoot in resp.body.founds[i].fcPairs) {
                                                                for (const collection of resp.body.founds[i].fcPairs[apiRoot]) {
                                                                    let getURL =
                                                                        this.taxiiServer +
                                                                        apiRoot +
                                                                        '/collections/' +
                                                                        collection +
                                                                        '/manifest/' +
                                                                        '?match[id]=' +
                                                                        resp.body.founds[i].object.id;
                                                                    this.stixService
                                                                        .taxiiHttpReq('get', getURL, { headers: header, observe: 'response' })
                                                                        .subscribe(
                                                                            (manifestResp: any) => {
                                                                                try {
                                                                                    if (manifestResp.body['objects']) {
                                                                                        for (
                                                                                            let j = 0;
                                                                                            j < manifestResp.body['objects'].length;
                                                                                            j++
                                                                                        ) {
                                                                                            let localDate = new Date(
                                                                                                manifestResp.body['objects'][j].date_added
                                                                                            );
                                                                                            this.manifestsQueryResults.push(
                                                                                                localDate.toString().replace(/GMT.*/g, '')
                                                                                            );
                                                                                        }
                                                                                    } else {
                                                                                        this.manifestsQueryError =
                                                                                            'No objects were returned by the TAXII server. Check your parameters and try again';
                                                                                    }
                                                                                } catch (e) {
                                                                                    this.manifestsQueryError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
                                                                                    return;
                                                                                }
                                                                                this.noResults = false;
                                                                                this.isLoadingStix = false;
                                                                            },
                                                                            (err) => {
                                                                                console.error(
                                                                                    'Unable to get query results. Error code: %s, URL: %s ',
                                                                                    err.status,
                                                                                    err.url
                                                                                );
                                                                                this.manifestsQueryError = `**Error Code: ${err.status}, URL: ${err.url}**`;
                                                                                this.isLoadingStix = false;
                                                                                this.noResults = false;
                                                                            }
                                                                        );
                                                                }
                                                            }
                                                        } catch (e) {
                                                            this.manifestsQueryError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
                                                            this.isLoadingStix = false;
                                                            return;
                                                        }
                                                    }
                                                } else {
                                                    this.objectsQueryResults.push(resp.body.founds[i].object);
                                                    this.publishedDict[resp.body.founds[i].object.id] = this.objectsCount;
                                                    this.objectsCount++;
                                                    try {
                                                        for (const apiRoot in resp.body.founds[i].fcPairs) {
                                                            for (const collection of resp.body.founds[i].fcPairs[apiRoot]) {
                                                                let getURL =
                                                                    this.taxiiServer +
                                                                    apiRoot +
                                                                    '/collections/' +
                                                                    collection +
                                                                    '/manifest/' +
                                                                    '?match[id]=' +
                                                                    resp.body.founds[i].object.id;
                                                                this.stixService
                                                                    .taxiiHttpReq('get', getURL, { headers: this.httpHeaders, observe: 'response' })
                                                                    .subscribe(
                                                                        (manifestResp: any) => {
                                                                            try {
                                                                                if (manifestResp.body['objects']) {
                                                                                    for (let j = 0; j < manifestResp.body['objects'].length; j++) {
                                                                                        let localDate = new Date(
                                                                                            manifestResp.body['objects'][j].date_added
                                                                                        );
                                                                                        this.manifestsQueryResults.push(
                                                                                            localDate.toString().replace(/GMT.*/g, '')
                                                                                        );
                                                                                    }
                                                                                } else {
                                                                                    this.manifestsQueryError =
                                                                                        'No objects were returned by the TAXII server. Check your parameters and try again';
                                                                                }
                                                                            } catch (e) {
                                                                                this.manifestsQueryError = `**Error Name: ${e.name} Error Message ${e.message}**`;
                                                                                return;
                                                                            }
                                                                            this.noResults = false;
                                                                            this.isLoadingStix = false;
                                                                        },
                                                                        (err) => {
                                                                            console.error(
                                                                                'Unable to get query results. Error code: %s, URL: %s ',
                                                                                err.status,
                                                                                err.url
                                                                            );
                                                                            this.manifestsQueryError = `**Error Code: ${err.status}, URL: ${err.url}**`;
                                                                            this.isLoadingStix = false;
                                                                            this.noResults = false;
                                                                        }
                                                                    );
                                                            }
                                                        }
                                                    } catch (e) {
                                                        this.manifestsQueryError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
                                                        this.isLoadingStix = false;
                                                        return;
                                                    }
                                                }
                                            }
                                        } else {
                                            for (let i = 0; i < resp.body.founds.length; i++) {
                                                this.objectsQueryResults.push(resp.body.founds[i].object);
                                                this.publishedDict[resp.body.founds[i].object.id] = this.objectsCount;
                                                this.objectsCount++;

                                                try {
                                                    for (const apiRoot in resp.body.founds[i].fcPairs) {
                                                        for (const collection of resp.body.founds[i].fcPairs[apiRoot]) {
                                                            let getURL =
                                                                this.taxiiServer +
                                                                apiRoot +
                                                                '/collections/' +
                                                                collection +
                                                                '/manifest/' +
                                                                '?match[id]=' +
                                                                resp.body.founds[i].object.id;
                                                            this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                                                                this.stixService
                                                                    .taxiiHttpReq('get', getURL, { headers: header, observe: 'response' })
                                                                    .subscribe(
                                                                        (manifestResp: any) => {
                                                                            this.objectReturnedCount++;

                                                                            try {
                                                                                if (manifestResp.body['objects']) {
                                                                                    for (let j = 0; j < manifestResp.body['objects'].length; j++) {
                                                                                        let localDate = new Date(
                                                                                            manifestResp.body['objects'][j].date_added
                                                                                        );
                                                                                        this.manifestsQueryResults.push(
                                                                                            localDate.toString().replace(/GMT.*/g, '')
                                                                                        );
                                                                                    }
                                                                                } else {
                                                                                    this.manifestsQueryError =
                                                                                        'No objects were returned by the TAXII server. Check your parameters and try again';
                                                                                }
                                                                            } catch (e) {
                                                                                this.manifestsQueryError = `**Error Name: ${e.name} Error Messages: ${e.message}**`;
                                                                                return;
                                                                            }
                                                                            this.noResults = false;

                                                                            if (this.objectReturnedCount === this.objectsCount) {
                                                                                this.isLoadingStix = false;
                                                                                this.isLoadingStixNext = false;
                                                                                this.loadingExport = false;
                                                                                this.disableExport = false;
                                                                                const data = {
                                                                                    type: 'loading-objects-complete',
                                                                                };
                                                                                this.stixService.sendData(data);
                                                                            }
                                                                        },
                                                                        (err) => {
                                                                            console.error(
                                                                                'Unable to get query results. Error code: %s, URL: %s ',
                                                                                err.status,
                                                                                err.url
                                                                            );
                                                                            this.manifestsQueryError = `**Error code: ${err.status}, URL: ${err.url}**`;
                                                                            this.isLoadingStix = false;
                                                                            this.noResults = false;
                                                                        }
                                                                    );
                                                            });
                                                        }
                                                    }
                                                } catch (e) {
                                                    this.manifestsQueryError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
                                                    this.isLoadingStix = false;
                                                    return;
                                                }
                                            }
                                        }
                                        if (resp.body['total'] && this.globalSearchPage * Number(this.queryParams.limit) < resp.body['total']) {
                                            this.queryParams.more = true;
                                        } else {
                                            this.queryParams.more = false;
                                        }
                                    } else {
                                        this.objectsQueryError = 'No objects were returned by the TAXII server. Check your parameters and try again';
                                    }
                                } catch (e) {
                                    this.objectsQueryError = `**Error Name: ${e.name}, Error Message: ${e.message}**`;
                                    return;
                                }
                                this.noResults = false;
                                this.isLoadingStix = false;
                            },
                            (err) => {
                                this.isLoadingStix = false;
                                let status = err.status;
                                if (!status) {
                                    status = err.http_status;
                                }
                                let errMessage = `Error code [${err.status}]: ${this.stixService.generateHTTPError(err.status)}`;
                                if (err.error.title && err.error.description && err.error.description.length > 0 && err.error.title.length > 0) {
                                    errMessage = err.error.title + ' - ' + err.error.description;
                                }
                                let errCode = '';
                                err.status == '0' ? (errCode = 'CORS/Firewall') : (errCode = err.staus);
                                console.error('Unable to get query results. Error code: %s, URL: %s ', errCode, err.url);
                                this.objectsQueryError = errMessage;
                                this.noResults = false;
                            }
                        );
                });
            }
        } catch (e) {
            this.objectsQueryError = `**Error Name: ${e.name}  Error Message: ${e.message}**`;
            this.isLoadingStix = false;
            return;
        }
    }

    getNextManifests(): void {
        for (let object of this.manifestsQueryResults) {
            if (!object['published']) {
                object['published'] = this.getPublished(object);
            } else {
                object['manifest_published'] = this.getPublished(object);
            }
            this.exportObjects.push(object);
        }
        this.getManifests(true);
    }

    manifestsQueryString = '';
    async getManifests(nextManifests?: boolean) {
        await this.envService.checkAuth('/query-stix');

        this.loadingExport = true;
        this.disableExport = true;

        this.isLoadingStix = true;
        this.manifestsQueryError = '';
        this.sortKey = undefined;
        this.unsortedQueryResults = [];
        this.manifestsQueryResults.splice(0);
        let timePublished = undefined;
        let sign = '';
        try {
            if (nextManifests === true) {
                if (this.queryParams.next) {
                    if (this.manifestsQueryString.indexOf('next=') != -1) {
                        this.manifestsQueryString =
                            this.manifestsQueryString.substring(0, this.manifestsQueryString.indexOf('next=') + 5) + this.queryParams.next;
                    } else {
                        if (
                            this.queryParams.addedAfter ||
                            this.queryParams.type.length > 0 ||
                            this.queryParams.id ||
                            this.queryParams.limit ||
                            this.queryParams.version ||
                            this.queryParams.specific_version ||
                            this.queryParams.specification_version
                        ) {
                            this.manifestsQueryString = this.manifestsQueryString.concat('&next=' + this.queryParams.next);
                        } else {
                            this.manifestsQueryString = this.manifestsQueryString.concat('?next=' + this.queryParams.next);
                        }
                    }
                } else {
                    if (this.manifestsQueryString.indexOf('added_after=') != -1) {
                        let startIndex = this.manifestsQueryString.indexOf('added_after=') + 12;
                        let endIndex =
                            this.manifestsQueryString.indexOf('&', startIndex) != -1 ? this.manifestsQueryString.indexOf('&', startIndex) : -1;
                        if (endIndex != -1) {
                            this.manifestsQueryString =
                                this.manifestsQueryString.substring(0, startIndex) +
                                this.queryParams.date_added_last +
                                this.manifestsQueryString.substring(endIndex, this.manifestsQueryString.length);
                        } else {
                            this.manifestsQueryString = this.manifestsQueryString.substring(0, startIndex) + this.queryParams.date_added_last;
                        }
                    } else {
                        if (
                            this.queryParams.type.length > 0 ||
                            this.queryParams.id ||
                            this.queryParams.limit ||
                            this.queryParams.version ||
                            this.queryParams.specific_version ||
                            this.queryParams.specification_version
                        ) {
                            this.manifestsQueryString = this.manifestsQueryString.concat('&added_after=' + this.queryParams.date_added_last);
                        } else {
                            this.manifestsQueryString = this.manifestsQueryString.concat('?added_after=' + this.queryParams.date_added_last);
                        }
                    }
                }
            } else {
                this.manifestsQueryString = '';
                if (!this.selectedAPIRoot || !this.selectedCollection) {
                    this.manifestsQueryError = '**You must select an API Root and a Collection first**';
                    this.isLoadingStix = false;
                    return;
                }
                let firstParamExists = false;
                if (this.queryParams.addedAfter !== null && typeof this.queryParams.addedAfter === 'object') {
                    this.manifestsQueryString += '?added_after=' + `${this.toISOLocal(this.queryParams.addedAfter)}`;
                    firstParamExists = true;
                }
                if (this.queryParams.type.length > 0) {
                    if (firstParamExists === true) {
                        this.manifestsQueryString = this.manifestsQueryString + '&';
                    } else {
                        this.manifestsQueryString = this.manifestsQueryString + '?';
                    }
                    this.manifestsQueryString += `match[type]=`;
                    for (let i = 0; i < this.queryParams.type.length; i++) {
                        this.manifestsQueryString += `${this.queryParams.type[i]}${i + 1 == this.queryParams.type.length ? '' : ','}`;
                    }
                    firstParamExists = true;
                }
                if (this.queryParams.id.length > 0) {
                    if (firstParamExists === true) {
                        this.manifestsQueryString = this.manifestsQueryString + '&match[id]=' + this.queryParams.id;
                    } else {
                        this.manifestsQueryString = this.manifestsQueryString + '?match[id]=' + this.queryParams.id;
                    }
                    firstParamExists = true;
                }
                if (this.queryParams.version.length > 0) {
                    if (firstParamExists === true) {
                        if (this.queryParams.version === '<value>') {
                            if (this.queryParams.specific_version.length > 0) {
                                this.manifestsQueryString += `&match[version]=` + this.queryParams.specific_version;
                            } else {
                                throwError(() => new Error('Please provide the timestamp value of the Version in the Specific Version field.'));
                            }
                        } else {
                            this.manifestsQueryString += `&match[version]=` + this.queryParams.version;
                        }
                        firstParamExists = true;
                    } else {
                        throwError(() => new Error('A request must contain other parameters in addition to Version.'));
                    }
                }
                if (this.queryParams.limit.length > 0) {
                    if (firstParamExists === true) {
                        this.manifestsQueryString = this.manifestsQueryString + '&';
                    } else {
                        this.manifestsQueryString = this.manifestsQueryString + '?';
                    }
                    this.manifestsQueryString += `limit=` + this.queryParams.limit;
                    firstParamExists = true;
                }
                if (this.queryParams.specification_version.length > 0) {
                    if (firstParamExists === true) {
                        this.manifestsQueryString = this.manifestsQueryString + '&';
                    } else {
                        this.manifestsQueryString = this.manifestsQueryString + '?';
                    }
                    this.manifestsQueryString += `match[spec_version]=` + this.queryParams.specification_version;
                    firstParamExists = true;
                }

                if (this.componentsReferences.length > 0 && this.addFilters) {
                    this.componentsReferences.forEach((cr) => {
                        if (
                            cr.instance.type === 'top-level property' ||
                            cr.instance.type === 'top-level property of type list' ||
                            cr.instance.type === 'property within nested structures'
                        ) {
                            if (firstParamExists === true) {
                                this.manifestsQueryString = this.manifestsQueryString + '&';
                            } else {
                                this.manifestsQueryString = this.manifestsQueryString + '?';
                            }
                            this.manifestsQueryString += `match[${cr.instance.attribute}]=` + cr.instance.value;
                            firstParamExists = true;
                        }

                        if (cr.instance.type === 'relationships') {
                            if (firstParamExists === true) {
                                this.manifestsQueryString = this.manifestsQueryString + '&';
                            } else {
                                this.manifestsQueryString = this.manifestsQueryString + '?';
                            }
                            this.manifestsQueryString += `match[relationships-all]=` + cr.instance.value;
                            firstParamExists = true;
                        }

                        if (cr.instance.type === 'calculations') {
                            if (firstParamExists === true) {
                                this.manifestsQueryString = this.manifestsQueryString + '&';
                            } else {
                                this.manifestsQueryString = this.manifestsQueryString + '?';
                            }
                            const sign = cr.instance.sign === '>=' ? 'gte' : 'lte';
                            let value: any = null;
                            if (
                                cr.instance.type === 'calculations' &&
                                (cr.instance.attribute === 'modified' ||
                                    cr.instance.attribute === 'valid_until' ||
                                    cr.instance.attribute === 'valid_from')
                            ) {
                                value = cr.instance.value;
                                if (value) {
                                    value.setSeconds(0, 0);
                                    value = value.toISOString();
                                }
                            } else {
                                value = cr.instance.value;
                            }
                            this.manifestsQueryString += `match[${cr.instance.attribute}-${sign}]=` + value;
                            firstParamExists = true;
                        }
                    });
                }
            }
        } catch (e) {
            this.manifestsQueryError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
            this.isLoadingStix = false;
        }

        try {
            let getURL =
                this.taxiiServer + this.selectedAPIRoot + '/collections/' + this.selectedCollection + '/manifest/' + this.manifestsQueryString;
            this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                this.stixService.taxiiHttpReq('get', getURL, { headers: header, observe: 'response' }).subscribe(
                    async (resp: any) => {
                        if (this.stixService.taxiiServerType === 'custom' && this.stixService.useCert) {
                            const headersMap = new Map();
                            resp.headers.forEach(([key, val]) => headersMap.set(key, val));
                            resp.headers = headersMap;
                        }
                        try {
                            if (resp.body['objects']) {
                                this.manifestsQueryResults = new Array();

                                let ids: any[] = [];
                                if (timePublished) {
                                    if (sign === '=') {
                                        const bundles = await this.stixService.db.bundles.where('publish_time').equals(timePublished).toArray();
                                        bundles.forEach((elem) => (ids = ids.concat(elem.bundle)));
                                    } else if (sign === '<=') {
                                        const bundles = await this.stixService.db.bundles.where('publish_time').belowOrEqual(timePublished).toArray();
                                        bundles.forEach((elem) => (ids = ids.concat(elem.bundle)));
                                    } else if (sign === '>=') {
                                        const bundles = await this.stixService.db.bundles.where('publish_time').aboveOrEqual(timePublished).toArray();
                                        bundles.forEach((elem) => (ids = ids.concat(elem.bundle)));
                                    }
                                }

                                for (let i = 0; i < resp.body['objects'].length; i++) {
                                    let currObj = resp.body['objects'][i];
                                    if (timePublished) {
                                        if (ids.includes(currObj.id)) this.manifestsQueryResults.push(currObj);
                                    } else this.manifestsQueryResults.push(currObj);
                                }
                                if (this.manifestsQueryResults.length == 0)
                                    this.manifestsQueryError = 'No objects were returned by the TAXII server. Check your parameters and try again';

                                if (resp.body['more'] && resp.body['more'] === true) {
                                    this.queryParams.more = resp.body['more'];
                                    if (resp.body['next']) {
                                        this.queryParams.next = resp.body['next'];
                                    } else if (resp.headers.get('X-TAXII-Date-Added-Last')) {
                                        this.queryParams.date_added_last = resp.headers.get('X-TAXII-Date-Added-Last');
                                    }
                                } else {
                                    this.queryParams.more = false;
                                }
                            } else {
                                this.manifestsQueryError = 'No objects were returned by the TAXII server. Check your parameters and try again';
                            }
                        } catch (e) {
                            this.manifestsQueryError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
                            return;
                        }
                        this.noResults = false;
                        this.isLoadingStix = false;

                        this.loadingExport = false;
                        this.disableExport = false;
                    },
                    (err) => {
                        console.error('Unable to get query results. Error code: %s, URL: %s ', err.status, err.url);
                        this.manifestsQueryError = `**Error code: ${err.status}, URL: ${err.url}**`;
                        this.isLoadingStix = false;
                        this.noResults = false;
                    }
                );
            });
        } catch (e) {
            this.manifestsQueryError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
            this.isLoadingStix = false;
            return;
        }
    }

    isExportDisabled() {
        return this.disableExport;
    }

    async getStatus() {
        await this.envService.checkAuth('/query-stix');

        this.showStatusTable = false;
        this.statusQueryResults = '';

        if (!this.selectedAPIRoot) {
            this.statusQueryError = '**You must select an API Root and a Collection first**';
            return null;
        }
        if (!this.statusid) {
            this.statusQueryError = '**You must provide a Status ID for this request**';
            return null;
        }
        this.isLoadingStix = true;

        try {
            this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                this.stixService
                    .taxiiHttpReq('get', this.taxiiServer.replace('http://', 'https://') + this.selectedAPIRoot + '/status/' + this.statusid + '/', {
                        headers: header,
                    })
                    .subscribe(
                        (data: any) => {
                            this.statusQueryResults = data;
                            this.isLoadingStix = false;
                        },
                        (err) => {
                            this.statusQueryError = `**Error code: ${err.status}, URL: ${err.url}**`;
                            this.noResults = false;
                            this.isLoadingStix = false;
                            return null;
                        }
                    );
            });
        } catch (e) {
            this.statusQueryError = `**Error Name: ${e.name} Error Message ${e.message}**`;
            this.isLoadingStix = false;
            return null;
        }
    }

    resetFilteringParams(): void {
        this.queryParams = {
            addedAfter: '',
            limit: this.taxiiServer === this.envService.env.aisTaxiiProxy.url ? '' : `${this.envService.env.queryResultLimit}`,
            id: '',
            type: [],
            version: '',
            specific_version: '',
            specification_version: '',
            more: false,
            next: '',
            date_added_last: '',
        };
        this.queryString = '';
        this.manifestsQueryString = '';
    }

    public changeShow(index): void {
        if (index == this.rownumber) {
            this.rownumber = null;
        } else {
            this.rownumber = index;
        }
    }

    onVersionChanged(value) {
        if (value == '<value>') {
            this.isSpecificVersion = true;
        } else {
            this.isSpecificVersion = false;
        }
    }

    serverTypeChanged(type?: string): void {
        let changed = false;
        this.setFirstRoot = false;
        this.setFirstCollection = false;

        if ((type === 'default' && this.customServer) || (type !== 'default' && !this.customServer)) {
            changed = true;
        }

        if (changed) {
            this.showMainSearch = true;
            this.APIRoots = [];
            this.taxiiServerType = type;
            this.loadRequestedForm();
            this.collections = [];
            this.selectedCollection = '';
            this.resetFilteringParams();
            this.noResults = true;
            if (type === 'default') {
                this.httpHeaders = new HttpHeaders()
                    .set('Accept', 'application/taxii+json;version=2.1')
                    .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);
                this.taxiiServer = `${this.envService.env.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion}/`;
                this.customServer = false;
            } else {
                this.customServer = true;
                this.showCustomServerConfig = true;
                this.addFilters = false;
            }
        }
    }

    toggleCustomServerCollapse() {
        this.customServer = !this.customServer;
    }

    retrieveAPIRoot(apiRootURL): string {
        function findNthOccur(str, ch, N) {
            let occur = 0;
            // Loop to find the 3rd occurrence of '/'
            for (let i = 0; i < str.length; i++) {
                if (str[i] == ch) {
                    occur += 1;
                }
                if (occur == N) return i;
            }
            return -1;
        }

        function findNumberOccur(str, ch) {
            let occur = 0;
            // Loop to find number of occurrences of '/'
            for (let i = 0; i < str.length; i++) {
                if (str[i] == ch) {
                    occur += 1;
                }
            }
            return occur;
        }

        if (apiRootURL.startsWith('https://')) {
            let count = findNumberOccur(apiRootURL, '/');
            let startofAPIRoot = findNthOccur(apiRootURL, '/', count - 1) + 1;
            if (apiRootURL.endsWith('/')) {
                return apiRootURL.substring(startofAPIRoot, apiRootURL.length - 1);
            } else {
                return apiRootURL.substring(startofAPIRoot, apiRootURL.length);
            }
        } else if (apiRootURL.startsWith('/')) {
            if (apiRootURL.endsWith('/')) {
                return apiRootURL.substring(1, apiRootURL.length - 1);
            } else {
                return apiRootURL.substring(1, apiRootURL.length);
            }
        } else {
            this.apiRootProcessingError = '**Could not retrieve API Root information from the TAXII server**';
            return null;
        }
    }

    async getAPIRoot() {
        await this.envService.checkAuth('/query-stix');

        this.loadRequestedForm('isAPIRootInformation');
        if (!this.selectedAPIRoot) {
            this.APIRootInformationQueryError = '**You must select an API Root first**';
            return null;
        }
        return new Promise((resolve, _) => {
            try {
                this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                    this.stixService.taxiiHttpReq('get', this.taxiiServer + this.selectedAPIRoot + '/', { headers: header }).subscribe(
                        (data: string) => {
                            this.APIRootInformationResults = data;
                        },
                        (err) => {
                            console.error(err);
                        }
                    );
                });
            } catch (e) {
                console.error('Error Name: ' + e.name + ' ' + 'Error Message: ' + e.message);
                this.APIRootInformationQueryError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
            }
        });
    }

    async onAPIRootChanged(event: any, initial = false) {
        this.isLoadingRoots = true;
        await this.envService.checkAuth('/query-stix');

        this.apiRootProcessingError = '';
        this.selectedCollection = '';
        this.loadRequestedForm();
        this.collections = [];
        this.selectedAPIRoot = event && event.target && event.target.value ? event.target.value : event;
        if (this.currentAlert !== undefined) this.currentApiRoot = event && event.target && event.target.value ? event.target.value : event;
        this.selectedCollection = null;
        this.getCollectionsIds();
    }

    private toISOLocal(d: any): string {
        d = new Date(d);
        const z = (n: any) => ('0' + n).slice(-2);
        const zz = (n: any) => ('00' + n).slice(-3);

        return (
            d.getFullYear() +
            '-' +
            z(d.getMonth() + 1) +
            '-' +
            z(d.getDate()) +
            'T' +
            z(d.getHours()) +
            ':' +
            z(d.getMinutes()) +
            ':' +
            z(d.getSeconds()) +
            '.' +
            zz(d.getMilliseconds()) +
            '000Z'
        );
    }

    async onCollectionChanged(event) {
        await this.envService.checkAuth('/query-stix');
        this.selectedCollection = event.target.value;

        if (this.currentAlert !== undefined) {
            this.currentCollection = event.target.value;
            this.loadRequestedForm('isObjects');
            this.queryParams.addedAfter = this.currentAlert._source.timestamp;
            this.getObjects();
            this.currentAlert = undefined;
        } else {
            this.loadRequestedForm(event.target.name);
        }
    }

    private getCollectionsIds(root = undefined) {
        console.debug(this.selectedAPIRoot);
        const rootIndex = this.stixService.apiRoots2.findIndex((r) => r['apiPath'] === this.selectedAPIRoot);
        if (rootIndex > -1) {
            this.collections = this.stixService.apiRoots2[rootIndex]['collections'];
            this.collections = this.collections.filter((c) => c.can_read);
            this.latency_collection_display = [];
            if (this.stixService.latency.roots) {
                // Pulls the correct latency root and then filters for only readable collections - outputs latency data on writable collections
                let latency_root_collections = [];
                if (this.stixService.latency.roots) {
                    let temp = this.stixService.latency.roots.filter((r) => r.collections_endpoint.label == this.selectedAPIRoot);
                    if (temp[0]) {
                        latency_root_collections = temp[0].objects_endpoint.filter((l_c) => this.collections.some((c) => c.id == l_c.label));
                    }
                }
                console.debug(latency_root_collections);
                for (let coll of latency_root_collections) {
                    let label = this.collections.filter((c) => c.id == coll.label)[0].title;
                    let message = Math.round(coll.sumResponseMillis / coll.n) + '';
                    let err;
                    let err_count = 0;
                    for (let err_code in coll.errors) {
                        if (coll.errors[err_code] > err_count) {
                            err = err_code;
                        }
                    }
                    if (err != undefined) {
                        message = message + '; Possible error: ' + err;
                    }
                    this.latency_collection_display.push({ label: label, message: message });
                }
            }

            if (this.currentAlert !== undefined) {
                for (let coll of this.collections) {
                    if (this.currentAlert._source.query.collectionID === coll.id) {
                        this.onCollectionChanged({ target: { value: coll.id } });
                        break;
                    }
                }
            }
            this.isLoadingRoots = false;
            return null;
        }
    }

    async getCollections() {
        await this.envService.checkAuth('/query-stix');

        if (!this.selectedAPIRoot) {
            this.collectionsQueryError = '**You must select an API Root first**';
            return null;
        }
        this.isLoadingRoots = true;
        return new Promise((resolve, _) => {
            let collectionsIds = [];
            try {
                this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                    this.stixService.taxiiHttpReq('get', this.taxiiServer + this.selectedAPIRoot + '/collections/', { headers: header }).subscribe(
                        (data: any) => {
                            this.collectionsResults = data;
                            this.isLoadingRoots = false;
                        },
                        (error) => {
                            this.collectionsQueryError = `**Error Name: ${error.name} Error Message: ${error.message}**`;
                            this.isLoadingRoots = false;
                        }
                    );
                });
            } catch (e) {
                console.error('Error Name: ' + e.name + ' ' + 'Error Message: ' + e.message);
                this.collectionsQueryError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
                this.isLoadingRoots = false;
            }
        });
    }

    async loadRequestedForm(formName?: string) {
        this.refreshTaxiiCreds();
        if (this.taxiiServer === this.envService.env.aisTaxiiProxy.url) {
            this.queryParams.limit = '';
        }
        this.statusRowNumber = null;
        if (formName !== 'collections') {
            this.resetFilteringParams();
            this.isObjects = false;
            this.isCollections = false;
            this.isManifests = false;
            this.isStatus = false;
            this.isServerDiscovery = false;
            this.serverDiscoveryResults = '';
            this.serverDiscoveryQueryError = '';
            this.isAPIRootInformation = false;
        }
        if (formName === 'collections') {
            this.queryParams.next = '';
            this.queryParams.more = false;
        }
        this.noResults = false;
        this.objectsQueryResults = [];
        this.unsortedQueryResults = [];
        this.sortKey = undefined;
        this.objectsCount = 0;
        this.objectsQueryError = '';
        this.objectsQueryErrorURL = '';
        this.APIRootInformationQueryError = '';
        this.APIRootInformationResults = '';
        this.collectionsQueryError = '';
        this.collectionsResults = '';
        this.manifestsQueryString = '';
        this.manifestsQueryResults = [];
        this.manifestsQueryError = '';
        this.statusQueryResults = '';
        this.statusQueryError = '';
        switch (formName) {
            case 'isServerDiscovery':
                this.isServerDiscovery = true;
                this.setActiveMenuItem('discovery');
                break;
            case 'isAPIRootInformation':
                this.isAPIRootInformation = true;
                this.setActiveMenuItem('apiroot');
                break;
            case 'isCollections':
                this.isCollections = true;
                this.setActiveMenuItem('collections');
                break;
            case 'isManifests':
                this.isManifests = true;
                this.setActiveMenuItem('manifests');
                break;
            case 'isObjects':
                this.isObjects = true;
                this.setActiveMenuItem('objects');
                break;
            case 'isStatus':
                this.isStatus = true;
                this.setActiveMenuItem('status');
                await this.setStatusTable();
                if (this.statusTable.length === 0) {
                    this.showStatusTable = false;
                } else {
                    this.showStatusTable = true;
                }
                break;
            default:
                this.setActiveMenuItem();
                break;
        }
    }

    getServerDiscovery() {
        this.refreshTaxiiCreds();
        this.loadRequestedForm('isServerDiscovery');
        return new Promise((resolve, _) => {
            try {
                this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                    this.stixService.taxiiHttpReq('get', this.taxiiServer + 'taxii2/', { headers: header }).subscribe(
                        (data: string) => {
                            this.serverDiscoveryResults = data;
                        },
                        (err) => {
                            console.error(err);
                        }
                    );
                });
            } catch (e) {
                this.serverDiscoveryQueryError = `**Error Name ${e.name} Error Message: ${e.message}**`;
            }
        });
    }

    setActiveMenuItem(item?) {
        switch (item) {
            case 'discovery':
                this.activeMenuItem = 'discovery';
                return;
            case 'apiroot':
                this.activeMenuItem = 'apiroot';
                return;
            case 'status':
                this.activeMenuItem = 'status';
                return;
            case 'collections':
                this.activeMenuItem = 'collections';
                return;
            case 'manifests':
                this.activeMenuItem = 'manifests';
                return;
            case 'objects':
                this.activeMenuItem = 'objects';
                return;
            default:
                this.activeMenuItem = '';
                return;
        }
    }

    public async editObject(stixObject): Promise<void> {
        let tempI = stixObject.ogI;
        delete stixObject.ogI;

        let custom = this.stixService.isCustomObject(stixObject);

        // Set Modified with current time for new_version
        if (stixObject.modified) {
            stixObject.modified = new Date().toISOString();
        }

        this.stixService.objectFromClient = stixObject;
        await db.saveItemBeingEdited(stixObject);

        let url;
        if (!custom) {
            url = this.router.serializeUrl(this.router.createUrlTree(['/add-component/' + stixObject.type]));
        } else {
            url = this.router.serializeUrl(this.router.createUrlTree(['/custom-object']));
        }

        if (this.openNewWindow) {
            url = url + '?new_version=true';
            window.open(url, '_blank');
        } else {
            // Route using same tab, used for debugging
            this.router.navigate([url], { queryParams: { new_version: true } });
        }

        stixObject.ogI = tempI;
    }

    public async revokeObject(stixObject): Promise<void> {
        let tempI = stixObject.ogI;
        delete stixObject.ogI;

        let custom = this.stixService.isCustomObject(stixObject);

        // Set Modified with current time for revocation
        if (stixObject.modified) {
            stixObject.modified = new Date().toISOString();
        }

        this.stixService.objectFromClient = stixObject;
        await db.saveItemBeingEdited(stixObject);

        let url;
        if (!custom) {
            url = this.router.serializeUrl(this.router.createUrlTree(['/add-component/' + stixObject.type]));
        } else {
            url = this.router.serializeUrl(this.router.createUrlTree(['/custom-object']));
        }

        if (this.openNewWindow) {
            url = url + '?revocation=true';
            window.open(url, '_blank');
        } else {
            // Route using same tab, used for debugging
            this.router.navigate([url], { queryParams: { revocation: true } });
        }

        stixObject.ogI = tempI;
    }

    public addObject(stixObject): void {
        let tempI = stixObject.ogI;
        delete stixObject.ogI;
        this.stixService.addComponent(stixObject);

        const new_version_objects = JSON.parse(localStorage.getItem('new_version_objects'));
        if (!new_version_objects) localStorage.setItem('new_version_objects', JSON.stringify([stixObject.id]));
        if (new_version_objects) {
            if (!new_version_objects.includes(stixObject.id)) {
                new_version_objects.push(stixObject.id);
            }
            localStorage.setItem('new_version_objects', JSON.stringify(new_version_objects));
        }

        let url = null;
        if (this.stixService.getGuided()) {
            url = this.router.serializeUrl(this.router.createUrlTree(['/guided/']));
        } else {
            url = this.router.serializeUrl(this.router.createUrlTree(['/bundle/']));
        }

        if (this.openNewWindow) {
            url = url + '?new_version=true';
            window.open(url, '_blank');
        } else {
            // Route using same tab, used for debugging
            this.router.navigate([url], { queryParams: { new_version: true } });
        }

        stixObject.ogI = tempI;
    }

    customizeColumns() {
        this.modalRef = this.modalService.open(CustomizeColumnsComponent, {
            ariaLabelledBy: 'pattern-builder-modal-title',
            windowClass: 'pattern-builder-modal',
        });

        setTimeout(() => {
            const data = {
                data: this.columns,
            };

            this.stixService.sendData(data);
        }, 300);
    }

    createRelationship(): void {
        let options = [];

        for (let id of this.selectedObjects) {
            for (let object of this.objectsQueryResults) {
                if (object.id === id) {
                    options.push(object);
                }
            }
        }

        let source = options[0];
        let target = options[1];

        const dialogRef = this.relationshipDialog.open(RelationshipDialogComponent, {
            data: { options: options, source: source, target: target, from: 'query' },
            height: '400px',
            width: `${window.innerWidth / 2}px`,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) this.router.navigateByUrl('/add-component/relationship', { state: result });
        });
    }

    showColumn(colName) {
        return this.columns.find((c) => c.name === colName) ? this.columns.find((c) => c.name === colName).checked : true;
    }

    ngOnDestroy() {
        if (this.customizeColumnsSubscription) {
            this.customizeColumnsSubscription.unsubscribe();
        }
    }

    reformatDate(date) {
        if (date === undefined) return '';

        let dateObj = new Date(date);
        let tempString = dateObj.toString().substring(0, 24);

        return tempString;
    }

    reformatCsvDate(date) {
        if (date === undefined) return '';

        let tempString = this.reformatDate(date);
        tempString = tempString.substring(4);
        tempString = tempString.slice(0, -3);

        let month = this.getMonth(tempString.substring(0, 3));
        let day = tempString.substring(4, 6);
        let year = tempString.substring(7, 11);
        let time = tempString.slice(-5);

        tempString = `${month}/${day}/${year} ${time}`;

        return tempString;
    }

    getMonth(month) {
        switch (month) {
            case 'Jan':
                return 1;
            case 'Feb':
                return 2;
            case 'Mar':
                return 3;
            case 'Apr':
                return 4;
            case 'May':
                return 5;
            case 'Jun':
                return 6;
            case 'Jul':
                return 7;
            case 'Aug':
                return 8;
            case 'Sep':
                return 9;
            case 'Oct':
                return 10;
            case 'Nov':
                return 11;
            case 'Dec':
                return 12;
            default:
                return 0;
        }
    }

    export(value, format) {
        let filename = 'export.';
        let data: any = '';

        switch (format) {
            case 'CSV':
                data = '';
                filename += 'csv';

                let top = [];
                switch (this.activeMenuItem) {
                    case 'manifests':
                        top = ['id', 'date_added', 'version', 'media_type'];
                        break;
                    case 'objects':
                        top = ['name', 'type', 'user_provided_published', 'published', 'created', 'modified'];
                        break;
                }

                data += top.join(',') + '\n';

                if (this.exportObjects.length !== 0) {
                    value = value.concat(this.exportObjects);
                }

                value.forEach((obj) => {
                    let currentLine = [];

                    for (let header of top) {
                        switch (header) {
                            case 'id':
                            case 'version':
                            case 'media_type':
                            case 'type':
                                if (obj[header]) {
                                    currentLine.push(obj[header]);
                                } else {
                                    currentLine.push('');
                                }
                                break;
                            case 'date_added':
                            case 'created':
                            case 'modified':
                                if (obj[header]) {
                                    currentLine.push(this.reformatCsvDate(obj[header]));
                                } else {
                                    currentLine.push('');
                                }
                                break;
                            case 'user_provided_published':
                                if (obj['type'] === 'report') {
                                    let month = obj['published'].substr(5, 2);
                                    let day = obj['published'].substr(8, 2);
                                    let year = obj['published'].substr(0, 4);
                                    let time = obj['published'].substr(11, 5);

                                    if (month.startsWith('0')) month = month.substr(1, 1);

                                    let date = `${month}/${day}/${year} ${time}`;

                                    currentLine.push(date);
                                } else {
                                    currentLine.push('');
                                }
                                break;
                            case 'published':
                                if (obj['type'] === 'report' && obj['manifest_published']) {
                                    currentLine.push(this.reformatCsvDate(obj['manifest_published']));
                                } else {
                                    currentLine.push(this.reformatCsvDate(this.getPublished(obj)));
                                }
                                break;
                            case 'name':
                                if (obj[header]) {
                                    currentLine.push(obj[header].replaceAll(',', ''));
                                } else if (obj['value']) {
                                    currentLine.push(obj['value']);
                                } else {
                                    currentLine.push(obj['id']);
                                }
                                break;
                        }
                    }

                    data += currentLine.join(',') + '\n';
                });
                break;
            case 'JSON':
                let tempArr = [];
                for (let obj of value) {
                    let tempObj = {};
                    for (let field in obj) {
                        tempObj[field] = obj[field];
                    }

                    if (tempObj['type'] === 'report' && tempObj['manifest_published']) {
                        delete tempObj['manifest_published'];
                    } else if (tempObj['type'] !== 'report' && tempObj['published']) {
                        delete tempObj['published'];
                    }

                    tempArr.push(tempObj);
                }

                filename += 'json';

                if (this.exportObjects.length !== 0) {
                    for (let obj of this.exportObjects) {
                        let tempObj = {};
                        for (let field in obj) {
                            tempObj[field] = obj[field];
                        }

                        if (tempObj['type'] === 'report' && tempObj['manifest_published']) {
                            delete tempObj['manifest_published'];
                        } else if (tempObj['type'] !== 'report' && tempObj['published']) {
                            delete tempObj['published'];
                        }

                        tempArr.push(tempObj);
                    }
                }
                data = JSON.stringify(tempArr);
                break;
        }

        let file = new Blob([data], { type: 'text/plain' });
        let a = document.createElement('a'),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        a.click();
        a.remove();
    }

    getAvailableAPIRoots(): any {
        if (this.stixService.taxiiServerType == 'ais') {
            return this.stixService.apiRootDetails.filter((a) => a['api-root'] != 'ingest');
        }

        if (this.currentAlert !== undefined && this.stixService.apiRootDetails.length !== 0) {
            for (let root of this.stixService.apiRootDetails) {
                if (root['api-root'] === this.currentAlert._source.query.apiRoot) {
                    this.onAPIRootChanged(root['api-root']);

                    break;
                }
            }
        }

        return this.stixService.apiRootDetails;
    }

    getObjectsFromID(ids, sendToBundle?: boolean): any {
        if (sendToBundle) this.getObjectFromIDHelper([...ids], sendToBundle);
        else return this.getObjectFromIDHelper([...ids], false);
    }

    getObjectFromIDHelper(ids, sendToBundle: boolean) {
        if (ids.length == 0) {
            return [];
        }
        let id = ids.pop();

        try {
            let getURL = this.taxiiServer + this.selectedAPIRoot + '/collections/' + this.selectedCollection + '/objects/?match[id]=' + id;
            this.httpClient.get<any>(getURL, { headers: this.httpHeaders, observe: 'response' }).subscribe(
                (resp) => {
                    let obj = undefined;
                    if (resp.body['objects']) {
                        obj = resp.body['objects'][0];
                    }
                    if (sendToBundle) {
                        if (obj) this.stixService.objectsToLoad.push(obj);
                        if (ids.length == 0) {
                            if (this.stixService.objectsToLoad.length > 0) {
                                this.stixService.hasObjectsToLoad = true;
                                if (this.stixService.getGuided()) {
                                    this.router.navigate(['/guided'], { queryParams: { build_review: true } });
                                } else {
                                    this.stixService.hasObjectsToLoad = true;
                                    localStorage.setItem('objects-to-load', JSON.stringify(this.stixService.objectsToLoad));
                                    window.open(this.router.serializeUrl(this.router.createUrlTree(['/bundle'])), '_blank');

                                    this.stixService.hasObjectsToLoad = false;
                                    this.stixService.objectsToLoad = [];
                                }
                            } else console.error('ERROR: No objects were able to be loaded');
                            return [];
                        }
                        this.getObjectFromIDHelper(ids, true);
                    } else {
                        if (obj) return this.getObjectFromIDHelper(ids, true)?.concat([obj]);
                        else return this.getObjectFromIDHelper(ids, true);
                    }
                },
                (err) => {
                    console.error('Unable to get query results. Error code: %s, URL: %s ', err.status, err.url);
                    if (sendToBundle) {
                        if (ids.length == 0) {
                            if (this.stixService.objectsToLoad.length > 0) {
                                this.stixService.hasObjectsToLoad = true;
                                localStorage.setItem('objects-to-load', JSON.stringify(this.stixService.objectsToLoad));
                                window.open(this.router.serializeUrl(this.router.createUrlTree(['/bundle'])), '_blank');
                            } else console.error('ERROR: No objects were able to be loaded');
                            return [];
                        }
                        this.getObjectFromIDHelper(ids, true);
                    } else {
                        return this.getObjectFromIDHelper(ids, true);
                    }
                }
            );
        } catch (e) {
            console.error('Error getting object by ID: ' + e);
            if (sendToBundle) {
                if (ids.length == 0) {
                    if (this.stixService.objectsToLoad.length > 0) {
                        this.stixService.hasObjectsToLoad = true;
                        window.open(this.router.serializeUrl(this.router.createUrlTree(['/bundle'])), '_blank');
                    } else console.error('ERROR: No objects were able to be loaded');
                    return [];
                }
                this.getObjectFromIDHelper(ids, true);
            } else {
                return this.getObjectFromIDHelper(ids, true);
            }
        }
    }

    getPublished(obj) {
        let ogI = this.publishedDict[obj.id];
        return this.manifestsQueryResults[ogI];
    }

    /** DELETE: delete the STIX Object from the TAXII server */
    deleteObject(taxiiServer: string, apiRoot: string, collectionId: string, id: number, modified: number): Observable<unknown> {
        let url: string;
        if (modified) {
            url = taxiiServer + apiRoot + '/collections/' + collectionId + '/objects/' + id + '/?match[version]=' + modified;
        } else {
            url = taxiiServer + apiRoot + '/collections/' + collectionId + '/objects/' + id + '/';
        }

        return this.httpClient.delete<unknown>(url, { headers: this.httpHeaders }).pipe(
            tap((_) => this.log(`Deleted STIX Object id=${id}`)),
            catchError(this.handleError$<unknown>('deleteObject'))
        );
    }

    private handleError$<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
            // TODO: send the error to remote logging infrastructure
            console.error(error); // log to console instead

            // TODO: better job of transforming error for user consumption
            this.log(`${operation} failed: ${error.message}`);

            // Let the app keep running by returning an empty result.
            return of(result as T);
        };
    }

    /** Log a message with the MessageService */
    private log(message: string) {
        this.messageService.add(`${message}`);
    }

    async isAdminUser() {
        if (this.envService.env.keycloak.enabled === false && this.envService.env.oidc.enabled === false) {
            this.isAdmin = true;
            return;
        }

        if (this.userRoles.length === 0) {
            this.userRoles = this.keycloak.getUserRoles();
            if (this.userRoles.length === 0) {
                this.isAdmin = false;
                return;
            }
        }

        if (this.envService.env.taxiiServer === undefined) {
            await this.envService.wait('taxiiServer');
        }

        if (this.userRoles.includes(this.envService.env.taxiiServer.adminRoleName)) {
            this.isAdmin = true;
            return;
        }

        this.isAdmin = false;
    }

    async nextPage(direction) {
        this.statusQueryResults = '';
        this.statusRowNumber = -1;

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

    changeStatusShow(i) {
        if (this.statusRowNumber === i) {
            this.statusRowNumber = -1;
            this.statusQueryResults = '';
        } else {
            this.statusRowNumber = i;
            this.statusQueryResults = this.statusTable[i].res;
        }
    }

    async setStatusTable() {
        this.statusTable = [];
        this.isLoadingStatus = true;
        let page: any = await this.submissions.getPage(this.currentStatusPage, this.envService.getUsername());
        if (page.status === 0) {
            this.isLoadingStatus = false;
            return;
        }

        this.totalStatusPages = Math.ceil(page.total.value / 15);
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
        this.isLoadingStatus = false;
    }

    async globalSearchToggle(e) {
        this.loadRequestedForm();
    }
}

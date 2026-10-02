import { HttpClient } from '@angular/common/http';
import { Component, ComponentRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { EnvService } from 'src/app/env-service/env.service';
import { STIXObjectTypes } from 'src/app/query-stix/query-stix-constants';
import {
    faArrowLeft,
    faSearch,
    faFilter,
    faArrowRight,
    faEdit,
    faFileArchive,
    faFileImport,
    faCaretUp,
    faFileExport,
    faTrash,
    faLink,
    faAngleDown,
    faAngleUp,
} from '@fortawesome/free-solid-svg-icons';
import { StixService } from 'src/app/stix-service.service';
import { AdditionalFiltersComponent } from 'src/app/query-stix/additional-filters/additional-filters.component';
import { HttpHeaders } from '@angular/common/http';
import { DateTimeAdapter } from '@danielmoncada/angular-datetime-picker';
import { SCO_LIST } from 'src/app/models/sco_list';
import { db } from 'src/app/db.service';
import { Router } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { OidcService } from 'src/app/auth/oidc-service/oidc.service';
import { Observable, of, throwError, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MessageService } from 'src/app/query-stix/message.service';
import { RelationshipDialogComponent } from 'src/app/query-stix/relationship-dialog/relationship-dialog/relationship-dialog.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';
import { PreviewComponent } from '../preview/preview.component';

@Component({
    selector: 'app-taxii-query',
    standalone: false,
    templateUrl: './taxii-query.component.html',
    styleUrls: ['./taxii-query.component.css', '../taxii-search.component.css'],
})
export class TaxiiQueryComponent implements OnInit {
    @Input() selectedColl;
    @Input() selectedRoot;
    @Input() roots: any[];
    @Input() collections;
    @Input() globalSearch: boolean;
    @Input() serverInfo;

    @Output() getAvailableAPIRoots: EventEmitter<any>;
    @Output() getAvailableCollections: EventEmitter<any>;
    @Output() selectRoot: EventEmitter<any>;
    @Output() selectCollection: EventEmitter<any>;
    @Output() selectGlobalSearch: EventEmitter<any>;
    @Output() setServerInfo: EventEmitter<any>;

    @ViewChild('viewContainerRef', { read: ViewContainerRef })
    VCR: ViewContainerRef;

    private openNewWindow: boolean = true;

    private activeMenuItem: any = 'objects';

    protected isAdmin = false;

    protected faLink = faLink;
    protected faArrowRight = faArrowRight;
    protected faArrowLeft = faArrowLeft;
    protected faSearch = faSearch;
    protected faFilter = faFilter;
    protected faEdit = faEdit;
    protected faFileArchive = faFileArchive;
    protected faAddToBundle = faFileImport;
    protected faFileExport = faFileExport;
    protected faCaretUp = faCaretUp;
    protected faTrash = faTrash;
    protected faAngleDown = faAngleDown;
    protected faAngleUp = faAngleUp;

    protected readonly typeOptions = STIXObjectTypes;
    protected readonly scoList = SCO_LIST;

    protected existingCISAIdentity;

    protected readonly versions = ['last', 'first', 'all', '<value>'];
    protected isSpecificVersion: boolean = false;

    protected isOmitRevoked: boolean;

    private selectedOptions: Set<string>;
    protected selectedCollection;

    protected queryParams = {
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

    protected objectsQueryResults: any[] = [];

    private nextAddedAfter: string = '';
    protected exportObjects: any[] = [];
    protected loadingExport: boolean = false;
    protected disableExport: boolean = true;

    protected isLoadingStix = false;
    private objectsCount: number = 0;
    private unsortedQueryResults: any[];
    private objectsQueryError = '';
    private objectsQueryErrorURL = '';
    protected sortKey: string;
    private objectReturnedCount: number = 0;

    protected isAllCheckboxSelected: boolean;
    public rownumber: number;

    private globalSearchTerm = '';
    private globalSearchPage = 1;
    private globalQueryBody = '';

    private cleaned: boolean = false;

    private queryString = '';

    private child_unique_key: number = 0;
    protected componentsReferences = Array<ComponentRef<AdditionalFiltersComponent>>();

    protected manifestsQueryResults: any[];

    private taxiiServer: string = '';
    private taxiiServerType = this.stixService.taxiiServerType;
    private publishedDict: {};

    protected isLoadingStixNext = false;

    private manifestsQueryError = '';
    private userRoles = [];

    private httpHeaders = new HttpHeaders()
        .set('Accept', 'application/taxii+json;version=2.1')
        .set('Authorization', `Basic ${btoa(this.stixService.taxiiServer.username + ':' + this.stixService.taxiiServer.password)}`);

    protected addFilters: boolean = false;

    private readonly customTaxiiServerAuthType = this.stixService.taxiiServerAuthType;

    protected localTimezone: string = '';

    protected selectedObjects = [];

    constructor(
        private envService: EnvService,
        public stixService: StixService,
        private dateTimeAdapter: DateTimeAdapter<any>,
        private router: Router,
        private httpClient: HttpClient,
        private scroller: ViewportScroller,
        private keycloak: KeycloakService,
        private oidc: OidcService,
        private messageService: MessageService,
        private relationshipDialog: MatDialog,
        private announcementService: AnnouncementService,
        private modalService: NgbModal
    ) {
        this.getAvailableAPIRoots = new EventEmitter();
        this.getAvailableCollections = new EventEmitter();
        this.selectRoot = new EventEmitter();
        this.selectCollection = new EventEmitter();
        this.selectGlobalSearch = new EventEmitter();
        this.setServerInfo = new EventEmitter();

        dateTimeAdapter.setLocale('en-US');
    }

    ngOnInit(): void {
        this.selectNone();
        this.getTimeZone();
        this.isAdminUser();

        this.selectedCollection = this.selectedColl;

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

        this.existingCISAIdentity = this.envService.env.defaultIdentity.id;

        if (this.envService.env.keycloak.enabled) {
            this.userRoles = this.keycloak.getUserRoles();
        }
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

        if (this.taxiiServer === this.envService.env.aisTaxiiProxy.url) {
            this.queryParams.limit = '';
        }
    }

    selectAll() {
        this.selectedOptions = new Set(this.typeOptions);
    }

    getTimeZone() {
        let date = new Date();
        let parts = new Intl.DateTimeFormat('en-US', {
            timeZoneName: 'short',
        }).formatToParts(date);

        this.localTimezone = parts.find((p) => p.type === 'timeZoneName')?.value;
    }

    selectNone() {
        this.selectedOptions = new Set();
    }

    selectObjectType(type: string) {
        if (this.selectedOptions.has(type)) this.selectedOptions.delete(type);
        else this.selectedOptions.add(type);
    }

    hasObjectType(type) {
        return this.selectedOptions.has(type);
    }

    onVersionChanged(value) {
        if (value == '<value>') {
            this.isSpecificVersion = true;
        } else {
            this.isSpecificVersion = false;
        }
    }

    public onOmitRevokedChanged(value: any) {
        this.isOmitRevoked = value.target.checked;
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
        this.cleaned = false;
        try {
            this.queryParams.type = [...this.selectedOptions];
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
                if (!this.globalSearch && (!this.selectedRoot || !this.selectedCollection.id)) {
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
                let getURL = this.taxiiServer + this.selectedRoot + '/collections/' + this.selectedCollection.id + '/objects/' + this.queryString;
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
                                                                                            manifestResp.body['objects'][j].localDate = localDate
                                                                                                .toString()
                                                                                                .replace(/GMT.*/g, '');
                                                                                            this.manifestsQueryResults.push(
                                                                                                manifestResp.body['objects'][j]
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
                                                                                        manifestResp.body['objects'][j].localDate = localDate
                                                                                            .toString()
                                                                                            .replace(/GMT.*/g, '');
                                                                                        this.manifestsQueryResults.push(
                                                                                            manifestResp.body['objects'][j]
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
                                                                                        manifestResp.body['objects'][j].localDate = localDate
                                                                                            .toString()
                                                                                            .replace(/GMT.*/g, '');
                                                                                        this.manifestsQueryResults.push(
                                                                                            manifestResp.body['objects'][j]
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

    async getPublishedDate(header) {
        let getURL = this.taxiiServer + this.selectedRoot + '/collections/' + this.selectedCollection.id + '/manifest/' + this.queryString;

        return new Promise((resolve) => {
            try {
                this.stixService.taxiiHttpReq('get', getURL, { headers: header, observe: 'response' }).subscribe(
                    (manifestResp: any) => {
                        console.info('Manifest Resp:', manifestResp);
                        try {
                            if (manifestResp.body['objects']) {
                                for (let j = 0; j < manifestResp.body['objects'].length; j++) {
                                    let localDate = new Date(manifestResp.body['objects'][j].date_added);
                                    manifestResp.body['objects'][j].localDate = localDate.toString().replace(/GMT.*/g, '');
                                    this.manifestsQueryResults.push(manifestResp.body['objects'][j]);
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

                        this.isLoadingStix = false;
                    },
                    (err) => {
                        console.error('Unable to get query results. Error code: %s, URL: %s ', err.status, err.url);
                        this.manifestsQueryError = `**Error Code: ${err.status}, URL: ${err.url}**`;
                        this.isLoadingStix = false;

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

    isQueryDisabled(): boolean {
        if (this.isLoadingStix) {
            return true;
        }

        return false;
    }

    showFilters = async () => {
        this.addFilters = !this.addFilters;
        if (this.addFilters && this.componentsReferences.length == 0) this.createFilterComponent();
    };

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

    clearFilterComponent() {
        this.componentsReferences.forEach((childComponentRef) => {
            childComponentRef.destroy();
        });

        this.componentsReferences = [];
    }

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

    getPublished(obj) {
        let ogI = this.publishedDict[obj.id];
        return this.manifestsQueryResults[ogI];
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

    checkAllCheckBox(ev: any) {
        this.objectsQueryResults.forEach((x) => (x.checked = ev.target.checked));
        this.unsortedQueryResults.forEach((x) => (x.checked = ev.target.checked));
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

    getMediaType(obj) {
        return `v${obj.media_type.split('version=')[1]}`;
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

    back() {
        this.selectCollection.emit(null);
        this.selectGlobalSearch.emit(false);
    }

    scrollUp() {
        this.scroller.scrollToPosition([0, 0]);
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

    reformatDate(date) {
        if (date === undefined) return '';

        let dateObj = new Date(date);
        let tempString = dateObj.toString().substring(0, 24);

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

    async isAdminUser() {
        if (this.envService.env.keycloak.enabled === false && this.envService.env.oidc.enabled === false) {
            this.isAdmin = true;
            return;
        }

        if (this.userRoles.length === 0) {
            if (this.envService.env.keycloak.enabled === true) this.userRoles = this.keycloak.getUserRoles();
            else if (this.envService.env.oidc.enabled === true) this.userRoles = this.oidc.getRoles();

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
                this.deleteObject(this.taxiiServer, this.selectedRoot, this.selectedCollection.id, stixObject.id, stixObject.modified).subscribe(() =>
                    this.isAllCheckBoxChecked()
                );
            }
        });
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

    /** Log a message with the MessageService */
    private log(message: string) {
        this.messageService.add(`${message}`);
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

    isReportOrGrouping() {
        const foundObject = this.objectsQueryResults.find((obj) => obj.id == this.selectedObjects[0]);

        if (!foundObject) return false;

        return foundObject.type == 'report' || foundObject.type == 'grouping';
    }

    importBundle() {
        const foundObject = this.objectsQueryResults.find((obj) => obj.id == this.selectedObjects[0]);

        if (foundObject) this.createBundle(foundObject);
    }

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
            let getURL = this.taxiiServer + this.selectedRoot + '/collections/' + this.selectedCollection.id + '/objects/?match[id]=' + id;
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

    openJson(obj) {
        event.stopPropagation();
        let modalRef;

        modalRef = this.modalService.open(PreviewComponent, { size: 'xl' });

        modalRef.componentInstance.component = obj;
    }

    sort(col: string, table: string) {
        if (this.objectsQueryResults.length === 0 && table === 'objects') return;

        if (this.rownumber !== null) this.rownumber = null;

        if (!this.sortKey) {
            this.sortKey = '';
            this.unsortedQueryResults = [];

            for (let obj of this.objectsQueryResults) {
                this.unsortedQueryResults.push(obj);
            }
        }

        if (this.sortKey === '') {
            if (table === 'objects') this.objectsQueryResults = this.sortResultsDes(col, this.objectsQueryResults);

            this.sortKey = `${col}-des`;
        } else {
            let keyArr = this.sortKey.split('-');
            if (col === keyArr[0] && keyArr[1] === 'des') {
                if (table === 'objects') this.objectsQueryResults = this.sortResultsAsc(col, this.objectsQueryResults);

                this.sortKey = `${col}-asc`;
            } else if (col === keyArr[0] && keyArr[1] === 'asc') {
                if (table === 'objects') this.objectsQueryResults = this.unsortedQueryResults;

                this.sortKey = '';
            } else {
                if (table === 'objects') this.objectsQueryResults = this.sortResultsDes(col, this.objectsQueryResults);
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
            case 'created':
            case 'modified':
            case 'date_added':
            case 'version':
                return tableArray.sort((a, b) => this.sortDate(a[col], b[col], 'des'));
            case 'published':
                return tableArray.sort((a, b) =>
                    this.sortDate(
                        this.manifestsQueryResults.find((elem) => elem.id == a.id)?.date_added,
                        this.manifestsQueryResults.find((elem) => elem.id == b.id)?.date_added,
                        'des'
                    )
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
                    this.sortDate(
                        this.manifestsQueryResults.find((elem) => elem.id == a.id)?.date_added,
                        this.manifestsQueryResults.find((elem) => elem.id == b.id)?.date_added,
                        'asc'
                    )
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
}

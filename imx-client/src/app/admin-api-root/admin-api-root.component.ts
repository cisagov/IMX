import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { faChevronLeft, faEdit, faSave, faStop, faTrash, faTrashAlt, faPlus, faList, faBan, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { AdminRwComponent } from '../dialogs/admin-rw/admin-rw.component';
import { StixService } from 'src/app/stix-service.service';
import { v4 as uuid } from 'uuid';
import { EnvService } from '../env-service/env.service';
@Component({
    selector: 'app-admin-api-root',
    templateUrl: './admin-api-root.component.html',
    styleUrls: ['./admin-api-root.component.css'],
    standalone: false,
})
export class AdminApiRootComponent implements OnInit {
    @Input() apiRootInput: any;
    @Input() apiRootCollectionsInput: any;
    @Input() collectionsForAllApiRoots: any[];
    @Output() back: EventEmitter<any>;

    apiRoot;
    rws = [];
    fragment;
    newObject = true;
    newVersion = null;
    newReaders = null;
    newRW = null;
    editingFragment = false;
    currentFragment = null;
    errorMessages = [];
    modalRef: any;
    collections = [];

    faEdit = faEdit;
    faSave = faSave;
    faStop = faStop;
    faTrash = faTrash;
    faTrashAlt = faTrashAlt;
    faPlus = faPlus;
    faList = faList;
    faChevronLeft = faChevronLeft;
    faBan = faBan;
    faInfoCircle = faInfoCircle;

    serverRootURL = '';

    private readonly httpHeaders: HttpHeaders;

    serverValidation = [
        {
            title: 'Check Custom Object',
            checkLenientValue: 'DONT_CHECK_CUSTOM_OBJECTS',
            failLenientValue: 'DONT_FAIL_CUSTOM_OBJECTS',
            doCheck: true,
            doFail: 'true',
            disableBoth: false,
        },
        {
            title: 'Check Custom Properties',
            checkLenientValue: 'DONT_CHECK_CUSTOM_PROPERTIES',
            failLenientValue: 'DONT_FAIL_CUSTOM_PROPERTIES',
            doCheck: true,
            doFail: 'true',
            disableBoth: false,
        },
        {
            title: 'Check Duplicates',
            checkLenientValue: 'DONT_CHECK_DUPLICATES',
            failLenientValue: 'DONT_FAIL_DUPLICATES',
            doCheck: true,
            doFail: 'true',
            disableBoth: false,
        },
        {
            title: 'Check NA Commons',
            checkLenientValue: 'DONT_CHECK_NA_COMMONS',
            failLenientValue: 'DONT_FAIL_NA_COMMONS',
            doCheck: true,
            doFail: 'true',
            disableBoth: false,
        },
        {
            title: 'Check Revoked',
            checkLenientValue: 'DONT_CHECK_REVOKED',
            failLenientValue: 'DONT_FAIL_IF_REVOKED',
            doCheck: true,
            doFail: 'true',
            disableBoth: false,
        },
        {
            title: 'Check Extensions',
            checkLenientValue: 'DONT_EXTENSION_VALIDATE',
            failLenientValue: 'DONT_FAIL_EXTENSION_INVALID',
            doCheck: true,
            doFail: 'true',
            disableBoth: false,
        },
        {
            title: 'Respect Creator',
            checkLenientValue: 'DONT_RESPECT_CREATOR',
            failLenientValue: 'DONT_FAIL_CREATOR_CONFLICTS',
            doCheck: true,
            doFail: 'true',
            disableBoth: false,
        },
        {
            title: 'MITRE Validation',
            checkLenientValue: 'DONT_MITRE_VALIDATE',
            failLenientValue: 'DONT_FAIL_MITRE_INVALID',
            doCheck: true,
            doFail: 'true',
            disableBoth: false,
        },
        {
            title: 'Remove Empty Array',
            checkLenientValue: 'DONT_REMOVE_EMPTY_ARRAYS',
            failLenientValue: 'FAIL_EMPTY_ARRAYS',
            doCheck: true,
            doFail: 'false',
            disableBoth: false,
        },
        {
            title: 'Trim Empty Space',
            checkLenientValue: 'DONT_TRIM_URLS',
            failLenientValue: 'FAIL_TRIMMED_URLS',
            doCheck: true,
            doFail: 'false',
            disableBoth: false,
        },
        {
            title: 'Replace SCOs',
            checkLenientValue: 'REPLACE_SCOS',
            doCheck: false,
            doFail: 'true',
        },
    ];

    serverValidationApiRoot: any;

    constructor(
        private readonly httpClient: HttpClient,
        public modalService: NgbModal,
        public stixService: StixService,
        private readonly envService: EnvService
    ) {
        this.back = new EventEmitter();

        this.httpHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
            .set('Content-Type', `application/taxii+json;version=2.1`);

        this.newRW = {
            cId: null,
            reader: null,
            writer: null,
        };
    }

    ngOnInit(): void {
        this.newObject = Object.keys(this.apiRootInput).length === 0;

        this.apiRoot = {};
        for (let field in this.apiRootInput.apiRoot) {
            this.apiRoot[field] = this.apiRootInput.apiRoot[field];
        }

        this.apiRoot.versions =
            this.apiRootInput.apiRoot?.versions && this.apiRootInput.apiRoot.versions.length > 0 ? this.apiRootInput.apiRoot.versions.slice() : [];
        this.apiRoot.max_content_length = this.apiRoot.max_content_length ? this.apiRoot.max_content_length : 1048576;
        this.fragment = this.apiRootInput.fragment;
        this.rws = this.apiRootInput.rws ? this.apiRootInput.rws.slice() : [];
        this.collections =
            this.apiRootCollectionsInput?.collections && this.apiRootCollectionsInput.collections.length > 0
                ? this.apiRootCollectionsInput.collections.slice()
                : [];

        if (this.apiRoot && !this.apiRoot.description) {
            this.apiRoot.description = '';
        }

        if (this.apiRoot && !this.apiRoot.versions) {
            this.apiRoot.versions = [];
        }

        if (this.newObject) {
            this.editFragment();
        } else {
            this.doNotEditFragment();
        }

        this.serverRootURL = `${this.envService.env.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion}/`;

        this.addVersion('application/taxii+json;version=2.1');
        this.newVersion = '';

        this.getServerValidation();
    }

    getCollectionInAPIRoot(cid) {
        return this.collections.find((c) => c.id === cid);
    }

    setFragment() {
        const url = this.stixService.getBaseURLs().baseAdminURL + 'api-root/' + this.fragment + '/add';

        if (this.stixService.certFound === true)
            return this.httpClient.post<any>(url, this.apiRoot.alias, {
                headers: this.httpHeaders.set('Authorization', this.stixService.cert),
                observe: 'response',
            });

        return this.httpClient.post<any>(url, this.apiRoot.alias, { headers: this.httpHeaders, observe: 'response' });
    }

    saveApiRoot(emitObj, apiRoot) {
        let url = '';
        emitObj.data['collections'] = [...this.collections];
        delete apiRoot.collections;

        if (this.newObject) {
            // New object
            url = this.stixService.getBaseURLs().baseAdminURL + 'api-root?create=true';
        } else {
            // Update existing object
            url = this.stixService.getBaseURLs().baseAdminURL + 'api-root';
        }

        this.stixService.getCertHeader(this.httpHeaders).then((header) => {
            this.httpClient.post<any>(url, apiRoot, { headers: header, observe: 'response' }).subscribe({
                next: (resp) => {
                    if (this.errorMessages.length === 0) {
                        setTimeout(() => {
                            this.updateServerValidation(header);
                            this.back.emit(emitObj);
                        }, 500);
                    }
                },
                error: (err) => {
                    this.handleError(err, 'Please check API Root parameters.');
                },
            });
        });
    }

    async backToMain(event = null) {
        this.errorMessages = [];

        let apiRoot = {
            fragment: this.fragment,
            apiRoot: this.apiRoot,
            rws: this.rws,
        };

        if (event === 'save') {
            let emitObj = {
                type: 'save-api-root',
                data: apiRoot,
                collection: this.collections,
            };

            const newCollections = this.collections.filter((c) => {
                if (c.new) {
                    delete c.new;
                    return c;
                }
            });

            // Iterate to create new collections, after completed, then save API Root
            if (newCollections.length > 0) {
                let addNewCollectionTasks$ = [];
                const url = this.stixService.getBaseURLs().baseAdminURL + 'collection?create=true';
                try {
                    for (let collection of newCollections) {
                        addNewCollectionTasks$.push(await this.addCollection(url, collection));
                    }

                    this.saveApiRoot(emitObj, apiRoot);
                } catch (err) {
                    this.handleError(err, 'Please check Collection parameters.');
                    console.error(err);
                    console.error(addNewCollectionTasks$);
                }
            } else {
                this.saveApiRoot(emitObj, apiRoot);
            }
        } else {
            const emitObj = { type: 'cancel' };
            this.back.emit(emitObj);
        }
    }

    async addCollection(url, collection) {
        return new Promise((resolve, reject) => {
            this.stixService.getCertHeader(this.httpHeaders).then(async (header) => {
                this.httpClient.post<any>(url, collection, { headers: header, observe: 'response' }).subscribe({
                    next: (res) => {
                        resolve(res);
                    },
                    error: (err) => {
                        reject(err);
                    },
                });
            });
        });
    }

    editFragment() {
        this.editingFragment = true;

        if (!this.fragment) {
            this.fragment = '{api-root}';
        }
    }
    doNotEditFragment() {
        this.editingFragment = false;
    }

    saveFragment() {
        this.editingFragment = false;
        this.fragment = this.currentFragment.split(' ').join('-');
    }

    cancelFragment() {
        this.editingFragment = false;
        this.currentFragment = null;
    }

    updateRoot(event) {
        if (event?.target?.value) {
            this.fragment = event.target.value;
        }
    }

    focusRoot() {
        if (this.fragment === '{api-root}') {
            this.fragment = '';
        }
    }

    focusOutRoot() {
        if (this.fragment === '') {
            this.fragment = '{api-root}';
        }
    }

    addVersion(newVersion = null) {
        let newVer = null;

        if (newVersion) {
            newVer = newVersion;
        } else {
            newVer = this.newVersion;
        }

        if (this.apiRoot.versions) {
            let foundVer = this.apiRoot.versions.find((v) => v === newVer);
            if (!foundVer) {
                this.apiRoot.versions.push(newVer);
            }
        } else {
            this.apiRoot['versions'] = [];
            this.apiRoot.versions.push(newVer);
        }

        this.newVersion = '';
    }

    addReaders() {
        if (this.rws) {
            this.rws.push(this.newReaders);
        } else {
            this.apiRoot['media_types'] = [];
            this.apiRoot.media_types.push(this.newReaders);
        }
    }

    removeVersion(index) {
        this.apiRoot.versions.splice(index, 1);
    }

    upsertRW(inputRW = null) {
        this.modalRef = this.modalService.open(AdminRwComponent);

        let rw = {};
        if (inputRW) {
            rw = {};
            for (let field in inputRW) {
                rw[field] = inputRW[field];
            }

            rw['readers'] = inputRW.hasOwnProperty('readers') ? inputRW['readers'].slice() : [];
            rw['writers'] = inputRW.hasOwnProperty('writers') ? inputRW['writers'].slice() : [];
        } else {
            rw = {
                cId: uuid(),
                readers: [],
                writers: [],
            };
        }

        this.modalRef.componentInstance.rw = rw;

        if (inputRW) {
            this.modalRef.componentInstance.newRW = false;
        } else {
            this.modalRef.componentInstance.newRW = true;
        }

        this.modalRef.componentInstance.collectionTitle =
            inputRW && this.getCollectionInAPIRoot(inputRW.cId) ? this.getCollectionInAPIRoot(inputRW.cId).title : '';

        this.modalRef.componentInstance.collectionsForAllApiRoots = this.collectionsForAllApiRoots;

        this.modalRef.componentInstance.collectionsExisting = this.collections;

        this.modalRef.result.then((resp: any) => {
            switch (resp.type) {
                case 'add': {
                    this.rws.push(resp.rw);
                    this.collections.push({
                        id: resp.rw.cId,
                        title: resp.title,
                        new: !resp.useExistingCollection,
                        can_read: true,
                        can_write: true,
                    });
                    break;
                }
                case 'update': {
                    const index = this.rws.findIndex((x) => x.cId === resp.rw.cId);
                    this.rws.splice(index, 1, resp.rw);
                    break;
                }
                default:
                    break;
            }
        });
    }

    removeRW(index) {
        this.rws.splice(index, 1);
    }

    handleError(err, defaultMsg = '') {
        if (err.status >= 400 && err.error?.description) {
            this.errorMessages.push('Error: ' + err.error.description);
            setTimeout(() => {
                this.errorMessages = [];
            }, 8000);
        } else {
            this.errorMessages.push('Error: ' + defaultMsg);
            setTimeout(() => {
                this.errorMessages = [];
            }, 8000);
        }
    }

    getServerValidation() {
        // Existing Collection
        if (!this.newObject) {
            this.stixService.getCertHeader(this.httpHeaders).then((header) => {
                let url = this.stixService.getBaseURLs().baseAdminURL + 'api-root/' + this.apiRootInput.fragment + '/' + 'lenients';
                this.httpClient.get<any>(url, { headers: header, observe: 'response' }).subscribe((resp: any) => {
                    this.serverValidationApiRoot = resp.body;
                    this.sortLenients(this.serverValidationApiRoot);

                    if (resp.body && resp.body.length > 0) {
                        this.setLenientValuesFromServer(resp.body);
                    }
                });
            });
        } else {
            this.stixService.getCertHeader(this.httpHeaders).then((header) => {
                let url = this.stixService.getBaseURLs().baseAdminURL + 'api-root/' + this.apiRootInput + '/' + 'lenients';
                this.httpClient.get<any>(url, { headers: header, observe: 'response' }).subscribe((resp: any) => {
                    this.serverValidationApiRoot = resp.body;
                    this.sortLenients(this.serverValidationApiRoot);

                    if (resp.body && resp.body.length > 0) {
                        this.setLenientValuesFromServer(resp.body);
                    }
                });
            });
        }
    }

    setLenientValuesFromServer(serverLenients) {
        serverLenients.forEach((sl) => {
            let checkLenient = this.serverValidation.slice(0, 10).find((vl) => vl.checkLenientValue === sl);
            if (checkLenient) {
                checkLenient.doCheck = false;
                checkLenient.doFail = 'false';
                checkLenient.disableBoth = true;
            }

            let failLenient = this.serverValidation.slice(0, 8).find((vl) => vl.failLenientValue === sl);
            if (failLenient) {
                failLenient.doFail = 'false';
            }

            failLenient = this.serverValidation.slice(8, 10).find((vl) => vl.failLenientValue === sl);
            if (failLenient) {
                failLenient.doFail = 'true';
            }

            checkLenient = this.serverValidation.slice(10, 11).find((vl) => vl.checkLenientValue === sl);
            if (checkLenient) {
                checkLenient.doCheck = true;
            }
        });
    }

    sortLenients(lenients: any) {
        lenients.sort(function (a, b) {
            if (a > b) {
                return 1;
            }
            if (b > a) {
                return -1;
            }
            return 0;
        });
    }

    updateCheck(event, obj) {
        if (event?.target?.value) {
            obj.doCheck = !obj.doCheck;
            console.info(obj.doCheck);

            if (!obj.doCheck) {
                obj.doFail = 'false';
                obj.disableBoth = true;
            } else {
                obj.disableBoth = false;
            }
        }
    }

    updateServerValidation(header: HttpHeaders) {
        let dontCkValidations = [
            ...this.serverValidation.slice(0, 10).filter((o) => !o.doCheck),
            ...this.serverValidation.slice(10, 11).filter((o) => o.doCheck),
        ];
        let dontFailValidations = [
            ...this.serverValidation.slice(0, 8).filter((o) => o.doFail !== 'true'),
            ...this.serverValidation.slice(8, 10).filter((o) => o.doFail !== 'false'),
        ];
        let validations = [...dontCkValidations.map((o) => o.checkLenientValue), ...dontFailValidations.map((o) => o.failLenientValue)];

        this.sortLenients(validations);

        if (JSON.stringify(validations) === JSON.stringify(this.serverValidationApiRoot)) {
            return;
        }

        const url = this.stixService.getBaseURLs().baseAdminURL + 'api-root/' + this.apiRootInput.fragment + '/lenients';
        this.httpClient.post<any>(url, validations, { headers: header, observe: 'response' }).subscribe({
            next: (resp) => {},
            error: (err) => {
                this.handleError(err, 'Please check server validation selection');
            },
        });
    }
}

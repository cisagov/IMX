import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { faChevronLeft, faEdit, faSave, faStop, faTrash, faTrashAlt, faPlus, faBan, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { StixService } from 'src/app/stix-service.service';
import { v4 as uuid } from 'uuid';
import { EnvService } from '../env-service/env.service';

@Component({
    selector: 'app-admin-collection',
    templateUrl: './admin-collection.component.html',
    styleUrls: ['./admin-collection.component.css'],
    standalone: false,
})
export class AdminCollectionComponent implements OnInit {
    @Input() collectionInput: any;
    @Input() apiRootInput: any;
    @Input() collectionsForAllApiRoots: any[];
    @Input() apiRoots: any;
    @Output() back: EventEmitter<any>;

    faInfoCircle = faInfoCircle;

    newObject = true;
    newMediaType = null;
    addNewMediaType = false;

    faChevronLeft = faChevronLeft;
    faEdit = faEdit;
    faSave = faSave;
    faStop = faStop;
    faTrash = faTrash;
    faTrashAlt = faTrashAlt;
    faPlus = faPlus;
    faBan = faBan;

    editingTitle = true;
    currentTitle = '';
    collection;
    errorMessages = [];

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
    serverValidationCollection: any;

    private readonly httpHeaders: HttpHeaders;

    constructor(
        private readonly httpClient: HttpClient,
        public stixService: StixService,
        private readonly envService: EnvService
    ) {
        this.back = new EventEmitter();

        this.httpHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
            .set('Content-Type', `application/taxii+json;version=2.1`);
    }

    ngOnInit(): void {
        this.newObject = Object.keys(this.collectionInput).length === 0;

        this.collection = {};
        for (let field in this.collectionInput) {
            this.collection[field] = this.collectionInput[field];
        }

        if (this.collection && !this.collection.description) {
            this.collection.description = '';
        }

        if (this.newObject) {
            this.collection.id = uuid();
            this.collection.can_read = true;
            this.collection.can_write = true;
        }

        if (this.newObject) {
            this.editTitle(true);
        } else {
            this.editTitle(false);
        }

        this.getServerValidation();
    }

    serverValidationList(startIndex: number = null, endIndex: number = null) {
        let start = 0;
        let end = this.serverValidation.length;
        let evenOnly = true;
        let list = [...this.serverValidation];

        if (startIndex !== null) {
            start = startIndex;
            list = [...this.serverValidation].slice(start);
        }

        if (endIndex !== null) {
            end = endIndex;
            list = [...this.serverValidation].slice(start, end);
        }

        if (evenOnly) {
            list = list.filter((o, i) => i % 2 === 0);
        }

        return list;
    }

    setAlias() {
        const url = this.stixService.getBaseURLs().baseAdminURL + 'collection/' + this.collection.id + '/setAlias';
        if (this.stixService.certFound === true)
            return this.httpClient.post<any>(url, this.collection.alias, {
                headers: this.httpHeaders.set('Authorization', this.stixService.cert),
                observe: 'response',
            });
        return this.httpClient.post<any>(url, this.collection.alias, { headers: this.httpHeaders, observe: 'response' });
    }

    setTitle() {
        const url = this.stixService.getBaseURLs().baseAdminURL + 'collection/' + this.collection.id + '/setTitle';
        if (this.stixService.certFound === true)
            return this.httpClient.post<any>(url, this.collection.title, {
                headers: this.httpHeaders.set('Authorization', this.stixService.cert),
                observe: 'response',
            });
        return this.httpClient.post<any>(url, this.collection.title, { headers: this.httpHeaders, observe: 'response' });
    }

    setMediaTypes() {
        const url = this.stixService.getBaseURLs().baseAdminURL + 'collection/' + this.collection.id + '/addMedia_type';

        if (this.stixService.certFound === true)
            return this.httpClient.post<any>(url, this.collection.media_types, {
                headers: this.httpHeaders.set('Authorization', this.stixService.cert),
                observe: 'response',
            });
        return this.httpClient.post<any>(url, this.collection.media_types, { headers: this.httpHeaders, observe: 'response' });
    }

    setCan_read() {
        const url = this.stixService.getBaseURLs().baseAdminURL + 'collection/' + this.collection.id + '/setCan_read';

        if (this.stixService.certFound === true)
            return this.httpClient.post<any>(url, this.collection.media_types, {
                headers: this.httpHeaders.set('Authorization', this.stixService.cert),
                observe: 'response',
            });
        return this.httpClient.post<any>(url, this.collection.can_read, { headers: this.httpHeaders, observe: 'response' });
    }

    setCan_write() {
        const url = this.stixService.getBaseURLs().baseAdminURL + 'collection/' + this.collection.id + '/setCan_write';

        if (this.stixService.certFound === true)
            return this.httpClient.post<any>(url, this.collection.media_types, {
                headers: this.httpHeaders.set('Authorization', this.stixService.cert),
                observe: 'response',
            });
        return this.httpClient.post<any>(url, this.collection.can_write, { headers: this.httpHeaders, observe: 'response' });
    }

    setDescription() {
        const url = this.stixService.getBaseURLs().baseAdminURL + 'collection/' + this.collection.id + '/setDescription';

        if (this.stixService.certFound === true)
            return this.httpClient.post<any>(url, this.collection.media_types, {
                headers: this.httpHeaders.set('Authorization', this.stixService.cert),
                observe: 'response',
            });
        return this.httpClient.post<any>(url, this.collection.description, { headers: this.httpHeaders, observe: 'response' });
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

    getServerValidation() {
        // Existing Collection
        this.stixService.getCertHeader(this.httpHeaders).then((header) => {
            let url = !this.newObject
                ? this.stixService.getBaseURLs().baseAdminURL + 'api-root/' + this.apiRootInput + '/' + this.collection.id + '/lenients'
                : this.stixService.getBaseURLs().baseAdminURL + 'api-root/' + this.apiRootInput + '/' + 'lenients';
            this.httpClient.get<any>(url, { headers: header, observe: 'response' }).subscribe((resp: any) => {
                this.serverValidationCollection = resp.body;
                this.sortLenients(this.serverValidationCollection);

                if (!this.newObject) {
                    if (resp.body?.length === 0) {
                        url = this.stixService.getBaseURLs().baseAdminURL + 'api-root/' + this.apiRootInput + '/' + 'lenients';
                        this.httpClient.get<any>(url, { headers: header, observe: 'response' }).subscribe((resp: any) => {
                            this.serverValidationApiRoot = resp.body;
                            this.sortLenients(this.serverValidationApiRoot);

                            if (resp.body && resp.body.length > 0) {
                                this.setLenientValuesFromServer(resp.body);
                            }
                        });
                    } else {
                        this.setLenientValuesFromServer(resp.body);
                    }
                } else if (resp.body?.length > 0) {
                    this.setLenientValuesFromServer(resp.body);
                }
            });
        });
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

        if (JSON.stringify(validations) === JSON.stringify(this.serverValidationCollection)) {
            return;
        }

        if (JSON.stringify(validations) === JSON.stringify(this.serverValidationApiRoot)) {
            return;
        }

        const url = this.stixService.getBaseURLs().baseAdminURL + 'api-root/' + this.apiRootInput + '/' + this.collection.id + '/lenients';
        this.httpClient.post<any>(url, validations, { headers: header, observe: 'response' }).subscribe({
            next: (resp) => {},
            error: (err) => {
                this.handleError(err, 'Please check server validation selection');
            },
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

    async backToMain(event = null) {
        this.errorMessages = [];

        if (event === 'save') {
            const emitObj = { type: 'save-collection', data: this.collection };

            if (this.newObject) {
                const url = this.stixService.getBaseURLs().baseAdminURL + 'collection?create=true';
                this.stixService.getCertHeader(this.httpHeaders).then((header) => {
                    this.httpClient.post<any>(url, this.collection, { headers: header, observe: 'response' }).subscribe({
                        next: (resp) => {
                            setTimeout(() => {
                                this.updateServerValidation(header);
                            }, 1000);

                            const url = this.stixService.getBaseURLs().baseAdminURL + 'api-root/' + this.apiRootInput + '/addRW';
                            const data = {
                                cId: this.collection.id,
                                readers: [],
                                writers: [],
                            };
                            this.httpClient.post<any>(url, data, { headers: header, observe: 'response' }).subscribe({
                                next: (resp) => {
                                    if (this.errorMessages.length === 0) {
                                        this.back.emit(emitObj);
                                    }
                                },
                                error: (err) => {
                                    this.handleError(err, 'Please check Collection assignment to API Root.');
                                },
                            });
                        },
                        error: (err) => {
                            this.handleError(err, 'Please check Collection parameters.');
                        },
                    });
                });
            } else {
                const url = this.stixService.getBaseURLs().baseAdminURL + 'collection';
                this.stixService.getCertHeader(this.httpHeaders).then(async (header) => {
                    try {
                        await this.postAdminCol(url, header);
                        if (this.errorMessages.length !== 0) return;

                        setTimeout(() => {
                            this.updateServerValidation(header);
                        }, 1000);
                        let fullRootList = this.getFullList();

                        let allRootTasks$ = [];
                        for (let r of fullRootList) {
                            let foundCollectionRWs = r.rws.find((rw) => rw.cId === this.collection.id);
                            if (foundCollectionRWs) {
                                if (!this.collection.can_read) {
                                    foundCollectionRWs.readers = [];
                                }

                                if (!this.collection.can_write) {
                                    foundCollectionRWs.writers = [];
                                }
                            }

                            let payload = {
                                fragment: r.fragment,
                                apiRoot: r.apiRoot,
                                rws: r.rws,
                            };

                            let url = this.stixService.getBaseURLs().baseAdminURL + 'api-root';
                            let task = await this.postTasks(url, payload, header);
                            allRootTasks$.push(task);
                        }

                        console.info(allRootTasks$);
                        this.back.emit(emitObj);
                    } catch (err) {
                        this.handleError(err, 'Please check Collection parameters.');
                    }
                });
            }
        } else {
            const emitObj = { type: 'cancel' };
            this.back.emit(emitObj);
        }
    }

    getFullList() {
        return this.apiRoots.filter((root) => {
            if (root.rws) {
                return root.rws.some((rw) => rw.cId === this.collection.id);
            }
        });
    }

    async postAdminCol(url, header) {
        return new Promise((resolve, reject) => {
            this.httpClient.post<any>(url, this.collection, { headers: header, observe: 'response' }).subscribe({
                next: (resp) => {
                    resolve(resp);
                },
                error: (err) => {
                    reject(err);
                },
            });
        });
    }

    async postTasks(url, payload, header) {
        return new Promise((resolve, reject) => {
            this.httpClient.post<any>(url, payload, { headers: header, observe: 'response' }).subscribe({
                next: (resp) => {
                    resolve(resp);
                },
                error: (err) => {
                    reject(err);
                },
            });
        });
    }

    editTitle(enableEdit = true) {
        if (enableEdit) {
            this.editingTitle = true;
        } else {
            this.editingTitle = false;
        }

        if (this.collection.title) {
            this.currentTitle = this.collection.title;
        } else {
            this.currentTitle = '';
        }
    }

    saveTitle() {
        this.collection.title = this.currentTitle;
        this.editingTitle = false;
    }

    cancelTitle() {
        this.editingTitle = false;
        this.currentTitle = null;
    }

    addMediaType() {
        if (this.collection.media_types) {
            this.collection.media_types.push(this.newMediaType);
        } else {
            this.collection['media_types'] = [];
            this.collection.media_types.push(this.newMediaType);
        }
        this.newMediaType = '';
    }

    removeMediaType(index) {
        this.collection.media_types.splice(index, 1);
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
}

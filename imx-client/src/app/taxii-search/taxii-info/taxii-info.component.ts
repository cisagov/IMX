import { HttpHeaders } from '@angular/common/http';
import { Component, ComponentRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { faSearch, faCaretDown, faUndo, faCircle, faBook } from '@fortawesome/free-solid-svg-icons';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';
import { EnvService } from 'src/app/env-service/env.service';
import { AdditionalFiltersComponent } from 'src/app/query-stix/additional-filters/additional-filters.component';
import { StixService } from 'src/app/stix-service.service';

@Component({
    selector: 'app-taxii-info',
    standalone: false,
    templateUrl: './taxii-info.component.html',
    styleUrls: ['./taxii-info.component.css', '../../dashboard/dashboard.component.css'],
})
export class TaxiiInfoComponent implements OnInit {
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

    private httpHeaders = new HttpHeaders()
        .set('Accept', 'application/taxii+json;version=2.1')
        .set('Authorization', `Basic ${btoa(this.stixService.taxiiServer.username + ':' + this.stixService.taxiiServer.password)}`);

    faSearch = faSearch;
    faCaretDown = faCaretDown;
    faUndo = faUndo;
    faCircle = faCircle;
    faBook = faBook;

    //Server config
    taxiiServer = {
        url: '',
        username: '',
        password: '',
        certificate: null,
        apiRoot: '',
        childRoot: '',
        availableCollections: [],
        collection: null,
    };
    taxiiServerType = this.stixService.taxiiServerType;
    taxiiServerSelection: string = '';
    taxiiServerAuthType = this.stixService.taxiiServerAuthType;
    taxiiServerUrl: string = '';

    currentAlert: any = undefined;

    isLoading = false;

    constructor(
        public stixService: StixService,
        private envService: EnvService,
        private announcementService: AnnouncementService
    ) {
        this.getAvailableAPIRoots = new EventEmitter();
        this.getAvailableCollections = new EventEmitter();
        this.selectRoot = new EventEmitter();
        this.selectCollection = new EventEmitter();
        this.selectGlobalSearch = new EventEmitter();
        this.setServerInfo = new EventEmitter();
    }

    async ngOnInit() {
        this.isLoading = true;
        this.currentAlert = localStorage['currentAlert'] ? JSON.parse(localStorage['currentAlert']) : undefined;

        await this.getServerDiscovery();
        await this.serverSetup();
        this.isLoading = false;
    }

    getApiVersions(root) {
        if (!root['versions']) return [];

        const versions = [];

        root.versions.forEach((version) => {
            versions.push(`v${version.split('version=')[1]}`);
        });

        return versions;
    }

    refreshTaxiiCreds() {
        switch (this.stixService.taxiiServerType) {
            case 'default':
            case 'a1':
            case 'sandbox':
            case 'cma':
                this.taxiiServerUrl = `${this.stixService.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion}/`;
                this.httpHeaders = new HttpHeaders()
                    .set('Accept', 'application/taxii+json;version=2.1')
                    .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);
                break;
            case 'custom':
                this.taxiiServerUrl = this.stixService.getCustomURL();
                break;
            default:
                this.taxiiServerUrl = this.stixService.taxiiServer.url.replace(
                    `${this.envService.env.taxiiServer.apiVersion}/taxii2/`,
                    `${this.envService.env.taxiiServer.apiVersion}/`
                );
        }
    }

    getServerDiscovery() {
        this.refreshTaxiiCreds();
        return new Promise((resolve, _) => {
            try {
                this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                    this.stixService.taxiiHttpReq('get', this.taxiiServerUrl + 'taxii2/', { headers: header }).subscribe(
                        (data: string) => {
                            this.setServerInfo.emit(data);
                            resolve(true);
                        },
                        (err) => {
                            console.error(err);
                            this.setServerInfo.emit(null);
                            resolve(true);
                        }
                    );
                });
            } catch (e) {
                this.announcementService.show(
                    'Failed to retrive server information',
                    `**Error Name ${e.name} Error Message: ${e.message}**`,
                    'error',
                    false
                );

                resolve(true);
            }
        });
    }

    async serverSetup() {
        if (!this.envService.env.aisTaxiiProxy) {
            await this.envService.wait('aisTaxiiProxy');
        }

        this.taxiiServer = {
            url: this.envService.env.taxiiServer.url,
            username: this.envService.env.taxiiServer.username,
            password: this.envService.env.taxiiServer.password,
            certificate: null,
            apiRoot: '',
            childRoot: '',
            availableCollections: [],
            collection: null,
        };

        const serverType = localStorage.getItem('taxiiServerType') ? localStorage.getItem('taxiiServerType') : 'default';
        this.serverSettingsChanged(serverType, false);
    }

    async refresh() {
        try {
            this.isLoading = true;
            await this.stixService.refreshRootCollections(true);
            await this.stixService.getAPIRoots();

            this.getAvailableAPIRoots.emit();
            this.getAvailableCollections.emit();
            this.isLoading = false;
        } catch (e) {
            this.isLoading = false;
        }
    }

    async serverSettingsChanged(type: string, refresh: boolean) {
        if (refresh) {
            await this.envService.checkAuth('/home');
        }
        if (this.stixService.isLoading) {
            await this.waitIsLoading();
        }

        this.updateTaxiiServerSelection(type, refresh);
    }

    async waitIsLoading() {
        return new Promise((resolve, reject) => {
            let interval = setInterval(() => {
                if (!this.stixService.isLoading) {
                    resolve(true);
                    clearInterval(interval);
                }
            }, 100);
        });
    }

    updateTaxiiServerSelection(type, refresh) {
        if (type === 'pfte') this.taxiiServerType === 'ais';
        else this.taxiiServerType = type;

        switch (type) {
            case 'default':
                this.taxiiServerSelection = 'default';
                this.stixService.publishToA1 = false;
                this.taxiiServer.url = this.envService.env.taxiiServer.url;
                this.taxiiServer.username = this.envService.env.taxiiServer.username;
                this.taxiiServer.password = this.envService.env.taxiiServer.password;
                this.taxiiServer.apiRoot = null;
                this.taxiiServer.childRoot = null;
                this.taxiiServer.collection = null;
                break;
            case 'a1':
            case 'raw':
                this.taxiiServerSelection = 'default';
                let collection = null;
                this.stixService.publishToA1 = true;
                this.stixService.apiRoots.find((r) => {
                    collection = r.collections.find(
                        (c) =>
                            c.id ===
                            (type === 'a1'
                                ? this.envService.env.taxiiServer.a1CollectionId
                                : type === 'raw'
                                  ? this.envService.env.taxiiServer.a1RawCollectionId
                                  : null)
                    );
                    return !!collection;
                });

                this.taxiiServer.url = this.envService.env.taxiiServer.url;
                this.taxiiServer.username = this.envService.env.taxiiServer.username;
                this.taxiiServer.password = this.envService.env.taxiiServer.password;
                this.taxiiServer.apiRoot = this.envService.env.taxiiServer.a1ApiRoot;
                this.taxiiServer.childRoot = this.envService.env.taxiiServer.a1ChildRoot;
                this.taxiiServer.collection = {
                    id: this.envService.env.taxiiServer.a1CollectionId,
                    title: collection ? collection.title : '',
                };
                break;
            case 'custom':
                this.taxiiServerSelection = 'custom';
                this.stixService.publishToA1 = false;
                this.taxiiServer.url = '';
                this.taxiiServer.username = '';
                this.taxiiServer.password = '';
                this.taxiiServer.apiRoot = null;
                this.taxiiServer.childRoot = null;
                this.taxiiServer.collection = null;
                break;
            case 'ais':
                this.taxiiServerSelection = 'ais';
                this.stixService.publishToA1 = false;
                this.taxiiServer.url = this.envService.env.aisTaxiiProxy.url;
                this.taxiiServer.username = this.envService.env.aisTaxiiProxy.username;
                this.taxiiServer.password = this.envService.env.aisTaxiiProxy.password;
                this.taxiiServer.apiRoot = null;
                this.taxiiServer.childRoot = null;
                this.taxiiServer.collection = null;
                break;
            case 'pfte':
                this.taxiiServerSelection = 'pfte';
                this.stixService.publishToA1 = false;
                this.taxiiServer.url = this.envService.env.pfteTaxiiProxy.url;
                this.taxiiServer.username = this.envService.env.pfteTaxiiProxy.username;
                this.taxiiServer.password = this.envService.env.pfteTaxiiProxy.password;
                this.taxiiServer.apiRoot = null;
                this.taxiiServer.childRoot = null;
                this.taxiiServer.collection = null;
                break;
            default:
                this.taxiiServer.url = '';
                this.taxiiServer.username = '';
                this.taxiiServer.password = '';
                this.selectedRoot = null;
                this.selectedColl = null;
                this.taxiiServer.apiRoot = null;
                this.taxiiServer.childRoot = null;
                this.taxiiServer.collection = null;
        }

        if (type != 'custom') {
            this.saveConfig(refresh);
        }
    }

    async saveConfig(refresh) {
        try {
            if (refresh === true) {
                await this.envService.checkAuth('/home');
            }

            this.stixService.isLoading = true;
            this.stixService.taxiiServer.username = this.taxiiServer.username;
            this.stixService.taxiiServer.password = this.taxiiServer.password;
            this.stixService.taxiiServer.url = this.taxiiServer.url;
            this.stixService.taxiiServerAuthType = this.taxiiServerAuthType;
            this.stixService.taxiiServerType = this.taxiiServerType;

            if (this.taxiiServerType === 'custom') {
                if (this.stixService.useCert) {
                    this.stixService.updateTaxiiServer('legacy', 'custom', this.taxiiServer.url);
                } else {
                    this.stixService.updateTaxiiServer(
                        'legacy',
                        'custom',
                        this.taxiiServer.url,
                        this.taxiiServer.username,
                        this.taxiiServer.password
                    );
                }
                if (refresh === true) {
                    await this.stixService.getAPIRoots('custom');
                }
            } else {
                this.stixService.updateTaxiiServer('legacy', this.taxiiServerType);
                if (refresh === true) {
                    await this.stixService.getAPIRoots();
                    this.stixService.updateLatency(this.announcementService);
                }
            }

            const configEvent = {
                type: 'config-loading',
                value: true,
            };

            if (refresh == true) {
                this.stixService.updateMarkingDef();
            }
            this.stixService.sendData(configEvent);

            this.getAvailableAPIRoots.emit();
            this.getAvailableCollections.emit();

            this.stixService.isLoading = false;
        } catch (e) {
            this.roots = [];
            this.collections = [];
            this.stixService.isLoading = false;
        }
    }
}

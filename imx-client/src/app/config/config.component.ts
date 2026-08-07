import { Component, OnInit, ComponentRef } from '@angular/core';
import { StixService } from '../stix-service.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AdditionalFiltersComponent } from '../query-stix/additional-filters/additional-filters.component';
import { faWaveSquare } from '@fortawesome/free-solid-svg-icons';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { faUser, faBan, faArrowLeft, faFile, faSave, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { LoggingService } from '../logging-service/logging.service';
import { CustomTaxiiComponent } from './custom-taxii/custom-taxii.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EnvService } from '../env-service/env.service';

@Component({
    selector: 'app-config',
    templateUrl: './config.component.html',
    styleUrls: ['./config.component.css'],
    standalone: false,
})
export class ConfigComponent implements OnInit {
    faConnect = faWaveSquare;

    faUser = faUser;
    faBan = faBan;
    faArrowLeft = faArrowLeft;
    faFile = faFile;
    faSave = faSave;
    faTrash = faTrash;
    faSpinner = faSpinner;

    selectedAPIRoot = null;
    APIRoots = [];
    aisUrl = '';
    selectedCollection;
    saved;
    taxiiServerSelection: string = ''; //Determines server display name after selecting from dropdown
    showCustomTaxii = false;
    customTaxiiType = '';
    generateCert: boolean;
    certPassword: string;
    crtFile: any;
    keyFile: any;
    pemFile: any;
    connectionError: string = '';
    connectionErrorURL: string = '';
    customTaxiiArray = [];
    isNewCustom: boolean;
    certName: string = '';
    orgName: string = '';
    userRoles = [];
    customTaxiiRef: MatDialogRef<CustomTaxiiComponent>;

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

    customInfo: {
        url: string;
        username: string;
        password: string;
        cert: string | File;
        key: string | File;
        roles: string[];
        useCert: boolean;
        pem: string | File;
        certPassword: string;
    };
    taxiiServerAuthType = this.stixService.taxiiServerAuthType;
    taxiiServerType = this.stixService.taxiiServerType;
    isLoadingRoots: boolean = false;
    moveoutCoverCollections: boolean = false;
    addFilters: boolean = false;
    componentsReferences = Array<ComponentRef<AdditionalFiltersComponent>>();
    isLoadingStix: boolean = false;

    isLoading = false;
    serverLatency: number;

    constructor(
        public stixService: StixService,
        private httpClient: HttpClient,
        private announcementService: AnnouncementService,
        private customTaxii: MatDialog,
        public envService: EnvService
    ) {}

    async ngOnInit(): Promise<void> {
        if (!this.envService.env.aisTaxiiProxy) {
            await this.envService.wait('aisTaxiiProxy');
        }

        this.aisUrl = this.envService.env.aisTaxiiProxy.url;
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
        this.initialize(true);
        this.stixService.getData().subscribe((data) => {
            switch (data.type) {
                case 'config-loading':
                    this.isLoading = data.value;
                    break;
            }
        });
    }

    initialize(auth) {
        const serverType = localStorage.getItem('taxiiServerType') ? localStorage.getItem('taxiiServerType') : 'default';
        this.serverSettingsChanged(serverType, auth);
        this.saved = true;
        if (serverType != 'ais') {
            this.retrieveCustomInfo();
        }
    }

    serverSettingsChanged(type: string, auth): void {
        console.debug(this.taxiiServer);
        this.isLoading = false;
        this.saved = false;
        if (type === 'pfte') this.taxiiServerType = 'ais';
        else this.taxiiServerType = type;

        if (type === 'default') {
            this.taxiiServerSelection = 'Default';
            this.stixService.publishToA1 = false;
            this.taxiiServer.url = this.envService.env.taxiiServer.url;
            this.taxiiServer.username = this.envService.env.taxiiServer.username;
            this.taxiiServer.password = this.envService.env.taxiiServer.password;
            this.taxiiServer.apiRoot = null;
            this.taxiiServer.childRoot = null;
            this.taxiiServer.collection = null;
        } else if (type === 'a1' || type === 'raw') {
            this.taxiiServerSelection = 'Default';
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
        } else if (type === 'custom') {
            this.taxiiServerSelection = 'Custom';
            this.stixService.publishToA1 = false;
            this.taxiiServer.url = '';
            this.taxiiServer.username = '';
            this.taxiiServer.password = '';
            this.taxiiServer.apiRoot = null;
            this.taxiiServer.childRoot = null;
            this.taxiiServer.collection = null;
        } else if (type === 'ais') {
            this.taxiiServerSelection = 'AIS';
            this.stixService.publishToA1 = false;
            this.taxiiServer.url = this.envService.env.aisTaxiiProxy.url;
            this.taxiiServer.username = this.envService.env.aisTaxiiProxy.username;
            this.taxiiServer.password = this.envService.env.aisTaxiiProxy.password;
            this.taxiiServer.apiRoot = null;
            this.taxiiServer.childRoot = null;
            this.taxiiServer.collection = null;
        } else if (type === 'pfte') {
            this.taxiiServerSelection = 'PFTE';
            this.stixService.publishToA1 = false;
            this.taxiiServer.url = this.envService.env.pfteTaxiiProxy.url;
            this.taxiiServer.username = this.envService.env.pfteTaxiiProxy.username;
            this.taxiiServer.password = this.envService.env.pfteTaxiiProxy.password;
            this.taxiiServer.apiRoot = null;
            this.taxiiServer.childRoot = null;
            this.taxiiServer.collection = null;
        } else if (type === 'cma') {
            this.taxiiServerSelection = 'CMA';
            this.stixService.publishToA1 = false;
            this.taxiiServer.url = this.envService.env.cmaServer.url;
            this.taxiiServer.username = this.envService.env.cmaServer.username;
            this.taxiiServer.password = this.envService.env.cmaServer.password;
            this.taxiiServer.apiRoot = null;
            this.taxiiServer.childRoot = null;
            this.taxiiServer.collection = null;
        } else {
            this.taxiiServer.url = '';
            this.taxiiServer.username = '';
            this.taxiiServer.password = '';
            this.APIRoots = [];
            this.selectedAPIRoot = null;
            this.selectedCollection = null;
            this.taxiiServer.apiRoot = null;
            this.taxiiServer.childRoot = null;
            this.taxiiServer.collection = null;
        }
        console.debug('After server change');
        console.debug(this.taxiiServer);
        if (type != 'custom') {
            this.saveConfig(auth);
        }
    }

    openCustomTaxiiModal(id = null) {
        if (id === '') return;
        this.stixService.publishToA1 = false;
        this.taxiiServerSelection = 'Custom';
        this.taxiiServer.apiRoot = null;
        this.taxiiServer.childRoot = null;
        this.taxiiServer.collection = null;
        this.generateCert = undefined;

        if (id !== null) {
            this.isNewCustom = false;
            this.customTaxiiRef = this.customTaxii.open(CustomTaxiiComponent, {
                data: {
                    taxiiServer: this.taxiiServer,
                    id: id,
                    isNewCustom: this.isNewCustom,
                    customTaxiiArray: this.customTaxiiArray,
                },
                minHeight: '200px',
                maxHeight: '70vh',
                width: `${window.innerWidth / 1.5}px`,
                panelClass: 'custom-taxii-dialog',
                position: {
                    top: '100px',
                },
            });

            this.customTaxiiRef.componentInstance.save.subscribe((config) => {
                this.stixService.useCert = config.useCert;
                this.stixService.taxiiServer.password = config.password;
                this.stixService.taxiiServer.username = config.username;
                this.stixService.taxiiServer.url = config.url;
                this.saveConfig(true);
            });

            this.customTaxiiRef.componentInstance.delete.subscribe((taxiiUrl) => {
                this.customTaxiiArray = this.customTaxiiArray.filter((elem) => elem !== taxiiUrl);
            });

            this.customTaxiiRef.afterClosed().subscribe(() => {
                this.customTaxiiType = '';
                this.connectionError = '';
                this.connectionErrorURL = '';
            });
        } else {
            this.taxiiServer.url = '';
            this.taxiiServer.username = '';
            this.taxiiServer.password = '';

            this.isNewCustom = true;
            this.customTaxiiRef = this.customTaxii.open(CustomTaxiiComponent, {
                data: {
                    taxiiServer: this.taxiiServer,
                    isNewCustom: this.isNewCustom,
                    customTaxiiArray: this.customTaxiiArray,
                },
                minHeight: '200px',
                maxHeight: '70vh',
                width: `${window.innerWidth / 1.5}px`,
                panelClass: 'custom-taxii-dialog',
                position: {
                    top: '100px',
                },
            });

            this.customTaxiiRef.componentInstance.save.subscribe((config) => {
                this.stixService.useCert = config.useCert;
                this.stixService.taxiiServer.password = config.password;
                this.stixService.taxiiServer.username = config.username;
                this.stixService.taxiiServer.url = config.url;
                this.saveConfig(true);
            });

            this.customTaxiiRef.afterClosed().subscribe(() => {
                this.customTaxiiType = '';
                this.connectionError = '';
                this.connectionErrorURL = '';
            });
        }
    }

    async saveConfig(refresh) {
        try {
            if (refresh === true) {
                await this.envService.checkAuth('/config');
            }
            this.stixService.isLoading = true;
            this.stixService.taxiiServer.username = this.taxiiServer.username;
            this.stixService.taxiiServer.password = this.taxiiServer.password;
            this.stixService.taxiiServer.url = this.taxiiServer.url;
            if (refresh) {
                this.stixService.apiRoots2 = [];
                this.stixService.apiRootDetails = [];
            }
            this.saved = true;
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

            if (refresh === true) {
                this.stixService.updateMarkingDef();
            }
            this.stixService.sendData(configEvent);
            this.stixService.isLoading = false;
        } catch (e) {
            this.stixService.isLoading = false;
        }
    }

    isConnectDisabled(): boolean {
        if (this.stixService.apiRootProcessingError != '') {
            this.saved = false;
        }

        if (this.taxiiServerType === 'custom' && (!this.taxiiServer.url || !this.taxiiServer.username || !this.taxiiServer.password)) {
            console.debug('Custom taxii server without url/username/password');
            return true;
        }

        return false;
    }

    retrieveCustomInfo() {
        const httpHeaders = new HttpHeaders().set(
            'Authorization',
            `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`
        );

        this.httpClient.get(`${this.envService.env.imxServer.url}/taxii`, { headers: httpHeaders }).subscribe((resp: any) => {
            resp?.hits?.hits.forEach((elem) => this.customTaxiiArray.push(elem._id));
        });
    }
}

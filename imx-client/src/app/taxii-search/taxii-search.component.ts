import { Component, OnInit, signal } from '@angular/core';
import { faServer, faUserFriends, faList } from '@fortawesome/free-solid-svg-icons';
import { faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';
import { EnvService } from '../env-service/env.service';
import { StixService } from '../stix-service.service';
import { AnnouncementService } from '../announcement-service/announcement-service.service';

@Component({
    selector: 'app-taxii-search',
    standalone: false,
    templateUrl: './taxii-search.component.html',
    styleUrls: ['./taxii-search.component.css', '../bundle/bundle.component.css'],
})
export class TaxiiSearchComponent implements OnInit {
    faServer = faServer;
    faUserFriends = faUserFriends;
    faList = faList;

    faRight = faAngleDoubleRight;

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
    APIRoots = [];
    selectedAPIRoot = null;
    selectedCollection = null;
    taxiiServerAuthType = this.stixService.taxiiServerAuthType;

    constructor(
        public stixService: StixService,
        private envService: EnvService,
        private announcementService: AnnouncementService
    ) {}

    ngOnInit() {
        this.serverSetup();
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
                this.APIRoots = [];
                this.selectedAPIRoot = null;
                this.selectedCollection = null;
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
            this.stixService.isLoading = false;
        } catch (e) {
            this.stixService.isLoading = false;
        }
    }
}

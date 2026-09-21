import { Component, ViewChild } from '@angular/core';
import { EnvService } from '../env-service/env.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import {
    faCloudUploadAlt,
    faClock,
    faCheck,
    faDownload,
    faGlasses,
    faCircle,
    faPlus,
    faArrowRight,
    faUndo,
    faFileAlt,
} from '@fortawesome/free-solid-svg-icons';
import { StixService } from '../stix-service.service';
import { SubmissionsService } from '../submissions-service/submissions.service';
import { HttpClient } from '@angular/common/http';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { LoggingService } from '../logging-service/logging.service';
import { SubmissionComponentComponent } from './dashboard-components/submission-component/submission-component.component';
import { BundleComponentComponent } from './dashboard-components/bundle-component/bundle-component.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { MispSubmissionComponent } from '../misp-submission/misp-submission.component';
import { KeycloakService } from '../auth/keycloak-service/keycloak.service';
import { OidcService } from '../auth/oidc-service/oidc.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css', '../app.component.css'],
    standalone: false,
})
export class DashboardComponent {
    @ViewChild(SubmissionComponentComponent) submissionComponent: SubmissionComponentComponent;
    @ViewChild(BundleComponentComponent) bundleComponent: BundleComponentComponent;
    @ViewChild(BaseChartDirective, { static: true }) chart: BaseChartDirective;
    @ViewChild(MispSubmissionComponent) mispSubmissionComponent: MispSubmissionComponent;

    //fa icons
    faUndo = faUndo;
    faPlus = faPlus;
    faArrowRight = faArrowRight;
    faCircle = faCircle;
    faGlasses = faGlasses;
    faCloudUploadAlt = faCloudUploadAlt;
    faClock = faClock;
    faStop = faFileAlt;
    faCheck = faCheck;
    faDownload = faDownload;

    environment = this.envService.env;

    //loading
    userLoading = false;
    taxiiLoading = false;
    submissionLoading = false;
    bundleLoading = false;
    dataLoading = false;

    //User config
    currentSelection: string = '';
    selectionOptions: string[] = [];

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
    selectedCollection;
    taxiiServerAuthType = this.stixService.taxiiServerAuthType;
    aisUrl = '';
    customTaxiiArray = [];

    submissionData: ChartConfiguration['data'] = {
        labels: [],
        datasets: [],
    };

    submissionStatus = {
        complete: 0,
        pending: 0,
        unknown: 0,
        total: 0,
    };

    chartType: ChartType = 'line';

    submissionDataOptions: ChartConfiguration['options'] = {
        maintainAspectRatio: false,
        responsive: true,
        layout: {
            // padding: 0,
            autoPadding: false,
            padding: {
                top: 20,
                right: 0,
            },
        },
        elements: {
            line: {
                tension: 0.4,
            },
        },
        hover: {
            mode: 'nearest',
            intersect: false,
        },
        scales: {
            // We use this empty structure as a placeholder for dynamic theming.
            y: {
                // offset: false,
                ticks: {
                    display: false,
                    padding: 0,
                },
                grid: {
                    display: false,
                    drawOnChartArea: false,
                    drawTicks: false,
                },
                border: {
                    display: false,
                },
            },
            x: {
                // offset: false,
                ticks: {
                    display: false,
                    padding: 0,
                },
                grid: {
                    display: false,
                    drawOnChartArea: false,
                    drawTicks: false,
                },
                border: {
                    display: false,
                },
            },
        },

        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'nearest',
                intersect: false,
            },
        },
    };

    constructor(
        public stixService: StixService,
        private envService: EnvService,
        private submissions: SubmissionsService,
        private httpClient: HttpClient,
        private loggingService: LoggingService,
        private announcementService: AnnouncementService,
        public modalService: NgbModal,
        private router: Router,
        private keycloak: KeycloakService,
        private oidc: OidcService
    ) {}

    async ngOnInit() {
        this.scrollToTop();

        //Populating user list
        this.getUsers();
        this.getSubmissionData(false);
        this.serverSetup();
    }

    async refresh() {
        await this.envService.checkAuth('/home');
        this.getSubmissionData(false);
        this.getSubmissions();
        this.getBundles();
        this.getMispSubmissions();
    }

    async getSubmissionData(checkAuth) {
        if (this.dataLoading) return;

        if (checkAuth) {
            await this.envService.checkAuth('/home');
        }

        try {
            this.dataLoading = true;

            const result: any = await this.submissions.aggregateSubmissions(this.currentSelection);

            this.submissionStatus.complete = result.data.status.complete;
            this.submissionStatus.pending = result.data.status.pending;
            this.submissionStatus.total = result.data.total;
            this.submissionStatus.unknown = result.data.status.unknown;

            const labels = [];
            const dataEntry = {
                data: [],
                label: 'Submissions',
                fill: 'origin',
                pointRadius: 0,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
            };

            result.data.day.forEach((entry) => {
                const date = new Date(entry.date);
                const options: Intl.DateTimeFormatOptions = { timeZone: 'UTC', month: 'short', day: '2-digit', year: 'numeric' };
                labels.push(new Intl.DateTimeFormat('en-US', options).format(date));
                dataEntry.data.push(entry.count);
            });

            this.submissionData.datasets = [dataEntry];

            this.submissionData.labels = [...labels];

            this.dataLoading = false;

            this.chart.render();
        } catch (err) {
            this.submissionData.labels = [];
            this.submissionData.datasets = [];
            this.submissionStatus.complete = 0;
            this.submissionStatus.pending = 0;
            this.submissionStatus.total = 0;
            this.submissionStatus.unknown = 0;
            this.dataLoading = false;

            this.chart.render();
        }
    }

    async getUsers() {
        this.currentSelection = this.envService.getUsername();
        this.selectionOptions = [this.currentSelection];

        if (this.envService.taxiiUsers === undefined) {
            await this.envService.waitUser();
        }

        for (let group in this.envService.groupInfo) {
            for (let user of this.envService.groupInfo[group]) {
                if (this.selectionOptions.includes(user.user)) continue;

                this.selectionOptions.push(user.user);
            }
        }

        for (let group in this.envService.groupInfo) {
            this.selectionOptions.push(`${group} (group)`);
        }

        if (this.envService.env.keycloak.enabled) {
            this.keycloak.getUserRoles().forEach((role) => {
                if (!this.selectionOptions.includes(role)) this.selectionOptions.push(role);
            });
        } else if (this.envService.env.oidc.enabled) {
            this.oidc.getRoles().forEach((role) => {
                if (!this.selectionOptions.includes(role)) this.selectionOptions.push(role);
            });
        }
    }

    getMispSubmissions() {
        this.mispSubmissionComponent.onUserChange();
    }

    getSubmissions() {
        this.submissionComponent.getSubmissions();
    }

    getBundles() {
        this.bundleComponent.getBundles();
    }

    async serverSetup() {
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

        const serverType = localStorage.getItem('taxiiServerType') ? localStorage.getItem('taxiiServerType') : 'default';
        this.serverSettingsChanged(serverType, false);
    }

    scrollToTop() {
        window.scroll({
            top: 0,
            left: 0,
            behavior: 'smooth',
        });
    }

    updateLoading(type: string, e) {
        switch (type) {
            case 'submission':
                this.submissionLoading = e;
                break;
            case 'bundle':
                this.bundleLoading = e;
                break;
        }
    }

    updateTaxiiServerSelection(type, refresh) {
        this.taxiiLoading = false;
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

    async serverSettingsChanged(type: string, refresh: boolean) {
        if (refresh) {
            await this.envService.checkAuth('/home');
        }
        if (this.stixService.isLoading) {
            await this.waitIsLoading();
        }

        this.updateTaxiiServerSelection(type, refresh);
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

    openModal(modal) {
        this.modalService.open(modal).result.finally(() => {});
    }

    startNewBundle() {
        this.modalService.dismissAll();
        this.stixService.clearBundle();
        this.router.navigate(['/', 'bundle']);
    }
}

import { Component } from '@angular/core';
import { EnvService } from '../env-service/env.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StixService } from '../stix-service.service';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuid } from 'uuid';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { forkJoin, Observable } from 'rxjs';

@Component({
    selector: 'app-taxii-sync',
    templateUrl: './taxii-sync.component.html',
    styleUrls: ['./taxii-sync.component.css', '../dashboard/dashboard.component.css'],
    standalone: false,
})
export class TaxiiSyncComponent {
    httpHeaders: HttpHeaders;
    jobs: any[] = [];
    loading = true;
    page = 1;
    faPlus = faPlus;

    currentJob;

    until = null;

    sourceApiRoots = [];
    sourceSelectedApiRoot = null;

    sourceCollections = {};
    sourceSelectedCollection = null;

    sourceUrl = '';
    sourceUsername = '';
    sourcePassword = '';

    destinationUrl = `${this.stixService.getBaseURLs().baseAdminURL}`;

    destinationApiRoots = [];
    destinationSelectedApiRoot = null;

    destinationCollections = [];
    destinationSelectedCollection = null;

    taxiiConnected = false;
    taxiiLoading = false;
    viewingJob = false;
    loadingJob = false;

    defaultConfig = {
        remote: {
            uuid: '',
            'upsert-info': {
                url: '',
            },
            'accept-info': {
                url: '',
            },
        },
        info: {
            url: '',
            username: '',
            password: '',
        },
        fragment: '',
        cId: '',
        workerCount: 1,
        workerDuration: 'PT24H',
    };

    config = {
        remote: {
            uuid: '',
            'upsert-info': {
                url: '',
            },
            'accept-info': {
                url: '',
            },
        },
        info: {
            url: '',
            username: '',
            password: '',
        },
        fragment: '',
        cId: '',
        workerCount: 1,
        workerDuration: 'PT24H',
    };

    constructor(
        private readonly envService: EnvService,
        private readonly httpClient: HttpClient,
        public readonly stixService: StixService,
        private readonly announcementService: AnnouncementService
    ) {}

    ngOnInit() {
        this.httpHeaders = new HttpHeaders()
            .set('Accept', 'application/json')
            .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
            .set('Content-Type', `application/json`);

        this.getCurrentJobs();
        this.getDestinationApiRoots();
    }

    populateDefaultConfig() {
        this.config = JSON.parse(JSON.stringify(this.defaultConfig));

        this.config.remote.uuid = uuid();
        this.config.remote['upsert-info'].url = `${this.stixService.getBaseURLs().baseAdminURL}clientJob/upsert`;
    }

    populateJobConfig() {
        this.config.remote['accept-info'].url =
            `${this.stixService.getBaseURLs().baseTaxiiURL}${this.destinationSelectedApiRoot}/collections/${this.destinationSelectedCollection}/objects/`;

        this.config.info.url = this.sourceUrl.endsWith('/') ? this.sourceUrl + 'taxii/v2.1-os/' : this.sourceUrl + '/taxii/v2.1-os/';
        this.config.info.username = this.sourceUsername;
        this.config.info.password = this.sourcePassword;

        this.config.fragment = this.sourceSelectedApiRoot;
        this.config.cId = this.sourceSelectedCollection;
    }

    getCurrentJobs() {
        this.loading = true;

        this.stixService.getCert(this.httpHeaders, (headers: HttpHeaders) => {
            this.httpClient
                .get<any>(`${this.stixService.getBaseURLs().baseAdminURL}clientJob/list`, { headers: headers, observe: 'response' })
                .subscribe((resp) => {
                    this.jobs = resp.body;
                    this.loading = false;
                });
        });
    }

    setPage(num) {
        this.page = num;

        if (this.page === 2 && !this.viewingJob) this.populateDefaultConfig();
    }

    viewJob(job) {
        this.currentJob = job;
        this.viewingJob = true;

        this.config.remote.uuid = job.configuration.remote.uuid;

        this.sourceUrl = job.configuration.info.url;
        this.sourceUsername = job.configuration.info.username;
        this.sourcePassword = job.configuration.info.password;

        this.sourceSelectedApiRoot = job.configuration.fragment;
        this.sourceSelectedCollection = job.configuration.cId;

        [this.destinationSelectedApiRoot, this.destinationSelectedCollection] = this.retrieveApiCollectInfo(
            job.configuration.remote['accept-info'].url
        );
        this.setPage(2);
    }

    retrieveApiCollectInfo(str) {
        'http://localhost:9443/taxii/v2.1-os/test-sync/collections/092a94fe-57a9-43e1-b72f-edb4dccd74bd/objects/';
        let strArr = str.split('taxii/v2.1-os/');

        strArr = strArr[1].split('/collections/');

        const api = strArr[0];

        const collection = strArr[1].split('/objects/')[0];

        return [api, collection];
    }

    getDestinationApiRoots() {
        this.destinationApiRoots = this.stixService.apiRoots2.filter((r) => r.collections.some((c) => c.can_write));
    }

    getDestinationCollections() {
        if (!this.destinationSelectedApiRoot) return;

        const apiRoot = this.destinationApiRoots.find((r) => {
            return r.title === this.destinationSelectedApiRoot;
        });

        this.destinationCollections = apiRoot.collections.filter((c) => c.can_write);
    }

    getSourceApiRoots() {
        this.taxiiLoading = true;
        this.taxiiConnected = false;

        const url = this.sourceUrl.endsWith('/') ? `${this.sourceUrl}admin/v1.0/` : `${this.sourceUrl}/admin/v1.0/`;

        const httpHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.sourceUsername + ':' + this.sourcePassword)}`)
            .set('Content-Type', `application/taxii+json;version=2.1`);

        this.httpClient.get(`${url}api-roots`, { headers: httpHeaders, observe: 'response' }).subscribe(
            async (resp) => {
                const body: any = resp.body;

                this.sourceApiRoots = [];
                this.sourceCollections = {};

                const gets: Observable<any>[] = [];

                for (const api of body) {
                    const fragment = api.fragment;
                    this.sourceApiRoots.push(fragment);

                    gets.push(this.httpClient.get(`${url}api-root/${fragment}/collections`, { headers: httpHeaders, observe: 'response' }));
                }

                forkJoin(gets).subscribe((data) => {
                    data.forEach((resp, index) => {
                        if (!resp.body.collections) resp.body.collections = [];

                        this.sourceCollections[this.sourceApiRoots[index]] = resp.body.collections.filter((collection) => collection.can_write);
                    });

                    this.taxiiLoading = false;
                    this.taxiiConnected = true;
                });
            },
            (err) => {
                this.taxiiLoading = false;
                this.announcementService.show(
                    'Failed to connect to Source TAXII Server',
                    `Error occured while trying to connect to Source TAXII Server: ${err.message}`,
                    'error',
                    false
                );
            }
        );
    }

    validJob() {
        if (
            !this.destinationSelectedApiRoot ||
            !this.destinationSelectedCollection ||
            !this.sourceUrl ||
            !this.sourceUsername ||
            !this.sourcePassword ||
            !this.sourceSelectedApiRoot ||
            !this.sourceSelectedCollection ||
            !this.until
        )
            return false;

        return true;
    }

    createJob() {
        this.loadingJob = true;

        this.populateJobConfig();

        this.httpClient
            .post<any>(`${this.stixService.getBaseURLs().baseAdminURL}clientJob/taxii`, JSON.stringify(this.config), {
                headers: this.httpHeaders,
                observe: 'response',
            })
            .subscribe(
                (resp) => {
                    const begin = new Date().toISOString();
                    const snapshot = {
                        uuid: uuid(),
                        workerParams: [
                            {
                                begin: begin,
                                end: new Date(this.until).toISOString(),
                                filters: {
                                    added_after: [begin],
                                    'match[version]': ['all'],
                                    limit: ['64'],
                                },
                            },
                        ],
                        nextWorker: begin,
                    };

                    const snapshotUrl = `${this.stixService.getBaseURLs().baseAdminURL}clientJob/${this.config.remote.uuid}/snapshot`;
                    this.httpClient.post(snapshotUrl, JSON.stringify(snapshot), { headers: this.httpHeaders, observe: 'response' }).subscribe(
                        (resp) => {
                            this.announcementService.show(
                                'Successfully created a Job',
                                'TAXII Server has successfully created a job.',
                                'success',
                                false
                            );
                            this.cancelJob();
                        },
                        (err) => {
                            this.announcementService.show(
                                'Failed to create Snapshot',
                                `Job has been created successfully, but creating snapshot has failed. Error: ${err.message}`,
                                'error',
                                false
                            );
                            this.cancelJob();
                        }
                    );
                },
                (err) => {
                    this.announcementService.show('Failed to create Job', `Failed to create job. Error: ${err.message}`, 'error', false);
                    this.loadingJob = false;
                }
            );
    }

    deleteJob() {
        const url = `${this.stixService.getBaseURLs().baseAdminURL}clientJob/${this.config.remote.uuid}`;

        this.httpClient.delete<any>(url, { headers: this.httpHeaders, observe: 'response' }).subscribe(
            (resp) => {
                this.announcementService.show('Successfully deleted a Job', 'TAXII Server has successfully deleted a job.', 'success', false);
                this.cancelJob();
            },
            (err) => {
                this.announcementService.show('Failed to delete Job', `Error: ${err.message}`, 'error', false);
                this.loadingJob = false;
            }
        );
    }

    cancelJob() {
        this.page = 1;

        this.viewingJob = false;
        this.loadingJob = false;
        this.getCurrentJobs();
        this.resetJobConfig();
    }

    resetJobConfig() {
        this.viewingJob = false;

        this.currentJob = null;
        this.config = JSON.parse(JSON.stringify(this.defaultConfig));
        this.sourceApiRoots = [];
        this.sourceSelectedApiRoot = null;

        this.sourceCollections = {};
        this.sourceSelectedCollection = null;

        this.sourceUrl = '';
        this.sourceUsername = '';
        this.sourcePassword = '';

        this.destinationApiRoots = [];
        this.destinationSelectedApiRoot = null;

        this.destinationCollections = [];
        this.destinationSelectedCollection = null;

        this.until = null;

        this.taxiiConnected = false;
        this.taxiiLoading = false;
    }
}

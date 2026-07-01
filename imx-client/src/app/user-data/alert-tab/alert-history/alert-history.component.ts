import { Component, OnInit } from '@angular/core';
import { faArrowRight, faArrowLeft, faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { AlertService } from './alert-service/alert.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StixService } from 'src/app/stix-service.service';
import { EnvService } from 'src/app/env-service/env.service';

@Component({
    selector: 'app-alert-history',
    templateUrl: './alert-history.component.html',
    styleUrls: ['./alert-history.component.css'],
    standalone: false,
})
export class AlertHistoryComponent implements OnInit {
    faArrowRight = faArrowRight;
    faArrowLeft = faArrowLeft;
    faAngleUp = faAngleUp;
    faAngleDown = faAngleDown;

    alertTable: any[] = [];

    isLoading: boolean = false;
    isSearching: boolean = false;

    currentPage: number = 1;
    totalPages: number = 0;
    rowNumber: number = -1;

    alertResults: any = {};

    sortKey: string = 'na';

    apiRootDetails = [];
    targets = [];

    httpHeaders = new HttpHeaders()
        .set('Accept', 'application/taxii+json;version=2.1')
        .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);

    constructor(
        private readonly alertService: AlertService,
        private readonly httpClient: HttpClient,
        private readonly stixService: StixService,
        private readonly envService: EnvService
    ) {}

    ngOnInit(): void {
        this.getAlerts();
    }

    async getAlerts() {
        this.isLoading = true;
        this.targets = [];

        try {
            this.apiRootDetails = await this.getApiRoots();
            let result: any = await this.alertService.getAlerts(this.currentPage, this.sortKey);
            this.totalPages = Math.ceil(result.total.value / 15);

            for (let hit of result.hits) {
                if (hit._source.query.type === 'collection') {
                    this.pushTargets(hit);
                }
            }

            this.alertTable = result.hits;
            this.isLoading = false;
        } catch (err) {
            console.error(err);
            this.targets = [];
            this.isLoading = false;
            this.alertTable = [];
        }
    }

    pushTargets(hit: any): void {
        let colFound = false;

        for (let root of this.apiRootDetails) {
            if (hit._source.query.apiRoot === root.apiPath) {
                for (let col of root.collections) {
                    if (col.id === hit._source.query.collectionID) {
                        colFound = true;
                        this.targets.push(`${root.title}/${col.title}`);
                    }
                }

                if (colFound === true) break;
            }
        }

        if (colFound === false) this.targets.push('Did not find Target');
    }

    async getApiRootInfo(rootUrl) {
        return new Promise((resolve, reject) => {
            this.httpClient.get(rootUrl, { headers: this.httpHeaders }).subscribe({
                next: (data) => resolve(data),
                error: (err) => reject(err),
            });
        });
    }

    async getCollectionsInfo(rootUrl) {
        return new Promise((resolve, reject) => {
            this.httpClient.get(`${rootUrl}collections/`, { headers: this.httpHeaders }).subscribe({
                next: (data) => resolve(data),
                error: (err) => reject(err),
            });
        });
    }

    async getApiRoots(): Promise<any[]> {
        this.apiRootDetails = [];

        return new Promise((resolve, reject) => {
            this.getTaxiiDiscovery()
                .then(async (data: any) => {
                    if (data?.api_roots) {
                        let tempRoots: any[] = [];

                        for (let currRoot of data.api_roots) {
                            let splitRoot = currRoot.split('/');

                            let rootInfo = await this.getApiRootInfo(currRoot);
                            let collectionsInfo: any = await this.getCollectionsInfo(currRoot);
                            let collections = collectionsInfo.collections.filter((collection) => collection.can_write === true);

                            if (collections.length !== 0) {
                                rootInfo['apiPath'] = splitRoot[splitRoot.length - 2];
                                rootInfo['collections'] = collections;
                                tempRoots.push(rootInfo);
                            }
                        }
                        resolve(tempRoots);
                    } else {
                        resolve([]);
                    }
                })
                .catch((error) => {
                    console.error(error);
                    reject(error);
                });
        });
    }

    async getTaxiiDiscovery() {
        let getDiscoveryURL = `${this.envService.env.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion + '/'}taxii2/`;

        return new Promise((resolve, reject) => {
            this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                this.httpClient.get(getDiscoveryURL, { headers: this.httpHeaders }).subscribe({
                    next: (data) => {
                        resolve(data);
                    },
                    error: (err) => {
                        reject(err);
                    },
                });
            });
        });
    }

    getTarget(index) {
        return this.targets[index];
    }

    getHits(index) {
        if (this.alertTable[index]._source.hits > 50) {
            return '50+';
        } else {
            return this.alertTable[index]._source.hits;
        }
    }

    async changeShow(index) {
        let result = confirm('This will open a new tab and search for objects, click confirm to continue');

        if (result === true) {
            //Update read on alert
            if (this.alertTable[index]._source.read === false) {
                this.alertTable[index]._source.read = true;
                await this.alertService.updateAlert(this.alertTable[index]);
                this.stixService.getUnreadAlerts();
            }

            //Store reference in stixService
            localStorage['currentAlert'] = JSON.stringify(this.alertTable[index]);

            //Redirect to new tab to query page (use stix service to hopefully populate)
            window.open('/query-stix');
        }
    }

    async nextPage(direction) {
        await this.envService.checkAuth('/my-profile');

        switch (direction) {
            case 'left':
                this.currentPage--;
                break;
            case 'right':
                this.currentPage++;
                break;
        }
        this.getAlerts();
    }
}

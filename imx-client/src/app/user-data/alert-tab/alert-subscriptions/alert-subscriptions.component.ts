import { Component, OnInit } from '@angular/core';
import { faArrowRight, faArrowLeft, faAngleUp, faAngleDown, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { AlertSubDialogueComponent } from './alert-sub-dialogue/alert-sub-dialogue.component';
import { AlertSubsService } from './alert-subs-service/alert-subs.service';
import { StixService } from 'src/app/stix-service.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';
import { EnvService } from 'src/app/env-service/env.service';

@Component({
    selector: 'app-alert-subscriptions',
    templateUrl: './alert-subscriptions.component.html',
    styleUrls: ['./alert-subscriptions.component.css'],
    standalone: false,
})
export class AlertSubscriptionsComponent implements OnInit {
    faArrowRight = faArrowRight;
    faArrowLeft = faArrowLeft;
    faAngleUp = faAngleUp;
    faAngleDown = faAngleDown;
    faPlus = faPlus;
    faTrash = faTrash;

    alertSubsTable: any[] = [];
    apiRootDetails: any[] = [];
    apiRoots: any[] = [];

    isLoading: boolean = true;

    currentPage: number = 1;
    totalPages: number = 0;
    rowNumber: number = -1;

    alertResults: any = {};

    sortKey: string = 'na';

    descriptions: string[] = [];

    httpHeaders = new HttpHeaders()
        .set('Accept', 'application/taxii+json;version=2.1')
        .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);

    constructor(
        public subDialog: MatDialog,
        private readonly alertSubsService: AlertSubsService,
        private readonly stixService: StixService,
        private readonly httpClient: HttpClient,
        private readonly announcement: AnnouncementService,
        private readonly envService: EnvService
    ) {}

    ngOnInit(): void {
        this.getSubs();
    }

    async getSubs(): Promise<void> {
        this.isLoading = true;
        this.descriptions = [];

        let getSubsRes: any = await this.alertSubsService.getAlertSubs(this.currentPage, this.sortKey);
        this.totalPages = Math.ceil(getSubsRes.total.value / 15);

        this.alertSubsTable = getSubsRes.hits;
        this.apiRoots = await this.getApiRoots();

        for (let hit of getSubsRes.hits) {
            this.pushDescription(hit);
        }

        this.stixService.getUnreadAlerts();

        this.isLoading = false;
    }

    pushDescription(hit: any): void {
        let currRoot = hit._source.sub.apiRootPath;
        let currCollectionId = hit._source.sub.collection;
        let collFound = false;

        for (let root of this.apiRoots) {
            if (root.apiPath === currRoot) {
                for (let coll of root.collections) {
                    if (coll.id === currCollectionId) {
                        collFound = true;
                        this.descriptions.push(`${root.title}/${coll.title}`);
                        break;
                    }
                }

                if (collFound === true) break;
            }
        }

        if (collFound === false) this.descriptions.push('Did not find');
    }

    async getApiRootInfo(rootUrl: string) {
        return new Promise((resolve) => {
            this.httpClient.get(rootUrl, { headers: this.httpHeaders }).subscribe((data) => {
                resolve(data);
            });
        });
    }

    async getCollectionsInfo(rootUrl) {
        return new Promise((resolve) => {
            this.httpClient.get(`${rootUrl}collections/`, { headers: this.httpHeaders }).subscribe((data) => {
                resolve(data);
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

    async addSub() {
        await this.envService.checkAuth('/my-profile');
        const dialogRef = this.subDialog.open(AlertSubDialogueComponent, {
            data: { apiRoots: this.apiRoots },
            height: '600px',
            width: `${window.innerWidth / 2}px`,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result?.status === 201) {
                this.announcement.show('Subscription Created', 'You have successfully subscribed for an alert', 'success', false);
                this.getSubs();
            }
        });
    }

    changeShow(index) {
        if (this.rowNumber === index) {
            this.rowNumber = -1;
        } else {
            let tempResult = {};
            for (let field in this.alertSubsTable[index]._source) {
                if (field !== 'users') {
                    tempResult[field] = this.alertSubsTable[index]._source[field];
                }
            }
            this.alertResults = tempResult;
            this.rowNumber = index;
        }
    }

    async deleteSub(obj) {
        await this.envService.checkAuth('/my-profile');
        let result: any = await this.alertSubsService.removeAlertSub(obj._id);

        if (result.status === 200) {
            this.announcement.show('Subscription Removed', 'You have successfully unsubscribed for an alert', 'success', false);
            this.getSubs();
        } else {
            this.announcement.show(
                'Subscription Error',
                'There was an error communicating to the IMX Server to remove your subscription. Please refresh and try again or create a support request',
                'error',
                false
            );
        }
    }

    getTarget(index) {
        return this.descriptions[index];
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
        this.getSubs();
    }
}

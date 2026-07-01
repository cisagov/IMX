import { Component, Inject } from '@angular/core';
import { faPlus, faBan } from '@fortawesome/free-solid-svg-icons';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StixService } from 'src/app/stix-service.service';
import { AlertSubsService } from '../alert-subs-service/alert-subs.service';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';
import { EnvService } from 'src/app/env-service/env.service';

export interface AlertSubData {
    apiRoots: [];
}

@Component({
    selector: 'app-alert-sub-dialogue',
    templateUrl: './alert-sub-dialogue.component.html',
    styleUrls: ['./alert-sub-dialogue.component.css'],
    standalone: false,
})
export class AlertSubDialogueComponent {
    faPlus = faPlus;
    faBan = faBan;

    apiRoots = [];
    collections = [];

    loadingApiRoots: boolean = false;

    selectedAPIRoot = undefined;
    selectedCollection = undefined;
    taxiiServer = {
        availableCollections: [],
        apiRoot: '',
        childRoot: '',
        collection: {},
    };

    constructor(
        public dialogRef: MatDialogRef<AlertSubDialogueComponent>,
        @Inject(MAT_DIALOG_DATA) public data: AlertSubData,
        public stixService: StixService,
        private readonly alertSubsService: AlertSubsService,
        private readonly announcement: AnnouncementService,
        private readonly envService: EnvService
    ) {
        this.apiRoots = data.apiRoots;
    }

    async addSub(): Promise<void> {
        let newSub = {
            taxiiServer: this.envService.env.taxiiServer.url,
            type: 'collection',
            sub: {
                apiRootPath: this.selectedAPIRoot.apiPath,
                collection: this.selectedCollection.id,
            },
        };

        let result: any = await this.alertSubsService.addAlertSub(newSub);

        if (result.status === 201) {
            this.dialogRef.close(result);
        } else {
            this.announcement.show(
                'Subscription Error',
                'There was an error communicating to the IMX Server to create your subscription. Please try again or create a support request',
                'error',
                false
            );
        }
    }

    onCollectionChanged(collection): void {
        this.selectedCollection = collection;
        this.taxiiServer.collection = collection;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onX(): void {
        this.dialogRef.close();
    }

    selectApiRoot(apiRoot): void {
        this.selectedAPIRoot = apiRoot;
        this.taxiiServer.apiRoot = apiRoot.title;
        this.taxiiServer.childRoot = apiRoot.childRoot;
        this.selectedCollection = undefined;

        for (let root of this.apiRoots) {
            if (this.selectedAPIRoot.apiPath === root.apiPath) {
                this.collections = root.collections;
                break;
            }
        }
    }
}

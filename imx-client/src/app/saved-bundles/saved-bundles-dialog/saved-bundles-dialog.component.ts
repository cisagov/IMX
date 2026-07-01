import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StixService } from '../../stix-service.service';
import { Bundle } from '../../models/bundle';
import { AnnouncementService } from '../../announcement-service/announcement-service.service';
import { STIX_OBJECTS_LIST } from '../../models/stix-objects';
import { faBan, faBackspace, faRandom, faTrash, faReply, faSave } from '@fortawesome/free-solid-svg-icons';
import { SubmissionsService } from 'src/app/submissions-service/submissions.service';

export interface SavedBundleData {
    mode: string;
    table: string;
    bundle: any;
}
@Component({
    selector: 'app-saved-bundles-dialog',
    templateUrl: './saved-bundles-dialog.component.html',
    styleUrls: ['./saved-bundles-dialog.component.css'],
    standalone: false,
})
export class SavedBundlesDialogComponent {
    faBan = faBan;
    faDiscard = faBackspace;
    faMerge = faRandom;
    faTrash = faTrash;
    faTransfer = faReply;
    faSave = faSave;

    mode: string = '';
    table: string = '';
    invalidName: string = '';
    activeTab = 'jsonViewer';
    guidedUI = false;

    bundleName: any = '';
    currentBundle: any;
    objects: any[];

    isDiscarding: boolean = false;
    isMerging: boolean = false;

    bundle: Bundle;

    constructor(
        public stixService: StixService,
        private readonly announcementService: AnnouncementService,
        private readonly submissions: SubmissionsService,
        public dialogRef: MatDialogRef<SavedBundlesDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: SavedBundleData
    ) {
        this.mode = data.mode;
        this.table = data.table;
        this.currentBundle = data.bundle;
        if (this.mode !== 'Save') {
            switch (this.table) {
                case 'profile':
                    this.bundleName = data.bundle._source.name;
                    this.objects = data.bundle._source.bundle;
                    break;
                case 'local':
                    this.bundleName = data.bundle.name;
                    this.objects = data.bundle.bundle;
                    break;
            }
        }
    }

    invalidBundleName() {
        let savedBundleDict = {};
        for (let bundle of this.stixService.savedBundles) {
            savedBundleDict[bundle.name] = bundle.bundle;
        }

        if (savedBundleDict[this.bundleName]) {
            this.invalidName = 'Name already in use';
            return true;
        }
        this.invalidName = '';
        return false;
    }

    getStixPreview(): Bundle {
        let tempBundle: any = {};
        if (this.mode === 'Save') {
            tempBundle = JSON.parse(JSON.stringify(this.stixService.bundle));
        } else if (this.table === 'profile') {
            tempBundle = JSON.parse(JSON.stringify(this.currentBundle._source.bundle));
        } else {
            tempBundle = JSON.parse(JSON.stringify(this.currentBundle.bundle));
        }

        if (tempBundle.objects && tempBundle.objects.length > 0) {
            tempBundle.objects.forEach((o) => {
                if (o.description) {
                    delete o.description;
                }
            });
        }
        return tempBundle;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onX(): void {
        this.dialogRef.close();
    }

    async onMergeBundle() {
        this.isMerging = true;

        setTimeout(async () => {
            try {
                await this.addObjectsAsync(this.objects);
            } catch (error) {
                this.announcementService.show('Unexpected error while merging bundle', `${error}`, 'merge-error', false);
            } finally {
                this.isMerging = false;
                this.loadVersioning();
                if (!localStorage.getItem('bundle-name')) {
                    const bundleName = JSON.stringify({
                        bundleName: this.bundleName,
                        table: this.table,
                    });
                    localStorage.setItem('bundle-name', bundleName);

                    if (!this.stixService.reportName) this.stixService.setReportName(this.bundleName);
                }
                this.dialogRef.close({ result: 'send', bundle: '' });
            }
        });
    }

    async onDiscardBundle() {
        this.isMerging = true;
        this.isDiscarding = true;
        this.loadVersioning();
        const bundleName = JSON.stringify({
            bundleName: this.bundleName,
            table: this.table,
        });

        this.stixService.clearBundle();
        await this.addObjectsAsync(this.objects);

        localStorage.setItem('bundle-name', bundleName);

        if (!this.stixService.reportName) this.stixService.setReportName(this.bundleName);

        this.dialogRef.close({ result: 'send', bundle: 'clear', objects: this.objects });
    }

    async addObjectsAsync(objects: any): Promise<void> {
        const objectsToAdd = objects.map((object) => {
            return { id: object.id, index: this.stixService.imxCacheIndex++, object: object };
        });

        await this.stixService.db.imxCache.bulkPut(objectsToAdd);
        const addedBundle = await this.stixService.db.imxCache.orderBy('index').toArray();
        const newBundle = addedBundle.map((obj) => obj.object);
        this.stixService.bundle.objects = newBundle.filter((obj) => STIX_OBJECTS_LIST.includes(obj.type));
        this.stixService.customObjects = newBundle.filter((obj) => !STIX_OBJECTS_LIST.includes(obj.type));

        this.stixService.imxCacheIndex = addedBundle.length > 0 ? addedBundle[addedBundle.length - 1].index + 1 : 1;

        for (let obj of objects) {
            this.stixService.addIdentity(obj);
        }
    }

    onSave(destination): void {
        let this_source = {};
        let this_target = {};

        this.dialogRef.close({ source: this_source, target: this_target });
    }

    onTransfer(destination): void {
        this.dialogRef.close({ transfer: true, table: this.table, destination: destination, bundle: this.currentBundle });
    }

    onDelete(): void {
        this.dialogRef.close({ delete: true, table: this.table, bundle: this.currentBundle });
    }

    loadVersioning(): void {
        const newVersion = JSON.parse(localStorage.getItem('new_version_objects'));
        const newVersionToAdd = this.table === 'profile' ? this.currentBundle?._source?.new_version_objects : this.currentBundle?.new_version_objects;
        const discarding = this.isDiscarding;

        if (!newVersionToAdd || newVersionToAdd.length === 0) {
            const submissionId = this.table === 'profile' ? this.currentBundle?._source?.submissionID : this.currentBundle?.submissionID;

            if (!submissionId) return;

            this.submissions.getSubmissionByID(submissionId).then((res: any) => {
                const result = res.res;
                if (!result.successes) result.successes = [];

                if (result.failures && result.failures.length > 0) {
                    const duplicates = result.failures.filter((f) => f.message === 'duplicate collection/object/version\n');
                    if (duplicates && duplicates.length > 0) {
                        result['successes'] = [...result.successes, ...duplicates];
                    }
                }
                result.successes = result.successes.map((elem) => elem.id);
                if (newVersion && newVersion.length > 0 && !discarding) {
                    result.successes.forEach((elem) => {
                        if (!newVersion.includes(elem)) newVersion.push(elem);
                    });
                    localStorage.setItem('new_version_objects', JSON.stringify(newVersion));
                } else localStorage.setItem('new_version_objects', JSON.stringify(result.successes));
            });
            return;
        }

        if (discarding || !newVersion || newVersion.length === 0) return localStorage.setItem('new_version_objects', JSON.stringify(newVersionToAdd));

        newVersionToAdd.forEach((elem) => {
            if (!newVersion.includes(elem)) newVersion.push(elem);
        });

        return localStorage.setItem('new_version_objects', JSON.stringify(newVersion));
    }
}

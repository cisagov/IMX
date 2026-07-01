import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';
import { MispResultComponent } from 'src/app/misp-dialog/misp-result/misp-result.component';
import { MispService } from 'src/app/misp-service/misp.service';
import { Bundle } from 'src/app/models/bundle';
import { EnvService } from 'src/app/env-service/env.service';

@Component({
    selector: 'app-json-modal',
    templateUrl: './json-modal.component.html',
    styleUrls: ['./json-modal.component.css', '../../dashboard/dashboard.component.css', '../../app.component.css'],
    standalone: false,
})
export class JsonModalComponent implements OnInit {
    @ViewChild(MispResultComponent) mispResultComponent!: MispResultComponent;

    @Input() component;
    @Input() objectType;
    @Input() disableEditObject!: (obj: any) => boolean;
    @Input() vtIndicator: string = '';
    @Input() vtIndicatorType: 'hash' | 'ip' | null = null;
    @Input() vtCachedData: any = null;
    @Input() mispResults: any[] = null;

    activeTab: 'json' | 'vt' | 'misp' = 'json';

    get showVtTab(): boolean {
        return this.vtIndicatorType !== null && this.vtIndicator !== '';
    }

    get showMispTab() {
        return this.mispResults !== null;
    }

    onVtDataLoaded(data: any) {
        this.vtCachedData = data;
    }

    editorOptions = {
        theme: 'vs',
        language: 'json',
        minimap: {
            enabled: false,
        },
        readOnly: true,
        overviewRulerLanes: 0,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
    };
    json: string;
    isLoading = true;

    constructor(
        public dialogRef: NgbActiveModal,
        public envService: EnvService,
        private announcementService: AnnouncementService,
        private mispService: MispService
    ) {}

    ngOnInit() {
        this.json = JSON.stringify(this.component, null, 2);
        setTimeout(() => {
            this.isLoading = false;
        }, 100);
    }

    handleVtObjectsSelected(objects: any[]) {
        this.dialogRef.close({ action: 'vtImport', objects });
    }

    remove() {
        this.dialogRef.close({ action: 'delete', object: this.component });
    }

    edit() {
        this.dialogRef.close({ action: 'edit', object: this.component });
    }

    custom() {
        this.dialogRef.close({ action: 'custom', object: this.component });
    }

    capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    switchTab(tab) {
        this.activeTab = tab;
        if (tab == 'misp') {
            if (!this.mispResults) {
                let indicators = this.mispService.buildIndicatorString(this.component);

                const classification = this.mispService.validateAndClassifyInputs(indicators);
                this.mispService
                    .searchMisp(this.mispService.mapClassification(classification))
                    .then((res) => {
                        this.mispResults = res;
                    })
                    .catch((e) => {
                        this.announcementService.show('Error retrieving from MISP', e, 'error', false);
                    });
            }
        }
    }

    importMisp() {
        const objects = this.mispResultComponent.emitStix();

        if (objects.length < 1) {
            this.announcementService.show(
                'No Event was selected to import',
                'No object was selected to import. Please select at least one event and object to import',
                'warning',
                false
            );
            return;
        }

        const tempBundle = new Bundle(objects);
        this.dialogRef.close({ action: 'mispImport', selectedObjects: tempBundle });
    }

    close() {
        this.dialogRef.close();
    }
}

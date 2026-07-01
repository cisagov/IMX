import { Component, OnInit } from '@angular/core';
import { DisabledTaxiiService } from '../disabled-taxii-service/disabled-taxii.service';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';
import { TaxiiSettingsDialogComponent } from '../taxii-settings-dialog/taxii-settings-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { EnvService } from 'src/app/env-service/env.service';

@Component({
    selector: 'app-disabled-taxii',
    templateUrl: './disabled-taxii.component.html',
    styleUrl: './disabled-taxii.component.css',
    standalone: false,
})
export class DisabledTaxiiComponent implements OnInit {
    disabledTaxiiList: any[] = [];
    loading: boolean = true;

    faPlus = faPlus;
    faTrash = faTrash;

    constructor(
        private readonly disabledTaxii: DisabledTaxiiService,
        private readonly announcement: AnnouncementService,
        private readonly envService: EnvService,
        public taxiiSettingsDialog: MatDialog
    ) {}

    async ngOnInit() {
        await this.refreshPage();
    }

    async addDisabledTaxiiServer() {
        const dialogRef = this.taxiiSettingsDialog.open(TaxiiSettingsDialogComponent, {
            data: { mode: 'Add Disabled' },
            height: '400px',
            width: `${window.innerWidth / 2}px`,
        });

        dialogRef.afterClosed().subscribe(async (result) => {
            if (result === true) {
                await this.refreshPage();
            }
        });
    }

    async deleteDisabledTaxiiServer(server) {
        const dialogRef = this.taxiiSettingsDialog.open(TaxiiSettingsDialogComponent, {
            data: { mode: 'Delete Disabled', id: server._id, taxiiServer: server._source },
            height: '400px',
            width: `${window.innerWidth / 2}px`,
        });

        dialogRef.afterClosed().subscribe(async (result) => {
            if (result === true) {
                await this.refreshPage();
            }
        });
    }

    async refreshPage() {
        this.disabledTaxiiList = [];
        try {
            this.loading = true;
            let getRes: any = await this.disabledTaxii.getDisabledTaxiiServers(1);
            this.disabledTaxiiList = getRes.data.hits.hits;
            await this.envService.loadApiEnv();
            this.loading = false;
        } catch (err) {
            console.debug(err);
            this.announcement.show('ERROR tring to get Disabled TAXII Servers', `${err.message}`, 'error', false);
            this.loading = false;
        }
    }
}

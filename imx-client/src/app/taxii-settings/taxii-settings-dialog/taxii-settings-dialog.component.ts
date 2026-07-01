import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faBan, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import { DisabledTaxiiService } from '../disabled-taxii-service/disabled-taxii.service';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';

export interface TaxiiSettingsData {
    mode: string;
    taxiiServer: any;
    id: string;
}

@Component({
    selector: 'app-taxii-settings-dialog',
    templateUrl: './taxii-settings-dialog.component.html',
    styleUrl: './taxii-settings-dialog.component.css',
    standalone: false,
})
export class TaxiiSettingsDialogComponent {
    mode: string = '';
    id: string = '';

    url: string = '';
    username: string = '';
    password: string = '';

    warning: string = '';

    faBan = faBan;
    faCheck = faCheck;
    faTrash = faTrash;

    constructor(
        public dialogRef: MatDialogRef<TaxiiSettingsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: TaxiiSettingsData,
        private readonly disabledTaxii: DisabledTaxiiService,
        private readonly announcementService: AnnouncementService
    ) {
        this.mode = data.mode;
        this.id = data.id ? data.id : '';
        this.url = data.taxiiServer ? data.taxiiServer.url : '';
    }

    onX(): void {
        this.dialogRef.close();
    }

    async onConfirm() {
        if (!this.url.startsWith('http')) {
            this.announcementService.show(
                'ERROR. Tring to add to Disabled TAXII Servers',
                `The URL entered is not valid. Please correct and try again. URL must contain protocol'}`,
                'error',
                false
            );
            return;
        }

        let taxiiServer = {
            url: this.url,
            username: this.username,
            password: btoa(this.password),
        };

        try {
            await this.disabledTaxii.addDisabledTaxiiServer(taxiiServer);
            this.announcementService.show('SUCCESS. Disabled TAXII Server added', `${taxiiServer.url} is now disabled`, 'success', false);
            this.dialogRef.close(true);
        } catch (err) {
            this.announcementService.show(
                'ERROR. Tring to add to Disabled TAXII Servers',
                `${err.message ? err.message : 'Unknown error. Please try again or report.'}`,
                'error',
                false
            );
        }
    }

    async onDelete() {
        try {
            await this.disabledTaxii.deleteDisabledTaxiiServer(this.id);
            this.announcementService.show('SUCCESS. Disabled TAXII Server deleted', `${this.url} is now deleted`, 'success', false);
            this.dialogRef.close(true);
        } catch (err) {
            this.announcementService.show(
                'ERROR. Tring to delete from Disabled TAXII Servers',
                `${err.message ? err.message : 'Unknown error. Please try again or report.'}`,
                'error',
                false
            );
        }
    }
}

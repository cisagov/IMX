import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StixService } from 'src/app/stix-service.service';
import { faPlus, faTrash, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { IncidentCoreExtension } from '../types/incident-core-extension';

export interface IncidentCoreExtensionData {
    curr: null;
}

@Component({
    selector: 'changed-object-dialog',
    templateUrl: './changed-object-dialog.component.html',
    styleUrls: ['./changed-object-dialog.component.css'],
    standalone: false,
})
export class ChangedObjectDialogComponent {
    faPlus = faPlus;
    faTrash = faTrash;
    faInfoCircle = faInfoCircle;

    errorMessage = '';
    errors = {};
    currentIncidentCoreExtension = new IncidentCoreExtension();
    state_change_type: string = '';
    initial_ref: string = '';
    result_ref: string = '';
    isAddingIncidentCoreExtension = true;

    refIds: string[] = [];

    stateChangeTypeOV = ['caused', 'contributed-to', 'input', 'mitigated', 'output', 'resolved'];

    constructor(
        public stixService: StixService,
        public dialogRef: MatDialogRef<ChangedObjectDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IncidentCoreExtensionData
    ) {
        this.errorMessage = '';
        this.refIds = this.stixService.bundle.objects.map((o) => o.id);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onX(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        const result = this.addButton();

        if (result.valid === false) {
            this.errorMessage = result.errorMessage;
            return;
        }

        let objectEntry = {};

        objectEntry['state_change_type'] = this.state_change_type;
        if (this.initial_ref.length > 0) {
            objectEntry['initial_ref'] = this.initial_ref;
        }
        if (this.result_ref.length > 0) {
            objectEntry['result_ref'] = this.result_ref;
        }

        this.dialogRef.close(objectEntry);
    }

    addButton(): any {
        const md_Regex = new RegExp('marking-definition--[0-9a-f]{8}-[0-9a-f]{4}-[45][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}');

        this.currentIncidentCoreExtension = new IncidentCoreExtension();

        return {
            valid: true,
        };
    }

    isDialogValid(): boolean {
        if (this.initial_ref) {
            const regex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
            let matches = this.initial_ref.match(regex);
            if (!matches) {
                this.errors['initial_ref'] = 'Must be a valid ID';
            } else if (this.result_ref) {
                delete this.errors['initial_ref'];
                let matches2 = this.result_ref.match(regex);
                if (matches2 && matches[1] != matches2[1]) {
                    this.errors['initial_ref'] = 'Must be of the same object type as Result Ref';
                }
            }
        } else {
            delete this.errors['initial_ref'];
        }
        if (this.result_ref) {
            const regex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
            if (!regex.test(this.result_ref)) {
                this.errors['result_ref'] = 'Must be a valid ID';
            } else {
                delete this.errors['result_ref'];
            }
        }

        return this.state_change_type && (this.initial_ref || this.result_ref) && Object.keys(this.errors).length == 0 ? true : false;
    }
}

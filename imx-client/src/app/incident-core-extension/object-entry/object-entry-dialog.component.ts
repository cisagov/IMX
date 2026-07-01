import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StixService } from 'src/app/stix-service.service';
import { faPlus, faTrash, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { IncidentCoreExtension } from '../types/incident-core-extension';
import { LANGUAGES } from '../../models/languages';

export interface IncidentCoreExtensionData {
    curr: null;
}

@Component({
    selector: 'object-entry-dialog',
    templateUrl: './object-entry-dialog.component.html',
    styleUrls: ['./object-entry-dialog.component.css'],
    standalone: false,
})
export class ObjectEntryDialogComponent implements OnInit {
    faPlus = faPlus;
    faTrash = faTrash;
    faInfoCircle = faInfoCircle;

    errorMessage = '';
    objectType: string = '';
    currentIncidentCoreExtension = new IncidentCoreExtension();
    object_ref: string = '';
    sequence_start: string = '';
    seq_object_ref: string = '';
    seq_condition_type: string = '';
    seq_transition_type: string = '';
    next_steps = [];
    tlp_options;
    lang_options: any[] = LANGUAGES;
    newSelector = [];
    isAddingIncidentCoreExtension = true;
    tlp_version = '';
    tlp_name = '';

    refRegex;

    errors = {};

    refObjects: any[] = [];

    activityConditionEnum = ['optional', 'required', 'unknown'];
    activityTransitionEnum = ['completion', 'failure', 'success', 'unknown'];

    constructor(
        public stixService: StixService,
        public dialogRef: MatDialogRef<ObjectEntryDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IncidentCoreExtensionData
    ) {
        this.errorMessage = '';
        this.objectType = data['type'];
        this.next_steps = data['refs'] ? data['refs'] : [];
        this.refRegex = new RegExp(
            '^' + this.objectType.toLowerCase() + '--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$'
        );
        this.refObjects = this.stixService.bundle.objects.filter((o) => o.id.includes(this.objectType.toLowerCase()));
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

        let objectEntry = [];
        objectEntry = this.next_steps;
        this.dialogRef.close(objectEntry);
    }

    addButton(): any {
        const md_Regex = new RegExp('marking-definition--[0-9a-f]{8}-[0-9a-f]{4}-[45][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}');

        this.currentIncidentCoreExtension = new IncidentCoreExtension();

        return {
            valid: true,
        };
    }

    addNextStep(): void {
        this.errors['next_steps'] = '';

        this.next_steps.push(this.seq_object_ref);
        this.seq_object_ref = '';
    }

    getTlpOptions(event: any) {
        this.tlp_options = this.stixService.getTlpOptions(event.target.value);
        if (event.reset !== false) this.currentIncidentCoreExtension = new IncidentCoreExtension();
    }

    setMarkingRef() {
        for (const option of this.tlp_options) {
            if (option.key === this.tlp_name) this.currentIncidentCoreExtension = new IncidentCoreExtension();
        }
    }

    ngOnInit(): void {}

    isDialogValid(): boolean {
        if (this.next_steps.length < 1) {
            return false;
        }

        return true;
    }
}

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StixService } from 'src/app/stix-service.service';
import { faPlus, faTrash, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { IncidentCoreExtension } from '../types/incident-core-extension';
import { LANGUAGES } from '../../models/languages';

export interface IncidentCoreExtensionData {
    curr: null;
}

@Component({
    selector: 'attacker-activity-dialog',
    templateUrl: './attacker-activity-dialog.component.html',
    styleUrls: ['./attacker-activity-dialog.component.css'],
    standalone: false,
})
export class AttackerActivityDialogComponent {
    faPlus = faPlus;
    faTrash = faTrash;
    faInfoCircle = faInfoCircle;

    errorMessage = '';
    currentIncidentCoreExtension = new IncidentCoreExtension();
    tlp_options;
    lang_options: any[] = LANGUAGES;
    newSelector = [];
    isAddingIncidentCoreExtension = true;
    tlp_version = '';
    tlp_name = '';

    phaseName = '';
    killChain = '';

    activityOutcomeEnum = ['blocked', 'failed', 'occurred', 'ongoing', 'pending', 'successful', 'unknown'];
    timestampFidelityEnum = ['day', 'hour', 'minute', 'month', 'second', 'year'];
    killChainPhases = ['reconnaissance', 'weaponization', 'delivery', 'exploitation', 'installation', 'command-and-control'];

    constructor(
        public stixService: StixService,
        public dialogRef: MatDialogRef<AttackerActivityDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IncidentCoreExtensionData
    ) {
        this.errorMessage = '';
        this.currentIncidentCoreExtension = data;
        if (this.stixService.killChainType == 'mitre-attack') {
            this.killChainPhases = [
                'reconnaissance',
                'resource-development',
                'initial-access',
                'execution',
                'persistence',
                'privilege-escalation',
                'defence-evasion',
                'credential-access',
                'discovery',
                'lateral-movement',
                'collection',
                'command-and-control',
                'exfiltration',
                'impact',
            ];
        }
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

        this.dialogRef.close(this.currentIncidentCoreExtension);
    }

    addButton(): any {
        const md_Regex = new RegExp('marking-definition--[0-9a-f]{8}-[0-9a-f]{4}-[45][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}');

        this.currentIncidentCoreExtension = new IncidentCoreExtension();

        return {
            valid: true,
        };
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

    addKillChain(): void {
        const str = this.phaseName + ': ' + this.killChain;
        if (this.stixService.stringArrays.has('dialogKillChain')) {
            const newStringArray = this.stixService.stringArrays.get('dialogKillChain')!;
            if (newStringArray.indexOf(str) == -1) {
                newStringArray.push(str);
                this.stixService.stringArrays.set('dialogKillChain', newStringArray);
            }
        } else this.stixService.stringArrays.set('dialogKillChain', [str]);

        this.phaseName = '';
        this.killChain = '';
    }
}

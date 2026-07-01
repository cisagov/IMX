import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StixService } from '../../../stix-service.service';
import { faCheck, faBan } from '@fortawesome/free-solid-svg-icons';

export interface RelationshipData {
    options: [];
    source: {
        name: '';
        id: '';
    };
    target: {
        name: '';
        id: '';
    };
    from: '';
}

@Component({
    selector: 'app-relationship-dialog',
    templateUrl: './relationship-dialog.component.html',
    styleUrls: ['./relationship-dialog.component.css'],
    standalone: false,
})
export class RelationshipDialogComponent implements OnInit {
    faCheck = faCheck;
    faBan = faBan;

    relationshipOptions = [];
    relationshipSourceID = '';
    relationshipTargetID = '';
    sourceWarning = '';
    targetWarning = '';
    from = '';

    constructor(
        public stixService: StixService,
        public dialogRef: MatDialogRef<RelationshipDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: RelationshipData
    ) {
        this.relationshipSourceID = data.source.id;
        this.relationshipTargetID = data.target.id;
        this.relationshipOptions = data.options;
        this.from = data.from || '';
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onX(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        let this_source = {};
        let this_target = {};

        for (let option of this.relationshipOptions) {
            if (this.relationshipSourceID === option.id) this_source = option;
            else if (this.relationshipTargetID === option.id) this_target = option;
        }

        this.dialogRef.close({ source: this_source, target: this_target });
    }

    sourceChange(): void {
        for (let option of this.relationshipOptions) {
            if (option.id !== this.relationshipSourceID) this.relationshipTargetID = option.id;
        }

        this.checkWarning();
    }

    targetChange(): void {
        for (let option of this.relationshipOptions) {
            if (option.id !== this.relationshipTargetID) this.relationshipSourceID = option.id;
        }

        this.checkWarning();
    }

    checkWarning(): void {
        if (this.from === 'bundle') return;

        this.targetWarning = '';
        this.sourceWarning = '';

        for (let option of this.relationshipOptions) {
            for (let object of this.stixService.bundle.objects) {
                if (option.id === object.id && option.id === this.relationshipTargetID) {
                    this.targetWarning = '**Already found in Bundle**';

                    if (option.created !== object.created || option.modified !== object.modified)
                        this.targetWarning = `**Different version found in Bundle**`;

                    break;
                } else if (option.id === object.id && option.id === this.relationshipSourceID) {
                    this.sourceWarning = '**Already found in Bundle**';

                    if (option.created !== object.created || option.modified !== object.modified)
                        this.sourceWarning = `**Different version found in Bundle**`;

                    break;
                }
            }
        }
    }

    ngOnInit(): void {
        this.checkWarning();
    }
}

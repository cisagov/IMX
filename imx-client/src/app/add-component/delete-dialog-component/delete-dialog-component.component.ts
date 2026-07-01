import { Component, OnInit, Inject } from '@angular/core';
import { StixService } from 'src/app/stix-service.service';
import { faBan, faTrash } from '@fortawesome/free-solid-svg-icons';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface BundleDeleteData {
    curr: null;
}
interface Delete {}

@Component({
    selector: 'app-delete-dialog-component',
    templateUrl: './delete-dialog-component.component.html',
    styleUrl: './delete-dialog-component.component.css',
    standalone: false,
})
export class DeleteDialogComponent implements OnInit {
    object: any;
    objectId: string;
    parents: any[];
    parentsLength: number;
    reqs: any[];
    deletable: boolean = true;
    deleteCount: number;

    confirmRef: any;
    confirmSkipRef: any;

    faBan = faBan;
    faTrash = faTrash;

    constructor(
        public stixService: StixService,
        public dialogRef: MatDialogRef<DeleteDialogComponent>,
        public matDialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: BundleDeleteData
    ) {
        this.object = data['object'];
        this.objectId = this.object['id'];
        this.parents = [this.object].concat(data['parents']); //To potentially later display confirmation with ids
        this.parentsLength = this.parents.length;
        this.reqs = data['reqs'];
        this.deleteCount = this.parents.length;
    }

    ngOnInit() {
        if (this.reqs.length > 0) {
            if (this.reqs.includes(this.object)) {
                this.deletable = false;
            }
            for (let obj of this.parents) {
                if (this.reqs.includes(obj)) {
                    this.deleteCount--;
                }
            }
        }
    }

    close(all?: boolean) {
        if (all) {
            this.confirmSkipRef.close();
            this.dialogRef.close({ clicked: 'closeAll' });
        } else {
            this.dialogRef.close();
        }
    }

    delete(all?: boolean) {
        if (all) {
            this.confirmRef.close();
            this.dialogRef.close({ clicked: 'deleteAll', obj: this.object });
        } else {
            this.dialogRef.close({ clicked: 'delete', obj: this.object });
        }
    }

    update(all?: boolean) {
        let obj = JSON.parse(JSON.stringify(this.object).split(this.stixService.origID).join(this.stixService.newID));
        this.stixService.addComponent(obj);

        if (all) {
            this.dialogRef.close({ clicked: 'updateAll' });
        } else {
            this.dialogRef.close();
        }
    }

    confirm(confirmModal: any) {
        this.confirmRef = this.matDialog.open(confirmModal, { height: '400px', width: `${(window.innerWidth / 5) * 3}px` });
    }

    confirmSkip(confirmSkipModal: any) {
        this.confirmSkipRef = this.matDialog.open(confirmSkipModal, { height: '400px', width: `${(window.innerWidth / 5) * 3}px` });
    }
}

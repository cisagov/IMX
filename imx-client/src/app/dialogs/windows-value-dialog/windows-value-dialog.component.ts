import { Component, Inject } from '@angular/core';
import { faPlus, faBan, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface windowsValueData {
    name: '';
    data: '';
    data_type: '';
}

@Component({
    selector: 'app-windows-value-dialog',
    templateUrl: './windows-value-dialog.component.html',
    styleUrls: ['./windows-value-dialog.component.css'],
    standalone: false,
})
export class WindowsValueDialogComponent {
    faPlus = faPlus;
    faBan = faBan;
    faInfoCircle = faInfoCircle;

    name: string = '';
    data: string = '';
    data_type: string = '';

    addEnabled: boolean = false;

    dataOptions: string[] = [
        'REG_NONE',
        'REG_SZ',
        'REG_EXPAND_SZ',
        'REG_BINARY',
        'REG_DWORD',
        'REG_DWORD_BIG_ENDIAN',
        'REG_DWORD_LITTLE_ENDIAN',
        'REG_LINK',
        'REG_MULTI_SZ',
        ' REG_RESOURCE_LIST',
        'REG_FULL_RESOURCE_DESCRIPTION',
        'REG_RESOURCE_REQUIREMENTS_LIST',
        'REG_QWORD',
        'REG_INVALID_TYPE',
    ];

    constructor(
        public dialogRef: MatDialogRef<WindowsValueDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public passedData: windowsValueData
    ) {
        this.name = this.passedData.name;
        this.data = this.passedData.data;
        this.data_type = this.passedData.data_type;
    }

    cancelModal(): void {
        this.dialogRef.close();
    }

    isAddEnabled() {
        if (this.name === '' && this.data === '' && this.data_type === '') {
            this.addEnabled = false;
        } else {
            this.addEnabled = true;
        }
    }

    onAdd() {
        let result = {};

        result['name'] = this.name;
        if (this.data !== '') result['data'] = this.data;
        if (this.data_type !== '') result['data_type'] = this.data_type;

        this.dialogRef.close(result);
    }
}

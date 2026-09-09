import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faPlus, faTrash, faInfoCircle, faBan } from '@fortawesome/free-solid-svg-icons';
import { ExternalReference } from '../../models/external-reference';
import { StixService } from '../../stix-service.service';

export interface ExternalReferencesData {
    source_name: '';
    description: '';
    url: '';
    hashes: {};
    external_id: '';
}

@Component({
    selector: 'app-external-references-dialog',
    templateUrl: './external-references-dialog.component.html',
    styleUrls: ['./external-references-dialog.component.css'],
    standalone: false,
})
export class ExternalReferencesDialogComponent {
    faPlus = faPlus;
    faTrash = faTrash;
    faInfoCircle = faInfoCircle;
    faBan = faBan;

    currentExternalReference = new ExternalReference();
    isAddingExternalReferences: boolean = false;
    editedExternalReference: any = undefined;
    newExternalReferences: ExternalReference[] = [];
    newaddButton: string = '';
    source_name: string = '';
    url: string = '';
    hashType: string = 'SHA-256';
    hashValue: string = '';
    errorMessage: string = '';
    nameError: string = '';
    descriptionError: string = '';
    urlError: string = '';
    idError: string = '';
    hashError: string = '';
    hashes = new Map();
    hashOptions = [
        { name: 0, value: '' },
        { name: 1, value: 'MD5' },
        { name: 2, value: 'SHA-1' },
        { name: 3, value: 'SHA-256' },
        { name: 3, value: 'SHA-512' },
        { name: 4, value: 'SHA3-256' },
        { name: 5, value: 'SHA3-512' },
        { name: 6, value: 'SSDEEP' },
        { name: 7, value: 'TLSH' },
    ];
    tooltip: string;
    isMalware: boolean = false;

    constructor(
        public stixService: StixService,
        public dialogRef: MatDialogRef<ExternalReferencesDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ExternalReferencesData
    ) {
        if (data && data['malware']) {
            this.currentExternalReference.source_name = 'mbc';
            this.isMalware = true;
        }
        if (this.stixService.editedExternalReference) {
            let edited = this.stixService.editedExternalReference;
            this.currentExternalReference.source_name = edited.source_name;
            this.currentExternalReference.url = edited.url;
            this.currentExternalReference.description = edited.description;
            this.currentExternalReference.hashes = edited.hashes;
            this.currentExternalReference.external_id = edited.external_id;
            this.editedExternalReference = this.currentExternalReference;
        }
        if (data && data['value']) {
            const value = data['value'];
            this.currentExternalReference.source_name = value.source_name || this.currentExternalReference.source_name;
            this.currentExternalReference.description = value.description || '';
            this.currentExternalReference.url = value.url || '';
            this.currentExternalReference.hashes = value.hashes || {};
            this.currentExternalReference.external_id = value.external_id || '';
            this.editedExternalReference = undefined;
        }
    }

    onCancel(): void {
        //I have no clue why but somehow somewhere the stixService variable is getting wiped between here and the return
        this.dialogRef.close(this.editedExternalReference);
    }

    onConfirm(): void {
        let result = this.addButton();

        if (result.valid === false) {
            this.errorMessage = result.errorMessage;
            this.nameError = result.nameError;
            this.descriptionError = result.descriptionError;
            this.urlError = result.urlError;
            this.hashError = result.hashError;
            this.idError = result.idError;
            return;
        }

        this.dialogRef.close(this.currentExternalReference);
    }

    addButton(): any {
        const urlRegex = new RegExp(
            '^(?:[A-Za-z][A-Za-z0-9+.-]*:\/{2})+(?:(?:[A-Za-z0-9-._~]|%[A-Fa-f0-9]{2})+(?::([A-Za-z0-9-._~]?|[%][A-Fa-f0-9]{2})+)?@)?(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.){1,126}[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?::[0-9]+)?(?:\/(?:[A-Za-z0-9-._~#?=&\'\"]|%[A-Fa-f0-9]{2})*)*(?:\\?(?:[A-Za-z0-9-._~]+(?:=(?:[A-Za-z0-9-._~+]|%[A-Fa-f0-9]{2})+)?)(?:&|;[A-Za-z0-9-._~]+(?:=(?:[A-Za-z0-9-._~+]|%[A-Fa-f0-9]{2})+)?)*)?$'
        );
        const cveRegex = new RegExp('^CVE-[0-9]{4}-[0-9]{4}$');
        const capecRegex = new RegExp('^CAPEC-[0-9]{3}$');
        //Lang must be language code format [RFC5646]
        if (this.currentExternalReference.url && this.currentExternalReference.url != '') {
            if (!urlRegex.test(this.currentExternalReference.url))
                return {
                    valid: false,
                    errorMessage: 'Must be a valid URL',
                };
        }
        if (!(this.currentExternalReference.description || this.currentExternalReference.url || this.currentExternalReference.external_id))
            return {
                valid: false,
                nameError: 'Source Name must be combined with either Description, URL, or External ID',
                descriptionError: 'Source Name must be combined with either Description, URL, or External ID',
                urlError: 'Source Name must be combined with either Description, URL, or External ID',
                idError: 'Source Name must be combined with either Description, URL, or External ID',
            };
        if (this.currentExternalReference.source_name.toLowerCase() == 'cve') {
            if (this.currentExternalReference.external_id == '')
                return {
                    valid: false,
                    idError: 'External ID required for CVE',
                    nameError: 'External ID required for CVE',
                };
            if (!cveRegex.test(this.currentExternalReference.external_id))
                return {
                    valid: false,
                    idError: 'CVE must be in format CVE-[4 digit year]-[4 digit ID]',
                };
        }
        if (this.currentExternalReference.source_name.toLowerCase() == 'capec') {
            if (this.currentExternalReference.external_id == '')
                return {
                    valid: false,
                    idError: 'External ID required for CAPEC',
                };
            if (!capecRegex.test(this.currentExternalReference.external_id))
                return {
                    valid: false,
                    idError: 'CAPEC must be in format CAPEC-[3 digit ID]>',
                };
        }
        return {
            valid: true,
        };
    }

    addHash(type, value): any {
        //Hash Value & Hash Type
        const MD5Regex = new RegExp('^[a-fA-F0-9]{32}$');
        const SHA1Regex = new RegExp('^[0-9a-f]{5,40}$');
        const SHA256Regex = new RegExp('^[A-Fa-f0-9]{64}$');
        const SHA512Regex = new RegExp('^[a-f0-9]{128}$');
        //SHA3 Regexes are identical
        const SSDEEPRegex = new RegExp('^[0-9]+:[a-zA-Z0-9+/]{3,}:[a-zA-Z0-9+/]{3,}$');
        const TLSHRegex = new RegExp('^T1?[0-9A-Fa-f]{70}$');

        if (this.currentExternalReference.hashes && this.currentExternalReference.hashes[type]) {
            this.hashError = 'Warning: hash exists for this hash type - delete existing hash first to overwrite.';
            return {
                valid: false,
            };
        }

        switch (type) {
            case '':
                this.hashError = 'Please select a Hash Type';
                return {
                    valid: false,
                };
            case 'MD5':
                if (!MD5Regex.test(this.hashValue)) {
                    this.hashError = 'Hash Value must be properly formatted';
                    return {
                        valid: false,
                    };
                }
                break;
            case 'SHA-1':
                if (!SHA1Regex.test(this.hashValue)) {
                    this.hashError = 'Hash Value must be properly formatted';
                    return {
                        valid: false,
                    };
                }
                break;
            case 'SHA3-256':
            case 'SHA-256':
                if (!SHA256Regex.test(this.hashValue)) {
                    this.hashError = 'Hash Value must be properly formatted';
                    return {
                        valid: false,
                    };
                }
                break;
            case 'SHA-512':
            case 'SHA3-512':
                if (!SHA512Regex.test(this.hashValue)) {
                    this.hashError = 'Hash Value must be properly formatted';
                    return {
                        valid: false,
                    };
                }
                break;
            case 'SSDEEP':
                if (!SSDEEPRegex.test(this.hashValue)) {
                    this.hashError = 'Hash Value must be properly formatted';
                    return {
                        valid: false,
                    };
                }
                break;
            case 'TLSH':
                if (!TLSHRegex.test(this.hashValue)) {
                    this.hashError = 'Hash Value must be properly formatted';
                    return {
                        valid: false,
                    };
                }
                break;
        }

        if (!this.currentExternalReference.hashes) this.currentExternalReference.hashes = {};
        this.currentExternalReference.hashes[type] = value;

        this.hashValue = '';
        this.hashError = '';
        return {
            valid: true,
        };
    }

    deleteHash(type): void {
        delete this.currentExternalReference.hashes[type];
    }
}

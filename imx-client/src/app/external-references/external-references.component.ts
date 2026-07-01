import { Component } from '@angular/core';
import { ExternalReference } from '../models/external-reference';
import { StixService } from '../stix-service.service';
import { faInfoCircle, faTrash, faEdit, faPlus, faBan } from '@fortawesome/free-solid-svg-icons';
import { ExternalReferencesDialogComponent } from './external-references-dialog/external-references-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-external-references',
    templateUrl: './external-references.component.html',
    styleUrls: ['./external-references.component.css'],
    standalone: false,
})
export class ExternalReferencesComponent {
    faEdit = faEdit;
    faTrash = faTrash;
    faPlus = faPlus;
    faBan = faBan;
    faInfoCircle = faInfoCircle;

    currentExternalReference = new ExternalReference();
    isAddingExternalReferences: boolean = false;
    newExternalReferences: ExternalReference[] = [];
    newaddButton: string = '';
    source_name: string = '';
    url: string = '';
    hashType: string = 'SHA-256';
    hashValue: string = '';
    errorMessage: string = '';
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

    constructor(
        public stixService: StixService,
        public externalReferencesDialog: MatDialog
    ) {
        this.hashType = 'SHA-256';
        this.tooltip = 'Describe pointers to information represented outside of STIX.';
    }

    addExternalReference(): void {
        let component: any = this.currentExternalReference;
        for (let x in component) {
            if (component[x] === undefined || component[x].length == 0) {
                delete component[x];
            } else if (Object.keys(component[x]).length == 0) {
                delete component.hashes;
                delete component.hashType;
                delete component.hashValue;
            }
        }
        this.stixService.externalReferences.push(component);
        this.isAddingExternalReferences = false;
        this.errorMessage = '';
        this.hashError = '';
    }

    openDialog() {
        const dialogRef = this.externalReferencesDialog.open(ExternalReferencesDialogComponent, {
            minHeight: '380px',
            maxHeight: '85vh',
            width: `${window.innerWidth / 2}px`,
            position: {
                top: '5rem',
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.currentExternalReference = result;
                this.addExternalReference();
            }
            this.stixService.editedExternalReference = undefined;
        });
    }

    addOrCancel(): void {
        if (this.isAddingExternalReferences && this.stixService.editedExternalReference) {
            this.stixService.externalReferences.push(this.stixService.editedExternalReference);
            this.stixService.editedExternalReference = undefined;
        }
        this.hashError = '';
        this.errorMessage = '';
        this.isAddingExternalReferences = !this.isAddingExternalReferences;
        this.currentExternalReference = new ExternalReference();
    }

    editExternalRef(myobj: any) {
        this.stixService.editedExternalReference = myobj;
        this.stixService.externalReferences = this.stixService.externalReferences.filter((obj) => obj !== myobj);
        this.currentExternalReference = new ExternalReference(myobj.source_name, myobj.description, myobj.url, myobj.hashes, myobj.external_id);
        this.openDialog();
    }

    deleteExternalRef(myobj: any) {
        this.stixService.externalReferences = this.stixService.externalReferences.filter((obj) => obj !== myobj);
    }

    addHash(type, value): any {
        this.hashType;
        //Hash Value & Hash Type
        const MD5Regex = new RegExp('^[a-fA-F0-9]{32}$');
        const SHA1Regex = new RegExp('^[0-9a-fA-F]{5,40}$');
        const SHA256Regex = new RegExp('^[A-Fa-f0-9]{64}$');
        const SHA512Regex = new RegExp('^[a-f0-9]{128}$');
        //SHA3 Regexes are identical
        const SSDEEPRegex = new RegExp('^[0-9]+:[a-zA-Z0-9+/]{3,}:[a-zA-Z0-9+/]{3,}$');
        const TLSHRegex = new RegExp('^T1?[0-9A-Fa-f]{70}$');

        if (this.currentExternalReference.hashes[type]) {
            this.hashError = 'Warning: hash exists for this hash type - delete existing hash first to overwrite.';
            return {
                valid: false,
            };
        }
        if (type == '') {
            this.hashError = 'Please select a Hash Type';
            return {
                valid: false,
            };
        }
        if (type == 'MD5')
            if (!MD5Regex.test(this.hashValue)) {
                this.hashError = 'MD5 Hash Value must be properly formatted';
                return {
                    valid: false,
                };
            }
        if (type == 'SHA-1')
            if (!SHA1Regex.test(this.hashValue)) {
                this.hashError = 'SHA-1 Hash Value must be properly formatted';
                return {
                    valid: false,
                };
            }
        if (type == 'SHA-256')
            if (!SHA256Regex.test(this.hashValue)) {
                this.hashError = 'SHA-256 Hash Value must be properly formatted';
                return {
                    valid: false,
                };
            }
        if (type == 'SHA-512')
            if (!SHA512Regex.test(this.hashValue)) {
                this.hashError = 'SHA-512 Hash Value must be properly formatted';
                return {
                    valid: false,
                };
            }
        if (type == 'SHA3-256')
            if (!SHA256Regex.test(this.hashValue)) {
                this.hashError = 'SHA3-256 Hash Value must be properly formatted';
                return {
                    valid: false,
                };
            }
        if (type == 'SHA3-512')
            if (!SHA512Regex.test(this.hashValue)) {
                this.hashError = 'SHA3-512 Hash Value must be properly formatted';
                return {
                    valid: false,
                };
            }
        if (type == 'SSDEEP')
            if (!SSDEEPRegex.test(this.hashValue)) {
                this.hashError = 'SSDEEP Hash Value must be properly formatted';
                return {
                    valid: false,
                };
            }
        if (type == 'TLSH')
            if (!TLSHRegex.test(this.hashValue)) {
                this.hashError = 'TLSH Hash Value must be properly formatted';
                return {
                    valid: false,
                };
            }

        this.currentExternalReference.hashes[type] = value;

        this.hashError = '';
        return {
            valid: true,
        };
    }

    deleteHash(type): void {
        delete this.currentExternalReference.hashes[type];
    }

    addButton(): any {
        const urlRegex = new RegExp(
            '^(?:[A-Za-z][A-Za-z0-9+.-]*:\/{2})+(?:(?:[A-Za-z0-9-._~]|%[A-Fa-f0-9]{2})+(?::([A-Za-z0-9-._~]?|[%][A-Fa-f0-9]{2})+)?@)?(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.){1,126}[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?::[0-9]+)?(?:\/(?:[A-Za-z0-9-._~#?=&\'\"]|%[A-Fa-f0-9]{2})*)*(?:\\?(?:[A-Za-z0-9-._~]+(?:=(?:[A-Za-z0-9-._~+]|%[A-Fa-f0-9]{2})+)?)(?:&|;[A-Za-z0-9-._~]+(?:=(?:[A-Za-z0-9-._~+]|%[A-Fa-f0-9]{2})+)?)*)?$'
        );
        const cveRegex = new RegExp('^CVE-[0-9]{4}-[0-9]{4}$');
        const capecRegex = new RegExp('^CAPEC-[0-9]{3}$');
        //Lang must be language code format [RFC5646]
        if (this.currentExternalReference.url != '') {
            if (!urlRegex.test(this.currentExternalReference.url))
                return {
                    valid: false,
                    errorMessage: 'Must be a valid URL',
                };
        }
        if (
            !(
                this.currentExternalReference.description != '' ||
                this.currentExternalReference.url != '' ||
                this.currentExternalReference.external_id != ''
            )
        )
            return {
                valid: false,
                errorMessage: 'Source Name must be combined with either Description, URL, or External ID',
            };
        if (this.currentExternalReference.source_name.toLowerCase() == 'cve') {
            if (this.currentExternalReference.external_id == '')
                return {
                    valid: false,
                    errorMessage: 'External ID required for CVE',
                };
            if (!cveRegex.test(this.currentExternalReference.external_id))
                return {
                    valid: false,
                    errorMessage: 'CVE must be in format CVE-[4 digit year]-[4 digit ID]',
                };
        }
        if (this.currentExternalReference.source_name.toLowerCase() == 'capec') {
            if (this.currentExternalReference.external_id == '')
                return {
                    valid: false,
                    errorMessage: 'External ID required for CAPEC',
                };
            if (!capecRegex.test(this.currentExternalReference.external_id))
                return {
                    valid: false,
                    errorMessage: 'CAPEC must be in format CAPEC-[3 digit ID]>',
                };
        }
        return {
            valid: true,
        };
    }

    disableAddButton() {
        return this.currentExternalReference.source_name === '';
    }
}

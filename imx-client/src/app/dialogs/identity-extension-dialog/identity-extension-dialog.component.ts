import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faPlus, faBan, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { StixService } from 'src/app/stix-service.service';
import extension_schemas from '../../schemas/common/extension-definitions/extension-definitions.json';

export interface EmailAddressEntry {
    email_address_ref: string;
    digital_contact_type: string;
    description: string;
    classified: boolean;
}

export interface PhoneNumberEntry {
    description: string;
    classified: boolean;
    contact_number_type: string;
    contact_number: string;
}

export interface SocialMediaEntry {
    description: string;
    classified: boolean;
    digital_contact_type: string;
    user_account_ref: string;
}

@Component({
    selector: 'app-identity-extension-dialog',
    templateUrl: './identity-extension-dialog.component.html',
    styleUrl: './identity-extension-dialog.component.css',
    standalone: false,
})
export class IdentityExtensionDialogComponent implements OnInit {
    faPlus = faPlus;
    faBan = faBan;
    faInfoCircle = faInfoCircle;

    digitalNumberOptions = extension_schemas['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498'].definitions["digital-number-ov"].enum;
    contactNumberOptions = extension_schemas['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498'].definitions["contact-number-ov"].enum;
    emailRefOptions: Array<{id: string; value: string}> = [];
    socialRefOptions: Array<{id: string; user_id?: string; display_name?: string}> = [];
    emailTypeOptions: string[] = ['work','personal','business'];

    // Internal State
    contact_info: string = '';
    contact_type: string = '';
    contact_description: string = '';
    contact_classified: boolean = false;
    contactError: boolean = false;
    contactErrorMessage: string = "";

    modalType: string = '';

    constructor(
      public stixService: StixService,
      public dialogRef: MatDialogRef<IdentityExtensionDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    ngOnInit(): void {
        this.modalType = this.data?.type;
        this.emailRefOptions = this.stixService.bundle.objects
        .filter(o => o.type === 'email-addr')
        .map(o => ({
            id: o.id,
            value: o.value
        }));

        this.socialRefOptions = this.stixService.bundle.objects
        .filter(o => o.type === 'user-account')
        .map(o => ({
            id: o.id,
            user_id: o.user_id,
            display_name: o.display_name
        }));

        if(this.data.guidedEditing) {
            this.data.entry = this.data.currObj || null;
        }

        if(this.data?.entry) {
            let entry = this.data.entry;
            if(this.modalType === 'Email Address') {
                this.contact_info = entry.email_address_ref;
                this.contact_type = entry.digital_contact_type;
                this.contact_description = entry.description;
                this.contact_classified = entry.classified;
            }

            if(this.modalType === 'Phone Number') {
                this.contact_info = entry.contact_number;
                this.contact_type = entry.contact_number_type;
                this.contact_description = entry.description;
                this.contact_classified = entry.classified;
            }

            if(this.modalType === 'Social Media') {
                this.contact_info = entry.user_account_ref;
                this.contact_type = entry.digital_contact_type;
                this.contact_description = entry.description;
                this.contact_classified = entry.classified;
            }
        }
        this.validateContactInfo(this.modalType);
    }

    onAddEmailRef(ref: string) {
        this.contact_info = ref;
    }

    onX(): void {
        this.dialogRef.close('');
    }

    onConfirm(): void {

        let entry: any = {};

        if(this.modalType === 'Email Address'){
            entry.email_address_ref = this.contact_info;
            entry.classified = this.contact_classified ?? false;

            if(this.contact_type?.trim()) {
                entry.digital_contact_type = this.contact_type;
            }
            if(this.contact_description?.trim()) {
                entry.description = this.contact_description;
            }
        }

        if(this.modalType === 'Social Media'){
            entry.user_account_ref = this.contact_info;
            entry.classified = this.contact_classified ?? false;

            if(this.contact_type?.trim()) {
                entry.digital_contact_type = this.contact_type;
            }
            if(this.contact_description?.trim()) {
                entry.description = this.contact_description;
            }
        }

        if(this.modalType === 'Phone Number'){
            entry.contact_number = this.contact_info;
            entry.classified = this.contact_classified ?? false;

            if(this.contact_type?.trim()) {
                entry.contact_number_type = this.contact_type;
            }
            if(this.contact_description?.trim()) {
                entry.description = this.contact_description;
            }
        }

        Object.keys(entry).forEach(k => {
            if(entry[k] === '' || entry[k] === null || entry[k] === undefined) delete entry[k];
        })
        this.dialogRef.close(entry);
    }

    getReferenceHeader(modalType: string) {
        if(modalType === 'Social Media') return 'User Account';
        return modalType;
    }

    validateContactInfo(modalType: string) {
        let phoneRegex = new RegExp(/^(\d{10})|(\d{3}\.\d{3}\.\d{4})|(\d{3}-\d{3}-\d{4})|(\(\d{3}\) ?\d{3}-\d{4})$/);
        let emailRegex = new RegExp(
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );

        if(this.contact_info === '' || this.contact_info === undefined){
            this.contactError = true;
            this.contactErrorMessage = `${this.getReferenceHeader(modalType)} is required.`;
            return;
        }

        if(modalType === 'Phone Number'){
            const valid = phoneRegex.test(this.contact_info);
            this.contactError = !valid;
            this.contactErrorMessage = valid ? "" : "Phone Number must be valid (e.g. 1234567890, 123-456-7890, (123) 456-7890)."
            return;
        }

        if(modalType === 'Email Address' && this.stixService.guidedUI){
            const valid = emailRegex.test(this.contact_info);
            this.contactError = !valid;
            this.contactErrorMessage = valid ? "" : "Email address must be valid (e.g., user@example.com)."
            return;
        }

        this.contactError = false;
        this.contactErrorMessage = "";
        return;
    }

    getTipByLabel(label = '') {
        let tooltip = '';
        switch (label) {
            case 'contact_info': {
                if (this.modalType !== 'Phone Number')
                    tooltip = `Please select a ${this.getReferenceHeader(this.modalType)} from the dropdown below. If no option is available, please create the object and return to this form.`;
                else
                    tooltip = 'Please enter a valid phone number below.'
                break;
            }
            default: {
                tooltip = '';
            }
        }
        return tooltip;
    }
}

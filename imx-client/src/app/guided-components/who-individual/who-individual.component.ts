import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { identity, Subscription } from 'rxjs';
import { AddComponentComponent } from 'src/app/add-component/add-component.component';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';
import { faMale, faUser, faUserAlt, faQuestionCircle, faInfoCircle, faTrash, faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import { IdentityExtensionDialogComponent } from 'src/app/dialogs/identity-extension-dialog/identity-extension-dialog.component';
import { MatDialog } from '@angular/material/dialog';


export interface EmailAddressEntry {
    description?: string;
    classified: boolean;
    digital_contact_type?: string;
    email_address_ref: string;
}

export interface PhoneNumberEntry {
    description?: string;
    classified: boolean;
    contact_number_type?: string;
    contact_number: string;
}

@Component({
    selector: 'app-who-individual',
    templateUrl: './who-individual.component.html',
    styleUrls: ['./who-individual.component.css'],
    standalone: false,
})
export class WhoIndividualComponent implements OnInit, OnDestroy {
    @ViewChild('appAddComponent', { static: false }) appAddComponent: AddComponentComponent;

    //With Parent
    @Output() showAssistance = new EventEmitter<any>();
    @Output() updateContinue = new EventEmitter<boolean>();
    @Output() changePage = new EventEmitter<any>();

    component: string = 'who-individual';

    private cartSubscriptions: Subscription[] = [];

    faMale = faMale;
    faUser = faUser;
    faUserAlt = faUserAlt;
    faQuestionCircle = faQuestionCircle;
    faInfoCircle = faInfoCircle;
    faTrash = faTrash;
    faEdit = faEdit;
    faPlus = faPlus;

    identityIOC = null;
    targetName = null;
    attackerName = null;
    contactInfo = null;
    sector = null;
    isOrganization = false;
    whoType = null;
    nameAndContacts = null;
    nameAndContactsParsed = [];
    phone = '';
    email = '';
    phoneError = false;
    emailError = false;

    cartId: number[] = [];
    linkId: number = 0;
    editMode: boolean = false;

    isTarget = true;
    targetAttackerType = null;
    currentAttackerName = '';
    currentAttackerRoles = [];
    currentAttackerMotivation = '';
    types = [];
    data = [];

    attackerUnknown = false;
    phoneClassified = false;
    emailClassified = false;

    disableWhoType = false;
    disableTargetType = false;
    disableAttackerType = false;

    email_addresses?: EmailAddressEntry[] = [];
    contact_numbers?: PhoneNumberEntry[] = [];

    motivationOptions: any[] = [
        { key: 'accidental', value: 'Accidental' },
        { key: 'coercion', value: 'Coercion' },
        { key: 'dominance', value: 'Dominance' },
        { key: 'ideology', value: 'Ideology' },
        { key: 'notoriety', value: 'Notoriety' },
        { key: 'organizational-gain', value: 'Organizational Gain' },
        { key: 'personal-gain', value: 'Personal Gain' },
        { key: 'personal-satisfaction', value: 'Personal Satisfaction' },
        { key: 'revenge', value: 'Revenge' },
        { key: 'unpredictable', value: 'Unpredictable' },
    ];

    phoneTypeOptions: any[] = [
        { key: 'personal-landline-phone', value: 'Personal Landline' },
        { key: 'personal-mobile-phone', value: 'Personal Mobile' },
        { key: 'personal-fax', value: 'Personal Fax' },
        { key: 'work-phone', value: 'Work' },
        { key: 'work-fax', value: 'Work Fax' }
    ];

    emailTypeOptions: any[] = [
        { key: 'personal', value: 'Personal' },
        { key: 'work', value: 'Work' },
        { key: 'organizational', value: 'Organizational' }
    ];

    constructor(
        public guidedService: GuidedService,
        public stixService: StixService,
        public identityDialog: MatDialog,
    ) {}

    ngOnInit(): void {
        this.cartSubscriptions.push(
            this.guidedService.addItemClicked$.subscribe((cancel) => this.addCartItem(cancel)),
            this.guidedService.updateItemClicked$.subscribe((data) => this.editCartItem(data))
        );
        this.identityIOC = this.guidedService.allIOCObjects.find((o) => o.routeName === 'identity');

        const editCartTimeout = setTimeout(() => {
            if (this.guidedService.editCartObject.component && this.guidedService.editCartObject.component === this.component) {
                this.guidedService.getEditItemTrigger$.next(this.guidedService.editCartObject);
            }
        }, 100);
    }

    combineContacts() {
        this.contactInfo = '';

        if (!!this.phone) {
            this.contactInfo += `Phone: ${this.phone};`;
        }

        if (!!this.email) {
            this.contactInfo += `Email: ${this.email}`;
        }
    }

    parseContacts() {
        let contactInfo = this.contactInfo.split(';');

        contactInfo.forEach((c) => {
            if (c.includes('Phone')) {
                this.phone = c.trim().split(' ')[1];
            }

            if (c.includes('Email')) {
                this.email = c.trim().split(' ')[1];
            }
        });
    }

    addCartItem(cancel) {
        if (cancel) {
            this.reset();
            return;
        }

        let identityObject: any = {
            type: 'identity',
            spec_version: '2.1',
        };

        let emitObj = {
            mode: this.component,
            push: [],
        };

        if (this.isTarget && !this.isOrganization) {
            identityObject['name'] = this.targetName ? this.targetName.trim() : this.guidedService.autoGenerateNameFromPage('target');
            identityObject['contact_information'] = this.contactInfo ? this.contactInfo.trim() : null;
            identityObject['identity_class'] = 'individual';
            identityObject['cartId'] = this.cartId[0] ? this.cartId[0] : null;

            // Generate Identity Extension
            let hasPhone = this.contact_numbers && this.contact_numbers.length > 0;
            let hasEmail = this.email_addresses && this.email_addresses.length > 0;
            let identityExtension: any = null;
            let emailAddressObject: any = null;

            if(hasPhone || hasEmail) {
                identityExtension = {
                    "extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498" : {
                        "extension_type": "property-extension"
                    }
                };

                if(hasPhone) {
                    identityExtension['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498'].contact_numbers = this.contact_numbers.map(entry => ({
                        contact_number: entry.contact_number.trim(),
                        contact_number_type: entry.contact_number_type,
                        classified: entry.classified ?? false,
                        description: entry.description
                    }));
                }

                if(hasEmail) {

                    let ext = identityExtension['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498'].email_addresses = [];

                    let emailObservableList = this.email_addresses.map((email, index) => {
                        const emailAddressObject = {
                            "type": 'email-addr',
                            "spec_version": "2.1",
                            "value": email.email_address_ref, // Actually just the value
                            cartId: index + 1
                        };

                        emailAddressObject["id"] = this.getStixId(emailAddressObject, "email-addr");
                        emailAddressObject["display_name"] = email.email_address_ref.trim();
                        return emailAddressObject;
                    })

                    let existingObservables = this.guidedService.cart['how-observable'] || {};
                    let mergedObservables = {
                            ...existingObservables,
                            "Email Address": emailObservableList
                    };
                    this.guidedService.syncCart("how-observable", mergedObservables);
                    let emailBucket = this.guidedService.cart['how-observable']['Email Address'];

                    emailBucket.forEach((email, index) => {
                        let emailEntry = this.email_addresses[index];
                        ext.push({
                            email_address_ref: email.id,
                            digital_contact_type: emailEntry.digital_contact_type,
                            classified: emailEntry.classified ?? false,
                            description: emailEntry.description
                        })
                    })
                }
            }

            if(hasPhone || hasEmail) {
                identityObject['extensions'] = identityExtension;
            } else {
                if(this.editMode && identityObject.extensions){
                    delete identityObject.extensions;
                }
            }

            emitObj.push.push(identityObject);
        } else if (this.isTarget && this.isOrganization) {
            this.linkId++;
            let tempIdentityList = [];

            let nameAndContactsList = this.nameAndContacts.split(';');
            nameAndContactsList = nameAndContactsList.filter((item) => !!item);
            for (let i in nameAndContactsList) {
                let item = nameAndContactsList[i];

                let thisItem = {
                    type: 'identity',
                    spec_version: '2.1',
                };

                const itemParsed = item.split(',');
                thisItem['name'] = itemParsed[0] ? itemParsed[0].trim() : null;
                thisItem['contact_information'] = itemParsed[1] ? itemParsed.slice(1).join(',').trim() : null;
                thisItem['sectors'] = this.sector ? [this.sector] : [null];
                thisItem['identity_class'] = 'organization';
                thisItem['cartId'] = this.cartId[i] ? this.cartId[i] : null;
                thisItem['linkId'] = this.linkId;

                if (thisItem['name'] !== '') tempIdentityList.push(thisItem);
            }

            emitObj.push = tempIdentityList;
        } else {
            let threatActorObject = {
                type: 'threat-actor',
                name: this.attackerUnknown
                    ? 'Unknown'
                    : this.attackerName
                      ? this.attackerName.trim()
                      : this.guidedService.autoGenerateNameFromPage('attacker'),
            };

            threatActorObject['cartId'] = this.cartId[0] ? this.cartId[0] : null;

            if (this.currentAttackerMotivation !== '') {
                threatActorObject['primary_motivation'] = this.currentAttackerMotivation;
            }

            emitObj = {
                mode: this.component,
                push: [threatActorObject],
            };
        }

        this.guidedService.newCartItem$.next(emitObj);
        this.guidedService.cartDisabled$.next(true);
        this.reset();
    }

    addComponents() {
        if (this.guidedService.cartLengths[this.component] === 0) {
            this.reset();
            return;
        }
        let types = [];
        let data = [];

        for (let type in this.guidedService.cart[this.component]) {
            let objects = this.guidedService.cart[this.component][type];

            for (let obj of objects) {
                types.push(obj.type);

                if (obj.display_name) delete obj.display_name;
                if (obj.cartId) delete obj.cartId;
                if (obj.linkId) delete obj.linkId;

                data.push(obj);
            }
        }

        this.guidedService.addComponents(types, data);
        this.reset();
    }

    editCartItem(event) {
        this.reset();
        this.editMode = true;
        this.cartId = [];

        if (event.arr) {
            this.isTarget = true;
            this.targetAttackerType = 'target';
            this.whoType = 'organization';
            this.disableAttackerType = true;
            this.disableWhoType = true;
            this.isOrganization = true;

            this.sector = event.arr[0].sectors[0];

            let tempString = '';
            for (let obj of event.arr) {
                tempString = `${tempString}${obj.name}${obj.contact_information ? ', ' + obj.contact_information + ';' : ';'}\n`;
                this.cartId.push(obj.cartId);
            }

            this.nameAndContacts = tempString;
        } else if (event.type === 'identity') {
            this.isTarget = true;
            this.targetAttackerType = 'target';
            this.whoType = 'individual';
            this.disableAttackerType = true;
            this.disableWhoType = true;
            this.isOrganization = false;
            this.targetName = event.name;
            // if (event.contact_information !== null) {
            //     this.contactInfo = event.contact_information;
            //     this.parseContacts();
            // }
            this.cartId = [event.cartId];

            // Fill out extension details
            let identityExtension: any;
            if(event.extensions) {
                identityExtension = event.extensions['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498']

                if(identityExtension?.contact_numbers){
                    this.contact_numbers = identityExtension.contact_numbers;
                }

                if(identityExtension?.email_addresses){
                    this.email_addresses = identityExtension.email_addresses;
                    // Switch ref for the display_name for this specific case
                    this.email_addresses.forEach(email => {
                        email.email_address_ref = this.guidedService.cart['how-observable']['Email Address'].find(obj => obj.id === email.email_address_ref).value;
                    });
                }

                // Cleanup stale extension inside edit object if empty
                if(identityExtension) {
                    let noPhones = !identityExtension.contact_numbers || identityExtension.contact_numbers.length === 0;
                    let noEmails = !identityExtension.email_addresses || identityExtension.email_addresses.length === 0;
                    if(noPhones && noEmails) {
                        delete event.extensions['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498'];
                        if(Object.keys(event.extensions).length === 0) delete event.extensions;
                    }
                }
            }

        } else {
            this.isTarget = false;
            this.targetAttackerType = 'attacker';
            this.disableTargetType = true;
            this.attackerName = event.name;
            if (event.primary_motivation) {
                this.currentAttackerMotivation = event.primary_motivation;
            }
            this.cartId = [event.cartId];
        }
        this.enableAddToCart(null);
    }

    redirectCart(event) {
        if (event.component !== this.component) {
            this.changePage.emit(event);
        } else {
            this.guidedService.getEditItemTrigger$.next(event);
        }
    }

    syncCart(event) {
        if (event === this.component) {
            this.guidedService.syncCartTrigger$.next();
        }
    }

    sectorHandler(event) {
        if (event && event.target && event.target.value) {
            this.sector = event.target.value;
        }
    }

    enableAddToCart(event) {
        this.combineContacts();

        if(this.isTarget) {
            if(!this.targetName) { this.guidedService.cartDisabled$.next(true); return; }
        }

        let disableContinue = true;
        if (!this.isOrganization && (!!this.targetName || !!this.contactInfo)) {
            disableContinue = false;
        }
        if (this.isOrganization && this.nameAndContacts && this.nameAndContacts.length > 0) {
            disableContinue = false;
        }
        if (!this.isTarget && (!!this.attackerName || !!this.currentAttackerMotivation || this.attackerUnknown)) {
            disableContinue = false;
        }

        this.guidedService.cartDisabled$.next(disableContinue);
    }

    changeWhoType(event) {
        if (event && event.target && event.target.value) {
            this.sector = '';

            if (event.target.value === 'organization') {
                this.isOrganization = true;
                this.whoType = 'organization';
            } else {
                this.isOrganization = false;
                this.whoType = 'individual';
            }
        }
    }

    toggleAttackerUnknown() {
        if (this.attackerUnknown) {
            this.attackerName = null;
        }
        this.enableAddToCart(null);
    }

    changeTargetAttackerType(event) {
        if (event === 'target') {
            this.isTarget = true;
            this.targetAttackerType = 'target';
        } else {
            this.isTarget = false;
            this.targetAttackerType = 'attacker';
        }
    }

    checkEmpty(field: string) {
        if (field == 'phone') {
            if (this.phone) {
                return false;
            } else {
                this.phoneError = false;
                return true;
            }
        } else if (field == 'email') {
            if (this.email) {
                return false;
            } else {
                this.emailError = false;
                return true;
            }
        }
        return true;
    }

    checkError(field: string) {
        if (field == 'phone' && this.phone) {
            console.info(this.phone);
            let phoneRegex = new RegExp(/^(\d{10})|(\d{3}\.\d{3}\.\d{4})|(\d{3}-\d{3}-\d{4})|(\(\d{3}\) ?\d{3}-\d{4})$/);
            if (phoneRegex.test(this.phone!)) {
                this.phoneError = false;
                return false;
            } else {
                this.phoneError = true;
                this.guidedService.cartDisabled$.next(true);
            }
        } else if (field == 'email' && this.email) {
            console.info(this.email);
            let emailRegex = new RegExp(
                /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
            if (emailRegex.test(this.email!)) {
                this.emailError = false;
                return false;
            } else {
                this.emailError = true;
                this.guidedService.cartDisabled$.next(true);
            }
        }

        return true;
    }

    reset() {
        this.identityIOC = null;
        this.whoType = null;
        this.targetAttackerType = null;
        this.targetName = '';
        this.attackerName = '';
        this.contactInfo = '';
        this.phone = '';
        this.email = '';
        this.sector = '';
        this.isOrganization = false;
        this.whoType = 'individual';
        this.nameAndContacts = '';
        this.nameAndContactsParsed = [];

        this.editMode = false;
        this.cartId = [];

        this.currentAttackerMotivation = '';
        this.attackerUnknown = false;
        this.contact_numbers = [];
        this.email_addresses = [];

        this.disableWhoType = false;
        this.disableAttackerType = false;
        this.disableTargetType = false;

        this.guidedService.cartDisabled$.next(true);
    }

    showAssistanceTrigger() {
        this.showAssistance.emit();
    }

    ngOnDestroy(): void {
        this.cartSubscriptions.forEach((sub) => sub.unsubscribe());
    }

    getStixId(object, typeName) {
        if (this.guidedService.editCart && this.guidedService.editCart[this.component] && this.guidedService.editCart[this.component][typeName]) {
            for (let oldObject of this.guidedService.editCart[this.component][typeName]) {
                if (oldObject.cartId === object.cartId) {
                    return oldObject.id;
                }
            }
        }

        return `${object.type}--${this.stixService.getUUIDFrIdContributingProperties(object)}`;
    }

    openModal(modal, editing?): void {
        switch (modal) {
            case 'phone_number':
                let phoneIdentityRef = this.identityDialog.open(IdentityExtensionDialogComponent, {
                    data: {
                        type: 'Phone Number',
                        entry: this.contact_numbers
                        },
                    minHeight: '500px',
                    maxHeight: '90vh',
                    width: '800px',
                    maxWidth: '95vw',
                });

                phoneIdentityRef.afterClosed().subscribe((result) => {
                    if (result) {
                        this.contact_numbers.push(result);
                        this.enableAddToCart(null);
                    }
                });
                break;
            case 'email_address':
                let emailIdentityRef = this.identityDialog.open(IdentityExtensionDialogComponent, {
                    data: {
                        type: 'Email Address',
                        entry: this.email_addresses
                        },
                    minHeight: '500px',
                    maxHeight: '90vh',
                    width: '800px',
                    maxWidth: '95vw',
                });

                emailIdentityRef.afterClosed().subscribe((result) => {
                    if (result) {
                        this.email_addresses.push(result);
                        this.enableAddToCart(null);
                    }
                });
                break;
        }
    }

    deleteModalObject(currObject: any, type: string): void {

        if(type === 'phone_number'){
            this.contact_numbers = this.contact_numbers.filter((obj) => obj !== currObject);
            let identityList = this.guidedService.cart['who-individual']?.["Identity"];
            if(identityList){
                let identityObj = identityList.find(o => o.cartId === this.cartId[0]); // probably wrong
                if(identityObj?.extensions) {
                     const ext = identityObj.extensions['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498'];
                     if(ext?.contact_numbers) {
                        ext.contact_numbers = ext.contact_numbers.filter(c => c.contact_number !== currObject.contact_number);
                     }

                     // If both arrays are empty, remove the extension entirely
                     const noPhones = !ext.contact_numbers || ext.contact_numbers.length === 0;
                     const noEmails = !ext.email_addresses || ext.email_addresses.length === 0;

                     if(noPhones && noEmails) {
                        delete identityObj.extensions['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498'];
                        if(Object.keys(identityObj.extensions).length === 0) delete identityObj.extensions;
                     }
                }
            }
        }

        if(type === 'email_address'){
            this.email_addresses = this.email_addresses.filter((obj) => obj !== currObject);
        }
    }

    displayContactInfoDetails(object: any, type: string): string {
        if(!object) return '';

        if(type === 'phone_number'){
            let contact_number_type = object.contact_number_type || '';
            let classified = object.classified ? 'classified' : 'unclassified';
            let description = '';

            if(object.description?.trim()) {
                description = object.description.trim();
                if(description.length > 30) {
                    description = description.substring(0,30).trim() + '...';
                }
            }

            let parts = [];
            if(contact_number_type) parts.push(contact_number_type);
            parts.push(classified);
            if(description) parts.push(description);

            if(parts.length === 0) return '';
            return `(${parts.join(', ')})`;
        }

        if(type === 'email_address'){
            let digital_contact_type = object.digital_contact_type || '';
            let classified = object.classified ? 'classified' : 'unclassified';
            let description = '';

            if(object.description?.trim()) {
                description = object.description.trim();
                if(description.length > 30) {
                    description = description.substring(0,30).trim() + '...';
                }
            }

            let parts = [];
            if(digital_contact_type) parts.push(digital_contact_type);
            parts.push(classified);
            if(description) parts.push(description);

            if(parts.length === 0) return '';
            return `(${parts.join(', ')})`;
        }
        return '';
    }
}

import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AddComponentComponent } from 'src/app/add-component/add-component.component';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';
import { faMale, faUser, faUserAlt, faQuestionCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
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

    identityIOC = null;
    // name = null; // name is deprecated; Using targetName and attackerName instead
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
    currentPhoneType = '';
    currentEmailType = '';
    types = [];
    data = [];

    attackerUnknown = false;
    phoneClassified = false;
    emailClassified = false;

    disableWhoType = false;
    disableTargetType = false;
    disableAttackerType = false;

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
        public stixService: StixService
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
            // identityObject['sectors'] = [this.sector];
            identityObject['identity_class'] = 'individual';
            identityObject['cartId'] = this.cartId[0] ? this.cartId[0] : null;

            // Generate Identity Extension
            let hasPhone = !!this.phone;
            let hasEmail = !!this.email;
            let identityExtension: any = null;
            let emailAddressObject: any = null;

            if(!hasPhone && !hasEmail) {

            } else {
                identityExtension = {
                    "extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498" : {
                        "extension-type": "property-extension"
                    }
                }

                if(hasPhone) {
                    identityExtension['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498'].contact_numbers = [];
                    identityExtension['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498'].contact_numbers.push({
                        "contact_number": this.phone.trim(),
                        "contact_number_type": this.phoneTypeOptions.find(o => o.key === this.currentPhoneType).key,
                        "classified": this.phoneClassified
                    })
                }

                if(hasEmail) {
                    emailAddressObject = {
                        "type": 'email-addr',
                        "spec_version": "2.1",
                        "value": this.email.trim(),
                    }

                    emailAddressObject["id"] = this.getStixId(emailAddressObject, "email-addr");
                    emailAddressObject["display_name"] = this.email.trim();
                    this.guidedService.syncCart("how-observable", { "Email Address": [emailAddressObject] });

                    let emailBucket = this.guidedService.cart['how-observable']['Email Address'];
                    let createdEmailObj = emailBucket[emailBucket.length - 1];
                    let emailObjId = createdEmailObj.id;

                    identityExtension['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498'].email_addresses = [];
                    identityExtension['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498'].email_addresses.push({
                        "email_address_ref": emailObjId,
                        "digital_contact_type": this.emailTypeOptions.find(o => o.key === this.currentEmailType).key,
                        "classified": this.emailClassified
                    })
                }
            }

            if(identityExtension) {
                identityObject['extensions'] = identityExtension;
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
            let identityExtension = event.extensions['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498']
            if(identityExtension?.contact_numbers){
                this.phone = identityExtension?.contact_numbers[0].contact_number;
                this.currentPhoneType = identityExtension?.contact_numbers[0].contact_number_type;
                this.phoneClassified = identityExtension?.contact_numbers[0].classified;
            }

            if(identityExtension?.email_addresses){
                let emailAddressRef = identityExtension.email_addresses[0].email_address_ref
                let emailCartRef = this.guidedService.cart['how-observable']['Email Address']?.find(o => o.id === emailAddressRef);
                this.email = emailCartRef ? emailCartRef.value : null;
                this.currentEmailType = this.email ? identityExtension?.email_addresses[0].digital_contact_type : '';
                this.emailClassified = this.email ? identityExtension?.email_addresses[0].classified : ''
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

            if(!!this.phone && !this.currentPhoneType) { this.guidedService.cartDisabled$.next(true); return; }
            if(!!this.email && !this.currentEmailType) { this.guidedService.cartDisabled$.next(true); return; }
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
        this.currentPhoneType = '';
        this.currentEmailType = '';
        this.phoneClassified = false;
        this.emailClassified = false;
        this.attackerUnknown = false;

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
}

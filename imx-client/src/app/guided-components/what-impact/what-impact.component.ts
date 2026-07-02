import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AddComponentComponent } from 'src/app/add-component/add-component.component';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';
import { faQuestionCircle, faPlus, faEdit, faTrash, faTools, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidV4 } from 'uuid';
import { FormModel } from '../../dynamic-form-component/form-model';
import { ImpactExtensionsDialogComponent } from '../../incident-core-extension/impact-extensions/impact-extensions-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CURRENCY_CODES } from '../../models/currency-codes';

@Component({
    selector: 'app-what-impact',
    templateUrl: './what-impact.component.html',
    styleUrls: ['./what-impact.component.css'],
    standalone: false,
})
export class WhatImpactComponent implements OnInit, OnDestroy {
    //With Parent
    @Output() showAssistance = new EventEmitter<any>();
    @Output() changePage = new EventEmitter<any>();

    component: string = 'what-impact';

    private cartSubscriptions: Subscription[] = [];

    @ViewChild('appAddComponent', { static: false }) appAddComponent: AddComponentComponent;

    faPlus = faPlus;
    faEdit = faEdit;
    faTrash = faTrash;
    faQuestionCircle = faQuestionCircle;
    faTools = faTools;
    faInfoCircle = faInfoCircle;

    lossType = '';
    infoCompromised = '';
    monetaryImpacted = '';
    physicalImpactType = '';
    assetAffected = '';
    types = [];
    data = [];
    actionMode = 'add';
    categoryToUpdate = '';
    errorMessage = '';
    errors: any = {};
    objectSelection = null;

    currentImpactCategory: string = '';
    currentRecoverability: string = '';
    selectedImpactRef: string | null = null; // Currently selected in the dropdown
    availableImpactRefs: any[] = []; // Available to select from the dropdown
    currentImpactedRefs = []; // List of refs that have been already selected
    impactCategoryFormData: Record<string, any> = {};

    impactCategoryOptions: any[] = ['Availability', 'Confidentiality', 'External', 'Integrity', 'Monetary', 'Physical', 'Traceability'];

    recoverabilityOptions: any[] = ['Extended', 'Not Applicable', 'Not Recoverable', 'Regular', 'Supplemented'];

    incidentConfidentialityLossEnum = [
        { label: 'Confirmed Loss', value: 'confirmed-loss' },
        { label: 'Contained', value: 'contained' },
        { label: 'Exploited Loss', value: 'exploited-loss' },
        { label: 'Suspected Loss', value: 'suspected-loss' },
        { label: 'None', value: 'none' },
    ];

    physicalAssetType = [
        { label: 'Door', value: 'building-doors' },
        { label: 'Window', value: 'building-windows' },
        { label: 'Building', value: 'buildings' },
        { label: 'Mobile Computer', value: 'computers-mobile' },
        { label: 'Personal Computer', value: 'computers-personal' },
        { label: 'Computer Server', value: 'computers-server' },
        { label: 'Environment', value: 'environment' },
        { label: 'ICS Actuator', value: 'ics-actuator' },
        { label: 'ICS Engineering Workstation', value: 'ics-engineering-workstation' },
        { label: 'ICS Historian', value: 'ics-historian' },
        { label: 'ICS HMI', value: 'ics-hmi' },
        { label: 'ICS Other', value: 'ics-other' },
        { label: 'ICS PLC', value: 'ics-plc' },
        { label: 'ICS Safety System', value: 'ics-safety-system' },
        { label: 'ICS Sensor', value: 'ics-sensor' },
        { label: 'Inventory', value: 'inventory' },
        { label: 'Network Device', value: 'network-device' },
        { label: 'Private Infrastructure', value: 'private-infrastructure' },
        { label: 'Public Infrastructure', value: 'public-infrastructure' },
        { label: 'Security Containers', value: 'security-containers' },
        { label: 'Vehicles', value: 'vehicles' },
    ];

    informationType = [
        { label: 'Classified Material', value: 'classified-material' },
        { label: 'Communications', value: 'communication' },
        { label: 'Admin Credentials', value: 'credentials-admin' },
        { label: 'User Credentials', value: 'credentials-user' },
        { label: 'Financial', value: 'financial' },
        { label: 'Legal', value: 'legal' },
        { label: 'Payment', value: 'payment' },
        { label: 'PHI', value: 'phi' },
        { label: 'PII', value: 'pii' },
        { label: 'Proprietary', value: 'proprietary' },
        { label: 'System', value: 'system' },
    ];

    externalImpactType = [
        { label: 'Economic', value: 'economic' },
        { label: 'Emergency Services', value: 'emergency-services' },
        { label: 'Foreign Relations', value: 'foreign-relations' },
        { label: 'National Security', value: 'national-security' },
        { label: 'Public Confidence', value: 'public-confidence' },
        { label: 'Public Health', value: 'public-health' },
        { label: 'Public Safety', value: 'public-safety' },
    ];

    integrityAlteration = [
        { label: 'Potential Destruction', value: 'potential-destruction' },
        { label: 'Potential Modification', value: 'potential-modification' },
        { label: 'Partial Destruction', value: 'partial-destruction' },
        { label: 'Partial Modification', value: 'partial-modification' },
        { label: 'Full Destruction', value: 'full-destruction' },
        { label: 'Full Modification', value: 'full-modification' },
        { label: 'None', value: 'none' },
    ];

    monetaryImpactTypeOV = [
        { label: 'Asset & Fraud', value: 'asset-and-fraud' },
        { label: 'Brand Damage', value: 'brand-damage' },
        { label: 'Business Disruption', value: 'business-disruption' },
        { label: 'Competitive Advantage', value: 'competitive-advantage' },
        { label: 'Legal & Regulatory', value: 'legal-and-regulatory' },
        { label: 'Operating Costs', value: 'operating-costs' },
        { label: 'Ransom Demand', value: 'ransom-demand' },
        { label: 'Ransom Payment', value: 'ransom-payment' },
        { label: 'Response & Recovery', value: 'response-and-recovery' },
        { label: 'Uncategorized', value: 'uncategorized' },
    ];

    physicalImpactEnum = [
        { label: 'Damaged Functional', value: 'damaged-functional' },
        { label: 'Damaged Nonfunctional', value: 'damaged-nonfunctional' },
        { label: 'Destruction', value: 'destruction' },
        { label: 'Unknown', value: 'unknown' },
        { label: 'None', value: 'none' },
    ];

    traceabilityEnum = [
        { label: 'Accountability Lost', value: 'accountability-lost' },
        { label: 'Partial Accountability', value: 'partial-accountability' },
        { label: 'Proven Accountability', value: 'provable-accountability' },
    ];

    impactCategoryFieldMap = {
        Availability: [{ type: 'number', label: 'Availability Impact', model: 'availabilityImpact', stixKey: 'availability_impact', required: true }],
        Confidentiality: [
            {
                type: 'select',
                label: 'Loss Type',
                model: 'lossType',
                stixKey: 'loss_type',
                options: this.incidentConfidentialityLossEnum,
                required: true,
            },
            {
                type: 'select',
                label: 'Information Type',
                model: 'informationType',
                stixKey: 'information_type',
                options: this.informationType,
                required: true,
            },
            { type: 'number', label: 'Record Count', model: 'recordCount', stixKey: 'record_count' },
            { type: 'number', label: 'Record Size', model: 'recordSize', stixKey: 'record_size' },
        ],
        External: [
            { type: 'select', label: 'Impact Type', model: 'impactType', stixKey: 'impact_type', options: this.externalImpactType, required: true },
        ],
        Integrity: [
            { type: 'select', label: 'Alteration', model: 'alteration', stixKey: 'alteration', options: this.integrityAlteration, required: true },
            {
                type: 'select',
                label: 'Information Type',
                model: 'informationType',
                stixKey: 'information_type',
                options: this.informationType,
                required: true,
            },
            { type: 'number', label: 'Record Count', model: 'recordCount', stixKey: 'record_count' },
            { type: 'number', label: 'Record Size', model: 'recordSize', stixKey: 'record_size' },
        ],
        Monetary: [
            { type: 'select', label: 'Variety', model: 'variety', stixKey: 'variety', options: this.monetaryImpactTypeOV, required: true },
            { type: 'number', label: 'Conversion Rate', model: 'conversionRate', stixKey: 'conversion_rate' },
            { type: 'datetime', label: 'Conversion Time', model: 'conversionTime', stixKey: 'conversion_time' },
            { type: 'select', label: 'Currency', model: 'currency', stixKey: 'currency', options: CURRENCY_CODES },
            { type: 'select', label: 'Currency Actual', model: 'currencyActual', stixKey: 'currency_actual', options: CURRENCY_CODES },
            { type: 'number', label: 'Minimum Amount', model: 'minimumAmount', stixKey: 'min_amount' },
            { type: 'number', label: 'Maximum Amount', model: 'maximumAmount', stixKey: 'max_amount' },
        ],
        Physical: [
            { type: 'select', label: 'Impact Type', model: 'impactType', stixKey: 'impact_type', options: this.physicalImpactEnum, required: true },
            { type: 'select', label: 'Asset Type', model: 'assetType', stixKey: 'asset_type', options: this.physicalAssetType },
        ],
        Traceability: [
            {
                type: 'select',
                label: 'Traceability Impact',
                model: 'traceabilityImpact',
                stixKey: 'traceability_impact',
                options: this.traceabilityEnum,
                required: true,
            },
        ],
    };

    editMode: boolean = false;
    cartIds: number[] = [];

    constructor(
        public guidedService: GuidedService,
        public stixService: StixService,
        public matDialog: MatDialog,
        public matAutocomplete: MatAutocompleteModule
    ) {}

    ngOnInit(): void {
        this.cartSubscriptions.push(
            this.guidedService.addItemClicked$.subscribe((cancel) => {
                this.addCartItem(cancel);
                this.rebuildAvailableImpactRefs();
            }),
            this.guidedService.updateItemClicked$.subscribe((data) => {
                this.editCartItem(data);
                this.rebuildAvailableImpactRefs();
            })
        );
        const editCartTimeout = setTimeout(() => {
            if (this.guidedService.editCartObject.component && this.guidedService.editCartObject.component === this.component) {
                this.guidedService.getEditItemTrigger$.next(this.guidedService.editCartObject);
            }
        }, 100);
        this.rebuildAvailableImpactRefs();
        this.stixService.currentType = 'impact';
    }

    ngDoCheck() {
        this.checkCart();
    }

    onImpactCategoryChange() {
        const fields = this.impactCategoryFieldMap[this.currentImpactCategory] || [];

        // Create/reset the form data object for this category
        this.impactCategoryFormData = {};

        for (const field of fields) {
            this.impactCategoryFormData[field.model] = this.getDefaultValue(field);
        }
    }

    getDefaultValue(field: any) {
        switch (field.type) {
            case 'text':
                return '';
            case 'number':
            case 'select':
            case 'datetime':
                return null;
            default:
                return null;
        }
    }

    validateAvailability() {
        const value = this.impactCategoryFormData['availabilityImpact'];

        if (value === null || value === '' || value === undefined) {
            this.errors['availabilityImpact'] = 'Availability Impact is required';
            return false;
        }

        if (value < 0 || value > 100) {
            this.errors['availabilityImpact'] = 'Must be between 0 and 100';
            return false;
        }

        delete this.errors['availabilityImpact'];
        return true;
    }

    validateMonetary() {
        const value = this.impactCategoryFormData;
        let valid = true;

        // Reset Monetary errors
        delete this.errors['conversionRate'];
        delete this.errors['conversionTime'];
        delete this.errors['currency'];
        delete this.errors['currencyActual'];
        delete this.errors['minimumAmount'];
        delete this.errors['maximumAmount'];
        delete this.errors['variety'];

        // Check for variety
        if (!value.variety) {
            this.errors['variety'] = 'Variety is required';
            return false;
        }

        // Conversion Rate & Currency Actual
        if (value.conversionRate) {
            if (!value.currencyActual) {
                this.errors['currencyActual'] = 'Conversion Rate requires Currency Actual';
                valid = false;
            } else if (value.conversionRate < 0) {
                this.errors['conversionRate'] = 'Conversion Rate must not be negative';
                valid = false;
            }

            if (!value.conversionTime) {
                this.errors['conversionTime'] = 'Conversion Time required when Conversion Rate is set';
                valid = false;
            }
        } else if (value.currencyActual) {
            this.errors['conversionRate'] = 'Conversion Rate must be set when Currency Actual is present';
            valid = false;
        }

        // Currency vs Actual Currency
        if (!value.currency && (value.currencyActual || value.minimumAmount || value.maximumAmount)) {
            this.errors['currency'] = 'Currency required when Currency Actual or Min/Max Amount present';
            valid = false;
        }

        // Min/Max Amount Logic
        let min = value.minimumAmount;
        let max = value.maximumAmount;

        if (max !== null && max !== undefined && max !== '') {
            if (max < 0) {
                this.errors['maximumAmount'] = 'Max Amount must not be negative';
                valid = false;
            }
        }

        if (min !== null && min !== undefined && min !== '') {
            if (!max && max !== 0) {
                this.errors['maximumAmount'] = 'Max Amount required when Min Amount is present';
                valid = false;
            } else if (max < min) {
                this.errors['maximumAmount'] = 'Max Amount must be equal or greather than Min Amount';
                valid = false;
            }

            if (min < 0) {
                this.errors['minimumAmount'] = 'Min Amount must not be negative';
                valid = false;
            }
        }

        if (max && !min && min !== 0) {
            this.errors['minimumAmount'] = 'Min Amount required when Max Amount is present';
            valid = false;
        }

        return valid;
    }

    rebuildAvailableImpactRefs() {
        const cart = this.guidedService.cart;
        if (!cart) {
            this.availableImpactRefs = [];
            return;
        }

        const allItems = [];

        for (const category of Object.values(cart)) {
            for (const typeGroup of Object.values(category)) {
                for (const item of typeGroup as any[]) {
                    allItems.push({
                        display_name: item.display_name,
                        type: item.type,
                        id: item.id,
                    });
                }
            }
        }

        // Exclude ones you've already selected
        this.availableImpactRefs = allItems.filter((item) => !this.currentImpactedRefs.some((sel) => sel.id === item.id));
    }

    addImpactedRef(ref: any) {
        if (!ref) return;

        // Prevent duplicates based on id
        const exists = this.currentImpactedRefs.some((r) => r.id === ref.id);
        if (!exists) {
            this.currentImpactedRefs.push(ref);
        }

        // Reset the select dropdown
        this.selectedImpactRef = null;
        this.rebuildAvailableImpactRefs();
    }

    deleteImpactedRef(ref: string) {
        this.currentImpactedRefs = this.currentImpactedRefs.filter((r) => r.id !== ref['id']);
        this.rebuildAvailableImpactRefs();
    }

    openExtension() {
        // Must have a selected impacted ref
        if (!this.currentImpactCategory) {
            return;
        }

        const impactType = this.currentImpactCategory.toLowerCase() + '-ext';
        const currentExtension = this.stixService.extensions?.[0]?.[impactType] || null;
        const dialogRef = this.matDialog.open(ImpactExtensionsDialogComponent, {
            data: { type: impactType.toLowerCase(), extension: currentExtension, index: currentExtension ? 0 : null },
            height: '600px',
            width: `${(window.innerWidth / 3) * 2}px`,
        });

        dialogRef.afterClosed().subscribe((result) => {
            // If dialog canceled, restore the original impact category
            if (!result) {
                if (this.stixService.extensions.length > 0) {
                    this.currentImpactCategory = Object.keys(this.stixService.extensions[0])[0]
                        .replace('-ext', '')
                        .replace(/^./, (c) => c.toUpperCase());
                }
                return;
            }

            // Otherwise, filter extensions to keep only the current impact category
            this.stixService.extensions = this.stixService.extensions.filter((extObj) => {
                const key = Object.keys(extObj)[0];

                // Keep any extensions not ending in "-ext"
                if (!key.endsWith('-ext')) return true;

                const extBase = key.split('-ext')[0];
                const currentBase = this.currentImpactCategory.split('-ext')[0].toLowerCase();

                return extBase === currentBase;
            });
        });
    }

    editExtension(currentImpactCategory) {
        this.stixService.extensions = []; // Should only ever be one item in the cart
    }

    formatExtensionKey(key: string): string {
        if (!key) return '';

        return key.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    }

    addCartItem(cancel) {
        if (cancel) {
            this.reset();
            this.checkCart();
            return;
        }

        let emitObj = {
            mode: this.component,
            push: [],
        };

        // Generate the base impact object
        let temp = {
            type: 'impact',
            id: 'impact--' + `${uuidV4()}`,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            impact_category: this.currentImpactCategory.toLowerCase(),
            cartId: this.cartIds[0] ? this.cartIds[0] : null,
        };

        // Add Recovery if available
        if (this.currentRecoverability) {
            temp['recoverability'] = this.currentRecoverability.toLowerCase().replace(/\s+/g, '-');
        }

        // Add Impacted Refs if available
        if (this.currentImpactedRefs && this.currentImpactedRefs.length > 0) {
            temp['impacted_refs'] = this.currentImpactedRefs.map((ref) => ref.id);
        }

        // Add extensions into the object
        const extensionsObj = {};
        const extensionPayload: any = {};

        // Pull in all extension data from inputs
        for (const field of this.impactCategoryFieldMap[this.currentImpactCategory]) {
            const key = field.stixKey;
            let value = this.impactCategoryFormData[field.model];

            if (value !== null && value !== undefined && value !== '') {
                extensionPayload[key] = value;
            }
        }

        extensionsObj[`${this.currentImpactCategory.toLowerCase()}-ext`] = extensionPayload;

        // Mandatory extension-definition
        extensionsObj['extension-definition--7cc33dd6-f6a1-489b-98ea-522d351d71b9'] = {
            extension_type: 'new-sdo',
        };

        // Add to temp
        temp['extensions'] = extensionsObj;

        emitObj.push.push(temp);
        this.guidedService.newCartItem$.next(emitObj);
        this.guidedService.cartDisabled$.next(true);
        this.reset();
    }

    checkCart() {
        const category = this.currentImpactCategory;
        if (!category) {
            this.guidedService.cartDisabled$.next(true);
            return;
        }

        // Check Input Validations
        let categoryValid = true;

        if (category === 'Availability') {
            categoryValid = this.validateAvailability();
        }

        if (category === 'Monetary') {
            categoryValid = this.validateMonetary();
        }

        if (!categoryValid) {
            this.guidedService.cartDisabled$.next(true);
            return;
        }

        // Check required fields
        const fields = this.impactCategoryFieldMap[category] || [];
        const allRequiredFilled = fields.every((field) => {
            if (!field.required) return true; // ignore non-required fields

            const value = this.impactCategoryFormData[field.model];

            // Required logic by field type
            switch (field.type) {
                case 'number':
                    return value !== null && value !== undefined && value !== '';

                case 'text':
                    return typeof value === 'string' && value.trim().length > 0;

                case 'select':
                    return value !== null; // your "Select an option" uses null placeholder

                case 'datetime':
                    return value !== null;

                default:
                    return true;
            }
        });

        if (allRequiredFilled) {
            this.guidedService.cartDisabled$.next(false);
        } else {
            this.guidedService.cartDisabled$.next(true);
        }
    }

    // Populates the stix object into the form
    editCartItem(event) {
        this.reset();
        this.editMode = true;

        // Restore Impact Category
        this.currentImpactCategory = event.impact_category.charAt(0).toUpperCase() + event.impact_category.slice(1);

        // Restore Extensions
        const savedExt = event.extensions[`${event.impact_category}-ext`];
        if (savedExt) {
            for (const field of this.impactCategoryFieldMap[this.currentImpactCategory]) {
                const stixKey = field.stixKey;
                const savedValue = savedExt[stixKey];

                if (savedValue !== undefined && savedValue !== null) {
                    if (field.type === 'select') {
                        const opt = field.options.find((o) => (o.value ?? o.label) === savedValue);
                        this.impactCategoryFormData[field.model] = opt ? (opt.value ?? opt.label) : null;
                    } else {
                        this.impactCategoryFormData[field.model] = savedValue;
                    }
                }
            }
        }

        // Restore Impacted References
        if (event.impacted_refs) {
            for (const ref_id of event.impacted_refs) {
                const allItems = Object.values(this.guidedService.cart)
                    .flatMap((section) => Object.values(section))
                    .flatMap((items) => items);

                // Find the matching item
                const match = allItems.find((item) => item.id === ref_id);

                if (match) {
                    this.currentImpactedRefs.push({
                        display_name: match.display_name,
                        type: match.type,
                        id: match.id,
                    });
                }
            }
        }

        // Restore Recoverability
        if (event.recoverability) {
            this.currentRecoverability = event.recoverability
                .replace(/-/g, ' ')
                .split(' ')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
        }

        this.cartIds.push(null);
        this.checkCart();
    }

    reset() {
        this.lossType = '';
        this.infoCompromised = '';
        this.monetaryImpacted = '';
        this.physicalImpactType = '';
        this.assetAffected = '';

        this.categoryToUpdate = '';
        this.errorMessage = '';

        this.editMode = false;
        this.cartIds = [];

        this.currentImpactCategory = '';
        this.currentRecoverability = '';
        this.selectedImpactRef = null;
        this.availableImpactRefs = [];
        this.currentImpactedRefs = [];
        this.stixService.extensions = [];
        this.rebuildAvailableImpactRefs();
    }

    showAssistanceTrigger() {
        this.showAssistance.emit();
    }

    addComponent() {
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

        this.data.forEach((d) => {
            let dataTmp = {};
            dataTmp['impact_category'] = d['impact_category'];
            dataTmp['extensions'] = d['extensions'];
            data.push(dataTmp);

            types.push(d.type);
        });

        this.guidedService.addComponents(types, data);

        // Update Incident object with ref to Event
        setTimeout(() => {
            this.guidedService.findPreviouslyAddedObjects('incident', 'incident-object');
            this.guidedService.addedObjects.subscribe((addedObjects) => {
                if (addedObjects.eventType === 'incident-object' && addedObjects.objects && addedObjects.objects.length > 0) {
                    let incidentObject = addedObjects.objects[0];

                    this.guidedService.findPreviouslyAddedObjects('impact', 'impact-object');
                    this.guidedService.addedObjects.subscribe((addedObjects) => {
                        if (addedObjects.eventType === 'impact-object' && addedObjects.objects && addedObjects.objects.length > 0) {
                            let impactIds = [];
                            addedObjects.objects.forEach((o) => {
                                impactIds.push(o.id);
                            });

                            incidentObject['extensions'][this.guidedService.incidentCoreExtentionIncidentId]['impact_refs'] = impactIds;
                            this.stixService.addComponent(Object.assign({}, incidentObject as FormModel));
                        }
                    });
                }
            });
        }, 300);

        this.reset();
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

    ngOnDestroy(): void {
        this.cartSubscriptions.forEach((sub) => sub.unsubscribe());
        this.stixService.currentType = '';
        this.stixService.extensions = [];
    }
}

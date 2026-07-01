import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { faQuestionCircle, faInfoCircle, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';

@Component({
    selector: 'app-how-event-detection',
    templateUrl: './how-event-detection.component.html',
    styleUrls: ['./how-event-detection.component.css'],
    standalone: false,
})
export class HowEventDetectionComponent implements OnInit, OnDestroy {
    component: string = 'how-event-detection';

    private cartSubscriptions: Subscription[] = [];

    @Output() updateContinue = new EventEmitter<boolean>();
    @Output() showAssistance = new EventEmitter<any>();
    @Output() changePage = new EventEmitter<any>();

    faQuestionCircle = faQuestionCircle;
    faInfoCircle = faInfoCircle;
    faPlus = faPlus;
    faTrash = faTrash;

    incidentName = '';
    determination = '';
    investigationStatus = '';
    selectedDetectionMethod: string | null = null;
    detectionMethods: string[] = [];

    description = '';
    descriptionName = '';
    eventStatus = '';

    cartIds: number[] = [];
    IncidentId = '';

    determinationOptions: any[] = [
        { key: 'blocked', value: 'Blocked' },
        { key: 'confirmed', value: 'Confirmed' },
        { key: 'failed-attempt', value: 'Failed Attempt' },
        { key: 'false-positive', value: 'False Positive' },
        { key: 'suspected', value: 'Suspected' },
    ];

    investigationStatusOptions: any[] = [
        { key: 'closed', value: 'Closed' },
        { key: 'new', value: 'New' },
        { key: 'open', value: 'Open' },
    ];

    eventStatusOptions: any[] = [
        { key: 'ongoing', value: 'Ongoing' },
        { key: 'occurred', value: 'Occurred' },
        { key: 'not-occurred', value: 'Not Occurred' },
        { key: 'pending', value: 'Pending' },
        { key: 'undetermined', value: 'Undetermined' },
    ];

    detectionOptions: any[] = [
        { key: 'automated-tool', value: 'Automated Tool' },
        { key: 'commercial-solution', value: 'Commercial Solution' },
        { key: 'external-notification', value: 'External Notification' },
        { key: 'human-review', value: 'Human Review' },
        { key: 'message-from-attacker', value: 'Message From Attacker' },
        { key: 'propriety-solution', value: 'Propriety Solution' },
        { key: 'system-outage', value: 'System Outage' },
        { key: 'user-reporting', value: 'User Reporting' },
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
        this.setIncident();

        const editCartTimeout = setTimeout(() => {
            if (this.guidedService.editCartObject.component && this.guidedService.editCartObject.component === this.component) {
                if (this.guidedService.editCartObject.specialFlag === false) {
                    this.guidedService.getEditItemTrigger$.next(this.guidedService.editCartObject);
                } else if (this.guidedService.editCartObject.specialFlag === true) {
                    this.loadIncidentFromCart();
                    this.checkCart();
                    this.guidedService.getEditItemTrigger$.next(this.guidedService.editCartObject);
                }
            }
        }, 100);
    }

    setIncident() {
        if (this.guidedService.cart['Incident']) {
            this.IncidentId = this.guidedService.cart['Incident']['Incident'][0].id;
        }
    }

    private loadIncidentFromCart(): void {
        const incidentArr = this.guidedService.cart?.['Incident']?.['Incident'];
        if (!incidentArr || incidentArr.length === 0) return;

        const incident = incidentArr[0];
        this.incidentName = incident.name || '';

        const ext = incident.extensions?.[this.guidedService.incidentCoreExtentionIncidentId];
        if (ext) {
            this.determination = ext.determination || '';
            this.investigationStatus = ext.investigation_status || '';
            this.detectionMethods = ext.detection_methods ? [...ext.detection_methods] : [];
        }
    }

    private async syncIncidentToCart() {
        if (!this.determination || !this.investigationStatus) return;

        let today = new Date();
        let tempIncident: any = {
            type: 'incident',
            name: this.incidentName ? this.incidentName : `cyber-threat-detection-generated-${today.toISOString()}`,
            extensions: {
                [this.guidedService.incidentCoreExtentionIncidentId]: {
                    extension_type: 'property-extension',
                    determination: this.determination,
                    investigation_status: this.investigationStatus,
                },
            },
            cartId: -1,
        };

        tempIncident['display_name'] = tempIncident.name;

        if (this.detectionMethods && this.detectionMethods.length > 0) {
            tempIncident.extensions[this.guidedService.incidentCoreExtentionIncidentId]['detection_methods'] = this.detectionMethods;
        }

        tempIncident['id'] = this.IncidentId !== '' ? this.IncidentId : this.getStixId(tempIncident, 'Incident');

        await this.guidedService.syncCart('Incident', { Incident: [tempIncident] });
        this.setIncident();
    }

    async addComponents() {
        await this.syncIncidentToCart();
        return new Promise((resolve) => resolve(true));
    }

    get availableDetectionOptions() {
        return this.detectionOptions.filter((opt) => !this.detectionMethods.includes(opt.key));
    }

    getDetectionLabel(key: string): string {
        return this.detectionOptions.find((o) => o.key === key)?.value ?? key;
    }

    addDetectionMethod(method: string) {
        if (!method) return;
        if (!this.detectionMethods.includes(method)) {
            this.detectionMethods.push(method);
        }
        this.selectedDetectionMethod = null;
    }

    deleteDetectionMethod(method: string) {
        this.detectionMethods = this.detectionMethods.filter((m) => m !== method);
    }

    getStixId(object, typeName) {
        if (this.guidedService.editCart && this.guidedService.editCart['Incident'] && this.guidedService.editCart['Incident'][typeName]) {
            for (let oldObject of this.guidedService.editCart['Incident'][typeName]) {
                if (oldObject.cartId === object.cartId) {
                    return oldObject.id;
                }
            }
        }
        return `${object.type}--${this.stixService.getUUIDFrIdContributingProperties(object)}`;
    }

    async addCartItem(cancel) {
        if (cancel) {
            this.reset();
            this.checkCart();
            return;
        }

        let today = new Date();

        // Create Event object if status is selected (status is the only required field per ICE spec)
        if (this.eventStatus !== '') {
            let eventObject: any = {
                type: 'event',
                name: this.descriptionName !== '' ? this.descriptionName : `event-generated-${today.toISOString()}`,
                status: this.eventStatus,
                extensions: {
                    [this.guidedService.incidentCoreExtensionEventId]: {
                        extension_type: 'new-sdo',
                    },
                },
            };

            if (this.description !== '') {
                eventObject.description = this.description;
            }

            eventObject['cartId'] = this.cartIds[0] ? this.cartIds[0] : null;

            let emitObj = {
                mode: this.component,
                push: [eventObject],
            };

            this.guidedService.newCartItem$.next(emitObj);
        }

        this.guidedService.cartDisabled$.next(true);

        await this.syncIncidentToCart();

        this.reset();
        this.guidedService.editModeChange$.next(false);
        this.guidedService.cartEditMode = false;
    }

    editCartItem(event) {
        this.description = event.description || '';
        this.descriptionName = event.name || '';
        this.eventStatus = event.status || '';
        this.cartIds = [event.cartId];
        // Restore incident fields from the cart singleton
        this.loadIncidentFromCart();
        this.checkCart();
    }

    checkCart() {
        const hasEvent = this.eventStatus !== '';
        const hasIncident = this.determination !== '' && this.investigationStatus !== '';
        this.guidedService.cartDisabled$.next(!(hasEvent || hasIncident));
    }

    resetEventFields() {
        this.description = '';
        this.descriptionName = '';
        this.eventStatus = '';
        this.cartIds = [];
    }

    reset() {
        this.resetEventFields();
        this.incidentName = '';
        this.determination = '';
        this.investigationStatus = '';
        this.detectionMethods = [];
        this.selectedDetectionMethod = null;
    }

    redirectCart(event) {
        if (event.component !== this.component) {
            this.changePage.emit(event);
        } else if (event.specialFlag === true) {
            this.loadIncidentFromCart();
            this.checkCart();
            this.guidedService.getEditItemTrigger$.next(event);
        } else {
            this.guidedService.getEditItemTrigger$.next(event);
        }
    }

    syncCart(event) {
        if (event === this.component) {
            this.guidedService.syncCartTrigger$.next();
        }
    }

    showAssistanceTrigger() {
        this.showAssistance.emit();
    }

    ngOnDestroy(): void {
        this.cartSubscriptions.forEach((sub) => sub.unsubscribe());
    }
}

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';
import { faUserClock, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import * as moment from 'moment';
import * as moment_tz from 'moment-timezone';
import { FormModel } from '../../dynamic-form-component/form-model';

@Component({
    selector: 'app-when-event',
    templateUrl: './when-event.component.html',
    styleUrls: ['./when-event.component.css'],
    standalone: false,
})
export class WhenEventComponent implements OnInit, OnDestroy {
    //With Parent
    @Output() showAssistance = new EventEmitter<any>();
    @Output() changePage = new EventEmitter<any>();

    component: string = 'when-event';

    private cartSubscriptions: Subscription[] = [];

    faQuestionCircle = faQuestionCircle;
    faUserClock = faUserClock;
    faClock = faClock;
    startTime = null;
    endTime = null;
    numObserved = null;
    frequency = null;
    jitter = null;
    maxDateTime = null;
    minDateTime = null;
    onGoing = false;

    moment = moment;
    moment_tz = moment_tz;
    timeZones = [];
    timeZone = '';

    statusOptions = [];
    status = '';

    selectedEvent: string = '';
    prevEvent: string = '';

    editMode: boolean = false;
    cartIds: number[] = [];

    addedObject1 = false;
    addedObject2 = false;

    constructor(
        public guidedService: GuidedService,
        public stixService: StixService
    ) {
        this.showAssistance = new EventEmitter();

        this.statusOptions = ['ongoing', 'occurred', 'not-occurred', 'pending', 'undetermined'];

        this.timeZones = this.moment_tz.tz.names();
    }

    ngOnInit(): void {
        this.cartSubscriptions.push(
            this.guidedService.addItemClicked$.subscribe((cancel) => this.addCartItem(cancel)),
            this.guidedService.updateItemClicked$.subscribe((data) => this.editCartItem(data))
        );
        const editCartTimeout = setTimeout(() => {
            if (this.guidedService.editCartObject.component && this.guidedService.editCartObject.component === this.component) {
                this.guidedService.getEditItemTrigger$.next(this.guidedService.editCartObject);
            }
        }, 100);
    }

    addCartItem(cancel) {
        if (cancel) {
            for (let i = 0; i < this.guidedService.eventDetails.length; i++) {
                if (this.guidedService.eventDetails[i].name === this.prevEvent) {
                    this.guidedService.eventDetails.splice(i, 1);
                    break;
                }
            }
            this.reset();
            this.checkCart();
            return;
        }

        let whenEventObject = {
            type: this.component,
            status: this.status,
        };

        if (this.selectedEvent) {
            for (let i = 0; i < this.guidedService.eventDetails.length; i++) {
                if (this.guidedService.eventDetails[i].name === this.selectedEvent) {
                    whenEventObject['event'] = this.guidedService.eventDetails[i];
                    this.guidedService.eventDetails.splice(i, 1);
                    break;
                }
            }
        }

        if (this.timeZone) {
            whenEventObject['timeZone'] = this.timeZone;
        }

        if (this.startTime) {
            whenEventObject['startTime'] = this.startTime;
        }

        if (this.endTime) {
            whenEventObject['endTime'] = this.endTime;
        }

        whenEventObject['cartId'] = this.cartIds[0] ? this.cartIds[0] : null;

        let emitObj = {
            mode: 'when-event',
            push: [whenEventObject],
        };

        this.guidedService.newCartItem$.next(emitObj);
        this.guidedService.cartDisabled$.next(true);
        this.reset();
    }

    checkCart() {
        if (this.status === '') {
            this.guidedService.cartDisabled$.next(true);
            return;
        }

        if (this.guidedService.eventDetails.length !== 0 && this.selectedEvent === '') {
            this.guidedService.cartDisabled$.next(true);
            return;
        }

        if (this.timeZone === '' && (this.startTime !== null || this.endTime !== null)) {
            this.guidedService.cartDisabled$.next(true);
            return;
        }

        if (this.timeZone !== '' && this.startTime === null && this.endTime === null) {
            this.guidedService.cartDisabled$.next(true);
            return;
        }

        this.guidedService.cartDisabled$.next(false);
    }

    editCartItem(event) {
        this.reset();
        this.editMode = true;

        this.cartIds = [event.cartId];

        this.status = event.status;

        if (event.event) {
            this.prevEvent = event.event.name;
            this.selectedEvent = event.event.name;
            this.guidedService.eventDetails.push(event.event);
        }

        if (event.timeZone) {
            this.timeZone = event.timeZone;
        }

        if (event.startTime) {
            this.startTime = event.startTime;
        }

        if (event.endTime) {
            this.endTime = event.endTime;
        }

        this.checkCart();
    }

    reset() {
        this.selectedEvent = '';
        this.prevEvent = '';
        this.status = '';
        this.timeZone = '';

        this.startTime = null;
        this.endTime = null;

        this.editMode = false;
        this.cartIds = [];
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

    showAssistanceTrigger() {
        this.showAssistance.emit();
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
                types.push('event');

                let startTimeInTzUtc = obj.startTime ? this.guidedService.convertTimeToTzUtc(obj.startTime, obj.timeZone) : null;
                let endTimeInTzUtc = obj.endTime ? this.guidedService.convertTimeToTzUtc(obj.endTime, obj.timeZone) : null;

                obj.startTime = startTimeInTzUtc;
                obj.endTime = endTimeInTzUtc;

                obj['name'] = obj.event?.name ? obj.event.name : null;
                obj['goal'] = obj.event?.goal ? obj.event.goal : null;
                obj['description'] = obj.event?.description ? obj.event.description : null;

                obj['extensions'] = {
                    [this.guidedService.incidentCoreExtensionEventId]: {
                        extension_type: 'new-sdo',
                    },
                };

                if (obj.display_name) delete obj.display_name;
                if (obj.cartId) delete obj.cartId;
                if (obj.linkId) delete obj.linkId;
                if (obj.type) delete obj.type;
                if (obj.event) delete obj.event;
                if (obj.timeZone) delete obj.timeZone;

                data.push(obj);
            }
        }

        this.guidedService.addComponents(types, data);
        this.reset();

        if (this.guidedService.autoGenRelationships) {
            // Build relationship: Indicator --- Event (map all indicators to each event, many to many)
            setTimeout(() => {
                this.guidedService.findPreviouslyAddedObjects('indicator', 'indicator-when-event');
                this.guidedService.addedObjects.subscribe((addedObjects1) => {
                    if (
                        addedObjects1.eventType === 'indicator-when-event' &&
                        addedObjects1.objects &&
                        addedObjects1.objects.length > 0 &&
                        !this.addedObject1
                    ) {
                        this.addedObject1 = true;

                        this.guidedService.findPreviouslyAddedObjects('event', 'event-when-event');
                        this.guidedService.addedObjects.subscribe((addedObjects2) => {
                            if (
                                addedObjects2.eventType === 'event-when-event' &&
                                addedObjects2.objects &&
                                addedObjects2.objects.length > 0 &&
                                !this.addedObject2
                            ) {
                                this.addedObject2 = true;

                                addedObjects2.objects.forEach((o) => {
                                    this.guidedService.createRelationships('based-on', 'indicator', o.id);
                                });
                            }
                        });
                    }
                });
            }, 300);

            // Update Incident object with ref to Event
            setTimeout(() => {
                this.guidedService.findPreviouslyAddedObjects('incident', 'incident-object');
                this.guidedService.addedObjects.subscribe((addedObjects) => {
                    if (addedObjects.eventType === 'incident-object' && addedObjects.objects && addedObjects.objects.length > 0) {
                        let incidentObject = addedObjects.objects[0];

                        this.guidedService.findPreviouslyAddedObjects('event', 'event-object');
                        this.guidedService.addedObjects.subscribe((addedObjects) => {
                            if (addedObjects.eventType === 'event-object' && addedObjects.objects && addedObjects.objects.length > 0) {
                                let eventIds = [];
                                addedObjects.objects.forEach((o) => {
                                    eventIds.push({ event_ref: o.id });
                                });

                                incidentObject['extensions'][this.guidedService.incidentCoreExtentionIncidentId]['events'] = eventIds;
                                this.stixService.addComponent(Object.assign({}, incidentObject as FormModel));
                            }
                        });
                    }
                });
            }, 300);
        }
    }

    selectedTime(type) {
        if (this.endTime && type === 'endTime') {
            let startTime = this.endTime;
            startTime.setSeconds(startTime.getSeconds() + 1);
            this.maxDateTime = startTime;
        }

        if (this.startTime && type === 'startTime') {
            let endTime = this.startTime;
            endTime.setSeconds(endTime.getSeconds() - 1);
            this.minDateTime = endTime;
        }

        this.checkCart();
    }

    setTimeZone(event) {
        if (event && event.target && event.target.value) {
            this.timeZone = event.target.value;
        }

        this.checkCart();
    }

    onYearSelected(normalizedYear: Date, field: 'startTime' | 'endTime'): void {
        const current = field === 'startTime' ? this.startTime : this.endTime;
        const base = current || new Date();
        const updated = this.guidedService.applyNewYear(normalizedYear, base);
        if (!updated) return;
        if (field === 'startTime') this.startTime = updated;
        else this.endTime = updated;
    }

    ngOnDestroy(): void {
        this.cartSubscriptions.forEach((sub) => sub.unsubscribe());
    }
}

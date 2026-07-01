import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';
import { faUserClock, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import * as moment from 'moment';
import * as moment_tz from 'moment-timezone';

@Component({
    selector: 'app-when-sighting',
    templateUrl: './when-sighting.component.html',
    styleUrls: ['./when-sighting.component.css'],
    standalone: false,
})
export class WhenSightingComponent implements OnInit {
    @Output() showAssistance: EventEmitter<any>;

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
    timeZone = null;

    constructor(
        public guidedService: GuidedService,
        public stixService: StixService
    ) {
        this.showAssistance = new EventEmitter();
    }

    ngOnInit(): void {
        this.timeZones = this.moment_tz.tz.names();
    }

    createDescription() {
        let description = '';

        if (this.frequency) {
            description = `Frequency: ${this.frequency}. `;
        }

        if (this.jitter) {
            description += `Jitter: ${this.jitter}.`;
        }

        return description;
    }

    addComponents() {
        this.guidedService.findPreviouslyAddedObjects('indicator', 'indicator-object');
        this.guidedService.addedObjects.subscribe((addedObjects) => {
            if (addedObjects.eventType === 'indicator-object') {
                let indicatorId = null;
                let types = [];
                let data = [];

                const startTimeInTzUtc = this.startTime ? this.guidedService.convertTimeToTzUtc(this.startTime, this.timeZone) : null;
                const endTimeInTzUtc = this.endTime ? this.guidedService.convertTimeToTzUtc(this.endTime, this.timeZone) : null;

                if (addedObjects.objects && addedObjects.objects.length > 0) {
                    indicatorId = addedObjects.objects[0].id;
                }

                types.push('sighting');
                data.push({
                    first_seen: startTimeInTzUtc,
                    last_seen: endTimeInTzUtc,
                    sighting_of_ref: indicatorId ? indicatorId : null,
                    count: this.numObserved,
                    description: this.createDescription(),
                });

                this.guidedService.addComponents(types, data);
            }
        });
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
    }

    setTimeZone(event) {
        if (event && event.target && event.target.value) {
            this.timeZone = event.target.value;
        }
    }

    onYearSelected(normalizedYear: Date, field: 'startTime' | 'endTime'): void {
        const current = field === 'startTime' ? this.startTime : this.endTime;
        const base = current || new Date();
        const updated = this.guidedService.applyNewYear(normalizedYear, base);
        if (!updated) return;
        if (field === 'startTime') this.startTime = updated;
        else this.endTime = updated;
    }
}

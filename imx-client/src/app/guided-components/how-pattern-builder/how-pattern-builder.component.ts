import { Component, OnInit, OnDestroy, Input, EventEmitter, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { StixService } from 'src/app/stix-service.service';
import { GuidedService } from 'src/app/guided.service';
import * as moment from 'moment';
import * as moment_tz from 'moment-timezone';
import { MatDialog } from '@angular/material/dialog';
import { PatternBuilderComponent } from '../../dialogs/pattern-builder/pattern-builder.component';
import { faSearch, faEdit, faInfoCircle, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-how-pattern-builder',
    templateUrl: './how-pattern-builder.component.html',
    styleUrls: ['./how-pattern-builder.component.css'],
    standalone: false,
})
export class HowPatternBuilderComponent implements OnInit, OnDestroy {
    //With Parent
    @Output() showAssistance = new EventEmitter<any>();
    @Input() patternBuilderEvent: EventEmitter<string>;
    @Output() changePage = new EventEmitter<any>();

    component: string = 'how-pattern-builder';

    private cartSubscriptions: Subscription[] = [];

    faQuestionCircle = faQuestionCircle;

    toolOptions: string[] = ['STIX', 'PCRE', 'SIGMA', 'SNORT', 'Suricata', 'YARA', 'Other'];
    moment = moment;
    moment_tz = moment_tz;
    timeZoneOptions: any;

    name: string = '';
    details: string = '';
    toolSelection: string = '';
    // validFrom: string = '';
    firstObservedTimeZone: string = '';
    lastObservedTimeZone: string = '';
    // validFromTZ: string = '';
    firstObserved: string | Date = '';
    lastObserved: string | Date = '';
    numberObserved: string = '';
    frequency: string = '';
    jitter: string = '';

    first_seen: Date;
    last_seen: Date;
    firstDateStart: Date;
    lastDateStart: Date;

    observed = null;

    editMode: boolean = false;
    cartIds: number[] = [];
    objectIds: string[] = [];

    disableObserved: boolean = true;

    addedObject1 = false;
    addedObject2 = false;

    faEdit = faEdit;
    faInfoCircle = faInfoCircle;
    faSearch = faSearch;

    patternEdit: boolean = false;

    firstTimeZoneSearch = '';
    filteredTimeZoneOptions: string[] = [];
    showFirstTimezoneDropdown = false;
    lastTimeZoneSearch = '';
    showLastTimezoneDropdown = false;

    constructor(
        private stixService: StixService,
        public guidedService: GuidedService,
        private patternBuilderDialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.cartSubscriptions.push(
            this.guidedService.addItemClicked$.subscribe((cancel) => this.addCartItem(cancel)),
            this.guidedService.updateItemClicked$.subscribe((data) => this.editCartItem(data))
        );
        this.subscribeToParent();
        this.timeZoneOptions = this.moment_tz.tz.names();

        const editCartTimeout = setTimeout(() => {
            if (this.guidedService.editCartObject.component && this.guidedService.editCartObject.component === this.component) {
                this.guidedService.getEditItemTrigger$.next(this.guidedService.editCartObject);
            }
        }, 100);

        this.filteredTimeZoneOptions = this.sortTimezones(this.timeZoneOptions);

        if (this.firstObservedTimeZone) {
            this.firstTimeZoneSearch = this.guidedService.showTimezoneAndOffset(this.firstObservedTimeZone);
        }

        if (this.lastObservedTimeZone) {
            this.lastTimeZoneSearch = this.guidedService.showTimezoneAndOffset(this.lastObservedTimeZone);
        }
    }

    addCartItem(cancel) {
        if (cancel) {
            this.resetSlide();
            this.checkContinue(false);
            return;
        }

        let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let valid_from_date = new Date();

        let indicatorObject: any = {
            type: 'indicator',
            spec_version: '2.1',
            name: this.name ? this.name : `detection-string-generated-${this.guidedService.convertTimeToTzUtc(new Date(), timeZone)}`,
            pattern: this.details,
            valid_from: valid_from_date,
            timeZone: timeZone,
            pattern_type: this.toolSelection,
        };

        indicatorObject['cartId'] = this.cartIds[0] ? this.cartIds[0] : null;
        indicatorObject['id'] = this.objectIds[0] ? this.objectIds[0] : this.getStixId(indicatorObject);

        let emitObj = {
            mode: this.component,
            push: [indicatorObject],
        };

        let observed = this.getObserved(indicatorObject.id);

        if (!observed && this.observed && this.observed.id) {
            this.guidedService.observablesToRemove.push(this.observed.id);
        }

        if (observed !== false) {
            emitObj.push.push(observed);
        }

        this.guidedService.newCartItem$.next(emitObj);
        this.guidedService.cartDisabled$.next(true);
        this.resetSlide();
        this.checkContinue(false);
    }

    addComponents() {
        if (this.guidedService.cartLengths[this.component] === 0) {
            this.resetSlide();
            return;
        }
        let types = [];
        let data = [];

        for (let type in this.guidedService.cart[this.component]) {
            let objects = this.guidedService.cart[this.component][type];

            for (let obj of objects) {
                types.push(obj.type);
                let times: any;
                switch (obj.type) {
                    case 'indicator':
                        times = this.convertToUTC(obj.valid_from_tz, obj.valid_from, '');
                        if (times.first) {
                            obj.valid_from = times.first.toISOString();
                        }
                        break;
                    case 'sighting':
                        times = this.convertToUTC(obj.timeZone, obj.first_seen, obj.last_seen);
                        if (times.first) {
                            obj.first_seen = times.first.toISOString();
                        }
                        if (times.last) {
                            obj.last_seen = times.last.toISOString();
                        }
                        break;
                    case 'observed-data':
                        times = this.convertToUTC(obj.timeZone, obj.first_observed, obj.last_observed);
                        if (times.first) {
                            obj.first_observed = times.first.toISOString();
                        }
                        if (times.last) {
                            obj.last_observed = times.last.toISOString();
                        }
                }

                if (obj.timeZone) delete obj.timeZone;
                if (obj.valid_from_tz) delete obj.valid_from_tz;
                if (obj.display_name) delete obj.display_name;
                if (obj.cartId) delete obj.cartId;
                if (obj.linkId) delete obj.linkId;

                data.push(obj);
            }
        }

        this.guidedService.addComponents(types, data);
        this.resetSlide();

        if (this.guidedService.autoGenRelationships) {
            // Indicator --- Incident
            setTimeout(() => {
                this.guidedService.findPreviouslyAddedObjects('indicator', 'indicator-pattern-builder');
                this.guidedService.addedObjects.subscribe((addedObjects1) => {
                    if (
                        addedObjects1.eventType === 'indicator-pattern-builder' &&
                        addedObjects1.objects &&
                        addedObjects1.objects.length > 0 &&
                        !this.addedObject1
                    ) {
                        this.addedObject1 = true;

                        this.guidedService.findPreviouslyAddedObjects('incident', 'incident-pattern-builder');
                        this.guidedService.addedObjects.subscribe((addedObjects2) => {
                            if (
                                addedObjects2.eventType === 'incident-pattern-builder' &&
                                addedObjects2.objects &&
                                addedObjects2.objects.length > 0 &&
                                !this.addedObject2
                            ) {
                                this.addedObject2 = true;

                                this.guidedService.createRelationships('detected', 'indicator', addedObjects2.objects[0].id);
                            }
                        });
                    }
                });
            }, 300);
        }
    }

    getStixId(object) {
        let typeName = this.getObjectTypeName(object.type);
        if (this.guidedService.editCart && this.guidedService.editCart[this.component] && this.guidedService.editCart[this.component][typeName]) {
            for (let oldObject of this.guidedService.editCart[this.component][typeName]) {
                if (oldObject.cartId === object.cartId) {
                    return oldObject.id;
                }
            }
        }

        return `${object.type}--${this.stixService.getUUIDFrIdContributingProperties(object)}`;
    }

    getObjectTypeName(type) {
        let result = '';
        let split = type.split('-');
        for (let i in split) {
            let word = split[i];

            if (word === 'addr') {
                split[i] = 'Address';
                continue;
            } else if (word === 'url') {
                split[i] = 'URL';
                continue;
            } else if (word.startsWith('ip')) {
                let firstLetter = word.charAt(0).toUpperCase();
                let secondLetter = word.charAt(1).toUpperCase();

                split[i] = `${firstLetter}${secondLetter}${word.slice(2)}`;
                continue;
            }

            let firstLetter = word.charAt(0).toUpperCase();
            split[i] = `${firstLetter}${word.slice(1)}`;
        }

        result = split.join(' ');

        return result;
    }

    checkContinue(isDate) {
        let disableContinue = false;

        if (this.details === '' && this.toolSelection === '') {
            disableContinue = true;
        } else if (this.details !== '' && this.toolSelection === '') {
            disableContinue = true;
        } else if (this.toolSelection !== '' && this.details === '') {
            disableContinue = true;
        } else if (this.toolSelection === '' || this.details === '') {
            disableContinue = true;
        }

        this.disableObserved = disableContinue;

        if (this.numberObserved !== '' && this.numberObserved !== null) {
            if (this.firstObserved === '' || this.lastObserved === '') disableContinue = true;
        }

        if ((this.firstObserved !== '' || this.lastObserved !== '') && (this.numberObserved === '' || this.numberObserved === null)) {
            disableContinue = true;
        }

        if (this.firstObserved === null) this.firstObserved = '';
        if (this.lastObserved === null) this.lastObserved = '';

        if ((this.firstObservedTimeZone !== '' && this.firstObserved === '') || (this.lastObservedTimeZone !== '' && this.lastObserved === '')) {
            disableContinue = true;
        } else if (
            (this.firstObservedTimeZone === '' && this.firstObserved !== '') ||
            (this.lastObservedTimeZone === '' && this.lastObserved !== '')
        ) {
            disableContinue = true;
        }

        if ((this.firstObserved === '' && this.lastObserved !== '') || (this.firstObserved !== '' && this.lastObserved === '')) {
            disableContinue = true;
        }

        if (isDate === true && this.firstObserved !== '') {
            this.first_seen = new Date(this.firstObserved);
            if (this.first_seen > new Date() || this.first_seen > this.firstDateStart) this.firstDateStart = this.first_seen;
        }

        if (isDate === true && this.lastObserved !== '') {
            this.last_seen = new Date(this.lastObserved);
            if (this.last_seen < new Date() || this.last_seen < this.lastDateStart) this.lastDateStart = this.last_seen;
        }
        this.guidedService.cartDisabled$.next(disableContinue);
    }

    convertToUTC(timeZone, first: string, last: string) {
        let utc = moment.tz(timeZone).format('Z');

        let result = {};

        if (utc !== '') {
            if (first && first !== '') {
                result['first'] = new Date(`${first.toString().substring(0, 24)} ${utc}`);
            }

            if (last && last !== '') {
                result['last'] = new Date(`${last.toString().substring(0, 24)} ${utc}`);
            }

            return result;
        }

        return result;
    }

    checkObservedExists(scoObjects: any[]) {
        const observedDatas = [];
        if (this.guidedService.cart && this.guidedService.cart['how-observable'] && this.guidedService.cart['how-observable']['Observed Data']) {
            this.guidedService.cart['how-observable']['Observed Data'].forEach((observ) => {
                observedDatas.push(observ);
            });
        }

        this.stixService.bundle.objects.forEach((obj) => {
            const newObj = JSON.parse(JSON.stringify(obj));
            if (newObj.type === 'observed-data') {
                if (newObj.first_observed) {
                    newObj.first_observed = new Date(newObj.first_observed);
                }
                if (newObj.last_observed) {
                    newObj.last_observed = new Date(newObj.last_observed);
                }

                observedDatas.push(newObj);
            }
        });

        let first_observed;
        let last_observed;
        observedDatas.forEach((observed) => {
            observed.object_refs.forEach((id) => {
                if (scoObjects.includes(id)) {
                    [first_observed, last_observed] = this.compareDates(first_observed, last_observed, observed);
                }
            });
        });

        if (first_observed) {
            this.firstObserved = first_observed.first_observed;
            this.firstObservedTimeZone = first_observed.firstObservedTimeZone
                ? first_observed.firstObservedTimeZone
                : Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        if (last_observed) {
            this.lastObserved = last_observed.last_observed;
            this.lastObservedTimeZone = last_observed.lastObservedTimeZone
                ? last_observed.lastObservedTimeZone
                : Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
    }

    compareDates(currentFirstObserved, currentLastObserved, observed) {
        const firstObserved = observed.first_observed;
        const lastObserved = observed.last_observed;

        if (!currentFirstObserved || !currentFirstObserved.first_observed || firstObserved < currentFirstObserved.first_observed) {
            currentFirstObserved = observed;
        }
        if (!currentLastObserved || !currentLastObserved.last_observed || lastObserved > currentLastObserved.last_observed) {
            currentLastObserved = observed;
        }

        return [currentFirstObserved, currentLastObserved];
    }

    editCartItem(event) {
        this.cartIds = [];
        this.objectIds = [];

        let observed: any = {};
        if (event.main && event.observed) {
            observed = event.observed;
            event = event.main;

            this.cartIds = [event.cartId, observed.cartId];
            this.objectIds = [event.id, observed.id];
        } else {
            this.cartIds = [event.cartId];
            this.objectIds = [event.id];
        }

        this.name = event.name;
        this.details = event.pattern;
        this.toolSelection = event.pattern_type;

        if (observed) {
            for (let field in observed) {
                switch (field) {
                    case 'lastObservedTimeZone':
                    case 'firstObservedTimeZone':
                        this[field] = observed[field];

                        if (this[field] && field === 'firstObservedTimeZone') {
                            this.firstTimeZoneSearch = this.guidedService.showTimezoneAndOffset(this.firstObservedTimeZone);
                        }

                        if (this[field] && field === 'lastObservedTimeZone') {
                            this.lastTimeZoneSearch = this.guidedService.showTimezoneAndOffset(this.lastObservedTimeZone);
                        }
                        break;
                    case 'first_seen':
                        this.firstObserved = observed.first_seen;
                        break;
                    case 'last_seen':
                        this.lastObserved = observed.last_seen;
                        break;
                    case 'count':
                        this.numberObserved = observed.count;
                        break;
                    case 'first_observed':
                        this.firstObserved = observed.first_observed;
                        break;
                    case 'last_observed':
                        this.lastObserved = observed.last_observed;
                        break;
                    case 'number_observed':
                        this.numberObserved = observed.number_observed;
                        break;
                }
            }

            this.observed = observed;
        }

        if (!this.firstObserved) this.firstObservedTimeZone = '';
        if (!this.lastObserved) this.lastObservedTimeZone = '';

        this.checkContinue(false);
        this.editMode = true;
    }

    getObserved(id) {
        let observed = {};
        let observedType = '';
        let isSighting = false;

        observedType = 'observed-data';

        if (this.firstObservedTimeZone !== '' || this.lastObservedTimeZone !== '') {
            observed['firstObservedTimeZone'] = this.firstObservedTimeZone;
            observed['lastObservedTimeZone'] = this.lastObservedTimeZone;
            isSighting = true;
        }
        if (this.firstObserved !== '') {
            let thisType = '';
            switch (observedType) {
                case 'sighting':
                    thisType = 'first_seen';
                    break;
                case 'observed-data':
                    thisType = 'first_observed';
                    break;
            }

            observed[thisType] = this.firstObserved;
            isSighting = true;
        }
        if (this.lastObserved !== '') {
            let thisType = '';
            switch (observedType) {
                case 'sighting':
                    thisType = 'last_seen';
                    break;
                case 'observed-data':
                    thisType = 'last_observed';
                    break;
            }

            observed[thisType] = this.lastObserved;
            isSighting = true;
        }
        if (this.numberObserved !== '') {
            if (!this.firstObserved && !this.lastObserved) {
                this.numberObserved = '';
            } else {
                let thisType = '';
                switch (observedType) {
                    case 'sighting':
                        thisType = 'count';
                        break;
                    case 'observed-data':
                        thisType = 'number_observed';
                        break;
                }

                observed[thisType] = Number(this.numberObserved);
                isSighting = true;
            }
        }

        observed['type'] = observedType;
        if (isSighting === false) return isSighting;
        observed['cartId'] = this.cartIds[1] ? this.cartIds[1] : null;
        observed['id'] = this.objectIds[1] ? this.objectIds[1] : this.getStixId(observed);

        observed['spec_version'] = '2.1';
        if (observed['type'] === 'sighting') {
            observed['sighting_of_ref'] = id;
        } else {
            observed['object_refs'] = [id];
        }

        return observed;
    }

    openPatternBuilder(): void {
        if (this.toolSelection !== 'STIX' || this.patternEdit) return;

        const dialogRef = this.patternBuilderDialog.open(PatternBuilderComponent, {
            data: {},
            height: '800px',
            width: `${window.innerWidth}px`,
            maxWidth: '95vw',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.details = result.pattern;
                this.checkObservedExists(result.addedObjects);
            }

            this.checkContinue(false);
        });
    }

    redirectCart(event) {
        if (event.component !== this.component) {
            this.changePage.emit(event);
        } else {
            this.guidedService.getEditItemTrigger$.next(event);
        }
    }

    setPatternEditMode() {
        this.patternEdit = !this.patternEdit;
    }

    syncCart(event) {
        if (event === this.component) {
            this.guidedService.syncCartTrigger$.next();
        }
    }

    showAssistanceTrigger() {
        this.showAssistance.emit();
    }

    subscribeToParent() {
        this.patternBuilderEvent.subscribe((data: string) => {
            this.details = data;
            this.checkContinue(false);
        });
    }

    resetSlide() {
        this.name = '';
        this.details = '';
        this.toolSelection = '';

        this.firstObservedTimeZone = '';
        this.lastObservedTimeZone = '';
        this.firstObserved = '';
        this.lastObserved = '';
        this.numberObserved = '';
        this.frequency = '';
        this.jitter = '';
        this.lastDateStart = undefined;
        this.firstDateStart = undefined;
        this.first_seen = undefined;
        this.last_seen = undefined;

        this.editMode = false;
        this.observed = null;
    }

    checkObserved(observed: 'first' | 'last') {
        if (observed === 'first' && !this.firstObserved) {
            this.firstObservedTimeZone = '';
        } else if (observed === 'last' && !this.lastObserved) {
            this.lastObservedTimeZone = '';
        }
    }

    clearObserved(observed: 'first' | 'last') {
        if (observed === 'first') {
            this.firstObserved = '';
            this.firstObservedTimeZone = '';
        } else {
            this.lastObserved = '';
            this.lastObservedTimeZone = '';
        }

        this.checkContinue(true);
    }

    onYearSelected(normalizedYear: Date, field: 'first' | 'last'): void {
        const current = field === 'first' ? this.firstObserved : this.lastObserved;
        const base = current || new Date();
        const updated = this.guidedService.applyNewYear(normalizedYear, base);
        if (!updated) return;
        if (field === 'first') this.firstObserved = updated;
        else this.lastObserved = updated;
    }

    sortTimezones(timezones: string[]): string[] {
        return [...timezones].sort((a, b) => {
            const offsetA = this.getTimezoneOffset(a);
            const offsetB = this.getTimezoneOffset(b);

            if (offsetA !== offsetB) {
                return offsetA - offsetB;
            }

            return this.guidedService.showTimezoneAndOffset(a).localeCompare(this.guidedService.showTimezoneAndOffset(b));
        });
    }

    getTimezoneOffset(timezone: string): number {
        const match = this.guidedService.showTimezoneAndOffset(timezone).match(/GMT([+-]\d+)?/);

        if (!match || !match[1]) {
            return 0;
        }

        return Number(match[1]);
    }

    filterTimezones(search: string): void {
        const value = search.toLowerCase();

        this.filteredTimeZoneOptions = this.sortTimezones(
            this.timeZoneOptions.filter((tz) => this.guidedService.showTimezoneAndOffset(tz).toLowerCase().includes(value))
        );
    }

    selectFirstTimezone(tz: string): void {
        this.firstObservedTimeZone = tz;
        this.lastObservedTimeZone = this.firstObservedTimeZone;

        this.firstTimeZoneSearch = this.guidedService.showTimezoneAndOffset(tz);
        this.lastTimeZoneSearch = this.guidedService.showTimezoneAndOffset(this.firstObservedTimeZone);

        this.showFirstTimezoneDropdown = false;

        this.checkContinue(false);
    }

    hideFirstTimezoneDropdown(): void {
        setTimeout(() => {
            this.showFirstTimezoneDropdown = false;
        }, 200);
    }

    selectLastTimezone(tz: string): void {
        this.lastObservedTimeZone = tz;

        this.lastTimeZoneSearch = this.guidedService.showTimezoneAndOffset(tz);

        this.showLastTimezoneDropdown = false;

        this.checkContinue(false);
    }

    hideLastTimezoneDropdown(): void {
        setTimeout(() => {
            this.showLastTimezoneDropdown = false;
        }, 200);
    }

    ngOnDestroy(): void {
        this.cartSubscriptions.forEach((sub) => sub.unsubscribe());
    }
}

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { IncidentCoreExtension } from './types/incident-core-extension';
import { StixService } from '../stix-service.service';
import { LANGUAGES } from '../models/languages';
import { ENTITY_TYPE_OV } from './Entity_Type_OV';
import { EVENT_TYPE_OV } from './Event_Type_OV';
import { FormGroup } from '@angular/forms';

import { faTrash, faEdit, faBan, faPlus, faAngleDoubleUp, faInfoCircle, faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons';
import { ObjectEntryDialogComponent } from './object-entry/object-entry-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ObjectEntry } from './object-entry/object-entry';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
    selector: 'incident-core-extension',
    templateUrl: './incident-core-extension.component.html',
    styleUrls: ['./incident-core-extension.component.css'],
    standalone: false,
})
export class IncidentCoreExtensionComponent implements OnInit {
    @Output() isIceValid = new EventEmitter<boolean>();
    iceForm!: FormGroup;
    currentIncidentCoreExtension = {};
    editedIncidentCoreExtension = undefined;
    criticalityError = '';
    otherErrors = {};
    isAddingIncidentCoreExtension: boolean = false;
    newIncidentCoreExtension: IncidentCoreExtension[] = [];

    determination: string;
    extension_type: string = 'property-extension';
    investigation_status: string;
    criticality: number;
    recoverability: string;
    detection_methods: any[] = [];
    impact_refs: string[] = [];
    scores: any[] = [];
    events: ObjectEntry[] = [];
    tasks: ObjectEntry[] = [];
    impacted_entity_counts: any = new Map();
    incident_types: any[];

    impactRefs: string;
    taskRefs: string;
    eventRefs: string;
    incidentTypes: string;
    entity_count_string: string = '';
    entity_count_count: string = '';
    scores_name: string = '';
    scores_value: string = '';
    scores_description: string = '';
    detectionMethods: string;
    newSelector: any = undefined;
    lang: any;
    marking_ref: any;
    errorMessage: string = '';

    impactRefsList = [];
    filteredImpactRefsList = [];
    taskRefsList = [];
    filteredTaskRefsList = [];
    eventRefsList = [];
    filteredEventRefsList = [];

    faEdit = faEdit;
    faTrash = faTrash;
    faBan = faBan;
    faPlus = faPlus;
    faAngleDoubleDown = faAngleDoubleDown;
    faAngleDoubleUp = faAngleDoubleUp;
    faInfoCircle = faInfoCircle;

    tlp_options = [];
    lang_options: any[] = LANGUAGES;
    selectors: any[];
    componentData: any;
    impactObjects: any[] = this.stixService.bundle.objects.filter((o) => o.id.includes('impact'));

    incidentDeterminationEnum = ['blocked', 'confirmed', 'failed-attempt', 'false-positive', 'suspected'];
    incidentInvestigationOV = ['closed', 'new', 'open'];
    recoverabilityEnum = ['extended', 'not-applicable', 'not-recoverable', 'regular', 'supplemented'];
    incidentDetectionMethodsEnum = [
        'automated-tool',
        'commercial-solution',
        'external-notification',
        'human-review',
        'message-from-attacker',
        'propriety-solution',
        'system-outage',
        'user-reporting',
    ];
    incidentEventTypeOV = EVENT_TYPE_OV;
    incidentEntityTypeOV = ENTITY_TYPE_OV;
    traceabilityEnum = ['accountability-lost', 'partial-accountability', 'provable-accountability'];
    criticalityRegex = new RegExp('^(?:100|[1-9]?[0-9])$');

    entityCountsList = this.incidentEntityTypeOV;

    collapseScore = [];

    constructor(
        public stixService: StixService,
        public matDialog: MatDialog,
        public matAutocomplete: MatAutocompleteModule
    ) {}

    ngOnInit() {
        this.currentIncidentCoreExtension['isEnabled'] = true;
        if (this.stixService.editedIncidentCore) {
            this.currentIncidentCoreExtension = this.editedIncidentCoreExtension = this.stixService.editedIncidentCore;
            this.stixService.editedIncidentCore = undefined;
            this.currentIncidentCoreExtension['isEnabled'] = true;
            if (this.currentIncidentCoreExtension['impacted_entity_counts']) {
                for (let x in this.currentIncidentCoreExtension['impacted_entity_counts']) {
                    this.impacted_entity_counts.set(x, this.currentIncidentCoreExtension['impacted_entity_counts'][x]);
                }
            }
        }
        this.currentIncidentCoreExtension['extension_type'] = 'property-extension';

        this.impactRefsList = this.stixService.bundle.objects.filter((o) => o.id.includes('impact--'));
        this.filteredImpactRefsList = this.impactRefsList;
        this.taskRefsList = this.stixService.bundle.objects.filter((o) => o.id.includes('task--'));
        this.filteredTaskRefsList = this.taskRefsList;
        this.eventRefsList = this.stixService.bundle.objects.filter((o) => o.id.includes('event--'));
        this.filteredEventRefsList = this.eventRefsList;

        this.isValid();
    }

    isValid() {
        let valid = true;

        if (
            this.currentIncidentCoreExtension['criticality'] &&
            (this.currentIncidentCoreExtension['criticality'] > 100 || this.currentIncidentCoreExtension['criticality'] < 0)
        ) {
            this.criticalityError = 'Criticality must be between 0 and 100';
            this.otherErrors['criticality'] = 'Criticality must be between 0 and 100';
            valid = false;
        } else {
            this.otherErrors['criticality'] = '';
        }

        if (!this.currentIncidentCoreExtension['determination']) {
            valid = false;
            this.otherErrors['determination'] = 'Determination must be selected';
        } else {
            this.otherErrors['determination'] = '';
        }

        if (!this.currentIncidentCoreExtension['investigation_status']) {
            valid = false;
            this.otherErrors['investigation_status'] = 'Investigation Status must be selected';
        } else {
            this.otherErrors['investigation_status'] = '';
        }

        this.stixService.sendIceStatus(valid);
    }

    addGranularMarking(): void {
        const component: any = this.currentIncidentCoreExtension;
        for (const x in component) {
            if (component[x].length == 0) {
                delete component[x];
            }
        }
        this.stixService.granularMarkings.push(component);
        this.isAddingIncidentCoreExtension = false;
        this.stixService.editedGranularMarking = undefined;
        this.newSelector = [];
        this.errorMessage = '';

        this.currentIncidentCoreExtension = {};
    }

    addOrCancel(): void {
        if (this.isAddingIncidentCoreExtension && this.stixService.editedGranularMarking) {
            this.stixService.granularMarkings.push(this.stixService.editedGranularMarking);
            this.stixService.editedGranularMarking = undefined;
        }
        this.isAddingIncidentCoreExtension = !this.isAddingIncidentCoreExtension;
        this.newSelector = [];
        this.errorMessage = '';
        this.currentIncidentCoreExtension = {};
    }

    deleteIncidentCoreExtension(myobj: any) {
        this.stixService.granularMarkings = this.stixService.granularMarkings.filter((obj) => obj !== myobj);
    }

    addButton(): any {
        const md_Regex = new RegExp('marking-definition--[0-9a-f]{8}-[0-9a-f]{4}-[45][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}');

        this.currentIncidentCoreExtension = {};

        return {
            valid: true,
        };
    }

    addString(key): void {
        if (key == 'impact_refs') {
            const regex = new RegExp(/^impact--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
            if (!regex.test(this.impactRefs)) {
                this.otherErrors['impact_refs'] = "Must be a valid ID of type 'Impact'";
                return;
            }
            this.otherErrors['impact_refs'] = '';
        }

        if (key == 'event_refs') {
            const regex = new RegExp(/^event--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
            if (!regex.test(this.eventRefs)) {
                this.otherErrors['event_refs'] = "Must be a valid ID of type 'Event'";
                return;
            }
            this.otherErrors['event_refs'] = '';
        }

        if (key == 'task_refs') {
            const regex = new RegExp(/^task--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
            if (!regex.test(this.taskRefs)) {
                this.otherErrors['task_refs'] = "Must be a valid ID of type 'Task'";
                return;
            }
            this.otherErrors['task_refs'] = '';
        }

        let tempKey = key
            .replace(/_/g, ' ')
            .replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1);
            })
            .replace(/ /g, '');
        tempKey = tempKey.charAt(0).toLowerCase() + tempKey.substr(1);
        let tempString = this[tempKey];

        if (!tempString) return;

        if (this.currentIncidentCoreExtension[key]) {
            let newStringArray = this.currentIncidentCoreExtension[key]!;
            if (newStringArray.indexOf(tempString) == -1) {
                newStringArray.push(tempString);
                this.currentIncidentCoreExtension[key] = newStringArray;
            }
        } else this.currentIncidentCoreExtension[key] = [tempString];

        this[tempKey] = '';

        if (key === 'impact_refs') {
            this.filterImpactRefs();
        } else if (key === 'task_refs') {
            this.filterTaskRefs();
        } else if (key === 'event_refs') {
            this.filterEventRefs();
        }
    }

    deleteString(myobj: any, mykey: any) {
        let curr = this.currentIncidentCoreExtension[mykey] || [];
        curr = curr.filter((obj) => obj !== myobj);
        if (curr.length > 0) {
            this.currentIncidentCoreExtension[mykey] = curr;
        } else {
            delete this.currentIncidentCoreExtension[mykey];
        }
    }

    addEntityCount(): void {
        if (this.entity_count_string.length < 1) {
            this.otherErrors['impacted_entity_counts'] = 'Key is required';
            return;
        }
        if (this.entity_count_count.length < 1) {
            this.otherErrors['impacted_entity_counts'] = 'Count is required';
            return;
        }
        if (parseInt(this.entity_count_count) < 0) {
            this.otherErrors['impacted_entity_counts'] = 'Count must not be negative';
            return;
        }
        delete this.otherErrors['impacted_entity_counts'];

        this.impacted_entity_counts.set(this.entity_count_string, parseInt(this.entity_count_count));
        this.entity_count_string = '';
        this.entity_count_count = '';
        this.currentIncidentCoreExtension['impacted_entity_counts'] = Object.fromEntries(this.impacted_entity_counts);
        this.filterEntityCounts();
    }

    deleteEntityCount(key: string): void {
        this.impacted_entity_counts.delete(key);
        this.currentIncidentCoreExtension['impacted_entity_counts'] = Object.fromEntries(this.impacted_entity_counts);
    }

    createScore(): void {
        if (!this.scores_name || this.scores_name.length < 1) {
            this.otherErrors['scores'] = 'Please add Score Name & Value';
            return;
        }
        if (!this.scores_value || this.scores_value.length < 1) {
            this.otherErrors['scores'] = 'Please add Score Name & Value';
            return;
        }

        this.otherErrors['scores'] = '';

        let temp = {};
        temp['name'] = this.scores_name;
        this.scores_name = '';
        temp['value'] = this.scores_value;
        this.scores_value = '';
        if (this.scores_description.length > 0) {
            temp['description'] = this.scores_description;
            this.scores_description = '';
        }
        if (this.currentIncidentCoreExtension['scores']) {
            this.currentIncidentCoreExtension['scores'].push(temp);
        } else {
            this.currentIncidentCoreExtension['scores'] = [temp];
        }

        this.collapseScore.push(false);
        this.isValid();
    }

    deleteScore(i: number): void {
        this.currentIncidentCoreExtension['scores'].splice(i, 1);
        this.collapseScore.splice(i, 1);
        if (this.currentIncidentCoreExtension['scores'].length === 0) delete this.currentIncidentCoreExtension['scores'];
    }

    openObjectEntryDialog(type: string) {
        let refs;

        if (this.currentIncidentCoreExtension['event_refs'] && type === 'Event') {
            refs = this.currentIncidentCoreExtension['event_refs'].slice();
        } else if (this.currentIncidentCoreExtension['task_refs'] && type === 'Task') {
            refs = this.currentIncidentCoreExtension['task_refs'].slice();
        } else if (this.currentIncidentCoreExtension['impact_refs'] && type === 'Impact') {
            refs = this.currentIncidentCoreExtension['impact_refs'].slice();
        }

        const dialogRef = this.matDialog.open(ObjectEntryDialogComponent, {
            data: { type: type, refs: refs },
            height: '600px',
            width: `${(window.innerWidth / 3) * 2}px`,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                if (type === 'Event') {
                    this.currentIncidentCoreExtension['event_refs'] = result;
                } else if (type === 'Task') {
                    this.currentIncidentCoreExtension['task_refs'] = result;
                } else if (type === 'Impact') {
                    this.currentIncidentCoreExtension['impact_refs'] = result;
                }
            }
        });
    }

    fixThis(): void {
        this.stixService.currentIncidentCoreExtension = this.currentIncidentCoreExtension;
    }

    scrollTo(htmlElem: HTMLElement): void {
        htmlElem.scrollIntoView();
        window.scrollBy({ top: -120 });
    }

    filterEntityCounts() {
        this.entityCountsList = this.incidentEntityTypeOV.filter((elem) => elem.includes(this.entity_count_string.trim()));
    }

    filterImpactRefs() {
        this.filteredImpactRefsList = this.impactRefsList.filter((elem) => {
            if (elem.impact_category) {
                if (elem.impact_category.includes(this.impactRefs.trim())) return true;
            }

            if (elem.id.includes(this.impactRefs.trim())) return true;

            return false;
        });
    }

    filterTaskRefs() {
        this.filteredTaskRefsList = this.taskRefsList.filter((elem) => {
            if (elem.name) {
                if (elem.name.includes(this.taskRefs.trim())) return true;
            }

            if (elem.id.includes(this.taskRefs.trim())) return true;

            return false;
        });
    }

    filterEventRefs() {
        this.filteredEventRefsList = this.eventRefsList.filter((elem) => {
            if (elem.name) {
                if (elem.name.includes(this.eventRefs.trim())) return true;
            }

            if (elem.id.includes(this.eventRefs.trim())) return true;

            return false;
        });
    }

    getRef(type, id): string {
        let refObject = this[type].find((elem) => elem.id === id);
        if (!refObject) return id;

        if (type === 'impactRefsList') {
            if (refObject['impact_category']) return refObject['impact_category'] + ' (' + refObject['id'] + ')';
            else return refObject['id'];
        } else {
            if (refObject['name']) return refObject['name'] + ' (' + refObject['id'] + ')';
            else return refObject['id'];
        }
    }

    changeCollapse(index) {
        this.collapseScore[index] = !this.collapseScore[index];
    }

    formatReferenceString(refId: string): string {
        const obj = this.stixService.bundle.objects.find((o) => o.id === refId);

        if (!obj) {
            return refId;
        }

        switch(obj['type']) {
            case 'impact':
                return `Impact - ${obj.impact_category} (${obj.id})`;
            case 'sighting':
                let sightingObject = this.stixService.bundle.objects.find((o) => o.id === obj.sighting_of_ref);
                return 'Sighting of ' + sightingObject.name || `Sighting of '${sightingObject.name || sightingObject.value ? sightingObject.name : "Unnamed " + sightingObject.type }'`;
            case 'ipv4-addr':
                return obj.value + ` (${obj.type})` || `IPv4 Address (${obj.id})`;
            case 'ipv6-addr':
                return obj.value + ` (${obj.type})` || `IPv6 Address (${obj.id})`;
            default:
                return (obj.name || obj.value)? (obj.name || obj.value) + ` (${obj.type})` : `Unnamed ${obj.type} (${obj.id})`;
        }
    }
}

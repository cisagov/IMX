import { Component, OnInit, EventEmitter, Output, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { IncidentCoreObject } from './types/incident-core-object';
import { StixService } from '../stix-service.service';
import { LANGUAGES } from '../models/languages';
import { ENTITY_TYPE_OV } from './Entity_Type_OV';
import { EVENT_TYPE_OV } from './Event_Type_OV';
import { TASK_TYPE_OV } from './Task_Type_OV';
import {
    faTrash,
    faEdit,
    faBan,
    faPlus,
    faAngleDoubleUp,
    faInfoCircle,
    faAngleDoubleDown,
    faFileImport,
    faExclamationCircle,
    faStickyNote,
} from '@fortawesome/free-solid-svg-icons';
import { ObjectEntryDialogComponent } from './object-entry/object-entry-dialog.component';
import { ChangedObjectDialogComponent } from './changed-object/changed-object-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { v4 as uuid } from 'uuid';
import { Router } from '@angular/router';
import { ObjectEntry } from './object-entry/object-entry';
import { EnvService } from '../env-service/env.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import all_schemas from '../bundle/schemas.json';
import { ImpactExtensionsDialogComponent } from './impact-extensions/impact-extensions-dialog.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NoteDialogComponent } from '../add-component/note-dialog-component/note-dialog-component.component';
import { db } from '../db.service';

@Component({
    selector: 'incident-core-object',
    templateUrl: './incident-core-object.component.html',
    styleUrls: ['./incident-core-object.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: false,
})
export class IncidentCoreObjectComponent implements OnInit {
    @Output() componentData = new EventEmitter<{}>();
    @ViewChild('nameRow') nameRow: ElementRef;
    @ViewChild('confidenceRow') confidenceRow: ElementRef;
    @ViewChild('languageRow') languageRow: ElementRef;
    @ViewChild('createdByRefRow') createdByRefRow: ElementRef;
    @ViewChild('goalRow') goalRow: ElementRef;
    @ViewChild('statusRow') statusRow: ElementRef;
    @ViewChild('descriptionRow') descriptionRow: ElementRef;
    @ViewChild('eventTypesRow') eventTypesRow: ElementRef;
    @ViewChild('sightingRefsRow') sightingRefsRow: ElementRef;
    @ViewChild('changedObjectsRow') changedObjectsRow: ElementRef;
    @ViewChild('nextEventRefsRow') nextEventRefsRow: ElementRef;
    @ViewChild('startTimeRow') startTimeRow: ElementRef;
    @ViewChild('endTimeRow') endTimeRow: ElementRef;
    @ViewChild('impactCategoryRow') impactCategoryRow: ElementRef;
    @ViewChild('recoverabilityRow') recoverabilityRow: ElementRef;
    @ViewChild('criticalityRow') criticalityRow: ElementRef;
    @ViewChild('impactedEntityCountsRow') impactedEntityCountsRow: ElementRef;
    @ViewChild('impactedRefsRow') impactedRefsRow: ElementRef;
    @ViewChild('supersededRow') supersededRow: ElementRef;
    @ViewChild('outcomeRow') outcomeRow: ElementRef;
    @ViewChild('priorityRow') priorityRow: ElementRef;
    @ViewChild('taskTypesRow') taskTypesRow: ElementRef;
    @ViewChild('errorRow') errorRow: ElementRef;
    @ViewChild('nextTaskRefsRow') nextTaskRefsRow: ElementRef;

    currentIncidentCoreObject = {};
    editedIncidentCoreObject;
    isAddingIncidentCoreObject: boolean = false;
    newIncidentCoreObject: IncidentCoreObject[] = [];

    determination: string;
    extension_type: string = 'zzz';
    investigation_status: string;
    criticality: number;
    recoverability: string;
    traceability_impact: string;
    attacker_activites: any[];
    availability_impacts: any[];
    confidentiality_impacts: any[];
    defender_activites: any[];
    detection_methods: any[];
    external_impacts: any[];
    impacted_entity_counts: any = new Map();
    incident_types: any[];
    integrity_impacts: any[];
    monetary_impacts: any[];
    physical_impacts: any[];
    scores: any[] = [];
    events: ObjectEntry[] = [];
    tasks: ObjectEntry[] = [];

    isEnabled: boolean = true;
    toplevelEnabled: boolean = true;

    type: string = 'event';

    previousImpactCat: string = '';
    incidentTypes: string;
    eventTypes: string;
    taskTypes: string;
    impactedRefs: string;
    sightingRefs: string;
    entity_count_string: string = '';
    entity_count_count: string = '';
    stateChangeType: string = '';
    initialRef: string = '';
    resultRef: string = '';
    scores_name: string = '';
    scores_value: string = '';
    scores_description: string = '';
    detectionMethods: string;
    newSelector: any = undefined;
    lang: any;
    marking_ref: any;
    errorMessage: string = '';
    errors = {};

    isFormEditing = true;
    isLoadingItem = false;

    faEdit = faEdit;
    faTrash = faTrash;
    faBan = faBan;
    faPlus = faPlus;
    faAngleDoubleDown = faAngleDoubleDown;
    faAngleDoubleUp = faAngleDoubleUp;
    faInfoCircle = faInfoCircle;
    faFileImport = faFileImport;
    faExclamation = faExclamationCircle;
    faNote = faStickyNote;

    tlp_options = [];
    lang_options: any[] = LANGUAGES;
    selectors: any[];
    impactObjects: any[] = this.stixService.bundle.objects.filter((o) => o.id.includes('impact'));
    filteredImpactObjects = this.impactObjects;
    sightingObjects: any[] = this.stixService.bundle.objects.filter((o) => o.id.includes('sighting'));
    filteredSightingObjects = this.sightingObjects;

    changedObjectsRefIds: any[] = this.stixService.bundle.objects.filter((o) => all_schemas['SDOs_SROs'].includes(o.type)).map((o) => o.id);
    state_change_type = '';
    initialRefs = '';
    resultRefs = '';
    filteredInitialRefIds = this.changedObjectsRefIds;
    filteredResultRefIds = this.changedObjectsRefIds;

    nextEventRefs: string = '';
    eventRefIds = this.stixService.bundle.objects.filter((o) => o.id.includes('event--'));
    filteredEventRefIds = this.eventRefIds;

    nextTaskRefs: string = '';
    taskRefIds = this.stixService.bundle.objects.filter((o) => o.id.includes('task--'));
    filteredTaskRefIds = this.taskRefIds;

    impactedRefIds = this.stixService.bundle.objects;
    filteredImpactedRefIds = this.impactedRefIds;

    ids: any[] = [{ id: this.envService.env.defaultIdentity.id, name: this.envService.env.defaultIdentity.name }];

    initialForm;

    incidentDeterminationEnum = ['blocked', 'confirmed', 'failed-attempt', 'false-positive', 'suspected'];
    eventStatusEnum = ['ongoing', 'occurred', 'not-occurred', 'pending', 'undetermined'];
    taskOutcomeEnum = ['cancelled', 'failed', 'ongoing', 'pending', 'successful', 'unknown'];
    timestampFidelityEnum = ['day', 'hour', 'minute', 'month', 'second', 'year'];
    stateChangeTypeOV = ['caused', 'contributed-to', 'input', 'mitigated', 'output', 'resolved'];
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
    filteredIncidentEventType = this.incidentEventTypeOV;
    incidentEntityTypeOV = ENTITY_TYPE_OV;
    filteredIncidentEntityType = this.incidentEntityTypeOV;
    incidentTaskTypeOV = TASK_TYPE_OV;
    filteredIncidentTaskType = this.incidentTaskTypeOV;
    impactCategoriesVocab = [
        'availability',
        // 'availability-ext',
        'confidentiality',
        // 'confidentiality-ext',
        'external',
        // 'external-ext',
        'integrity',
        // 'integrity-ext',
        'monetary',
        // 'monetary-ext',
        'physical',
        // 'physical-ext',
        'traceability',
        // 'traceability-ext'
    ];
    filteredImpactCategoriesVocab = this.impactCategoriesVocab;
    criticalityRegex = new RegExp('^(?:100|[1-9]?[0-9])$');

    eventProperties = [
        { name: 'Name', row: 'nameRow' },
        { name: 'Confidence', row: 'confidenceRow' },
        { name: 'Language', row: 'languageRow' },
        { name: 'Created by ref', row: 'createdByRefRow' },
        { name: 'Goal', row: 'goalRow' },
        { name: 'Status*', row: 'statusRow' },
        { name: 'Event types', row: 'eventTypesRow' },
        { name: 'Sighting refs', row: 'sightingRefsRow' },
        { name: 'Changed objects', row: 'changedObjectsRow' },
        { name: 'Next event refs', row: 'nextEventRefsRow' },
        { name: 'Description', row: 'descriptionRow' },
        { name: 'Start time', row: 'startTimeRow' },
        { name: 'Start time fidelity', row: 'startTimeRow' },
        { name: 'End time', row: 'endTimeRow' },
        { name: 'End time fidelity', row: 'endTimeRow' },
    ];

    impactProperties = [
        { name: 'Confidence', row: 'confidenceRow' },
        { name: 'Language', row: 'languageRow' },
        { name: 'Created by ref', row: 'createdByRefRow' },
        { name: 'Recoverability', row: 'recoverabilityRow' },
        { name: 'Impact Category*', row: 'impactCategoryRow' },
        { name: 'Criticality', row: 'criticalityRow' },
        { name: 'Impacted Entity Counts', row: 'impactedEntityCountsRow' },
        { name: 'Impacted Refs', row: 'impactedRefsRow' },
        { name: 'Description', row: 'descriptionRow' },
        { name: 'Start time', row: 'startTimeRow' },
        { name: 'Start time fidelity', row: 'startTimeRow' },
        { name: 'End time', row: 'endTimeRow' },
        { name: 'End time fidelity', row: 'endTimeRow' },
        { name: 'Superseded By Ref', row: 'supersededRow' },
    ];

    taskProperties = [
        { name: 'Name', row: 'nameRow' },
        { name: 'Confidence', row: 'confidenceRow' },
        { name: 'Language', row: 'languageRow' },
        { name: 'Created By Ref', row: 'createdByRefRow' },
        { name: 'Outcome*', row: 'outcomeRow' },
        { name: 'Priority', row: 'priorityRow' },
        { name: 'Task Types', row: 'taskTypesRow' },
        { name: 'Error', row: 'errorRow' },
        { name: 'Changed objects', row: 'changedObjectsRow' },
        { name: 'Impacted Entity Counts', row: 'impactedEntityCountsRow' },
        { name: 'Next Task Refs', row: 'nextTaskRefsRow' },
        { name: 'Description', row: 'descriptionRow' },
        { name: 'Start time', row: 'startTimeRow' },
        { name: 'Start time fidelity', row: 'startTimeRow' },
        { name: 'End time', row: 'endTimeRow' },
        { name: 'End time fidelity', row: 'endTimeRow' },
    ];

    objProps = {
        event: ['name', 'goal', 'status', 'event_types', 'sighting_refs', 'changed_objects', 'next_event_refs'],
        impact: ['recoverability', 'impact_category', 'criticality', 'impacted_refs', 'superseded_by_ref'],
        task: ['name', 'outcome', 'priority', 'task_types', 'error', 'changed_objects', 'impacted_entity_counts', 'next_task_Refs'],
    };

    impactCategoryOptions: any[] = ['Availability', 'Confidentiality', 'External', 'Integrity', 'Monetary', 'Physical', 'Traceability'];
    impactCategoryFormData: Record<string, any> = {};
    recoverabilityOptions: any[] = ['Extended', 'Not Applicable', 'Not Recoverable', 'Regular', 'Supplemented'];

    incidentConfidentialityLossEnum = [
        { label: 'Confirmed Loss', value: 'confirmed-loss' },
        { label: 'Contained', value: 'contained' },
        { label: 'Exploited Loss', value: 'exploited-loss' },
        { label: 'Suspected Loss', value: 'suspected-loss' },
        { label: 'None', value: 'none' },
    ];

    currencyCodes = [
        { label: 'AED' },
        { label: 'AFN' },
        { label: 'ALL' },
        { label: 'AMD' },
        { label: 'ANG' },
        { label: 'AOA' },
        { label: 'ARS' },
        { label: 'AUD' },
        { label: 'AWG' },
        { label: 'AZN' },
        { label: 'BAM' },
        { label: 'BBD' },
        { label: 'BDT' },
        { label: 'BGN' },
        { label: 'BHD' },
        { label: 'BIF' },
        { label: 'BMD' },
        { label: 'BND' },
        { label: 'BOB' },
        { label: 'BOV' },
        { label: 'BRL' },
        { label: 'BSD' },
        { label: 'BTN' },
        { label: 'BWP' },
        { label: 'BYN' },
        { label: 'BZD' },
        { label: 'CAD' },
        { label: 'CDF' },
        { label: 'CHE' },
        { label: 'CHF' },
        { label: 'CHW' },
        { label: 'CLF' },
        { label: 'CLP' },
        { label: 'CNY' },
        { label: 'COP' },
        { label: 'COU' },
        { label: 'CRC' },
        { label: 'CUP' },
        { label: 'CVE' },
        { label: 'CZK' },
        { label: 'DJF' },
        { label: 'DKK' },
        { label: 'DOP' },
        { label: 'DZD' },
        { label: 'EGP' },
        { label: 'ERN' },
        { label: 'ETB' },
        { label: 'EUR' },
        { label: 'FJD' },
        { label: 'FKP' },
        { label: 'GBP' },
        { label: 'GEL' },
        { label: 'GHS' },
        { label: 'GIP' },
        { label: 'GMD' },
        { label: 'GNF' },
        { label: 'GTQ' },
        { label: 'GYD' },
        { label: 'HKD' },
        { label: 'HNL' },
        { label: 'HTG' },
        { label: 'HUF' },
        { label: 'IDR' },
        { label: 'ILS' },
        { label: 'INR' },
        { label: 'IQD' },
        { label: 'IRR' },
        { label: 'ISK' },
        { label: 'JMD' },
        { label: 'JOD' },
        { label: 'JPY' },
        { label: 'KES' },
        { label: 'KGS' },
        { label: 'KHR' },
        { label: 'KMF' },
        { label: 'KPW' },
        { label: 'KRW' },
        { label: 'KWD' },
        { label: 'KYD' },
        { label: 'KZT' },
        { label: 'LAK' },
        { label: 'LBP' },
        { label: 'LKR' },
        { label: 'LRD' },
        { label: 'LSL' },
        { label: 'LYD' },
        { label: 'MAD' },
        { label: 'MDL' },
        { label: 'MGA' },
        { label: 'MKD' },
        { label: 'MMK' },
        { label: 'MNT' },
        { label: 'MOP' },
        { label: 'MRU' },
        { label: 'MUR' },
        { label: 'MVR' },
        { label: 'MWK' },
        { label: 'MXN' },
        { label: 'MXV' },
        { label: 'MYR' },
        { label: 'MWK' },
        { label: 'MXN' },
        { label: 'MXV' },
        { label: 'MYR' },
        { label: 'MZN' },
        { label: 'NAD' },
        { label: 'NGN' },
        { label: 'NIO' },
        { label: 'NOK' },
        { label: 'NPR' },
        { label: 'NZD' },
        { label: 'OMR' },
        { label: 'PAB' },
        { label: 'PEN' },
        { label: 'PEK' },
        { label: 'PGK' },
        { label: 'PHP' },
        { label: 'PKR' },
        { label: 'PLN' },
        { label: 'PYG' },
        { label: 'QAR' },
        { label: 'RON' },
        { label: 'RSD' },
        { label: 'RUB' },
        { label: 'RWF' },
        { label: 'SAR' },
        { label: 'SBD' },
        { label: 'SCR' },
        { label: 'SDG' },
        { label: 'SEK' },
        { label: 'SGD' },
        { label: 'SHP' },
        { label: 'SLE' },
        { label: 'SOS' },
        { label: 'SRD' },
        { label: 'SSP' },
        { label: 'STN' },
        { label: 'SVC' },
        { label: 'SYP' },
        { label: 'SZL' },
        { label: 'THB' },
        { label: 'TJS' },
        { label: 'TMT' },
        { label: 'TND' },
        { label: 'TOP' },
        { label: 'TRY' },
        { label: 'TTD' },
        { label: 'TWD' },
        { label: 'TZS' },
        { label: 'UAH' },
        { label: 'UGX' },
        { label: 'USD' },
        { label: 'USN' },
        { label: 'UYI' },
        { label: 'UYU' },
        { label: 'UYW' },
        { label: 'UZS' },
        { label: 'VED' },
        { label: 'VES' },
        { label: 'VND' },
        { label: 'VUV' },
        { label: 'WST' },
        { label: 'XAF' },
        { label: 'XAG' },
        { label: 'XAU' },
        { label: 'XBA' },
        { label: 'XBB' },
        { label: 'XBC' },
        { label: 'XBD' },
        { label: 'XCD' },
        { label: 'XDR' },
        { label: 'XOF' },
        { label: 'XPD' },
        { label: 'XPF' },
        { label: 'XPT' },
        { label: 'XSU' },
        { label: 'XTS' },
        { label: 'XUA' },
        { label: 'XXX' },
        { label: 'YER' },
        { label: 'ZAR' },
        { label: 'ZMW' },
        { label: 'ZWG' },
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
        availability: [{ type: 'number', label: 'Availability Impact', model: 'availabilityImpact', stixKey: 'availability_impact', required: true }],
        confidentiality: [
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
        external: [
            { type: 'select', label: 'Impact Type', model: 'impactType', stixKey: 'impact_type', options: this.externalImpactType, required: true },
        ],
        integrity: [
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
        monetary: [
            { type: 'select', label: 'Variety', model: 'variety', stixKey: 'variety', options: this.monetaryImpactTypeOV, required: true },
            { type: 'number', label: 'Conversion Rate', model: 'conversionRate', stixKey: 'conversion_rate' },
            { type: 'datetime', label: 'Conversion Time', model: 'conversionTime', stixKey: 'conversion_time' },
            { type: 'select', label: 'Currency', model: 'currency', stixKey: 'currency', options: this.currencyCodes },
            { type: 'select', label: 'Currency Actual', model: 'currencyActual', stixKey: 'currency_actual', options: this.currencyCodes },
            { type: 'number', label: 'Minimum Amount', model: 'minimumAmount', stixKey: 'min_amount' },
            { type: 'number', label: 'Maximum Amount', model: 'maximumAmount', stixKey: 'max_amount' },
        ],
        physical: [
            { type: 'select', label: 'Impact Type', model: 'impactType', stixKey: 'impact_type', options: this.physicalImpactEnum, required: true },
            { type: 'select', label: 'Asset Type', model: 'assetType', stixKey: 'asset_type', options: this.physicalAssetType },
        ],
        traceability: [
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

    deletable_notes: Set<string> = new Set();
    notes;
    new_notes;

    constructor(
        public stixService: StixService,
        private router: Router,
        public matDialog: MatDialog,
        public matAutocomplete: MatAutocompleteModule,
        private modalService: NgbModal,
        private envService: EnvService
    ) {}

    async ngOnInit() {
        this.isLoadingItem = true;
        this.stixService.objectMarkingReferences = [];
        this.stixService.stringArrays.set('labels', []);

        if (!['event', 'impact', 'task'].includes(this.stixService.currentType)) {
            this.stixService.currentType = 'event';
        }
        this.type = this.stixService.currentType;
        this.currentIncidentCoreObject['type'] = this.type;
        this.currentIncidentCoreObject['id'] = `${this.type}--${uuid()}`;
        this.currentIncidentCoreObject['spec_version'] = '2.1';
        let date = new Date().toISOString();
        this.currentIncidentCoreObject['created'] = date;

        this.stixService.notes = new Map();
        this.stixService.new_notes = new Map();

        const url = window.location.href;
        if (url.includes('revocation=true')) {
            this.stixService.revocation = true;
        }

        let obj = await db.getItemBeingEdited();
        this.stixService.externalReferences = [];
        this.stixService.granularMarkings = [];
        this.stixService.extensions = [];
        this.stixService.toplevel = [];
        this.stixService.objectMarkingReferences = [];
        this.stixService.contents = [];
        this.stixService.stringArrays = new Map<string, string[]>();
        this.stixService.modalObjectArray = [];
        await db.clearItemBeingEdited();
        if (obj) {
            let currObject = obj;

            this.editedIncidentCoreObject = currObject;
            this.currentIncidentCoreObject = currObject;

            if (currObject.object_marking_refs) {
                this.stixService.objectMarkingReferences = currObject.object_marking_refs;
                delete this.currentIncidentCoreObject['object_marking_refs'];
            }

            if (currObject.labels) {
                this.stixService.stringArrays.set('labels', currObject.labels);
                delete this.currentIncidentCoreObject['labels'];
            }

            if (currObject.external_references) {
                this.stixService.externalReferences = currObject.external_references;
                delete this.currentIncidentCoreObject['external_references'];
            }

            if (this.currentIncidentCoreObject['impacted_entity_counts']) {
                for (let key in this.currentIncidentCoreObject['impacted_entity_counts']) {
                    this.impacted_entity_counts.set(key, parseInt(this.currentIncidentCoreObject['impacted_entity_counts'][key]));
                }
            }
            delete this.currentIncidentCoreObject['impacted_entity_counts'];

            if (this.currentIncidentCoreObject['start_time']) {
                this.currentIncidentCoreObject['start_time'] = this.currentIncidentCoreObject['start_time'];
            }

            if (this.currentIncidentCoreObject['end_time']) {
                this.currentIncidentCoreObject['end_time'] = this.currentIncidentCoreObject['end_time'];
            }

            if (this.currentIncidentCoreObject['extensions']) {
                let arr = [];
                for (let ext in this.currentIncidentCoreObject['extensions']) {
                    if (
                        !ext.includes('4ca6de00-5b0d-45ef-a1dc-ea7279ea910e') &&
                        ext != 'extension-definition--7cc33dd6-f6a1-489b-98ea-522d351d71b9' &&
                        ext.substring(22) != '2074a052-8be4-4932-849e-f5e7798e0030'
                    ) {
                        let temp = {};
                        temp[ext] = this.currentIncidentCoreObject['extensions'][ext];
                        this.stixService.extensions.push(temp);
                    }
                }
                this.prepareExtensionFormFields();
                delete this.currentIncidentCoreObject['extensions'];
                if(this.type === 'impact') this.stixService.extensions = [];
            }

            for (let prop in this.currentIncidentCoreObject) {
                if (this.isToplevel(prop)) {
                    this.stixService.toplevel.push([prop, this.currentIncidentCoreObject[prop]]);
                    delete this.currentIncidentCoreObject[prop];
                }
            }
        }

        this.stixService.bundle.objects.forEach((elem) => {
            if (elem.type == 'note' && elem.object_refs && elem.object_refs.includes(this.currentIncidentCoreObject['id']))
                this.stixService.notes.set(elem.id, JSON.parse(JSON.stringify(elem)));
        });

        this.notes = JSON.stringify(Array.from(this.stixService.notes));
        this.new_notes = JSON.stringify(Array.from(this.stixService.new_notes));

        this.currentIncidentCoreObject['created'] = date;
        this.currentIncidentCoreObject['modified'] = date;

        this.initialForm = {
            iceObject: JSON.stringify(this.currentIncidentCoreObject),
            objMarkRef: JSON.stringify(this.stixService.objectMarkingReferences),
            granularMarking: JSON.stringify(this.stixService.granularMarkings),
            externalRef: JSON.stringify(this.stixService.externalReferences),
            labels: JSON.stringify(this.stixService.stringArrays.get('labels')),
            extensions: JSON.stringify(this.stixService.extensions),
        };

        if(this.type === 'impact') {
            this.initialForm.impactCategoryFormData = JSON.stringify(this.impactCategoryFormData);
        }

        this.isLoadingItem = false;
    }

    addGranularMarking(): void {
        const component: any = this.currentIncidentCoreObject;
        for (const x in component) {
            if (component[x].length == 0) {
                delete component[x];
            }
        }
        this.stixService.granularMarkings.push(component);
        this.isAddingIncidentCoreObject = false;
        this.stixService.editedGranularMarking = undefined;
        this.newSelector = [];
        this.errorMessage = '';

        this.currentIncidentCoreObject = {};
    }

    addOrCancel(): void {
        if (this.isAddingIncidentCoreObject && this.stixService.editedGranularMarking) {
            this.stixService.granularMarkings.push(this.stixService.editedGranularMarking);
            this.stixService.editedGranularMarking = undefined;
        }
        this.isAddingIncidentCoreObject = !this.isAddingIncidentCoreObject;
        this.newSelector = [];
        this.errorMessage = '';
        this.currentIncidentCoreObject = {};
    }

    editIncidentCoreObject(myobj: any) {
        this.stixService.editedGranularMarking = myobj;
        this.currentIncidentCoreObject = myobj;
        this.stixService.granularMarkings = this.stixService.granularMarkings.filter((obj) => obj !== myobj);
    }

    deleteIncidentCoreObject(myobj: any) {
        this.stixService.granularMarkings = this.stixService.granularMarkings.filter((obj) => obj !== myobj);
    }

    addButton(): any {
        const md_Regex = new RegExp('marking-definition--[0-9a-f]{8}-[0-9a-f]{4}-[45][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}');

        this.currentIncidentCoreObject = {};

        return {
            valid: true,
        };
    }

    addString(key): void {
        if (key == 'sighting_refs') {
            const regex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
            if (!regex.test(this.sightingRefs) || !this.sightingRefs.startsWith('sighting--')) {
                this.errors['sighting_refs'] = 'Must be a valid ID and of type sighting';
                return;
            }
            delete this.errors['sighting_refs'];
            const regex2 = new RegExp(
                /^(attack-pattern|indicator|malware)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/
            );
            if (!regex2.test(this.sightingRefs)) {
                this.errors['sighting_refs'] = 'Sighting *SHOULD* be of type Attack Pattern/Indicator/Malware';
            }
        } else if (key == 'impacted_refs') {
            const regex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
            if (!regex.test(this.impactedRefs)) {
                this.errors['impacted_refs'] = 'Must be a valid ID';
                return;
            }
            delete this.errors['impacted_refs'];
        }
        let tempKey = key
            .replace(/_/g, ' ')
            .replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1);
            })
            .replace(/ /g, '');
        tempKey = tempKey.charAt(0).toLowerCase() + tempKey.substr(1);
        let tempString = this[tempKey];
        if (this.currentIncidentCoreObject[key]) {
            let newStringArray = this.currentIncidentCoreObject[key]!;
            if (newStringArray.indexOf(tempString) == -1) {
                newStringArray.push(tempString);
                this.currentIncidentCoreObject[key] = newStringArray;
            }
        } else this.currentIncidentCoreObject[key] = [tempString];

        this[tempKey] = '';

        if (key === 'sighting_refs') {
            this.filterRefs('sighting');
        } else if (key === 'next_event_refs') {
            this.filterRefs('nextEventRefs');
        } else if (key === 'impacted_refs') {
            this.filterRefs('impacted_refs');
        } else if (key === 'next_task_refs') {
            this.filterRefs('next_task_refs');
        } else if (key === 'event_types') {
            this.filterRefs(key);
        } else if (key === 'task_types') {
            this.filterRefs(key);
        }
    }

    formatImpactedRefString(refId: string): string {
        const obj = this.stixService.bundle.objects.find((o) => o.id === refId);

        if (!obj) {
            return refId;
        }

        // Display differently for Impact Objects
        if (obj['type'] === 'impact') {
            return `Impact (${obj.impact_category}) | ${obj.id}`;
        }

        return obj.name || obj.value || refId;
    }

    addObject(key) {
        let obj;

        switch (key) {
            case 'changed_objects':
                obj = {
                    state_change_type: this.state_change_type,
                    initial_ref: this.initialRefs,
                    result_ref: this.resultRefs,
                };

                this.initialRefs = '';
                this.resultRefs = '';
                this.state_change_type = '';
                this.filterRefs('initialRefs');
                this.filterRefs('resultRefs');
                this.isChangedObjectValid();
                break;
        }

        if (this.currentIncidentCoreObject[key]) {
            this.currentIncidentCoreObject[key].push(obj);
        } else this.currentIncidentCoreObject[key] = [obj];
    }

    deleteString(myobj: any, mykey: any) {
        let curr = this.currentIncidentCoreObject[mykey] || [];
        curr = curr.filter((obj) => obj !== myobj);
        if (curr.length > 0) {
            this.currentIncidentCoreObject[mykey] = curr;
        } else {
            delete this.currentIncidentCoreObject[mykey];
        }
    }

    addEntityCount(): void {
        if (this.entity_count_string.length < 1) {
            this.errors['impacted_entity_counts'] = 'Key is required';
            return;
        }
        if (this.entity_count_count.length < 1) {
            this.errors['impacted_entity_counts'] = 'Count is required';
            return;
        }
        if (parseInt(this.entity_count_count) < 0) {
            this.errors['impacted_entity_counts'] = 'Count must not be negative';
            return;
        }
        delete this.errors['impacted_entity_counts'];

        this.impacted_entity_counts.set(this.entity_count_string, parseInt(this.entity_count_count));
        this.entity_count_string = '';
        this.entity_count_count = '';
        let temp = Object.fromEntries(this.impacted_entity_counts); // Derek - this is how to convert later
        this.filterRefs('impacted_entity');
    }

    deleteEntityCount(key: string): void {
        this.impacted_entity_counts.delete(key);
    }

    addChangedObject(): void {
        let temp = {};
        temp['state_change_type'] = this.stateChangeType;
        this.stateChangeType = '';
        temp['initial_ref'] = this.initialRef;
        this.initialRef = '';
        temp['result_ref'] = this.resultRef;
        this.resultRef = '';
        if (this.currentIncidentCoreObject['changed_objects']) {
            this.currentIncidentCoreObject['changed_objects'].push(temp);
        } else {
            this.currentIncidentCoreObject['changed_objects'] = [temp];
        }
    }

    openObjectEntryDialog(type: string) {
        let dialogRef;
        if (type == 'Event' || type == 'Task') {
            let refs = [];
            if (type == 'Event' && this.currentIncidentCoreObject['next_event_refs']) {
                refs = this.currentIncidentCoreObject['next_event_refs'].slice();
            } else if (type == 'Task' && this.currentIncidentCoreObject['next_task_refs']) {
                refs = this.currentIncidentCoreObject['next_task_refs'].slice();
            }

            dialogRef = this.matDialog.open(ObjectEntryDialogComponent, {
                data: { type: type, refs: refs },
                height: '600px',
                width: `${(window.innerWidth / 3) * 2}px`,
            });
        } else if (type == 'Changed_Object') {
            dialogRef = this.matDialog.open(ChangedObjectDialogComponent, {
                data: { type: 'Event' },
                height: '600px',
                width: `${(window.innerWidth / 3) * 2}px`,
            });
        }

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                if (type === 'Event') {
                    this.currentIncidentCoreObject['next_event_refs'] = result;
                } else if (type === 'Task') {
                    this.currentIncidentCoreObject['next_task_refs'] = result;
                } else if (type == 'Changed_Object') {
                    if (this.currentIncidentCoreObject['changed_objects']) {
                        this.currentIncidentCoreObject['changed_objects'].push(result);
                    } else {
                        this.currentIncidentCoreObject['changed_objects'] = [result];
                    }
                }
            }
        });
    }

    cancel() {
        this.router.navigate(['/bundle']);
    }

    addIncidentCoreObject(data = null) {
        if (this.type === 'impact') {
            this.prepareExtensionsForImpact();
        }

        if (this.editedIncidentCoreObject) {
            this.stixService.origID = this.editIncidentCoreObject['id'];
        }
        if (this.stixService.editedGranularMarking) {
            this.stixService.granularMarkings.push(this.stixService.editedGranularMarking);
            this.stixService.editedGranularMarking = undefined;
        }
        if (this.stixService.editedExternalReference) {
            this.stixService.externalReferences.push(this.stixService.editedExternalReference);
            this.stixService.editedExternalReference = undefined;
        }
        if (this.stixService.editedExtension) {
            this.stixService.extensions.push(this.stixService.editedExtension);
            this.stixService.editedExtension = undefined;
        }

        if (this.stixService.objectMarkingReferences) {
            this.currentIncidentCoreObject['object_marking_refs'] = this.stixService.objectMarkingReferences;
        }

        if (this.stixService.stringArrays.get('labels')) {
            this.currentIncidentCoreObject['labels'] = this.stixService.stringArrays.get('labels');
        }

        if (this.stixService.granularMarkings.length > 0) {
            this.currentIncidentCoreObject['granular_markings'] = this.stixService.granularMarkings;
        }
        if (this.stixService.externalReferences.length > 0) {
            this.currentIncidentCoreObject['external_references'] = this.stixService.externalReferences;
        }
        if (this.type == 'event') {
            this.currentIncidentCoreObject['extensions'] = {
                ['extension-definition--4ca6de00-5b0d-45ef-a1dc-ea7279ea910e']: {
                    extension_type: 'new-sdo',
                },
            };
        } else if (this.type == 'impact') {
            let ext_type = this.currentIncidentCoreObject['impact_category'] + '-ext';
            let tempObj = this.stixService.extensions.find((obj) => Object.keys(obj)[0] === ext_type)[ext_type];
            this.currentIncidentCoreObject['extensions'] = {
                [ext_type]: tempObj,
                ['extension-definition--7cc33dd6-f6a1-489b-98ea-522d351d71b9']: {
                    extension_type: 'new-sdo',
                },
            };
        } else if (this.type == 'task') {
            this.currentIncidentCoreObject['extensions'] = {
                ['extension-definition--2074a052-8be4-4932-849e-f5e7798e0030']: {
                    extension_type: 'new-sdo',
                },
            };
        }

        if (this.stixService.extensions) {
            for (let ext of this.stixService.extensions) {
                for (let title in ext) {
                    this.currentIncidentCoreObject['extensions'][title] = ext[title];
                }
            }
            this.stixService.extensions = [];
        }

        for (let prop of this.stixService.toplevel) {
            this.currentIncidentCoreObject![prop[0]] = prop[1];
        }

        this.stixService.toplevel = [];

        this.stixService.newObject = false;
        this.stixService.added = true;

        this.cleanObj();

        this.stixService.addComponent(JSON.parse(JSON.stringify(this.currentIncidentCoreObject)));

        if (this.stixService.new_notes.size > 0) {
            this.stixService.new_notes.forEach((value, key) => this.stixService.addComponent(Object.assign({}, value)));
        }

        this.router.navigate(['/bundle']);
    }

    cleanObj(): void {
        if (this.impacted_entity_counts.size > 0) {
            this.currentIncidentCoreObject['impacted_entity_counts'] = Object.fromEntries(this.impacted_entity_counts);
        }

        if (this.currentIncidentCoreObject['start_time']) {
            if (typeof this.currentIncidentCoreObject['start_time'] != 'string') {
                this.currentIncidentCoreObject['start_time'] = this.currentIncidentCoreObject['start_time'].toISOString();
            }
        }

        if (this.currentIncidentCoreObject['end_time']) {
            if (typeof this.currentIncidentCoreObject['end_time'] != 'string') {
                this.currentIncidentCoreObject['end_time'] = this.currentIncidentCoreObject['end_time'].toISOString();
            }
        }

        if (this.currentIncidentCoreObject['next_event_refs'] && this.currentIncidentCoreObject['next_event_refs'] < 1) {
            delete this.currentIncidentCoreObject['next_event_refs'];
        }

        if (this.currentIncidentCoreObject['next_task_refs'] && this.currentIncidentCoreObject['next_task_refs'] < 1) {
            delete this.currentIncidentCoreObject['next_task_refs'];
        }

        for (let key in this.currentIncidentCoreObject) {
            let prop = this.currentIncidentCoreObject[key];
            if (prop == null || (typeof prop == 'string' && prop.length < 1)) {
                delete this.currentIncidentCoreObject[key];
            }
        }

        if (this.currentIncidentCoreObject['object_marking_refs'] && this.currentIncidentCoreObject['object_marking_refs'].length === 0) {
            delete this.currentIncidentCoreObject['object_marking_refs'];
        }

        if (this.currentIncidentCoreObject['labels'] && this.currentIncidentCoreObject['object_marking_refs'].length === 0) {
            delete this.currentIncidentCoreObject['labels'];
        }
    }

    setObjectMarkingReferences(newObjectMarkingReferences: string[]): void {
        this.stixService.objectMarkingReferences = newObjectMarkingReferences;
    }

    setLabels(newlabels: string[]): void {
        this.stixService.stringArrays.set('labels', newlabels);
    }

    isChangedObjectValid(): boolean {
        if (this.initialRefs) {
            const regex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
            let matches = this.initialRefs.match(regex);
            if (!matches || !all_schemas['SDOs_SROs'].includes(this.initialRefs.split('--')[0])) {
                this.errors['initialRefs'] = 'Must be a valid ID and an SDO';
                return false;
            } else if (this.resultRefs) {
                delete this.errors['initialRefs'];
                let matches2 = this.resultRefs.match(regex);
                if (matches2 && matches[1] != matches2[1]) {
                    this.errors['initialRefs'] = 'Must be of the same object type as Result Ref';
                    return false;
                }
            }
        } else {
            delete this.errors['initialRefs'];
        }
        if (this.resultRefs) {
            const regex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
            if (!regex.test(this.resultRefs) || !all_schemas['SDOs_SROs'].includes(this.resultRefs.split('--')[0])) {
                this.errors['resultRefs'] = 'Must be a valid ID and an SDO';
                return false;
            } else {
                delete this.errors['resultRefs'];
            }
        }

        delete this.errors['initialRefs'];
        delete this.errors['resultRefs'];

        if ((!this.initialRefs && !this.resultRefs) || !this.state_change_type) return false;

        return true;
    }

    isRefsValid(type): boolean {
        let key = type;
        if (type === 'event') {
            key = `nextEvent`;
        } else if (type === 'task') {
            key = 'nextTask';
        }

        if (this[`${key}Refs`].length === 0) return false;

        const regex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
        if (!regex.test(this[`${key}Refs`]) || !this[`${key}Refs`].startsWith(`${type}--`)) {
            this.errors[`${key}Refs`] = 'Must be a valid ID and type of ' + type;
            return false;
        }

        delete this.errors[`${key}Refs`];
        return true;
    }

    isFormValid(): boolean {
        const formKeys = Object.keys(this.currentIncidentCoreObject);
        formKeys.forEach((key) => {
            if (!this.stixService.granularMarkingSelectors.includes(key)) {
                this.stixService.granularMarkingSelectors.push(key);
            }
        });

        if (
            JSON.stringify(this.currentIncidentCoreObject) == this.initialForm.iceObject &&
            JSON.stringify(this.stixService.stringArrays.get('labels')) == this.initialForm.labels &&
            JSON.stringify(this.stixService.objectMarkingReferences) == this.initialForm.objMarkRef &&
            JSON.stringify(this.stixService.extensions) == this.initialForm.extensions &&
            JSON.stringify(this.stixService.externalReferences) == this.initialForm.externalRef &&
            JSON.stringify(this.stixService.granularMarkings) == this.initialForm.granularMarking &&
            JSON.stringify(Array.from(this.stixService.notes)) == this.notes &&
            JSON.stringify(Array.from(this.stixService.new_notes)) == this.new_notes
        ){
            if(this.type === 'impact') {
                if(this.initialForm.impactCategoryFormData === JSON.stringify(this.impactCategoryFormData)){
                    return false;
                }
            } else {
                return false;
            }
        }

        if (
            this.currentIncidentCoreObject['start_time'] &&
            this.currentIncidentCoreObject['end_time'] &&
            Date.parse(this.currentIncidentCoreObject['end_time']) < Date.parse(this.currentIncidentCoreObject['start_time'])
        ) {
            this.errors['end_time'] = 'End time must be after start time';
            return false;
        }
        delete this.errors['end_time'];

        if (
            this.currentIncidentCoreObject['confidence'] &&
            (this.currentIncidentCoreObject['confidence'] < 0 || this.currentIncidentCoreObject['confidence'] > 100)
        ) {
            this.errors['confidence'] = 'Confidence value must be an integer in the range of 0-100';
            return false;
        }
        delete this.errors['confidence'];

        switch (this.type) {
            case 'event':
                if (!this.currentIncidentCoreObject['status']) {
                    return false;
                }
                break;
            case 'impact':
                let ret = true;
                if (
                    this.currentIncidentCoreObject['criticality'] &&
                    (this.currentIncidentCoreObject['criticality'] > 100 || this.currentIncidentCoreObject['criticality'] < 0)
                ) {
                    this.errors['criticality'] = 'Criticality must be between 0 and 100';
                    ret = false;
                } else delete this.errors['criticality'];

                if (this.currentIncidentCoreObject['superseded_by_ref']) {
                    const regex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
                    if (
                        !regex.test(this.currentIncidentCoreObject['superseded_by_ref']) ||
                        !this.currentIncidentCoreObject['superseded_by_ref'].startsWith('impact--')
                    ) {
                        this.errors['superseded_by_ref'] = 'Must be a valid ID and type Impact';
                        ret = false;
                    } else if (!this.currentIncidentCoreObject['end_time']) {
                        this.errors['superseded_by_ref'] = 'End time must be populated when this field is present';
                        ret = false;
                    } else if (!this.currentIncidentCoreObject['impact_category']) {
                        this.errors['superseded_by_ref'] = 'Impact category must be populated, and of the same category';
                        ret = false;
                    } else {
                        const supersededRef = this.stixService.bundle.objects.find(
                            (elem) => elem.id === this.currentIncidentCoreObject['superseded_by_ref']
                        );
                        if (
                            supersededRef &&
                            supersededRef.impact_category &&
                            supersededRef.impact_category !== this.currentIncidentCoreObject['impact_category']
                        ) {
                            this.errors['superseded_by_ref'] = 'Impact category of the reference object must be the same category';
                            ret = false;
                        } else {
                            delete this.errors['superseded_by_ref'];
                        }
                    }
                } else {
                    delete this.errors['superseded_by_ref'];
                }

                if (!this.currentIncidentCoreObject['impact_category']) {
                    ret = false;
                } else {
                    let type = this.currentIncidentCoreObject['impact_category'];
                    for (let ext of this.stixService.extensions) {
                        if (ext[type + '-ext'] || (type.endsWith('-ext') && ext[type])) {
                            delete this.errors['impact_category'];
                        }
                    }

                    const category = this.currentIncidentCoreObject['impact_category'];
                    let categoryValid = true;

                    switch(category) {
                        case 'availability':
                            categoryValid = this.validateAvailability();
                            break;
                        case 'confidentiality':
                            categoryValid = this.validateConfidentiality();
                            break;
                        case 'external':
                            categoryValid = this.validateExternal();
                            break;
                        case 'integrity':
                            categoryValid = this.validateIntegrity();
                            break;
                        case 'monetary':
                            categoryValid = this.validateMonetary();
                            break;
                        case 'physical':
                            categoryValid = this.validatePhysical();
                            break;
                        case 'traceability':
                            categoryValid = this.validateTraceability();
                            break;
                        default: categoryValid = false;
                    }

                    if (!categoryValid) {
                        return false;
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
                                return value !== null;

                            case 'datetime':
                                return value !== null;

                            default:
                                return true;
                        }
                    });

                    if (allRequiredFilled) {
                        ret = true;
                    } else {
                        ret = false;
                    }

                    if (this.errors['impact_category']) {
                        ret = false;
                    }
                }
                return ret;
            case 'task':
                let returnVal = true;
                if (!this.currentIncidentCoreObject['outcome']) {
                    returnVal = false;
                }

                if (
                    this.currentIncidentCoreObject['priority'] &&
                    (this.currentIncidentCoreObject['priority'] < 0 || this.currentIncidentCoreObject['priority'] > 100)
                ) {
                    this.errors['priority'] = 'Value of priority should be between 0-100';
                    returnVal = false;
                } else {
                    delete this.errors['priority'];
                }

                return returnVal;
        }

        return true;
    }

    filterRefs(type: string) {
        switch (type) {
            case 'sighting':
                this.filteredSightingObjects = this.sightingObjects.filter((elem) => {
                    if (elem.id.includes(this.sightingRefs.trim())) return true;

                    return false;
                });
                break;
            case 'initialRefs':
                this.filteredInitialRefIds = this.changedObjectsRefIds.filter((elem) => elem.includes(this.initialRefs.trim()));
                this.isChangedObjectValid();
                break;
            case 'resultRefs':
                this.filteredResultRefIds = this.changedObjectsRefIds.filter((elem) => elem.includes(this.resultRefs.trim()));
                this.isChangedObjectValid();
                break;
            case 'nextEventRefs':
                this.filteredEventRefIds = this.eventRefIds.filter((elem) => elem.id.includes(this.nextEventRefs.trim()));
                break;
            case 'impact_category':
                this.filteredImpactCategoriesVocab = this.impactCategoriesVocab.filter((elem) =>
                    elem.includes(this.currentIncidentCoreObject['impact_category'].trim())
                );
                break;
            case 'impacted_entity':
                this.filteredIncidentEntityType = this.incidentEntityTypeOV.filter((elem) => elem.includes(this.entity_count_string.trim()));
                break;
            case 'task_types':
                this.filteredIncidentTaskType = this.incidentTaskTypeOV.filter((elem) => elem.includes(this.taskTypes.trim()));
                break;
            case 'event_types':
                this.filteredIncidentEventType = this.incidentEventTypeOV.filter((elem) => elem.includes(this.eventTypes.trim()));
                break;
            case 'impacted_refs':
                this.filteredImpactedRefIds = this.impactedRefIds.filter((elem) => elem.id.includes(this.impactedRefs.trim()));
                break;
            case 'superseded_by_ref':
                this.filteredImpactObjects = this.impactObjects.filter((elem) =>
                    elem.id.includes(this.currentIncidentCoreObject['superseded_by_ref'].trim())
                );
                break;
            case 'next_task_refs':
                this.filteredTaskRefIds = this.taskRefIds.filter((elem) => elem.id.includes(this.nextTaskRefs.trim()));
                break;
        }
    }

    scrollTo(rowName: string): void {
        const htmlElement = this[rowName] as ElementRef<HTMLDivElement>;
        const position = htmlElement.nativeElement.getBoundingClientRect().top;

        if (position > 84 && position < window.screen.height - 43) return;

        htmlElement.nativeElement.scrollIntoView();
        if (position < 84) {
            window.scrollBy({ top: position - 85 });
        }
    }

    openExtension() {
        if (!this.currentIncidentCoreObject['impact_category']) return;

        const dialogRef2 = this.matDialog.open(ImpactExtensionsDialogComponent, {
            data: { type: this.currentIncidentCoreObject['impact_category'] + '-ext' },
            height: '600px',
            width: `${(window.innerWidth / 3) * 2}px`,
        });

        dialogRef2.afterClosed().subscribe((result) => {
            if (!result) {
                this.currentIncidentCoreObject['impact_category'] = this.previousImpactCat;
            } else {
                this.previousImpactCat = this.currentIncidentCoreObject['impact_category'];

                this.stixService.extensions = this.stixService.extensions.filter((elem) => {
                    if (!Object.keys(elem)[0].endsWith('-ext')) return true;

                    const type = Object.keys(elem)[0].split('-ext')[0];
                    return type === this.currentIncidentCoreObject['impact_category'].split('-ext')[0];
                });
            }
        });
    }

    findImpactCat() {
        return this.currentIncidentCoreObject['impact_category'];
    }

    openNoteDialogModal() {
        const modalRef = this.modalService.open(NoteDialogComponent, { size: 'xl', modalDialogClass: 'modal-note' });
        modalRef.componentInstance.type = this.type;
        modalRef.componentInstance.notes = this.stixService.notes;
        modalRef.componentInstance.new_notes = this.stixService.new_notes;
        modalRef.componentInstance.deletable_notes = this.deletable_notes;
        modalRef.componentInstance.objectId = this.currentIncidentCoreObject['id'];
    }

    isObject(prop: any): boolean {
        return typeof prop == 'object';
    }

    isToplevel(key: string): boolean {
        if (
            [
                'type',
                'id',
                'spec_version',
                'created',
                'modified',
                'confidence',
                'created_by_ref',
                'lang',
                'description',
                'start_time',
                'start_time_fidelity',
                'end_time',
                'end_time_fidelity',
            ].includes(key)
        ) {
            return false;
        }

        if (this.objProps[this.type].includes(key)) {
            return false;
        }

        return true;
    }

    onImpactCategoryChange() {
        const fields = this.impactCategoryFieldMap[this.currentIncidentCoreObject['impact_category']] || [];

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

    validateConfidentiality() {
        let lossType = this.impactCategoryFormData['lossType'];
        let informationType  = this.impactCategoryFormData['informationType'];
        let isValid = true;

        if (lossType === null || lossType === '' || lossType === undefined) {
            this.errors['lossType'] = 'Loss Type is required';
            isValid = false;
        } else {
            delete this.errors['lossType'];
        }
        if (informationType === null || informationType === '' || informationType === undefined) {
            this.errors['informationType'] = 'Information Type is required';
            isValid = false;
        } else {
            delete this.errors['informationType'];
        }

        return isValid;
    }

    validateExternal() {
        let impactType = this.impactCategoryFormData['impactType'];

        if (impactType === null || impactType === '' || impactType === undefined) {
            this.errors['impactType'] = 'Impact Type is required';
            return false;
        }

        delete this.errors['impactType'];
        return true;
    }

    validateIntegrity() {
        let alteration = this.impactCategoryFormData['alteration'];
        let informationType  = this.impactCategoryFormData['informationType'];
        let isValid = true;

        if (alteration === null || alteration === '' || alteration === undefined) {
            this.errors['alteration'] = 'Alteration is required';
            isValid = false;
        } else {
            delete this.errors['alteration'];
        }
        if (informationType === null || informationType === '' || informationType === undefined) {
            this.errors['informationType'] = 'Information Type is required';
            isValid = false;
        } else {
            delete this.errors['informationType'];
        }

        return isValid;
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

    validatePhysical() {
        let impactType = this.impactCategoryFormData['impactType'];

        if (impactType === null || impactType === '' || impactType === undefined) {
            this.errors['impactType'] = 'Impact Type is required';
            return false;
        }

        delete this.errors['impactType'];
        return true;
    }

    validateTraceability() {
        let traceabilityImpact = this.impactCategoryFormData['traceabilityImpact'];

        if (traceabilityImpact === null || traceabilityImpact === '' || traceabilityImpact === undefined) {
            this.errors['traceabilityImpact'] = 'Traceability Impact is required';
            return false;
        }

        delete this.errors['traceabilityImpact'];
        return true;
    }

    prepareExtensionsForImpact() {
        const extensionsObj = {};
        const extensionPayload: any = {};

        // Pull in all extension data from inputs
        for (const field of this.impactCategoryFieldMap[this.currentIncidentCoreObject['impact_category']]) {
            const key = field.stixKey;
            let value = this.impactCategoryFormData[field.model];

            if (value !== null && value !== undefined && value !== '') {
                extensionPayload[key] = value;
            }
        }

        extensionsObj[`${this.currentIncidentCoreObject['impact_category'].toLowerCase()}-ext`] = extensionPayload;
        this.stixService.editedExtension = extensionsObj;
        return;
    }

    prepareExtensionFormFields() {
        let extensions = this.currentIncidentCoreObject['extensions'];
        if(!extensions) return;

        let extensionKey = `${this.currentIncidentCoreObject['impact_category']}-ext`;
        let savedExtension = extensions[extensionKey];

        if(!savedExtension) return;

        let fields = this.impactCategoryFieldMap[this.currentIncidentCoreObject['impact_category']];
        if(!fields) return;

        for (const field of fields) {
            let stixKey = field.stixKey;
            let savedValue = savedExtension[stixKey];

            if(savedValue !== undefined && savedValue !== null) {
                if(field.type === 'select') {
                    let opt = field.options.find((o) => (o.value ?? o.label) === savedValue);
                    this.impactCategoryFormData[field.model] = opt ? (opt.value ?? opt.label) : null;
                } else {
                    this.impactCategoryFormData[field.model] = savedValue;
                }
            }
        }
    }
}

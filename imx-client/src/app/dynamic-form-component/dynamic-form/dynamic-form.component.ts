import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { faExclamationTriangle, faHeart } from '@fortawesome/free-solid-svg-icons';
import { StixService } from 'src/app/stix-service.service';
import { FormModel } from '../form-model';
import { QuestionBase } from '../question-base';
import { QuestionControlService } from '../question-control.service';
import { OpenVocabArrayQuestion } from '../question-types/question-ov-array';
import { ReferenceArrayQuestion } from '../question-types/question-reference-array';
import { SCORefsQuestion } from '../question-types/question-sco-refs';
import { StringArrayQuestion } from '../question-types/question-string-array';
import { STRING_ARRAY_VALIDATORS } from '../string-array-validators';
import { HashArrayQuestion } from '../question-types/question-hash-array';
import { SCO_LIST } from '../../models/sco_list';
import { Router } from '@angular/router';
import { EnvService } from 'src/app/env-service/env.service';
import { GuidedService } from 'src/app/guided.service';
import { faBan, faFileImport, faWindowClose, faAngleDoubleUp, faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons';
import { KillChainQuestion } from '../question-types/question-kill-chain';
import { PhaseNameQuestion } from '../question-types/question-phase-name';
import { RefArrayQuestion } from '../question-types/question-ref-array';
import { ProtocolArrayQuestion } from '../question-types/question-protocol-array';
import { StringDictQuestion } from '../question-types/question-string-dict';
import { SCOReferenceArrayQuestion } from '../question-types/question-sco-reference-array';
import { TLP20_OPTIONS } from 'src/app/tlpMarkingDef';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-dynamic-form',
    templateUrl: './dynamic-form.component.html',
    styleUrls: ['./dynamic-form.component.css'],
    providers: [QuestionControlService],
    standalone: false,
})
export class DynamicFormComponent implements OnInit, OnChanges, OnDestroy {
    @Input() currentComponent: FormModel = null;
    @Input() hasX509V3Extensions: boolean = false;
    @Input() hasExternalReferences: boolean = false;
    @Input() hasContents: boolean = false;
    @Input() hasGranularMarkings: boolean = false;
    @Input() hasExtensions: boolean = false;
    @Input() hasObjectMarkingReferences: boolean = false;
    @Input() hasLabels: boolean = true;
    @Input() questions: QuestionBase<any>[] = [];
    @Input() isFormValid: Function = new Function();
    @Input() componentMap: Map<String, Object>;
    @Input() displayName: string = '';
    @Input() objectPropertyTypeSelectionInput: any;
    @Input() queryParams: any;
    @Input() objectSelectionInput: any;
    @Input() getJsonDisplayForComponent!: (component: any) => any;
    @Input() compareIdentity!: (id: string) => boolean;
    @Input() storedIdentities: any;
    @Input() cisaId: any;
    @Output() componentData = new EventEmitter<{}>();
    @Output() checkDuplicates = new EventEmitter<any>();
    @Output() stringArrayOutput = new EventEmitter<string[]>();
    @Output() guidedUIEvent: EventEmitter<any>;
    @Output() editObject = new EventEmitter<any>();
    @Output() revokeObject = new EventEmitter<any>();
    @Output() setMainIdentity = new EventEmitter<any>();
    @Output() removeObject = new EventEmitter<any>();
    @Output() addCISAIdentity = new EventEmitter<any>();
    @Output() viewDuplicatesEvent = new EventEmitter<{ event: Event; component: any }>();

    faBan = faBan;
    faAddToBundle = faFileImport;
    faClose = faWindowClose;
    faAngleDoubleUp = faAngleDoubleUp;
    faAngleDoubleDown = faAngleDoubleDown;
    faAlert = faExclamationTriangle;

    form!: UntypedFormGroup;
    payLoad = '';
    errorMessage = '';
    showClose = false;

    private checkDuplicates$ = new Subject<void>();
    private ngUnsubscribe = new Subject<void>();

    topColumnProperties = 'col-6';
    topCount = 0;
    bottomColumnProperties = 'col-4 pe-0';
    bottomCount = 0;
    question_type = '';
    faHeart = faHeart;

    originalData = {};
    currentData = {};

    origObjectMarkingRefs = '';
    origGranularMarkings = '';
    origExternalRefs = '';
    origExtensions = '';
    origLabels = '';
    origResolvesToRefs = '';
    origHashes = '';
    origContent = '';
    origExtTypes = '';
    origArrays = '';
    origIncidentCoreExtension = '';
    origTopLevelProps = '';
    origTimezones = '';
    origMalwareCorpus = '';

    currObjectMarkingRefs = '';
    currGranularMarkings = '';
    currExternalRefs = '';
    currExtensions = '';
    currLabels = '';
    currResolvesToRefs = '';
    currHashes = '';
    currContent = '';
    currExtTypes = '';
    currArrays = '';
    currIncidentCoreExtension = '';
    currTopLevelProps = '';
    currTimezones = '';
    currMalwareCorpus = '';

    addEnabled = false;
    formDataChanged = false;
    prevKillChain = [];
    toplevelEnabled = false;

    isIceValid = true;
    isMBEValid = true;
    notes;
    new_notes;

    toplevelSearch: string = 'asd';
    toplevelIndex: number = 0;
    toplevelMatches: string[] = [];
    toplevelResults: string = '';
    toplevelPrev: string = '';

    revoked = false;

    constructor(
        private qcs: QuestionControlService,
        public stixService: StixService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        public guidedService: GuidedService,
        private envService: EnvService,
        public modalService: NgbModal
    ) {
        this.guidedUIEvent = new EventEmitter();

        let temp = this.stixService.stringArrays.get('killChain');
        if (temp) {
            for (let string of temp) {
                this.prevKillChain.push(string);
            }
        }
    }

    ngOnChanges(_: SimpleChanges): void {
        if (!this.stixService.guidedUI) {
            this.form = this.qcs.toFormGroup(this.questions as QuestionBase<any>[]);
        }

        if (this.stixService.guidedUI) {
            let createdQ = this.questions.find((x) => x.key === 'created');
            if (createdQ) {
                createdQ.readonly = true;
            }
            let modifiedQ = this.questions.find((x) => x.key === 'modified');
            if (modifiedQ) {
                modifiedQ.readonly = true;
            }
            let sourceRefQ = this.questions.find((x) => x.key === 'source_ref');
            let targetRefQ = this.questions.find((x) => x.key === 'target_ref');
            let relationshipTypeQ = this.questions.find((x) => x.key === 'relationship_type');
            if (relationshipTypeQ) {
                let arrOptions = [];
                if (sourceRefQ.value === targetRefQ.value) {
                    if (!arrOptions.find((x) => x === 'duplicate-of')) {
                        arrOptions = arrOptions.concat(['duplicate-of']);
                    }

                    if (!arrOptions.find((x) => x === 'derived-from')) {
                        arrOptions = arrOptions.concat(['derived-from']);
                    }

                    if (!arrOptions.find((x) => x === 'related-to')) {
                        arrOptions = arrOptions.concat(['related-to']);
                    }
                } else {
                    if (!arrOptions.find((x) => x === 'related-to')) {
                        arrOptions = arrOptions.concat(['related-to']);
                    }
                }
                this.stixService.relationshipArrOptions = arrOptions;
            }
        }
    }

    ngOnInit() {
        this.checkDuplicates$
            .pipe(debounceTime(500), takeUntil(this.ngUnsubscribe))
            .subscribe(() => this.checkDuplicates.emit(this.form.getRawValue()));

        this.stixService.newObject = false;
        this.stixService.customTypesToAdd = [];
        this.topCount = 0;
        this.bottomCount = 0;

        if (!this.questions) {
            this.questions = [];
        }

        // Set if this is new object
        const createdObj = this.questions.find((q) => q.key === 'created');
        const modifiedObj = this.questions.find((q) => q.key === 'modified');
        if (createdObj && modifiedObj && createdObj.value === modifiedObj.value) {
            this.stixService.newObject = true;
        }

        // Set Created and Modified
        this.questions.forEach((question) => {
            if (question.key === 'type') this.question_type = question.value;
            if (question.key === 'created') //question.key === 'modified')
            {
                if (!question.value || this.stixService.newObject) {
                    let timenow = new Date();
                    question.value = timenow.toISOString();
                }
                question.readonly = true;
            } else if (question.key === 'modified') {
                let timenow = new Date();
                if (!question.value || this.stixService.newObject) {
                    let createdObj = this.questions.find((d) => d.key === 'created');
                    let createdDate = new Date(createdObj.value);
                    timenow = createdDate;
                }
                question.value = timenow.toISOString();
                question.readonly = true;
            } else if (question.key === 'revoked') {
                if (question.value && question.value[0] === 'true') {
                    this.revoked = true;
                }
            }
        });

        // Move description question to the end
        const descIndex = this.questions.findIndex((q) => q.key === 'description');
        if (descIndex !== -1) {
            const descObj = this.questions.splice(descIndex, 1);
            this.questions = this.questions.concat(descObj);
        }

        const revokedIndex = this.questions.findIndex((q) => q.key === 'revoked');
        if (this.stixService.newObject && revokedIndex !== -1) {
            this.questions[revokedIndex].columnProperties = '';
        }

        this.form = this.qcs.toFormGroup(this.questions as QuestionBase<any>[]);

        this.activatedRoute.queryParams.subscribe((params) => {
            if (Object.keys(params).includes('new_version') || Object.keys(params).includes('revocation')) {
                if (!params.fromBundle) this.showClose = true;

                const createdByRefIndex = this.questions.findIndex((q) => q.key === 'created_by_ref');
                if (createdByRefIndex !== -1 && this.form.get('created_by_ref').value === this.envService.env.defaultIdentity.id) {
                    this.form.get('created_by_ref').disable();
                }
            }
        });

        if (this.stixService.guidedUI === false) {
            if (this.hasObjectMarkingReferences) this.topCount++;
            if (this.ifLabels()) this.topCount++;
            switch (this.topCount) {
                case 1:
                    this.topColumnProperties = 'col-12';
                    break;
                case 2:
                    this.topColumnProperties = 'col-6';
                    break;
            }

            if (this.hasExtensions) this.bottomCount++;
            if (this.hasGranularMarkings) this.bottomCount++;
            if (this.hasExternalReferences) this.bottomCount++;
            switch (this.bottomCount) {
                case 1:
                    this.bottomColumnProperties = 'col-12 ps-0';
                    break;
                case 2:
                    this.bottomColumnProperties = 'col-6 ps-0';
                    break;
                case 3:
                    this.bottomColumnProperties = 'col-4 ps-0';
                    break;
            }
        } else {
            this.topColumnProperties = 'col-12';
            this.bottomColumnProperties = 'col-12 ps-0';
        }

        if (this.stixService.guidedUI && this.queryParams) {
            if (this.queryParams.new_version || this.queryParams.revocation) {
                const createdByRefIndex = this.questions.findIndex((q) => q.key === 'created_by_ref');
                if (createdByRefIndex !== -1) {
                    this.questions[createdByRefIndex].readonly = true;
                }
            }
        }

        this.stixService.getData().subscribe((data) => {
            if (data.type === 'add-component' || (data.type === 'add-gr-component' && this.guidedService.isGuidedReport)) {
                this.addComponent(data);
            }
        });

        // Set Labels
        if (this.stixService.isEditing) {
            const currObjId = this.questions.find((q) => q.key === 'id').value;
            const labels = this.stixService.bundle.objects.find((obj) => obj.id === currObjId)?.labels;
            if (labels) this.stixService.stringArrays.set('labels', labels);
        }

        //If Identity and user-acs is defined, apply acs to this identity; Only when adding new Identity object
        if (!this.stixService.isEditing) {
            let userAcs: any = localStorage.getItem('user-acs');
            let acsTypes: any = localStorage.getItem('acs-type');
            if (userAcs && acsTypes && this.form.value.type === 'identity') {
                userAcs = JSON.parse(userAcs);
                acsTypes = JSON.parse(acsTypes);
                const markingRefs = [userAcs.id];
                if (acsTypes[userAcs.id]) {
                    const name = acsTypes[userAcs.id];

                    if (name.endsWith('(TLP:GREEN)')) {
                        const tlp = TLP20_OPTIONS.find((elem) => elem.name === 'TLP:GREEN');
                        markingRefs.push(tlp.id);
                    } else if (name.endsWith('(TLP:AMBER)')) {
                        const tlp = TLP20_OPTIONS.find((elem) => elem.name === 'TLP:AMBER');
                        markingRefs.push(tlp.id);
                    } else if (name.endsWith('(TLP:CLEAR)')) {
                        const tlp = TLP20_OPTIONS.find((elem) => elem.name === 'TLP:CLEAR');
                        markingRefs.push(tlp.id);
                    }
                }

                this.setObjectMarkingReferences(markingRefs);
            }
        }

        this.originalData = this.form.getRawValue();
        this.origObjectMarkingRefs = JSON.stringify(this.stixService.objectMarkingReferences);
        this.origGranularMarkings = JSON.stringify(this.stixService.granularMarkings);
        this.origExternalRefs = JSON.stringify(this.stixService.externalReferences);
        this.origExtensions = JSON.stringify(this.stixService.extensions);
        this.origLabels = JSON.stringify(this.stixService.stringArrays.get('labels'));
        if (!this.origLabels) this.origLabels = JSON.stringify([]);
        this.origResolvesToRefs = JSON.stringify(this.stixService.stringArrays.get('resolves_to_refs'));
        this.origHashes = JSON.stringify(this.stixService.stringArrays.get('hashes'));
        this.origContent = JSON.stringify(this.stixService.contents);
        this.origExtTypes = JSON.stringify(this.stixService.stringArrays.get('extension_types'));
        this.origArrays = JSON.stringify(this.convertMapToObj(this.stixService.stringArrays));
        this.origIncidentCoreExtension = JSON.stringify(this.stixService.currentIncidentCoreExtension);
        this.origTopLevelProps = JSON.stringify(this.stixService.toplevel);
        this.origTimezones = JSON.stringify(this.stixService.timezones);
        this.origMalwareCorpus = JSON.stringify(this.stixService.currentMalwareCorpus);

        if (this.stixService.notes.size === 0) {
            this.stixService.bundle.objects.forEach((elem) => {
                if (elem.type == 'note' && elem.object_refs && elem.object_refs.includes(this.form.value.id))
                    this.stixService.notes.set(elem.id, JSON.parse(JSON.stringify(elem)));
            });
        }

        this.notes = JSON.stringify(Array.from(this.stixService.notes));
        this.new_notes = JSON.stringify(Array.from(this.stixService.new_notes));
        this.stixService.getIceStatus().subscribe((status) => {
            this.isIceValid = status;
        });
        this.stixService.getMBEStatus().subscribe((status) => {
            this.isMBEValid = status;
        });

        this.checkDuplicatesCallback();
    }

    ngAfterViewChecked() {
        this.isAddEnabled();
    }

    ifLabels() {
        switch (this.question_type) {
            case 'attack-pattern':
            case 'identity':
            case 'intrusion-set':
            case 'note':
            case 'threat-actor':
            case 'campaign':
            case 'incident':
            case 'location':
            case 'observed-data':
            case 'tool':
            case 'indicator':
            case 'malware':
            case 'opinion':
            case 'vulnerability':
            case 'grouping':
            case 'infrastructure':
            case 'malware-analysis':
            case 'report':
            case 'relationship':
            case 'sighting':
            case 'language-content':
            case 'extension-definition':
                return true;
            default:
                return false;
        }
    }

    saveFavorite(objectSelection) {
        let properties = [];
        this.questions.forEach((q) => {
            if (q.favorite) {
                properties.push(q.key);
            }
        });

        let favorites = [];
        let localFavorites: any = localStorage.getItem('favorite-attributes');
        if (localFavorites) {
            localFavorites = JSON.parse(localFavorites);
            let typeFound = localFavorites.find((lf) => lf.type === objectSelection.type);
            if (typeFound) {
                typeFound.properties = properties;
                favorites = localFavorites;
            } else {
                favorites = localFavorites;
                favorites.push({
                    type: objectSelection.type,
                    properties: properties,
                });
            }

            favorites = favorites.filter((f) => f.properties.length > 0);
        } else {
            favorites.push({
                type: objectSelection.type,
                properties: properties,
            });
        }

        if (favorites.length > 0) {
            localStorage.setItem('favorite-attributes', JSON.stringify(favorites)); // Save in cache
        } else {
            localStorage.removeItem('favorite-attributes');
        }
    }

    addObject(modal, data = null) {
        this.envService.checkAuth(window.location.pathname);
        if (this.revoked) {
            this.modalService.open(modal);
        } else {
            this.addComponent(data);
        }
    }

    async addComponent(data = null) {
        await this.envService.checkAuth(this.router.url);

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
        const tempList: string[] = SCO_LIST;
        if (tempList.indexOf(this.stixService.currentType) != -1) await this.stixService.removeComponent(this.stixService.currentID); // Derek - double check why this is called

        this.stixService.newObject = false;
        this.stixService.added = true;

        let formObj = this.form.getRawValue();
        if (this.stixService.guidedUI && this.guidedService.isGuidedReport) {
            this.updateComponentForGuidedReport(formObj, data);
        }

        this.componentData.emit(formObj);
    }

    updateComponentForGuidedReport(formObj, data) {
        if (!data || !data.value || !data.objectSelection) return;

        if (formObj.type === 'report' && data.objectSelection.routeName === 'report') {
            formObj.name = data.value['gr_name'];
            formObj.report_types = [];
            formObj.report_types.push(data.value['gr_report_types']);
            formObj.published = data.value['gr_published'];
            formObj.description = data.value['gr_description'];
            formObj.type = 'report';

            return;
        }

        if (formObj.type === data.objectSelection.routeName) {
            const keys = Object.keys(data.value);
            keys.forEach((k) => {
                if (!k.includes('gr_') && data.value[k] != null && data.value[k].length > 0) {
                    formObj[k] = data.value[k];
                }
            });
        }
    }

    addButton() {
        // Check whether Modified Date is equal or after to Created Date
        let createdDateTime = Date.parse('this.currentComponentData.created');

        let modifiedDateTime = Date.parse('this.currentComponentData.modifed');

        if (modifiedDateTime > createdDateTime) {
            console.info('The modified date is after the created date.');
        }
    }

    getStringArray(key: string): any {
        for (let i = 0; i < STRING_ARRAY_VALIDATORS.length; i++) {
            if (key === STRING_ARRAY_VALIDATORS[i].key) return STRING_ARRAY_VALIDATORS[i];
        }
    }

    isAddEnabled(): boolean {
        if (this.questions.length === 0) {
            return (this.addEnabled = false);
        }

        const missingAttributes = localStorage.getItem('missing-attributes');
        const questionSpec = this.questions.find((q) => q.key === 'spec_version');
        if (missingAttributes && questionSpec && missingAttributes.includes('spec_version') && questionSpec.value.length > 0) {
            this.addEnabled = true;
            return true;
        }

        const dataValue = this.form.getRawValue();
        this.stixService.granularMarkingSelectors = [];
        let mylen = undefined;
        if (this.stixService.objectMarkingReferences.length > 0) {
            this.stixService.granularMarkingSelectors.push('object_marking_refs');
            mylen = this.stixService.objectMarkingReferences.length;
            for (let q = 0; q < mylen; q++) {
                this.stixService.granularMarkingSelectors.push('object_marking_refs' + '.[' + q.toString() + ']');
            }
        }

        if ((this.stixService.stringArrays.get('labels') || []).length > 0) {
            this.stixService.granularMarkingSelectors.push('labels');
            mylen = this.stixService.stringArrays.get('labels').length;
            for (let j = 0; j < mylen; j++) {
                this.stixService.granularMarkingSelectors.push('labels' + '.[' + j.toString() + ']');
            }
        }

        for (let i = 0; i < this.questions!.length; i++) {
            const q = this.questions![i];
            let key = q.key;
            if (
                q instanceof StringArrayQuestion ||
                q instanceof HashArrayQuestion ||
                q instanceof OpenVocabArrayQuestion ||
                q instanceof ReferenceArrayQuestion ||
                q instanceof SCORefsQuestion ||
                q instanceof SCOReferenceArrayQuestion ||
                q instanceof RefArrayQuestion ||
                q instanceof ProtocolArrayQuestion ||
                q instanceof StringDictQuestion
            ) {
                if ((this.stixService.stringArrays.get(q.key) || []).length > 0) {
                    this.stixService.granularMarkingSelectors.push(q.key);

                    mylen = this.stixService.stringArrays.get(q.key).length;
                    for (let j = 0; j < mylen; j++) {
                        this.stixService.granularMarkingSelectors.push(q.key + '.[' + j.toString() + ']');
                    }
                }
            } else if (q instanceof KillChainQuestion || q instanceof PhaseNameQuestion) {
                if (this.stixService.stringArrays.get('killChain')) {
                    this.stixService.granularMarkingSelectors.push(q.key);
                }
            } else if (dataValue[q.key]) {
                this.stixService.granularMarkingSelectors.push(q.key);
            }
        }

        if ((this.stixService.externalReferences || []).length > 0) {
            this.stixService.granularMarkingSelectors.push(`external_references`);
        }

        for (let i = 0; i < this.stixService.externalReferences.length; i++) {
            try {
                let currentSelectors = this.stixService.externalReferences[i].getGranularMarkingSelectors();
                let arraySelectors: any[] = [];
                for (let j = 0; j < currentSelectors.length; j++) {
                    arraySelectors.push(`external_references.[${i}].${currentSelectors[j]}`);
                }

                this.stixService.granularMarkingSelectors = this.stixService.granularMarkingSelectors.concat(arraySelectors);
            } catch (e) {}
        }

        for (let j = 0; j < this.stixService.extensions.length; j++) {
            let head = 'extensions.[' + j.toString() + ']';
            let currExtension = this.stixService.extensions[j];

            for (const extensionId in currExtension) {
                if (extensionId.startsWith('extension-definition--') && currExtension[extensionId].extension_type == 'property-extension') {
                    this.stixService.granularMarkingSelectors.push(head + '.' + currExtension[extensionId]);
                }
            }
        }

        let omr = this.stixService.stringArrays.get('object_marking_refs') || [];
        for (let i = 0; i < omr.length; i++) {
            let currentSelectors = omr[i];
            let arraySelectors: any[] = [];
            for (let j = 0; j < currentSelectors.length; j++) {
                arraySelectors.push(currentSelectors[j]);
            }
            this.stixService.granularMarkingSelectors = this.stixService.granularMarkingSelectors.concat(arraySelectors);
        }

        for (let i = 0; i < this.stixService.contents.length; i++) {
            let currentSelectors = this.stixService.contents[i].getGranularMarkingSelectors();
            let arraySelectors: any[] = [];
            for (let j = 0; j < currentSelectors.length; j++) {
                arraySelectors.push(`contents.[${i}].${currentSelectors[j]}`);
            }
            this.stixService.granularMarkingSelectors = this.stixService.granularMarkingSelectors.concat(arraySelectors);
        }

        if (this.stixService.modalObjectArray.length > 0 && this.stixService.currentType != 'extension-definition') {
            let label = '';
            switch (this.stixService.currentType) {
                case 'email-message':
                    label = 'body_multipart';
                    break;
                case 'windows-registry-key':
                    label = 'values';
                    break;
                case 'language-content':
                    label = 'contents';
                    break;
            }

            if (label != '') {
                this.stixService.granularMarkingSelectors.push(label);

                for (let j = 0; j < this.stixService.modalObjectArray.length; j++) {
                    let head = label + '.[' + j.toString() + ']';
                    for (let k in this.stixService.modalObjectArray[j]) {
                        this.stixService.granularMarkingSelectors.push(head + '.' + k);
                    }
                }
            } else {
                console.error('ERROR: Unsupported Modal Question for Granular Markings');
            }
        }

        // ---    END OF GRANULAR MARKING SELECTORS   ---

        let valid = this.isFormValid && this.isFormValid(this.questions, this.form.getRawValue());

        let i = 0;
        while (this.questions![i].key != 'type') i++;
        this.stixService.currentType = this.questions![i].value;

        let c = 0;
        while (this.questions![c].key != 'id') c++;
        this.stixService.currentID = this.questions![c].value;
        if (this.stixService.currentID.includes('extension-definition--')) this.stixService.parentExtensionID = this.stixService.currentID;

        let type: string = this.questions![i].value;
        if (type == 'grouping' || type == 'note' || type == 'opinion' || type == 'report' || type == 'observed-data') {
            if ((this.stixService.stringArrays.get('object_refs') || []).length == 0) return (this.addEnabled = false); //If Object Refs has no values
        } else if (type == 'extension-definition') {
            if ((this.stixService.stringArrays.get('extension_types') || []).length == 0 && this.stixService.modalObjectArray.length == 0) {
                return (this.addEnabled = false); //If Extension Types has no values
            }
            if (
                (this.stixService.stringArrays.get('extension_properties') || []).length == 0 &&
                this.stixService.stringArrays.get('extension_types') &&
                this.stixService.stringArrays.get('extension_types')!.indexOf('toplevel-property-extension') != -1
            ) {
                this.errorMessage = "An Extension Property is required when Extension Types includes 'toplevel-property-extension'";
                return (this.addEnabled = false);
            } else this.errorMessage = '';
        } else if (type == 'malware-analysis') {
            let j = 0;
            while (this.questions![j].key != 'product') j++;
            const product = this.questions![j].relString || '';
            const regex = new RegExp(/^[a-z-]*$/);
            if (!product.match(regex)) this.errorMessage = '';
            else this.errorMessage = ''; // See if all these assignments can be moved outside the if-else
        } else if (type == 'network-traffic') {
            if ((this.stixService.stringArrays.get('protocols') || []).length == 0) return (this.addEnabled = false); //If Protocols has no values
        } else if (type == 'email-message') {
            let j = 0;
            while (this.questions![j].key != 'is_multipart') j++;
            const is_multipart = this.questions![j].relString[0] || '';
            if (is_multipart == 'false') {
                if ((this.stixService.stringArrays.get('body_multipart') || []).length != 0) {
                    this.errorMessage = 'Body Multipart is required when Is Multipart is true';
                    return (this.addEnabled = false);
                }
            } else if (is_multipart == 'true') {
                if ((this.stixService.stringArrays.get('body_multipart') || []).length == 0) {
                    this.errorMessage = 'Body Multipart must be empty when Is Multipart is true';
                    return (this.addEnabled = false);
                }
            }
            this.errorMessage = '';
        } else if (type == 'windows-registry-key') {
            if (this.stixService.modalObjectArray.length < 1) {
                //If values is empty, check if another field exists
                let found = false;
                for (let j in this.questions!) {
                    if (this.questions![j].relString != '') {
                        //Defanged does not have a relString, so this works as intended
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return (this.addEnabled = false);
                } else this.errorMessage = '';
            } else this.errorMessage = '';
        } else if (type == 'user-account') {
            let found = false;
            for (let j in this.questions) {
                if (this.questions[j].relString != '') {
                    //Defanged does not have a relString, so this works as intended
                    found = true;
                    break;
                }
            }
            if (!found) {
                return (this.addEnabled = false);
            } else {
                this.errorMessage = '';
                return (this.addEnabled = true);
            }
        } else if (type == 'process') {
            if (
                (this.stixService.stringArrays.get('opened_connection_refs') || []).length < 1 &&
                (this.stixService.stringArrays.get('child_refs') || []).length < 1 &&
                (this.stixService.stringArrays.get('environment_variables') || []).length < 1 &&
                this.stixService.extensions.length < 1
            ) {
                //If values is empty, check if another field exists

                let found = false;

                for (let j in this.questions!) {
                    if (this.questions![j].target != '' && this.questions![j].target != null) {
                        //Defanged does not have a relString, so this works as intended
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return (this.addEnabled = false);
                } else this.errorMessage = '';
            } else this.errorMessage = '';
        } else if (type == 'x509-certificate') {
            if ((this.stixService.stringArrays.get('hashes') || []).length < 1) {
                //If values is empty, check if another field exists

                let found = false;

                for (let j in this.questions!) {
                    if (this.questions![j].target != '' && this.questions![j].target != null) {
                        //Defanged does not have a relString, so this works as intended
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return (this.addEnabled = false);
                } else this.errorMessage = '';
            } else {
                this.errorMessage = '';
            }
        } else if (type == 'language-content') {
            if (this.stixService.contents?.length == 0) return (this.addEnabled = false);
        }

        const data = {
            type: 'is-add-enabled',
            value: valid,
        };
        this.stixService.sendData(data);

        return (this.addEnabled = valid);
    }

    setObjectMarkingReferences(newObjectMarkingReferences: string[]): void {
        this.stixService.objectMarkingReferences = newObjectMarkingReferences;
    }

    setLabels(newlabels: string[]): void {
        this.stixService.stringArrays.set('labels', newlabels);
    }

    closeWindow() {
        window.open('', '_self').close();
    }

    showObjectMarkingReference() {
        if (
            ((this.stixService.guidedUI && this.objectPropertyTypeSelectionInput === 'required') || !this.stixService.guidedUI) &&
            (this.hasObjectMarkingReferences || this.ifLabels())
        ) {
            return true;
        } else {
            return false;
        }
    }

    questionWrapperClass(question = null, bottomSection = false) {
        if (this.stixService.guidedUI) {
            if (
                (this.objectPropertyTypeSelectionInput === 'required' &&
                    question &&
                    (question.required || question.favorite) &&
                    !question.readonly) ||
                (this.objectPropertyTypeSelectionInput === 'read-only' && question && question.readonly) ||
                (this.objectPropertyTypeSelectionInput === 'common' &&
                    ((question && !question.readonly && !question.required && !question.favorite) || !question))
            ) {
                if (question) {
                    return '';
                } else {
                    return 'guided-wrapper';
                }
            } else {
                return 'move-out-of-view';
            }
        } else {
            if (bottomSection) {
                return this.bottomColumnProperties;
            } else {
                if (this.stixService.guidedUI) {
                    return question.columnProperties;
                } else {
                    if (!this.stixService.newObject && question.revokedCol) {
                        return question.revokedCol + ' ' + question.columnOffset;
                    }
                    return question.nonGuidedCol + ' ' + question.columnOffset;
                }
            }
        }
    }

    cancel() {
        this.envService.checkAuth(window.location.pathname);
        this.router.navigate(['/bundle']);
    }

    showFavIconType(question) {
        if (!question.required && !question.favorite) {
            return 'plus';
        }

        if (!question.required && question.favorite) {
            return 'minus';
        }

        return false;
    }

    updateFav(question) {
        const data = {
            type: 'toggle-favorite',
            value: question,
        };
        this.stixService.sendData(data);

        question.favorite = !question.favorite;

        this.saveFavorite(this.objectSelectionInput);

        // Emit event to AddComponent rather than using service because this is only 1 level up
        this.guidedUIEvent.emit({ type: 'update-primary-properties' });
    }

    convertMapToObj(m: any) {
        return Array.from(m).reduce((obj, [key, value]) => {
            if (value && value.length > 0) obj[key] = value;
            return obj;
        }, {});
    }

    // Scan the form for data changes and enable [ Add to Bundle ] button if changes detected
    isFormDataChanged(): boolean {
        for (let question of this.questions) {
            if (question.key === 'phase_name') {
                let currentKillChain = this.stixService.stringArrays.get('killChain');

                if (currentKillChain && this.prevKillChain && currentKillChain.length === this.prevKillChain.length) {
                    for (let i in currentKillChain) {
                        if (!this.prevKillChain[i] || currentKillChain[i] !== this.prevKillChain[i]) {
                            this.formDataChanged = true;
                            return true;
                        }
                    }
                } else if (currentKillChain) {
                    this.formDataChanged = true;
                    return true;
                }
            }

            const missingAttributes = localStorage.getItem('missing-attributes');
            if (question.key === 'spec_version' && missingAttributes && missingAttributes.includes('spec_version') && question.value.length > 0) {
                this.formDataChanged = true;
                return true;
            }
        }

        this.currObjectMarkingRefs = JSON.stringify(this.stixService.objectMarkingReferences);
        this.currGranularMarkings = JSON.stringify(this.stixService.granularMarkings);
        this.currExternalRefs = JSON.stringify(this.stixService.externalReferences);
        this.currExtensions = JSON.stringify(this.stixService.extensions);
        this.currLabels = JSON.stringify(this.stixService.stringArrays.get('labels'));
        if (!this.currLabels) this.currLabels = JSON.stringify([]);
        this.currResolvesToRefs = JSON.stringify(this.stixService.stringArrays.get('resolves_to_refs'));
        this.currHashes = JSON.stringify(this.stixService.stringArrays.get('hashes'));
        this.currContent = JSON.stringify(this.stixService.contents);
        this.currExtTypes = JSON.stringify(this.stixService.stringArrays.get('extension_types'));
        this.currArrays = JSON.stringify(this.convertMapToObj(this.stixService.stringArrays));

        const currNotes = JSON.stringify(Array.from(this.stixService.notes));
        const currNewNotes = JSON.stringify(Array.from(this.stixService.new_notes));
        this.currIncidentCoreExtension = JSON.stringify(this.stixService.currentIncidentCoreExtension);
        this.currTopLevelProps = JSON.stringify(this.stixService.toplevel);
        this.currTimezones = JSON.stringify(this.stixService.timezones);
        this.currMalwareCorpus = JSON.stringify(this.stixService.currentMalwareCorpus);

        if (
            this.currObjectMarkingRefs !== this.origObjectMarkingRefs ||
            this.currGranularMarkings !== this.origGranularMarkings ||
            this.currExternalRefs !== this.origExternalRefs ||
            this.currExtensions !== this.origExtensions ||
            this.currLabels !== this.origLabels ||
            this.currResolvesToRefs !== this.origResolvesToRefs ||
            this.currHashes !== this.origHashes ||
            this.currContent !== this.origContent ||
            this.currExtTypes !== this.origExtTypes ||
            this.currArrays !== this.origArrays ||
            this.currIncidentCoreExtension !== this.origIncidentCoreExtension ||
            this.currMalwareCorpus !== this.origMalwareCorpus ||
            currNotes !== this.notes ||
            currNewNotes !== this.new_notes ||
            this.currTopLevelProps !== this.origTopLevelProps ||
            this.currTimezones !== this.origTimezones
        ) {
            this.formDataChanged = true;
            return true;
        }

        const orig = this.originalData;
        const curr = this.form.getRawValue();

        const origKeys = Object.keys(orig);
        const currKeys = Object.keys(curr);

        if (origKeys.length !== currKeys.length) {
            this.formDataChanged = true;
            return true;
        }

        for (const key of origKeys) {
            const origVal = orig[key];
            const currVal = curr[key];

            if (Array.isArray(origVal) && origVal.length === 0 && currVal === '') {
                continue;
            }

            if (origVal === '' && currVal === undefined) {
                continue;
            }

            if (origVal !== currVal) {
                this.formDataChanged = true;
                return true;
            }
        }

        this.formDataChanged = false;
        return false;
    }

    checkDuplicatesCallback() {
        this.checkDuplicates$.next();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    parseProp(prop: any): string {
        return typeof prop == 'object' ? JSON.stringify(prop) : prop;
    }

    isObject(prop: any): boolean {
        return typeof prop == 'object';
    }

    search(backwards?: boolean): void {
        if (this.toplevelSearch === '') return;

        if (this.toplevelPrev === this.toplevelSearch) {
            backwards ? this.toplevelIndex-- : this.toplevelIndex++;
        } else {
            this.toplevelPrev = this.toplevelSearch;
            this.toplevelIndex = 0;
            this.toplevelResults = '';
            this.toplevelMatches = [];
            let lowerSearch = this.toplevelSearch.toLowerCase();

            let props = this.stixService.toplevel;
            for (let prop of props) {
                if (prop[0].toLowerCase().includes(lowerSearch) || JSON.stringify(prop[1]).includes(lowerSearch)) {
                    this.toplevelMatches.push(prop[0]);
                }
            }
        }

        if (this.toplevelIndex < 0) this.toplevelIndex = this.toplevelMatches.length - 1;
        else if (this.toplevelIndex >= this.toplevelMatches.length) this.toplevelIndex = 0;

        this.toplevelResults = `${this.toplevelIndex + 1} of ${this.toplevelMatches.length}`;

        let el = document.getElementById(this.toplevelMatches[this.toplevelIndex][0]);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    get isDuplicated(): boolean {
        return this.stixService.duplicates?.length > 0;
    }

    get duplicateCount(): number {
        return this.stixService.duplicates?.[0]?.duplicated?.length || 0;
    }

    onViewDuplicates(event: Event): void {
        this.viewDuplicatesEvent.emit({ event, component: this.currentComponent });
    }

    scrollTo(row: string) {
        const htmlElement = document.getElementById(row + 'Row');
        const position = htmlElement.getBoundingClientRect().top;
        if (position > 84 && position < window.screen.height - 43 - 63 - 64 - 35) return;

        htmlElement.scrollIntoView();
        if (position < 84) {
            window.scrollBy({ top: position - 85 });
        }
    }

    callEditObject(data) {
        this.editObject.emit(data);
    }

    callRevokeObject(data) {
        this.revokeObject.emit(data);
    }

    callSetMain(data) {
        this.setMainIdentity.emit(data);
    }

    callRemoveObject(data) {
        this.removeObject.emit(data);
    }

    callAddCisa(data) {
        this.addCISAIdentity.emit(data);
    }

    isIdentity() {
        return this.form.value.id && this.form.value.id.toLowerCase().startsWith('identity') ? true : false;
    }
}

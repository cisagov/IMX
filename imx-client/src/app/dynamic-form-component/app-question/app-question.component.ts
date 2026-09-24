import {
    Component,
    OnInit,
    OnDestroy,
    Input,
    ViewEncapsulation,
    SimpleChanges,
    ChangeDetectorRef,
    Output,
    EventEmitter,
    ViewChild,
    ElementRef,
} from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { faInfoCircle, faTrash, faEdit, faArrowDown, faPlus, faUpload, faSearch } from '@fortawesome/free-solid-svg-icons';
import { STIX_OBJECTS } from 'src/app/models/stix-objects';
import { StixService } from 'src/app/stix-service.service';
import { GuidedService } from 'src/app/guided.service';
import { QuestionBase } from '../question-base';
import { ComparisonExpression } from './pattern-builder/comparison-expression';
import { ObservationExpression } from './pattern-builder/observation-expression';
import { StixExpression } from './pattern-builder/stix-expression';
import { StixPattern } from './pattern-builder/stix-pattern';
import { SCO_LIST } from '../../models/sco_list';
import { Bundle } from '../../models/bundle';
import { Content } from 'src/app/models/content';
import { COMPONENT_MAP } from 'src/app/models/component-map';
import { LANGUAGES } from 'src/app/models/languages';
import { TLP_OPTIONS } from '../../tlpMarkingDef';
import { HashArrayQuestion } from '../question-types/question-hash-array';
import { FormModel } from '../form-model';
import { HybridArrayQuestion } from '../question-types/question-hybrid-array';
import { OpenVocabArrayQuestion } from '../question-types/question-ov-array';
import { ProtocolArrayQuestion } from '../question-types/question-protocol-array';
import { ReferenceArrayQuestion } from '../question-types/question-reference-array';
import { StringArrayQuestion } from '../question-types/question-string-array';
import { MIME } from 'src/app/models/mime';
import { v4 as uuid } from 'uuid';
import { ContentsDialogComponent } from 'src/app/dialogs/contents-dialog/contents-dialog.component';
import { ObjectQuestion } from '../../dynamic-form-component/question-types/question-object';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import tooltipHelper from './tooltipHelper/tooltipHelper';
import { TooltipStringArrayQuestion } from '../question-types/question-tooltip-string-array';
import { RefArrayQuestion } from '../question-types/question-ref-array';
import { StringDictQuestion } from '../question-types/question-string-dict';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvService } from 'src/app/env-service/env.service';
import { RefQuestion } from '../question-types/question-ref';
import { HybridQuestion } from '../question-types/question-hybrid';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { faArrowRight, faBan, faArrowLeft, faSave, faUndo, faPlusCircle, faTools } from '@fortawesome/free-solid-svg-icons';
import { PatternBuilderComponent } from 'src/app/dialogs/pattern-builder/pattern-builder.component';
import { MultipartDialogComponent } from 'src/app/dialogs/multipart-dialog/multipart-dialog.component';
import { IdentityExtensionDialogComponent } from 'src/app/dialogs/identity-extension-dialog/identity-extension-dialog.component';
import { WindowsValueDialogComponent } from 'src/app/dialogs/windows-value-dialog/windows-value-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import * as moment_tz from 'moment-timezone';
import { DeciderServiceService } from 'src/app/decider-service/decider-service.service';
import { MimeQuestion } from '../question-types/question-mime';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { KillChainQuestion } from '../question-types/question-kill-chain';
import { PhaseNameQuestion } from '../question-types/question-phase-name';
import { SCOReferenceArrayQuestion } from '../question-types/question-sco-reference-array';
import { SCORefsQuestion } from '../question-types/question-sco-refs';
import { BundleObjectsQuestion } from '../question-types/question-bundle-obj';
import { RelationshipQuestion } from '../question-types/question-rel-type';
import { SightingQuestion } from '../question-types/question-sighting';
import { NonBlankDropdownQuestion } from '../question-types/question-non-blank-dropdown';
import { EmailQuestion } from '../question-types/question-email-address';
import { SocialQuestion } from '../question-types/question-social-media';
import { PhoneQuestion } from '../question-types/question-phone-number';
import extension_schemas from '../../schemas/common/extension-definitions/extension-definitions.json';

@Component({
    selector: 'app-question',
    templateUrl: './app-question.component.html',
    styleUrls: ['./app-question.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: false,
})
export class DynamicFormQuestionComponent implements OnInit, OnDestroy {
    @Input() question!: QuestionBase<any>;
    @Input() form!: UntypedFormGroup;
    @Input() componentMap: Map<String, Object>;
    @Input() displayName: string;
    @Output('isAddEnabled') isAddEnabled: EventEmitter<any> = new EventEmitter();
    @Output() checkDuplicates = new EventEmitter<any>();
    @ViewChild('patternUploader') patternUploader!: ElementRef;

    nrSelect = false;

    // CONSTANTS
    COMPARISON_OPERATORS = ['=', '!=', '>', '<', '<=', '>=', 'IN', 'LIKE', 'MATCHES'];
    OBSERVATION_EXPRESSION_QUALIFIERS = ['', 'WITHIN', 'REPEATS', 'START'];
    COMPARISON_EXPRESSION_OPERATORS = ['AND', 'OR'];
    OBSERVATION_EXPRESSION_OPERATORS = ['AND', 'OR', 'FOLLOWEDBY'];
    // FONT AWESOME ICONS
    faArrowDown = faArrowDown;
    faTrash = faTrash;
    faPlus = faPlus;
    faUpload = faUpload;
    faSearch = faSearch;
    faEdit = faEdit;
    faSave = faSave;
    faBan = faBan;
    faArrowLeft = faArrowLeft;
    faArrowRight = faArrowRight;
    faUndo = faUndo;
    faPlusCircle = faPlusCircle;
    faDecider = faTools;

    comparisonConstant: any = null;
    comparisonExpressions: ComparisonExpression[] = [];
    currObjectPath = null;
    currPropertyName: string = null;
    newString: string = '';
    newString2: string = '';
    newString3: string = '';
    listSearch: string = '';
    listFilter: string = '';
    private listSearch$ = new Subject<string>();
    readonly listSearchThreshold = 15;
    private refLabelCache = new Map<string, string>();
    private refLabelCacheSize = -1;
    relString: string = '';
    objectPaths = STIX_OBJECTS[1]['objects'];
    observationExpressionBuilder: ObservationExpression = null;
    observationExpressions: ObservationExpression[] = [];
    patternExpressions: ObservationExpression[] = [];
    page = 1;
    pageSize = 4;
    selectedComparisonOperator = '=';
    selectedObservationOperator = 'AND';
    selectedStixPatternBuilder: StixPattern = null;
    validationMessage: string = '';
    new_version: boolean;
    object_type: string;
    currentModalObject = new Map();
    editedModalObject: any;
    modalProps = new Map();
    modalError = new Map();
    customObjType = '';
    languages = LANGUAGES;
    objReadonly = false; // Deprecated
    ids: any[] = [];
    customProp: any = new Map();
    customStringPropKeys: string[] = [];
    customArrPropKeys: string[] = [];
    dataOptions: string[] = [
        'REG_NONE',
        'REG_SZ',
        'REG_EXPAND_SZ',
        'REG_BINARY',
        'REG_DWORD',
        'REG_DWORD_BIG_ENDIAN',
        'REG_DWORD_LITTLE_ENDIAN',
        'REG_LINK',
        'REG_MULTI_SZ',
        ' REG_RESOURCE_LIST',
        'REG_FULL_RESOURCE_DESCRIPTION',
        'REG_RESOURCE_REQUIREMENTS_LIST',
        'REG_QWORD',
        'REG_INVALID_TYPE',
    ];
    // extension_schemas = extension_schemas;
    digitalNumberOptions = extension_schemas['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498'].definitions['digital-number-ov'].enum;
    contactNumberOptions = extension_schemas['extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498'].definitions['contact-number-ov'].enum;
    timeZoneOptions: any[] = [];
    moment = moment;
    moment_tz = moment_tz;

    isTypeReadOnly: boolean = true;
    isSpecVersionReadOnly: boolean = true;
    isIDReadOnly: boolean = true;
    SCO_LIST = SCO_LIST;
    TLP_OPTIONS = TLP_OPTIONS;
    MIME = MIME;
    malwareAnalysisRegex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
    objectRegex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
    hashError = '';
    dictError = '';
    revocation: boolean = false;
    description = '';
    modalRef: any;
    faInfoCircle = faInfoCircle;
    showInfoIcon = false;
    mockNames = [];
    bundle: Bundle;
    scoBundleObjects = [];
    scoBundleObjectSelected = null;
    tooltip: string;
    propertyNames: string[] = [];
    filteredBundleObj = [];
    loadedFile: File;
    loadedFileName = '';
    schema: any;
    message = '';
    modalEnabled = false;
    payload_bin_encoded: string | null = null;
    isProcessingFile: boolean = false;

    defaultStringArr: any[];
    filteredStringArr: any[];

    private ngUnsubscribe = new Subject<void>();

    constructor(
        private http: HttpClient,
        public modalService: NgbModal,
        public stixService: StixService,
        private guidedService: GuidedService,
        private activatedRoute: ActivatedRoute,
        public dynamicForm: DynamicFormComponent,
        public patternBuilderDialog: MatDialog,
        public multipartDialog: MatDialog,
        public identityDialog: MatDialog,
        public windowsValueDialog: MatDialog,
        private decider: DeciderServiceService,
        private envService: EnvService,
        public matAutocomplete: MatAutocompleteModule
    ) {}

    ngOnChanges(change: SimpleChanges): void {
        if (this.stixService.guidedUI) {
            if (this.question.key === 'source_ref' || this.question.key === 'target_ref') {
                this.question.relString = this.question.value;
            }

            if (this.question.key === 'relationship_type' && this.question.arrOptions.length === 0) {
                this.question.arrOptions = this.stixService.relationshipArrOptions;
            }

            if (this.question.key === 'sighting_of_ref') {
                this.question.relString = this.question.value;
            }
        }

        const missingAttributes = localStorage.getItem('missing-attributes');
        if (this.question.key === 'spec_version' && missingAttributes?.includes('spec_version')) {
            this.isSpecVersionReadOnly = false;
            this.question.value = '';
            localStorage.removeItem('missing-attributes');
            this.isAddEnabled.emit();
        }
    }

    ngOnInit(): void {
        this.listSearch$.pipe(debounceTime(500), takeUntil(this.ngUnsubscribe)).subscribe((term) => (this.listFilter = term));

        this.object_type = this.form.value.type;

        const missingAttributes = localStorage.getItem('missing-attributes');
        if (this.question.key === 'spec_version' && missingAttributes?.includes('spec_version')) {
            this.isSpecVersionReadOnly = false;
            this.question.value = '';
            localStorage.removeItem('missing-attributes');
            this.isAddEnabled.emit();
        }

        if (history.state.data && history.state.data.new_version && history.state.data.new_version == true) {
            this.new_version = true;
        }

        if (this.question.autoSelectDropdown && this.question.options && this.question.options.length == 1)
            this.form.controls[this.question.key].setValue(this.question.options[0].key);

        if (this.question.key.toLowerCase() === 'confidence') {
            this.description =
                "The confidence property reflects the object creator's trust in the accuracy of their data. The confidence value MUST be a number in the range of 0-100.";
            this.showInfoIcon = true;
        }

        this.activatedRoute.queryParams.subscribe((params) => {
            this.revocation = history.state.data && history.state.data.revocation ? history.state.data.revocation : params.revocation;
        });

        this.checkLanguageContents();

        this.mockNames = [];
        this.bundle = this.stixService.bundle;

        if (this.scoBundleObjects.length === 0) {
            this.objectPaths.forEach((object) => {
                const bundleObj = this.bundle.objects.find((bundleObj) => bundleObj && bundleObj.type === object.type);
                if (bundleObj && !this.scoBundleObjects.some((x) => x.type === object.type)) {
                    let tmpBundleObj = Object.assign({}, bundleObj);
                    tmpBundleObj['displayName'] = object.displayName;
                    this.scoBundleObjects.push(tmpBundleObj);
                } else {
                    this.scoBundleObjects.push(object);
                }
            });
        }

        // For Language Content Only: Copy modified timestamp of selected Object Reference to Object Modified field
        if (this.object_type === 'language-content') {
            this.form.controls['object_ref'].valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((v) => {
                let timestamp = this.bundle.objects.find((obj) => obj.id === v)?.modified;
                this.form.controls['object_modified'].setValue(timestamp);
            });
        }

        //Populate Reference dropdown
        if (this.question instanceof MimeQuestion || this.question instanceof RefQuestion || this.question instanceof HybridQuestion) {
            if (this.question.value) this.question.relString = this.question.value;
        }

        //Populate Marking Definition, Defninition Type dropdown
        if (this.question.key.toLowerCase() === 'definition_type') {
            if (this.question.value) this.question.relString = this.question.value;
        }

        // Set the default for Is Safe to false
        if (this.question.key.toLowerCase() === 'is_safe') {
            if (!this.stixService.isEditing) {
                this.form.controls['is_safe'].setValue(['false']);
            }
        }

        // Populate Created by Ref dropdown
        if (this.question.key.toLowerCase() === 'created_by_ref') {
            let identities = this.stixService.populateCreatedByRef();
            this.question.options.push({ key: this.envService.env.defaultIdentity.id, value: this.envService.env.defaultIdentity.name });

            for (let identity of identities) {
                if (identity.id != this.envService.env.defaultIdentity.id)
                    this.question.options.push({ key: identity.id, value: identity.name ? identity.name : identity.id });
            }

            //Not new and has value
            if (this.question.value) {
                this.question.relString = this.question.value;
            } else {
                //Not New and does not have value
                if (this.stixService.isEditing) {
                    this.question.relString = '';
                } else {
                    const identity = localStorage.getItem('identity');
                    //New and Set Identity is CISA
                    if (identity === this.envService.env.defaultIdentity.id) this.question.relString = this.question.options[0].key;
                    //New and Set Identity is not CISA
                    else this.question.relString = '';
                }
            }
        }

        // Populate Email Address Ref dropdown
        if (this.question.key.toLowerCase() === 'email_address_ref') {
            let emails = this.stixService.populateEmailAddressRef();
            for (let email of emails) {
                if (!this.question.readonly) this.question.options.push({ key: email.id, value: email.value });
            }

            if (this.question.value) {
                this.question.relString = this.question.value;
            } else {
                if (this.stixService.isEditing) {
                    this.question.relString = '';
                } else {
                    // Retrieve it from the bundle
                }
            }
        }

        // Populate User Account Ref dropdown (Social Media)
        if (this.question.key.toLowerCase() === 'user_account_ref') {
            let socials = this.stixService.populateUserAccountRef();
            for (let social of socials) {
                const socialLabel = social.display_name?.trim() || social.user_id?.trim() || social.id;
                if (!this.question.readonly) this.question.options.push({ key: social.id, value: socialLabel });
            }

            if (this.question.value) {
                this.question.relString = this.question.value;
            } else {
                if (this.stixService.isEditing) {
                    this.question.relString = '';
                } else {
                    // Retrieve it from the bundle
                }
            }
        }

        // Populate Sighting of Ref dropdown
        if (this.question.key.toLowerCase() === 'sighting_of_ref') {
            let sightings = this.stixService.populateSightingOfRef();
            for (let sighting of sightings) {
                if (!this.question.readonly) this.question.options.push({ key: sighting, value: sighting });
            }
            if (this.question.options.length === 1) this.question.relString = this.question.options[0].key;
            if (this.question.value) this.question.relString = this.question.value;
        }

        this.tooltip = tooltipHelper(this.question, this.displayName, this.object_type);

        if (this.tooltip) {
            this.description = '';
        }

        if (
            this.stixService.currentType == 'email-message' &&
            (this.currentModalObject['body'] == undefined || this.currentModalObject['body'] == '') &&
            (this.currentModalObject['body_raw_ref'] == undefined || this.currentModalObject['body_raw_ref'] == '')
        )
            this.modalError.set('object', 'Either Body or Body Raw Ref is required ');

        if (this.object_type === 'marking-definition') {
            const new_version_objects = JSON.parse(localStorage.getItem('new_version_objects'));
            if (new_version_objects?.length > 0 && new_version_objects.includes(this.form.value.id)) {
                this.question.readonly = true;
            }
        }

        if (this.question instanceof KillChainQuestion) {
            this.defaultStringArr = ['lockheed-martin-cyber-kill-chain', 'mitre-attack'];
            this.filteredStringArr = ['lockheed-martin-cyber-kill-chain', 'mitre-attack'];
        } else if (
            this.question instanceof SightingQuestion ||
            this.question instanceof MimeQuestion ||
            this.question instanceof ProtocolArrayQuestion
        ) {
            this.defaultStringArr = this.question.options;
            this.filteredStringArr = this.question.options;
        } else if (this.question instanceof RelationshipQuestion) {
            this.defaultStringArr = this.question.arrOptions;
            this.filteredStringArr = this.question.arrOptions;
        } else if (this.question instanceof PhaseNameQuestion) {
            if (this.stixService.killChainType == 'lockheed-martin-cyber-kill-chain') {
                this.defaultStringArr = ['reconnaissance', 'weaponization', 'delivery', 'exploitation', 'installation', 'command-and-control'];

                this.filteredStringArr = ['reconnaissance', 'weaponization', 'delivery', 'exploitation', 'installation', 'command-and-control'];
            } else if (this.stixService.killChainType == 'mitre-attack') {
                this.defaultStringArr = [
                    'reconnaissance',
                    'resource-development',
                    'initial-access',
                    'execution',
                    'persistence',
                    'privilege-escalation',
                    'defence-evasion',
                    'credential-access',
                    'discovery',
                    'lateral-movement',
                    'collection',
                    'command-and-control',
                    'exfiltration',
                    'impact',
                ];

                this.filteredStringArr = [
                    'reconnaissance',
                    'resource-development',
                    'initial-access',
                    'execution',
                    'persistence',
                    'privilege-escalation',
                    'defence-evasion',
                    'credential-access',
                    'discovery',
                    'lateral-movement',
                    'collection',
                    'command-and-control',
                    'exfiltration',
                    'impact',
                ];
            }
        } else if (
            this.question instanceof ReferenceArrayQuestion ||
            this.question instanceof RefArrayQuestion ||
            this.question instanceof SCORefsQuestion ||
            this.question instanceof BundleObjectsQuestion ||
            this.question instanceof RefQuestion ||
            this.question instanceof SCOReferenceArrayQuestion ||
            this.question instanceof HybridQuestion ||
            this.question instanceof HybridArrayQuestion
        ) {
            if (this.question.allowedRefs && this.question.allowedRefs.length > 0)
                this.defaultStringArr = this.getBundleObjects().filter((elem) => this.question.allowedRefs.includes(elem.type));
            else this.defaultStringArr = this.getBundleObjects();

            this.filteredStringArr = this.getBundleObjects();
        }

        this.checkDuplicates.emit();
    }

    mapBundleObjToSCOObj(bundleObj) {
        const objectPath = this.objectPaths.find((obj) => obj.type === bundleObj.type);
        this.filteredBundleObj = this.bundle.objects.filter((elem) => elem.type === objectPath?.type);
        this.scoBundleObjectSelected = this.filteredBundleObj.length === 1 ? this.filteredBundleObj[0] : null;
        this.comparisonConstant = null;
        this.propertyNames = [];
        this.currPropertyName = '';
        this.updatePropertyNames(objectPath);
    }

    checkLanguageContents() {
        if (this.question.controlType === 'language-contents') {
            if (!ObjectQuestion.validatorFn(this.form.getRawValue()).valid) {
                this.question.placeholder = 'Please provide the Object Reference ID';
                this.question.readonly = true;
            } else {
                this.question.placeholder = '--> Use button on the right to create Contents -->';
                this.question.readonly = false;
            }
        }

        if (this.stixService.contents?.length === 0) this.validationMessage = 'Contents is required';

        return this.stixService.contents?.length > 0;
    }

    set observationQualifierData1(data1: string) {
        this.selectedStixPatternBuilder.setQualifierData(this.selectedStixPatternBuilder.qualifierForDropdown, data1, 1);
    }

    set observationQualifierData2(data2: string) {
        this.selectedStixPatternBuilder.setQualifierData(this.selectedStixPatternBuilder.qualifierForDropdown, data2, 2);
    }

    get isValid() {
        const currValue = this.form.getRawValue()[this.question.key];
        const objType = this.form?.value?.type;

        if (objType === 'location') {
            if (
                this.question.key === 'region' ||
                this.question.key === 'country' ||
                this.question.key === 'longitude' ||
                this.question.key === 'latitude'
            ) {
                const region = this.form.getRawValue().region;
                const country = this.form.getRawValue().country;
                const longitude = this.form.getRawValue().longitude;
                const latitude = this.form.getRawValue().latitude;

                if (!region && !country && !longitude && !latitude) {
                    this.validationMessage = 'Region, Country or Longitude and Latitude is required';
                    return false;
                }
            }
        } else if (objType === 'artifact') {
            if (this.question.key === 'url' || this.question.key === 'payload_bin') {
                const url = this.form.getRawValue().url;
                const payload_bin = this.form.getRawValue().payload_bin;

                if (!url && !payload_bin) {
                    this.validationMessage = 'URL or Payload Bin is required';
                    return false;
                }
            }
        } else if (objType === 'file') {
            if (this.question.key === 'name') {
                const name = this.form.getRawValue().name;
                const hashes = this.stixService.stringArrays.get('hashes');

                if (!name && (!hashes || hashes.length === 0)) {
                    this.validationMessage = 'Either Name or Hashes is required';
                    return false;
                }
            }
        } else if (objType === 'indicator') {
            if (this.question.key === 'pattern_type') {
                if (!this.form.value.pattern_type) {
                    this.validationMessage = 'Pattern Type is required';
                    return false;
                }

                if (this.form.value.pattern_type.length === 0 || this.form.value.pattern_type[0] === '') {
                    this.validationMessage = 'Pattern Type is required';
                    return false;
                }
            } else if (this.question.key === 'pattern') {
                if (this.form.value.pattern_type && this.form.value.pattern_type[0] !== '') this.form.get('pattern').enable();
                else this.form.get('pattern').disable();
            }
        }

        if (this.question.key === 'contents') {
            return this.checkLanguageContents();
        } else if (((currValue && currValue.length === 0) || currValue === '') && !this.question.validatorFn) {
            if (this.question.required) {
                if (this.question instanceof ProtocolArrayQuestion) {
                    if (this.stixService.stringArrays.get(this.question.key) && this.stixService.stringArrays.get(this.question.key).length > 0) {
                        return true;
                    }
                }

                if (this.question.key === 'is_multipart') {
                    this.validationMessage = 'Multipart is required';
                } else if (this.question.key === 'protocols') {
                    this.validationMessage = 'Protocol is required';
                } else {
                    this.validationMessage = this.trimLabel(this.question.label) + ' is required';
                }

                return false;
            }
            return true;
        }

        // Check Custom Validation Function
        if (this.form.dirty && this.question.validatorFn) {
            let validationObject: any = {
                ...this.form.getRawValue(),
            };

            if (this.question instanceof PhoneQuestion) {
                validationObject.phoneType = this.question.phoneType;
            } else if (this.question instanceof EmailQuestion) {
                validationObject.emailAddressType = this.question.emailAddressType;
            } else if (this.question instanceof SocialQuestion) {
                validationObject.socialMediaType = this.question.socialMediaType;
            }
            let validationResult = this.question.validatorFn(validationObject);
            if (typeof validationResult.errorMessage !== 'undefined') this.validationMessage = `${validationResult.errorMessage}`;

            if (this.question instanceof RelationshipQuestion && this.question.key === 'relationship_type' && this.question.arrOptions.length > 0) {
                this.defaultStringArr = this.question.arrOptions;
                if (!this.question.value) this.filteredStringArr = this.defaultStringArr;
                else this.filterText('relationship_type');
            }

            let valid = validationResult.valid;

            return valid;
        }

        // Basic Required Validation**
        if (this.question.required) {
            if (this.question instanceof NonBlankDropdownQuestion) {
                if (!currValue || currValue.length === 0 || currValue[0] === '') {
                    this.validationMessage = this.trimLabel(this.question.label) + ' is required';
                    return false;
                }
            }
            if (!currValue) {
                if (this.question instanceof ReferenceArrayQuestion) {
                    if (
                        !currValue &&
                        (!this.stixService.stringArrays.get(this.question.key) || this.stixService.stringArrays.get(this.question.key).length === 0)
                    ) {
                        this.validationMessage = this.trimLabel(this.question.label) + ' is required';
                        return false;
                    }

                    return true;
                }

                this.validationMessage = `${this.trimLabel(this.question.label)} is required`; //`${this.question.label} is required`;
                return false;
            }
        }

        this.validationMessage = '';

        // No Validation
        return true;
    }

    emptyDropdown() {
        const currValue = this.form.getRawValue()[this.question.key];
        if (!currValue || currValue.length === 0 || currValue[0] === '') return true;

        return false;
    }

    regexTest() {
        const objType = this.form?.value?.type;
        if (this.question.key === 'product' && objType === 'malware-analysis') {
            const regex = new RegExp(/^[a-z-]*$/);
            const product = this.form.getRawValue()[this.question.key];

            if (!product.match(regex)) return false;
        }

        return true;
    }

    arrayIsValid() {
        const objType = this.form?.value?.type;
        if (objType === 'grouping' || objType === 'note' || objType === 'observed-data' || objType === 'opinion') {
            if (this.question.key === 'object_refs') {
                if (
                    this.question.required &&
                    (!this.stixService.stringArrays.get(this.question.key) || this.stixService.stringArrays.get(this.question.key).length === 0)
                ) {
                    return false;
                }
            }
        } else if (objType === 'malware-analysis') {
            if (this.question.key === 'analysis_sco_refs') {
                const product = this.form.getRawValue().product;
                const result = this.form.getRawValue().result;

                if (!product) return true;

                if (result && result[0] !== '') return true;

                if (!this.stixService.stringArrays.get(this.question.key) || this.stixService.stringArrays.get(this.question.key).length === 0) {
                    return false;
                }
            }
        } else if (objType === 'file') {
            if (this.question.key === 'hashes') {
                const name = this.form.getRawValue().name;
                const hashes = this.stixService.stringArrays.get('hashes');

                if (!name && (!hashes || hashes.length === 0)) {
                    return false;
                }
            }
        } else if (objType === 'network-traffic') {
            if (this.question.key === 'protocols') {
                const protocols = this.stixService.stringArrays.get('protocols');
                if (!protocols || protocols.length === 0) return false;
            }
        }

        return true;
    }

    /** Add selected comparison expression to the builder view for construction */
    addComparisonExpression(): void {
        this.comparisonExpressions.push(
            new ComparisonExpression(`${this.currObjectPath.type}:${this.currPropertyName}`, this.selectedComparisonOperator, this.comparisonConstant)
        );

        this.currObjectPath = null;
        this.selectedComparisonOperator = '=';
        this.comparisonConstant = null;
    }

    /**
     * This will add the comparison expression to the array once the user has added the appropriate operators
     *
     * @param comparisonExpression constructed comparison expression
     */
    addComparisonExpressionToObservationExpression(comparisonExpression: StixExpression): void {
        if (!this.observationExpressionBuilder) this.observationExpressionBuilder = new ObservationExpression();

        this.observationExpressionBuilder.addExpression(comparisonExpression);
    }

    /**
     * Add selected observation expression to the builder view for construction
     */
    addObservationExpression(): void {
        this.observationExpressions.push(this.observationExpressionBuilder);
        this.observationExpressionBuilder = null;
    }

    /**
     * Add selected observation expression to the builder view for construction
     */
    addPatternExpression(): void {
        this.patternExpressions.push(this.observationExpressionBuilder);
        this.observationExpressionBuilder = null;
    }

    /**
     * Final step - add observation expression to the stix builder for the final qualifiers prior to completion
     *
     * @param observationExpression previously constructed observation expression
     */
    addObservationExpressionToStixPattern(observationExpression: ObservationExpression): void {
        this.selectedStixPatternBuilder = new StixPattern();
        this.selectedStixPatternBuilder.observationExpression = observationExpression;
    }

    addString(): void {
        if (this.dynamicForm.question_type === 'report' && this.question.key === 'object_refs' && this.newString === 'Add all objects') {
            const objects = this.getBundleObjects();
            const currentId = this.stixService.currentID;
            if (this.stixService.stringArrays.has(this.question.key)) {
                let newStringArray = this.stixService.stringArrays.get(this.question.key);
                for (const object of objects) {
                    if (!newStringArray.includes(object.id) && object.id !== currentId) {
                        newStringArray.push(object.id);
                    }
                }
                this.stixService.stringArrays.set(this.question.key, newStringArray);
            } else {
                this.stixService.stringArrays.set(
                    this.question.key,
                    objects.map((elem) => elem.id).filter((elem) => elem.id !== currentId)
                );
            }
        } else {
            if (this.stixService.stringArrays.has(this.question.key)) {
                let newStringArray = this.stixService.stringArrays.get(this.question.key)!;
                if (newStringArray.indexOf(this.newString) == -1) {
                    newStringArray.push(this.newString);
                    this.stixService.stringArrays.set(this.question.key, newStringArray);
                }
            } else this.stixService.stringArrays.set(this.question.key, [this.newString]);
        }

        this.newString = '';
    }

    addString3(): void {
        if (this.stixService.stringArrays.has(this.question.key)) {
            let newStringArray = this.stixService.stringArrays.get(this.question.key)!;
            newStringArray.push(this.newString3);
            this.stixService.stringArrays.set(this.question.key, newStringArray);
        } else {
            this.stixService.stringArrays.set(this.question.key, [this.newString3]);
        }

        this.newString3 = '';
    }

    isHashEnabled(): boolean {
        const MD5Regex = new RegExp('^[a-fA-F0-9]{32}$');
        const SHA1Regex = new RegExp('^[0-9a-fA-F]{5,40}$');
        const SHA256Regex = new RegExp('^[A-Fa-f0-9]{64}$');
        const SHA512Regex = new RegExp('^[a-f0-9]{128}$');
        //SHA3 Regexes are identical
        const SSDEEPRegex = new RegExp('^[0-9]+:[a-zA-Z0-9+/]{3,}:[a-zA-Z0-9+/]{3,}$');
        const TLSHRegex = new RegExp('^T1?[0-9A-Fa-f]{70}$');

        let type = this.question.relString;
        let hashValue = this.newString;
        if (hashValue == '' || type == '') {
            this.hashError = '';
            return false;
        }

        let s = type + ': ' + hashValue;
        let defined = false;
        let newStringArray;
        if (this.stixService.stringArrays.has(this.question.key)) {
            newStringArray = this.stixService.stringArrays.get(this.question.key)!;
            defined = true;
        }

        if (defined) {
            for (let currentString of newStringArray) {
                let matches = currentString.split(':');
                if (type == matches[1]) {
                    this.hashError = 'Warning: hash exists for this hash type - delete existing hash first to overwrite.';
                    return false;
                }
            }
        }

        switch (type) {
            case '':
                this.hashError = 'Please select a Hash Type';
                return false;
            case 'MD5':
                if (!MD5Regex.test(hashValue)) {
                    this.hashError = 'Hash Value must be properly formatted';
                    return false;
                }
                break;
            case 'SHA-1':
                if (!SHA1Regex.test(hashValue)) {
                    this.hashError = 'Hash Value must be properly formatted';
                    return false;
                }
                break;
            case 'SHA3-256':
            case 'SHA-256':
                if (!SHA256Regex.test(hashValue)) {
                    this.hashError = 'Hash Value must be properly formatted';
                    return false;
                }
                break;
            case 'SHA-512':
            case 'SHA3-512':
                if (!SHA512Regex.test(hashValue)) {
                    this.hashError = 'Hash Value must be properly formatted';
                    return false;
                }
                break;
            case 'SSDEEP':
                if (!SSDEEPRegex.test(hashValue)) {
                    this.hashError = 'Hash Value must be properly formatted';
                    return false;
                }
                break;
            case 'TLSH':
                if (!TLSHRegex.test(hashValue)) {
                    this.hashError = 'Hash Value must be properly formatted';
                    return false;
                }
                break;
        }

        this.hashError = '';
        return true;
    }

    isDictEnabled(): boolean {
        let type = this.question.relString;
        let value = this.newString;

        if (this.question.key === 'additional_header_fields') {
            return true;
        }

        if (type.includes(' ')) {
            this.dictError = 'Key may not include whitespace';
            return false;
        }

        let s = type + ': ' + value;
        let defined = false;
        let newStringArray;
        if (this.stixService.stringArrays.has(this.question.key)) {
            newStringArray = this.stixService.stringArrays.get(this.question.key)!;
            defined = true;
        }

        if (defined) {
            for (let currentString of newStringArray) {
                let matches = currentString.split(':');
                if (type == matches[1]) {
                    this.dictError = 'Warning: Value exists for this type - delete existing value entry first to overwrite.';
                    return false;
                }
            }
        }

        this.dictError = '';
        return true;
    }

    addDict(): void {
        let s = this.question.relString + ': ' + this.newString;
        let defined = false;
        let newStringArray;
        if (this.stixService.stringArrays.has(this.question.key)) {
            newStringArray = this.stixService.stringArrays.get(this.question.key)!;
            defined = true;
        }

        if (defined) {
            if (newStringArray.indexOf(s) == -1) {
                newStringArray.push(s);
                this.stixService.stringArrays.set(this.question.key, newStringArray);
            }
        } else this.stixService.stringArrays.set(this.question.key, [s]);

        this.newString = '';

        this.checkDuplicates.emit();
    }

    addKillChain(cartItems: any[] = []): void {
        let str = ``;
        if (cartItems.length > 0) {
            for (let item of cartItems) {
                str = `${item.kill_chain_phase.phase_name}: ${item.kill_chain_phase.kill_chain_name}`;
                item['str'] = str;

                if (this.stixService.stringArrays.has('killChain')) {
                    let newStringArray = this.stixService.stringArrays.get('killChain')!;
                    if (newStringArray.indexOf(str) == -1) {
                        newStringArray.push(str);
                        this.stixService.stringArrays.set('killChain', newStringArray);
                    }
                } else {
                    this.stixService.stringArrays.set('killChain', [str]);
                }

                let found = false;
                for (let ref of this.stixService.externalReferences) {
                    if (ref.external_id === item.external_reference.external_id) {
                        found = true;
                        break;
                    }
                }
                if (found === false) {
                    this.stixService.externalReferences.push(item.external_reference);
                }
            }
        } else {
            str = this.newString + ': ' + this.question.relString;

            if (this.stixService.stringArrays.has('killChain')) {
                let newStringArray = this.stixService.stringArrays.get('killChain')!;
                if (newStringArray.indexOf(str) == -1) {
                    newStringArray.push(str);
                    this.stixService.stringArrays.set('killChain', newStringArray);
                }
            } else {
                this.stixService.stringArrays.set('killChain', [str]);
            }

            this.question.relString = '';
            this.newString = '';
        }

        this.dynamicForm.isAddEnabled();
        this.stixService.kill_chainTrack = true;
    }

    getDeciderDomain() {
        let deciderHostArr = this.envService.env.decider.url.split('.');
        let domain = '';
        deciderHostArr.splice(0, 1);

        if (this.envService.env.decider.url.includes('localhost')) domain = 'localhost';
        else {
            domain = deciderHostArr.join('.');
            domain = domain.replace('/', '');
            domain = `.${domain}`;
        }

        return domain;
    }

    async openDeciderTool(): Promise<void> {
        let domain = this.getDeciderDomain();

        document.cookie = `imx_attack_patterns=; expires=Thu, 01 Jan 9070 00:00:00 GMT; path=/; domain=${domain}; SameSite=None; Secure`;
        let result = await this.decider.openDeciderTool();
        document.cookie = `imx_attack_patterns=; expires=Thu, 01 Jan 9070 00:00:00 GMT; path=/; domain=${domain}; SameSite=None; Secure`;

        this.addKillChain(result);
    }

    refLabel(id: string): string {
        if (this.refLabelCacheSize !== this.stixService.bundle.objects.length) {
            this.refLabelCache.clear();
            this.refLabelCacheSize = this.stixService.bundle.objects.length;
        }
        let label = this.refLabelCache.get(id);
        if (label === undefined) {
            const obj = this.getObjectById(id);
            label = obj ? this.getObjDisplayName(obj) : id;
            this.refLabelCache.set(id, label);
        }
        return label;
    }

    refCount(key: string): number {
        return this.stixService.stringArrays.get(key)?.length ?? 0;
    }

    onListSearchChange(term: string): void {
        this.listSearch$.next(term);
    }

    showListSearch(count: number): boolean {
        return count > this.listSearchThreshold || !!this.listSearch || !!this.listFilter;
    }

    filteredRefs(key: string): string[] {
        const items = this.stixService.stringArrays.get(key) ?? [];
        const term = this.listFilter.trim().toLowerCase();
        if (!term) return items;
        return items.filter((id) => this.refLabel(id).toLowerCase().includes(term) || id.toLowerCase().includes(term));
    }

    deleteString(myobj: any, mykey: any) {
        let curr = this.stixService.stringArrays.get(mykey);
        curr = curr.filter((obj) => obj !== myobj);
        this.stixService.stringArrays.set(mykey, curr);
        if (mykey == 'extension_types') {
            if (myobj.substring(0, 4) == 'new-') {
                this.stixService.customTypesToAdd = this.stixService.customTypesToAdd.filter((type) => type[1] != myobj.substring(0, 7));
            }
            if (this.stixService.isEditing) {
                let id = this.stixService.currentID;
                let currObject = this.stixService.getObjectFromID(id);
                this.stixService.removeExtensionDefChildren(id, currObject, myobj, true);
            }
        } else if (mykey === 'killChain') {
            this.dynamicForm.isAddEnabled();
        }

        this.checkDuplicates.emit();
    }

    getPropertyNames(): string[] {
        return this.propertyNames;
    }

    populatePropertyNames(): string[] {
        let propertyNames = [];
        if (this.currObjectPath) {
            const currentObject = COMPONENT_MAP.get(this.currObjectPath.type) as FormModel;
            let questions = currentObject.getQuestions();
            for (let i = 0; i < questions.length; i++) {
                if (
                    questions[i].key === 'type' ||
                    questions[i].key === 'id' ||
                    questions[i].key === 'spec_version' ||
                    questions[i].key === 'defanged' ||
                    questions[i].key.includes('_ref') ||
                    (questions[0].value === 'email-message' && questions[i].key === 'body')
                )
                    continue;
                let propertyName = this.buildPropertyNames(questions[i], '')[0];
                if (!propertyNames.includes(propertyName)) {
                    propertyNames = propertyNames.concat(propertyName);
                }
            }
        }
        return propertyNames;
    }

    setPropertyNames(): void {
        if (!this.scoBundleObjectSelected) {
            this.propertyNames = this.populatePropertyNames();
            return;
        }

        let propertyNames = [];

        if (this.currObjectPath) {
            const currentObject = COMPONENT_MAP.get(this.currObjectPath.type) as FormModel;
            let questions = currentObject.getQuestions();
            for (let i = 0; i < questions.length; i++) {
                if (this.scoBundleObjectSelected[questions[i].key] === undefined) continue;

                if (
                    questions[i].key === 'type' ||
                    questions[i].key === 'id' ||
                    questions[i].key === 'spec_version' ||
                    questions[i].key === 'defanged'
                )
                    continue;

                if (questions[0].value === 'email-message')
                    if (
                        questions[i].key === 'body' ||
                        questions[i].key === 'body_multipart' ||
                        questions[i].key === 'additional_header_fields' ||
                        questions[i].key === 'raw_email_ref'
                    )
                        continue;

                if (questions[0].value === 'windows-registry-key') if (questions[i].key === 'values') continue;

                if (questions[0].value === 'software') if (questions[i].key === 'languages') continue;

                if (questions[0].value !== 'email-message' && questions[0].value !== 'network-traffic' && questions[i].key.includes('_ref')) continue;

                if (questions[0].value === 'network-traffic')
                    if (questions[i].key === 'start' || questions[i].key === 'end' || questions[i].key === 'is_active') continue;

                let propertyName = this.buildPropertyNames(questions[i], '');
                if (!propertyNames.includes(propertyName)) {
                    propertyNames = propertyNames.concat(propertyName);
                }
            }
        }

        this.propertyNames = propertyNames;
    }

    private buildPropertyNames(question: QuestionBase<any>, baseType: string): string[] {
        let refValues = [];
        // Only include single quotes if the property has a dash ('-') or full stop ('.')
        let formattedQuestion = question.key;
        if (question.key.includes('-') || question.key.includes('.')) formattedQuestion = `'${formattedQuestion}'`;

        if (baseType) formattedQuestion = `${baseType}.${formattedQuestion}`;

        if (this.scoBundleObjectSelected) {
            switch (question.constructor) {
                case HashArrayQuestion: {
                    let typedQuestion = question as HashArrayQuestion;
                    for (let j = 0; j < typedQuestion.hashes.length; j++) {
                        if (this.scoBundleObjectSelected.hashes[typedQuestion.hashes[j]] === undefined) continue;
                        // Only include single quotes if the property has a dash ('-') or full stop ('.')
                        if (typedQuestion.hashes[j].includes('-') || typedQuestion.hashes[j].includes('-'))
                            refValues.push(`${formattedQuestion}.${typedQuestion.hashes[j]}`);
                        else refValues.push(`${formattedQuestion}.${typedQuestion.hashes[j]}`);
                    }

                    break;
                }
                case OpenVocabArrayQuestion:
                case ProtocolArrayQuestion: {
                    let typedQuestion = question as ProtocolArrayQuestion;

                    for (let j = 0; j < typedQuestion.options.length; j++) {
                        if (!this.scoBundleObjectSelected.protocols.includes(typedQuestion.options[j].key)) continue;
                        let formattedOption = typedQuestion.options[j].key;
                        if (formattedOption.includes('-') || formattedOption.includes('.')) formattedOption = `'${formattedOption}'`;

                        refValues.push(`${formattedQuestion}[${j}].${formattedOption}`);
                    }

                    break;
                }
                case ReferenceArrayQuestion:
                case StringArrayQuestion:
                case TooltipStringArrayQuestion: {
                    let typedQuestion = question as TooltipStringArrayQuestion;
                    this.scoBundleObjectSelected[typedQuestion.key].forEach((elem, index) => {
                        refValues.push(`${formattedQuestion}.${elem}`);
                    });

                    break;
                }
                case RefArrayQuestion: {
                    let typedQuestion = question as RefArrayQuestion;
                    for (let j = 0; j < this.scoBundleObjectSelected[typedQuestion.key].length; j++) {
                        let formattedOption = this.scoBundleObjectSelected[typedQuestion.key][j];
                        refValues.push(`${formattedQuestion}.${formattedOption}`);
                    }

                    break;
                }
                case ReferenceArrayQuestion:
                case HybridArrayQuestion: {
                    // No values are in the array so we are using the preselector for all items
                    let typedQuestion = question as HybridArrayQuestion;
                    this.scoBundleObjectSelected[typedQuestion.key].forEach((elem) => {
                        refValues.push(`${formattedQuestion}.${elem}`);
                    });

                    break;
                }
                case StringDictQuestion: {
                    let typedQuestion = question as StringDictQuestion;
                    const currSelected = this.scoBundleObjectSelected[typedQuestion.key];
                    for (const key in currSelected) {
                        refValues.push(`${formattedQuestion}.${key}`);
                    }
                    break;
                }
                default:
                    refValues.push(`${formattedQuestion}`);
            }
        } else {
            refValues.push(`${formattedQuestion}`);
        }
        return refValues;
    }

    uploadPattern(event): void {
        if (event.target.files.length === 0) return;

        for (let file of event.target.files) {
            const fileReader = new FileReader();

            fileReader.readAsText(file, 'UTF-8');
            fileReader.onload = () => {
                let string = <string>fileReader.result;
                this.form.controls['pattern'].setValue(string);
            };
        }

        this.patternUploader.nativeElement.value = '';
    }

    patternFileType() {
        const pattern_type = this.form.getRawValue().pattern_type;

        switch (pattern_type[0]) {
            case 'pcre':
                return '*';
            case 'sigma':
                return '.yml, .yaml';
            case 'snort':
                return '.rules';
            case 'suricata':
                return '.rules';
            case 'yara':
                return '.yara, .yar';
            default:
                return '*';
        }
    }

    /**
     * This will open the modal responsible for building stix patterns
     *
     * @param modal modal content sent in from the local variable in the HTML (might want to data bind this to a typescript variable but for now it's good)
     */
    openModal(modal, editing?): void {
        if (this.stixService.currentType != 'extension-definition' && !editing) {
            this.currentModalObject = new Map();
        }

        switch (modal) {
            case 'stixPatternBuilder':
                let patternRef = this.patternBuilderDialog.open(PatternBuilderComponent, {
                    data: {},
                    minHeight: '30vh',
                    maxHeight: `80vh`, //`${window.innerHeight}px`,
                    width: `${window.innerWidth}px`,
                    maxWidth: '95vw',
                    position: {
                        top: '100px',
                    },
                });

                patternRef.afterClosed().subscribe((result) => {
                    if (result) {
                        this.form.controls['pattern'].setValue(result.pattern);
                    }
                });
                break;
            case 'body_multipart':
                let tempRefs = this.getEmailMessageAllowedRefs();
                let multipartData = {
                    allowedRefs: tempRefs,
                    mode: 'regular',
                    body: '',
                    body_raw_ref: '',
                    content_type: '',
                    content_disposition: '',
                };

                if (editing) {
                    for (let field in this.currentModalObject) {
                        multipartData[field] = this.currentModalObject[field];
                    }
                }

                let multipartRef = this.multipartDialog.open(MultipartDialogComponent, {
                    data: multipartData,
                    minHeight: '200px',
                    maxHeight: '600px',
                    width: `${window.innerWidth / 1.25}px`,
                    position: {
                        top: '200px',
                    },
                });

                multipartRef.afterClosed().subscribe((result) => {
                    if (result) {
                        for (let field in result) {
                            this.currentModalObject[field] = result[field];
                        }

                        this.addModalObject('body_multipart');
                        this.isAddEnabled.emit();
                    }
                });
                break;
            case 'windows_value':
                let windowsValueData = {
                    mode: 'regular',
                    name: '',
                    data: '',
                    data_type: '',
                };

                if (editing) {
                    for (let field in this.currentModalObject) {
                        windowsValueData[field] = this.currentModalObject[field];
                    }
                }
                let windowsValueRef = this.windowsValueDialog.open(WindowsValueDialogComponent, {
                    data: windowsValueData,
                    minHeight: '150px',
                    maxHeight: '600px',
                    width: `${window.innerWidth / 1.25}px`,
                    position: {
                        top: '200px',
                    },
                });

                windowsValueRef.afterClosed().subscribe((result) => {
                    if (result) {
                        for (let field in result) {
                            this.currentModalObject[field] = result[field];
                        }

                        this.addModalObject('windows_value');
                        this.isAddEnabled.emit();
                    }
                });
                break;
            case 'email_address':
                let emailRefs = this.getEmailExtensionRefs();
                let emailIdentityRef = this.identityDialog.open(IdentityExtensionDialogComponent, {
                    data: {
                        type: 'Email Address',
                        entry: this.currentModalObject,
                        allowedRefs: emailRefs,
                    },
                    minHeight: '450px',
                    maxHeight: '90vh',
                    width: '750px',
                    maxWidth: '95vw',
                });

                emailIdentityRef.afterClosed().subscribe((result) => {
                    if (result) {
                        Object.keys(this.currentModalObject).forEach((key) => {
                            if (!(key in result)) delete this.currentModalObject[key];
                        });

                        Object.assign(this.currentModalObject, result);
                        this.addModalObject('email_address');
                        this.isAddEnabled.emit();
                    }
                });
                break;
            case 'phone_number':
                let phoneIdentityRef = this.identityDialog.open(IdentityExtensionDialogComponent, {
                    data: {
                        type: 'Phone Number',
                        entry: this.currentModalObject,
                    },
                    minHeight: '450px',
                    maxHeight: '90vh',
                    width: '750px',
                    maxWidth: '95vw',
                });

                phoneIdentityRef.afterClosed().subscribe((result) => {
                    if (result) {
                        Object.keys(this.currentModalObject).forEach((key) => {
                            if (!(key in result)) delete this.currentModalObject[key];
                        });

                        Object.assign(this.currentModalObject, result);
                        this.addModalObject('phone_number');
                        this.isAddEnabled.emit();
                    }
                });
                break;
            case 'social_media':
                let socialRefs = this.getSocialExtensionRefs();
                let socialIdentityRef = this.identityDialog.open(IdentityExtensionDialogComponent, {
                    data: {
                        type: 'Social Media',
                        entry: this.currentModalObject,
                        allowedRefs: socialRefs,
                    },
                    minHeight: '450px',
                    maxHeight: '90vh',
                    width: '750px',
                    maxWidth: '95vw',
                });

                socialIdentityRef.afterClosed().subscribe((result) => {
                    if (result) {
                        Object.keys(this.currentModalObject).forEach((key) => {
                            if (!(key in result)) delete this.currentModalObject[key];
                        });

                        Object.assign(this.currentModalObject, result);
                        this.addModalObject('social_media');
                        this.isAddEnabled.emit();
                    }
                });
                break;
        }
    }

    getEmailExtensionRefs() {
        let result = this.stixService.bundle.objects;
        return result.filter((obj) => obj.type === 'email-addr');
    }

    getSocialExtensionRefs() {
        let result = this.stixService.bundle.objects;
        return result.filter((obj) => obj.type === 'user-account');
    }

    getFilteredModalObjectArray(type: string) {
        if (type === 'email_address')
            return this.stixService.modalObjectArray.filter((obj) => obj.email_address_ref !== undefined && obj.email_address_ref !== null);
        else if (type === 'phone_number')
            return this.stixService.modalObjectArray.filter((obj) => obj.contact_number !== undefined && obj.contact_number !== null);
        else if (type === 'social_media')
            return this.stixService.modalObjectArray.filter((obj) => obj.user_account_ref !== undefined && obj.user_account_ref !== null);
        else return null;
    }

    getEmailMessageAllowedRefs() {
        let result = this.stixService.bundle.objects;
        return result.filter((obj) => obj.type === 'artifact' || obj.type === 'file');
    }

    /**
     * If a comparison expression is created, the user can select to remove it prior to moving on if they've made a mistake
     *
     * @param index index of the comparison expression in the array to remove
     */
    removeComparisonExpression(index: number): void {
        this.comparisonExpressions.splice(index, 1);
    }

    /**
     * Reset stix pattern builder modal for new creation if user selects it again
     */
    resetStixPatternBuilder(): void {
        this.comparisonConstant = null;
        this.comparisonExpressions = [];
        this.currObjectPath = null;
        this.observationExpressionBuilder = null;
        this.observationExpressions = [];
        this.patternExpressions = [];
        this.page = 1;
        this.pageSize = 4;
        this.selectedComparisonOperator = '=';
        this.selectedObservationOperator = 'AND';
        this.selectedStixPatternBuilder = null;
        this.validationMessage = '';
        this.scoBundleObjectSelected = null;
    }

    /**
     * Add stix pattern to form/question
     */
    saveStixPattern(): void {
        this.form.controls['pattern'].setValue(this.selectedStixPatternBuilder.getDisplayForStixPattern().trim());
        this.modalService.dismissAll();
        this.resetStixPatternBuilder();
    }

    updatePropertyNames(objectPath: any): void {
        this.currObjectPath = objectPath;
        this.setPropertyNames();
        let propertyNames = this.getPropertyNames();
        if (propertyNames.length > 1) {
            this.currPropertyName = propertyNames[0];
            this.comparisonConstant = this.scoBundleObjectSelected[propertyNames[0]];
        }
    }

    typeInBundle() {
        return this.currObjectPath ? this.bundle.objects.some((x) => x.type === this.currObjectPath.type) : false;
    }

    getBundleObjects() {
        let result = [];
        let objs = this.stixService.bundle.objects.concat(this.stixService.customObjects);

        switch (this.question.key) {
            case 'creator_user_ref':
                return result.concat(objs.filter((o) => o.id.includes('user-account')));
            case 'installed_software_refs':
                return result.concat(objs.filter((o) => o.id.includes('software')));
            case 'object_refs':
                this.sortBundleObjects();
                if (this.object_type === 'observed-data') {
                    return result.concat(
                        objs.filter((o) => {
                            return SCO_LIST.includes(o.type) || o.type === 'relationship' || o.type === 'sighting';
                        })
                    );
                }

                return result.concat(objs);
            case 'contains_refs':
            case 'analysis_sco_refs':
                return result.concat(
                    objs.filter((o) => {
                        return SCO_LIST.includes(o.type);
                    })
                );
            case 'src_payload_ref':
            case 'dst_payload_ref':
            case 'encapsulated_by_ref':
            case 'encapsulates_refs':
                this.sortBundleObjects();
                return result.concat(
                    objs.filter((o) => {
                        return o.id.toLowerCase().startsWith(this.question.target);
                    })
                );
            default:
                this.sortBundleObjects();
                return result.concat(objs);
        }
    }

    openTooltipModal(modal) {
        this.modalRef = this.modalService.open(modal);
    }

    openLargeSubModal(modal) {
        this.modalRef = this.modalService.open(modal, { size: 'xl' });
    }

    openCustomObjModal(modal) {
        this.modalService.open(modal, { ariaLabelledBy: 'custom-obj-modal-title', windowClass: 'custom-obj-modal' }).result.finally(() => {});
    }

    closeTooltip() {
        this.modalRef.close();
    }

    /**
     * Add current object being created in modal to parent
     */
    isModalAddEnabled(): boolean {
        if (this.currentModalObject['body_raw_ref']) this.validType(['artifact', 'file'], this.currentModalObject['body_raw_ref'], 'body_raw_ref');

        if (
            this.stixService.currentType == 'email-message' &&
            (this.currentModalObject['body'] == undefined || this.currentModalObject['body'] == '') &&
            (this.currentModalObject['body_raw_ref'] == undefined || this.currentModalObject['body_raw_ref'] == '')
        )
            this.modalError.set('object', 'Either Body or Body Raw Ref is required ');
        else this.modalError.delete('object');

        for (let key of this.modalError.keys()) {
            if (!this.currentModalObject[key] && key != 'object' && key != 'customName')
                // Removes the error if the field is now empty
                this.modalError.delete(key);

            // Returns false if there is a validation error on a field
            if (this.modalError.get(key) && !this.modalError.get(key).includes('WARNING:') && !this.modalError.get(key).includes('hashes')) {
                return (this.modalEnabled = false);
            }
        }

        if (this.isEmpty(this.currentModalObject)) return (this.modalEnabled = false);

        return (this.modalEnabled = true);
    }

    addModalObject(type: string): void {
        if (this.editedModalObject) {
            this.deleteModalObject(this.editedModalObject);
            this.editedModalObject = undefined;
        }

        if (this.customObjType.length > 0) {
            // If it is a custom object
            let currType = this.newString + ' (' + this.currentModalObject['type'] + ')';
            this.stixService.customTypesToAdd.push([this.currentModalObject['type'], this.newString]);

            if (this.stixService.stringArrays.has(this.question.key)) {
                let newStringArray = this.stixService.stringArrays.get(this.question.key)!;
                newStringArray.push(currType);
                this.stixService.stringArrays.set(this.question.key, newStringArray);
            } else {
                this.stixService.stringArrays.set(this.question.key, [currType]);
            }

            this.newString = '';
            this.customObjType = '';

            if (this.currentModalObject.get('modal_labels')) {
                this.currentModalObject['labels'] = this.currentModalObject.get('modal_labels');
                this.currentModalObject.delete('modal_labels');
            }

            if (this.currentModalObject['revoked']) this.currentModalObject['revoked'] = JSON.parse(this.currentModalObject['revoked']);

            if (this.currentModalObject['defanged']) this.currentModalObject['defanged'] = JSON.parse(this.currentModalObject['defanged']);
        }

        this.stixService.modalObjectArray.push(this.currentModalObject);
        this.modalService.dismissAll();
        this.modalEnabled = false;
    }

    editModalObject(currObject: any, modal: any, index: number = null): void {
        this.currentModalObject = new Map();
        this.editedModalObject = currObject;

        if (this.stixService.currentType == 'extension-definition') {
            let regex = new RegExp(/^.*\"extension_type\":\"(new-...).*$/);
            let matches = JSON.stringify(currObject).match(regex);
            if (matches) {
                this.newString = matches[1];

                let t = '';
                switch (this.newString) {
                    case 'new-sdo':
                        t = 'SDO';
                        break;
                    case 'new-sco':
                        t = 'SCO';
                        break;
                    case 'new-sro':
                        t = 'SRO';
                        break;
                }
                this.customObjType = t;
            } else {
                console.error('ERROR: Not a valid Custom Object Type (must be sdo/sro/sco)');
                return;
            }
        }

        for (let x in currObject) {
            console.info(x);
            this.currentModalObject[x] = currObject[x];
        }

        if (modal === 'language_contents') {
            this.openLanguageModal(this.editedModalObject, index);
        } else {
            this.openModal(`${modal}`, true);
        }
    }

    deleteModalObject(currObject: any): void {
        this.stixService.modalObjectArray = this.stixService.modalObjectArray.filter((obj) => obj !== currObject);
        if (JSON.stringify(currObject).includes('id')) {
            let regex = new RegExp(/^.*"id": "(.*)",.*$/);
            console.info(currObject['id']);
            let curr = this.stixService.stringArrays.get('extension_types') || [];
            curr = curr.filter((obj) => !obj.includes(currObject['id']));
            this.stixService.stringArrays.set('extension_types', curr);
        }
        this.stixService.contents = this.stixService.contents.filter((obj) => obj !== currObject);
    }

    isEmpty(currObject: any, arrays?: string[]): boolean {
        for (let prop in currObject) {
            let p = currObject[prop];
            if (
                p &&
                p != '' &&
                prop != 'extension_id' &&
                prop != 'extension_type' &&
                (typeof p == 'string' || typeof p == 'number' || typeof p == 'boolean')
            ) {
                return false;
            }
        }
        return true;
    }

    /**
     * Input Validation Functions
     */
    validType(types: any, currString: string, currObject: string): boolean {
        if (currString == '')
            // Does not run on (change) when empty -- DOES NOT WORK
            this.modalError.delete(currObject);
        if (!(types instanceof Array)) types = [types];

        if (currString.match(this.objectRegex)) {
            if (types.indexOf((currString.match(this.objectRegex) || ['asdf', 'asdf'])[1]) != -1) {
                this.modalError.delete(currObject);
                return true;
            } else this.modalError.set(currObject, 'Object must be a UUID of type ' + types);
        } else this.modalError.set(currObject, 'Must be a valid UUID (i.e. [object type]--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)');
        return false;
    }

    getBody_MultipartHeading(curr: any): string {
        let heading = '';
        if (curr['body']) {
            heading = curr['body'];
            if (curr['body_raw_ref']) heading += ';  ' + curr['body_raw_ref'];
        } else heading = curr['body_raw_ref'];

        return heading;
    }

    getIdentityHeading(curr: any, type: string): string {
        let result = null;

        if (type === 'email_address') result = this.getObjectById(curr.email_address_ref).value;
        if (type === 'phone_number') result = curr.contact_number;
        if (type === 'social_media')
            result =
                this.getObjectById(curr.user_account_ref).user_id ||
                this.getObjectById(curr.user_account_ref).display_name ||
                this.getObjectById(curr.user_account_ref).id;
        return result;
    }

    getUserAccountHeading(curr: any): string {
        let userAccountObject = this.getObjectById(curr.user_account_ref);
        return userAccountObject.value;
    }

    getExtTypeOpt(options: { key: string; value: string }[]): { key: string; value: string }[] {
        let ret = options;
        if (this.stixService.stringArrays.has(this.question.key)) {
            for (let x of this.stixService.stringArrays.get(this.question.key)) {
                if (x.includes('new-')) {
                    x = x.substring(0, 7);
                }
                ret = ret.filter((obj) => obj.key != x);
            }
        }
        return ret;
    }

    addExtensionType(modal: any): void {
        this.currentModalObject = new Map();
        this.editedModalObject = undefined;
        let currType = this.newString;

        // Handles Property Extensions
        if (currType.includes('extension') || true) {
            if (this.stixService.stringArrays.has(this.question.key)) {
                let newStringArray = this.stixService.stringArrays.get(this.question.key)!;
                if (newStringArray.indexOf(currType) == -1) {
                    newStringArray.push(currType);
                    this.stixService.stringArrays.set(this.question.key, newStringArray);
                }
            } else this.stixService.stringArrays.set(this.question.key, [currType]);
            this.newString = '';
            return;
        }
    }

    isCustomObjAddEnabled(): boolean {
        let ret = this.checkType(this.currentModalObject['type']);

        for (let key of this.modalError.keys()) {
            if (!this.currentModalObject[key] && key != 'object' && key != 'customName')
                // Removes the error if the field is now empty
                this.modalError.delete(key);

            // Returns false if there is a validation error on a field
            if (this.modalError.get(key) && !this.modalError.get(key).includes('WARNING:') && !this.modalError.get(key).includes('hashes')) {
                ret = false;
            }
        }
        return ret;
    }

    checkType(currType: string): boolean {
        if (currType == undefined || currType == '') {
            this.modalError.delete('type');
            return false;
        }

        for (let char of currType) {
            if (char === char.toUpperCase() && char !== char.toLowerCase()) {
                this.modalError.set('type', 'Type may only contain lowercase letters, numbers, and hyphens (-)');
                return false;
            }
        }

        if (currType.indexOf('--') != -1) {
            this.modalError.set('type', 'Type may not have two consecutive hypens (--)');
            return false;
        }

        if (currType.length < 3) {
            this.modalError.set('type', 'Type must have a minimum length of 3 characters');
            return false;
        }

        if (currType.length > 250) {
            this.modalError.set('type', 'Type must have a maximum length of 250 characters');
            return false;
        }

        if (this.currentModalObject['id'].indexOf('--') != -1) {
            let arr = this.currentModalObject['id'].split('--');

            this.currentModalObject['id'] = currType + arr[2];
        } else console.error('ERROR: INVALID ID');

        this.modalError.delete('type');
        return true;
    }

    checkName(currName: string): boolean {
        if (currName == undefined || currName == '') {
            this.modalError.delete('customName');
            return false;
        }

        for (let char of currName) {
            if (char === char.toUpperCase() && char !== char.toLowerCase()) {
                this.modalError.set('type', 'Name may only contain lowercase letters, numbers, and hyphens (-)');
                return false;
            }
        }

        if (currName.length < 3) {
            this.modalError.set('customName', 'Name must have a minimum length of 3 characters');
            return false;
        }

        if (currName.length > 250) {
            this.modalError.set('customName', 'Name must have a maximum length of 250 characters');
            return false;
        }

        this.modalError.delete('customName');
        return true;
    }

    /**
     * String Array/Dict Functions
     */
    addModalString(currString: string, currArray: string): void {
        if (this.currentModalObject.has(currArray)) {
            let newStringArray = this.currentModalObject.get(currArray)!;
            if (newStringArray.indexOf(currString) == -1) {
                newStringArray.push(currString);
                this.currentModalObject.set(currArray, newStringArray);
            }
        } else this.currentModalObject.set(currArray, [currString]);

        if (this.modalProps[currArray] == currString) this.modalProps[currArray] = '';
    }

    deleteModalString(currString: string, currArray: string) {
        let curr = this.currentModalObject.get(currArray);
        curr = curr.filter((obj) => obj !== currString);
        if (curr.length > 0) this.currentModalObject.set(currArray, curr);
        else this.currentModalObject.delete(currArray);
    }

    addSubModalString(currString: string, currArray: string): void {
        if (this.customProp.has(currArray)) {
            let newStringArray = this.customProp.get(currArray)!;
            if (newStringArray.indexOf(currString) == -1) {
                newStringArray.push(currString);
                this.customProp.set(currArray, newStringArray);
            }
        } else this.customProp.set(currArray, [currString]);

        if (this.customProp['value'] == currString) this.customProp['value'] = '';
    }

    addSubModalDictString(currKey: string, currValue: string, currDict: string): void {
        this.customProp.get(currDict).set(currKey, currValue);
        this.customProp.get(currDict)[currKey] = currValue;

        if (this.customProp['value'] == currValue) {
            this.customProp['key'] = '';
            this.customProp['value'] = '';
        }
    }
    deleteSubModalDictString(currKey: string, currDict: string) {
        this.customProp.get(currDict).delete(currKey);
        delete this.customProp.get(currDict)[currKey];
    }

    deleteSubModalString(currString: string, currArray: string) {
        let curr = this.customProp.get(currArray);
        curr = curr.filter((obj) => obj !== currString);
        if (curr.length > 0) this.customProp.set(currArray, curr);
        else this.customProp.delete(currArray);
    }

    createProperty(modal?: any): void {
        let type = this.customProp['type'];
        let name = this.customProp['name'];
        if (this.currentModalObject[name]) {
            this.modalError.set('customName', 'Property with this name already exists');
            return;
        } else this.modalError.delete('customName');

        if (!this.checkName(name)) return;

        if (type == 'array' || type == 'dict') {
            this.customProp.set('customArray', []);
            this.customProp['key'] = '';
            this.customProp['value'] = '';
            this.customProp.set('customDict', new Map());
            this.openLargeSubModal(modal);
        } else {
            if (type == 'text') this.currentModalObject[name] = this.customProp['text'];
            else if (type == 'boolean') this.currentModalObject[name] = JSON.parse(this.customProp['boolean']);
            else if (type == 'integer') this.currentModalObject[name] = parseInt(this.customProp['integer']) || undefined;
            else if (type == 'datetime') this.currentModalObject[name] = this.customProp['datetime'];
            this.customStringPropKeys.push(name);
            this.customProp['type'] = '';
            this.customProp['name'] = '';
            this.customProp['text'] = '';
            this.customProp['boolean'] = '';
            this.customProp['integer'] = '';
            this.customProp['datetime'] = '';
        }
    }

    createSubProperty(): void {
        let type = this.customProp['type'];
        let name = this.customProp['name'];
        if (type == 'array') {
            this.currentModalObject[name] = this.customProp.get('customArray');
        } else if (type == 'dict') {
            this.currentModalObject[name] = this.customProp.get('customDict');
        }

        if (!this.customArrPropKeys.includes(name)) this.customArrPropKeys.push(name);

        this.customProp['type'] = '';
        this.customProp['name'] = '';
        this.customProp['text'] = '';
        this.customProp['boolean'] = '';
        this.customProp['datetime'] = '';
        this.closeTooltip();
    }

    deleteProperty(currString: string): void {
        this.currentModalObject[currString] = undefined;
        this.customStringPropKeys = this.customStringPropKeys.filter((obj) => obj !== currString);
        this.customArrPropKeys = this.customArrPropKeys.filter((obj) => obj !== currString);
    }

    openLanguageModal(editModalObject: any = null, index: number = null) {
        this.modalRef = this.modalService.open(ContentsDialogComponent, {
            ariaLabelledBy: 'pattern-builder-modal-title',
            windowClass: 'pattern-builder-modal',
            backdrop: 'static',
            keyboard: false,
        });

        this.modalRef.componentInstance.form = this.form;

        setTimeout(() => {
            if (editModalObject) {
                const data = {
                    data: this.editedModalObject,
                    index: index,
                };
                this.stixService.sendData(data);
            }
        }, 300);

        this.modalRef.result.finally(() => {
            this.stixService.modalObjectArray = this.stixService.contents;
        });
    }

    getContentsDisplay(content: Content): any {
        return JSON.parse(`{ ${content.toString()} }`);
    }

    deleteExpression(compExpIndex = null, observExpIndex = null, patternExpIndex = null) {
        if (compExpIndex !== null) {
            this.comparisonExpressions.splice(compExpIndex, 1);
        }

        if (observExpIndex !== null) {
            this.observationExpressions.splice(observExpIndex, 1);
        }

        if (patternExpIndex !== null) {
            this.patternExpressions.splice(patternExpIndex, 1);
        }
    }

    disableContinue() {
        switch (this.page) {
            case 1:
                return this.comparisonExpressions.length === 0 && this.observationExpressions.length === 0;
            case 2:
                return this.observationExpressions.length === 0;
            case 3:
                return this.patternExpressions.length === 0;
            default:
                return false;
        }
    }

    disableSaveStixPattern() {
        if (this.selectedStixPatternBuilder) {
            if (
                this.selectedStixPatternBuilder.qualifierForDropdown === 'START' &&
                (this.selectedStixPatternBuilder.getQualifier.startDate === undefined ||
                    this.selectedStixPatternBuilder.getQualifier.endDate === undefined)
            ) {
                return true;
            }
            if (
                this.selectedStixPatternBuilder.qualifierForDropdown === 'WITHIN' &&
                this.selectedStixPatternBuilder.getQualifier.seconds === undefined
            ) {
                return true;
            }
            if (
                this.selectedStixPatternBuilder.qualifierForDropdown === 'REPEATS' &&
                this.selectedStixPatternBuilder.getQualifier.times === undefined
            ) {
                return true;
            }
        }

        if (this.page == this.pageSize && !this.selectedStixPatternBuilder) {
            return true;
        }

        return false;
    }

    showSetOperator() {
        if (
            (this.currObjectPath.type === 'ipv4-addr' && this.currPropertyName === 'value') ||
            (this.currObjectPath.type === 'ipv6-addr' && this.currPropertyName === 'value') ||
            (this.currObjectPath.type === 'network-traffic' && this.currPropertyName === 'dst_ref.value') ||
            (this.currObjectPath.type === 'network-traffic' && this.currPropertyName === 'src_ref.value') ||
            (this.currObjectPath.type === 'domain-name' && this.currPropertyName === 'resolves_to_refs.value')
        ) {
            return true;
        }

        return false;
    }

    clickContinue() {
        this.selectedStixPatternBuilder = null;
    }

    updateExpressionConstant(event, component = null) {
        if (component !== null) this.scoBundleObjectSelected = component;
        this.setPropertyNames();
        let firstPropertyName = this.currPropertyName,
            secondPropertyName: string;
        if (this.currPropertyName?.includes('.')) {
            [firstPropertyName, secondPropertyName] = this.currPropertyName.split('.');
            if (firstPropertyName.includes('[')) firstPropertyName = firstPropertyName.split('[')[0];
        }
        if (this.scoBundleObjectSelected[firstPropertyName] === undefined) {
            this.currPropertyName = this.getPropertyNames()[0];
            firstPropertyName = this.currPropertyName;
            secondPropertyName = '';
        }
        if (this.scoBundleObjectSelected && firstPropertyName) {
            if (Array.isArray(this.scoBundleObjectSelected[firstPropertyName])) {
                this.comparisonConstant = secondPropertyName;
                return;
            }
            this.comparisonConstant = secondPropertyName
                ? this.scoBundleObjectSelected[firstPropertyName][secondPropertyName]
                : this.scoBundleObjectSelected[this.currPropertyName];
        }
    }

    /**
     * Get display name from each object either the name or a predefined field/format
     */
    getObjDisplayName(opt: any): string {
        let displayString = '';
        switch (opt.type) {
            case 'malware-analysis':
                return opt.id;

            case 'artifact':
                displayString = (opt.url ? opt.url : '') + (opt.payload_bin ? opt.payload_bin : '');
                break;

            case 'autonomous-system':
                displayString = opt.number + (opt.name ? ' (' + opt.name + ')' : '');
                break;

            case 'directory':
                displayString = opt.path;
                break;

            case 'email-message':
                displayString = opt.subject ? opt.subject : 'No Subject Included';
                break;

            case 'file':
                if (opt.name) displayString = opt.name;
                else if (opt.hashes) displayString = Object.keys(opt.hashes)[0] + ': ' + opt.hashes[Object.keys(opt.hashes)[0]];
                else displayString = '';
                break;

            case 'domain-name':
            case 'email-addr':
            case 'ipv4-addr':
            case 'ipv6-addr':
            case 'mac-addr':
            case 'url':
                displayString = opt.value;
                break;

            case 'process':
                if (opt.pid) displayString = opt.pid;
                else if (opt.cwd) displayString = opt.cwd;
                else displayString = '';
                break;

            case 'relationship':
                if (opt.source_ref && opt.target_ref) {
                    let sourceRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === opt.source_ref);
                    let targetRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === opt.target_ref);
                    let sourceDisplay = sourceRefObject.length > 0 ? this.getObjDisplayName(sourceRefObject[0]).split('|')[0].trim() : opt.source_ref;
                    let targetDisplay = targetRefObject.length > 0 ? this.getObjDisplayName(targetRefObject[0]).split('|')[0].trim() : opt.target_ref;
                    let relationship_type = opt.relationship_type;
                    displayString = `${sourceDisplay} ${relationship_type} ${targetDisplay}`;
                } else displayString = `<NO NAME> (${opt.id})`;
                break;

            case 'impact':
                displayString = opt.impact_category ? opt.impact_category.charAt(0).toUpperCase() + opt.impact_category.slice(1) : `(${opt.id})`;
                break;
            case 'user-account':
                if (opt.user_id) displayString = opt.user_id;
                else if (opt.account_login) displayString = opt.account_login;
                else if (opt.display_name) displayString = opt.display_name;
                else displayString = '';
                break;

            case 'windows-registry-key':
                if (opt.key) displayString = opt.key;
                else displayString = '';
                break;

            case 'x509-certificate':
                if (opt.subject) displayString = opt.subject;
                else if (opt.serial_number) displayString = opt.serial_number;
                else if (opt.hashes) displayString = Object.keys(opt.hashes)[0] + ': ' + opt.hashes[Object.keys(opt.hashes)[0]];
                else if (opt.issuer) displayString = opt.issuer;
                else displayString = '';
                break;

            case 'observed-string':
                displayString = opt.value;
                break;

            case 'attack-pattern':
            case 'campaign':
            case 'course-of-action':
            case 'grouping':
            case 'identity':
            case 'incident':
            case 'indicator':
            case 'infrastructure':
            case 'intrusion-set':
            case 'location':
            case 'malware':
            case 'note':
            case 'observed-data':
            case 'opinion':
            case 'report':
            case 'threat-actor':
            case 'tool':
            case 'vulnerability':
            case 'sighting':
            case 'mutex':
            case 'network-traffic':
            case 'software':
            case 'language-content':
            case 'marking-definition':
            case 'extension-definition':
            case 'event':
            case 'task':
            case 'malware-behavior':
            case 'malware-method':
            case 'malware-objective':
                displayString = opt.name;
                break;

            default:
                displayString = opt.type;
        }
        if (displayString && displayString.length > 100) displayString = `${displayString.substring(0, 97) + '...'}`;
        if (displayString) return displayString + ' | ' + opt.id;
        else return '<NO NAME> | ' + opt.id;
    }

    /**
     * Sort bundle objects with the order predefined in STIX_OBJECTS. Custom Objects attached at last.
     */
    sortBundleObjects() {
        let objOrder = [];
        for (let stixObj of STIX_OBJECTS) {
            for (let obj of stixObj.objects) objOrder.push(obj.type);
        }
        this.stixService.bundle.objects.sort((a, b) => {
            let i = objOrder.indexOf(a.type) === -1 ? 99 : objOrder.indexOf(a.type);
            let j = objOrder.indexOf(b.type) === -1 ? 99 : objOrder.indexOf(b.type);
            return i - j;
        });
    }

    questionLabel(question) {
        if (this.stixService.guidedUI) {
            let label = question.label;
            if (label[label.length - 1] === '*') {
                label = label.slice(0, label.length - 1);
            }
            return label;
        }
        return question.label;
    }

    onChooseFileHandler(event) {
        if (event.target.files[0]) {
            const allowedExtensions = /(\.json)$/i;
            if (!allowedExtensions.exec(event.target.files[0].name)) {
                this.message = 'Please select a json (*.json) file to upload.';
            } else {
                this.loadedFile = event.target.files[0];
                this.loadedFileName = this.loadedFile.name;
            }
        }
        const fileReader = new FileReader();
        fileReader.onload = () => {
            this.schema = JSON.parse(fileReader.result as string);
        };
        fileReader.readAsText(this.loadedFile, 'UTF-8');
        fileReader.onerror = (error) => {
            this.message = 'File reading error occurred. Please check your file.';
        };
    }

    onChooseFieldFileHandler(event) {
        this.message = null;
        this.isProcessingFile = true;
        setTimeout(() => this.processSelectedFile(event), 0);
    }

    private processSelectedFile(event) {
        if (event.target.files[0]) {
            const selectedFile = event.target.files[0];
            const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
            if (selectedFile.size > maxSizeInBytes) {
                this.message = `File size exceeds 10 MB limit. Selected file is ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB.`;
                event.target.value = '';
                this.loadedFile = null;
                this.loadedFileName = null;
                this.schema = null;
                this.isProcessingFile = false;
                return;
            }
            this.loadedFile = selectedFile;
            this.loadedFileName = selectedFile.name;
        } else {
            this.isProcessingFile = false;
            return;
        }
        // ✅ Check if file is text-based (JSON, XML, TXT, etc.)
        const isTextFile = this.isTextBasedFile(this.loadedFile);

        // Read as ArrayBuffer for Base64 encoding (always needed)
        const binaryReader = new FileReader();
        binaryReader.onload = () => {
            const arrayBuffer = binaryReader.result as ArrayBuffer;
            const base64String = this.arrayBufferToBase64(arrayBuffer);
            this.payload_bin_encoded = base64String;

            // ✅ For binary files, show Base64 in textarea
            if (!isTextFile) {
                this.schema = base64String;
                this.isProcessingFile = false;
            }
        };
        binaryReader.readAsArrayBuffer(this.loadedFile);

        // ✅ For text files, also read as text for display
        if (isTextFile) {
            const textReader = new FileReader();
            textReader.onload = () => {
                this.schema = textReader.result as string;
                this.isProcessingFile = false;
            };
            textReader.readAsText(this.loadedFile);

            textReader.onerror = (error) => {
                this.message = 'File reading error occurred. Please check your file.';
                this.isProcessingFile = false;
            };
        }

        binaryReader.onerror = (error) => {
            this.message = 'File reading error occurred. Please check your file.';
            this.isProcessingFile = false;
        };
    }

    private isTextBasedFile(file: File): boolean {
        const textExtensions = [
            '.json',
            '.txt',
            '.xml',
            '.csv',
            '.log',
            '.md',
            '.html',
            '.css',
            '.js',
            '.ts',
            '.py',
            '.java',
            '.c',
            '.cpp',
            '.sh',
            '.yml',
            '.yaml',
        ];
        const textMimeTypes = ['application/json', 'text/plain', 'text/html', 'text/xml', 'text/csv', 'application/xml'];

        const fileName = file.name.toLowerCase();
        if (textExtensions.some((ext) => fileName.endsWith(ext))) {
            return true;
        }

        if (textMimeTypes.some((mime) => file.type === mime)) {
            return true;
        }

        return false;
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;

        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }

        return btoa(binary);
    }

    onUploadFieldFile() {
        this.isProcessingFile = true;
        setTimeout(() => {
            this.form.controls[this.question.key].setValue(this.schema);
            this.isProcessingFile = false;
        }, 0);
    }

    onLoadFieldFile(): void {
        this.form.controls[this.question.key].setValue(this.schema);
    }

    updateEncoded(): void {
        if (this.newString.length > 0) {
            this.newString = 'encoded';
        } else {
            this.newString = '';
        }
    }

    onLoadFile(): Promise<any> {
        this.message = '';
        const url = this.envService.env.extensionSchema.url + this.schema?.title + '/';
        const username = this.envService.env.extensionSchema.username;
        const password = this.envService.env.extensionSchema.password;
        return new Promise((resolve, reject) => {
            if (url && username && password) {
                let push_headers = {
                    headers: new HttpHeaders({
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: 'Basic ' + btoa(`${username}:${password}`),
                    }),
                };

                this.http
                    .post(url, this.schema, push_headers)
                    .toPromise()
                    .then((result) => {
                        this.form.controls['schema'].setValue(result);
                        this.loadedFile = null;
                        resolve(result);
                    })
                    .catch((err) => {
                        console.error(err);
                        this.message = this.uploadSchemaErrorHandler(err.message);
                        reject(err);
                    });
            } else {
                reject('missing url/username/password');
            }
        });
    }

    uploadSchemaErrorHandler(message = '') {
        if (message.includes('0 Unknown')) return 'certificate not trusted';
        if (message.includes('undefined')) return 'Your schema is missing a TITLE property. Please double check your file.';
        if (message.includes('409 Conflict'))
            return 'A schema with duplicate title has been uploaded already. Please choose a different file to upload.';
        if (message.includes('400 Bad Request'))
            return 'Some properties in the schema could not be processed by the server. Please double check your file.';
        return '';
    }

    /**
     * Custom Objects - Edit Collection
     */
    editCollection(currCollection: any, modal: any): void {
        let currObj = this.currentModalObject[currCollection];
        this.customProp['name'] = currCollection;
        this.customProp['value'] = '';

        if (currObj.length) {
            // If it is an array
            this.customProp.set('customArray', []);
            this.customProp['type'] = 'array';
            for (let x of currObj) {
                this.addSubModalString(x, 'customArray');
            }
        } else {
            // If it is a dict
            this.customProp['key'] = '';
            this.customProp['type'] = 'dict';
            this.customProp.set('customDict', new Map());

            let curr = JSON.stringify(currObj);
            curr = curr.substring(1, curr.length - 2); // Removes bracket and trailing quote (fencepost problem)
            let split = curr.split('",');
            for (let i of split) {
                const key = i.slice(1, i.indexOf(':') - 1); // Removes Preceding and trailing quote
                const value = i.slice(i.indexOf(':') + 2); // Removes Preceding quote

                this.addSubModalDictString(key, value, 'customDict');
            }
        }

        this.openLargeSubModal(modal);
    }

    isMultipart() {
        if (this.object_type !== 'email-message') return;

        this.question.value = this.form.controls['is_multipart'].value;
        if (this.question.value[0] === 'true') {
            this.form.controls['body'].disable();
            this.form.controls['body_multipart'].enable();
        } else {
            this.form.controls['body'].enable();
            this.form.controls['body_multipart'].disable();
        }
    }

    setHashType() {
        this.question.relString = this.form.controls['hashes'].value;
    }

    inputUpdate(event) {
        this.checkDuplicates.emit();
    }

    onYearSelected(normalizedYear: Date, questionKey: string): void {
        const ctrl = this.form.get(questionKey);
        const updated = this.guidedService.applyNewYear(normalizedYear, ctrl?.value || new Date());
        if (updated) ctrl?.setValue(updated);
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    updateTimezone(field: string, timezone) {
        this.stixService.timezones[field] = timezone;
    }

    trimLabel(str: string): string {
        if (str.endsWith('*')) return str.substring(0, str.length - 1);
        else return str;
    }

    getHeading(obj) {
        const type = obj?.extensions?.[this.form.value.id]?.extension_type;
        if (type) return obj.id + ' (' + type + ')';
        else return obj.id;
    }

    filterText(type: string) {
        if (this.question instanceof KillChainQuestion || this.question instanceof RelationshipQuestion) {
            if (this.question instanceof KillChainQuestion && typeof this.question.value == 'string') {
                this.stixService.killChainType = this.question.value;
            }
            if (this.question.value !== undefined) {
                this.filteredStringArr = [];
                setTimeout(() => {
                    this.filteredStringArr = this.defaultStringArr.filter((elem) =>
                        elem.toLowerCase().includes(this.question.value.toLowerCase().trim())
                    );
                });
            }
        } else if (this.question instanceof BundleObjectsQuestion) {
            if (this.question.value !== undefined) {
                this.filteredStringArr = [];
                setTimeout(() => {
                    this.filteredStringArr = this.defaultStringArr.filter((elem) =>
                        elem.id.toLowerCase().includes(this.question.value.toLowerCase().trim())
                    );
                });
            }
        } else if (this.question instanceof ProtocolArrayQuestion) {
            this.filteredStringArr = [];
            setTimeout(() => {
                this.filteredStringArr = this.defaultStringArr.filter((elem) =>
                    elem.value.toLowerCase().includes(this.newString.toLowerCase().trim())
                );
            });
        } else if (this.question instanceof SightingQuestion || this.question instanceof MimeQuestion) {
            this.filteredStringArr = [];
            setTimeout(() => {
                this.filteredStringArr = this.defaultStringArr.filter((elem) =>
                    elem.value.toLowerCase().includes(this.question.relString.toLowerCase().trim())
                );
            });
        } else if (this.question instanceof RefQuestion || this.question instanceof HybridQuestion) {
            this.filteredStringArr = [];
            setTimeout(() => {
                this.filteredStringArr = this.defaultStringArr.filter((elem) =>
                    elem.id.toLowerCase().includes(this.question.relString.toLowerCase().trim())
                );
            });
        } else if (
            this.question instanceof ReferenceArrayQuestion ||
            this.question instanceof RefArrayQuestion ||
            this.question instanceof SCORefsQuestion ||
            this.question instanceof SCOReferenceArrayQuestion ||
            this.question instanceof HybridArrayQuestion
        ) {
            this.filteredStringArr = [];
            setTimeout(() => {
                this.filteredStringArr = this.defaultStringArr.filter((elem) => elem.id.toLowerCase().includes(this.newString.toLowerCase().trim()));
            });
        } else {
            this.filteredStringArr = [];
            setTimeout(() => {
                this.filteredStringArr = this.defaultStringArr.filter((elem) => elem.toLowerCase().includes(this.newString.toLowerCase().trim()));
            });
        }
    }

    get relationshipOptions(): string[] {
        if (this.question instanceof RelationshipQuestion) {
            const rawValue = this.question.value;
            const searchValue = (typeof rawValue === 'string' ? rawValue : '').toLowerCase().trim();
            if (!searchValue) {
                return this.question.arrOptions || [];
            }
            return (this.question.arrOptions || []).filter((opt) => opt.toLowerCase().includes(searchValue));
        }
        return this.filteredStringArr;
    }

    getPhaseNames(): string[] {
        if (this.stixService.killChainType == 'lockheed-martin-cyber-kill-chain') {
            this.defaultStringArr = ['reconnaissance', 'weaponization', 'delivery', 'exploitation', 'installation', 'command-and-control'];

            this.filteredStringArr = ['reconnaissance', 'weaponization', 'delivery', 'exploitation', 'installation', 'command-and-control'];
        } else if (this.stixService.killChainType == 'mitre-attack') {
            this.defaultStringArr = [
                'reconnaissance',
                'resource-development',
                'initial-access',
                'execution',
                'persistence',
                'privilege-escalation',
                'defence-evasion',
                'credential-access',
                'discovery',
                'lateral-movement',
                'collection',
                'command-and-control',
                'exfiltration',
                'impact',
            ];

            this.filteredStringArr = [
                'reconnaissance',
                'resource-development',
                'initial-access',
                'execution',
                'persistence',
                'privilege-escalation',
                'defence-evasion',
                'credential-access',
                'discovery',
                'lateral-movement',
                'collection',
                'command-and-control',
                'exfiltration',
                'impact',
            ];
        } else {
            this.defaultStringArr = [];
            this.filteredStringArr = [];
        }

        return this.filteredStringArr;
    }

    getObjectById(id) {
        return this.stixService.bundle.objects.find((obj) => obj.id === id);
    }
}

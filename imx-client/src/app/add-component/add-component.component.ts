import { OnInit, OnDestroy, Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { ObjectsViewerComponent } from '../objects-viewer/objects-viewer.component';
import { STIX_OBJECTS } from '../models/stix-objects';
import { StixService } from '../stix-service.service';
import { GuidedService } from '../guided.service';
import { ExternalReference } from '../models/external-reference';
import { GranularMarking } from '../models/granular-marking';
import { Content } from '../models/content';
import { COMPONENT_MAP } from '../models/component-map';
import { Artifact } from '../models/artifact';
import { AttackPattern } from '../models/attack-pattern';
import { Autonomous } from '../models/autonomous';
import { Campaign } from '../models/campaign';
import { Coa } from '../models/coa';
import { Directory } from '../models/directory';
import { DomainName } from '../models/domain-name';
import { EmailAddress } from '../models/email-address';
import { EmailMessage } from '../models/email-message';
import { Grouping } from '../models/grouping';
import { Identity } from '../models/identity';
import { Incident } from '../models/incident';
import { Indicator } from '../models/indicator';
import { Infrastructure } from '../models/infrastructure';
import { IntrusionSet } from '../models/intrusion-set';
import { Ipv4Addr } from '../models/ipv4';
import { Ipv6Addr } from '../models/ipv6';
import { LanguageContent } from '../models/language-content';
import { ExtensionDefinition } from '../models/extension-definition';
import { MacAddress } from '../models/mac-address';
import { Malware } from '../models/malware';
import { MalwareAnalysis } from '../models/malware-analysis';
import { MarkingDefinition } from '../models/marking-definition';
import { Mutex } from '../models/mutex';
import { NetworkTraffic } from '../models/network-traffic';
import { Note } from '../models/note';
import { ObservedData } from '../models/observed-data';
import { ObservedString } from '../models/observed-string';
import { Opinion } from '../models/opinion';
import { Process } from '../models/process';
import { Relationship } from '../models/relationship';
import { Report } from '../models/report';
import { Sighting } from '../models/sighting';
import { Software } from '../models/software';
import { ThreatActor } from '../models/threat-actor';
import { Tool } from '../models/tool';
import { Url } from '../models/url';
import { UserAccount } from '../models/user-account';
import { Vulnerability } from '../models/vulnerability';
import { WindowsRegistryKey } from '../models/windows-registry-key';
import { XCert } from '../models/x-cert';
import { File } from '../models/file';
import { Location } from '../models/location';
import { faEdit, faTrash, faFileImport, faTimes, faIdCard, faStickyNote, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { NoteDialogComponent } from './note-dialog-component/note-dialog-component.component';
import { EnvService } from '../env-service/env.service';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { db } from '../db.service';
import { Extension } from '../models/extension';
import { X509V3Extensions } from '../extensions/predefined/x509_v3_extensions';

@Component({
    selector: 'app-add-component',
    templateUrl: './add-component.component.html',
    styleUrls: ['./add-component.component.css'],
    standalone: false,
})
export class AddComponentComponent implements OnInit, OnDestroy {
    @Input() objectSelectionInput: any;
    @Input() objectPropertyTypeSelectionInput: any;
    @Input() queryParams: any;
    @Output() guidedUIEvent: EventEmitter<any>;
    @Output() relationshipAdded: EventEmitter<void>;

    faEdit = faEdit;
    faTrash = faTrash;
    faFileImport = faFileImport;
    faRevoke = faTimes;
    faIdCard = faIdCard;
    faNote = faStickyNote;
    faAlert = faExclamationTriangle;

    questions: QuestionBase<any>[];
    componentId: string;
    errorList: string[] = [];
    componentMap = COMPONENT_MAP;
    currentComponent?: FormModel;
    currentComponentForDuplicates?: FormModel;
    duplicates: any = [];
    kill_chain_phases: {};
    storedIdentities: any;
    openNewWindow: boolean;
    cisaId = '';
    requiredMessage = '';
    isLoading = false;

    deletable_notes: Set<string> = new Set();

    private cancelDuplicates$ = new Subject<void>();
    EXT_ID = 'extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498';

    constructor(
        private readonly activatedRoute: ActivatedRoute,
        private readonly router: Router,
        public stixService: StixService,
        public guidedService: GuidedService,
        private readonly modalService: NgbModal,
        private readonly envService: EnvService,
        private readonly announcementService: AnnouncementService
    ) {
        this.guidedUIEvent = new EventEmitter();
        this.relationshipAdded = new EventEmitter();

        this.componentMap.set('artifact', new Artifact(stixService));
        this.componentMap.set('attack-pattern', new AttackPattern(stixService));
        this.componentMap.set('autonomous-system', new Autonomous(stixService));
        this.componentMap.set('campaign', new Campaign(stixService));
        this.componentMap.set('course-of-action', new Coa(stixService));
        this.componentMap.set('directory', new Directory(stixService));
        this.componentMap.set('domain-name', new DomainName(stixService));
        this.componentMap.set('email-addr', new EmailAddress(stixService));
        this.componentMap.set('email-message', new EmailMessage(stixService));
        this.componentMap.set('file', new File(stixService));
        this.componentMap.set('grouping', new Grouping(stixService));
        this.componentMap.set('identity', new Identity(stixService));
        this.componentMap.set('incident', new Incident(stixService));
        this.componentMap.set('indicator', new Indicator(stixService));
        this.componentMap.set('infrastructure', new Infrastructure(stixService));
        this.componentMap.set('intrusion-set', new IntrusionSet(stixService));
        this.componentMap.set('ipv4-addr', new Ipv4Addr(stixService));
        this.componentMap.set('ipv6-addr', new Ipv6Addr(stixService));
        this.componentMap.set('location', new Location(stixService));
        this.componentMap.set('mac-addr', new MacAddress(stixService));
        this.componentMap.set('malware-analysis', new MalwareAnalysis(stixService));
        this.componentMap.set('malware', new Malware(stixService));
        this.componentMap.set('marking-definition', new MarkingDefinition(stixService));
        this.componentMap.set('mutex', new Mutex(stixService));
        this.componentMap.set('network-traffic', new NetworkTraffic(stixService));
        this.componentMap.set('note', new Note(stixService));
        this.componentMap.set('observed-data', new ObservedData(stixService));
        this.componentMap.set('observed-string', new ObservedString(stixService));
        this.componentMap.set('opinion', new Opinion(stixService));
        this.componentMap.set('process', new Process(stixService));
        this.componentMap.set('relationship', new Relationship(stixService));
        this.componentMap.set('report', new Report(stixService));
        this.componentMap.set('sighting', new Sighting(stixService));
        this.componentMap.set('software', new Software(stixService));
        this.componentMap.set('threat-actor', new ThreatActor(stixService));
        this.componentMap.set('tool', new Tool(stixService));
        this.componentMap.set('url', new Url(stixService));
        this.componentMap.set('user-account', new UserAccount(stixService));
        this.componentMap.set('vulnerability', new Vulnerability(stixService));
        this.componentMap.set('windows-registry-key', new WindowsRegistryKey(stixService));
        this.componentMap.set('x509-certificate', new XCert(stixService));
        this.componentMap.set('language-content', new LanguageContent(stixService));
        this.componentMap.set('extension-definition', new ExtensionDefinition(stixService));

        this.openNewWindow = false;
    }

    redirectIfNotGuided() {
        if (!this.stixService.guidedUI) {
            this.componentId = this.activatedRoute.snapshot.paramMap.get('component-id') || '';
            if (!this.componentId) this.router.navigate(['/bundle']);

            this.currentComponent = this.componentMap.get(this.componentId) as FormModel;
            if (!this.currentComponent) {
                this.router.navigate(['/bundle']);
            }

            this.activatedRoute.queryParams.subscribe((params) => {
                this.updateComponent(params);
            });
        }
    }

    ngOnInit(): void {
        if (this.stixService.guidedUI && this.objectSelectionInput) {
            this.stixService.getData().subscribe((data) => {
                switch (data.type) {
                    case 'create-relationship':
                    case 'create-sighting':
                        this.updateComponent(data, false);
                        break;
                }
            });

            this.componentId = this.objectSelectionInput.routeName;
            this.currentComponent = this.componentMap.get(this.componentId) as FormModel;

            this.isLoading = true;
            this.initialSetup({}).then(() => {
                this.isLoading = false;
            });
        }

        this.redirectIfNotGuided();

        this.loadLocalIdentities();
        this.cisaId = this.envService.env.defaultIdentity.id;

        window.scrollTo(0, 0);
    }

    setQuestionValueHistory(routeEvent) {
        if (history.state.source && this.componentId && routeEvent) {
            for (let q of this.questions) {
                if (q.key === 'target_ref') {
                    q.value = history.state.target.id;
                }
                if (q.key === 'source_ref') {
                    q.value = history.state.source.id;
                }
            }
        }
    }

    setQuestionValueSourceAndTarget(routeEvent, params) {
        if (this.componentId && !routeEvent && params.value.target && params.value.source) {
            for (let q of this.questions) {
                if (q.key === 'target_ref') {
                    q.value = params.value.target.id;
                    q.relString = params.value.target.id;
                } else if (q.key === 'source_ref') {
                    q.value = params.value.source.id;
                    q.relString = params.value.source.id;
                }
            }
        }
    }

    setQuestionValueSighting(routeEvent, params) {
        if (this.componentId && !routeEvent && params.value.sighting) {
            for (let q of this.questions) {
                if (q.key === 'sighting_of_ref' && params.value.sighting.length > 0) {
                    q.value = params.value.sighting[0];
                    q.relString = params.value.sighting[0];
                }
            }
        }
    }

    ifStringArrayHasQKey(q_key, s) {
        if (this.stixService.stringArrays.has(q_key)) {
            let newStringArray = this.stixService.stringArrays.get(q_key);

            if (newStringArray.indexOf(s) == -1) {
                newStringArray.push(s);
                this.stixService.stringArrays.set(q_key, newStringArray);
            }
        } else {
            this.stixService.stringArrays.set(q_key, [s]);
        }
    }

    setPristineQuestionKeyMatch(control, sdoToEdit, q_key, key, currQuestion, addNonBlankDropdown) {
        let validControlList = ['dropdown', 'tooltip-dropdown', 'tracked-dropdown'];
        if (addNonBlankDropdown) validControlList.push('nonblankdropdown');

        if (control == 'hash-array' || control == 'string-dict') {
            let dict = sdoToEdit[q_key];

            for (let x in dict) {
                let s = x + ': ' + dict[x];

                this.ifStringArrayHasQKey(q_key, s);
            }
        } else if (Array.isArray(sdoToEdit[key])) {
            this.stixService.stringArrays.set(currQuestion.key, sdoToEdit[key]);
        } else if (validControlList.includes(control)) {
            currQuestion.value = [];
            currQuestion.value.push(sdoToEdit[key].toString());
        } else if (q_key == 'definition') {
            currQuestion.value = sdoToEdit[key].tlp ?? sdoToEdit[key].statement;
        } else {
            currQuestion.value = sdoToEdit[key];
        }

        return currQuestion.value;
    }

    setPristinQuestionPhaseName(sdoToEdit) {
        for (let a in sdoToEdit['kill_chain_phases']) {
            let str = sdoToEdit['kill_chain_phases'][a]['phase_name'] + ': ' + sdoToEdit['kill_chain_phases'][a]['kill_chain_name'];

            if (this.stixService.stringArrays.has('killChain')) {
                let newStringArray = this.stixService.stringArrays.get('killChain');

                if (newStringArray.indexOf(str) == -1) {
                    newStringArray.push(str);
                    this.stixService.stringArrays.set('killChain', newStringArray);
                }
            } else this.stixService.stringArrays.set('killChain', [str]);
        }
    }

    setPristineQuestion(pristineQuestions, revoked, revocation, modelKeys, sdoToEdit, notInit, new_version, type) {
        modelKeys.forEach((key: string) => {
            let isKeyFound = false;

            for (let currQuestion of pristineQuestions) {
                currQuestion.readonly = this.setPristineQuestionReadOnly(currQuestion, revoked, revocation, new_version, type);

                let control = currQuestion.controlType;
                let q_key = currQuestion.key;

                if (currQuestion.key === key) {
                    currQuestion.value = this.setPristineQuestionKeyMatch(control, sdoToEdit, q_key, key, currQuestion, true);

                    isKeyFound = true;
                    break;
                }

                if (q_key == 'phase_name') {
                    this.setPristinQuestionPhaseName(sdoToEdit);
                }

                if (notInit && q_key === 'incident_description') {
                    currQuestion.value = sdoToEdit['description'];
                }

                if (notInit && q_key === 'url_value') {
                    currQuestion.value = sdoToEdit['value'];
                }
            }

            if (!isKeyFound) {
                console.warn(`Key ${key} not found in model ${this.componentId}`);
                let tempKeys = [
                    'object_marking_refs',
                    'labels',
                    'granular_markings',
                    'external_references',
                    'extensions',
                    'value',
                    'description',
                    'x509_v3_extensions',
                    'kill_chain_phases',
                ];

                const killChainTypes = ['attack-pattern', 'indicator', 'infrastructure', 'malware', 'tool'];
                if (tempKeys.indexOf(key) == -1 && sdoToEdit[key] != undefined) {
                    if (
                        !(
                            (key == 'x509_v3_extensions' && type == 'x509-certificate') ||
                            (key == 'kill_chain_phases' && killChainTypes.includes(type))
                        )
                    )
                        this.stixService.toplevel.push([key, sdoToEdit[key]]);
                }
            }
        });

        return pristineQuestions;
    }

    ifSdoToEditGranularMarkings(sdoToEdit) {
        if (sdoToEdit['granular_markings']) {
            for (let x in sdoToEdit['granular_markings']) {
                let mynewguy: GranularMarking = new GranularMarking(
                    sdoToEdit['granular_markings'][x]['selectors'],
                    sdoToEdit['granular_markings'][x]['lang'],
                    sdoToEdit['granular_markings'][x]['marking_ref']
                );
                mynewguy = this.cleanObject(mynewguy);

                this.stixService.granularMarkings.push(mynewguy);
            }
        }

        this.stixService.granularMarkings = sdoToEdit['granular_markings'] ?? [];
    }

    ifSdoToEditExternalReferences(sdoToEdit) {
        if (sdoToEdit['external_references']) {
            for (let x in sdoToEdit['external_references']) {
                let mynewguy: ExternalReference = new ExternalReference(
                    sdoToEdit['external_references'][x]['source_name'],
                    sdoToEdit['external_references'][x]['description'],
                    sdoToEdit['external_references'][x]['url'],
                    sdoToEdit['external_references'][x]['hashes'],
                    sdoToEdit['external_references'][x]['external_id']
                );
                mynewguy = this.cleanObject(mynewguy);
                this.stixService.externalReferences.push(mynewguy);
            }
        }
    }

    moveIncidentCoreSdoToEdit(sdoToEdit) {
        // Moves Incident Core Extension
        if (
            sdoToEdit['type'] == 'incident' &&
            sdoToEdit['extensions'] &&
            sdoToEdit['extensions']['extension-definition--ef765651-680c-498d-9894-99799f2fa126']
        ) {
            this.stixService.editedIncidentCore = sdoToEdit['extensions']['extension-definition--ef765651-680c-498d-9894-99799f2fa126'];
            delete sdoToEdit['extensions']['extension-definition--ef765651-680c-498d-9894-99799f2fa126'];
            let more = sdoToEdit['extensions'].length != 0; //Need to make sure this an array not an object

            if (!more) {
                delete sdoToEdit['extensions'];
            }
        }

        return sdoToEdit;
    }

    moveMalwareCorpusSdoToEdit(sdoToEdit) {
        // Moves Malware Corpus
        if (
            sdoToEdit['type'] == 'malware' &&
            sdoToEdit['extensions'] &&
            sdoToEdit['extensions']['extension-definition--8e9e338f-c9ee-4d4f-8cac-85b4dcfdf3c1']
        ) {
            this.stixService.editedMalwareCorpus = sdoToEdit['extensions']['extension-definition--8e9e338f-c9ee-4d4f-8cac-85b4dcfdf3c1'];
            delete sdoToEdit['extensions']['extension-definition--8e9e338f-c9ee-4d4f-8cac-85b4dcfdf3c1'];
            let more = sdoToEdit['extensions'].length != 0; //Need to make sure this an array not an object

            if (!more) {
                delete sdoToEdit['extensions'];
            }
        }

        return sdoToEdit;
    }

    getGranularMarkingSelectors(string, checkThis) {
        let selectors = [];
        selectors.push(string);

        if (checkThis && this[string]) selectors.push(string); //Check to see if this is necessary??

        return selectors;
    }

    ifSdoToEditExtensions(sdoToEdit) {
        if (sdoToEdit['extensions']) {
            for (let extension in sdoToEdit['extensions']) {
                const extensionObj = sdoToEdit['extensions'][extension];

                const component: any = new Extension('', '', new Map());

                // I'm also clueless why we have an Extension class with these properties that we are not using, and need to delete...
                delete component.extension_id;
                delete component.extension_type;
                delete component.extensions;

                component[extension] = extensionObj;

                if (JSON.stringify(component).includes('"extension_type":"toplevel-property-extension"')) {
                    component[extension] = {
                        extension_type: 'toplevel-property-extension',
                    };
                }

                if (!component['extension-definition--8053ffa0-dec7-4aef-870e-a56d0082cf69']) this.stixService.extensions.push(component);
            }
        }
    }

    ifSdoToEditX509(sdoToEdit) {
        if (sdoToEdit['x509_v3_extensions']) {
            const x509 = sdoToEdit['x509_v3_extensions'];

            const component = new X509V3Extensions();

            //Again, not sure why we are using these classes if we're not going to use any of the properties...
            for (let prop in component) {
                if (!component[prop]) delete component[prop];
            }

            delete component.extension_id;
            delete component.extension_type;

            component['x509_v3_extensions'] = x509;

            this.stixService.extensions.push(component);
        }
    }

    ifSdoToEditContents(sdoToEdit, isInit) {
        if (sdoToEdit['contents']) {
            let contTmp = [];

            if (isInit) {
                for (let x in sdoToEdit['contents']) {
                    let mynewguy: Content = new Content(
                        sdoToEdit['contents'][x]['lang'],
                        sdoToEdit['contents'][x]['fieldName'],
                        sdoToEdit['contents'][x]['fields']
                    );
                    mynewguy = this.cleanObject(mynewguy);

                    this.stixService.contents.push(mynewguy);
                }
            } else {
                if (Array.isArray(sdoToEdit['contents'])) contTmp = sdoToEdit['contents'];
                else contTmp.push(this.stixService.convertLanguageContentsToRawData(sdoToEdit['contents']));

                let content: Content = new Content(contTmp[0]['lang'], contTmp[0]['fieldName'], contTmp[0]['fields']);
                content = this.cleanObject(content);
                this.stixService.contents.push(content);
            }
        }
    }

    ifSdoToEditValues(sdoToEdit) {
        if (sdoToEdit['values']) {
            this.stixService.modalObjectArray = sdoToEdit['values'];
        } else if (sdoToEdit['body_multipart']) {
            this.stixService.modalObjectArray = sdoToEdit['body_multipart'];
        } else if (sdoToEdit['contents']) {
            this.stixService.modalObjectArray = this.stixService.contents;
        }
    }

    ifSdoToEditExtensionProperties(sdoToEdit) {
        if (sdoToEdit['extension_properties']) {
            this.stixService.toplevelProperties = sdoToEdit['extension_properties'];
        }
    }

    ifCurrentComponentGranularMarkings() {
        if (this.currentComponent.hasGranularMarkings()) this.currentComponent.setGranularMarkings(this.stixService.granularMarkings);
    }

    ifCurrentComponentExternalReferences() {
        if (this.currentComponent.hasExternalReferences()) this.currentComponent.setExternalReferences(this.stixService.externalReferences);
    }

    ifCurrentComponentObjectMarkingReferences(checkGuided) {
        if (this.currentComponent.hasObjectMarkingReferences()) {
            if (checkGuided && this.stixService.guidedUI) {
                if (this.stixService.objectMarkingReferencesTemp.length > 0) {
                    this.currentComponent.setObjectMarkingRefs(this.stixService.objectMarkingReferencesTemp);
                    this.stixService.objectMarkingReferencesTemp = [];
                } else {
                    this.currentComponent.setObjectMarkingRefs(this.stixService.objectMarkingReferences);
                }
            } else {
                this.currentComponent.setObjectMarkingRefs(this.stixService.objectMarkingReferences);
            }
        }
    }

    setExtensionsBasedOffProp(extensions, prop, ext) {
        if (prop === 'x509_v3_extensions') {
            this.currentComponent['x509_v3_extensions'] = ext[prop];
        } else if (prop.startsWith('extension-definition')) {
            //If Toplevel property, properties are added to the object and removed from the extension
            if (ext[prop].extension_type && ext[prop].extension_type === 'toplevel-property-extension') {
                extensions[prop] = ext[prop];
            } else if (ext[prop].extension_type && ext[prop].extension_type === 'property-extension') {
                extensions[prop] = ext[prop];

                for (let key in ext) {
                    if (key === prop || key === 'extension_type') break;

                    extensions[prop][key] = ext[key];
                }
            }
        } else if (prop.endsWith('-ext') || prop == 'x509_v3_extensions') {
            //For extensions that ends with -ext, just add them as is
            extensions[prop] = ext[prop];
        }

        return extensions;
    }

    ifCurrentComponentExtentions(checkObjs) {
        if (this.currentComponent.hasExtensions()) {
            let objs = this.stixService.extensions;
            let extensions = {};

            if (checkObjs && objs.length > 0) {
                for (let ext of objs) {
                    for (let prop in ext) {
                        extensions = this.setExtensionsBasedOffProp(extensions, prop, ext);
                    }
                }

                this.currentComponent.setExtensions(JSON.parse(JSON.stringify(extensions)));
            } else {
                this.currentComponent.setExtensions(this.stixService.extensions);
            }
        }
    }

    ifCurrentComponentContents() {
        if (this.currentComponent.hasContents()) this.currentComponent.setContents(this.stixService.contents);
    }

    ifRevocation(revocation) {}

    async updateComponent(params, routeEvent = true) {
        this.isLoading = true;

        let revocation = history?.state?.data?.revocation ?? params.revocation;

        this.stixService.revocation = revocation;

        if (history.state.data) {
            history.state.data.new_version = false;
            history.state.data.revocation = false;
        }

        this.questions = this.currentComponent.getQuestions();

        this.clearSpecVersionIfMissing();
        this.setQuestionValueHistory(routeEvent);
        this.setQuestionValueSourceAndTarget(routeEvent, params);
        this.setQuestionValueSighting(routeEvent, params);

        const itemToEdit = await db.getItemBeingEdited();

        if (itemToEdit) {
            this.stixService.isEditing = true;
            let sdoToEdit = itemToEdit;

            if (sdoToEdit != '') {
                this.stixService.origID = 'zzz' + sdoToEdit['id'];
                this.stixService.externalReferences = [];
                this.stixService.granularMarkings = [];
                this.stixService.extensions = [];
                this.stixService.editedExtension = undefined;
                this.stixService.toplevel = [];
                this.stixService.objectMarkingReferences = [];
                this.stixService.contents = [];
                this.stixService.stringArrays = new Map<string, string[]>();
                this.stixService.modalObjectArray = [];
                this.stixService.promptDelete = [];

                let pristineQuestions = this.currentComponent.getQuestions();
                let revoked = sdoToEdit['revoked'] === true;

                if(sdoToEdit?.type === 'identity') {
                    this.injectEmailPhoneSocialIntoSDO(sdoToEdit);
                }
                const modelKeys = Object.keys(sdoToEdit);
                this.stixService.revoked = revoked;

                pristineQuestions = this.setPristineQuestion(
                    pristineQuestions,
                    revoked,
                    revocation,
                    modelKeys,
                    sdoToEdit,
                    true,
                    undefined,
                    undefined
                );

                if(sdoToEdit?.type === 'identity') {
                    let phoneQuestion: any = pristineQuestions.find(q => q.key === 'contact_number');
                    if(phoneQuestion) {
                        phoneQuestion.phoneType = sdoToEdit.phone_type || '';
                    }

                    let emailQuestion: any = pristineQuestions.find(q => q.key === 'email_address_ref');
                    if(emailQuestion) {
                        emailQuestion.emailAddressType = sdoToEdit.email_digital_contact_type || '';
                    }

                    let socialQuestion: any = pristineQuestions.find(q => q.key === 'user_account_ref');
                    if(socialQuestion) {
                        socialQuestion.socialMediaType = sdoToEdit.social_digital_contact_type || '';
                    }
                }

                this.ifSdoToEditGranularMarkings(sdoToEdit);
                this.ifSdoToEditExternalReferences(sdoToEdit);

                sdoToEdit = this.moveIncidentCoreSdoToEdit(sdoToEdit);
                sdoToEdit = this.moveMalwareCorpusSdoToEdit(sdoToEdit);

                this.ifSdoToEditExtensions(sdoToEdit);
                this.ifSdoToEditX509(sdoToEdit);
                this.ifSdoToEditContents(sdoToEdit, false);
                this.ifSdoToEditValues(sdoToEdit);
                this.ifSdoToEditExtensionProperties(sdoToEdit);

                this.stixService.objectMarkingReferences = sdoToEdit['object_marking_refs'] ?? [];

                this.ifCurrentComponentGranularMarkings();
                this.ifCurrentComponentExternalReferences();
                this.ifCurrentComponentObjectMarkingReferences(false);
                this.ifCurrentComponentExtentions(false);
                this.ifCurrentComponentContents();

                this.questions = pristineQuestions;
                await db.clearItemBeingEdited();
                this.clearSpecVersionIfMissing();

                this.stixService.notes = new Map();
                this.stixService.new_notes = new Map();
            }
        } else {
            this.stixService.externalReferences = [];
            this.stixService.granularMarkings = [];
            this.stixService.extensions = [];
            this.stixService.editedExtension = undefined;
            this.stixService.toplevel = [];

            if (!this.stixService.guidedUI) {
                this.stixService.objectMarkingReferences = [];
            }
            this.stixService.contents = [];
            this.stixService.stringArrays = new Map<string, string[]>();

            if (this.componentId === 'report' && !this.doesBundleHaveReport()) {
                this.stixService.stringArrays.set('object_refs', this.populateObjRefsforReport());
            }

            this.stixService.modalObjectArray = [];
            this.stixService.revoked = false;
            this.stixService.customObjReadOnly = false;
            this.stixService.modifyingCustomObj = false;
            this.stixService.isEditing = false;
            this.stixService.notes = new Map();
            this.stixService.new_notes = new Map();
        }
        this.isLoading = false;
    }

    doesBundleHaveReport(): boolean {
        for (let obj of this.stixService.bundle.objects) {
            if (obj.type === 'report') {
                return true;
            }
        }

        return false;
    }

    addCISAIdentity(obj: any) {
        this.stixService.addComponent(obj);
    }

    guidedUIEventHandler(event) {
        if (event.type === 'update-primary-properties') {
            setTimeout(() => {
                this.setFavorites();
                this.setDisablePrimaryProperties();
            }, 300);
        }
    }

    setFavorites() {
        // Favorite object [{type: 'autonomous-system', properties: ['name', 'rir']}];
        let localFavorites: any = localStorage.getItem('favorite-attributes');
        if (localFavorites) {
            localFavorites = JSON.parse(localFavorites);

            let foundFavorite = null;

            let tempFound = this.questions.find((q) => {
                foundFavorite = localFavorites.find((f) => f.type === q.value);
                if (foundFavorite) {
                    return true;
                }
                return false;
            });

            if (tempFound) {
                foundFavorite.properties.forEach((p) => {
                    let question = this.questions.find((q) => q.key === p);
                    if (question) {
                        question.favorite = true;
                    }
                });
            }
        }
    }

    setDisablePrimaryProperties() {
        if (!this.questions.some((q) => (q.required || q.favorite) && !q.readonly)) {
            const questionsFavorited = {
                type: 'disable-primary-properties',
                value: this.questions,
            };
            this.stixService.sendData(questionsFavorited);
        } else {
            const questionsFavorited = {
                type: 'enable-primary-properties',
                value: this.questions,
            };
            this.stixService.sendData(questionsFavorited);
        }
    }

    setPristineQuestionReadOnly(currQuestion, revoked, revocation, new_version, type) {
        if (new_version && type) {
            let validKey = [];

            switch (type) {
                case 'location':
                    validKey = ['created'];
                    break;
                case 'attack-pattern':
                case 'campaign':
                case 'identity':
                case 'incident':
                case 'infrastructure':
                case 'intrusion-set':
                case 'course-of-action':
                case 'threat-actor':
                case 'tool':
                case 'vulnerability':
                    validKey = ['created', 'name'];
                    break;
                case 'grouping':
                    validKey = ['created', 'context', 'object_refs'];
                    break;
                case 'indicator':
                    validKey = ['created', 'pattern', 'pattern_type', 'valid_from'];
                    break;
                case 'language-content':
                    validKey = ['created', 'object_ref', 'contents'];
                    break;
                case 'malware':
                    validKey = ['created', 'is_family'];
                    break;
                case 'malware-analysis':
                    validKey = ['created', 'product'];
                    break;
                case 'note':
                    validKey = ['created', 'content', 'object_refs'];
                    break;
                case 'observed-data':
                    validKey = ['created', 'first_observed', 'last_observed', 'number_observed'];
                    break;
                case 'opinion':
                    validKey = ['created', 'opinion', 'object_refs'];
                    break;
                case 'report':
                    validKey = ['created', 'name', 'published', 'object_refs'];
                    break;
                case 'relationship':
                    validKey = ['created', 'relationship_type', 'source_ref', 'target_ref'];
                    break;
                case 'sighting':
                    validKey = ['created', 'sighting_of_ref'];
                    break;
                case 'extension-definition':
                    validKey = ['created', 'name', 'schema', 'version', 'extension_types'];
                    break;
            }

            if (validKey.includes(currQuestion.key)) return true;
            return false;
        }

        return false;
    }

    setComponentExtensionIdProp(toplevel_props, sdoToEdit, component, extension_id) {
        for (let prop of toplevel_props) {
            if (sdoToEdit[prop] != undefined) component[extension_id][prop] = sdoToEdit[prop];
        }

        return component;
    }

    ifInitSdoToEditExtensions(sdoToEdit) {
        if (sdoToEdit['extensions']) {
            let extensions_str = JSON.stringify(sdoToEdit['extensions']);
            extensions_str = extensions_str.substring(1, extensions_str.length - 1); // Contents of extensions (removes the braces)

            let extensions = extensions_str.replace(/},/g, '},,').split(',,');

            // For each extension object
            let len = extensions.length;
            for (let x = 0; x < len; x++) {
                // x in y loop will not work

                // Combines cases where a single extension was split incorrectly (because it has a }')
                while (extensions[x].split('{').length - 1 != extensions[x].split('}').length - 1) {
                    extensions[x] = extensions[x] + ',' + extensions[x + 1];
                    let temp = extensions[x + 1];
                    extensions = extensions.filter((obj) => obj !== temp);
                    len = len - 1; // this is why it would not work
                }

                // Reformats the extension and pushes it to extensions on stixService
                let json = '{' + extensions[x] + '}';
                let component = JSON.parse(json);

                // Adds toplevel properties back to the extension if applicable
                if (extensions[x].includes('"extension_type":"toplevel-property-extension"')) {
                    let extension_id = extensions[x].substring(1, 59); // Hard coding pulling the id
                    let parentExtension = this.stixService.getObjectFromID(extension_id);
                    let toplevel_props = parentExtension.extension_properties;

                    component = this.setComponentExtensionIdProp(toplevel_props, sdoToEdit, component, extension_id);
                }

                component.getGranularMarkingSelectors = this.getGranularMarkingSelectors('extensions', true);
                this.stixService.extensions.push(component);
            }
        }
    }

    checkForReport() {
        if (this.componentId === 'report' && !this.doesBundleHaveReport())
            this.stixService.stringArrays.set('object_refs', this.populateObjRefsforReport());
    }

    async initialSetup(params) {
        let new_version = history?.state?.data?.new_version ?? params.new_version;

        let revocation = history?.state?.data?.revocation ?? params.revocation;

        this.stixService.revocation = revocation;

        if (history.state.data) {
            history.state.data.new_version = false;
            history.state.data.revocation = false;
        }

        this.questions = this.currentComponent.getQuestions();

        this.clearSpecVersionIfMissing();

        this.setQuestionValueHistory(true);

        const itemToEdit = await db.getItemBeingEdited();
        if (itemToEdit) {
            this.stixService.isEditing = true;
            let sdoToEdit = itemToEdit;
            if (sdoToEdit != '') {
                this.stixService.externalReferences = [];
                this.stixService.granularMarkings = [];
                this.stixService.extensions = [];
                this.stixService.toplevel = [];
                this.stixService.objectMarkingReferences =
                    this.stixService.objectMarkingReferences.length > 0 && this.stixService.guidedUI ? this.stixService.objectMarkingReferences : [];
                this.stixService.contents = [];
                this.stixService.stringArrays = new Map<string, string[]>();
                this.stixService.modalObjectArray = [];

                let pristineQuestions = this.currentComponent.getQuestions();
                let revoked = sdoToEdit['revoked'] === true;
                let type = undefined;

                const modelKeys = Object.keys(sdoToEdit);
                this.stixService.revoked = revoked;

                pristineQuestions = this.setPristineQuestion(pristineQuestions, revoked, revocation, modelKeys, sdoToEdit, false, new_version, type);

                this.ifSdoToEditGranularMarkings(sdoToEdit);
                this.ifSdoToEditExternalReferences(sdoToEdit);

                this.ifInitSdoToEditExtensions(sdoToEdit);

                this.ifSdoToEditX509(sdoToEdit);
                this.ifSdoToEditContents(sdoToEdit, true);
                this.ifSdoToEditValues(sdoToEdit);
                this.ifSdoToEditExtensionProperties(sdoToEdit);

                this.stixService.objectMarkingReferences = sdoToEdit['object_marking_refs'] ?? [];

                this.ifCurrentComponentGranularMarkings();
                this.ifCurrentComponentExternalReferences();
                this.ifCurrentComponentObjectMarkingReferences(false);
                this.ifCurrentComponentExtentions(false);
                this.ifCurrentComponentContents();

                this.questions = pristineQuestions;
                await db.clearItemBeingEdited();

                this.clearSpecVersionIfMissing();
            }
        } else {
            this.stixService.externalReferences = [];
            this.stixService.granularMarkings = [];
            this.stixService.extensions = [];
            this.stixService.toplevel = [];
            this.stixService.objectMarkingReferences =
                this.stixService.objectMarkingReferences.length > 0 && this.stixService.guidedUI ? this.stixService.objectMarkingReferences : [];
            this.stixService.contents = [];
            this.stixService.stringArrays = new Map<string, string[]>();

            this.checkForReport();

            this.stixService.modalObjectArray = [];
            this.stixService.revoked = false;
            this.stixService.customObjReadOnly = false;
            this.stixService.modifyingCustomObj = false;
            this.stixService.isEditing = false;
        }

        this.setFavorites();
        this.setDisablePrimaryProperties();
    }

    loadLocalIdentities() {
        const idStorage = localStorage.getItem('identities');
        if (idStorage) {
            try {
                this.storedIdentities = JSON.parse(idStorage);
            } catch (e) {
                console.error('Error parsing saved identities with message: ', e);
            }
        }
    }

    // The reason for the copy is that if we edit component directly, we edit the bundle because of the linkages going on.
    getJsonDisplayForComponent(component): any {
        let copy: any = this.copyObj(component); // Create a copy for displaying purposes

        if (copy.contents && typeof copy.contents === 'object' && copy.contents.length > 0) {
            let contentsString = '';

            for (let curr of copy.contents) {
                let newContent = new Content();
                newContent.lang = curr.lang;
                newContent.fields = curr.fields;
                newContent.fieldName = curr.fieldName;
                contentsString += '{' + newContent.toString() + '},';
            }

            contentsString = contentsString.slice(0, -1); // Remove the last comma
            copy.contents = JSON.parse(`[ ${contentsString} ]`);
        }

        return copy;
    }

    public async editObject(stixObject): Promise<void> {
        // Set Modified with current time for new_version
        if (stixObject.modified) {
            stixObject.modified = new Date().toISOString();
        }

        this.stixService.objectFromClient = stixObject;
        await db.saveItemBeingEdited(stixObject);

        let url = this.router.serializeUrl(this.router.createUrlTree(['/add-component/' + stixObject.type]));

        if (this.openNewWindow) {
            url = url + '?new_version=true';
            window.open(url, '_blank');
        } else {
            // Route using same tab, used for debugging
            this.router.navigate([url], { queryParams: { new_version: true } });
        }
        window.scrollTo(0, 0);
    }

    removeObject(id: string) {
        this.stixService.removeFromIdentityLocalStorage(id);
        if (this.compareIdentity(id)) localStorage.setItem('identity', this.envService.env.defaultIdentity.id);
        this.loadLocalIdentities();
    }

    public async revokeObject(stixObject): Promise<void> {
        // Set Modified with current time for revocation
        if (stixObject.modified) {
            stixObject.modified = new Date().toISOString();
        }

        this.stixService.objectFromClient = stixObject;
        await db.saveItemBeingEdited(stixObject);

        let url = this.router.serializeUrl(this.router.createUrlTree(['/add-component/' + stixObject.type]));

        if (this.openNewWindow) {
            url = url + '?revocation=true';
            window.open(url, '_blank');
        } else {
            // Route using same tab, used for debugging
            this.router.navigate([url], { queryParams: { revocation: true } });
        }
    }

    checkDuplicates(componentData: any) {
        // Duplicates are always searched on the Default server, regardless of which server is selected
        if (!this.envService.env?.taxiiServer?.url) return;

        const missingAttributes = localStorage.getItem('missing-attributes');
        if (missingAttributes?.includes('spec_version')) {
            componentData['spec_version'] = '';
        }

        this.cancelDuplicates$.next();

        this.duplicates = [];
        this.stixService.duplicates = [];

        this.currentComponentForDuplicates = this.currentComponent;
        this.currentComponentForDuplicates.populateFromJSON(componentData, this.stixService);

        let checkDuplicates: Observable<any> = null;
        checkDuplicates = this.stixService.checkDuplicates(this.currentComponentForDuplicates, true);

        checkDuplicates?.pipe(takeUntil(this.cancelDuplicates$)).subscribe((d: any) => {
            if (d.body?.founds?.length > 0) {
                let dupsFound = [];
                let rcPairs = [];
                d.body.founds.forEach((o) => {
                    dupsFound.push(o.object);
                    rcPairs.push(o.fcPairs);
                });

                this.duplicates.push({
                    original: this.currentComponentForDuplicates,
                    duplicated: dupsFound,
                    rcPairs: rcPairs,
                });
                this.stixService.duplicates = this.duplicates;

                const existingToast = this.announcementService.toasts.find((t) => t.heading === 'Duplicate Warning');
                if (existingToast) {
                    this.announcementService.remove(existingToast);
                }

                const count = dupsFound.length;
                const message = count === 1 ? '1 duplicate object found in the database' : `${count} duplicate objects found in the database`;
                const toastId = this.stixService.annoucementID + 1;
                this.announcementService.show(
                    'Duplicate Warning',
                    message,
                    'warn',
                    false,
                    undefined,
                    undefined,
                    undefined,
                    {
                        label: 'View Duplicates',
                        callback: () => {
                            this.viewDuplicates(null, this.currentComponentForDuplicates);
                            const toast = this.announcementService.toasts.find((t) => t.id === toastId);
                            if (toast) {
                                this.announcementService.remove(toast);
                            }
                        },
                    },
                    5000
                );
            }
        });
    }

    isDuplicated() {
        return this.duplicates.length > 0;
    }

    ngOnDestroy() {
        this.cancelDuplicates$.next();
        this.cancelDuplicates$.complete();
    }

    @HostListener('click', ['$event'])
    viewDuplicates(event, component) {
        if (event) {
            if (
                event.target.localName.includes('img') ||
                event.target.localName.includes('button') ||
                event.target.localName.includes('svg') ||
                event.target.closest('button')
            ) {
                event.stopPropagation();
            } else {
                return;
            }
        }

        if (!component?.id) {
            return;
        }

        let duplicates = this.duplicates.find((d: any) => d.original && d.original.id === component.id);

        if (duplicates) {
            let duplicated = [...duplicates.duplicated];
            let rcPairs = [...duplicates.rcPairs];

            if (duplicated.length > 0) {
                this.openObjectViewerModal(
                    duplicated,
                    rcPairs,
                    'Duplicated Objects',
                    'Existing similar objects across all roots and collections on the Default server.'
                );
            }
        }
    }

    getDuplicateCount(component): number {
        if (!this.duplicates || !component) return 0;

        let duplicates = this.duplicates.find((d: any) => d.original.id === component.id);

        return duplicates?.duplicated?.length ?? 0;
    }

    openObjectViewerModal(objects, rcPairs, title, description = null) {
        const modalRef = this.modalService.open(ObjectsViewerComponent, { size: 'xl' });
        modalRef.componentInstance.objects = objects;
        modalRef.componentInstance.rcPairs = rcPairs;
        modalRef.componentInstance.title = title;
        modalRef.componentInstance.description = description;
        // This component only opens the viewer for duplicates, which are always searched on Default
        modalRef.componentInstance.useDefaultServerRoots = true;
    }

    openNoteDialogModal() {
        const modalRef = this.modalService.open(NoteDialogComponent, { size: 'xl', modalDialogClass: 'modal-note' });
        modalRef.componentInstance.type = this.getComponentDisplayName();
        modalRef.componentInstance.notes = this.stixService.notes;
        modalRef.componentInstance.new_notes = this.stixService.new_notes;
        modalRef.componentInstance.deletable_notes = this.deletable_notes;
        modalRef.componentInstance.objectId = this.currentComponent['id'];
    }

    convertComponentDataPropToUTC(componentData) {
        for (let prop in this.stixService.timezones) {
            if (this.stixService.timezones[prop].length > 0 && this.stixService.timezones[prop] != 'Select Time Zone' && componentData[prop]) {
                componentData[prop] = this.stixService.convertToUTC(prop, componentData[prop]);
            }
        }

        return componentData;
    }

    checkIsGuidedSetObjectRefs() {
        if (this.stixService.guidedUI && this.guidedService.isGuidedReport) {
            if (this.componentId === 'report' && !this.doesBundleHaveReport()) {
                this.stixService.stringArrays.set('object_refs', this.populateObjRefsforReport());
            }
        }
    }

    ifCurrentComponentTypeIsIncident() {
        if (this.currentComponent['type'] == 'incident') {
            if (this.stixService.currentIncidentCoreExtension['isEnabled']) {
                delete this.stixService.currentIncidentCoreExtension['isEnabled'];

                if (!this.currentComponent['extensions'] || Array.isArray(this.currentComponent['extensions'])) {
                    this.currentComponent['extensions'] = {};
                }

                this.currentComponent['extensions']['extension-definition--ef765651-680c-498d-9894-99799f2fa126'] =
                    this.stixService.currentIncidentCoreExtension;
            }
        }
    }

    ifCurrentComponentTypeIsMalware() {
        if (this.currentComponent['type'] == 'malware') {
            if (this.stixService.currentMalwareCorpus['isEnabled']) {
                delete this.stixService.currentMalwareCorpus['isEnabled'];

                if (!this.currentComponent['extensions'] || Array.isArray(this.currentComponent['extensions'])) {
                    this.currentComponent['extensions'] = {};
                }

                this.currentComponent['extensions']['extension-definition--8e9e338f-c9ee-4d4f-8cac-85b4dcfdf3c1'] =
                    this.stixService.currentMalwareCorpus;
            }
        }
    }

    ifCurrentComponentTypeIsArtifact() {
        if (this.currentComponent['type'] == 'artifact') {
            if (!this.currentComponent['extensions'] || Array.isArray(this.currentComponent['extensions'])) {
                this.currentComponent['extensions'] = {};
            }
            this.currentComponent['extensions']['extension-definition--8053ffa0-dec7-4aef-870e-a56d0082cf69'] = {
                extension_type: 'toplevel-property-extension',
            };
        }
    }

    ifCurrentComponentTypeIsObservedString() {
        if (this.currentComponent['type'] == 'observed-string') {
            if (!this.currentComponent['extensions'] || Array.isArray(this.currentComponent['extensions'])) {
                this.currentComponent['extensions'] = {};
            }
            this.currentComponent['extensions']['extension-definition--8b1aa84c-5532-4c69-a8e7-b6170facfd3d'] = { extension_type: 'new-sco' };
        }
    }

    setLocalStorageNewVersionObjects(componentData) {
        //If creating new version save it to a local cache to keep track of new versions
        if (this.activatedRoute.snapshot.queryParamMap.get('new_version') === 'true') {
            const new_version_objects = JSON.parse(localStorage.getItem('new_version_objects'));

            if (!new_version_objects) localStorage.setItem('new_version_objects', JSON.stringify([componentData.id]));
            else {
                if (!new_version_objects.includes(componentData.id)) {
                    new_version_objects.push(componentData.id);
                }

                //Object Refs is being set to an empty string... why?
                if (componentData.type == 'report' && componentData.object_refs) {
                    componentData.object_refs?.forEach((ref) => {
                        if (!new_version_objects.includes(ref)) new_version_objects.push(ref);
                    });
                }

                localStorage.setItem('new_version_objects', JSON.stringify(new_version_objects));
            }
        }
    }

    copyObj(obj) {
        let tempObj = {};

        for (let field in obj) {
            tempObj[field] = obj[field];
        }

        return tempObj;
    }

    addComponent(componentData: any): void {
        this.isLoading = true;
        try {
            componentData = this.convertComponentDataPropToUTC(componentData);

            this.stixService.timezones = {};
            this.stixService.selectorValidation();

            this.checkIsGuidedSetObjectRefs();

            if(componentData.type === 'identity') {
                let emailQuestion: any = this.questions.find(q => q.key === 'email_address_ref');
                let phoneQuestion: any = this.questions.find(q => q.key === 'contact_number');
                let socialQuestion: any = this.questions.find(q => q.key === 'user_account_ref');

                // Phone/Email/Social Type
                if(emailQuestion.emailAddressType && emailQuestion.emailAddressType.trim() !== '')
                    componentData.email_digital_contact_type = emailQuestion.emailAddressType;
                if(phoneQuestion.phoneType && phoneQuestion.phoneType.trim() !== '')
                    componentData.contact_number_type = phoneQuestion.phoneType;
                if(socialQuestion.socialMediaType && socialQuestion.socialMediaType.trim() !== '')
                    componentData.social_digital_contact_type = socialQuestion.socialMediaType;

                // Phone/Email/Social Classification
                if(emailQuestion.emailClassified && emailQuestion.emailClassified.trim() !== '')
                    componentData.email_classified = emailQuestion.emailClassified;
                if(phoneQuestion.phoneClassified && phoneQuestion.phoneClassified.trim() !== '')
                    componentData.phone_classified = phoneQuestion.phoneClassified;
                if(socialQuestion.socialClassified && socialQuestion.socialClassified.trim() !== '')
                    componentData.social_classified = socialQuestion.socialClassified;

                // Phone/Email/Social Description
                if(emailQuestion.emailDescription && emailQuestion.emailDescription.trim() !== '')
                    componentData.email_description = emailQuestion.emailDescription;
                if(phoneQuestion.phoneDescription && phoneQuestion.phoneDescription.trim() !== '')
                    componentData.phone_description = phoneQuestion.phoneDescription;
                if(socialQuestion.socialDescription && socialQuestion.socialDescription.trim() !== '')
                    componentData.social_description = socialQuestion.socialDescription;
            }

            this.currentComponent.populateFromJSON(componentData, this.stixService);

            // Check for Identity Type Extensions
            if(componentData.type === 'identity') {
                let identityExtension = this.buildIdentityExtension(componentData);
                if(identityExtension) {
                    this.stixService.extensions.push(identityExtension);
                }
            }

            // Check that extension fields exist, if not remove
            if(this.stixService.isEditing && componentData.type === 'identity') {
                // Determine if extension-related fields still exist in componentData
                let hasPhone = componentData.contact_number && componentData.contact_number.trim()!== '';
                let hasEmail = componentData.email_address_ref && componentData.email_address_ref.trim()!== '';
                let hasSocial = componentData.user_account_ref && componentData.user_account_ref.trim()!== '';

                // If editing and NO relevant fields exist => remove the extension
                if(this.stixService.isEditing && !hasPhone && !hasEmail && !hasSocial) {
                    let existingExtIndex = this.stixService.extensions?.findIndex(ext => ext[this.EXT_ID]);
                    if(this.stixService.extensions && this.stixService.extensions[existingExtIndex]?.[this.EXT_ID]) {
                        delete this.stixService.extensions[existingExtIndex][this.EXT_ID];
                        if(Object.keys(this.stixService.extensions).length === 0) { delete this.stixService.extensions; }
                    }
                }
            }

            this.ifCurrentComponentGranularMarkings();
            this.ifCurrentComponentExtentions(true);
            this.ifCurrentComponentTypeIsIncident();
            this.ifCurrentComponentTypeIsMalware();
            this.ifCurrentComponentTypeIsArtifact();
            this.ifCurrentComponentTypeIsObservedString();
            this.ifCurrentComponentExternalReferences();
            this.ifCurrentComponentContents();
            this.ifCurrentComponentObjectMarkingReferences(true);

            if (this.currentComponent['type'] == 'extension-definition' && this.stixService.customTypesToAdd.length > 0) {
                let types = JSON.parse(localStorage.getItem('custom-types') || '{}');
                types[this.currentComponent['id']] = this.stixService.customTypesToAdd;
                this.stixService.customTypesToAdd = [];
                localStorage.setItem('custom-types', JSON.stringify(types));
                this.stixService.customTypes = types;
            }

            for (let prop of this.stixService.toplevel) {
                if (prop[0] !== 'kill_chain_phases') this.currentComponent[prop[0]] = prop[1];
            }

            this.stixService.externalReferences = [];
            this.stixService.granularMarkings = [];
            this.stixService.extensions = [];
            this.stixService.toplevel = [];

            if (!this.stixService.guidedUI) {
                this.stixService.objectMarkingReferences = [];
            }

            this.stixService.contents = [];
            this.stixService.stringArrays = new Map<string, string[]>();

            this.stixService.revoked = false;
            this.stixService.customObjReadOnly = false;
            this.stixService.modifyingCustomObj = false;
            this.stixService.isEditing = false;

            this.currentComponent = this.cleanObject(this.currentComponent);

            // Add to bundle and local cache in service
            this.stixService
                .addComponent(this.copyObj(this.currentComponent))
                .then(() => {
                    if (this.stixService.guidedUI && (componentData.type === 'relationship' || componentData.type === 'sighting')) {
                        this.relationshipAdded.emit();
                    }
                })
                .finally(() => {
                    if (this.stixService.guidedUI) {
                        this.isLoading = false;
                    }
                });

            this.stixService.killChainExternalReferences = [];
            this.currentComponent = this.componentMap.get(this.componentId) as FormModel;
            this.questions = this.currentComponent.getQuestions();

            this.clearSpecVersionIfMissing();

            if (this.stixService.new_notes.size > 0) {
                this.stixService.new_notes.forEach((value, key) => this.stixService.addComponent(this.copyObj(value)));
            }

            this.setLocalStorageNewVersionObjects(componentData);

            if (!this.stixService.guidedUI) {
                this.router.navigate(['/bundle']);
            }
        } catch (err) {
            console.error(err);
            this.isLoading = false;
        }
    }

    cleanObjIsHashes(myobject, x) {
        if (myobject[x] !== undefined && Object.keys(myobject[x]).length == 0) {
            delete myobject[x];
        }

        return myobject;
    }

    cleanObjIsValuesOrBodyMultipart(myobject, x) {
        if (this.stixService.modalObjectArray.length === 0) {
            delete myobject[x];
        } else {
            myobject[x] = this.stixService.modalObjectArray;
        }

        return myobject;
    }

    cleanObjIsContents(myobject, x) {
        if (this.stixService.modalObjectArray.length == 0) {
            delete myobject[x];
        } else {
            const contentObject = this.stixService.convertLanguageContentsToObject(this.stixService.modalObjectArray);
            myobject[x] = contentObject;
        }

        return myobject;
    }

    preflightCleanObject(myobject, x) {
        if (myobject[x] === undefined || myobject[x] === '' || myobject[x] === null) {
            delete myobject[x];
        } else if (
            (myobject[x] instanceof Array && myobject[x].length == 0) ||
            myobject[x] instanceof StixService ||
            (myobject[x].size && myobject[x].size == 0)
        ) {
            delete myobject[x];
        } else if (
            typeof myobject[x] != 'string' &&
            typeof myobject[x] != 'number' &&
            typeof myobject[x] != 'boolean' &&
            Object.prototype.toString.call(myobject[x]) !== '[object Date]'
        ) {
            let string = JSON.stringify(myobject[x]);
            if (string === '{}') delete myobject[x];
        }

        return myobject;
    }

    cleanObject(myobject: any) {
        for (let x in myobject) {
            myobject = this.preflightCleanObject(myobject, x);

            switch (x) {
                case 'hashes':
                    myobject = this.cleanObjIsHashes(myobject, x);
                    break;
                case 'values':
                case 'body_multipart':
                    myobject = this.cleanObjIsValuesOrBodyMultipart(myobject, x);
                    break;
                case 'contents':
                    myobject = this.cleanObjIsContents(myobject, x);
                    break;
                case 'revoked':
                case 'defanged':
                case 'is_service_account':
                case 'is_privileged':
                case 'is_disabled':
                case 'can_escalate_privs':
                case 'is_family':
                case 'is_active':
                case 'is_hidden':
                case 'summary':
                case 'description':
                case 'is_multipart':
                    if (myobject[x] === '') {
                        delete myobject[x];
                    }
                    break;
                case 'same':
                case 'last_source_target':
                    if (myobject instanceof Relationship) {
                        delete myobject[x];
                    }
                    break;
                case 'email_address_ref':
                case 'contact_number':
                case "contact_number_type":
                case "email_digital_contact_type":
                case "user_account_ref":
                case "social_digital_contact_type":
                case 'first_name':
                case 'middle_name':
                case 'last_name':
                case 'prefix':
                case 'suffix':
                case 'websites':
                case "phone_type":
                    delete myobject[x];
                    break;
                case 'loaded':
                case '':
                case undefined:
                case null:
                    delete myobject[x];
                    break;
            }
        }

        return myobject;
    }

    getComponentDisplayName(): string {
        for (let obj of STIX_OBJECTS) {
            for (let obj2 of obj.objects) {
                if (obj2.routeName === this.componentId) return obj2.displayName;
            }
        }

        return this.componentId;
    }

    isIdentity() {
        return this.componentId?.toLowerCase() === 'identity';
    }

    hasExternalReferences(): boolean {
        return this.currentComponent?.hasExternalReferences();
    }

    hasContents(): boolean {
        return this.currentComponent?.hasContents();
    }

    hasGranularMarkings(): boolean {
        return this.currentComponent?.hasGranularMarkings();
    }

    hasExtensions(): boolean {
        return this.currentComponent?.hasExtensions();
    }

    hasObjectMarkingReferences(): boolean {
        return this.currentComponent?.hasObjectMarkingReferences();
    }

    currentObject(): any {
        return this.currentComponent;
    }

    populateObjRefsforReport(): string[] {
        let objIds = [];
        this.stixService.bundle.objects.forEach((obj) => objIds.push(obj.id));
        this.stixService.customObjects.forEach((obj) => objIds.push(obj.id));
        return objIds;
    }

    setMainIdentity(id: string): void {
        return localStorage.setItem('identity', id);
    }

    compareIdentity(id: string): boolean {
        return localStorage.getItem('identity') === id;
    }

    clearSpecVersionIfMissing() {
        const questionSpec = this.questions.find((q) => q.key === 'spec_version');
        const missingAttributes = localStorage.getItem('missing-attributes');
        if (missingAttributes && questionSpec && missingAttributes.includes('spec_version')) {
            questionSpec.value = '';
        }
    }

    buildIdentityExtension(componentData: any) {
        // let identity: any = this.currentComponent;
        let identity: any = componentData;
        let phone = identity.contact_number?.trim() || '';
        let emailRef = identity.email_address_ref?.trim() || '';
        let socialRef = identity.user_account_ref?.trim() || '';

        let hasPhone = phone !== '';
        let hasEmail = emailRef !== '';
        let hasSocial = socialRef !== '';

        // If no contact value is present, return null
        if (!hasPhone && !hasEmail && !hasSocial) { return null; }


        // Build the base extension object
        const identityExtension: any = {};

        identityExtension[this.EXT_ID] = {
            "extension_type": 'property-extension'
        };

        // Build Generic Fields
        let genericExtension: any = {};
        const addIf = (key: string, value: any) => {
            if(value && value.toString().trim() !== ''){
                genericExtension[key] = value;
            }
        }

        addIf('first_name', identity.first_name);
        addIf('middle_name', identity.middle_name);
        addIf('last_name', identity.last_name);
        addIf('prefix', identity.prefix[0]);
        addIf('suffix', identity.suffix[0]);

        let websites = this.stixService.stringArrays.get("websites");
        if(websites && websites.length > 0) genericExtension['websites'] = websites;

        Object.assign(identityExtension[this.EXT_ID], genericExtension);

        if(hasPhone) {
            let phoneType = identity.contact_number_type?.trim() || '';
            let phoneDescription = identity.phone_description?.trim() || '';
            let phoneClassified = identity.phone_classified?.[0] === 'true';

            let phoneObject: any = {
                contact_number: phone,
                classified: phoneClassified
            }

            if(phoneType) phoneObject.contact_number_type = phoneType;
            if(phoneDescription) phoneObject.description = phoneDescription;

            identityExtension[this.EXT_ID].contact_numbers = [phoneObject];
        }

        if(hasEmail) {
            let emailType = identity.email_digital_contact_type?.trim() || '';
            let emailDescription = identity.email_description?.trim() || '';
            let emailClassified = identity.email_classified?.[0] === 'true';

            let emailObject: any = {
                email_address_ref: emailRef,
                classified: emailClassified
            }

            if(emailType) emailObject.digital_contact_type = emailType;
            if(emailDescription) emailObject.description = emailDescription;

            identityExtension[this.EXT_ID].email_addresses = [emailObject];
        }

        if(hasSocial) {
            let socialType = identity.social_digital_contact_type?.trim() || '';
            let socialDescription = identity.social_description?.trim() || '';
            let socialClassified = identity.social_classified?.[0] === 'true';

            let socialObject: any = {
                user_account_ref: socialRef,
                classified: socialClassified
            }

            if(socialType) socialObject.digital_contact_type = socialType;
            if(socialDescription) socialObject.description = socialDescription;

            identityExtension[this.EXT_ID].social_media_accounts = [socialObject];
        }

        return identityExtension;
    }

    injectEmailPhoneSocialIntoSDO(sdoToEdit: any) {
        const ext = sdoToEdit.extensions?.[this.EXT_ID];
        if(!ext) return;

        // Inject Generic Identity Fields
        if(ext.first_name && ext.first_name !== '')
            sdoToEdit.first_name = ext.first_name;
        if(ext.middle_name && ext.middle_name !== '')
            sdoToEdit.middle_name = ext.middle_name;
        if(ext.last_name && ext.last_name !== '')
            sdoToEdit.last_name = ext.last_name;
        if(ext.prefix && ext.prefix !== '')
            sdoToEdit.prefix = ext.prefix;
        if(ext.suffix && ext.suffix !== '')
            sdoToEdit.suffix = ext.suffix;
        if(ext.websites && ext.websites.length > 0)
            sdoToEdit.websites = ext.websites;


        // Inject Phone Number
        let phone = ext.contact_numbers?.[0]?.contact_number;

        if(phone) {
            let phoneType = ext.contact_numbers?.[0]?.contact_number_type;
            let phoneClassified = ext.contact_numbers?.[0]?.classified;
            let phoneDescription = ext.contact_numbers?.[0]?.description;

             sdoToEdit.contact_number = phone;
             sdoToEdit.phone_type = phoneType;
             sdoToEdit.phone_classified = phoneClassified ? true : false;
             sdoToEdit.phone_description = phoneDescription;
        }

        // Inject Email Address Reference
        let emailRef = ext.email_addresses?.[0]?.email_address_ref;

        if(emailRef) {
            let emailType = ext.email_addresses?.[0]?.digital_contact_type;
            let emailClassified = ext.email_addresses?.[0]?.classified;
            let emailDescription = ext.email_addresses?.[0]?.description;

            sdoToEdit.email_address_ref = emailRef;
            sdoToEdit.email_digital_contact_type = emailType;
            sdoToEdit.email_classified = emailClassified ? true : false;
            sdoToEdit.email_description = emailDescription;
        }

        // Inject Social Media Reference
        let socialRef = ext.social_media_accounts?.[0]?.user_account_ref;

        if(socialRef) {
            let socialType = ext.social_media_accounts?.[0]?.digital_contact_type;
            let socialClassified = ext.social_media_accounts?.[0]?.classified;
            let socialDescription = ext.social_media_accounts?.[0]?.description;

            sdoToEdit.user_account_ref = socialRef;
            sdoToEdit.social_digital_contact_type = socialType;
            sdoToEdit.social_classified = socialClassified ? true : false;
            sdoToEdit.social_description = socialDescription;
        }
    }
}

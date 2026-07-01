import { v4 as uuid } from 'uuid';
import { Observable, of } from 'rxjs';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { IdentityQuestion } from '../dynamic-form-component/question-types/question-identity';
import { StringArrayQuestion } from '../dynamic-form-component/question-types/question-string-array';
import { OpenVocabArrayQuestion } from '../dynamic-form-component/question-types/question-ov-array';
import { KillChainQuestion } from '../dynamic-form-component/question-types/question-kill-chain';
import { PhaseNameQuestion } from '../dynamic-form-component/question-types/question-phase-name';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { StixService } from '../stix-service.service';
import { LANGUAGES } from './languages';
import { Content } from './content';
import { Window } from './window';

export class Infrastructure extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    created?: string;
    modified?: string;
    created_by_ref?: string;
    revoked?: boolean;
    labels?: string[];
    confidence?: number;
    lang?: string;
    external_references?: ExternalReference[];
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    name?: string;
    description?: string;
    infrastructure_types?: string[];
    aliases?: string[];
    first_seen?: string;
    last_seen?: string;
    kill_chain_phases?: any[];
    kill_chain_name?: string;
    phase_name?: string;
    loaded?: boolean = false;

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        created?: string | '',
        modified?: string | '',
        created_by_ref?: string | '',
        revoked?: boolean,
        labels?: string[] | [],
        confidence?: number,
        lang?: string | '',
        external_references?: ExternalReference[] | [],
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        name?: string | '',
        description?: string | '',
        infrastructure_types?: string[] | [],
        aliases?: string[] | [],
        first_seen?: string | '',
        last_seen?: string | '',
        kill_chain_phases?: any[] | [],
        kill_chain_name?: string | '',
        phase_name?: string | ''
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.created = created;
        this.modified = modified;
        this.created_by_ref = created_by_ref;
        this.revoked = revoked;
        this.labels = labels;
        this.confidence = confidence;
        this.lang = lang;
        this.external_references = external_references;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
        this.name = name;
        this.description = description;
        this.infrastructure_types = infrastructure_types;
        this.aliases = aliases;
        this.first_seen = first_seen;
        this.last_seen = last_seen;
        this.kill_chain_name = kill_chain_name;
        this.phase_name = phase_name;
        this.kill_chain_phases = [];
    }

    getWindows(): Window[] {
        return [];
    }
    getContents(): Content[] {
        return [];
    }

    getExternalReferences(): ExternalReference[] {
        return this.external_references || [];
    }

    getGranularMarkings(): GranularMarking[] {
        return this.granular_markings || [];
    }
    getExtensions(): Extension[] {
        return this.extensions || [];
    }

    getQuestions(): QuestionBase<any>[] {
        let questions: QuestionBase<any>[] = [
            new TextboxQuestion({
                key: 'type',
                label: 'Type',
                value: 'infrastructure',
                required: true,
                order: 2,
                type: 'text',
                readonly: true,
                columnWidth: 'col-2 type',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'id',
                label: 'ID',
                value: `infrastructure--${uuid()}`,
                validatorFn: (componentData: any) => {
                    const id = componentData.id;
                    const idRegex = new RegExp('^infrastructure--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (!idRegex.test(id))
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with 'infrastructure--' and followed by a UUID (i.e. opinion--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                        };
                    return {
                        valid: true,
                    };
                },
                required: true,
                order: 1,
                type: 'text',
                readonly: true,
                columnWidth: 'col-5 id',
                nonGuidedCol: 'col-12 pe-5',
            }),
            new TextboxQuestion({
                key: 'spec_version',
                label: 'Spec Ver.',
                value: '2.1',
                readonly: true,
                columnWidth: 'col-1 spec-version',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 3,
            }),
            new DatetimeQuestion({
                key: 'created',
                label: 'Created*',
                columnWidth: 'col-2 created',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 4,
            }),
            new DatetimeQuestion({
                key: 'modified',
                label: 'Modified*',
                validatorFn: (componentData: any) => {
                    // Check whether Modified Date is equal or after to Created Date
                    let createdDateTime = Date.parse(componentData['created']);
                    let modifiedDateTime = Date.parse(componentData['modified']);

                    if (modifiedDateTime && modifiedDateTime < createdDateTime && !this.stixService.newObject) {
                        return {
                            valid: false,
                            errorMessage: 'Modified date must be after created date.',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-2 modified',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 5,
            }),
            new TextboxQuestion({
                key: 'name',
                label: 'Name*',
                order: 6,
                required: true,
                columnWidth: 'col-3 name',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'description',
                label: 'Description',
                order: 7,
                required: false,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
            }),
            new TextboxQuestion({
                key: 'confidence',
                label: 'Confidence',
                validatorFn: (componentData: any) => {
                    const confidence = componentData.confidence;
                    const confidenceRegex = new RegExp('^(?:100|[1-9]?[0-9])$');
                    if (confidence) {
                        if (!confidenceRegex.test(confidence))
                            return {
                                valid: false,
                                errorMessage: 'Confidence value must be an integer in the range of 0-100',
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-2 confidence',
                nonGuidedCol: 'col-6 pe-5',
                order: 8,
                required: false,
                type: 'number',
            }),
            new IdentityQuestion({
                key: 'created_by_ref',
                label: 'Created By Ref',
                validatorFn: (componentData: any) => {
                    const created_by_ref = componentData.created_by_ref;
                    const created_by_refRegex = new RegExp('identity--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}');
                    if (created_by_ref != '') {
                        if (!created_by_refRegex.test(created_by_ref))
                            return {
                                valid: false,
                                errorMessage:
                                    "Must begin with 'identity--' and followed by a UUID (i.e. identity--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                relString: this.created_by_ref,
                order: 11,
                required: false,
                columnWidth: 'col-4 created-by-ref',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'lang',
                label: 'Language',
                options: LANGUAGES,
                order: 10,
                required: false,
                columnWidth: 'col-3 language',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'revoked',
                label: 'Revoked',
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'd-none',
                revokedCol: 'col-6 pe-5',
                order: 16,
            }),

            new DatetimeQuestion({
                key: 'first_seen',
                label: 'First Seen',
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 12,
            }),
            new DatetimeQuestion({
                key: 'last_seen',
                label: 'Last Seen',
                validatorFn: (componentData: any) => {
                    // Check whether Last Seen Date is equal or after to First Seen Date
                    componentData['first_seen'] = this.stixService.convertToUTC('first_seen', componentData['first_seen']);
                    componentData['last_seen'] = this.stixService.convertToUTC('last_seen', componentData['last_seen']);
                    const validfromDateTime = Date.parse(componentData['first_seen']);
                    const validuntilDateTime = Date.parse(componentData['last_seen']);

                    if (validuntilDateTime && validuntilDateTime < validfromDateTime) {
                        return {
                            valid: false,
                            errorMessage: 'Last Seen date must be after First Seen date.',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 13,
            }),
            new PhaseNameQuestion({
                key: 'phase_name',
                label: 'Phase Name',
                columnWidth: 'col-6',
                order: 25,
                relString: this.kill_chain_name,
                nonGuidedCol: 'col-12 pe-5',
            }),
            new KillChainQuestion({
                key: 'kill_chain_name',
                label: 'Kill Chain Name',
                validatorFn: (componentData: any) => {
                    let phase_name = componentData.phase_name;
                    let kill_chain_name = componentData.kill_chain_name;

                    if (this.stixService.kill_chainTrack) {
                        questions.find((i) => i.key == 'kill_chain_name').value = '';
                        this.stixService.kill_chainTrack = false;
                    }
                    if (kill_chain_name === undefined || kill_chain_name === '') {
                        questions.find((i) => i.key == 'phase_name').relString = '';
                        questions.find((i) => i.key == 'phase_name').arrOptions = [];
                    } else {
                        questions.find((i) => i.key == 'phase_name').relString = kill_chain_name;
                        questions.find((i) => i.key == 'phase_name').arrOptions = [
                            'reconnaissance',
                            'weaponization',
                            'delivery',
                            'exploitation',
                            'installation',
                            'command-and-control',
                        ];
                    }
                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-12 pe-5',
                order: 24,
                relString: this.phase_name,
            }),
            new OpenVocabArrayQuestion({
                key: 'infrastructure_types',
                label: 'Infrastructure Types',
                multiple: true,
                options: [
                    // { key: '', value: '' },
                    { key: 'amplification', value: 'Amplification' },
                    { key: 'anonymization', value: 'Anonymization' },
                    { key: 'botnet', value: 'Botnet' },
                    { key: 'command-and-control', value: 'Command and Control' },
                    { key: 'exfiltration', value: 'Exfiltration' },
                    { key: 'hosting-malware', value: 'Hosting Malware' },
                    { key: 'hosting-target-lists', value: 'Hosting Target Lists' },
                    { key: 'phishing', value: 'Phishing' },
                    { key: 'reconnaissance', value: 'Reconnaissance' },
                    { key: 'staging', value: 'Staging' },
                    { key: 'unknown', value: 'Unknown' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 15,
                marginRight: true,
            }),
            new StringArrayQuestion({
                key: 'aliases',
                label: 'Aliases',
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                revokedCol: 'col-12 pe-5',
                order: 17,
            }),
        ];

        return questions.sort((a, b) => a.order - b.order);
    }

    hasX509V3Extensions(): boolean {
        return false;
    }

    hasWindows(): boolean {
        return false;
    }

    hasContents(): boolean {
        return false;
    }

    hasExternalReferences(): boolean {
        return true;
    }

    hasGranularMarkings(): boolean {
        return true;
    }

    hasExtensions(): boolean {
        return true;
    }

    hasObjectMarkingReferences(): boolean {
        return true;
    }

    populateFromJSON(componentData: any, stixService: StixService): void {
        this.type = componentData.type;
        this.id = componentData.id;
        this.created_by_ref = componentData.created_by_ref;
        this.spec_version = componentData.spec_version;
        this.name = componentData.name;
        this.description = componentData.description;
        this.confidence = parseInt(componentData.confidence) || undefined;
        this.created = componentData.created;
        this.modified = componentData.modified;
        this.revoked = JSON.parse(componentData.revoked[0] || '""');
        this.lang = componentData.lang[0];
        this.external_references = componentData.external_references;
        this.labels = stixService.stringArrays.get('labels') || [];
        this.aliases = stixService.stringArrays.get('aliases') || [];
        this.infrastructure_types = stixService.stringArrays.get('infrastructure_types') || [];
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
        this.kill_chain_phases = [];

        if ((stixService.stringArrays.get('killChain') || []).length > 0) {
            this.kill_chain_phases = [];
            for (let x in stixService.stringArrays.get('killChain')) {
                let obj = {};
                let tuple = stixService.stringArrays.get('killChain')[x].split(': ');
                obj['kill_chain_name'] = tuple[1];
                obj['phase_name'] = tuple[0];
                this.kill_chain_phases.push(obj);
            }
        }
        delete this.phase_name;
        delete this.kill_chain_name;

        this.first_seen = componentData.first_seen;
        this.last_seen = componentData.last_seen;
    }
    setWindows(newWindows: Window[]): void {
        // N/a
    }

    setExternalReferences(newExternalReferences: ExternalReference[]): void {
        this.external_references = newExternalReferences;
    }
    setContents(newContents: Content[]): void {
        // N/a
    }

    setGranularMarkings(newGranularMarkings: GranularMarking[]): void {
        this.granular_markings = newGranularMarkings;
    }

    setExtensions(newExtensions: Extension[]): void {
        this.extensions = newExtensions;
    }
    setObjectMarkingRefs(newObjectMarkingRefs: string[]): void {
        this.object_marking_refs = newObjectMarkingRefs;
    }
}

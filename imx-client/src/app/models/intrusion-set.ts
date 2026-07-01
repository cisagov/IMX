import { v4 as uuid } from 'uuid';
import { Observable, of } from 'rxjs';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { IdentityQuestion } from '../dynamic-form-component/question-types/question-identity';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { StringArrayQuestion } from '../dynamic-form-component/question-types/question-string-array';
import { StixService } from '../stix-service.service';
import { OpenVocabArrayQuestion } from '../dynamic-form-component/question-types/question-ov-array';
import { LANGUAGES } from './languages';
import { Content } from './content';
import { Window } from './window';

export class IntrusionSet extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    created_by_ref?: string;
    name?: string;
    description?: string;
    labels?: string[];
    confidence?: number;
    lang?: string;
    external_references?: ExternalReference[];
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    created?: string;
    modified?: string;
    revoked?: boolean;
    aliases?: string[];
    first_seen?: string;
    last_seen?: string;
    goals?: string[];
    resource_level?: string;
    primary_motivation?: string;
    secondary_motivations?: string[];
    loaded?: boolean = false;

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        created_by_ref?: string | '',
        name?: string | '',
        description?: string | '',
        labels?: string[] | [],
        confidence?: number | undefined,
        lang?: string | '',
        external_references?: ExternalReference[] | [],
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        created?: string | '',
        modified?: string | '',
        revoked?: boolean,
        aliases?: string[] | [],
        first_seen?: string | '',
        last_seen?: string | '',
        goals?: string[] | [],
        resource_level?: string | '',
        primary_motivation?: string | '',
        secondary_motivations?: string[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.created_by_ref = created_by_ref;
        this.name = name;
        this.description = description;
        this.labels = labels;
        this.confidence = confidence;
        this.lang = lang;
        this.external_references = external_references;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
        this.created = created;
        this.modified = modified;
        this.revoked = revoked;
        this.aliases = aliases;
        this.first_seen = first_seen;
        this.last_seen = last_seen;
        this.goals = goals;
        this.resource_level = resource_level;
        this.primary_motivation = primary_motivation;
        this.secondary_motivations = secondary_motivations;
    }

    getExternalReferences(): ExternalReference[] {
        return this.external_references || [];
    }
    getContents(): Content[] {
        return [];
    }
    getWindows(): Window[] {
        return [];
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
                value: 'intrusion-set',
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
                value: `intrusion-set--${uuid()}`,
                validatorFn: (componentData: any) => {
                    const id = componentData.id;
                    const idRegex = new RegExp('^intrusion-set--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (!idRegex.test(id))
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with 'intrusion-set--' and followed by a UUID (i.e. opinion--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
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
                order: 20,
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
                            errorMessage: 'Valid Until date must be after Valid From date.',
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
            new DropdownQuestion({
                key: 'primary_motivation',
                label: 'Primary Motivation',
                options: [
                    { key: 'accidental', value: 'Accidental' },
                    { key: 'coercion', value: 'Coercion' },
                    { key: 'dominance', value: 'Dominance' },
                    { key: 'ideology', value: 'Ideology' },
                    { key: 'notoriety', value: 'Notoriety' },
                    { key: 'organizational-gain', value: 'Organizational Gain' },
                    { key: 'personal-gain', value: 'Personal Gain' },
                    { key: 'personal-satisfaction', value: 'Personal Satisfaction' },
                    { key: 'revenge', value: 'Revenge' },
                    { key: 'unpredictable', value: 'Unpredictable' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 14,
            }),
            new DropdownQuestion({
                key: 'resource_level',
                label: 'Resource Level',
                options: [
                    { key: 'individual', value: 'Individual' },
                    { key: 'club', value: 'Club' },
                    { key: 'contest', value: 'Contest' },
                    { key: 'team', value: 'Team' },
                    { key: 'organization', value: 'Organization' },
                    { key: 'government', value: 'Government' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 15,
            }),
            new OpenVocabArrayQuestion({
                key: 'secondary_motivations',
                label: 'Secondary Motivations',
                options: [
                    // { key: '', value: '' },
                    { key: 'accidental', value: 'Accidental' },
                    { key: 'coercion', value: 'Coercion' },
                    { key: 'dominance', value: 'Dominance' },
                    { key: 'ideology', value: 'Ideology' },
                    { key: 'notoriety', value: 'Notoriety' },
                    { key: 'organizational-gain', value: 'Organizational Gain' },
                    { key: 'personal-gain', value: 'Personal Gain' },
                    { key: 'personal-satisfaction', value: 'Personal Satisfaction' },
                    { key: 'revenge', value: 'Revenge' },
                    { key: 'unpredictable', value: 'Unpredictable' },
                ],

                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 16,
                multiple: true,
                marginRight: true,
            }),

            new StringArrayQuestion({
                key: 'aliases',
                label: 'Aliases',
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 18,
            }),
            new StringArrayQuestion({
                key: 'goals',
                label: 'Goals',
                value: new Array(),
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                revokedCol: 'col-6 pe-5',
                order: 19,
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
        this.goals = stixService.stringArrays.get('goals') || [];
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
        this.resource_level = componentData.resource_level[0];
        this.first_seen = componentData.first_seen;
        this.last_seen = componentData.last_seen;
        this.primary_motivation = componentData.primary_motivation[0];
        this.secondary_motivations = stixService.stringArrays.get('secondary_motivations') || [];
    }

    setExternalReferences(newExternalReferences: ExternalReference[]): void {
        this.external_references = newExternalReferences;
    }
    setContents(newContents: Content[]): void {
        // N/a
    }

    setWindows(newWndows: Window[]): void {
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

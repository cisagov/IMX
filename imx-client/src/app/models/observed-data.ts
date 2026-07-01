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
import { ReferenceArrayQuestion } from '../dynamic-form-component/question-types/question-reference-array';
import { StixService } from '../stix-service.service';
import { LANGUAGES } from './languages';
import { Content } from './content';
import { SCO_LIST } from './sco_list';
import { Window } from './window';

export class ObservedData extends FormModel {
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
    first_observed?: string;
    last_observed?: string;
    number_observed?: number;
    object_refs?: string[];
    loaded?: boolean = false;

    constructor(
        public stixService: StixService,
        type?: string,
        id?: string,
        spec_version?: string,
        created?: string,
        modified?: string,
        created_by_ref?: string,
        revoked?: boolean,
        labels?: string[],
        confidence?: number,
        lang?: string,
        external_references?: ExternalReference[],
        object_marking_refs?: string[],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        first_observed?: string,
        last_observed?: string,
        number_observed?: number,
        object_refs?: string[]
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
        this.first_observed = first_observed;
        this.last_observed = last_observed;
        this.number_observed = number_observed;
        this.object_refs = object_refs;
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
                value: 'observed-data',
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
                value: `observed-data--${uuid()}`,
                validatorFn: (componentData: any) => {
                    const id = componentData.id;
                    const idRegex = new RegExp('^observed-data--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (!idRegex.test(id))
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with 'observed-data--' and followed by a UUID (i.e. opinion--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
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
                    const createdDateTime = Date.parse(componentData['created']);
                    const modifiedDateTime = Date.parse(componentData['modified']);

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
                key: 'confidence',
                label: 'Confidence',
                validatorFn: (componentData: any) => {
                    const confidence = componentData.confidence;
                    const confidenceRegex = new RegExp('^[1-9]?[0-9]{1}$|^100$');
                    if (confidence && !confidenceRegex.test(confidence))
                        return {
                            valid: false,
                            errorMessage: 'Confidence value MUST be a number in the range of 0-100',
                        };
                    return {
                        valid: true,
                    };
                },
                type: 'number',
                order: 6,
                required: false,
                columnWidth: 'col-2 confidence-2',
                nonGuidedCol: 'col-6 pe-5',
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
                order: 9,
                required: false,
                columnWidth: 'col-6 created-by-ref-2',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'lang',
                label: 'Language',
                options: LANGUAGES,
                order: 8,
                required: false,
                columnWidth: 'col-4 language-2',
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
                order: 99,
            }),
            new DatetimeQuestion({
                key: 'first_observed',
                label: 'First Observed*',
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 11,
            }),
            new DatetimeQuestion({
                key: 'last_observed',
                label: 'Last Observed*',
                validatorFn: (componentData: any) => {
                    // Check whether Last Observed Date is equal or after to First Observed Dat
                    if (!componentData['last_observed'])
                        return {
                            valid: false,
                            errorMessage: 'Last Observed is required',
                        };
                    componentData['first_observed'] = this.stixService.convertToUTC('first_observed', componentData['first_observed']);
                    componentData['last_observed'] = this.stixService.convertToUTC('last_observed', componentData['last_observed']);
                    const firstDateTime = Date.parse(componentData['first_observed']);
                    const lastDateTime = Date.parse(componentData['last_observed']);

                    if (firstDateTime && lastDateTime < firstDateTime) {
                        return {
                            valid: false,
                            errorMessage: 'Last Observed date must be after First Observed date.',
                        };
                    }
                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 12,
            }),
            new TextboxQuestion({
                key: 'number_observed',
                label: 'Number Observed*',
                required: true,
                validatorFn: (componentData: any) => {
                    const number_observed = componentData.number_observed;
                    const regex = new RegExp('^([0-9]|[1-9][0-9]{1,8})$|^100$');
                    if (number_observed && number_observed != '') {
                        if (!regex.test(number_observed))
                            return {
                                valid: false,
                                errorMessage: 'Number Observed value MUST be a number in the range of 0-999,999,999',
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                order: 10,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                type: 'number',
            }),
            new ReferenceArrayQuestion({
                key: 'object_refs',
                label: 'Object References*',
                validatorFn: (componentData: any) => {
                    const objectReferences = componentData.object_refs;
                    const objectReferencesRegex = new RegExp(
                        /^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/
                    );

                    if (
                        objectReferences &&
                        objectReferences != '' &&
                        !objectReferencesRegex.test(objectReferences) &&
                        !SCO_LIST.includes(componentData.type) &&
                        componentData.type !== 'relationship' &&
                        componentData.type !== 'sighting'
                    ) {
                        return {
                            valid: false,
                            errorMessage: 'Must match id format [valid SRO or SCO object type]--[UUID]',
                        };
                    }

                    const object_refs_added = this.stixService.stringArrays.get('object_refs');
                    let sco_added = false;
                    if (object_refs_added && object_refs_added.length > 0) {
                        sco_added = object_refs_added.some((objRef: any) => SCO_LIST.includes(objRef.split('--')[0]));
                    }

                    let currentType = null;
                    if (typeof objectReferences === 'string') {
                        currentType = objectReferences.split('--')[0];
                    }

                    if (
                        !sco_added &&
                        // && sco_defined
                        typeof objectReferences === 'string' &&
                        !SCO_LIST.includes(currentType)
                    ) {
                        return {
                            valid: false,
                            errorMessage: 'At least one SCO must be selected.',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                required: true,
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-12 pe-5',
                revokedCol: 'col-6 pe-5',
                order: 14,
            }),
        ];

        return questions.sort((a, b) => a.order - b.order);
    }

    hasWindows(): boolean {
        return false;
    }
    hasExternalReferences(): boolean {
        return true;
    }

    hasContents(): boolean {
        return false;
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
        this.first_observed = componentData.first_observed;
        this.last_observed = componentData.last_observed;
        this.confidence = parseInt(componentData.confidence) || undefined;
        this.created = componentData.created;
        this.modified = componentData.modified;
        this.revoked = JSON.parse(componentData.revoked[0] || '""');
        this.lang = componentData.lang[0];
        this.number_observed = parseInt(componentData.number_observed) || undefined;
        this.external_references = componentData.external_references;
        this.labels = stixService.stringArrays.get('labels') || [];
        this.object_refs = stixService.stringArrays.get('object_refs') || [];
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
    }

    setExternalReferences(newExternalReferences: ExternalReference[]): void {
        this.external_references = newExternalReferences;
    }

    setContents(newContents: Content[]): void {}

    setGranularMarkings(newGranularMarkings: GranularMarking[]): void {
        this.granular_markings = newGranularMarkings;
    }

    setExtensions(newExtensions: Extension[]): void {
        this.extensions = newExtensions;
    }

    setObjectMarkingRefs(newObjectMarkingRefs: string[]): void {
        this.object_marking_refs = newObjectMarkingRefs;
    }

    setWindows(newWindows: Window[]): void {}
}

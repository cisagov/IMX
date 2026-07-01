import { v4 as uuid } from 'uuid';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { RefArrayQuestion } from '../dynamic-form-component/question-types/question-ref-array';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { IdentityQuestion } from '../dynamic-form-component/question-types/question-identity';
import { SightingQuestion } from '../dynamic-form-component/question-types/question-sighting';
import { StixService } from '../stix-service.service';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { LANGUAGES } from './languages';
import { SCO_LIST } from './sco_list';
import { Content } from './content';
import { Window } from './window';
export class Sighting extends FormModel {
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
    description?: string;
    first_seen?: string;
    last_seen?: string;
    count?: number;
    sighting_of_ref?: string;
    observed_data_refs?: string[];
    where_sighted_refs?: string[];
    summary?: boolean;
    loaded?: any = {};

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        created?: string | '',
        modified?: string | '',
        created_by_ref?: string | '',
        revoked?: boolean | undefined,
        labels?: string[] | [],
        confidence?: number | undefined,
        lang?: string | '',
        external_references?: ExternalReference[] | [],
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        description?: string | '',
        first_seen?: string | '',
        last_seen?: string | '',
        count?: number | undefined,
        sighting_of_ref?: string | '',
        observed_data_refs?: string[] | [],
        where_sighted_refs?: string[] | [],
        summary?: boolean | undefined
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
        this.description = description;
        this.first_seen = first_seen;
        this.last_seen = last_seen;
        this.count = count;
        this.sighting_of_ref = sighting_of_ref;
        this.observed_data_refs = observed_data_refs;
        this.where_sighted_refs = where_sighted_refs;
        this.summary = summary;
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
    getWindows(): Window[] {
        return [];
    }

    getQuestions(): QuestionBase<any>[] {
        let questions: QuestionBase<any>[] = [
            new TextboxQuestion({
                key: 'type',
                label: 'Type',
                value: 'sighting',
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
                value: this.id || `sighting--${uuid()}`,
                validatorFn: (componentData: any) => {
                    const id = componentData.id;
                    const idRegex = new RegExp('^sighting--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (!idRegex.test(id))
                        return {
                            valid: false,
                            errorMessage: "Must begin with 'sighting--' and followed by a UUID (i.e. sighting--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
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

                    if (modifiedDateTime && modifiedDateTime < createdDateTime && !this.stixService.newObject)
                        return {
                            valid: false,
                            errorMessage: 'Modified date must be after created date.',
                        };

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
                key: 'description',
                label: 'Description',
                order: 6,
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
                columnWidth: 'col-2 confidence-2',
                nonGuidedCol: 'col-6 pe-5',
                order: 7,
                required: false,
                type: 'number',
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
                order: 99,
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
                columnWidth: 'col-6 created-by-ref-2',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DatetimeQuestion({
                key: 'first_seen',
                label: 'First Seen',
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 11,
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

                    if (validuntilDateTime && validuntilDateTime < validfromDateTime)
                        return {
                            valid: false,
                            errorMessage: 'Last Seen date must be after First Seen date.',
                        };

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 12,
            }),
            new TextboxQuestion({
                key: 'count',
                label: 'Count',
                validatorFn: (componentData: any) => {
                    const count = componentData.count;
                    const countRegex = new RegExp('^([0-9]|[1-9][0-9]{1,8})$|^100$');
                    if (count && count != '') {
                        if (!countRegex.test(count))
                            return {
                                valid: false,
                                errorMessage: 'Count value MUST be a number in the range of 0-999,999,999',
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                order: 13,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'summary',
                label: 'Summary',
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 14,
            }),
            new SightingQuestion({
                key: 'sighting_of_ref',
                label: 'Sighting of Ref*',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'sighting_of_ref').relString = componentData.sighting_of_ref;
                    const sighting_of_ref = componentData.sighting_of_ref;
                    const regex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
                    let invalid_list = SCO_LIST.slice(); //Can only be an SDO or custom (not any other object type)
                    invalid_list.push('relationship', 'sighting', 'language-content', 'marking-definition', 'extension-definition', 'bundle');
                    if (!sighting_of_ref || sighting_of_ref == '')
                        return {
                            valid: false,
                        };
                    const matches = sighting_of_ref.match(regex);
                    if (!matches || invalid_list.indexOf(matches[1]) != -1)
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with '[SDO or custom object]--' and followed by a UUID (i.e. identity--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e) with no additional characters",
                        };
                    return {
                        valid: true,
                    };
                },
                relString: this.sighting_of_ref,
                order: 10,
                required: true,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new RefArrayQuestion({
                key: 'where_sighted_refs',
                label: 'Where Sighted Refs',
                validatorFn: (componentData: any) => {
                    const where_sighted_refs = componentData.where_sighted_refs;
                    const regex = new RegExp(/^(identity|location)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
                    if (where_sighted_refs && where_sighted_refs != '' && !regex.test(where_sighted_refs)) {
                        return {
                            valid: false,
                            errorMessage:
                                "Must be the identifier for a 'identity' or 'location' object (i.e. identity--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                        };
                    }
                    return {
                        valid: true,
                    };
                },
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-12 pe-5',
                order: 17,
                allowedRefsMap: ['identity', 'location'],
                allowedRefs: ['identity', 'location'],
                marginRight: true,
            }),
            new RefArrayQuestion({
                key: 'observed_data_refs',
                label: 'Observed Data Refs',
                validatorFn: (componentData: any) => {
                    const observed_data_refs = componentData.observed_data_refs;
                    const regex = new RegExp(/^observed-data--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
                    if (observed_data_refs && observed_data_refs != '') {
                        if (!regex.test(observed_data_refs))
                            return {
                                valid: false,
                                errorMessage: "Must be the 'observed-data' object (i.e. observed-data--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-12 pe-5',
                order: 18,
                allowedRefsMap: ['observed-data'],
                allowedRefs: ['observed-data'],
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

    getContents(): Content[] {
        return [];
    }
    hasContents(): boolean {
        return false;
    }
    setContents(newContents: Content[]): void {}

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
        this.spec_version = componentData.spec_version;
        this.created = componentData.created;
        this.modified = componentData.modified;
        this.created_by_ref = componentData.created_by_ref;
        this.revoked = JSON.parse(componentData.revoked[0] || '""');
        this.labels = stixService.stringArrays.get('labels') || [];
        this.confidence = parseInt(componentData.confidence) || undefined;
        this.lang = componentData.lang[0];
        this.external_references = componentData.external_references;
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
        this.description = componentData.description;
        this.first_seen = componentData.first_seen;
        this.last_seen = componentData.last_seen;
        this.count = parseInt(componentData.count) || undefined;
        this.sighting_of_ref = componentData.sighting_of_ref;
        this.observed_data_refs = stixService.stringArrays.get('observed_data_refs') || [];
        this.where_sighted_refs = stixService.stringArrays.get('where_sighted_refs') || [];
        this.summary = JSON.parse(componentData.summary[0] || '""');
    }

    setExternalReferences(newExternalReferences: ExternalReference[]): void {
        this.external_references = newExternalReferences;
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
    setWindows(newWindows: Window[]): void {}
}

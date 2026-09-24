import { Observable, of } from 'rxjs';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { NonBlankDropdownQuestion } from '../dynamic-form-component/question-types/question-non-blank-dropdown';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { ReferenceArrayQuestion } from '../dynamic-form-component/question-types/question-reference-array';
import { IdentityQuestion } from '../dynamic-form-component/question-types/question-identity';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { v4 as uuid } from 'uuid';
import { ExternalReference } from './external-reference';
import { StringArrayQuestion } from '../dynamic-form-component/question-types/question-string-array';
import { StixService } from '../stix-service.service';
import { LANGUAGES } from './languages';
import { Content } from './content';
import { Window } from './window';
export class Grouping extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    created_by_ref?: string;
    description?: string;
    confidence?: number;
    name?: string;
    lang?: string;
    created?: string;
    modified?: string;
    revoked?: boolean;
    context?: string;
    labels?: string[];
    external_references?: ExternalReference[];
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    object_refs?: string[];
    loaded?: boolean = false;

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        created_by_ref?: string | '',
        description?: string | '',
        confidence?: number | undefined,
        name?: string | '',
        lang?: string | '',
        created?: string | '',
        modified?: string | '',
        revoked?: boolean,
        context?: string | '',
        labels?: string[] | [],
        external_references?: ExternalReference[] | [],
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        object_refs?: string[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.created_by_ref = created_by_ref;
        this.description = description;
        this.confidence = confidence;
        this.name = name;
        this.lang = lang;
        this.created = created;
        this.modified = modified;
        this.revoked = revoked;
        this.context = context;
        this.labels = labels;
        this.external_references = external_references;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
        this.object_refs = object_refs;
    }

    getExternalReferences(): ExternalReference[] {
        return this.external_references || [];
    }
    getContents(): Content[] {
        return [];
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
                value: 'grouping',
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
                value: `grouping--${uuid()}`,
                validatorFn: (componentData: any) => {
                    const id = componentData.id;
                    const idRegex = new RegExp('^grouping--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (!idRegex.test(id))
                        return {
                            valid: false,
                            errorMessage: "Must begin with 'grouping--' and followed by a UUID (i.e. opinion--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
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
                label: 'Name',
                order: 6,
                required: false,
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
                    const confidenceRegex = new RegExp('^[1-9]?[0-9]{1}$|^100$');
                    if (confidence != '') {
                        if (!confidence)
                            return {
                                valid: false,
                            };

                        if (!confidenceRegex.test(confidence))
                            return {
                                valid: false,
                                errorMessage: 'Confidence value MUST be a number in the range of 0-100',
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                type: 'number',
                order: 8,
                columnWidth: 'col-2 confidence',
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
                order: 11,
                columnWidth: 'col-4 created-by-ref',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'lang',
                label: 'Language',
                options: LANGUAGES,
                order: 10,
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
                order: 13,
            }),
            new NonBlankDropdownQuestion({
                key: 'context',
                label: 'Context*',
                required: true,
                options: [
                    { key: 'suspicious-activity', value: 'suspicious-activity' },
                    { key: 'malware-analysis', value: 'malware-analysis' },
                    { key: 'unspecified', value: 'unspecified' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 12,
            }),
            new ReferenceArrayQuestion({
                key: 'object_refs',
                label: 'Object References*',
                validatorFn: (componentData: any) => {
                    const objectReferences = componentData.object_refs;
                    const objectReferencesRegex = new RegExp(
                        /^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/
                    );
                    if (objectReferences && objectReferences != '' && !objectReferencesRegex.test(objectReferences))
                        return {
                            valid: false,
                            errorMessage: 'Required and must match id format [object-type]--[UUID]',
                        };
                    return {
                        valid: true,
                    };
                },
                value: new Array(),
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                revokedCol: 'col-12 pe-5',
                order: 15,
                required: true,
            }),
        ];

        return questions.sort((a, b) => a.order - b.order);
    }

    hasExternalReferences(): boolean {
        return true;
    }
    hasContents(): boolean {
        return false;
    }

    hasWindows(): boolean {
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
        this.spec_version = componentData.spec_version;
        this.name = componentData.name;
        this.description = componentData.description;
        this.created_by_ref = componentData.created_by_ref;
        this.labels = stixService.stringArrays.get('labels') || [];
        this.confidence = parseInt(componentData.confidence) || undefined;
        this.lang = componentData.lang[0];
        this.context = componentData.context[0];
        this.external_references = componentData.external_references;
        this.object_marking_refs = componentData.object_marking_refs;
        this.object_refs = stixService.stringArrays.get('object_refs') || [];
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
        this.created = componentData.created;
        this.modified = componentData.modified;
        this.revoked = JSON.parse(componentData.revoked[0] || '""');
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
    setWindows(newWindows: Window[]): void {
        // N/a
    }
}

import { v4 as uuid } from 'uuid';
import { Observable, of } from 'rxjs';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { RelationshipQuestion } from '../dynamic-form-component/question-types/question-rel-type';
import { BundleObjectsQuestion } from '../dynamic-form-component/question-types/question-bundle-obj';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { IdentityQuestion } from '../dynamic-form-component/question-types/question-identity';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { StringArrayQuestion } from '../dynamic-form-component/question-types/question-string-array';
import { StixService } from '../stix-service.service';
import { LANGUAGES } from './languages';
import { APPENDIX_B } from './Appendix_B';
import { STIX_OBJECTS } from './stix-objects';
import { Content } from './content';
import { Window } from './window';

export class Relationship extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    created_by_ref?: string;
    description?: string;
    confidence?: number;
    lang?: string;
    created?: string;
    modified?: string;
    revoked?: boolean;
    start_time?: string;
    stop_time?: string;
    relationship_type?: string;
    last_source_target?: string;
    same?: boolean;
    source_ref?: string;
    target_ref?: string;
    labels?: string[];
    external_references?: ExternalReference[];
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    loaded?: boolean = false;

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        created_by_ref?: string | '',
        description?: string | '',
        confidence?: number | undefined,
        lang?: string | '',
        created?: string | '',
        modified?: string | '',
        revoked?: boolean | undefined,
        start_time?: string | '',
        stop_time?: string | '',
        relationship_type?: string | '',
        source_ref?: string | '',
        target_ref?: string | '',
        labels?: string[] | [],
        external_references?: ExternalReference[] | [],
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.created_by_ref = created_by_ref;
        this.description = description;
        this.confidence = confidence;
        this.lang = lang;
        this.created = created;
        this.modified = modified;
        this.revoked = revoked;
        this.start_time = start_time;
        this.stop_time = stop_time;
        this.relationship_type = relationship_type;
        this.source_ref = source_ref;
        this.target_ref = target_ref;
        this.labels = labels;
        this.external_references = external_references;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
        this.same = true;
    }

    getExternalReferences(): ExternalReference[] {
        return [];
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
                value: 'relationship',
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
                value: `relationship--${uuid()}`,
                validatorFn: (componentData: any) => {
                    const id = componentData.id;
                    const idRegex = new RegExp('^relationship--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (!idRegex.test(id))
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with 'relationship--' and followed by a UUID (i.e. opinion--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
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
                validatorFn: (componentData: any) => {
                    const created = componentData.created;

                    if (created != null) {
                        if (!created)
                            return {
                                valid: false,
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                order: 4,
                required: true,
                columnWidth: 'col-2 created',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DatetimeQuestion({
                key: 'modified',
                label: 'Modified*',
                validatorFn: (componentData: any) => {
                    // Check whether Modified Date is equal or after to Created Date
                    let createdDateTime = Date.parse(componentData.created);
                    let modifiedDateTime = Date.parse(componentData.modified);
                    if (modifiedDateTime && modifiedDateTime < createdDateTime && !this.stixService.newObject) {
                        return {
                            valid: false,
                            errorMessage: 'Modified Date may not be before Created Date.',
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
                key: 'description',
                label: 'Description',
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                order: 7,
                required: false,
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
                order: 10,
                required: false,
                columnWidth: 'col-6 created-by-ref-2',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'lang',
                label: 'Language',
                options: LANGUAGES,
                columnWidth: 'col-4 language-2',
                nonGuidedCol: 'col-6 pe-5',
                order: 9,
                required: false,
            }),
            new DropdownQuestion({
                key: 'revoked',
                label: 'Revoked',
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                order: 20,
                required: false,
            }),
            new RelationshipQuestion({
                key: 'relationship_type',
                label: 'Relationship Type*',
                validatorFn: (componentData: any) => {
                    if (this.same) questions.find((i) => i.key == 'relationship_type').relString = componentData.relationship_type;
                    const relationship_type = componentData.relationship_type;
                    const source_ref = componentData.source_ref;
                    const target_ref = componentData.target_ref;
                    const regexy = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);

                    if (!source_ref || !target_ref || source_ref == '' || target_ref == '') {
                        questions.find((i) => i.key === 'relationship_type').arrOptions = [];
                        questions.find((i) => i.key === 'relationship_type').relString = '';
                    } else {
                        const match_source = source_ref.match(regexy);
                        const match_target = target_ref.match(regexy);
                        if (!match_source || !match_target) {
                            questions.find((i) => i.key === 'relationship_type').arrOptions = [];
                            questions.find((i) => i.key === 'relationship_type').relString = '';
                        } else {
                            this.same = this.last_source_target == match_source[1] + match_target[1];
                            if (!this.same) questions.find((i) => i.key === 'relationship_type').relString = '';
                            this.last_source_target = match_source[1] + match_target[1];
                            const source_index = APPENDIX_B.indexOf(match_source[1]);
                            questions.find((i) => i.key === 'relationship_type').arrOptions = [];
                            if (source_index > -1) {
                                const targets = APPENDIX_B[source_index + 1];
                                const target_index = targets.indexOf(match_target[1]);
                                if (target_index > -1) {
                                    questions.find((i) => i.key === 'relationship_type').arrOptions = <string[]>targets[target_index + 1];
                                    this.addCommonRelationships(questions, match_source, match_target);
                                } else {
                                    this.addCommonRelationships(questions, match_source, match_target);
                                }
                            } else {
                                this.addCommonRelationships(questions, match_source, match_target);
                            }
                        }
                    }
                    if (!relationship_type || relationship_type == '')
                        return {
                            valid: false,
                        };

                    return {
                        valid: true,
                    };
                },
                arrOptions: [],
                relString: this.relationship_type,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 11,
            }),
            new BundleObjectsQuestion({
                key: 'source_ref',
                label: !this.stixService || !this.stixService.guidedUI ? 'Source Reference ID*' : 'Source Object',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'source_ref').relString = componentData.source_ref;
                    const source_ref = componentData.source_ref;
                    const regex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
                    if (!source_ref || source_ref == '')
                        return {
                            valid: false,
                        };

                    const matches = source_ref.match(regex);
                    if (!matches)
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with '[valid relationship source type]--' and followed by a UUID (i.e. identity--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e) with no additional characters",
                        };

                    return {
                        valid: true,
                    };
                },
                relString: this.source_ref,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-12 pe-5',
                required: true,
                order: 17,
            }),
            new BundleObjectsQuestion({
                key: 'target_ref',
                label: !this.stixService || !this.stixService.guidedUI ? 'Target Reference ID*' : 'Target Object',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'target_ref').relString = componentData.target_ref;
                    const target_ref = componentData.target_ref;
                    const regex = /^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/;
                    if (!target_ref || target_ref == '')
                        return {
                            valid: false,
                        };

                    const matches = target_ref.match(regex);
                    if (!matches)
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with '[valid relationship target type]--' and followed by a UUID (i.e. identity--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e) with no additional characters",
                        };

                    return {
                        valid: true,
                    };
                },
                relString: this.target_ref,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-12 pe-5',
                required: true,
                order: 18,
            }),
            new DatetimeQuestion({
                key: 'start_time',
                label: 'Start Time',
                order: 12,
                type: 'date',
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
            }),
            new DatetimeQuestion({
                key: 'stop_time',
                label: 'Stop Time',
                validatorFn: (componentData: any) => {
                    // Check whether Stop Time is equal or after to Start Time
                    let startDateTime = Date.parse(componentData.start_time);
                    let stopDateTime = Date.parse(componentData.stop_time);

                    if (stopDateTime && stopDateTime < startDateTime) {
                        return {
                            valid: false,
                            errorMessage: 'Stop Time may not be before Start Time.',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                order: 13,
                type: 'date',
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
            }),
        ];

        return questions.sort((a, b) => a.order - b.order);
    }

    addCommonRelationships(questions, match_source, match_target) {
        let arrOptions = questions.find((i) => i.key === 'relationship_type').arrOptions;

        if (match_source[1] === match_target[1]) {
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

        questions.find((i) => i.key === 'relationship_type').arrOptions = arrOptions;
    }

    hasX509V3Extensions(): boolean {
        return false;
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
        this.spec_version = componentData.spec_version;
        this.external_references = componentData.external_references;
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
        this.created = componentData.created;
        this.modified = componentData.modified;
        this.description = componentData.description;
        this.confidence = parseInt(componentData.confidence) || undefined;
        this.created_by_ref = componentData.created_by_ref;
        this.lang = componentData.lang[0];
        this.revoked = JSON.parse(componentData.revoked[0] || '""');
        this.relationship_type = componentData.relationship_type;
        this.source_ref = componentData.source_ref;
        this.target_ref = componentData.target_ref;
        this.start_time = componentData.start_time;
        this.stop_time = componentData.stop_time;
        this.labels = stixService.stringArrays.get('labels') || [];
    }
    setWindows(newWindows: Window[]): void {}

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
}

import { v5 as uuid } from 'uuid';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { RefQuestion } from '../dynamic-form-component/question-types/question-ref';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { Content } from './content';
import { Window } from './window';
import { StixService } from '../stix-service.service';
export class EmailAddress extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    value?: string;
    display_name?: string;
    belongs_to_ref?: string;
    defanged?: boolean;

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        value?: string | '',
        display_name?: string | '',
        belongs_to_ref?: string | '',
        defanged?: boolean
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
        this.value = value;
        this.display_name = display_name;
        this.belongs_to_ref = belongs_to_ref;
        this.defanged = defanged;
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
                value: 'email-addr',
                required: true,
                order: 2,
                type: 'text',
                readonly: true,
                columnWidth: 'col-3',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'id',
                label: 'ID',
                value: `email-addr--`,
                required: true,
                order: 1,
                type: 'text',
                readonly: true,
                columnWidth: 'col-7',
                nonGuidedCol: 'col-12 pe-5',
            }),
            new TextboxQuestion({
                key: 'spec_version',
                label: 'Spec Ver.',
                value: '2.1',
                readonly: true,
                columnWidth: 'col-2',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 3,
            }),
            new TextboxQuestion({
                key: 'value',
                label: 'Value*',
                validatorFn: (componentData: any) => {
                    const val = componentData.value;
                    if (!val)
                        return {
                            valid: false,
                            errorMessage: 'Value is required',
                        };
                    const regex = new RegExp(
                        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    );
                    if (val && !regex.test(val))
                        return {
                            valid: false,
                            errorMessage: 'Must be a valid email address',
                        };

                    if (val && componentData['display_name']) {
                        let all = true;
                        let name = componentData['display_name'].split(' ');
                        for (let part of name) {
                            if (part.length > 0 && !val.includes(part)) {
                                all = false;
                                break;
                            }
                        }

                        if (all) {
                            return {
                                valid: false,
                                errorMessage: 'Must not contain the display name',
                            };
                        }
                    }

                    return {
                        valid: true,
                    };
                },
                order: 4,
                required: true,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'display_name',
                label: 'Display Name',
                validatorFn: (componentData: any) => {
                    const val = componentData.display_name;
                    const regex = new RegExp(/^[\x00-\x7F]+$/);
                    if ((val && !regex.test(val)) || (val.length > 0 && val.replace(/ /g, '').length === 0))
                        return {
                            valid: false,
                            errorMessage: 'Must be a valid display name',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 5,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new RefQuestion({
                key: 'belongs_to_ref',
                label: 'Belongs to ref',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'belongs_to_ref').relString = componentData.belongs_to_ref;
                    const val = componentData.belongs_to_ref;
                    const valRegex = new RegExp('^user-account--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');

                    if (val && !valRegex.test(val))
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with 'user-account--' and followed by a UUID (i.e. user-account--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                        };
                    return {
                        valid: true,
                    };
                },
                required: false,
                order: 6,
                type: 'text',
                readonly: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                relString: this.belongs_to_ref,
                allowedRefsMap: ['user-account'],
                allowedRefs: ['user-account'],
            }),
            new DropdownQuestion({
                key: 'defanged',
                label: 'Defanged',
                type: 'boolean',
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 7,
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

    populateFromJSON(componentData: any): void {
        this.type = componentData.type;
        this.id = this.genUUIDv5(componentData.type, componentData);
        this.spec_version = componentData.spec_version;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
        this.object_marking_refs = componentData.object_marking_refs;
        this.value = componentData.value;
        this.display_name = componentData.display_name;
        this.defanged = JSON.parse(componentData.defanged[0] || '""');
        this.belongs_to_ref = componentData.belongs_to_ref;
    }

    genUUIDv5(id: string, componentData: any): any {
        id = id + '--' + this.stixService.getUUIDFrIdContributingProperties(componentData);
        return id;
    }

    setExternalReferences(newExternalReferences: ExternalReference[]): void {
        // N/a
    }

    setContents(newContents: Content[]): void {
        // N/a
    }

    setWindows(newWindows: Window[]): void {
        // N/a
    }

    setGranularMarkings(newGranularMarkings: GranularMarking[]): void {
        this.granular_markings = newGranularMarkings;
    }

    setExtensions(newExtensions: Extension[]): void {
        this.extensions = newExtensions;
    }

    setObjectMarkingRefs(newObjectMarkingReferences: string[]): void {
        this.object_marking_refs = newObjectMarkingReferences;
    }
}

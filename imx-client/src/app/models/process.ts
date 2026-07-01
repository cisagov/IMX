import { v4 as uuid } from 'uuid';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { StringArrayQuestion } from '../dynamic-form-component/question-types/question-string-array';
import { StringDictQuestion } from '../dynamic-form-component/question-types/question-string-dict';
import { RefQuestion } from '../dynamic-form-component/question-types/question-ref';
import { RefArrayQuestion } from '../dynamic-form-component/question-types/question-ref-array';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { StixService } from '../stix-service.service';
import { Content } from './content';
import { Window } from './window';

export class Process extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    is_hidden?: boolean;
    pid?: number;
    created_time?: string;
    cwd?: string;
    command_line?: string;
    environment_variables?: any;
    creator_user_ref?: string;
    image_ref?: string;
    parent_ref?: string;
    defanged?: boolean;
    opened_connection_refs?: string[];
    child_refs?: string[];
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];

    constructor(
        public stixService: StixService,
        type?: string,
        id?: string,
        spec_version?: string,
        is_hidden?: boolean,
        pid?: number,
        created_time?: string,
        cwd?: string,
        command_line?: string,
        environment_variables?: any | {},
        creator_user_ref?: string,
        image_ref?: string,
        parent_ref?: string,
        defanged?: boolean,
        opened_connection_refs?: string[],
        child_refs?: string[],
        object_marking_refs?: string[],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.is_hidden = is_hidden;
        this.pid = pid;
        this.created_time = created_time;
        this.cwd = cwd;
        this.command_line = command_line;
        this.environment_variables = environment_variables;
        this.creator_user_ref = creator_user_ref;
        this.image_ref = image_ref;
        this.parent_ref = parent_ref;
        this.defanged = defanged;
        this.opened_connection_refs = opened_connection_refs;
        this.child_refs = child_refs;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
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
                value: 'process',
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
                value: `process--${uuid()}`,
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
                key: 'pid',

                label: 'Process ID (PID)',

                type: 'number',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'is_hidden').target = componentData.is_hidden;
                    questions.find((i) => i.key == 'pid').target = componentData.pid;
                    questions.find((i) => i.key == 'created_time').target = componentData.created_time;
                    questions.find((i) => i.key == 'cwd').target = componentData.cwd;
                    questions.find((i) => i.key == 'command_line').target = componentData.command_line;
                    questions.find((i) => i.key == 'creator_user_ref').target = componentData.creator_user_ref;
                    questions.find((i) => i.key == 'image_ref').target = componentData.image_ref;
                    questions.find((i) => i.key == 'parent_ref').target = componentData.parent_ref;

                    const pid = componentData.pid;
                    const regex = new RegExp('^[0-9]{1,5}$');
                    if (pid && !regex.test(pid))
                        return {
                            valid: false,
                            errorMessage: 'Process ID must be a non-negative integer between 0 and 99999',
                        };

                    return {
                        valid: true,
                    };
                },
                order: 4,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'is_hidden',
                label: 'Is Hidden',
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 7,
            }),

            new DatetimeQuestion({
                key: 'created_time',
                label: 'Process Created Time',
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 5,
            }),
            new TextboxQuestion({
                key: 'cwd',

                label: 'Current Working Directory (CWD)',
                order: 7,

                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'command_line',
                label: 'Command Line',
                order: 26,
                required: false,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
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
                order: 9,
            }),
            new StringDictQuestion({
                key: 'environment_variables',
                label: 'Environment Variables',
                order: 25,
                required: false,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                relString: '',
            }),
            new RefQuestion({
                key: 'creator_user_ref',
                label: 'Creator User Ref',
                validatorFn: (componentData: any) => {
                    const creator_user_ref = componentData.creator_user_ref;
                    const creator_user_refRegex = new RegExp(
                        '^user-account--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$'
                    );
                    questions.find((i) => i.key == 'creator_user_ref').relString = componentData.creator_user_ref;

                    if (creator_user_ref && !creator_user_refRegex.test(creator_user_ref))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format (user-account--[UUID])',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 10,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                relString: this.creator_user_ref,
                allowedRefsMap: ['user-account'],
                allowedRefs: ['user-account'],
            }),
            new RefQuestion({
                key: 'image_ref',
                label: 'Image Ref',
                validatorFn: (componentData: any) => {
                    const image_ref = componentData.image_ref;
                    const image_refRegex = new RegExp('^file--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    questions.find((i) => i.key == 'image_ref').relString = componentData.image_ref;

                    if (image_ref && !image_refRegex.test(image_ref))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format (file--[UUID])',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 11,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                relString: this.image_ref,
                allowedRefsMap: ['file'],
                allowedRefs: ['file'],
            }),
            new RefQuestion({
                key: 'parent_ref',
                label: 'Parent Ref',
                validatorFn: (componentData: any) => {
                    const parent_ref = componentData.parent_ref;
                    const parent_refRegex = new RegExp('^process--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    questions.find((i) => i.key == 'parent_ref').relString = componentData.parent_ref;

                    if (parent_ref && !parent_refRegex.test(parent_ref))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format (process--[UUID])',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 12,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                relString: this.parent_ref,
                allowedRefsMap: ['process'],
                allowedRefs: ['process'],
            }),
            new RefArrayQuestion({
                key: 'opened_connection_refs',
                label: 'Opened Connection Refs',
                validatorFn: (componentData: any) => {
                    const opened_connection_refs = componentData.opened_connection_refs;
                    const opened_connection_refsRegex = new RegExp(
                        '^network-traffic--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$'
                    );
                    if (opened_connection_refs != '' && !opened_connection_refsRegex.test(opened_connection_refs))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format (network-traffic--[UUID])',
                        };
                    return {
                        valid: true,
                    };
                },
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 13,
                allowedRefsMap: ['network-traffic'],
                allowedRefs: ['network-traffic'],
                marginRight: true,
            }),
            new RefArrayQuestion({
                key: 'child_refs',
                label: 'Child Refs',
                validatorFn: (componentData: any) => {
                    const child_refs = componentData.child_refs;
                    const child_refsRegex = new RegExp('^process--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (child_refs != '' && !child_refsRegex.test(child_refs))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format (process--[UUID])',
                        };
                    return {
                        valid: true,
                    };
                },
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 14,
                allowedRefsMap: ['process'],
                allowedRefs: ['process'],
            }),
        ];

        return questions.sort((a, b) => a.order - b.order);
    }

    hasExternalReferences(): boolean {
        return false;
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

    hasWindows(): boolean {
        return false;
    }

    hasObjectMarkingReferences(): boolean {
        return true;
    }

    populateFromJSON(componentData: any, stixService: StixService): void {
        this.type = componentData.type;
        this.id = componentData.id;
        this.spec_version = componentData.spec_version;
        this.is_hidden = JSON.parse(componentData.is_hidden[0] || '""');
        this.pid = parseInt(componentData.pid) || undefined;
        this.created_time = componentData.created_time;
        this.cwd = componentData.cwd;
        this.command_line = componentData.command_line;
        this.environment_variables = componentData.environment_variables;
        this.creator_user_ref = componentData.creator_user_ref;
        this.image_ref = componentData.image_ref;
        this.parent_ref = componentData.parent_ref;
        this.defanged = JSON.parse(componentData.defanged[0] || '""');
        this.opened_connection_refs = stixService.stringArrays.get('opened_connection_refs') || [];
        this.environment_variables = {};
        let environment_variables = stixService.stringArrays.get('environment_variables') || [];
        for (let i in environment_variables) {
            let temp = environment_variables[i].split(': ');
            this.environment_variables[temp[0]] = temp[1];
        }
        this.child_refs = stixService.stringArrays.get('child_refs') || [];
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
    }

    setExternalReferences(newExternalReferences: ExternalReference[]): void {}

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

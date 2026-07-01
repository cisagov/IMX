import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { WindowsValueQuestion } from '../dynamic-form-component/question-types/question-windows-value';
import { StixService } from '../stix-service.service';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { Content } from './content';
import { Window } from './window';
import { BundleObjectsQuestion } from '../dynamic-form-component/question-types/question-bundle-obj';

export class WindowsRegistryKey extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    key?: string;
    values?: any[];
    number_of_subkeys?: number;
    modified_time?: string;
    creator_user_ref?: string;
    defanged?: boolean;
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        key?: string | '',
        number_of_subkeys?: number,
        modified_time?: string | '',
        creator_user_ref?: string | '',
        defanged?: boolean,
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.key = key;
        this.number_of_subkeys = number_of_subkeys;
        this.values = [];
        this.modified_time = modified_time;
        this.creator_user_ref = creator_user_ref;
        this.defanged = defanged;
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
        return this.values || [];
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
                value: 'windows-registry-key',
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
                value: `windows-registry-key--`,
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
                key: 'key',
                label: 'Registry Key',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'key').relString = componentData.key;
                    const key = componentData.key;
                    const keyRegex = new RegExp(
                        '^HKEY_CURRENT_CONFIG|^HKEY_CURRENT_USER|^HKEY_LOCAL_MACHINE|^HKEY_USERS|^hkey_current_config|^hkey_current_user|^hkey_local_machine|^hkey_users$'
                    );

                    if (key && !keyRegex.test(key))
                        return {
                            valid: false,
                            errorMessage: "Must be a full registry key including the hive. ex: 'HKEY_LOCAL_MACHINE')",
                        };

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 4,
            }),

            new TextboxQuestion({
                key: 'number_of_subkeys',
                label: 'Number of Subkeys',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'number_of_subkeys').relString = componentData.number_of_subkeys;
                    const number_of_subkeys = componentData.number_of_subkeys;
                    const Regex = new RegExp('^(0|[1-9]|[1-9][0-9]|[1-9][0-9][0-9]|[1-9][0-9][0-9][0-9])$');

                    if (number_of_subkeys && !Regex.test(number_of_subkeys))
                        return {
                            valid: false,
                            errorMessage: 'Must be a non-negative integer',
                        };
                    return {
                        valid: true,
                    };
                },
                type: 'number',
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 5,
            }),

            new WindowsValueQuestion({
                key: 'values',
                label: 'Registry Values',
                order: 6,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                placeholder: '--> Use button on the right to create a Registry Value -->',
            }),

            new DatetimeQuestion({
                key: 'modified_time',
                label: 'Modified Time',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'modified_time').relString = componentData.modified_time;

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 7,
            }),
            new BundleObjectsQuestion({
                key: 'creator_user_ref',
                label: 'Creator User Ref',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'creator_user_ref').relString = componentData.creator_user_ref;
                    const creator_user_ref = componentData['creator_user_ref'];
                    const creator_user_refRegex = new RegExp(
                        '^user-account--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$'
                    );

                    if (creator_user_ref && !creator_user_refRegex.test(creator_user_ref))
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with '[user-account]--' and followed by a UUID (i.e. user-account--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e) with no additional characters",
                        };

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                order: 9,
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
                order: 8,
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
        return true;
    }

    hasX509V3Extensions(): boolean {
        return false;
    }

    hasObjectMarkingReferences(): boolean {
        return true;
    }

    populateFromJSON(componentData: any, stixService: StixService): void {
        this.type = componentData.type;
        this.id = this.genUUIDv5(componentData.type, componentData);
        this.spec_version = componentData.spec_version;
        this.key = componentData.key;
        this.number_of_subkeys = parseInt(componentData.number_of_subkeys) || undefined;
        this.modified_time = componentData.modified_time;
        this.creator_user_ref = componentData.creator_user_ref;
        this.defanged = JSON.parse(componentData.defanged[0] || '""');
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
    }

    genUUIDv5(id: string, componentData: any): any {
        if (this.stixService.modalObjectArray.length > 0) componentData.values = JSON.parse(JSON.stringify(this.stixService.modalObjectArray));
        else delete componentData.values;

        id = id + '--' + this.stixService.getUUIDFrIdContributingProperties(componentData);
        return id;
    }

    setExternalReferences(newExternalReferences: ExternalReference[]): void {}
    setContents(newContents: Content[]): void {}

    setWindows(newValues: Window[]): void {
        this.values = newValues;
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

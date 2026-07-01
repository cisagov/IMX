import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { StixService } from '../stix-service.service';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { Content } from './content';
import { Window } from './window';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';

export class Url extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    value?: string;
    defanged?: boolean;
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        value?: string | '',
        defanged?: boolean,
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.value = value;
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
                value: 'url',
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
                value: `url--`,
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
                key: 'url_value',
                label: 'Value*',
                validatorFn: (componentData: any) => {
                    const value = componentData.url_value;
                    if (!value)
                        return {
                            valid: false,
                            errorMessage: 'Value is required',
                        };

                    try {
                        new URL(value);
                    } catch (error) {
                        return {
                            valid: false,
                            errorMessage: 'Must be a valid URL (i.e. https://www.example.com)',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                order: 4,
                required: true,
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
                order: 5,
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
    populateFromJSON(componentData: any, stixService: StixService): void {
        this.type = componentData.type;
        this.id = this.genUUIDv5(componentData.type, componentData);
        this.spec_version = componentData.spec_version;
        this.value = componentData.url_value;
        this.defanged = JSON.parse(componentData.defanged[0] || '""');
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
    }

    genUUIDv5(id: string, componentData: any): any {
        id = id + '--' + this.stixService.getUUIDFrIdContributingProperties(componentData);
        return id;
    }

    setExternalReferences(newExternalReferences: ExternalReference[]): void {}

    setGranularMarkings(newGranularMarkings: GranularMarking[]): void {
        this.granular_markings = newGranularMarkings;
    }

    setExtensions(newExtensions: Extension[]): void {
        this.extensions = newExtensions;
    }
    setContents(newContents: Content[]): void {}

    setObjectMarkingRefs(newObjectMarkingReferences: string[]): void {
        this.object_marking_refs = newObjectMarkingReferences;
    }
    setWindows(newWindows: Window[]): void {}
}

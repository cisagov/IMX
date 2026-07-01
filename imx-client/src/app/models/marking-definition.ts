import { v4 as uuid } from 'uuid';
import { Observable, of } from 'rxjs';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { IdentityQuestion } from '../dynamic-form-component/question-types/question-identity';
import { DefinitionQuestion } from '../dynamic-form-component/question-types/question-definition';
import { TooltipDropdownQuestion } from '../dynamic-form-component/question-types/question-tooltip-dropdown';
import { TrackedDropdownQuestion } from '../dynamic-form-component/question-types/question-tracked-dropdown';
import { StixService } from '../stix-service.service';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { Content } from './content';
import { TLP20_OPTIONS } from '../tlpMarkingDef';
import { Window } from './window';

export class MarkingDefinition extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    created?: string;
    created_by_ref?: string;
    name?: string;
    definition_type?: string;
    definition?: any;
    external_references?: ExternalReference[];
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    quick_add?: string;
    loaded?: boolean = false;

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        created?: string | '',
        created_by_ref?: string | '',
        name?: string | '',
        definition_type?: string | '',
        definition?: any | {},
        external_references?: ExternalReference[] | [],
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.created = created;
        this.created_by_ref = created_by_ref;
        this.name = name;
        this.definition_type = definition_type;
        this.definition = definition;
        this.external_references = external_references;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
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

    tlpQuickAddOptions() {
        let tlpQuickAddOptions = [];
        for (let option of TLP20_OPTIONS) {
            tlpQuickAddOptions.push({ key: option.name, value: option.name });
        }
        return tlpQuickAddOptions;
    }

    getQuestions(): QuestionBase<any>[] {
        let questions: QuestionBase<any>[] = [
            new TextboxQuestion({
                key: 'type',
                label: 'Type',
                value: 'marking-definition',
                required: true,
                order: 1,
                type: 'text',
                readonly: true,
                columnWidth: 'col-3 type',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'id',
                label: 'ID',
                value: `marking-definition--${uuid()}`,
                required: true,
                readonly: false,
                order: 2,
                type: 'text',
                columnWidth: 'col-5 id',
                nonGuidedCol: 'col-6 pe-5',
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
                columnWidth: 'col-3 created-2',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 4,
            }),
            new TextboxQuestion({
                key: 'name',
                label: 'Name',
                order: 5,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TrackedDropdownQuestion({
                key: 'definition_type',
                label: 'Definition Type',
                options: [
                    { key: 'statement', value: 'Statement' },
                    { key: 'tlp', value: 'TLP' },
                ],
                validatorFn: (componentData: any) => {
                    let definition_type = componentData.definition_type;
                    if (!this.loaded) {
                        if (!definition_type || definition_type == '') definition_type = '';
                        this.loaded = true;
                    }
                    questions.find((i) => i.key == 'definition_type').relString = definition_type;
                    if (componentData.definition && (!componentData.definition_type || !componentData.definition_type[0]))
                        return {
                            valid: false,
                            errorMessage: 'Definition Type must be selected when Definition is filled',
                        };
                    return {
                        valid: true,
                    };
                },
                relString: this.definition_type,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                order: 6,
                required: false,
            }),
            new TextboxQuestion({
                key: 'definition',
                label: 'Definition',
                validatorFn: (componentData: any) => {
                    let definition = componentData.definition;
                    questions.find((i) => i.key == 'definition').relString = definition;
                    if (componentData.definition_type && componentData.definition_type[0] && !componentData.definition)
                        return {
                            valid: false,
                            errorMessage: 'Definition must be filled with Definition Type',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 7,
                // required: true,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                relString: this.definition,
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
                order: 5,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
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

    hasGranularMarkings(): boolean {
        return true;
    }

    hasExtensions(): boolean {
        return true;
    }

    hasObjectMarkingReferences(): boolean {
        return true;
    }

    hasWindows(): boolean {
        return false;
    }

    populateFromJSON(componentData: any, stixService: StixService): void {
        let values = TLP20_OPTIONS;
        if (componentData.quick_add != undefined) {
            for (let x in values) if (values[x]['name'] == componentData.quick_add) componentData = values[x];
        }

        this.type = componentData.type;
        this.id = componentData.id;
        this.spec_version = componentData.spec_version;
        this.created = componentData.created;
        this.created_by_ref = componentData.created_by_ref;
        this.name = componentData.name;
        if (componentData.definition_type && componentData.definition_type[0]) {
            this.definition_type = componentData.definition_type[0];
            this.definition = {};
            this.definition[this.definition_type] = componentData.definition;
        }
        this.external_references = componentData.external_references;
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
        delete this.quick_add;
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

    setContents(newContents: Content[]): void {}

    setObjectMarkingRefs(newObjectMarkingRefs: string[]): void {
        this.object_marking_refs = newObjectMarkingRefs;
    }

    setWindows(newWindows: Window[]): void {}
}

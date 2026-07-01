import { v4 as uuid } from 'uuid';
import { Observable, of } from 'rxjs';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { StixService } from '../stix-service.service';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { Content } from './content';
import { Window } from './window';

export class ObservedString extends FormModel {
    type?: string;
    id?: string;
    defanged?: boolean;
    spec_version?: string;
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    purpose?: string;
    value?: string;

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        defanged?: boolean,
        spec_version?: string | '',
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        purpose?: string | '',
        value?: string | ''
    ) {
        super();
        this.type = type;
        this.id = id;
        this.defanged = defanged;
        this.spec_version = spec_version;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
        this.purpose = purpose;
        this.value = value;
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
                key: 'id',
                label: 'ID',
                value: `observed-string--`,
                required: true,
                order: 1,
                type: 'text',
                readonly: true,
                columnWidth: 'col-7',
                nonGuidedCol: 'col-12 pe-5',
            }),
            new TextboxQuestion({
                key: 'type',
                label: 'Type',
                value: 'observed-string',
                required: true,
                order: 2,
                type: 'text',
                readonly: true,
                columnWidth: 'col-3',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'spec_version',
                label: 'Spec Ver.',
                value: '2.1',
                required: true,
                order: 3,
                readonly: true,
                columnWidth: 'col-2',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                // TODO: Clean this up now thats its regular DropDown
                key: 'defanged',
                label: 'Defanged',
                required: false,
                order: 4,
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                // TODO: Convert to DropdownQuestion
                key: 'purpose',
                label: 'Purpose',
                required: true,
                order: 5,
                options: [
                    { key: 'decoded', value: 'Decoded' },
                    { key: 'document-text', value: 'Document Text' },
                    { key: 'gui-text', value: 'GUI Text' },
                    { key: 'mission-id', value: 'Mission ID' },
                    { key: 'pipe', value: 'Pipe' },
                    { key: 'unknown', value: 'Unknown' },
                    { key: 'user-agent', value: 'User Agent' },
                    { key: 'uuid', value: 'UUID' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'value',
                label: 'Value',
                order: 6,
                required: true,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
            }),
        ];

        return questions.sort((a, b) => a.order - b.order);
    }

    genUUIDv5(id: string, componentData: any): any {
        id = id + '--' + this.stixService.getUUIDFrIdContributingProperties(componentData);
        return id;
    }

    hasWindows(): boolean {
        return false;
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

    hasObjectMarkingReferences(): boolean {
        return true;
    }

    populateFromJSON(componentData: any, stixService: StixService): void {
        this.type = componentData.type;
        this.id = this.genUUIDv5(componentData.type, componentData);
        this.spec_version = componentData.spec_version;
        this.defanged = JSON.parse(componentData.defanged[0] || '""');
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
        this.purpose = componentData.purpose[0];
        this.value = componentData.value;
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

    setExternalReferences(newExternalReferences: ExternalReference[]): void {
        // N/a
    }

    setContents(newContents: Content[]): void {
        // N/a
    }

    setWindows(newWindows: Window[]): void {
        // N/a
    }
}

import { v5 as uuid } from 'uuid';
import { Observable, of } from 'rxjs';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { RefArrayQuestion } from '../dynamic-form-component/question-types/question-ref-array';
import { StixService } from '../stix-service.service';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { Content } from './content';
import { Window } from './window';

export class DomainName extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    value?: string;
    defanged?: boolean;
    resolves_to_refs?: string[];

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        value?: string | '',
        defanged?: boolean,
        resolves_to_refs?: string[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
        this.value = value;
        this.defanged = defanged;
        this.resolves_to_refs = resolves_to_refs;
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
                value: 'domain-name',
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
                value: `domain-name--`,
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
                    const value = componentData.value;
                    if (!value)
                        return {
                            valid: false,
                            errorMessage: 'Value is required',
                        };
                    //https://stackoverflow.com/questions/10306690/what-is-a-regular-expression-which-will-match-a-valid-domain-name-without-a-subd
                    const urlRegex = new RegExp(
                        '^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$'
                    );
                    const subDomainRegex = /^[a-z0-9]+(?:\-[\w]+)*\.[a-z0-9]+(?:\-[\w]+)*\.[a-z0-9]+(?:\-[\w]+)*\.[a-z]{2,6}$/i;
                    if (componentData.defanged != 'true' && value && !urlRegex.test(value) && !subDomainRegex.test(value))
                        return {
                            valid: false,
                            errorMessage: 'Must be a valid domain name',
                        };

                    if (value && value.length > 63)
                        return {
                            valid: false,
                            errorMessage: 'A domain name must not exceed 63 characters',
                        };

                    return {
                        valid: true,
                    };
                },
                order: 4,
                required: true,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
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
            new RefArrayQuestion({
                key: 'resolves_to_refs',
                label: 'Resolves to Refs',
                validatorFn: (componentData: any) => {
                    const val = componentData.resolves_to_refs;
                    const valRegex = new RegExp(
                        '^(domain-name|ipv4-addr|ipv6-addr)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}'
                    );
                    if (val && val != '' && !valRegex.test(val))
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with 'domain-name--, ipv6-addr--, or ipv4-addr--' and be followed by a UUID (i.e. domain-name--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                        };
                    return {
                        valid: true,
                    };
                },
                value: new Array(),
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                order: 14,
                allowedRefsMap: ['ipv4-addr', 'ipv6-addr', 'domain-name'],
                allowedRefs: ['ipv4-addr', 'ipv6-addr', 'domain-name'],
            }),
        ];

        return questions.sort((a, b) => a.order - b.order);
    }

    hasX509V3Extensions(): boolean {
        return false;
    }

    hasContents(): boolean {
        return false;
    }

    hasWindows(): boolean {
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
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
        this.value = componentData.value;
        this.defanged = JSON.parse(componentData.defanged[0] || '""');
        this.resolves_to_refs = stixService.stringArrays.get('resolves_to_refs') || [];
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

    setGranularMarkings(newGranularMarkings: GranularMarking[]): void {
        this.granular_markings = newGranularMarkings;
    }

    setExtensions(newExtensions: Extension[]): void {
        this.extensions = newExtensions;
    }

    setObjectMarkingRefs(newObjectMarkingReferences: string[]): void {
        this.object_marking_refs = newObjectMarkingReferences;
    }

    setWindows(newWindows: Window[]): void {
        // N/a
    }
}

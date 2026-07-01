import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { StixService } from '../stix-service.service';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { LANGUAGES } from './languages';
import { Content } from './content';
import { Window } from './window';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { OpenVocabArrayQuestion } from '../dynamic-form-component/question-types/question-ov-array';

export class Software extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    name?: string;
    cpe?: string;
    swid?: string;
    vendor?: string;
    version?: string;
    defanged?: boolean;
    languages?: string[];
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        name?: string | '',
        cpe?: string | '',
        swid?: string | '',
        vendor?: string | '',
        version?: string | '',
        defanged?: boolean,
        languages?: string[] | [],
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.name = name;
        this.cpe = cpe;
        this.swid = swid;
        this.vendor = vendor;
        this.version = version;
        this.defanged = defanged;
        this.languages = languages;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
    }

    getWindows(): Window[] {
        return [];
    }
    getExternalReferences(): ExternalReference[] {
        return [];
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
    getQuestions(): QuestionBase<any>[] {
        let questions: QuestionBase<any>[] = [
            new TextboxQuestion({
                key: 'type',
                label: 'Type',
                value: 'software',
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
                value: `software--`,
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
                key: 'name',
                label: 'Name*',
                order: 4,
                required: true,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'cpe',
                label: 'Common Platform Enumeration (CPE)',
                validatorFn: (componentData: any) => {
                    const cpe = componentData.cpe;
                    const cpeRegex = new RegExp(
                        '^cpe:2\\.3:[aho\\*\\-](:(((\\?*|\\*?)([a-zA-Z0-9\\-\\._]|(\\\\[\\\\\\*\\?!"#$$%&\'\\(\\)\\+,/:;<=>@\\[\\]\\^`\\{\\|}~]))+(\\?*|\\*?))|[\\*\\-])){5}(:(([a-zA-Z]{2,3}(-([a-zA-Z]{2}|[0-9]{3}))?)|[\\*\\-]))(:(((\\?*|\\*?)([a-zA-Z0-9\\-\\._]|(\\\\[\\\\\\*\\?!"#$$%&\'\\(\\)\\+,/:;<=>@\\[\\]\\^`\\{\\|}~]))+(\\?*|\\*?))|[\\*\\-])){4}'
                    );
                    if (cpe && !cpeRegex.test(cpe))
                        return {
                            valid: false,
                            errorMessage: 'MUST be a CPE v2.3 entry',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 8,
                required: false,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
            }),
            new DropdownQuestion({
                key: 'swid',
                label: ' Software Identification (SWID)',
                order: 9,
                required: false,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
            }),
            new TextboxQuestion({
                key: 'vendor',
                label: 'Vendor',
                order: 6,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'version',
                label: 'Version',
                order: 7,
                required: false,
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
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                order: 10,
            }),
            new OpenVocabArrayQuestion({
                key: 'languages',
                label: 'Languages',
                options: LANGUAGES,
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
        this.name = componentData.name;
        this.cpe = componentData.cpe;
        this.swid = componentData.swid[0];
        this.vendor = componentData.vendor;
        this.version = componentData.version;
        this.defanged = JSON.parse(componentData.defanged[0] || '""');
        this.languages = stixService.stringArrays.get('languages') || [];
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
    }

    genUUIDv5(id: string, componentData: any): any {
        id = id + '--' + this.stixService.getUUIDFrIdContributingProperties(componentData);
        return id;
    }

    setExternalReferences(newExternalReferences: ExternalReference[]): void {}
    setContents(newContents: Content[]): void {}

    setGranularMarkings(newGranularMarkings: GranularMarking[]): void {
        this.granular_markings = newGranularMarkings;
    }

    setExtensions(newExtensions: Extension[]): void {
        this.extensions = newExtensions;
    }

    setObjectMarkingRefs(newObjectMarkingReferences: string[]): void {
        this.object_marking_refs = newObjectMarkingReferences;
    }
    setWindows(newWindows: Window[]): void {}
}

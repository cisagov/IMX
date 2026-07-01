import { v5 as uuid } from 'uuid';
import { Observable, of } from 'rxjs';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { RefArrayQuestion } from '../dynamic-form-component/question-types/question-ref-array';
import { StixService } from '../stix-service.service';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { Window } from './window';
import { Content } from './content';
import { PATH_ENC } from './path';

export class Directory extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    path?: string;
    path_enc?: string;
    ctime?: string;
    mtime?: string;
    atime?: string;
    defanged?: boolean;
    contains_ref?: string[];

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        path?: string | '',
        path_enc?: string | '',
        ctime?: string | '',
        mtime?: string | '',
        atime?: string | '',
        defanged?: boolean,
        contains_ref?: string[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
        this.path = path;
        this.path_enc = path_enc;
        this.ctime = ctime;
        this.mtime = mtime;
        this.atime = atime;
        this.defanged = defanged;
        this.contains_ref = contains_ref;
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
                value: 'directory',
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
                value: `directory--`,
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
                required: true,
                nonGuidedCol: 'col-6 pe-5',
                order: 3,
            }),
            new TextboxQuestion({
                key: 'path',
                label: 'Path*',
                validatorFn: (componentData: any) => {
                    const path = componentData.path;
                    if (!path)
                        return {
                            valid: false,
                            errorMessage: 'Path is required',
                        };

                    const pathRegex = new RegExp('^(?=^.{1,200})(.*)(/|\\\\)+([^/]*)$');
                    if (path) {
                        if (!pathRegex.test(path))
                            return {
                                valid: false,
                                errorMessage: 'Must be a valid path structure',
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                order: 5,
                required: true,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                placeholder: 'Path',
            }),
            new DropdownQuestion({
                key: 'path_enc',
                label: 'Path Encoding',
                options: PATH_ENC,
                order: 4,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                placeholder: 'Path Encoding',
            }),
            new DatetimeQuestion({
                key: 'ctime',
                label: 'Directory Created',
                columnWidth: 'col-4',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 6,
            }),
            new DatetimeQuestion({
                key: 'mtime',
                label: 'Directory Last Modified',

                validatorFn: (componentData: any) => {
                    // Check whether Modified Date is equal or after to Created Date
                    componentData['ctime'] = this.stixService.convertToUTC('ctime', componentData['ctime']);
                    componentData['mtime'] = this.stixService.convertToUTC('mtime', componentData['mtime']);
                    const createdDateTime = Date.parse(componentData['ctime']);
                    const modifiedDateTime = Date.parse(componentData['mtime']);

                    if (createdDateTime && modifiedDateTime < createdDateTime && !this.stixService.newObject) {
                        return {
                            valid: false,
                            errorMessage: 'Modified Date must be after Created Date.',
                        };
                    }
                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-4',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 7,
            }),
            new DatetimeQuestion({
                key: 'atime',
                label: 'Directory Last Accessed',

                validatorFn: (componentData: any) => {
                    // Check whether Accessed Date is equal or after to Created/Modified Date
                    componentData['ctime'] = this.stixService.convertToUTC('ctime', componentData['ctime']);
                    componentData['mtime'] = this.stixService.convertToUTC('mtime', componentData['mtime']);
                    componentData['atime'] = this.stixService.convertToUTC('atime', componentData['atime']);
                    const createdDateTime = Date.parse(componentData['ctime']);
                    const modifiedDateTime = Date.parse(componentData['mtime']);
                    const accessedDateTime = Date.parse(componentData['atime']);
                    if ((modifiedDateTime && accessedDateTime < modifiedDateTime) || (createdDateTime && accessedDateTime < createdDateTime)) {
                        return {
                            valid: false,
                            errorMessage: 'Last Accessed Date must be after Created/Modified Date.',
                        };
                    }
                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-4',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 8,
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
            new RefArrayQuestion({
                key: 'contains_ref',
                label: 'Contains Ref',
                validatorFn: (componentData: any) => {
                    const val = componentData.contains_ref;
                    const valRegex = new RegExp('^(directory|file)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');

                    if (val != '' && !valRegex.test(val))
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with 'directory--' or 'file--' and be followed by a UUID (i.e. directory--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                        };
                    return {
                        valid: true,
                    };
                },
                placeholder: 'Contains Ref',
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-12 pe-5',
                order: 10,
                allowedRefsMap: ['file', 'directory'],
                allowedRefs: ['file', 'directory'],
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
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
        this.path = componentData.path;
        this.path_enc = componentData.path_enc[0];
        this.ctime = componentData.ctime;
        this.mtime = componentData.mtime;
        this.atime = componentData.atime;
        this.defanged = JSON.parse(componentData.defanged[0] || '""');
        this.contains_ref = stixService.stringArrays.get('contains_ref') || [];
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

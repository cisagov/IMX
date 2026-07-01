import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { HashArrayQuestion } from '../dynamic-form-component/question-types/question-hash-array';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { SCOReferenceArrayQuestion } from '../dynamic-form-component/question-types/question-sco-reference-array';
import { RefQuestion } from '../dynamic-form-component/question-types/question-ref';
import { StixService } from '../stix-service.service';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { Content } from './content';
import { Window } from './window';
import { SCO_LIST } from './sco_list';
import { MIME } from './mime';
import { NAME_ENC } from './name_enc';

export class File extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    hashes?: any;
    size?: number;
    name?: string;
    name_enc?: string;
    magic_number_hex?: string;
    mime_type?: string;
    ctime?: string;
    mtime?: string;
    atime?: string;
    parent_directory_ref?: string;
    defanged?: boolean;
    contains_refs?: string[];
    content_ref?: string;
    componentData?: any;

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        hashes?: any | {},
        size?: number | undefined,
        name?: string | '',
        name_enc?: string | '',
        magic_number_hex?: string | '',
        mime_type?: string | '',
        ctime?: string | '',
        mtime?: string | '',
        atime?: string | '',
        parent_directory_ref?: string | '',
        contains_refs?: string[] | [],
        content_ref?: string | '',
        defanged?: boolean
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
        this.hashes = hashes;
        this.size = size;
        this.name = name;
        this.name_enc = name_enc;
        this.magic_number_hex = magic_number_hex;
        this.mime_type = mime_type;
        this.ctime = ctime;
        this.mtime = mtime;
        this.atime = atime;
        this.parent_directory_ref = parent_directory_ref;
        this.contains_refs = contains_refs;
        this.content_ref = content_ref;
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
                value: 'file',
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
                value: `file--`,
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
                label: 'Name',
                validatorFn: (componentData: any) => {
                    const name = componentData.name;
                    const hashes = this.stixService.stringArrays.get('hashes');

                    if (!name && (!hashes || hashes.length == 0))
                        return {
                            valid: false,
                            errorMessage: 'Name or Hashes is required',
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
            new HashArrayQuestion({
                key: 'hashes',
                order: 25,
                validatorFn: (componentData: any) => {
                    const name = componentData.name;
                    const hashes = this.stixService.stringArrays.get('hashes');

                    if ((!hashes || hashes.length == 0) && !name)
                        return {
                            valid: false,
                            errorMessage: 'Hashes or Name is required',
                        };
                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                tooltip: 'Use [ MD5, SHA-1, SHA-256, or SHA-512 ] whenever possible',
                relString: 'SHA-256',
            }),
            new TextboxQuestion({
                key: 'size',
                label: 'Size',
                validatorFn: (componentData: any) => {
                    const val = componentData.size;
                    const valRegex = new RegExp('^0*[1-9][0-9]*$');
                    if (val && !valRegex.test(val))
                        return {
                            valid: false,
                            errorMessage: 'Size must be a valid integer and > 0',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 6,
                required: false,
                columnWidth: 'col-4',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'name_enc',
                label: 'Name Encoding',
                options: NAME_ENC,
                order: 5,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'magic_number_hex',
                label: 'Magic Number Hex',
                validatorFn: (componentData: any) => {
                    const val = componentData.magic_number_hex;
                    const valRegex = new RegExp('^[0-9A-Fa-f]{8}$');
                    if (val && !valRegex.test(val))
                        return {
                            valid: false,
                            errorMessage: 'Magic Number Hex must be a valid hex',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 7,
                required: false,
                columnWidth: 'col-4',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'mime_type',
                label: 'MIME Type',
                options: MIME,
                order: 8,
                required: false,
                columnWidth: 'col-4',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new RefQuestion({
                key: 'parent_directory_ref',
                label: 'Parent Directory Reference',
                validatorFn: (componentData: any) => {
                    const pdr = componentData.parent_directory_ref;
                    const pdrRegex = new RegExp('^directory--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}');
                    questions.find((i) => i.key == 'parent_directory_ref').relString = componentData.parent_directory_ref;

                    if (pdr != '' && !pdrRegex.test(pdr))
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with 'directory--' and followed by a UUID (i.e. directory--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                        };
                    return {
                        valid: true,
                    };
                },
                order: 12,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                relString: this.parent_directory_ref,
                allowedRefsMap: ['directory'],
                allowedRefs: ['directory'],
            }),
            new DatetimeQuestion({
                key: 'ctime',
                label: 'File Created',
                columnWidth: 'col-4',
                nonGuidedCol: 'col-6 pe-5',
                order: 9,
            }),
            new DatetimeQuestion({
                key: 'mtime',
                label: 'File Last Modified',

                validatorFn: (componentData: any) => {
                    // Check whether Modified Date is equal or after to Created Date
                    componentData['ctime'] = this.stixService.convertToUTC('ctime', componentData['ctime']);
                    componentData['mtime'] = this.stixService.convertToUTC('mtime', componentData['mtime']);
                    const createdDateTime = Date.parse(componentData['ctime']);
                    const modifiedDateTime = Date.parse(componentData['mtime']);
                    if (modifiedDateTime && createdDateTime && modifiedDateTime < createdDateTime) {
                        return {
                            valid: false,
                            errorMessage: 'Modified Time must be after Created Time.',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-4',
                nonGuidedCol: 'col-6 pe-5',
                order: 10,
            }),
            new DatetimeQuestion({
                key: 'atime',
                label: 'File Last Accessed',

                validatorFn: (componentData: any) => {
                    // Check whether Accessed Date is equal or after to Created/Modified Date
                    componentData['ctime'] = this.stixService.convertToUTC('ctime', componentData['ctime']);
                    componentData['mtime'] = this.stixService.convertToUTC('mtime', componentData['mtime']);
                    componentData['atime'] = this.stixService.convertToUTC('atime', componentData['atime']);
                    const createdDateTime = Date.parse(componentData['ctime']);
                    const modifiedDateTime = Date.parse(componentData['mtime']);
                    const accessedDateTime = Date.parse(componentData['atime']);
                    if (
                        (accessedDateTime && modifiedDateTime && accessedDateTime < modifiedDateTime) ||
                        (createdDateTime && accessedDateTime < createdDateTime)
                    ) {
                        return {
                            valid: false,
                            errorMessage: 'Last Accessed Time must be after Created/Modified Time.',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-4',
                nonGuidedCol: 'col-6 pe-5',
                order: 11,
            }),
            new RefQuestion({
                key: 'content_ref',
                label: 'Content Reference',
                validatorFn: (componentData: any) => {
                    const val = componentData.content_ref;
                    const valRegex = new RegExp('^artifact--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}');
                    questions.find((i) => i.key == 'content_ref').relString = componentData.content_ref;

                    if (val != '' && !valRegex.test(val))
                        return {
                            valid: false,
                            errorMessage: "Must begin with 'artifact--' and followed by a UUID (i.e. artifact--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                        };
                    return {
                        valid: true,
                    };
                },
                order: 13,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                relString: this.content_ref,
                allowedRefsMap: ['artifact'],
                allowedRefs: ['artifact'],
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
                order: 16,
            }),
            new SCOReferenceArrayQuestion({
                key: 'contains_refs',
                label: 'Contains References',
                validatorFn: (componentData: any) => {
                    const contains_refs = componentData.contains_refs;
                    const regex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
                    if (contains_refs && contains_refs != '') {
                        const matches = contains_refs.match(regex);
                        if (!matches || SCO_LIST.indexOf(matches[1]) == -1)
                            return {
                                valid: false,
                                errorMessage: 'Must match id format [SCO object type]--[UUID]',
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 17,
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
        this.hashes = {};

        let hashes = stixService.stringArrays.get('hashes') || [];
        for (let i in hashes) {
            let temp = hashes[i].split(': ');
            this.hashes[temp[0]] = temp[1];
        }

        this.size = parseInt(componentData.size) || undefined;
        this.name = componentData.name;
        this.name_enc = componentData.name_enc[0];
        this.magic_number_hex = componentData.magic_number_hex;
        this.mime_type = componentData.mime_type[0];
        this.ctime = componentData.ctime;
        this.mtime = componentData.mtime;
        this.atime = componentData.atime;
        this.parent_directory_ref = componentData.parent_directory_ref;
        this.defanged = JSON.parse(componentData.defanged[0] || '""');
        this.contains_refs = stixService.stringArrays.get('contains_refs') || [];
        this.content_ref = componentData.content_ref;
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
        this.id = this.genUUIDv5('file', this);
    }

    setContents(newContents: Content[]): void {
        // N/a
    }

    setWindows(newWindows: Window[]): void {
        // N/a
    }

    setObjectMarkingRefs(newObjectMarkingRefs: string[]): void {
        this.object_marking_refs = newObjectMarkingRefs;
    }
}

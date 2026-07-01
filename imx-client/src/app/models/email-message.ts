import { v4 as uuid } from 'uuid';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { NonBlankDropdownQuestion } from '../dynamic-form-component/question-types/question-non-blank-dropdown';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { StringArrayQuestion } from '../dynamic-form-component/question-types/question-string-array';
import { TooltipStringArrayQuestion } from '../dynamic-form-component/question-types/question-tooltip-string-array';
import { StringDictQuestion } from '../dynamic-form-component/question-types/question-string-dict';
import { RefQuestion } from '../dynamic-form-component/question-types/question-ref';
import { RefArrayQuestion } from '../dynamic-form-component/question-types/question-ref-array';
import { BodyMultipartQuestion } from '../dynamic-form-component/question-types/question-body-multipart';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { StixService } from '../stix-service.service';
import { Content } from './content';
import { Window } from './window';

export class EmailMessage extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    is_multipart?: boolean;
    date?: string;
    content_type?: string;
    from_ref?: string;
    sender_ref?: string;
    to_refs?: string[];
    cc_refs?: string[];
    bcc_refs?: string[];
    message_id?: string;
    subject?: string;
    received_lines?: string[];
    additional_header_fields?: any;
    body?: string;
    body_multipart?: any[];
    raw_email_ref?: string;
    defanged?: boolean;

    constructor(
        public stixService: StixService,
        type?: string,
        id?: string,
        spec_version?: string,
        object_marking_refs?: string[],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        is_multipart?: boolean,
        date?: string,
        content_type?: string,
        from_ref?: string,
        sender_ref?: string,
        to_refs?: string[],
        cc_refs?: string[],
        bcc_refs?: string[],
        message_id?: string,
        subject?: string,
        received_lines?: string[],
        additional_header_fields?: any | {},
        body?: string,
        body_multipart?: any[] | [],
        raw_email_ref?: string,
        defanged?: boolean
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
        this.is_multipart = is_multipart;
        this.date = date;
        this.content_type = content_type;
        this.from_ref = from_ref;
        this.sender_ref = sender_ref;
        this.to_refs = to_refs;
        this.cc_refs = cc_refs;
        this.bcc_refs = bcc_refs;
        this.message_id = message_id;
        this.subject = subject;
        this.received_lines = received_lines;
        this.additional_header_fields = additional_header_fields;
        this.body = body;
        this.body_multipart = [];
        this.raw_email_ref = raw_email_ref;
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
                value: 'email-message',
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
                value: `email-message--`,
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
            new NonBlankDropdownQuestion({
                key: 'is_multipart',
                label: 'Is Multipart*',
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                relString: this.is_multipart + '',
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 4,
            }),
            new DatetimeQuestion({
                key: 'date',
                label: 'Message Sent',
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 5,
            }),
            new TextboxQuestion({
                key: 'content_type',
                label: 'Content Type',
                order: 6,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new RefQuestion({
                key: 'raw_email_ref',
                label: 'Raw Email Ref',
                validatorFn: (componentData: any) => {
                    const val = componentData.raw_email_ref;
                    const valRegex = new RegExp('^artifact--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    questions.find((i) => i.key == 'raw_email_ref').relString = componentData.raw_email_ref;

                    if (val != '' && !valRegex.test(val))
                        return {
                            valid: false,
                            errorMessage: "Must begin with 'artifact--' and followed by a UUID (i.e. artifact--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                        };
                    return {
                        valid: true,
                    };
                },
                order: 7,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                relString: this.raw_email_ref,
                allowedRefsMap: ['artifact'],
                allowedRefs: ['artifact'],
            }),
            new RefQuestion({
                key: 'from_ref',
                label: 'From Ref',
                validatorFn: (componentData: any) => {
                    const val = componentData.from_ref;
                    const valRegex = new RegExp('^email-addr--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    questions.find((i) => i.key == 'from_ref').relString = componentData.from_ref;

                    if (val != '' && !valRegex.test(val))
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with 'email-addr--' and followed by a UUID (i.e. email-addr--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                        };
                    return {
                        valid: true,
                    };
                },
                order: 8,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                relString: this.from_ref,
                allowedRefsMap: ['email-address'],
                allowedRefs: ['email-addr'],
            }),
            new RefQuestion({
                key: 'sender_ref',
                label: 'Sender Ref',
                validatorFn: (componentData: any) => {
                    const val = componentData.sender_ref;
                    const valRegex = new RegExp('^email-addr--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    questions.find((i) => i.key == 'sender_ref').relString = componentData.sender_ref;

                    if (val != '' && !valRegex.test(val))
                        return {
                            valid: false,
                            errorMessage:
                                "Must begin with 'email-addr--' and followed by a UUID (i.e. email-addr--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                        };
                    return {
                        valid: true,
                    };
                },
                order: 9,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                relString: this.sender_ref,
                allowedRefsMap: ['email-address'],
                allowedRefs: ['email-addr'],
            }),
            new TextboxQuestion({
                key: 'message_id',
                label: 'Message ID',
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 9,
            }),
            new TextboxQuestion({
                key: 'subject',
                label: 'Subject',
                order: 10,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'body',
                label: 'Body',
                validatorFn: (componentData: any) => {
                    const is_multipart = componentData.is_multipart;
                    const body = componentData.body;
                    if (is_multipart == 'true' && body)
                        return {
                            valid: false,
                            errorMessage: 'Must not be present when Is Multipart is true',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 31,
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
                order: 12,
            }),
            new RefArrayQuestion({
                key: 'to_refs',
                label: 'To Refs',
                validatorFn: (componentData: any) => {
                    const to_refs = componentData.to_refs;
                    const to_refsRegex = new RegExp('^email-addr--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (to_refs != '' && !to_refsRegex.test(to_refs))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format (email-addr--[UUID])',
                        };
                    return {
                        valid: true,
                    };
                },
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 13,
                allowedRefsMap: ['email-address'],
                allowedRefs: ['email-addr'],
            }),
            new RefArrayQuestion({
                key: 'cc_refs',
                label: 'CC Refs',
                validatorFn: (componentData: any) => {
                    const to_refs = componentData.cc_refs;
                    const to_refsRegex = new RegExp('^email-addr--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (to_refs != '' && !to_refsRegex.test(to_refs))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format (email-addr--[UUID])',
                        };
                    return {
                        valid: true,
                    };
                },
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 14,
                allowedRefsMap: ['email-address'],
                allowedRefs: ['email-addr'],
                marginRight: true,
            }),
            new RefArrayQuestion({
                key: 'bcc_refs',
                label: 'BCC  Refs',
                validatorFn: (componentData: any) => {
                    const to_refs = componentData.bcc_refs;
                    const to_refsRegex = new RegExp('^email-addr--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (to_refs != '' && !to_refsRegex.test(to_refs))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format (email-addr--[UUID])',
                        };
                    return {
                        valid: true,
                    };
                },
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 15,
                allowedRefsMap: ['email-address'],
                allowedRefs: ['email-addr'],
            }),
            new StringArrayQuestion({
                key: 'received_lines',
                label: 'Received Lines',
                value: new Array(),
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                order: 29,
                tooltip: 'Lines must appear in the same order as present in the email message',
            }),
            new StringDictQuestion({
                key: 'additional_header_fields',
                label: 'Addtl. Headers',
                value: new Array(),
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                order: 28,
                relString: '',
            }),
            new BodyMultipartQuestion({
                key: 'body_multipart',
                label: 'Body Multipart',
                validatorFn: (componentData: any) => {
                    const is_multipart = componentData.is_multipart;
                    const body_multipart = this.stixService.modalObjectArray;
                    if (is_multipart == 'false' && body_multipart.length != 0)
                        return {
                            valid: false,
                            errorMessage: 'Body Multipart must be empty when Is Multipart is false',
                        };
                    else if (is_multipart == 'true' && body_multipart.length == 0)
                        return {
                            valid: false,
                            errorMessage: 'Body Multipart is required when Is Multipart is true',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 29,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                placeholder: '--> Use button on right to create a Body Multipart -->',
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
        this.id = this.genUUIDv5(componentData.type, componentData);
        this.spec_version = componentData.spec_version;
        this.is_multipart = JSON.parse(componentData.is_multipart[0] || '""');
        this.date = componentData.date;
        this.content_type = componentData.content_type;
        this.from_ref = componentData.from_ref;
        this.sender_ref = componentData.sender_ref;
        this.subject = componentData.subject;
        this.body = componentData.body;
        this.raw_email_ref = componentData.raw_email_ref;
        this.message_id = componentData.message_id;
        this.defanged = JSON.parse(componentData.defanged[0] || '""');
        this.to_refs = stixService.stringArrays.get('to_refs') || [];
        this.cc_refs = stixService.stringArrays.get('cc_refs') || [];
        this.bcc_refs = stixService.stringArrays.get('bcc_refs') || [];
        this.received_lines = stixService.stringArrays.get('received_lines') || [];
        this.additional_header_fields = {};

        // set value for each dictionary key to be a list of type string
        let additional_header_fields_arr = stixService.stringArrays.get('additional_header_fields') || [];
        this.additional_header_fields = additional_header_fields_arr.reduce((acc, item) => {
            const [key, values] = item.split(': ').map((str) => str.trim());
            const valueArr = values.split(',').map((str) => str.trim());
            if (!acc[key]) {
                acc[key] = [];
            }
            valueArr.forEach((v) => acc[key].push(v));
            return acc;
        }, {});

        // set value for each dictionary key to type string if it is a single value
        Object.keys(this.additional_header_fields).forEach((key) => {
            if (Array.isArray(this.additional_header_fields[key]) && this.additional_header_fields[key].length === 1) {
                this.additional_header_fields[key] = this.additional_header_fields[key][0];
            }
        });

        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
    }

    genUUIDv5(id: string, componentData: any): any {
        id = id + '--' + this.stixService.getUUIDFrIdContributingProperties(componentData);
        return id;
    }

    setExternalReferences(newExternalReferences: ExternalReference[]): void {}

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

    setObjectMarkingRefs(newObjectMarkingRefs: string[]): void {
        this.object_marking_refs = newObjectMarkingRefs;
    }
}

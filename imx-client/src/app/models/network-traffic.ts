import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { TooltipDropdownQuestion } from '../dynamic-form-component/question-types/question-tooltip-dropdown';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { ProtocolArrayQuestion } from '../dynamic-form-component/question-types/question-protocol-array';
import { HybridQuestion } from '../dynamic-form-component/question-types/question-hybrid';
import { HybridArrayQuestion } from '../dynamic-form-component/question-types/question-hybrid-array';
import { StringDictQuestion } from '../dynamic-form-component/question-types/question-string-dict';
import { RefQuestion } from '../dynamic-form-component/question-types/question-ref';
import { StixService } from '../stix-service.service';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { Content } from './content';
import { Window } from './window';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { PROTOCOL } from './protocols';

export class NetworkTraffic extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    start?: string;
    end?: string;
    is_active?: boolean;
    src_ref?: string;
    dst_ref?: string;
    src_port?: number;
    dst_port?: number;
    src_byte_count?: number;
    dst_byte_count?: number;
    src_packets?: number;
    dst_packets?: number;
    ipfix?: any;
    src_payload_ref?: string;
    dst_payload_ref?: string;
    encapsulated_by_ref?: string;
    defanged?: boolean;
    protocols?: string[];
    encapsulates_refs?: string[];
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];

    constructor(
        public stixService: StixService,
        type?: string,
        id?: string,
        spec_version?: string,
        start?: string,
        end?: string,
        is_active?: boolean,
        src_ref?: string,
        dst_ref?: string,
        src_port?: number,
        dst_port?: number,
        src_byte_count?: number,
        dst_byte_count?: number,
        src_packets?: number,
        dst_packets?: number,
        ipfix?: any | {},
        src_payload_ref?: string,
        dst_payload_ref?: string,
        encapsulated_by_ref?: string,
        defanged?: boolean,
        protocols?: string[],
        encapsulates_refs?: string[],
        object_marking_refs?: string[],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.start = start;
        this.end = end;
        this.is_active = is_active;
        this.src_ref = src_ref;
        this.dst_ref = dst_ref;
        this.src_port = src_port;
        this.dst_port = dst_port;
        this.src_byte_count = src_byte_count;
        this.dst_byte_count = dst_byte_count;
        this.src_packets = src_packets;
        this.dst_packets = dst_packets;
        this.ipfix = ipfix;
        this.src_payload_ref = src_payload_ref;
        this.dst_payload_ref = dst_payload_ref;
        this.encapsulated_by_ref = encapsulated_by_ref;
        this.defanged = defanged;
        this.protocols = protocols;
        this.encapsulates_refs = encapsulates_refs;
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

    getGranularMarkings(): GranularMarking[] {
        return this.granular_markings || [];
    }
    getExtensions(): Extension[] {
        return this.extensions || [];
    }

    getWindows(): Window[] {
        return [];
    }

    getQuestions(): QuestionBase<any>[] {
        let questions: QuestionBase<any>[] = [
            new TextboxQuestion({
                key: 'type',
                label: 'Type',
                value: 'network-traffic',
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
                value: `network-traffic--`,
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
            new DatetimeQuestion({
                key: 'start',
                label: 'Start',
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 6,
            }),
            new DatetimeQuestion({
                key: 'end',
                label: 'End',
                validatorFn: (componentData: any) => {
                    componentData.start = this.stixService.convertToUTC('start', componentData.start);
                    componentData.end = this.stixService.convertToUTC('end', componentData.end);
                    let start = Date.parse(componentData.start);
                    let end = Date.parse(componentData.end);
                    let is_active = componentData.is_active;

                    questions.find((i) => i.key == 'end').relString = componentData.end;
                    if (componentData.end) {
                        if (is_active && is_active == 'true')
                            return {
                                valid: false,
                                errorMessage: 'End may not both be present when Is Active is true',
                            };
                        if (start && end < start)
                            return {
                                valid: false,
                                errorMessage: 'End date must be after Start date',
                            };
                    }

                    return {
                        valid: true,
                    };
                },
                relString: this.end,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 7,
            }),
            new RefQuestion({
                key: 'src_ref',
                label: 'Source Ref',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'src_ref').relString = componentData.src_ref;
                    const src_ref = componentData.src_ref;
                    const dst_ref = componentData['dst_ref'];
                    const src_refRegex = new RegExp(
                        '^(ipv4-addr|ipv6-addr|mac-addr|domain-name)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$'
                    );
                    questions.find((i) => i.key == 'src_ref').relString = componentData.src_ref;

                    if (src_ref != '' && !src_refRegex.test(src_ref))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format ((ipv4-addr|ipv6-addr|mac-addr|domain-name)--[UUID])',
                        };
                    else if ((!dst_ref || dst_ref == '') && (!src_ref || src_ref == ''))
                        return {
                            valid: false,
                            errorMessage: 'Source Ref or Dest Ref is required',
                        };
                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 8,
                relString: this.src_ref,
                allowedRefsMap: ['ipv4-addr', 'ipv6-addr', 'mac-addr', 'domain-name'],
                allowedRefs: ['ipv4-addr', 'ipv6-addr', 'mac-addr', 'domain-name'],
            }),
            new RefQuestion({
                key: 'dst_ref',
                label: 'Dest Ref',

                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'dst_ref').relString = componentData.dst_ref;
                    const src_ref = componentData.src_ref;
                    const dst_ref = componentData['dst_ref'];
                    const dst_refRegex = new RegExp(
                        '^(ipv4-addr|ipv6-addr|mac-addr|domain-name)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$'
                    );
                    questions.find((i) => i.key == 'dst_ref').relString = componentData.dst_ref;

                    if (dst_ref != '' && !dst_refRegex.test(dst_ref))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format ((ipv4-addr|ipv6-addr|mac-addr|domain-name)--[UUID])',
                        };
                    if ((!src_ref || src_ref == '') && (!dst_ref || dst_ref == ''))
                        return {
                            valid: false,
                            errorMessage: 'Dest Ref or Source Ref is required',
                        };
                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 9,
                relString: this.dst_ref,
                allowedRefsMap: ['ipv4-addr', 'ipv6-addr', 'mac-addr', 'domain-name'],
                allowedRefs: ['ipv4-addr', 'ipv6-addr', 'mac-addr', 'domain-name'],
            }),
            new TextboxQuestion({
                key: 'src_port',
                label: 'Source Port',
                validatorFn: (componentData: any) => {
                    const src_port = componentData.src_port;
                    const src_portRegex = new RegExp('^(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$');
                    if (src_port && !src_portRegex.test(src_port))
                        return {
                            valid: false,
                            errorMessage: 'Port value MUST be an integer in the range of 0 - 65535',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 10,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'dst_port',
                label: 'Destination Port',
                validatorFn: (componentData: any) => {
                    const dst_port = componentData.dst_port;
                    const dst_portRegex = new RegExp('^(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$');
                    if (dst_port && !dst_portRegex.test(dst_port))
                        return {
                            valid: false,
                            errorMessage: 'Port value MUST be an integer in the range of 0 - 65535',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 11,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'src_byte_count',
                label: 'Source Byte Count',
                validatorFn: (componentData: any) => {
                    const src_byte_count = Number(componentData.src_byte_count);
                    if (src_byte_count <= 0 || isNaN(src_byte_count))
                        return {
                            valid: true,
                            errorMessage: 'Must be a positive integer',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 12,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'dst_byte_count',
                label: 'Destination Byte Count',
                validatorFn: (componentData: any) => {
                    const dst_byte_count = Number(componentData.dst_byte_count);
                    if (dst_byte_count <= 0 || isNaN(dst_byte_count))
                        return {
                            valid: true,
                            errorMessage: 'Must be a positive integer',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 13,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'src_packets',
                label: 'Source Packets',
                validatorFn: (componentData: any) => {
                    const src_packets = Number(componentData.src_packets);
                    if (src_packets <= 0 || isNaN(src_packets))
                        return {
                            valid: true,
                            errorMessage: 'Must be a positive integer',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 14,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'dst_packets',
                label: 'Destination Packets',
                validatorFn: (componentData: any) => {
                    const dst_packets = Number(componentData.dst_packets);
                    if (dst_packets <= 0 || isNaN(dst_packets))
                        return {
                            valid: true,
                            errorMessage: 'Must be a positive number',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 15,
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
                order: 16,
            }),
            new StringDictQuestion({
                key: 'ipfix',
                label: 'IP FIX',
                order: 25,
                required: false,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                relString: '',
            }),
            new HybridQuestion({
                key: 'src_payload_ref',
                label: 'Source Payload Ref',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'src_payload_ref').relString = componentData.src_payload_ref;
                    const src_payload_ref = componentData.src_payload_ref;
                    const src_payload_refRegex = new RegExp('^artifact--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (src_payload_ref != '' && !src_payload_refRegex.test(src_payload_ref))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format (artifact--[UUID])',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 18,
                relString: this.src_payload_ref,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                target: 'artifact',
                allowedRefsMap: ['artifact'],
            }),
            new HybridQuestion({
                key: 'dst_payload_ref',
                label: 'Destination Payload Ref',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'dst_payload_ref').relString = componentData.dst_payload_ref;
                    const dst_payload_ref = componentData.dst_payload_ref;
                    const dst_payload_refRegex = new RegExp('^artifact--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (dst_payload_ref != '' && !dst_payload_refRegex.test(dst_payload_ref))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format (artifact--[UUID])',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 18,
                relString: this.dst_payload_ref,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                target: 'artifact',
                allowedRefsMap: ['artifact'],
            }),
            new HybridQuestion({
                key: 'encapsulated_by_ref',
                label: 'Encapsulated by Ref',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'encapsulated_by_ref').relString = componentData.encapsulated_by_ref;
                    const encapsulated_by_ref = componentData.encapsulated_by_ref;
                    const encapsulated_by_refRegex = new RegExp(
                        '^network-traffic--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$'
                    );
                    if (encapsulated_by_ref != '' && !encapsulated_by_refRegex.test(encapsulated_by_ref))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format (network-traffic--[UUID])',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 19,
                relString: this.encapsulated_by_ref,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-12 pe-5',
                target: 'network-traffic',
                allowedRefsMap: ['network-traffic'],
            }),
            new TooltipDropdownQuestion({
                key: 'is_active',
                label: 'Is Active',
                validatorFn: (componentData: any) => {
                    let is_active = componentData.is_active[0];
                    if (is_active && is_active == 'true') {
                        if (componentData.end)
                            return {
                                valid: false,
                                errorMessage: 'Is Active MUST be false when End is present',
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                tooltip: 'Is Active will automatically be set to false when submitting if End has been set.',
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 17,
            }),
            new ProtocolArrayQuestion({
                key: 'protocols',
                label: 'Protocols*',
                options: PROTOCOL,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-12 pe-5',
                order: 21,
                required: true,
            }),
            new HybridArrayQuestion({
                key: 'encapsulates_refs',
                label: 'Encapsulates Refs',
                validatorFn: (componentData: any) => {
                    const encapsulates_refs = componentData.encapsulates_refs;
                    const encapsulates_refsRegex = new RegExp(
                        '^network-traffic--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$'
                    );
                    if (encapsulates_refs != '' && !encapsulates_refsRegex.test(encapsulates_refs))
                        return {
                            valid: false,
                            errorMessage: 'Must match the id format (network-traffic--[UUID])',
                        };
                    return {
                        valid: true,
                    };
                },
                value: new Array(),
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                order: 23,
                target: 'network-traffic',
                allowedRefsMap: ['network-traffic'],
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
    hasWindows(): boolean {
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
        this.start = componentData.start;
        this.end = componentData.end;
        if (this.end) this.is_active = false;
        else this.is_active = JSON.parse(componentData.is_active[0] || '""');
        this.src_ref = componentData.src_ref;
        this.dst_ref = componentData.dst_ref;
        this.src_port = parseInt(componentData.src_port) || undefined;
        this.dst_port = parseInt(componentData.dst_port) || undefined;
        this.src_byte_count = parseInt(componentData.src_byte_count) || undefined;
        this.dst_byte_count = parseInt(componentData.dst_byte_count) || undefined;
        this.src_packets = parseInt(componentData.src_packets) || undefined;
        this.dst_packets = parseInt(componentData.dst_packets) || undefined;
        this.ipfix = {};
        let ipfix = stixService.stringArrays.get('ipfix') || [];
        for (let i in ipfix) {
            let temp = ipfix[i].split(': ');
            this.ipfix[temp[0]] = temp[1];
        }
        this.src_payload_ref = componentData.src_payload_ref;
        this.dst_payload_ref = componentData.dst_payload_ref;
        this.encapsulated_by_ref = componentData.encapsulated_by_ref;
        this.defanged = JSON.parse(componentData.defanged[0] || '""');

        // Correcting order of protocols
        let protocols_order = [PROTOCOL]; // Order in which protocols should be in the output
        let ordered_protocols: any = [];
        let protocols = stixService.stringArrays.get('protocols') || [];
        // Add custom protocols
        for (let i in protocols) {
            ordered_protocols.push(protocols[i]);
        }
        this.protocols = ordered_protocols;

        this.encapsulates_refs = stixService.stringArrays.get('encapsulates_refs') || [];
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

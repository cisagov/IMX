import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { HashArrayQuestion } from '../dynamic-form-component/question-types/question-hash-array';
import { StixService } from '../stix-service.service';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { Content } from './content';
import { Window } from './window';

export class XCert extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    is_self_signed?: boolean;
    hashes?: any;
    version?: string;
    serial_number?: string;
    signature_algorithm?: string;
    issuer?: string;
    validity_not_before?: string;
    validity_not_after?: string;
    subject?: string;
    subject_public_key_algorithm?: string;
    subject_public_key_modulus?: string;
    subject_public_key_exponent?: number;
    defanged?: boolean;
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        is_self_signed?: boolean,
        hashes?: any | {},
        version?: string | '',
        serial_number?: string | '',
        signature_algorithm?: string | '',
        issuer?: string | '',
        validity_not_before?: string | '',
        validity_not_after?: string | '',
        subject?: string | '',
        subject_public_key_algorithm?: string | '',
        subject_public_key_modulus?: string | '',
        subject_public_key_exponent?: number,
        defanged?: boolean,
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.is_self_signed = is_self_signed;
        this.hashes = hashes || {};
        this.version = version;
        this.serial_number = serial_number;
        this.signature_algorithm = signature_algorithm;
        this.issuer = issuer;
        this.validity_not_before = validity_not_before;
        this.validity_not_after = validity_not_after;
        this.subject = subject;
        this.subject_public_key_algorithm = subject_public_key_algorithm;
        this.subject_public_key_modulus = subject_public_key_modulus;
        this.subject_public_key_exponent = subject_public_key_exponent;
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
                value: 'x509-certificate',
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
                value: `x509-certificate--`,
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
                key: 'serial_number',
                label: 'Serial Number',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'is_self_signed').target = componentData.is_self_signed;
                    questions.find((i) => i.key == 'version').target = componentData.version;
                    questions.find((i) => i.key == 'serial_number').target = componentData.serial_number;
                    questions.find((i) => i.key == 'signature_algorithm').target = componentData.signature_algorithm;
                    questions.find((i) => i.key == 'issuer').target = componentData.issuer;
                    questions.find((i) => i.key == 'validity_not_before').target = componentData.validity_not_before;
                    questions.find((i) => i.key == 'validity_not_after').target = componentData.validity_not_after;
                    questions.find((i) => i.key == 'subject').target = componentData.subject;
                    questions.find((i) => i.key == 'subject_public_key_algorithm').target = componentData.subject_public_key_algorithm;
                    questions.find((i) => i.key == 'subject_public_key_modulus').target = componentData.subject_public_key_modulus;
                    questions.find((i) => i.key == 'subject_public_key_exponent').target = componentData.subject_public_key_exponent;

                    return {
                        valid: true,
                    };
                },
                order: 4,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),

            new TextboxQuestion({
                key: 'version',
                label: 'Version',
                order: 5,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DatetimeQuestion({
                key: 'validity_not_before',
                label: 'Validity Not Before',
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 8,
            }),
            new DatetimeQuestion({
                key: 'validity_not_after',
                label: 'Validity Not After',

                validatorFn: (componentData: any) => {
                    // Check whether Modified Date is equal or after to Created Date
                    componentData['validity_not_before'] = this.stixService.convertToUTC('validity_not_before', componentData['validity_not_before']);
                    componentData['validity_not_after'] = this.stixService.convertToUTC('validity_not_after', componentData['validity_not_after']);
                    const beforeDateTime = Date.parse(componentData['validity_not_before']);
                    const afterDateTime = Date.parse(componentData['validity_not_after']);

                    if (afterDateTime && afterDateTime < beforeDateTime) {
                        return {
                            valid: false,
                            errorMessage: 'Validity Not After date must be after Validity not before.',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 9,
            }),
            new TextboxQuestion({
                key: 'issuer',
                label: 'Issuer',
                order: 6,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'signature_algorithm',
                label: 'Signature Algorithm',
                order: 11,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'subject',
                label: 'Subject',
                order: 12,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'subject_public_key_algorithm',
                label: 'Subject Public Key Algorithm',
                order: 13,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'subject_public_key_modulus',
                label: 'Subject Public Key Modulus',
                validatorFn: (componentData: any) => {
                    const subject_public_key_modulus = componentData.subject_public_key_modulus;
                    const regex = new RegExp('^[0-9a-fA-F]*$');
                    if (subject_public_key_modulus && !regex.test(subject_public_key_modulus))
                        return {
                            valid: false,
                            errorMessage: 'Subject Public Key Modulus must be a non-negative integer or hex',
                        };

                    return {
                        valid: true,
                    };
                },
                order: 14,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'subject_public_key_exponent',
                label: 'Subject Public Key Exponent',
                validatorFn: (componentData: any) => {
                    const subject_public_key_exponent = componentData.subject_public_key_exponent;
                    const regex = new RegExp('^[0-9]*$');
                    if (subject_public_key_exponent && !regex.test(subject_public_key_exponent))
                        return {
                            valid: false,
                            errorMessage: 'Subject Public Key Exponent must be a non-negative integer',
                        };

                    return {
                        valid: true,
                    };
                },
                type: 'number',
                order: 15,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'is_self_signed',
                label: 'Is Self Signed',
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 7,
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
                order: 17,
            }),
            new HashArrayQuestion({
                key: 'hashes',
                order: 25,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                tooltip: 'Use [ MD5, SHA-1, SHA-256, or SHA-512 ] whenever possible',
                relString: 'SHA-256',
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
        this.is_self_signed = JSON.parse(componentData.is_self_signed[0] || '""');
        this.hashes = {};

        let hashes = stixService.stringArrays.get('hashes') || [];
        for (let i in hashes) {
            let temp = hashes[i].split(': ');
            this.hashes[temp[0]] = temp[1];
        }

        this.version = componentData.version;
        this.serial_number = componentData.serial_number;
        this.signature_algorithm = componentData.signature_algorithm;
        this.issuer = componentData.issuer;
        this.validity_not_before = componentData.validity_not_before;
        this.validity_not_after = componentData.validity_not_after;
        this.subject = componentData.subject;
        this.subject_public_key_algorithm = componentData.subject_public_key_algorithm;
        this.subject_public_key_modulus = componentData.subject_public_key_modulus;
        this.subject_public_key_exponent = parseInt(componentData.subject_public_key_exponent) || undefined;
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

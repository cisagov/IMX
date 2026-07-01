import { v5 as uuidV5, v4 as uuidV4 } from 'uuid';
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
import { HashArrayQuestion } from '../dynamic-form-component/question-types/question-hash-array';
import { Window } from './window';
import { MIME } from './mime';
import { MimeQuestion } from '../dynamic-form-component/question-types/question-mime';
import { FileFieldUploadQuestion } from '../dynamic-form-component/question-types/question-file-field-upload';
import { NonBlankDropdownQuestion } from '../dynamic-form-component/question-types/question-non-blank-dropdown';

export class Artifact extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    mime_type?: string;
    payload_bin?: string;
    is_safe?: boolean;
    url?: string;
    hashes?: any;
    encryption_algorithm?: string;
    decryption_key?: string;
    defanged?: boolean;
    hashType?: string;
    hashValue?: string;
    hashError: string = '';

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        mime_type?: string | '',
        payload_bin?: string | '',
        is_safe?: boolean,
        url?: string | '',
        hashes?: any | {},
        encryption_algorithm?: string | '',
        decryption_key?: string | '',
        defanged?: boolean,
        hashType?: string | '',
        hashValue?: string | ''
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
        this.mime_type = mime_type;
        this.payload_bin = payload_bin;
        this.is_safe = is_safe;
        this.url = url;
        this.hashes = hashes || {};
        this.encryption_algorithm = encryption_algorithm;
        this.decryption_key = decryption_key;
        this.defanged = defanged;
        this.hashType = hashType;
        this.hashValue = hashValue;
        this.stixService.encoded = false;
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
                value: 'artifact',
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
                value: `artifact--`,
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
                key: 'url',
                label: 'URL',
                validatorFn: (componentData: any) => {
                    const url = componentData.url;
                    const payloadBin = componentData['payload_bin'];

                    if (!url && !payloadBin)
                        return {
                            valid: false,
                            errorMessage: 'URL or Payload Bin is required',
                        };

                    if (url && componentData['payload_bin'])
                        return {
                            valid: false,
                            errorMessage: 'URL and Payload Bin cannot be filled out together',
                        };

                    if (componentData.defanged != 'true' && !payloadBin) {
                        try {
                            new URL(url);
                        } catch (error) {
                            return {
                                valid: false,
                                errorMessage: 'Must be a valid URL (i.e. http://www.example.com)',
                            };
                        }
                    }

                    if (url && !this.stixService.stringArrays.get('hashes')?.length)
                        return {
                            valid: false,
                            errorMessage: 'URL and Hashes MUST be filled together',
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

            new DropdownQuestion({
                key: 'encryption_algorithm',
                label: 'Encryption Algorithm',
                options: [
                    { key: 'AES-256-GCM', value: 'AES-256-GCM' },
                    { key: 'ChaCha20-Poly1305', value: 'ChaCha20-Poly1305' },
                    { key: 'mime-type-indicated', value: 'Mime-Type-Indicated' },
                ],
                validatorFn: (componentData: any) => {
                    if (componentData['decryption_key']) {
                        if (
                            componentData['decryption_key'] &&
                            (!componentData['encryption_algorithm'] || componentData['encryption_algorithm'][0].length < 1)
                        ) {
                            return {
                                valid: false,
                                errorMessage: 'Encryption Algorithm must be present if Decryption Key is present',
                            };
                        }
                    }
                    return {
                        valid: true,
                    };
                },
                order: 5,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'decryption_key',
                label: 'Decryption Key',
                validatorFn: (componentData: any) => {
                    if (componentData['decryption_key']) {
                        if (
                            componentData['decryption_key'] &&
                            (!componentData['encryption_algorithm'] || componentData['encryption_algorithm'][0].length < 1)
                        ) {
                            return {
                                valid: false,
                                errorMessage: 'Encryption Algorithm must be present if Decryption Key is present',
                            };
                        }
                    }
                    return {
                        valid: true,
                    };
                },
                order: 6,
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
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 7,
            }),
            new MimeQuestion({
                key: 'mime_type',
                label: 'MIME Type',
                options: MIME,
                order: 8,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new NonBlankDropdownQuestion({
                key: 'is_safe',
                label: 'Is Safe',
                order: 9,
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                required: true,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new HashArrayQuestion({
                key: 'hashes',
                order: 10,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                tooltip: 'Use [ MD5, SHA-1, SHA-256, or SHA-512 ] whenever possible',
                relString: 'SHA-256',
                qtype: 'artifact',
            }),
            new FileFieldUploadQuestion({
                key: 'payload_bin',
                label: 'Payload Bin',
                validatorFn: (componentData: any) => {
                    const url = componentData.url;
                    const payloadBin = componentData['payload_bin'];

                    return {
                        valid: true,
                    };
                },
                order: 11,
                required: false,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
            }),
        ];

        return questions.sort((a, b) => a.order - b.order);
    }

    hasExternalReferences(): boolean {
        return false;
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
        if (componentData.payload_bin) {
            if (!this.stixService.encoded) {
                componentData.payload_bin = this.stringToBase64(componentData.payload_bin);
            } else {
                try {
                    let test = atob(componentData.payload_bin);
                } catch {
                    componentData.payload_bin = this.stringToBase64(componentData.payload_bin);
                }
            }
        }
        this.id = this.genUUIDv5(componentData.type, componentData);
        this.spec_version = componentData.spec_version;
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
        this.mime_type = componentData.mime_type;
        this.payload_bin = componentData.payload_bin;
        this.is_safe = JSON.parse(componentData.is_safe[0] || '""');

        this.url = componentData.url;
        this.defanged = JSON.parse(componentData.defanged[0] || '""');
        this.hashes = {};

        let hashes = stixService.stringArrays.get('hashes') || [];
        for (let i in hashes) {
            let temp = hashes[i].split(': ');
            this.hashes[temp[0]] = temp[1];
        }

        this.encryption_algorithm = componentData.encryption_algorithm[0];
        this.decryption_key = componentData.decryption_key;
        this.hashType = componentData.hashType;
        this.hashValue = componentData.hashValue;
    }

    private stringToBase64(str: string): string {
        const utf8Bytes = new TextEncoder().encode(str);
        let binary = '';
        for (let i = 0; i < utf8Bytes.length; i++) {
            binary += String.fromCharCode(utf8Bytes[i]);
        }
        return btoa(binary);
    }

    genUUIDv5(id: string, componentData: any): any {
        id = id + '--' + this.stixService.getUUIDFrIdContributingProperties(componentData);
        return id;
    }

    setExternalReferences(newExternalReferences: ExternalReference[]): void {
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

    setContents(newContents: Content[]): void {
        // N/a
    }

    setWindows(newWindows: Window[]): void {
        // N/a
    }
}

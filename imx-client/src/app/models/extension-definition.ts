import { v4 as uuid } from 'uuid';
import { Observable, of } from 'rxjs';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { IdentityQuestion } from '../dynamic-form-component/question-types/question-identity';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { OpenVocabArrayQuestion } from '../dynamic-form-component/question-types/question-ov-array';
import { StringArrayQuestion } from '../dynamic-form-component/question-types/question-string-array';
import { ExtensionTypeQuestion } from '../dynamic-form-component/question-types/question-extension-type';
import { FileUploadQuestion } from '../dynamic-form-component/question-types/question-file-upload';
import { StixService } from '../stix-service.service';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { Content } from './content';
import { Window } from './window';

export class ExtensionDefinition extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    created?: string;
    modified?: string;
    name?: string;
    description?: string;
    created_by_ref?: string;
    revoked?: boolean;
    schema?: string;
    version?: string;
    labels?: string[];
    extension_types?: string[];
    extension_properties?: string[];
    granular_markings?: GranularMarking[];
    external_references?: ExternalReference[];
    object_marking_refs?: string[];
    extensions?: Extension[];
    loaded?: boolean = false;

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        created?: string | '',
        modified?: string | '',
        name?: string | '',
        description?: string | '',
        created_by_ref?: string | '',
        revoked?: boolean,
        schehma?: string | '',
        version?: string | '',
        labels?: string[] | [],
        extension_types?: string[] | [],
        extension_properties?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        external_references?: ExternalReference[] | [],
        object_marking_refs?: string[] | [],
        extensions?: Extension[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.created = created;
        this.modified = modified;
        this.name = name;
        this.description = description;
        this.created_by_ref = created_by_ref;
        this.revoked = revoked;
        this.schema = schehma;
        this.version = version;
        this.labels = labels;
        this.extension_types = extension_types;
        this.extension_properties = extension_properties;
        this.granular_markings = granular_markings;
        this.external_references = external_references;
        this.object_marking_refs = object_marking_refs;
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

    getQuestions(): QuestionBase<any>[] {
        let questions: QuestionBase<any>[] = [
            new TextboxQuestion({
                key: 'type',
                label: 'Type',
                value: 'extension-definition',
                required: true,
                order: 2,
                type: 'text',
                readonly: true,
                columnWidth: 'col-2 type',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'id',
                label: 'ID',
                value: `extension-definition--${uuid()}`,
                required: true,
                readonly: true,
                order: 1,
                type: 'text',
                columnWidth: 'col-5 id',
                nonGuidedCol: 'col-12 pe-5',
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
                columnWidth: 'col-2 created',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 4,
            }),
            new DatetimeQuestion({
                key: 'modified',
                label: 'Modified*',
                validatorFn: (componentData: any) => {
                    // Check whether Modified Date is equal or after to Created Date
                    let createdDateTime = Date.parse(componentData['created']);
                    let modifiedDateTime = Date.parse(componentData['modified']);

                    if (modifiedDateTime && modifiedDateTime < createdDateTime) {
                        return {
                            valid: false,
                            errorMessage: 'Modified date must be after Created date.',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-2 modified',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 5,
            }),
            new TextboxQuestion({
                key: 'name',
                label: 'Name*',
                order: 6,
                required: true,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'description',
                label: 'Description',
                order: 7,
                required: false,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
            }),
            new IdentityQuestion({
                key: 'created_by_ref',
                label: 'Created By Ref*',
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
                order: 8,
                required: true,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'revoked',
                label: 'Revoked',
                type: 'boolean',
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'd-none',
                revokedCol: 'col-6 pe-5',
                order: 13,
            }),
            new TextboxQuestion({
                key: 'schema',
                label: 'Schema*',
                order: 10,
                required: true,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'version',
                label: 'Version*',
                order: 11,
                required: true,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new FileUploadQuestion({
                key: 'file-upload',
                label: 'Upload Schema (*.json)',
                order: 12,
                required: false,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
                revokedCol: 'col-6 pe-5',
            }),
            new ExtensionTypeQuestion({
                key: 'extension_types',
                label: 'Extension Types*',
                options: [
                    { key: 'new-sdo', value: 'New SDO' },
                    { key: 'new-sro', value: 'New SRO' },
                    { key: 'new-sco', value: 'New SCO' },
                    { key: 'property-extension', value: 'Property Extension' },
                    { key: 'toplevel-property-extension', value: 'Toplevel Property Extension' },
                ] /*
                validatorFn: (componentData: any) => {
                    let extension_type = componentData['extension_types'];
                    let errorMessage = '';
                    if (this.stixService.stringArrays.has('extension_types') && this.stixService.stringArrays.get('extension_types')?.indexOf(extension_type) != -1)
                        errorMessage = 'Extension Type already exists on this object';

                    return {
                        valid: true,
                        errorMessage: errorMessage
                    };
                }, */,
                value: new Array(),
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-12 pe-5',
                order: 14,
                marginRight: true,
            }),
            new StringArrayQuestion({
                key: 'extension_properties',
                label: 'Extension Properties',
                validatorFn: (componentData: any) => {
                    let extension_properties = componentData['extension_properties'];

                    if (extension_properties != '') {
                        if (
                            this.stixService.stringArrays.get('extension_types') &&
                            this.stixService.stringArrays.get('extension_types')!.indexOf('toplevel-property-extension') == -1
                        ) {
                            return {
                                valid: false,
                                errorMessage: "Extension Properties must only be used if Extension Types includes 'toplevel-property-extension'",
                            };
                        }

                        for (let char of extension_properties) {
                            if (char === char.toUpperCase() && char !== char.toLowerCase()) {
                                return {
                                    valid: false,
                                    errorMessage: 'An Extension Property may only contain lowercase letters, numbers, and underscores (_)',
                                };
                            }
                        }

                        if (extension_properties.length < 3) {
                            return {
                                valid: false,
                                errorMessage: 'An Extension Property must have a minimum length of 3 characters',
                            };
                        }

                        if (extension_properties.length > 250) {
                            return {
                                valid: false,
                                errorMessage: 'An Extension Property must have a maximum length of 250 characters',
                            };
                        }
                    }

                    if (
                        (this.stixService.stringArrays.get('extension_properties') || []).length > 0 &&
                        (this.stixService.stringArrays.get('extension_types') == undefined ||
                            (this.stixService.stringArrays.get('extension_types') &&
                                this.stixService.stringArrays.get('extension_types')!.indexOf('toplevel-property-extension') == -1))
                    ) {
                        return {
                            valid: false,
                            errorMessage: "Extension Properties must only be used if Extension Types includes 'toplevel-property-extension'",
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-12 pe-5',
                order: 15,
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
        return false;
    }

    hasObjectMarkingReferences(): boolean {
        return true;
    }

    hasWindows(): boolean {
        return false;
    }

    populateFromJSON(componentData: any, stixService: StixService): void {
        this.type = componentData.type;
        this.id = componentData.id;
        this.spec_version = componentData.spec_version;
        this.created = componentData.created;
        this.modified = componentData.modified;
        this.name = componentData.name;
        this.description = componentData.description;
        this.created_by_ref = componentData.created_by_ref;
        this.revoked = JSON.parse(componentData.revoked[0] || '""');
        this.schema = componentData.schema;
        this.version = componentData.version;
        this.labels = stixService.stringArrays.get('labels') || [];
        this.extension_types = stixService.stringArrays.get('extension_types') || [];
        for (let x in this.extension_types) {
            if (this.extension_types[x].includes('new-')) {
                this.extension_types[x] = this.extension_types[x].substring(0, 7);
            }
        }
        this.extension_properties = stixService.stringArrays.get('extension_properties') || [];
        this.granular_markings = componentData.granular_markings;
        this.external_references = componentData.external_references;
        this.object_marking_refs = componentData.object_marking_refs;
        this.extensions = componentData.extensions;
        const objectsToAdd = JSON.parse(JSON.stringify(this.stixService.modalObjectArray)).map((object) => {
            return { id: object.id, index: this.stixService.imxCacheIndex++, object: object };
        });
        this.stixService.db.imxCache.bulkPut(objectsToAdd);
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

    setContents(newContents: Content[]): void {
        // N/a
    }

    setObjectMarkingRefs(newObjectMarkingRefs: string[]): void {
        this.object_marking_refs = newObjectMarkingRefs;
    }

    setWindows(newWindows: Window[]): void {
        // N/a
    }
}

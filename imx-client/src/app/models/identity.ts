import { v4 as uuid } from 'uuid';
import { Observable, of } from 'rxjs';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { IdentityQuestion } from '../dynamic-form-component/question-types/question-identity';
import { EmailQuestion } from '../dynamic-form-component/question-types/question-email-address';
import { PhoneQuestion } from '../dynamic-form-component/question-types/question-phone-number';
import { SocialQuestion } from '../dynamic-form-component/question-types/question-social-media';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { StringArrayQuestion } from '../dynamic-form-component/question-types/question-string-array';
import { OpenVocabArrayQuestion } from '../dynamic-form-component/question-types/question-ov-array';
import { StixService } from '../stix-service.service';
import { Content } from './content';
import { LANGUAGES } from './languages';
import { Window } from './window';

export class Identity extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    created_by_ref?: string;

    // Identity Contact Information Extension
    websites?: string[];
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    prefix?: string;
    suffix?: string;
    // contact_numbers?: string[];
    // email_addresses?: string[];
    // social_media_accounts?: string[];


    // Contact Number Object Type
    contact_number?: string;
    phone_description?: string;
    phone_classified?: boolean;
    contact_number_type?: string;

    // Email Contact Object Type
    email_description?: string;
    email_classified?: boolean;
    email_digital_contact_type?: string;
    email_address_ref?: string;

    // Social Media Contact Object Type
    social_description?: string;
    user_account_ref?: string; // For social media
    social_classified?: boolean;
    social_digital_contact_type?: string;

    name?: string;
    description?: string;
    roles?: string[];
    identity_class?: string[];
    labels?: string[];
    confidence?: number;
    lang?: string;
    external_references?: ExternalReference[];
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    created?: string;
    modified?: string;
    revoked?: boolean;
    sectors?: string[];
    contact_information?: string;
    loaded?: boolean = false;
    stixService?: StixService;

    constructor(
        stixService?: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        created_by_ref?: string | '',

        // Identity Contact Information Extension
        websites?: string[] | [],
        first_name?: string | '',
        middle_name?: string | '',
        last_name?: string | '',
        prefix?: string | '',
        suffix?: string | '',

        // Contact Number Object Type
        contact_number?: string | '',
        phone_description?: string | '',
        phone_classified?: boolean,
        contact_number_type?: string | '',

        // Email Contact Object Type
        email_address_ref?: string | '',
        email_digital_contact_type?: string | '',
        email_description?: string | '',
        email_classified?: boolean,

        // Social Media Contact Object Type
        social_description?: string | '',
        user_account_ref?: string | '', // For social media
        social_classified?: boolean,
        social_digital_contact_type?: string | '',

        name?: string | '',
        description?: string | '',
        roles?: string[] | [],
        identity_class?: string[] | [],
        labels?: string[] | [],
        confidence?: number,
        lang?: string | '',
        external_references?: ExternalReference[] | [],
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        created?: string | '',
        modified?: string | '',
        revoked?: boolean,
        sectors?: string[] | [],
        contact_information?: string | ''
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.created_by_ref = created_by_ref;

        this.websites = websites;
        this.first_name = first_name;
        this.middle_name = middle_name;
        this.last_name = last_name;
        this.prefix = prefix;
        this.suffix = suffix;

        this.contact_number = contact_number;
        this.phone_classified = phone_classified;
        this.phone_description = phone_description;
        this.contact_number_type = contact_number_type;

        this.email_address_ref = email_address_ref;
        this.email_classified = email_classified;
        this.email_description = email_description;
        this.email_digital_contact_type = email_digital_contact_type;

        this.user_account_ref = user_account_ref;
        this.social_classified = social_classified;
        this.social_description = social_description;
        this.social_digital_contact_type = social_digital_contact_type;

        this.name = name;
        this.description = description;
        this.roles = roles;
        this.identity_class = identity_class;
        this.labels = labels;
        this.confidence = confidence;
        this.lang = lang;
        this.external_references = external_references;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
        this.created = created;
        this.modified = modified;
        this.revoked = revoked;
        this.sectors = sectors;
        this.contact_information = contact_information;
        this.stixService = stixService;
    }

    getExternalReferences(): ExternalReference[] {
        return this.external_references || [];
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
                value: this.id || `identity--${uuid()}`,
                validatorFn: (componentData: any) => {
                    const id = componentData.id;
                    const idRegex = new RegExp('^identity--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (!idRegex.test(id))
                        return {
                            valid: false,
                            errorMessage: "Must begin with 'identity--' and followed by a UUID (i.e. opinion--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                        };
                    return {
                        valid: true,
                    };
                },
                required: true,
                order: 1,
                type: 'text',
                readonly: true,
                columnWidth: 'col-5 id',
                nonGuidedCol: 'col-12 pe-5',
            }),
            new TextboxQuestion({
                key: 'type',
                label: 'Type',
                value: 'identity',
                required: true,
                order: 2,
                type: 'text',
                readonly: true,
                columnWidth: 'col-2 type',
                nonGuidedCol: 'col-6 pe-5',
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

                    if (modifiedDateTime && modifiedDateTime < createdDateTime && !this.stixService.newObject) {
                        return {
                            valid: false,
                            errorMessage: 'Modified date must be after created date.',
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
                columnWidth: 'col-3 name',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'first_name',
                label: 'First Name',
                order: 7,
                validatorFn: (componentData: any) => {
                    if(componentData.first_name !== '') {
                        const hasPhone = componentData.contact_number || '' !== '';
                        const hasEmailAddress = componentData.email_address_ref || '' !== '';
                        const hasSocialMedia = componentData.user_account_ref || '' !== '';
                        const hasContactValue = hasPhone || hasEmailAddress || hasSocialMedia;
                        if (!hasContactValue) {
                                return {
                                    valid: false,
                                    errorMessage: 'At least one contact method (phone, email, or social media) is required.',
                                };
                        }
                    }
                    return { valid: true };
                },
                required: false,
                columnWidth: 'col-3 name',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'middle_name',
                label: 'Middle Name',
                order: 8,
                validatorFn: (componentData: any) => {
                    if(componentData.middle_name !== '') {
                        const hasPhone = componentData.contact_number || '' !== '';
                        const hasEmailAddress = componentData.email_address_ref || '' !== '';
                        const hasSocialMedia = componentData.user_account_ref || '' !== '';
                        const hasContactValue = hasPhone || hasEmailAddress || hasSocialMedia;
                        if (!hasContactValue) {
                                return {
                                    valid: false,
                                    errorMessage: 'At least one contact method (phone, email, or social media) is required.',
                                };
                        }
                    }
                    return { valid: true };
                },
                required: false,
                columnWidth: 'col-3 name',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'last_name',
                label: 'Last Name',
                order: 9,
                validatorFn: (componentData: any) => {
                    if(componentData.last_name !== '') {
                        const hasPhone = componentData.contact_number || '' !== '';
                        const hasEmailAddress = componentData.email_address_ref || '' !== '';
                        const hasSocialMedia = componentData.user_account_ref || '' !== '';
                        const hasContactValue = hasPhone || hasEmailAddress || hasSocialMedia;
                        if (!hasContactValue) {
                                return {
                                    valid: false,
                                    errorMessage: 'At least one contact method (phone, email, or social media) is required.',
                                };
                        }
                    }
                    return { valid: true };
                },
                required: false,
                columnWidth: 'col-3 name',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'prefix',
                label: 'Prefix',
                options: [
                    { key: 'mr', value: 'Mr.' },
                    { key: 'mrs', value: 'Mrs.' },
                    { key: 'ms', value: 'Ms.' },
                    { key: 'dr', value: 'Dr.' },
                    { key: 'prof', value: 'Prof.' },
                ],
                validatorFn: (componentData: any) => {
                    if(componentData.prefix && !!componentData.prefix?.[0]) {
                        const hasPhone = componentData.contact_number || '' !== '';
                        const hasEmailAddress = componentData.email_address_ref || '' !== '';
                        const hasSocialMedia = componentData.user_account_ref || '' !== '';
                        const hasContactValue = hasPhone || hasEmailAddress || hasSocialMedia;
                        if (!hasContactValue) {
                                return {
                                    valid: false,
                                    errorMessage: 'At least one contact method (phone, email, or social media) is required.',
                                };
                        }
                    }
                    return { valid: true };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 10,
            }),
            new DropdownQuestion({
                key: 'suffix',
                label: 'Suffix',
                options: [
                    { key: 'jr', value: 'Jr.' },
                    { key: 'sr', value: 'Sr.' },
                    { key: 'ii', value: 'II' },
                    { key: 'iii', value: 'III' },
                    { key: 'phd', value: 'PhD' },
                    { key: 'md', value: 'MD' },
                ],
                validatorFn: (componentData: any) => {
                    if(componentData.suffix && !!componentData.suffix?.[0]) {
                        const hasPhone = componentData.contact_number || '' !== '';
                        const hasEmailAddress = componentData.email_address_ref || '' !== '';
                        const hasSocialMedia = componentData.user_account_ref || '' !== '';
                        const hasContactValue = hasPhone || hasEmailAddress || hasSocialMedia;
                        if (!hasContactValue) {
                                return {
                                    valid: false,
                                    errorMessage: 'At least one contact method (phone, email, or social media) is required.',
                                };
                        }
                    }
                    return { valid: true };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 11,
            }),
            new TextboxQuestion({
                key: 'description',
                label: 'Description',
                order: 12,
                required: false,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
            }),
            new TextboxQuestion({
                key: 'confidence',
                label: 'Confidence',
                validatorFn: (componentData: any) => {
                    const confidence = componentData.confidence;
                    const confidenceRegex = new RegExp('^(?:100|[1-9]?[0-9])$');
                    if (confidence) {
                        if (!confidenceRegex.test(confidence))
                            return {
                                valid: false,
                                errorMessage: 'Confidence value must be an integer in the range of 0-100',
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-2 confidence',
                nonGuidedCol: 'col-6 pe-5',
                order: 13,
                required: false,
                type: 'number',
            }),
            new DropdownQuestion({
                key: 'lang',
                label: 'Language',
                options: LANGUAGES,
                order: 14,
                required: false,
                columnWidth: 'col-3 language',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new IdentityQuestion({
                key: 'created_by_ref',
                label: 'Created By Ref',
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
                order: 15,
                required: false,
                columnWidth: 'col-4 created-by-ref',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new PhoneQuestion({
                key: 'contact_number',
                label: 'Phone Number',
                validatorFn: (componentData: any) => {
                    const phone = componentData.contact_number || '';
                    const phoneType = componentData.phoneType?.trim() || '';
                    const phoneRegex = /^[0-9\s\-\.\(\)]{10,20}$/;

                    if(phone === '' && phoneType === '') { return { valid: true }; }
                    if(phoneType !== '' && phone === '') {
                        return {
                            valid: false,
                            errorMessage: 'Please enter a phone number.'
                        };
                    }
                    if(phone !== '') {
                        if(!phoneRegex.test(phone)) {
                            return {
                                valid: false,
                                errorMessage: 'Phone number must contain only digits, spaces, dashes, periods, or parenthesis, and be at least 10 digits long.',
                            };
                        }
                    }

                    return { valid: true };
                },
                relString: this.contact_number,
                phoneType: this.contact_number_type,
                order: 16,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'phone_classified',
                label: 'Phone Classification',
                options: [
                    { key: 'true', value: 'Classified' },
                    { key: 'false', value: 'Unclassified' }
                ],
                validatorFn: (componentData: any) => {
                    const phone = componentData.contact_number || '';
                    const phoneClassified = !!componentData.phone_classified?.[0];

                    if(phoneClassified && phone === '') {
                        return {
                            valid: false,
                            errorMessage: 'Phone Number is required when classification is set.'
                        };
                    }
                    return { valid: true };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 17,
            }),
            new TextboxQuestion({
                key: 'phone_description',
                label: 'Phone Description',
                order: 18,
                validatorFn: (componentData: any) => {
                    const phone = componentData.contact_number || '';
                    const phoneDescription = !!componentData.phone_description?.[0];

                    if(phoneDescription && phone === '') {
                        return {
                            valid: false,
                            errorMessage: 'Phone Number is required when description is set.'
                        };
                    }
                    return { valid: true };
                },
                columnWidth: 'col-2 type',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new EmailQuestion({
                key: 'email_address_ref',
                label: 'Email Address Ref',
                validatorFn: (componentData: any) => {
                    const email_address_ref = componentData.email_address_ref || '';
                    const emailAddressType = componentData.emailAddressType || '';

                    if(email_address_ref === '' && emailAddressType === '') { return { valid: true }; }
                    if(emailAddressType !== '' && email_address_ref === '') { return { valid: false, errorMessage: 'Please select an email address.' }; }

                    const created_by_refRegex = new RegExp('email-addr--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}');
                    if (email_address_ref !== '') {
                        if (!created_by_refRegex.test(email_address_ref))
                            return {
                                valid: false,
                                errorMessage:
                                    "Must begin with 'email-addr--' and followed by a UUID (i.e. email-addr--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                relString: this.email_address_ref,
                emailAddressType: this.email_digital_contact_type,
                order: 19,
                required: false,
                columnWidth: 'col-4',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'email_classified',
                label: 'Email Classification',
                options: [
                    { key: 'true', value: 'Classified' },
                    { key: 'false', value: 'Unclassified' }
                ],
                validatorFn: (componentData: any) => {
                    const email = componentData.email_address_ref || '';
                    const emailClassified = !!componentData.email_classified?.[0];

                    if(emailClassified && email === '') {
                        return {
                            valid: false,
                            errorMessage: 'Email Address Ref is required when classification is set.'
                        };
                    }
                    return { valid: true };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 20,
            }),
            new TextboxQuestion({
                key: 'email_description',
                label: 'Email Description',
                order: 21,
                validatorFn: (componentData: any) => {
                    const email = componentData.email_address_ref || '';
                    const emailDescription = !!componentData.email_description?.[0];

                    if(emailDescription && email === '') {
                        return {
                            valid: false,
                            errorMessage: 'Email Address Ref is required when description is set.'
                        };
                    }
                    return { valid: true };
                },
                columnWidth: 'col-2 type',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new SocialQuestion({
                key: 'user_account_ref',
                label: 'Social Media Ref',
                validatorFn: (componentData: any) => {
                    const user_account_ref = componentData.user_account_ref || '';
                    const socialMediaType = componentData.socialMediaType || '';

                    if(user_account_ref === '' && socialMediaType === '') { return { valid: true }; }
                    if(socialMediaType !== '' && user_account_ref === '') { return { valid: false, errorMessage: 'Please select a user account.' }; }

                    const created_by_refRegex = new RegExp('user-account--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}');
                    if (user_account_ref !== '') {
                        if (!created_by_refRegex.test(user_account_ref))
                            return {
                                valid: false,
                                errorMessage:
                                    "Must begin with 'user-account--' and followed by a UUID (i.e. user-account--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                relString: this.user_account_ref,
                socialMediaType: this.social_digital_contact_type,
                order: 22,
                required: false,
                columnWidth: 'col-4',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'social_classified',
                label: 'Social Classification',
                options: [
                    { key: 'true', value: 'Classified' },
                    { key: 'false', value: 'Unclassified' }
                ],
                validatorFn: (componentData: any) => {
                    const social = componentData.user_account_ref || '';
                    const socialClassified = !!componentData.social_classified?.[0];

                    if(socialClassified && social === '') {
                        return {
                            valid: false,
                            errorMessage: 'Social Media Ref is required when classification is set.'
                        };
                    }
                    return { valid: true };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 23,
            }),
            new TextboxQuestion({
                key: 'social_description',
                label: 'Social Description',
                order: 24,
                validatorFn: (componentData: any) => {
                    const social = componentData.user_account_ref || '';
                    const socialDescription = !!componentData.social_description?.[0];

                    if(socialDescription && social === '') {
                        return {
                            valid: false,
                            errorMessage: 'Social Media Ref is required when description is set.'
                        };
                    }
                    return { valid: true };
                },
                columnWidth: 'col-2 type',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new StringArrayQuestion({
                key: 'websites',
                label: 'Websites',
                value: new Array(),
                columnWidth: 'col-6',
                revokedCol: 'col-12 pe-5',
                nonGuidedCol: 'col-6 pe-5',
                order: 25,
                validatorFn: (componentData: any) => {
                    if(this.stixService.stringArrays.get('websites') && this.stixService.stringArrays.get('websites').length > 0) {
                        const hasPhone = componentData.contact_number || '' !== '';
                        const hasEmailAddress = componentData.email_address_ref || '' !== '';
                        const hasSocialMedia = componentData.user_account_ref || '' !== '';
                        const hasContactValue = hasPhone || hasEmailAddress || hasSocialMedia;
                        if (!hasContactValue) {
                                return {
                                    valid: false,
                                    errorMessage: 'At least one contact method (phone, email, or social media) is required.',
                                };
                        }
                    }
                    return { valid: true };
                },
                marginRight: true,
            }),
            new DropdownQuestion({
                key: 'identity_class',
                label: 'Identity Class',
                options: [
                    { key: 'individual', value: 'Individual' },
                    { key: 'group', value: 'Group' },
                    { key: 'system', value: 'System' },
                    { key: 'organization', value: 'Organization' },
                    { key: 'class', value: 'Class' },
                    { key: 'unknown', value: 'Unknown' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 26,
            }),
            new OpenVocabArrayQuestion({
                key: 'sectors',
                label: 'Sectors',
                multiple: true,
                options: [
                    // { key: '', value: '' },
                    { key: 'agriculture', value: 'Agriculture' },
                    { key: 'aerospace', value: 'Aerospace' },
                    { key: 'automotive', value: 'Automotive' },
                    { key: 'chemical', value: 'Chemical' },
                    { key: 'commercial', value: 'Commercial' },
                    { key: 'communications', value: 'Communications' },
                    { key: 'construction', value: 'Construction' },
                    { key: 'defense', value: 'Defense' },
                    { key: 'education', value: 'Education' },
                    { key: 'energy', value: 'Energy' },
                    { key: 'entertainment', value: 'Entertainment' },
                    { key: 'financial-services', value: 'Financial Services' },
                    { key: 'government', value: 'Government' },
                    { key: 'emergency-services', value: 'Emergency Services' },
                    { key: 'government-local', value: 'Government Local' },
                    { key: 'government-national', value: 'Government National' },
                    { key: 'government-public-services', value: 'Government Public Services' },
                    { key: 'government-regional', value: 'Government Regional' },
                    { key: 'healthcare', value: 'Healthcare' },
                    { key: 'hospitality-leisure', value: 'Hospitality Leisure' },
                    { key: 'infrastructure', value: 'Infrastructure' },
                    { key: 'dams', value: 'Dams' },
                    { key: 'nuclear', value: 'Nuclear' },
                    { key: 'water', value: 'Water' },
                    { key: 'insurance', value: 'Insurance' },
                    { key: 'legal', value: 'Legal' },
                    { key: 'manufacturing', value: 'Manufacturing' },
                    { key: 'mining', value: 'Mining' },
                    { key: 'non-profit', value: 'Non-Profit' },
                    { key: 'pharmaceuticals', value: 'Pharmaceuticals' },
                    { key: 'retail', value: 'Retail' },
                    { key: 'technology', value: 'Technology' },
                    { key: 'telecommunications', value: 'Telecommunications' },
                    { key: 'transportation', value: 'Transportation' },
                    { key: 'utilities', value: 'Utilities' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 27,
                marginRight: true,
            }),
            new DropdownQuestion({
                key: 'revoked',
                label: 'Revoked',
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'd-none',
                revokedCol: 'col-6 pe-5',
                order: 28,
            }),
            new StringArrayQuestion({
                key: 'roles',
                label: 'Roles',
                value: new Array(),
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                revokedCol: 'col-12 pe-5',
                order: 29,
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
        return true;
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
        this.id = componentData.id;
        this.spec_version = componentData.spec_version;
        this.created_by_ref = componentData.created_by_ref;
        this.extractIdentityContactInfoFromExtension(componentData, stixService);
        this.name = componentData.name;
        this.description = componentData.description;
        this.roles = stixService.stringArrays.get('roles') || [];
        this.identity_class = componentData.identity_class[0];
        this.labels = stixService.stringArrays.get('labels') || [];
        this.confidence = parseInt(componentData.confidence) || undefined;
        this.lang = componentData.lang[0];
        this.external_references = componentData.external_references;
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
        this.created = componentData.created;
        this.modified = componentData.modified;
        this.revoked = JSON.parse(componentData.revoked[0] || '""');
        this.sectors = stixService.stringArrays.get('sectors') || [];
        this.contact_information = componentData.contact_information;
    }

    setExternalReferences(newExternalReferences: ExternalReference[]): void {
        this.external_references = newExternalReferences;
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

    setObjectMarkingRefs(newObjectMarkingRefs: string[]): void {
        this.object_marking_refs = newObjectMarkingRefs;
    }
    setWindows(newWindows: Window[]): void {
        // N/a
    }
    extractIdentityContactInfoFromExtension(componentData: any, stixService: StixService) {
        let obj = stixService.bundle.objects.find(o => o.id === componentData.id);
        if(!obj || !obj.extensions) { return; }

        const EXT_ID = 'extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498';
        const extension = obj.extensions[EXT_ID];
        if(!extension) return;

        // Retrieve generic fields
        this.first_name = extension.first_name || '';
        this.middle_name = extension.middle_name || '';
        this.last_name = extension.last_name || '';
        this.prefix = extension.prefix || '';
        this.suffix = extension.suffix || '';
        this.websites = extension.websites || [];


        if(Array.isArray(extension.contact_numbers) && extension.contact_numbers.length > 0) {
            this.contact_number = extension.contact_numbers[0]?.contact_number || '';
            this.contact_number_type = extension.contact_numbers[0]?.contact_number_type || '';
            this.phone_classified = extension.classified;
            this.phone_description = extension.description;
        }

        if(Array.isArray(extension.email_addresses) && extension.email_addresses.length > 0) {
            this.email_address_ref = extension.email_addresses[0]?.email_address_ref || '';
            this.email_digital_contact_type = extension.email_addresses[0]?.digital_contact_type || '';
            this.email_classified = extension.classified;
            this.email_description = extension.description;
        }

        if(Array.isArray(extension.social_media_accounts) && extension.social_media_accounts.length > 0) {
            this.user_account_ref = extension.social_media_accounts[0]?.user_account_ref || '';
            this.social_digital_contact_type = extension.social_media_accounts[0]?.digital_contact_type || '';
            this.social_classified = extension.classified;
            this.social_description = extension.description;
        }

        return;
    }
}

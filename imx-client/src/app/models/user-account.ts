import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { StixService } from '../stix-service.service';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { Content } from './content';
import { Window } from './window';
import { MimeQuestion } from '../dynamic-form-component/question-types/question-mime';

export class UserAccount extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    user_id?: string;
    credential?: string;
    account_login?: string;
    account_type?: string;
    display_name?: string;
    is_service_account?: boolean;
    is_privileged?: boolean;
    can_escalate_privs?: boolean;
    is_disabled?: boolean;
    account_created?: string;
    account_expires?: string;
    credential_last_changed?: string;
    account_first_login?: string;
    account_last_login?: string;
    defanged?: boolean;
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        user_id?: string | '',
        credential?: string | '',
        account_login?: string | '',
        account_type?: string | '',
        display_name?: string | '',
        is_service_account?: boolean | undefined,
        is_privileged?: boolean | undefined,
        can_escalate_privs?: boolean | undefined,
        is_disabled?: boolean | undefined,
        account_created?: string | '',
        account_expires?: string | '',
        credential_last_changed?: string | '',
        account_first_login?: string | '',
        account_last_login?: string | '',
        defanged?: boolean,
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | []
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.user_id = user_id;
        this.credential = credential;
        this.account_login = account_login;
        this.account_type = account_type;
        this.display_name = display_name;
        this.is_service_account = is_service_account;
        this.is_privileged = is_privileged;
        this.can_escalate_privs = can_escalate_privs;
        this.is_disabled = is_disabled;
        this.account_created = account_created;
        this.account_expires = account_expires;
        this.credential_last_changed = credential_last_changed;
        this.account_first_login = account_first_login;
        this.account_last_login = account_last_login;
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
                value: 'user-account',
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
                value: `user-account--`,
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
                key: 'user_id',
                label: 'User ID',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'user_id').relString = componentData.user_id;
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
                key: 'credential',
                label: 'Credential',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'credential').relString = componentData.credential;
                    return {
                        valid: true,
                    };
                },
                order: 5,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'account_login',
                label: 'Account Login',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'account_login').relString = componentData.account_login;
                    return {
                        valid: true,
                    };
                },
                order: 6,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new MimeQuestion({
                key: 'account_type',
                label: 'Account Type',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'account_type').relString = componentData.account_type;
                    return {
                        valid: true,
                    };
                },
                options: [
                    { key: 'facebook', value: 'facebook' },
                    { key: 'ldap', value: 'ldap' },
                    { key: 'nis', value: 'nis' },
                    { key: 'openid', value: 'openid' },
                    { key: 'radius', value: 'radius' },
                    { key: 'skype', value: 'skype' },
                    { key: 'tacacs', value: 'tacacs' },
                    { key: 'twitter', value: 'twitter' },
                    { key: 'unix', value: 'unix' },
                    { key: 'windows-local', value: 'windows-local' },
                    { key: 'windows-domain', value: 'windows-domain' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 7,
            }),
            new TextboxQuestion({
                key: 'display_name',
                label: 'Display Name',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'display_name').relString = componentData.display_name;
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
                key: 'is_service_account',
                label: 'Is Service Account',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'is_service_account').relString = componentData.is_service_account;
                    return {
                        valid: true,
                    };
                },
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 9,
            }),
            new DropdownQuestion({
                key: 'is_privileged',
                label: 'Is Privileged',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'is_privileged').relString = componentData.is_privileged;
                    return {
                        valid: true,
                    };
                },
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 10,
            }),
            new DropdownQuestion({
                key: 'can_escalate_privs',
                label: 'Can Escalate Privs',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'can_escalate_privs').relString = componentData.can_escalate_privs;
                    return {
                        valid: true,
                    };
                },
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 11,
            }),
            new DropdownQuestion({
                key: 'is_disabled',
                label: 'Is Disabled',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'is_disabled').relString = componentData.is_disabled;
                    return {
                        valid: true,
                    };
                },
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 12,
            }),
            new DatetimeQuestion({
                key: 'account_created',
                label: 'Account Created',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'account_created').relString = componentData.account_created;
                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 13,
            }),
            new DatetimeQuestion({
                key: 'account_expires',
                label: 'Account Expires',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'account_expires').relString = componentData.account_expires;

                    componentData['account_created'] = this.stixService.convertToUTC('account_created', componentData['account_created']);
                    componentData['account_expires'] = this.stixService.convertToUTC('account_expires', componentData['account_expires']);
                    const createdDateTime = Date.parse(componentData['account_created']);
                    const expiresDateTime = Date.parse(componentData['account_expires']);

                    if (expiresDateTime && expiresDateTime < createdDateTime) {
                        return {
                            valid: false,
                            errorMessage: 'Expiry Date must be after Account Created Date.',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 14,
            }),
            new DatetimeQuestion({
                key: 'credential_last_changed',
                label: 'Credential Last Changed',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'credential_last_changed').relString = componentData.credential_last_changed;

                    componentData['account_created'] = this.stixService.convertToUTC('account_created', componentData['account_created']);
                    componentData['credential_last_changed'] = this.stixService.convertToUTC(
                        'credential_last_changed',
                        componentData['credential_last_changed']
                    );
                    const createdDateTime = Date.parse(componentData['account_created']);
                    const changedDateTime = Date.parse(componentData['credential_last_changed']);

                    if (changedDateTime && changedDateTime < createdDateTime) {
                        return {
                            valid: false,
                            errorMessage: 'Last Changed Date must be after Account Created Date.',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 15,
            }),
            new DatetimeQuestion({
                key: 'account_first_login',
                label: 'Account First Login',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'account_first_login').relString = componentData.account_first_login;

                    componentData['account_created'] = this.stixService.convertToUTC('account_created', componentData['account_created']);
                    componentData['account_first_login'] = this.stixService.convertToUTC('account_first_login', componentData['account_first_login']);
                    const createdDateTime = Date.parse(componentData['account_created']);
                    const firstLoginDateTime = Date.parse(componentData['account_first_login']);

                    if (firstLoginDateTime && firstLoginDateTime < createdDateTime) {
                        return {
                            valid: false,
                            errorMessage: 'First Login Date must be after Account Created Date.',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 17,
            }),
            new DatetimeQuestion({
                key: 'account_last_login',
                label: 'Account Last Login',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'account_last_login').relString = componentData.account_last_login;

                    componentData['account_created'] = this.stixService.convertToUTC('account_created', componentData['account_created']);
                    componentData['account_first_login'] = this.stixService.convertToUTC('account_first_login', componentData['account_first_login']);
                    componentData['account_last_login'] = this.stixService.convertToUTC('account_last_login', componentData['account_last_login']);
                    const createdDateTime = Date.parse(componentData['account_created']);
                    const firstLoginDateTime = Date.parse(componentData['account_first_login']);
                    const lastLoginDateTime = Date.parse(componentData['account_last_login']);

                    if (lastLoginDateTime && lastLoginDateTime < createdDateTime) {
                        return {
                            valid: false,
                            errorMessage: 'Last Login Date must be after Account Created Date.',
                        };
                    }
                    if (lastLoginDateTime && lastLoginDateTime < firstLoginDateTime) {
                        return {
                            valid: false,
                            errorMessage: 'Last Login Date must be after First Login Date.',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                required: false,
                order: 18,
            }),
            new DropdownQuestion({
                key: 'defanged',
                label: 'Defanged',
                validatorFn: (componentData: any) => {
                    questions.find((i) => i.key == 'defanged').relString = componentData.defanged;
                    return {
                        valid: true,
                    };
                },
                type: 'boolean',
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 16,
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
        this.user_id = componentData.user_id;
        this.credential = componentData.credential;
        this.account_login = componentData.account_login;
        this.account_type = componentData.account_type;
        this.display_name = componentData.display_name;
        this.is_service_account = JSON.parse(componentData.is_service_account || '""');
        this.is_privileged = JSON.parse(componentData.is_privileged || '""');
        this.can_escalate_privs = JSON.parse(componentData.can_escalate_privs || '""');
        this.is_disabled = JSON.parse(componentData.is_disabled || '""');
        this.account_created = componentData.account_created;
        this.account_expires = componentData.account_expires;
        this.credential_last_changed = componentData.credential_last_changed;
        this.account_first_login = componentData.account_first_login;
        this.account_last_login = componentData.account_last_login;
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

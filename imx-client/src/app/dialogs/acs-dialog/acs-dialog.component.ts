import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { faInfoCircle, faPlus, faTrash, faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { AccessPrivilege, acs_enums, AcsConfig, Destination, FurtherSharing, ListProperties, PrivilegeScope } from '../analyst1-dialog/acs-types';
import { v4 as uuid } from 'uuid';
import { StixService } from 'src/app/stix-service.service';
import { EnvService } from 'src/app/env-service/env.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TLP20_OPTIONS } from 'src/app/tlpMarkingDef';

@Component({
    selector: 'app-acs-dialog',
    templateUrl: './acs-dialog.component.html',
    styleUrls: ['../../bundle/bundle.component.css', './acs-dialog.component.css'],
    standalone: false,
})
export class AcsDialogComponent {
    @Input() custom: boolean;
    @Input() customAcs;
    acsErrors = {
        destination: 'Destination must be filled',
        classification: 'Classification must be filled',
        formal_determination: 'Formal Determination must be selected',
        usage_permission: '',
        further_sharing: '',
    };

    configureOption = false;

    customFields = {
        nationalities: [],
    };

    acsMarkingConfig: AcsConfig = {
        destination: '',
        classification: '',
        formal_determination: '',
        usage_permissions: 'Deny',
        control_shareability: [],
        privilege_action: '',
        usage_rule_effect: '',
        entity: '',
        entity_list: [],
        permitted_nationalities: '',
        permitted_nationalities_list: [],
        permitted_organizations: '',
        permitted_organizations_list: [],
        shareability: '',
        shareability_list: [],
        further_sharing: 'Deny',
        sharing_scope: '',
        sharing_scope_list: [],
        further_rule_effect: '',
        access_privilege_list: [
            {
                privilege_action: 'CISAUSES',
                rule_effect: 'permit',
                privilege_scope: {
                    entity: ['ALL'],
                    permitted_nationalities: ['ALL'],
                    permitted_organizations: ['ALL'],
                    shareability: ['ALL'],
                },
            },
        ],
        further_sharing_list: [
            {
                sharing_scope: ['USA.USG'],
                rule_effect: 'permit',
            },
        ],
    };

    defaultAcsMarkingConfig: AcsConfig = {
        destination: '',
        classification: 'U',
        formal_determination: '',
        usage_permissions: 'Deny',
        privilege_action: '',
        usage_rule_effect: '',
        control_shareability: [],
        entity: '',
        entity_list: [],
        permitted_nationalities: '',
        permitted_nationalities_list: [],
        permitted_organizations: '',
        permitted_organizations_list: [],
        shareability: '',
        shareability_list: [],
        further_sharing: 'Deny',
        sharing_scope: '',
        sharing_scope_list: [],
        further_rule_effect: '',
        access_privilege_list: [
            {
                privilege_action: 'CISAUSES',
                rule_effect: 'permit',
                privilege_scope: {
                    entity: ['ALL'],
                    permitted_nationalities: ['ALL'],
                    permitted_organizations: ['ALL'],
                    shareability: ['ALL'],
                },
            },
        ],
        further_sharing_list: [
            {
                sharing_scope: ['USA.USG'],
                rule_effect: 'permit',
            },
        ],
    };

    enableAddValue = {
        entity_list: false,
        permitted_nationalities_list: false,
        permitted_organizations_list: false,
        shareability_list: false,
        sharing_scope_list: false,
    };

    enableObj = {
        access_privilege: false,
        further_sharing: false,
    };

    access_privilege_collapse = [];
    further_sharing_collapse = [];

    acs_enums = acs_enums;
    acsIsValid = false;
    isResetNeeded = false;

    showAccessPriv = false;
    showFurtherSharing = false;

    faInfoCircle = faInfoCircle;
    faPlus = faPlus;
    faTrash = faTrash;
    faAngleDown = faAngleDown;
    faAngleUp = faAngleUp;

    formalDeterminationOptions = ['INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT', 'FOUO', 'AIS', 'PUBREL'];
    filteredFormalDeterminationOptions: string[];
    selectedFormalDeterminations = ['INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT'];
    formalDeterminationText = '';

    destinationOptions = [...acs_enums.destination];
    filteredDestinationOptions: Destination[] = [];

    destinationDisabledProp = {
        shareability: false,
        furtherSharing: false,
        furtherSharingOption: false,
        accessPrivilege: false,
        accessPrivilegeOption: false,
        formalDetermination: false,
    };

    isLoading = false;

    currentDestination: (boolean | string)[] = ['Federal', null, null, null];

    constructor(
        private activeModal: NgbActiveModal,
        public stixService: StixService,
        private envService: EnvService,
        public matAutocomplete: MatAutocompleteModule
    ) {}

    ngOnInit() {
        this.filterFormalDetermination();

        this.prepopulateAcsForm();
        this.showAccessPriv = false;
        this.showFurtherSharing = false;
        if (!this.custom) {
            this.updateDestination();
        }
    }

    updateDestination() {
        this.destinationDisabledProp = {
            shareability: false,
            furtherSharing: false,
            furtherSharingOption: false,
            accessPrivilege: false,
            accessPrivilegeOption: false,
            formalDetermination: false,
        };

        switch (this.acsMarkingConfig.destination) {
            case '':
                return;
            case 'Federal':
                this.acsMarkingConfig.control_shareability = [];
                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'deny';
                    delete acl.privilege_scope?.shareability;

                    this.acsMarkingConfig.usage_permissions = 'Deny';
                    this.acsMarkingConfig.further_sharing = 'Deny';
                });
                break;
            case 'Federal, Public (TLP:CLEAR)':
                this.selectedFormalDeterminations = ['INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT', 'PUBREL'];
                this.acsMarkingConfig.usage_permissions = 'Permit';
                this.acsMarkingConfig.further_sharing = 'Permit';
                this.acsMarkingConfig.control_shareability = [];
                this.acsMarkingConfig.further_sharing_list = [];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'permit';
                    delete acl.privilege_scope?.shareability;
                });
                break;
            case 'Federal, Public (TLP:GREEN)':
                this.selectedFormalDeterminations = this.selectedFormalDeterminations.filter((elem) => elem != 'PUBREL');

                if (this.selectedFormalDeterminations.length === 0)
                    this.selectedFormalDeterminations.push('INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT');

                this.acsMarkingConfig.usage_permissions = 'Deny';
                this.acsMarkingConfig.further_sharing = 'Permit';
                this.acsMarkingConfig.control_shareability = ['AIS'];
                this.acsMarkingConfig.further_sharing_list = [];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'deny';
                    delete acl.privilege_scope?.shareability;
                });
                break;
            case 'Federal, Public (TLP:AMBER)':
                this.selectedFormalDeterminations = this.selectedFormalDeterminations.filter((elem) => elem != 'PUBREL');

                if (this.selectedFormalDeterminations.length === 0)
                    this.selectedFormalDeterminations.push('INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT');

                this.acsMarkingConfig.usage_permissions = 'Deny';
                this.acsMarkingConfig.further_sharing = 'Deny';
                this.acsMarkingConfig.control_shareability = ['AIS'];

                this.acsMarkingConfig.further_sharing_list = [
                    {
                        sharing_scope: ['NONFED'],
                        rule_effect: 'permit',
                    },
                ];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'deny';
                    delete acl.privilege_scope?.shareability;
                });
                break;
            case 'Federal, CISCP (TLP:GREEN)':
                this.selectedFormalDeterminations = this.selectedFormalDeterminations.filter((elem) => elem !== 'PUBREL');

                if (this.selectedFormalDeterminations.length === 0)
                    this.selectedFormalDeterminations.push('INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT');

                this.acsMarkingConfig.usage_permissions = 'Deny';
                this.acsMarkingConfig.further_sharing = 'Permit';
                this.acsMarkingConfig.control_shareability = ['CISCP'];
                this.acsMarkingConfig.further_sharing_list = [];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'deny';
                    delete acl.privilege_scope?.shareability;
                });
                break;
            case 'Federal, CISCP (TLP:AMBER)':
                this.selectedFormalDeterminations = this.selectedFormalDeterminations.filter((elem) => elem !== 'PUBREL');
                if (this.selectedFormalDeterminations.length === 0)
                    this.selectedFormalDeterminations.push('INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT');

                this.acsMarkingConfig.usage_permissions = 'Deny';
                this.acsMarkingConfig.further_sharing = 'Deny';
                this.acsMarkingConfig.control_shareability = ['CISCP'];

                this.acsMarkingConfig.further_sharing_list = [
                    {
                        sharing_scope: ['NONFED'],
                        rule_effect: 'permit',
                    },
                ];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'deny';
                    delete acl.privilege_scope?.shareability;
                });
                break;
            case 'Federal, Public, CISCP (TLP:GREEN)':
                this.selectedFormalDeterminations = this.selectedFormalDeterminations.filter((elem) => elem !== 'PUBREL');
                if (this.selectedFormalDeterminations.length === 0)
                    this.selectedFormalDeterminations.push('INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT');

                this.acsMarkingConfig.usage_permissions = 'Deny';
                this.acsMarkingConfig.further_sharing = 'Permit';
                this.acsMarkingConfig.control_shareability = ['AIS', 'CISCP'];
                this.acsMarkingConfig.further_sharing_list = [];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'deny';
                    delete acl.privilege_scope?.shareability;
                });
                break;
            case 'Federal, Public, CISCP (TLP:AMBER)':
                this.selectedFormalDeterminations = this.selectedFormalDeterminations.filter((elem) => elem !== 'PUBREL');
                if (this.selectedFormalDeterminations.length === 0)
                    this.selectedFormalDeterminations.push('INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT');

                this.acsMarkingConfig.usage_permissions = 'Deny';
                this.acsMarkingConfig.further_sharing = 'Deny';
                this.acsMarkingConfig.control_shareability = ['AIS', 'CISCP'];

                this.acsMarkingConfig.further_sharing_list = [
                    {
                        sharing_scope: ['NONFED'],
                        rule_effect: 'permit',
                    },
                ];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'deny';
                    delete acl.privilege_scope?.shareability;
                });
                break;
        }

        this.validateAcsMarking();
    }

    filterDestination() {
        let fedOpt = true;
        let publicOpt = false;
        let publicTlp = '';
        let ciscpOpt = false;
        let ciscpTlp = '';

        this.acsMarkingConfig.destination_list.forEach((dest) => {
            if (dest.startsWith('Public')) {
                publicOpt = true;

                if (dest.endsWith('(TLP:CLEAR)')) publicTlp = 'CLEAR';
                else if (dest.endsWith('(TLP:GREEN)')) publicTlp = 'GREEN';
                else if (dest.endsWith('(TLP:AMBER)')) publicTlp = 'AMBER';
            } else if (dest.startsWith('CISCP')) {
                ciscpOpt = true;

                if (dest.endsWith('(TLP:CLEAR)')) ciscpTlp = 'CLEAR';
                else if (dest.endsWith('(TLP:GREEN)')) ciscpTlp = 'GREEN';
                else if (dest.endsWith('(TLP:AMBER)')) ciscpTlp = 'AMBER';
            }
        });

        if (publicOpt) {
            this.currentDestination[2] = publicOpt;
        } else {
            this.currentDestination[2] = null;
        }

        if (ciscpOpt) {
            this.currentDestination[3] = ciscpOpt;
        } else {
            this.currentDestination[3] = null;
        }

        if (publicOpt || ciscpOpt) {
            this.currentDestination[1] = publicOpt ? publicTlp : ciscpTlp;
        } else {
            this.currentDestination[1] = null;
        }
    }

    filterFormalDetermination() {
        this.filteredFormalDeterminationOptions = this.formalDeterminationOptions.filter((opt) => {
            if (this.selectedFormalDeterminations.includes(opt)) return false;

            return opt.toLowerCase().includes(this.formalDeterminationText.toLowerCase());
        });
    }

    prepopulateAcsForm() {
        let acsMark: any = localStorage.getItem('user-acs');
        let acs;
        if (acsMark || this.custom) {
            if (this.custom) {
                acs = this.customAcs['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'];
            } else {
                acsMark = JSON.parse(acsMark);
                acs = acsMark.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'];
            }

            if (this.custom) {
                if (acs.control_set.permitted_nationalities) {
                    this.customFields.nationalities = [...acs.control_set.permitted_nationalities];
                }
            }

            if (acs.control_set?.classification) {
                this.acsMarkingConfig.classification = acs.control_set.classification;
            } else {
                this.acsMarkingConfig.classification = '';
            }

            if (acs.control_set?.formal_determination) {
                this.selectedFormalDeterminations = [...acs.control_set.formal_determination];
            } else {
                this.selectedFormalDeterminations = [];
            }

            if (acs.control_set?.shareability) {
                this.acsMarkingConfig.control_shareability = [...acs.control_set.shareability];
            }

            if (acs.policy_reference) {
                const privdefault = acs.policy_reference.split('privdefault=')[1];
                const sharedefault = acs.policy_reference.split('sharedefault=')[1];

                if (privdefault?.toUpperCase()?.startsWith('PERMIT')) {
                    this.acsMarkingConfig.usage_permissions = 'Permit';
                } else if (privdefault?.toUpperCase()?.startsWith('DENY')) {
                    this.acsMarkingConfig.usage_permissions = 'Deny';
                } else {
                    this.acsMarkingConfig.usage_permissions = '';
                }

                if (sharedefault?.toUpperCase()?.startsWith('PERMIT')) {
                    this.acsMarkingConfig.further_sharing = 'Permit';
                } else if (sharedefault?.toUpperCase()?.startsWith('DENY')) {
                    this.acsMarkingConfig.further_sharing = 'Deny';
                } else {
                    this.acsMarkingConfig.further_sharing = '';
                }
            } else {
                this.acsMarkingConfig.usage_permissions = '';
                this.acsMarkingConfig.further_sharing = '';
            }

            if (acs.access_privilege) {
                this.acsMarkingConfig.access_privilege_list = JSON.parse(JSON.stringify(acs.access_privilege));
            } else {
                this.acsMarkingConfig.access_privilege_list = [];
            }

            if (acs.further_sharing) {
                this.acsMarkingConfig.further_sharing_list = JSON.parse(JSON.stringify(acs.further_sharing));
            } else {
                this.acsMarkingConfig.further_sharing_list = [];
            }

            this.acsMarkingConfig.privilege_action = '';
            this.acsMarkingConfig.usage_rule_effect = '';
            this.acsMarkingConfig.entity = '';
            this.acsMarkingConfig.entity_list = [];
            this.acsMarkingConfig.permitted_nationalities = '';
            this.acsMarkingConfig.permitted_nationalities_list = [];
            this.acsMarkingConfig.permitted_organizations = '';
            this.acsMarkingConfig.permitted_organizations_list = [];
            this.acsMarkingConfig.shareability = '';
            this.acsMarkingConfig.shareability_list = [];
            this.acsMarkingConfig.sharing_scope = '';
            this.acsMarkingConfig.sharing_scope_list = [];
            this.acsMarkingConfig.further_rule_effect = '';

            this.determineDestination();
        } else {
            this.acsMarkingConfig = JSON.parse(JSON.stringify(this.defaultAcsMarkingConfig));
            this.determineDestination();
        }
    }

    validateAcsMarking() {
        let valid = true;

        if (!this.acsMarkingConfig.destination) {
            this.acsErrors.destination = 'Destination must be filled';
            valid = false;
        } else {
            this.acsErrors.destination = '';
        }

        if (!this.acsMarkingConfig.classification) {
            this.acsErrors.classification = 'Classification must be filled';
            valid = false;
        } else {
            this.acsErrors.classification = '';
        }

        if (this.selectedFormalDeterminations.length === 0) {
            this.acsErrors.formal_determination = 'Formal Determination must be selected';
            valid = false;
        } else {
            this.acsErrors.formal_determination = '';
        }

        if (!this.acsMarkingConfig.usage_permissions) {
            this.acsErrors.usage_permission = 'Usage Permissions must be selected';
            valid = false;
        } else {
            this.acsErrors.usage_permission = '';
        }

        if (!this.acsMarkingConfig.further_sharing) {
            this.acsErrors.further_sharing = 'Further Sharing must be selected';
            valid = false;
        } else {
            this.acsErrors.further_sharing = '';
        }

        let publicOpt = this.currentDestination[2];
        let ciscpOpt = this.currentDestination[3];
        let tlp = this.currentDestination[1];

        switch (this.acsMarkingConfig.destination) {
            case 'Federal':
                if (this.selectedFormalDeterminations.length === 1 && this.selectedFormalDeterminations.includes('PUBREL'))
                    if (this.acsMarkingConfig.usage_permissions === 'Permit')
                        if (this.acsMarkingConfig.further_sharing === 'Permit') {
                            this.acsErrors.formal_determination = 'When Destination is only set to Federal, PUBREL/PERMIT/PERMIT is not allowed';
                            valid = false;
                        }

                break;

            case 'Federal, Public (TLP:GREEN)':
            case 'Federal, Public (TLP:AMBER)':
                if (this.selectedFormalDeterminations.includes('PUBREL')) {
                    this.acsErrors.formal_determination = 'Must not include PUBREL';
                    valid = false;
                }

                break;
            case 'Federal, CISCP (TLP:GREEN)':
            case 'Federal, CISCP (TLP:AMBER)':
            case 'Federal, Public, CISCP (TLP:GREEN)':
            case 'Federal, Public, CISCP (TLP:AMBER)':
                if (this.selectedFormalDeterminations.includes('PUBREL')) {
                    this.acsErrors.formal_determination = 'Must not include PUBREL';
                    valid = false;
                }
                break;
        }

        this.acsIsValid = valid;
    }

    expandAccessPrivilege() {
        this.showAccessPriv = !this.showAccessPriv;
    }

    expandFurtherSharing() {
        this.showFurtherSharing = !this.showFurtherSharing;
    }

    collapseJson(type: 'access_privilege_collapse' | 'further_sharing_collapse', index: number) {
        this[type][index] = !this[type][index];
    }

    closeStixConfig(data, tlp) {
        this.activeModal.close({ acs: data, tlp: tlp });
    }

    validateAddObj() {
        if (
            !this.acsMarkingConfig.privilege_action ||
            !this.acsMarkingConfig.usage_rule_effect ||
            (this.acsMarkingConfig.entity_list.length === 0 &&
                this.acsMarkingConfig.permitted_nationalities_list.length === 0 &&
                this.acsMarkingConfig.permitted_organizations_list.length === 0 &&
                this.acsMarkingConfig.shareability_list.length === 0)
        ) {
            this.enableObj.access_privilege = false;
        } else {
            this.enableObj.access_privilege = true;
        }

        if (this.acsMarkingConfig.sharing_scope_list.length === 0 || !this.acsMarkingConfig.further_rule_effect) {
            this.enableObj.further_sharing = false;
        } else {
            this.enableObj.further_sharing = true;
        }
    }

    addObj(prop: 'access_privilege_list' | 'further_sharing_list') {
        if (prop === 'access_privilege_list') {
            const privilege_scope: PrivilegeScope = {};

            if (this.acsMarkingConfig.entity_list.length > 0) privilege_scope.entity = this.acsMarkingConfig.entity_list;

            if (this.acsMarkingConfig.permitted_nationalities_list.length > 0)
                privilege_scope.permitted_nationalities = this.acsMarkingConfig.permitted_nationalities_list;

            if (this.acsMarkingConfig.permitted_organizations_list.length > 0)
                privilege_scope.permitted_organizations = this.acsMarkingConfig.permitted_organizations_list;

            if (this.acsMarkingConfig.shareability_list.length > 0) privilege_scope.shareability = this.acsMarkingConfig.shareability_list;

            const access_privilege: AccessPrivilege = {
                privilege_action: this.acsMarkingConfig.privilege_action,
                rule_effect: this.acsMarkingConfig.usage_rule_effect.toLowerCase() as 'deny' | 'permit',
            };

            if (JSON.stringify(privilege_scope) !== '{}') access_privilege.privilege_scope = privilege_scope;

            this.acsMarkingConfig.access_privilege_list.push(JSON.parse(JSON.stringify(access_privilege)));
            this.access_privilege_collapse.push(false);

            this.acsMarkingConfig.privilege_action = '';
            this.acsMarkingConfig.usage_rule_effect = '';
            this.acsMarkingConfig.entity = '';
            this.acsMarkingConfig.permitted_nationalities = '';
            this.acsMarkingConfig.permitted_organizations = '';
            this.acsMarkingConfig.shareability = '';
            this.acsMarkingConfig.entity_list = [];
            this.acsMarkingConfig.permitted_nationalities_list = [];
            this.acsMarkingConfig.permitted_organizations_list = [];
            this.acsMarkingConfig.shareability_list = [];
            this.enableAddValue.entity_list = false;
            this.enableAddValue.permitted_nationalities_list = false;
            this.enableAddValue.permitted_organizations_list = false;
            this.enableAddValue.shareability_list = false;
            this.enableObj.access_privilege = false;
        } else {
            const further_sharing: FurtherSharing = {
                sharing_scope: this.acsMarkingConfig.sharing_scope_list,
                rule_effect: this.acsMarkingConfig.further_rule_effect.toLowerCase() as 'deny' | 'permit',
            };

            this.acsMarkingConfig.further_sharing_list.push(JSON.parse(JSON.stringify(further_sharing)));
            this.further_sharing_collapse.push(false);

            this.acsMarkingConfig.sharing_scope = '';
            this.acsMarkingConfig.further_rule_effect = '';
            this.acsMarkingConfig.sharing_scope_list = [];
            this.enableAddValue.sharing_scope_list = false;
            this.enableObj.further_sharing = false;
        }
        this.validateAcsMarking();
    }

    removeObj(type: 'access_privilege' | 'further_sharing', index) {
        this.acsMarkingConfig[`${type}_list`].splice(index, 1);
        this[`${type}_collapse`].splice(index, 1);
        this.validateAcsMarking();
    }

    validateAddString(prop) {
        const propList = `${prop}_list`;

        if (!this.acsMarkingConfig[prop]) {
            this.enableAddValue[propList] = false;
            return;
        }

        if (this.acsMarkingConfig[propList].length > 0 && this.acsMarkingConfig[prop] === 'ALL') {
            this.enableAddValue[propList] = false;
            return;
        }

        if (this.acsMarkingConfig[propList].includes('ALL')) {
            this.enableAddValue[propList] = false;
            return;
        }

        if (this.acsMarkingConfig[propList].includes(this.acsMarkingConfig[prop])) {
            this.enableAddValue[propList] = false;
        } else {
            this.enableAddValue[propList] = true;
        }
    }

    addFormalDetermination() {
        this.selectedFormalDeterminations.push(this.formalDeterminationText);
        this.formalDeterminationText = '';
        this.validateAcsMarking();
        this.filterFormalDetermination();
    }

    removeFormalDetermination(index: number) {
        this.selectedFormalDeterminations.splice(index, 1);
        this.validateAcsMarking();
        this.filterFormalDetermination();
    }

    addString(prop: ListProperties) {
        const propList = `${prop}_list`;
        this.acsMarkingConfig[propList].push(this.acsMarkingConfig[prop]);
        this.acsMarkingConfig[prop] = '';
        this.enableAddValue[propList] = false;
        this.validateAddObj();

        if (prop === 'formal_determination') this.validateAcsMarking();
    }

    removeString(prop: keyof AcsConfig, value) {
        const propList = `${prop}_list`;
        this.acsMarkingConfig[propList] = this.acsMarkingConfig[propList].filter((elem) => elem !== value);
        this.validateAddString(prop);
        this.validateAddObj();

        if (prop === 'formal_determination') this.validateAcsMarking();
    }

    generateAcs() {
        const storedIdentity = localStorage.getItem('identity');

        const acs: any = {
            type: 'marking-definition',
            spec_version: '2.1',
            id: `marking-definition--${uuid()}`,
            created: new Date().toISOString(),
            created_by_ref: storedIdentity ? storedIdentity : this.envService.env.defaultIdentity.id,
            extensions: {
                'extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce': {
                    extension_type: 'property-extension',
                    identifier: 'isa:guide.19001.DFTA-a9bdb603-7f4f-44c6-acb0-d47f614e64b2',
                    create_date_time: new Date().toISOString(),
                    responsible_entity_custodian: 'USA.DHS.CISA.CSD.TH',
                    responsible_entity_originator: 'USA.DHS.CISA.CSD.TH',
                    policy_reference: `urn:isa:policy:acs:ns:v3.0?privdefault=${this.acsMarkingConfig.usage_permissions.toLowerCase()}&sharedefault=${this.acsMarkingConfig.further_sharing.toLowerCase()}`,
                    control_set: {
                        classification: this.acsMarkingConfig.classification,
                    },
                    authority_reference: ['urn:isa:authority:ais'],
                },
            },
        };

        if (this.custom) {
            const extension = this.customAcs['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'];

            const identifier = extension.identifier;
            const customDate = extension.create_date_time;
            const custodian = extension.responsible_entity_custodian;
            const originator = extension.responsible_entity_originator;

            if (identifier) acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].identifier = identifier;
            else delete acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].identifier;

            if (custodian) acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].responsible_entity_custodian = custodian;
            else delete acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].responsible_entity_custodian;

            if (originator) acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].responsible_entity_originator = originator;
            else delete acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].responsible_entity_originator;

            if (customDate) acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].create_date_time = customDate;
            else delete acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].create_date_time;

            if (this.customFields.nationalities.length > 0) {
                acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].control_set.permitted_nationalities =
                    this.customFields.nationalities;
            }

            delete acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].authority_reference;
            const defaultProps = [
                'control_set',
                'create_date_time',
                'extension_type',
                'identifier',
                'responsible_entity_custodian',
                'responsible_entity_originator',
                'policy_reference',
                'authority_reference',
            ];
        }

        acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].control_set['formal_determination'] = [
            ...this.selectedFormalDeterminations,
        ];

        acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].control_set['shareability'] = [
            ...this.acsMarkingConfig.control_shareability,
        ];

        if (acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].control_set['shareability'].length === 0)
            delete acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].control_set['shareability'];

        if (this.acsMarkingConfig.access_privilege_list.length > 0) {
            acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce']['access_privilege'] =
                this.acsMarkingConfig.access_privilege_list;
        }

        if (this.acsMarkingConfig.further_sharing_list.length > 0) {
            acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce']['further_sharing'] =
                this.acsMarkingConfig.further_sharing_list;
        }

        this.applyAcs(acs);
    }

    filterTlp(o) {
        if (!o.object_marking_refs) return o;

        const tlp1 = this.stixService.getTlpOptions('v1').map((tlp) => tlp.value);
        const tlp2 = this.stixService.getTlpOptions('v2').map((tlp) => tlp.value);

        o.object_marking_refs = o.object_marking_refs.filter((id) => {
            if (tlp1.includes(id) || tlp2.includes(id)) return false;

            return true;
        });

        return o;
    }

    filterTlpFromReport(o) {
        if (!o.object_refs) o.object_refs = [];

        const tlp1 = this.stixService.getTlpOptions('v1').map((tlp) => tlp.value);
        const tlp2 = this.stixService.getTlpOptions('v2').map((tlp) => tlp.value);

        o.object_refs = o.object_refs.filter((ref) => !tlp1.includes(ref) && !tlp2.includes(ref));
    }

    async applyAcs(acs) {
        try {
            let tlp;

            if (!this.custom) {
                this.isLoading = true;

                if (acs) {
                    acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce']['responsible_entity_custodian'] = 'USA.DHS.NCCIC';

                    let selected_acs_id = acs.id;

                    if (!this.custom) {
                        let userDefinedAcs: any = localStorage.getItem('user-acs');

                        //Find previously added ACS from the modal
                        if (userDefinedAcs) {
                            userDefinedAcs = JSON.parse(userDefinedAcs);

                            if (userDefinedAcs.id) await this.stixService.removeComponent(userDefinedAcs.id);
                        }
                    }

                    await this.stixService.addComponent(acs);

                    if (!this.custom) {
                        let newBundle = await this.stixService.db.imxCache.orderBy('index').toArray();

                        let newVersion = localStorage.getItem('new_version_objects');
                        if (newVersion) newVersion = JSON.parse(newVersion);

                        newBundle.forEach((obj) => {
                            let o = obj.object;

                            const storedIdentity = localStorage.getItem('identity');

                            if (
                                o.type !== 'marking-definition' &&
                                o.id !== this.envService.env.defaultIdentity.id &&
                                (o.created_by_ref == this.envService.env.defaultIdentity.id ||
                                    (storedIdentity && o.created_by_ref == storedIdentity) ||
                                    !o.created_by_ref)
                            ) {
                                if (!o.object_marking_refs) {
                                    o.object_marking_refs = [];
                                } else {
                                    o.object_marking_refs = o.object_marking_refs.filter((marking_ref) => !this.stixService.acsMarkings[marking_ref]);
                                }

                                o.object_marking_refs.push(selected_acs_id);

                                if (newVersion && newVersion.includes(o.id)) o.modified = new Date().toISOString();

                                //Apply TLP appropriately

                                switch (this.acsMarkingConfig.destination) {
                                    case 'Federal':
                                        tlp = '';
                                        break;
                                    case 'Federal, CISCP (TLP:AMBER)':
                                    case 'Federal, Public (TLP:AMBER)':
                                    case 'Federal, Public, CISCP (TLP:AMBER)':
                                        tlp = 'TLP:AMBER';
                                        break;
                                    case 'Federal, CISCP (TLP:GREEN)':
                                    case 'Federal, Public (TLP:GREEN)':
                                    case 'Federal, Public, CISCP (TLP:GREEN)':
                                        tlp = 'TLP:GREEN';
                                        break;
                                    case 'Federal, Public (TLP:CLEAR)':
                                        tlp = 'TLP:CLEAR';
                                        break;
                                }

                                if (tlp) {
                                    let tlpId = TLP20_OPTIONS.find((elem) => elem.name === tlp);
                                    const storedIdentity = localStorage.getItem('identity');

                                    this.filterTlp(o);

                                    if (!o.object_marking_refs) o.object_marking_refs = [];

                                    o.object_marking_refs.push(tlpId.id);

                                    if (o.type === 'report') {
                                        this.filterTlpFromReport(o);
                                        o.object_refs.push(tlp.id);
                                    }
                                }
                            }
                        });

                        await this.stixService.db.imxCache.bulkPut(newBundle);
                        await this.stixService.db.imxCache.orderBy('index').toArray();
                        const acs_type: string = localStorage.getItem('acs-type');
                        let acs_types: Record<string, string>;

                        if (!acs_type) acs_types = {};
                        else acs_types = JSON.parse(acs_type);

                        acs_types[acs.id] = this.acsMarkingConfig.destination;

                        localStorage.setItem('acs-type', JSON.stringify(acs_types));
                        localStorage.setItem('user-acs', JSON.stringify(acs));
                    }
                }
            }
            this.isResetNeeded = false;
            this.closeStixConfig(acs, tlp);
        } catch (e) {
            console.error(e);
            this.isResetNeeded = false;
            this.closeStixConfig(null, null);
        }
    }

    formalDeterminationView(formalDet) {
        if (formalDet === 'Federal and non-Federal Entities') return 'Federal and CISCP';

        return formalDet;
    }

    determineDestination() {
        const acsObj = {
            control_set: {
                formal_determination: this.selectedFormalDeterminations,
                shareability: this.acsMarkingConfig.control_shareability,
            },
            access_privilege: this.acsMarkingConfig.access_privilege_list,
            further_sharing: this.acsMarkingConfig.further_sharing_list,
        };

        this.acsMarkingConfig.destination = this.stixService.determineAcs(
            acsObj,
            this.acsMarkingConfig.usage_permissions,
            this.acsMarkingConfig.further_sharing
        );

        if (!this.custom) {
            this.updateDestination();
        } else {
            this.validateAcsMarking();
        }
    }
}

// bundle.component.ts needs to be updated if IDs are changed
export const ACS_OBJECTS = [
    {
        type: 'Publicly Releasable',
        object: {
            type: 'marking-definition',
            spec_version: '2.1',
            id: 'marking-definition--adbfd045-ab70-4c52-8f24-e239e5da4cc7',
            created: '2023-09-14T16:45:02.172Z',
            extensions: {
                'extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce': {
                    extension_type: 'property-extension',
                    identifier: 'isa:guide.19001.DFTA-a9bdb603-7f4f-44c6-acb0-d47f614e64b2',
                    create_date_time: '2023-09-14T16:45:02.172Z',
                    responsible_entity_custodian: 'USA.DHS.CISA.CSD.TH',
                    responsible_entity_originator: 'USA.DHS.CISA.CSD.TH',
                    policy_reference: 'urn:isa:policy:acs:ns:v3.0?privdefault=deny&sharedefault=deny',
                    control_set: {
                        classification: 'U',
                        formal_determination: ['INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT', 'PUBREL'],
                    },
                    authority_reference: ['urn:isa:authority:ais'],
                    access_privilege: [
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
                    further_sharing: [
                        {
                            sharing_scope: ['FOREIGNGOV'],
                            rule_effect: 'permit',
                        },
                        {
                            sharing_scope: ['SECTOR'],
                            rule_effect: 'permit',
                        },
                        {
                            sharing_scope: ['USA.USG'],
                            rule_effect: 'permit',
                        },
                    ],
                },
            },
        },
    },
    {
        type: 'Federal and non-Federal Entities',
        fixedDateTime: '2023-08-11T15:02:23.865Z',
        object: {
            type: 'marking-definition',
            spec_version: '2.1',
            id: 'marking-definition--cba8dc95-b7f0-4c41-a8aa-eafec0974b70',
            created: '2023-09-14T16:45:46.708Z',
            extensions: {
                'extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce': {
                    extension_type: 'property-extension',
                    identifier: 'isa:guide.19001.DFTA-a9bdb603-7f4f-44c6-acb0-d47f614e64b2',
                    create_date_time: '2023-09-14T16:45:46.708Z',
                    responsible_entity_custodian: 'USA.DHS.CISA.CSD.TH',
                    responsible_entity_originator: 'USA.DHS.CISA.CSD.TH',
                    policy_reference: 'urn:isa:policy:acs:ns:v3.0?privdefault=deny&sharedefault=deny',
                    control_set: {
                        classification: 'U',
                        formal_determination: ['INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT', 'FOUO', 'AIS'],
                    },
                    authority_reference: ['urn:isa:authority:ais'],
                    access_privilege: [
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
                    further_sharing: [
                        {
                            sharing_scope: ['USA.USG'],
                            rule_effect: 'permit',
                        },
                    ],
                },
            },
        },
    },
    {
        type: 'Federal Entities',
        fixedDateTime: '2023-08-11T15:02:23.865Z',
        object: {
            type: 'marking-definition',
            spec_version: '2.1',
            id: 'marking-definition--7300c756-0cc0-48df-8542-d8018b5b0cf6',
            created: '2023-09-14T16:46:23.939Z',
            extensions: {
                'extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce': {
                    extension_type: 'property-extension',
                    identifier: 'isa:guide.19001.DFTA-a9bdb603-7f4f-44c6-acb0-d47f614e64b2',
                    create_date_time: '2023-09-14T16:46:23.939Z',
                    responsible_entity_custodian: 'USA.DHS.CISA.CSD.TH',
                    responsible_entity_originator: 'USA.DHS.CISA.CSD.TH',
                    policy_reference: 'urn:isa:policy:acs:ns:v3.0?privdefault=deny&sharedefault=deny',
                    control_set: {
                        classification: 'U',
                        formal_determination: ['INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT'],
                    },
                    authority_reference: ['urn:isa:authority:ais'],
                    access_privilege: [
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
                    further_sharing: [
                        {
                            sharing_scope: ['USA.USG'],
                            rule_effect: 'permit',
                        },
                    ],
                },
            },
        },
    },
];

export const TLP_OPTIONS = [
    {
        type: 'marking-definition',
        spec_version: '2.1',
        id: 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9',
        created: '2017-01-20T00:00:00.000Z',
        definition_type: 'tlp',
        name: 'TLP:WHITE',
        definition: {
            tlp: 'white',
        },
    },
    {
        type: 'marking-definition',
        spec_version: '2.1',
        id: 'marking-definition--34098fce-860f-48ae-8e50-ebd3cc5e41da',
        created: '2017-01-20T00:00:00.000Z',
        definition_type: 'tlp',
        name: 'TLP:GREEN',
        definition: {
            tlp: 'green',
        },
    },
    {
        type: 'marking-definition',
        spec_version: '2.1',
        id: 'marking-definition--f88d31f6-486f-44da-b317-01333bde0b82',
        created: '2017-01-20T00:00:00.000Z',
        definition_type: 'tlp',
        name: 'TLP:AMBER',
        definition: {
            tlp: 'amber',
        },
    },
    {
        type: 'marking-definition',
        spec_version: '2.1',
        id: 'marking-definition--5e57c739-391a-4eb3-b6be-7d15ca92d5ed',
        created: '2017-01-20T00:00:00.000Z',
        definition_type: 'tlp',
        name: 'TLP:RED',
        definition: {
            tlp: 'red',
        },
    },
];

export const TLP20_OPTIONS = [
    {
        type: 'marking-definition',
        spec_version: '2.1',
        id: 'marking-definition--94868c89-83c2-464b-929b-a1a8aa3c8487',
        created: '2022-10-01T00:00:00.000Z',
        name: 'TLP:CLEAR',
        extensions: {
            'extension-definition--60a3c5c5-0d10-413e-aab3-9e08dde9e88d': {
                extension_type: 'property-extension',
                tlp_2_0: 'clear',
            },
        },
        description:
            "TLP:CLEAR (Unrestricted): Share worldwide without limitations. Use when there's minimal or no risk of misuse, following public release rules. Standard copyright rules apply; share without restrictions.",
    },
    {
        type: 'marking-definition',
        spec_version: '2.1',
        id: 'marking-definition--bab4a63c-aed9-4cf5-a766-dfca5abac2bb',
        created: '2022-10-01T00:00:00.000Z',
        name: 'TLP:GREEN',
        extensions: {
            'extension-definition--60a3c5c5-0d10-413e-aab3-9e08dde9e88d': {
                extension_type: 'property-extension',
                tlp_2_0: 'green',
            },
        },
        description:
            "TLP:GREEN (Community Sharing): Share within your community for increased awareness. Use when information benefits your broader community. Share with peers and partner organizations in your community, avoiding public channels. Do not share outside the community; 'community' refers to the cybersecurity/cyber defense community if not specified.",
    },
    {
        type: 'marking-definition',
        spec_version: '2.1',
        id: 'marking-definition--55d920b0-5e8b-4f79-9ee9-91f868d9b421',
        created: '2022-10-01T00:00:00.000Z',
        name: 'TLP:AMBER',
        extensions: {
            'extension-definition--60a3c5c5-0d10-413e-aab3-9e08dde9e88d': {
                extension_type: 'property-extension',
                tlp_2_0: 'amber',
            },
        },
        description: 'TLP:AMBER (Limited Disclosure): Share on a need-to-know basis within your organization and its clients.',
    },
    {
        type: 'marking-definition',
        spec_version: '2.1',
        id: 'marking-definition--939a9414-2ddd-4d32-a0cd-375ea402b003',
        created: '2022-10-01T00:00:00.000Z',
        name: 'TLP:AMBER+STRICT',
        extensions: {
            'extension-definition--60a3c5c5-0d10-413e-aab3-9e08dde9e88d': {
                extension_type: 'property-extension',
                tlp_2_0: 'amber+strict',
            },
        },
        description:
            'TLP:AMBER+STRICT (Limited Disclosure): TLP:AMBER+STRICT restricts sharing to the organization only. Used when information needs support but risks privacy, reputation, or operations if shared outside. Share with your organization and clients as necessary to protect them and prevent harm. Specify TLP:AMBER+STRICT to limit sharing to the organization exclusively',
    },
    {
        type: 'marking-definition',
        spec_version: '2.1',
        id: 'marking-definition--e828b379-4e03-4974-9ac4-e53a884c97c1',
        created: '2022-10-01T00:00:00.000Z',
        name: 'TLP:RED',
        extensions: {
            'extension-definition--60a3c5c5-0d10-413e-aab3-9e08dde9e88d': {
                extension_type: 'property-extension',
                tlp_2_0: 'red',
            },
        },
        description:
            'TLP:RED (High Sensitivity): Limited to individual recipients, no sharing. Used when disclosing would jeopardize privacy, reputation, or operations. Not to be shared beyond those present in a meeting, for instance.',
    },
];

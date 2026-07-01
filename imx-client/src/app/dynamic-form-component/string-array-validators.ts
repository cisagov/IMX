export const STRING_ARRAY_VALIDATORS = [
    {
        key: 'object_marking_refs',
        displayName: 'Object Marking References',
        inputPlaceholder: 'Object Marking References',
        regexValidation: 'marking-definition--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}',
    },
    {
        key: 'labels',
        displayName: 'Labels',
        inputPlaceholder: 'Labels',
        // "regexValidation": "marking-definition--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}"
    },
];

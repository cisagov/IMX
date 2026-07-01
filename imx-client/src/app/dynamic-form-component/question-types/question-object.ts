import { QuestionBase } from '../question-base';

export class ObjectQuestion extends QuestionBase<string> {
    controlType = 'object';

    static validatorFn = (componentData: any) => {
        const object_ref = componentData.object_ref;
        const object_refRegex = new RegExp(/^(\w[-[a-z]*]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12}$/);
        if (object_ref != null) {
            if (!object_ref)
                return {
                    valid: false,
                    errorMessage: 'Object Ref is required',
                };

            if (!object_refRegex.test(object_ref))
                return {
                    valid: false,
                    errorMessage: 'Must be a STIX Object and followed by a UUID (i.e. STIX-Object--d9fc3f18-80c9-4a40-94fc-8a6aca45c20e)',
                };
        }
        return {
            valid: true,
        };
    };
}

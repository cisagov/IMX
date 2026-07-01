export class HTTPRequestExtension {
    extension_id: string;
    extension_type: string;
    request_method: string;
    request_value: string;
    request_version: string;
    message_body_length: number;
    message_body_data_ref: string;
    request_header: any;

    constructor(
        extension_id?: string,
        extension_type?: string,
        request_method?: string,
        request_value?: string,
        request_version?: string,
        message_body_length?: number,
        message_body_data_ref?: string,
        request_header?: any
    ) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        this.request_method = request_method || '';
        this.request_value = request_value || '';
        this.request_version = request_version || '';
        this.request_method = request_method || '';
        if (message_body_length != undefined) this.message_body_length = message_body_length;
        this.message_body_data_ref = message_body_data_ref || '';
        this.request_header = request_header || new Map();
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.request_method ? selectors.push('request_method') : null;
        this.request_value ? selectors.push('request_value') : null;
        this.request_method ? selectors.push('request_method') : null;
        this.request_version ? selectors.push('request_version') : null;
        this.message_body_length ? selectors.push('message_body_length') : null;
        this.message_body_data_ref ? selectors.push('message_body_data_ref') : null;
        this.request_header ? selectors.push('request_header') : null;
        return selectors;
    }
}

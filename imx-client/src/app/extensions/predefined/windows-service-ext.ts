export class WindowsServiceExtension {
    extension_id: string;
    extension_type: string;
    service_name: string;
    display_name: string;
    group_name: string;
    start_type: string;
    service_type: string;
    service_status: string;
    descriptions: string[];
    service_dll_refs: string[];

    constructor(
        extension_id?: string,
        extension_type?: string,
        service_name?: string,
        display_name?: string,
        group_name?: string,
        start_type?: string,
        service_type?: string,
        service_status?: string,
        descriptions?: string[],
        service_dll_refs?: string[]
    ) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        this.service_name = service_name || '';
        this.display_name = display_name || '';
        this.group_name = group_name || '';
        this.start_type = start_type || '';
        this.service_type = service_type || '';
        this.service_status = service_status || '';
        this.descriptions = descriptions || [];
        this.service_dll_refs = service_dll_refs || [];
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.service_name ? selectors.push('service_name') : null;
        this.display_name ? selectors.push('display_name') : null;
        this.group_name ? selectors.push('group_name') : null;
        this.start_type ? selectors.push('start_type') : null;
        this.service_type ? selectors.push('service_type') : null;
        this.service_status ? selectors.push('service_status') : null;
        this.descriptions ? selectors.push('descriptions') : null;
        this.service_dll_refs ? selectors.push('service_dll_refs') : null;
        return selectors;
    }
}

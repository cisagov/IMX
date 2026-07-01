export class WindowsProcessExtension {
    extension_id: string;
    extension_type: string;
    aslr_enabled: string;
    dep_enabled: string;
    priority: string;
    owner_sid: string;
    window_title: string;
    integrity_level: string;
    startup_info: any;

    constructor(
        extension_id?: string,
        extension_type?: string,
        aslr_enabled?: string,
        dep_enabled?: string,
        priority?: string,
        owner_sid?: string,
        window_title?: string,
        integrity_level?: string,
        startup_info?: any
    ) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        this.aslr_enabled = aslr_enabled || '';
        this.dep_enabled = dep_enabled || '';
        this.priority = priority || '';
        this.owner_sid = owner_sid || '';
        this.window_title = window_title || '';
        this.integrity_level = integrity_level || '';
        this.startup_info = startup_info || {};
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.aslr_enabled ? selectors.push('aslr_enabled') : null;
        this.dep_enabled ? selectors.push('dep_enabled') : null;
        this.priority ? selectors.push('priority') : null;
        this.owner_sid ? selectors.push('owner_sid') : null;
        this.window_title ? selectors.push('window_title') : null;
        this.integrity_level ? selectors.push('integrity_level') : null;
        this.startup_info ? selectors.push('startup_info') : null;
        return selectors;
    }
}

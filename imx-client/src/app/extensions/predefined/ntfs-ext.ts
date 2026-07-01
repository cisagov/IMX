export class NTFSExtension {
    extension_id: string;
    extension_type: string;
    sid: string;
    alternate_data_streams: any[];

    constructor(extension_id?: string, extension_type?: string, sid?: string, alternate_data_streams?: any[]) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        this.sid = sid || '';
        this.alternate_data_streams = alternate_data_streams || [];
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.sid ? selectors.push('sid') : null;
        this.alternate_data_streams ? selectors.push('alternate_data_streams') : null;
        return selectors;
    }
}

export class Extension {
    extension_id: string;
    extension_type: string;
    extensions: any;
    //test: any;

    constructor(extension_id?: string, extension_type?: string, extensions?: any) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        this.extensions = extensions || new Map();
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.extensions ? selectors.push('extensions') : null;
        return selectors;
    }
}

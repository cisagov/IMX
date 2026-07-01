export class ArchiveExtension {
    extension_id: string;
    extension_type: string;
    contains_refs: string[];
    comment: string;

    constructor(extension_id?: string, extension_type?: string, contains_refs?: string[], comment?: string) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        this.contains_refs = contains_refs || [];
        this.comment = comment || '';
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.contains_refs ? selectors.push('contains_refs') : null;
        this.comment ? selectors.push('comment') : null;
        return selectors;
    }
}

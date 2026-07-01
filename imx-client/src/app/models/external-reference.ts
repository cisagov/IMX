export class ExternalReference {
    source_name: string;
    description: string;
    url: string;
    hashes: any;
    external_id: string;

    constructor(source_name?: string, description?: string, url?: string, hashes?: any, external_id?: string) {
        this.source_name = source_name || '';
        this.description = description || '';
        this.url = url || '';
        this.hashes = hashes || {};
        this.external_id = external_id || '';
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.source_name ? selectors.push('source_name') : null;
        this.description ? selectors.push('description') : null;
        this.url ? selectors.push('url') : null;
        this.hashes ? selectors.push('hashes') : null;
        this.external_id ? selectors.push('externalId') : null;
        return selectors;
    }
}

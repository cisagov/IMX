export class TCPExtension {
    extension_id: string;
    extension_type: string;
    src_flags_hex: string;
    dst_flags_hex: string;

    constructor(extension_id?: string, extension_type?: string, src_flags_hex?: string, dst_flags_hex?: string) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        this.src_flags_hex = src_flags_hex || '';
        this.dst_flags_hex = dst_flags_hex || '';
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.src_flags_hex ? selectors.push('src_flags_hex') : null;
        this.dst_flags_hex ? selectors.push('dst_flags_hex') : null;
        return selectors;
    }
}

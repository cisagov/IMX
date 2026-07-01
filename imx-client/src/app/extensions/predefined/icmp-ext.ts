export class ICMPExtension {
    extension_id: string;
    extension_type: string;
    icmp_type_hex: string;
    icmp_code_hex: string;

    constructor(extension_id?: string, extension_type?: string, icmp_type_hex?: string, icmp_code_hex?: string) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        this.icmp_type_hex = icmp_type_hex || '';
        this.icmp_code_hex = icmp_code_hex || '';
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.icmp_type_hex ? selectors.push('icmp_type_hex') : null;
        this.icmp_code_hex ? selectors.push('icmp_code_hex') : null;
        return selectors;
    }
}

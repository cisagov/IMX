export class PDFExtension {
    extension_id: string;
    extension_type: string;
    version: string;
    is_optimized: string;
    pdfid0: string;
    pdfid1: string;
    document_info_dict: any;

    constructor(
        extension_id?: string,
        extension_type?: string,
        version?: string,
        is_optimized?: string,
        pdfid0?: string,
        pdfid1?: string,
        document_info_dict?: any
    ) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        this.version = version || '';
        this.is_optimized = is_optimized || '';
        this.pdfid0 = pdfid0 || '';
        this.pdfid1 = pdfid1 || '';
        this.document_info_dict = document_info_dict || new Map();
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.version ? selectors.push('version') : null;
        this.is_optimized ? selectors.push('is_optimized') : null;
        this.pdfid0 ? selectors.push('pdfid0') : null;
        this.pdfid1 ? selectors.push('pdfid1') : null;
        this.document_info_dict ? selectors.push('document_info_dict') : null;
        return selectors;
    }
}

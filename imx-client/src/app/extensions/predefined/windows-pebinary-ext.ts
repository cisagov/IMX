export class WindowsPEBinaryExtension {
    extension_id: string;
    extension_type: string;
    pe_type: string;
    imphash: string;
    machine_hex: string;
    number_of_sections: number;
    time_date_stamp: string;
    pointer_to_symbol_table_hex: string;
    number_of_symbols: number;
    size_of_optional_header: number;
    characteristics_hex: string;
    file_header_hashes: any;
    optional_header: any;
    sections: any[];

    constructor(
        extension_id?: string,
        extension_type?: string,
        pe_type?: string,
        imphash?: string,
        machine_hex?: string,
        number_of_sections?: number,
        time_date_stamp?: string,
        pointer_to_symbol_table_hex?: string,
        number_of_symbols?: number,
        size_of_optional_header?: number,
        characteristics_hex?: string,
        file_header_hashes?: any,
        optional_header?: any,
        sections?: any[]
    ) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        this.pe_type = pe_type || '';
        this.imphash = imphash || '';
        this.machine_hex = machine_hex || '';
        if (number_of_sections != undefined) this.number_of_sections = number_of_sections;
        this.time_date_stamp = time_date_stamp || '';
        this.pointer_to_symbol_table_hex = pointer_to_symbol_table_hex || '';
        if (number_of_symbols != undefined) this.number_of_symbols = number_of_symbols;
        if (size_of_optional_header != undefined) this.size_of_optional_header = size_of_optional_header;
        this.characteristics_hex = characteristics_hex || '';
        this.file_header_hashes = file_header_hashes || new Map();
        this.optional_header = optional_header;
        this.sections = sections || [];
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.pe_type ? selectors.push('pe_type') : null;
        this.imphash ? selectors.push('imphash') : null;
        this.machine_hex ? selectors.push('machine_hex') : null;
        this.number_of_sections ? selectors.push('number_of_sections') : null;
        this.time_date_stamp ? selectors.push('time_date_stamp') : null;
        this.pointer_to_symbol_table_hex ? selectors.push('pointer_to_symbol_table_hex') : null;
        this.number_of_symbols ? selectors.push('number_of_symbols') : null;
        this.size_of_optional_header ? selectors.push('size_of_optional_header') : null;
        this.characteristics_hex ? selectors.push('characteristics_hex') : null;
        this.file_header_hashes ? selectors.push('file_header_hashes') : null;
        this.optional_header ? selectors.push('optional_header') : null;
        this.sections ? selectors.push('sections') : null;
        return selectors;
    }
}

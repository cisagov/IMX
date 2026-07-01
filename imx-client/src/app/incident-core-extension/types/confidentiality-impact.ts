export class ConfidentialityImpact {
    criticality: number;
    description: string;
    information_type: string;
    impacted_refs: string[];
    labels: string[];
    loss_type: string;
    record_count: number;
    record_size: number;

    constructor(
        criticality: number,
        description: string,
        information_type: string,
        impacted_refs: string[],
        labels: string[],
        loss_type: string,
        record_count: number,
        record_size: number
    ) {
        if (criticality != undefined) this.criticality = criticality;
        this.description = description || '';
        this.information_type = information_type || '';
        this.impacted_refs = impacted_refs || [];
        this.labels = labels || [];
        this.loss_type = loss_type || '';
        if (record_count != undefined) this.record_count = record_count;
        if (record_size != undefined) this.record_size = record_size;
    }
}

export class MonetaryImpact {
    variety: string;
    criticality: number;
    currency: string;
    description: string;
    labels: string[];
    max_amount: number;
    min_amount: number;

    constructor(
        variety: string,
        criticality: number,
        currency: string,
        description: string,
        labels: string[],
        min_amount: number,
        max_amount: number
    ) {
        this.variety = variety || '';
        if (criticality != undefined) this.criticality = criticality;
        this.currency = currency || '';
        this.description = description || '';
        this.labels = labels || [];
        if (min_amount != undefined) this.min_amount = min_amount;
        if (max_amount != undefined) this.max_amount = max_amount;
    }
}

export class AvailabilityImpact {
    availability_impact: number;
    criticality: number;
    description: string;
    impacted_refs: string[];
    labels: string[];
    recoverability: string;

    constructor(
        availability_impact: number,
        criticality: number,
        description: string,
        impacted_refs: string[],
        labels: string[],
        recoverability: string
    ) {
        if (availability_impact != undefined) this.availability_impact = availability_impact;
        if (criticality != undefined) this.criticality = criticality;
        this.description = description || '';
        this.impacted_refs = impacted_refs || [];
        this.labels = labels || [];
        this.recoverability = recoverability || '';
    }
}

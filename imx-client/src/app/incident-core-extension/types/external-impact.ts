export class ExternalImpact {
    impact_type: string[];
    criticality: number;
    description: string;
    impacted_refs: string[];
    labels: string[];

    constructor(impact_type: string[], criticality: number, description: string, impacted_refs: string[], labels: string[]) {
        this.impact_type = impact_type || [];
        if (criticality != undefined) this.criticality = criticality;
        this.description = description || '';
        this.impacted_refs = impacted_refs || [];
        this.labels = labels || [];
    }
}

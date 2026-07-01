export class DefenderActivity {
    activity_type: string;
    outcome: string;
    description: string;
    identity_refs: string[];
    impacted_refs: string[];
    object_ref: string;
    start_time: string;
    start_time_fidelity: number;
    end_time: string;
    end_time_fidelity: number;
    sequence_start: number;
    sequence_end: number;

    constructor(
        activity_type: string,
        outcome: string,
        description: string,
        identity_refs: string[],
        impacted_refs: string[],
        object_ref: string,
        start_time: string,
        start_time_fidelity: number,
        end_time: string,
        end_time_fidelity: number,
        sequence_start: number,
        sequence_end: number
    ) {
        this.activity_type = activity_type || '';
        this.outcome = outcome || '';
        this.description = description || '';
        this.identity_refs = identity_refs || [];
        this.impacted_refs = impacted_refs || [];
        this.object_ref = object_ref || [];
        this.start_time = start_time || '';
        if (start_time_fidelity != undefined) this.start_time_fidelity = start_time_fidelity;
        this.end_time = end_time || '';
        if (end_time_fidelity != undefined) this.end_time_fidelity = end_time_fidelity;
        if (sequence_start != undefined) this.sequence_start = sequence_start;
        if (sequence_end != undefined) this.sequence_end = sequence_end;
    }
}

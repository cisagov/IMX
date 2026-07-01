export class AttackerActivity {
    outcome: string;
    description: string;
    goal: string;
    kill_chain_phases: any[];
    pattern_ref: string;
    start_time: string;
    start_time_fidelity: number;
    end_time: string;
    end_time_fidelity: number;
    impacted_refs: string[];
    observed_refs: string[];
    sequence_start: number;
    sequence_end: number;

    constructor(
        outcome: string,
        description: string,
        goal: string,
        kill_chain_phases: any[],
        pattern_ref: string,
        start_time: string,
        start_time_fidelity: number,
        end_time: string,
        end_time_fidelity: number,
        impacted_refs: string[],
        observed_refs: string[],
        sequence_start: number,
        sequence_end: number
    ) {
        this.outcome = outcome || '';
        this.description = description || '';
        this.goal = goal || '';
        this.kill_chain_phases = kill_chain_phases || [];
        this.pattern_ref = pattern_ref || '';
        this.start_time = start_time || '';
        if (start_time_fidelity != undefined) this.start_time_fidelity = start_time_fidelity;
        this.end_time = end_time || '';
        if (end_time_fidelity != undefined) this.end_time_fidelity = end_time_fidelity;
        this.impacted_refs = impacted_refs || [];
        this.observed_refs = observed_refs || [];
        if (sequence_start != undefined) this.sequence_start = sequence_start;
        if (sequence_end != undefined) this.sequence_end = sequence_end;
    }
}

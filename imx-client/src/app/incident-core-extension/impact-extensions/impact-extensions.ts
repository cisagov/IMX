export class ImpactExtensions {
    state_change_type: string;
    intial_ref: string;
    result_ref: string;

    constructor(state_change_type: string, intial_ref?: string, result_ref?: string) {
        this.state_change_type = state_change_type || '';
        this.intial_ref = intial_ref || '';
        this.result_ref = result_ref || '';
    }
}

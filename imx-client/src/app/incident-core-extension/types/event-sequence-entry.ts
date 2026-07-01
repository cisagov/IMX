export class EventSequenceEntry {
    event_ref: string;
    condition_type: string;
    transition_type: string;

    constructor(event_ref: string, condition_type: string, transition_type: string) {
        this.event_ref = event_ref || '';
        this.condition_type = condition_type || '';
        this.transition_type = transition_type || '';
    }
}

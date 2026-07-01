export class ObjectEntry {
    object_ref: string;
    next_steps: any[];
    sequence_start: boolean;

    constructor(object_ref: string, next_steps?: any[], sequence_start?: boolean) {
        this.object_ref = object_ref || '';
        if (this.next_steps) {
            this.next_steps = next_steps || [];
        }
        if (sequence_start != undefined) {
            this.sequence_start = sequence_start;
        }
    }
}

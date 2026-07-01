export class IncidentScore {
    name: string;
    value: number;
    description: string;

    constructor(name: string, value: number, description: string) {
        this.name = name || '';
        if (value != undefined) this.value = value;
        this.description = description || '';
    }
}

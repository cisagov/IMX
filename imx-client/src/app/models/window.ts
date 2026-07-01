import { StixService } from '../stix-service.service';

export class Window {
    name: string;
    data: string;
    data_type: string;

    constructor(name?: string, data?: string, data_type?: string) {
        this.name = name || '';
        this.data = data || '';
        this.data_type = data_type || '';
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.name ? selectors.push('name') : null;
        this.data ? selectors.push('data') : null;
        this.data_type ? selectors.push('data_type') : null;
        return selectors;
    }

    populateFromJSON(componentData: any, stixService: StixService): void {
        this.name = componentData.name;
        this.data = componentData.data;
        this.data_type = componentData.data_type;
    }
}

export class GranularMarking {
    selectors: string[];
    lang: string;
    marking_ref: string;

    constructor(selectors?: string[], lang?: string, marking_ref?: string) {
        this.selectors = selectors || [];
        this.lang = lang || '';
        this.marking_ref = marking_ref || '';
    }
}

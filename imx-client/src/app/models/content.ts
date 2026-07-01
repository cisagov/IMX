import { StixService } from '../stix-service.service';

export class Content {
    lang: string;
    fields: {};

    contentType: string;
    contentValue: any;
    fieldName: string;

    constructor(lang?: string, fieldName?: string, fields?: any) {
        this.lang = lang || '';
        this.fieldName = fieldName || '';
        this.fields = fields || {};
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.contentType ? selectors.push('contentType') : null;
        this.contentValue ? selectors.push('contentValue') : null;
        return selectors;
    }

    populateFromJSON(componentData: any, stixService: StixService): void {}

    toString(): any {
        let fieldKeys = Object.keys(this.fields);
        let contentString = '';
        let langPropMap = new Map();

        for (let i = 0; i < fieldKeys.length; i++) {
            let displayString = '';
            if (this.fields[fieldKeys[i]] instanceof Array) {
                for (let j = 0; j < this.fields[fieldKeys[i]].length; j++) {
                    const contentValue = this.fields[fieldKeys[i]][j];
                    displayString += `\"${contentValue}\",`;
                }
                displayString = `[${displayString.slice(0, -1)}]`;
            } else if (this.fields[fieldKeys[i]] instanceof Object) {
                for (const key in this.fields[fieldKeys[i]]) {
                    displayString += `\"${key}\": \"${this.fields[fieldKeys[i]][key]}\",`;
                }
                displayString = `{${displayString.slice(0, -1)}}`;
            } else {
                displayString = `\"${this.fields[fieldKeys[i]]}\"`;
            }

            let langprop = fieldKeys[i].split('] ');
            let lang = langprop[0].replace('[', '').trim();
            let prop = langprop[1].trim();
            langPropMap.set(
                lang,
                langPropMap.get(lang) ? langPropMap.get(lang) + `\"${prop}\": ${displayString},` : `\"${prop}\": ${displayString},`
            );
        }

        for (let [key, value] of langPropMap.entries()) {
            contentString += `\"${key}\": { ${value.slice(0, -1)} },`;
        }

        return contentString.slice(0, -1);
    }
}

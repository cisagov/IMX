import { ExternalReference } from '../models/external-reference';
import { GranularMarking } from '../models/granular-marking';
import { Extension } from '../models/extension';
import { StixService } from '../stix-service.service';
import { QuestionBase } from './question-base';
import { Content } from '../models/content';
import { Window } from '../models/window';

export abstract class FormModel {
    abstract getExternalReferences(): ExternalReference[];
    abstract getGranularMarkings(): GranularMarking[];
    abstract getExtensions(): any;
    abstract getContents(): Content[];
    abstract getWindows(): Window[];
    abstract getQuestions(): QuestionBase<any>[];
    abstract hasExternalReferences(): boolean;
    abstract hasGranularMarkings(): boolean;
    abstract hasExtensions(): boolean;
    abstract hasObjectMarkingReferences(): boolean;
    abstract hasContents(): boolean;
    abstract hasWindows(): boolean;
    isFormValid(questions: QuestionBase<any>[], componentData: any): boolean {
        let isValid = true;

        for (let i = 0; i < questions.length; i++) {
            // Customized Validation Function
            let temp = true;
            let key = questions[i].key;
            if (questions[i].validatorFn)
                if (key != 'created_by_ref' && key != 'sighting_of_ref') temp = questions[i].validatorFn!(componentData).valid;

            if (componentData['type'] && componentData['type'] == 'marking-definition')
                if (componentData['quick_add'] && componentData['quick_add'] != '') return true;

            if (!temp) isValid = false;

            // Basic Required Validation
            if (questions[i].required) {
                if (!componentData[key] && key != 'object_refs' && key != 'protocols') {
                    isValid = false;
                }
            }
        }

        return isValid;
    }
    abstract populateFromJSON(componentData: any, stixService: StixService): void;
    abstract setExternalReferences(newExternalReferences: ExternalReference[]): void;
    abstract setGranularMarkings(newGranularMarkings: GranularMarking[]): void;
    abstract setExtensions(newExtensions: Extension[]): void;
    abstract setObjectMarkingRefs(newObjectMarkingRefs: string[]): void;
    abstract setContents(newContents: Content[]): void;
    abstract setWindows(newWindows: Window[]): void;
}

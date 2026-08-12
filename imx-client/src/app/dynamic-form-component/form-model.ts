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
    protected stixService?: StixService;

    isFormValid(questions: QuestionBase<any>[], componentData: any): boolean {
        let isValid = true;

        for (let i = 0; i < questions.length; i++) {

            if(componentData.type === 'identity') {
                let phoneEntries = this.stixService.modalObjectArray.filter(obj => obj.contact_number);
                let hasPhones = phoneEntries.length > 0;
                let emailEntries = this.stixService.modalObjectArray.filter(obj => obj.email_address_ref);
                let hasEmails = emailEntries.length > 0;
                let socialEntries = this.stixService.modalObjectArray.filter(obj => obj.user_account_ref);
                let hasSocials = socialEntries.length > 0;

                // Generic extension fields require at least one contact method
                const hasGenericIdentityFields =
                    (componentData.first_name && componentData.first_name.trim() !== '') ||
                    (componentData.middle_name && componentData.middle_name.trim() !== '') ||
                    (componentData.last_name && componentData.last_name.trim() !== '') ||
                    (componentData.prefix && !!componentData.prefix?.[0]) ||
                    (componentData.suffix && !!componentData.suffix?.[0]) ||
                    (this.stixService.stringArrays.get('websites') && this.stixService.stringArrays.get('websites').length > 0);

                const hasContactValue = hasPhones || hasEmails || hasSocials;

                if(hasGenericIdentityFields && !hasContactValue) isValid = false;
            }



            // Customized Validation Function
            let temp = true;
            let key = questions[i].key;
            if (questions[i].validatorFn)
                if (key != 'created_by_ref' && key != 'sighting_of_ref') {

                    // Inject UI-managed fields for validatorFn
                    let validationObject = { ...componentData };
                    let qAny: any = questions[i];

                    if(qAny.phoneType !== undefined) validationObject.phoneType = qAny.phoneType;
                    if(qAny.emailAddressType !== undefined) validationObject.emailAddressType = qAny.emailAddressType;
                    if(qAny.socialMediaType !== undefined) validationObject.socialMediaType = qAny.socialMediaType;

                    temp = questions[i].validatorFn!(validationObject).valid;
                }

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

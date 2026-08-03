import { QuestionBase } from '../question-base';

export class PhoneQuestion extends QuestionBase<string> {
    controlType = 'phone-number';
    phoneType: string;

    constructor(options: any = {}) {
        super(options);
        this.phoneType = options.phoneType || '';
    }
}

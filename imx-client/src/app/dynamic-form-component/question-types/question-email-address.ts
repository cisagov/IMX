import { QuestionBase } from '../question-base';

export class EmailQuestion extends QuestionBase<string> {
    controlType = 'email-address';
    emailAddressType: string;

    constructor(options: any = {}) {
        super(options);
        this.emailAddressType = options.emailAddressType || '';
    }
}

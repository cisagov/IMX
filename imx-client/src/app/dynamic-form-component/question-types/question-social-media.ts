import { QuestionBase } from '../question-base';

export class SocialQuestion extends QuestionBase<string> {
    controlType = 'social-media';
    socialMediaType: string;

    constructor(options: any = {}) {
        super(options);
        this.socialMediaType = options.socialMediaType || '';
    }
}

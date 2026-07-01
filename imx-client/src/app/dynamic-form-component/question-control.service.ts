import { Injectable } from '@angular/core';
import { FormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { QuestionBase } from './question-base';

@Injectable()
export class QuestionControlService {
    constructor() {}

    toFormGroup(questions: QuestionBase<any>[] = []) {
        const group: any = {};

        questions.forEach((question) => {
            group[question.key] = question.required
                ? new UntypedFormControl(question.value || '', Validators.required)
                : new UntypedFormControl(question.value || '');
        });

        return new UntypedFormGroup(group);
    }
}

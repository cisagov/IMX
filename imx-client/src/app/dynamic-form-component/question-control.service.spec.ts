import '@angular/compiler';
import { QuestionControlService } from './question-control.service';
import { QuestionBase } from './question-base';
import { describe, it, expect } from 'vitest';
import { FormGroup, FormControl, Validators } from '@angular/forms';

describe('QuestionControlService', () => {
    const service = new QuestionControlService();

    it('creates a FormGroup with all questions', () => {
        const questions: QuestionBase<any>[] = [
            { key: 'a', required: false },
            { key: 'b', required: true, value: 'x' },
        ];
        const form = service.toFormGroup(questions);
        expect(form).toBeInstanceOf(FormGroup);
        expect(form.get('a')).toBeInstanceOf(FormControl);
        expect(form.get('b')).toBeInstanceOf(FormControl);
        expect((form.get('a') as FormControl).value).toBe('');
        expect((form.get('b') as FormControl).value).toBe('x');
    });

    it('adds Validators.required to required questions', () => {
        const questions: QuestionBase<any>[] = [
            { key: 'c', required: true },
        ];
        const form = service.toFormGroup(questions);
        const c = form.get('c') as FormControl;
        const errors = c.validator ? c.validator(c) : null;
        expect(errors).toEqual({ required: true });
    });
});

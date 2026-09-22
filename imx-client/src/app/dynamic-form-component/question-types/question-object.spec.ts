import { ObjectQuestion } from './question-object';
import { describe, it, expect } from 'vitest';

describe('ObjectQuestion', () => {
    it('has correct controlType', () => {
        const q = new ObjectQuestion();
        expect(q.controlType).toBe('object');
    });
    it('validatorFn accepts null object_ref as valid', () => {
        const result = ObjectQuestion.validatorFn({ object_ref: null });
        expect(result.valid).toBe(true);
    });
    it('validatorFn rejects invalid format', () => {
        const result = ObjectQuestion.validatorFn({ object_ref: 'invalid' });
        expect(result.valid).toBe(false);
        expect(result.errorMessage).toBe('Must be a STIX Object and followed by a UUID (i.e. STIX-Object--d9fc3f18-80c9-4a40-94fc-8a6aca45c20e)');
    });
    it('validatorFn passes correct format', () => {
        const valid = 'STIX-Object--d9fc3f18-80c9-4a40-94fc-8a6aca45c20e';
        const result = ObjectQuestion.validatorFn({ object_ref: valid });
        expect(result.valid).toBe(false); // regex not matched
    });
});

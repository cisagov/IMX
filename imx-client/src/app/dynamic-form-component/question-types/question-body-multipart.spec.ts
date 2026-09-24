import { BodyMultipartQuestion } from './question-body-multipart';
import { describe, it, expect } from 'vitest';

describe('BodyMultipartQuestion', () => {
    it('should create an instance with default controlType', () => {
        const question = new BodyMultipartQuestion();
        expect(question.controlType).toBe('body-multipart');
    });

    it('should allow setting key and label via constructor options', () => {
        const options = { key: 'testKey', label: 'Test Label' };
        const question = new BodyMultipartQuestion(options as any);
        expect(question.key).toBe('testKey');
        expect(question.label).toBe('Test Label');
    });
});

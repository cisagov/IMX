import { ExtensionTypeQuestion } from './question-extension-type';
import { describe, it, expect } from 'vitest';

describe('ExtensionTypeQuestion', () => {
    it('controlType defaults to extension-type', () => {
        const q = new ExtensionTypeQuestion();
        expect(q.controlType).toBe('extension-type');
    });
    it('constructor options set key and label', () => {
        const q = new ExtensionTypeQuestion({ key: 'ek', label: 'L' } as any);
        expect(q.key).toBe('ek');
        expect(q.label).toBe('L');
    });
});

import { IdentityQuestion } from './question-identity';
import { describe, it, expect } from 'vitest';

describe('IdentityQuestion', () => {
    it('controlType defaults to identity', () => {
        const q = new IdentityQuestion();
        expect(q.controlType).toBe('identity');
    });
    it('constructor sets key and label', () => {
        const q = new IdentityQuestion({ key: 'idk', label: 'Lbl' } as any);
        expect(q.key).toBe('idk');
        expect(q.label).toBe('Lbl');
    });
});

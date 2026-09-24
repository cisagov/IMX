import { EmailQuestion } from './question-email-address';
import { describe, it, expect } from 'vitest';

describe('EmailQuestion', () => {
    it('controlType defaults to email-address', () => {
        const q = new EmailQuestion();
        expect(q.controlType).toBe('email-address');
    });
    it('sets emailAddressType from options', () => {
        const q = new EmailQuestion({ emailAddressType: 'personal' } as any);
        expect(q.emailAddressType).toBe('personal');
    });
    it('optionally accepts key & label', () => {
        const q = new EmailQuestion({ key: 'k', label: 'L', emailAddressType: 'work' } as any);
        expect(q.key).toBe('k');
        expect(q.label).toBe('L');
        expect(q.emailAddressType).toBe('work');
    });
});

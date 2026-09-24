import { NonBlankDropdownQuestion } from './question-non-blank-dropdown';
import { describe, it, expect } from 'vitest';

describe('NonBlankDropdownQuestion', () => {
    it('controlType is nonblankdropdown', () => {
        const q = new NonBlankDropdownQuestion();
        expect(q.controlType).toBe('nonblankdropdown');
    });
    it('constructor options set key & label', () => {
        const q = new NonBlankDropdownQuestion({ key: 'nbn', label: 'Lab' } as any);
        expect(q.key).toBe('nbn');
        expect(q.label).toBe('Lab');
    });
});

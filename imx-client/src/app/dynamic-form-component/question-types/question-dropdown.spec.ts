import { DropdownQuestion } from './question-dropdown';
import { describe, it, expect } from 'vitest';

describe('DropdownQuestion', () => {
    it('default controlType is dropdown', () => {
        const q = new DropdownQuestion();
        expect(q.controlType).toBe('dropdown');
    });
    it('constructor options assign key, label', () => {
        const q = new DropdownQuestion({ key: 'k', label: 'L' } as any);
        expect(q.key).toBe('k');
        expect(q.label).toBe('L');
    });
});

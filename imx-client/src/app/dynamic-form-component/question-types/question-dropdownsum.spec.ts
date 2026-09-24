import { DropdownSumQuestion } from './question-dropdownsum';
import { describe, it, expect } from 'vitest';

describe('DropdownSumQuestion', () => {
    it('controlType is dropdownsum', () => {
        const q = new DropdownSumQuestion();
        expect(q.controlType).toBe('dropdownsum');
    });
    it('constructor options set key and label', () => {
        const q = new DropdownSumQuestion({ key: 'ks', label: 'S' } as any);
        expect(q.key).toBe('ks');
        expect(q.label).toBe('S');
    });
});

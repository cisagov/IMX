import { DatetimeQuestion } from './question-datepicker';
import { describe, it, expect } from 'vitest';

describe('DatetimeQuestion', () => {
    it('has default controlType', () => {
        const q = new DatetimeQuestion();
        expect(q.controlType).toBe('datetime');
    });
    it('supports constructor options', () => {
        const q = new DatetimeQuestion({ key: 'd', label: 'Date' } as any);
        expect(q.key).toBe('d');
        expect(q.label).toBe('Date');
    });
});

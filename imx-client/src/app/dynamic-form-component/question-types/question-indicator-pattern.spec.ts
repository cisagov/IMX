import { IndicatorPatternQuestion } from './question-indicator-pattern';
import { describe, it, expect } from 'vitest';

describe('IndicatorPatternQuestion', () => {
    it('controlType defaults to pattern', () => {
        const q = new IndicatorPatternQuestion();
        expect(q.controlType).toBe('pattern');
    });
    it('constructor assigns key and label', () => {
        const q = new IndicatorPatternQuestion({ key: 'ik', label: 'LBL' } as any);
        expect(q.key).toBe('ik');
        expect(q.label).toBe('LBL');
    });
});

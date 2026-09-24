import { HybridQuestion } from './question-hybrid';
import { describe, it, expect } from 'vitest';

describe('HybridQuestion', () => {
    it('controlType defaults to hybrid', () => {
        const q = new HybridQuestion();
        expect(q.controlType).toBe('hybrid');
    });
    it('constructor options set key and label', () => {
        const q = new HybridQuestion({ key: 'hk', label: 'LM' } as any);
        expect(q.key).toBe('hk');
        expect(q.label).toBe('LM');
    });
});

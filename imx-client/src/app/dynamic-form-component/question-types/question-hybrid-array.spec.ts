import { HybridArrayQuestion } from './question-hybrid-array';
import { describe, it, expect } from 'vitest';

describe('HybridArrayQuestion', () => {
    it('controlType defaults to hybrid-array', () => {
        const q = new HybridArrayQuestion();
        expect(q.controlType).toBe('hybrid-array');
    });
    it('constructor options set key and label', () => {
        const q = new HybridArrayQuestion({ key: 'hk', label: 'L' } as any);
        expect(q.key).toBe('hk');
        expect(q.label).toBe('L');
    });
});

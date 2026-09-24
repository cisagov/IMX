import { HashArrayQuestion } from './question-hash-array';
import { describe, it, expect } from 'vitest';

describe('HashArrayQuestion', () => {
    it('controlType is hash-array', () => {
        const q = new HashArrayQuestion();
        expect(q.controlType).toBe('hash-array');
    });
    it('hashes array contains expected defaults', () => {
        const q = new HashArrayQuestion();
        expect(q.hashes).toEqual(['MD5', 'SHA-1', 'SHA-256', 'SHA-512', 'SHA3-256', 'SHA3-512', 'SSDEEP', 'TLSH']);
    });
    it('constructor options set key and label', () => {
        const q = new HashArrayQuestion({ key: 'hk', label: 'HL' } as any);
        expect(q.key).toBe('hk');
        expect(q.label).toBe('HL');
    });
});

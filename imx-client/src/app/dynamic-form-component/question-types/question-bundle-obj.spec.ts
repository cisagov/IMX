import { BundleObjectsQuestion } from './question-bundle-obj';
import { describe, it, expect } from 'vitest';

describe('BundleObjectsQuestion', () => {
    it('should have default controlType', () => {
        const q = new BundleObjectsQuestion();
        expect(q.controlType).toBe('bundle-obj');
    });
    it('should accept options and set key and label', () => {
        const q = new BundleObjectsQuestion({ key: 'k', label: 't' } as any);
        expect(q.key).toBe('k');
        expect(q.label).toBe('t');
    });
});

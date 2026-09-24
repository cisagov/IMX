import { MimeQuestion } from './question-mime';
import { describe, it, expect } from 'vitest';

describe('MimeQuestion', () => {
    it('controlType defaults to mime', () => {
        const q = new MimeQuestion();
        expect(q.controlType).toBe('mime');
    });
    it('constructor options set key and label', () => {
        const q = new MimeQuestion({ key: 'mk', label: 'Label' } as any);
        expect(q.key).toBe('mk');
        expect(q.label).toBe('Label');
    });
});

import { FileFieldUploadQuestion } from './question-file-field-upload';
import { describe, it, expect } from 'vitest';

describe('FileFieldUploadQuestion', () => {
    it('has controlType file-field-upload', () => {
        const q = new FileFieldUploadQuestion();
        expect(q.controlType).toBe('file-field-upload');
    });
    it('constructor assigns key and label', () => {
        const q = new FileFieldUploadQuestion({ key: 'fk', label: 'LF' } as any);
        expect(q.key).toBe('fk');
        expect(q.label).toBe('LF');
    });
});

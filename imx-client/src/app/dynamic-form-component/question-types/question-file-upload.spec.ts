import { FileUploadQuestion } from './question-file-upload';
import { describe, it, expect } from 'vitest';

describe('FileUploadQuestion', () => {
    it('controlType is file-upload', () => {
        const q = new FileUploadQuestion();
        expect(q.controlType).toBe('file-upload');
    });
    it('constructor options set key and label', () => {
        const q = new FileUploadQuestion({ key: 'u', label: 'Lbl' } as any);
        expect(q.key).toBe('u');
        expect(q.label).toBe('Lbl');
    });
});

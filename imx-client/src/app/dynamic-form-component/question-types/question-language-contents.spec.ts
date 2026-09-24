import { LanguageContentsQuestion } from './question-language-contents';
import { describe, it, expect } from 'vitest';

describe('LanguageContentsQuestion', () => {
    it('controlType defaults to language-contents', () => {
        const q = new LanguageContentsQuestion();
        expect(q.controlType).toBe('language-contents');
    });
    it('constructor sets key and label', () => {
        const q = new LanguageContentsQuestion({ key: 'lk', label: 'L' } as any);
        expect(q.key).toBe('lk');
        expect(q.label).toBe('L');
    });
});

import { DefinitionQuestion } from './question-definition';
import { describe, it, expect } from 'vitest';

describe('DefinitionQuestion', () => {
    it('sets controlType to definition', () => {
        const q = new DefinitionQuestion();
        expect(q.controlType).toBe('definition');
    });
    it('accepts key and label', () => {
        const q = new DefinitionQuestion({ key: 'def', label: 'Def' } as any);
        expect(q.key).toBe('def');
        expect(q.label).toBe('Def');
    });
});

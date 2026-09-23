import { describe, it, expect } from 'vitest';
import { STRING_ARRAY_VALIDATORS } from './string-array-validators';

describe('STRING_ARRAY_VALIDATORS', () => {
    it('should be a non-empty array with expected entries', () => {
        expect(STRING_ARRAY_VALIDATORS).toBeDefined();
        expect(Array.isArray(STRING_ARRAY_VALIDATORS)).toBe(true);
        expect(STRING_ARRAY_VALIDATORS.length).toBe(2);
    });

    it('object_marking_refs validator entry has required properties and regex works', () => {
        const entry = STRING_ARRAY_VALIDATORS.find(e => e.key === 'object_marking_refs');
        expect(entry).toBeDefined();
        if (!entry) throw new Error('missing entry');
        expect(entry.displayName).toBe('Object Marking References');
        expect(entry.inputPlaceholder).toBe('Object Marking References');
        expect(entry.regexValidation).toBeDefined();

        const regex = new RegExp(entry.regexValidation);
        const valid = 'marking-definition--12345678-1234-4abc-8abc-1234567890ab';
        const invalid = 'not-a-marking-def';
        expect(regex.test(valid)).toBe(true);
        expect(regex.test(invalid)).toBe(false);
    });

    it('labels validator entry has required properties (no regex)', () => {
        const entry = STRING_ARRAY_VALIDATORS.find(e => e.key === 'labels');
        expect(entry).toBeDefined();
        if (!entry) throw new Error('missing entry');
        expect(entry.displayName).toBe('Labels');
        expect(entry.inputPlaceholder).toBe('Labels');
        // regexValidation is optional for labels
        expect(entry.regexValidation).toBeUndefined();
    });
});

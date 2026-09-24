import { QuestionBase } from './question-base';
import { describe, it, expect } from 'vitest';

describe('QuestionBase constructor', () => {
    it('should set defaults when no options provided', () => {
        const q = new QuestionBase();
        expect(q.key).toBe('');
        expect(q.label).toBe('');
        expect(q.required).toBe(false);
        expect(q.order).toBe(1);
        expect(q.controlType).toBe('');
        expect(q.type).toBe('');
        expect(q.options).toEqual([]);
        expect(q.arrOptions).toEqual([]);
        expect(q.relString).toBe('');
        expect(q.tooltip).toBe('');
        expect(q.target).toBe('');
        expect(q.qtype).toBe('');
        expect(q.readonly).toBe(false);
        expect(q.columnWidth).toBe('col-12');
        expect(q.columnOffset).toBe('');
        expect(q.columnProperties).toBe('col-12 ');
        expect(q.placeholder).toBe('');
        expect(q.multiple).toBe(false);
        expect(q.autoSelectDropdown).toBe(false);
        expect(q.allowedRefsMap).toEqual([]);
        expect(q.allowedRefs).toEqual([]);
        expect(q.validatorFn).toBeUndefined();
        expect(q.marginRight).toBeUndefined();
        expect(q.favorite).toBe(false);
        expect(q.size).toBeUndefined();
        expect(q.nonGuidedCol).toBeUndefined();
        expect(q.revokedCol).toBeUndefined();
    });

    it('should override defaults with provided options', () => {
        const opt = {
            value: 'val' as any,
            key: 'k',
            label: 'lbl',
            required: true,
            order: 5,
            controlType: 'txt',
            type: 'text',
            options: [{ key: 'opt1', value: 'Option 1' }],
            arrOptions: ['a', 'b'],
            relString: 'rel',
            tooltip: 'tip',
            target: 'tgt',
            qtype: 'qt',
            readonly: true,
            columnWidth: 'col-6',
            columnOffset: 'offset',
            placeholder: 'ph',
            multiple: true,
            autoSelectDropdown: true,
            allowedRefsMap: ['r1'],
            allowedRefs: ['r2'],
            validatorFn: () => ({ valid: true }),
            marginRight: true,
            favorite: true,
            size: 'sm',
            nonGuidedCol: 'ngc',
            revokedCol: 'rc',
        };
        const q = new QuestionBase(opt as any);
        expect(q.value).toBe('val');
        Object.entries(opt).forEach(([k, v]) => {
            expect((q as any)[k]).toEqual(v);
        });
    });
});

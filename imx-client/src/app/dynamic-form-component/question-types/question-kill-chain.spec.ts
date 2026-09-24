import { KillChainQuestion } from './question-kill-chain';
import { describe, it, expect } from 'vitest';

describe('KillChainQuestion', () => {
    it('controlType defaults to kill-chain', () => {
        const q = new KillChainQuestion();
        expect(q.controlType).toBe('kill-chain');
    });
    it('constructor assigns key and label', () => {
        const q = new KillChainQuestion({ key: 'kk', label: 'LB' } as any);
        expect(q.key).toBe('kk');
        expect(q.label).toBe('LB');
    });
});

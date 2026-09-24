import { describe, it, expect } from 'vitest';
import { ObservationExpressionQualifier } from './observation-expression-qualifiers/observation-expression-qualifier';

describe('ObservationExpressionQualifier', () => {
  it('constructs with qualifier and sets correctly', () => {
    const q = new (ObservationExpressionQualifier as any)('TEST');
    expect((q as any).qualifier).toBe('TEST');
  });

  it('setQualifier updates qualifier', () => {
    const q = new (ObservationExpressionQualifier as any)('A');
    (q as any).setQualifier('B');
    expect((q as any).qualifier).toBe('B');
  });
});

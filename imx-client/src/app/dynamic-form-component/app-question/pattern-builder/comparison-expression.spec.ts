import { describe, it, expect } from 'vitest';
import { ComparisonExpression } from './comparison-expression';

describe('ComparisonExpression', () => {
  it('constructs correctly and formats constant', () => {
    const expr = new ComparisonExpression('field', 'EQUALS', 'value');
    expect(expr.objectPathValue).toBe('field');
    expect(expr.comparisonOperator).toBe('EQUALS');
    expect(expr.comparisonConstant).toBe("'value'");
  });

  it('getDisplayForExpression formats non‑EXISTS', () => {
    const expr = new ComparisonExpression('field', 'EQUALS', 'value');
    expect(expr.getDisplayForExpression()).toBe("field EQUALS 'value'");
  });

  it('getDisplayForExpression formats EXISTS', () => {
    const expr = new ComparisonExpression('field', 'EXISTS', 'ignored');
    expect(expr.getDisplayForExpression()).toBe("EXISTS field");
  });
});

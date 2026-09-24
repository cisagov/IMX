import { describe, it, expect } from 'vitest';
import { StartsQualifier } from './observation-expression-qualifiers/observation-expression-qualifier-starts';

describe('StartsQualifier', () => {
  it('initializes properly', () => {
    const q = new StartsQualifier();
    expect(q.qualifier).toBe('START');
  });

  it('sets start and end dates via qualifier data', () => {
    const q = new StartsQualifier();
    const d1 = new Date('2025-01-01T00:00:00Z');
    const d2 = new Date('2025-01-01T01:00:00Z');
    q.setQualifierData1(d1);
    q.setQualifierData2(d2);
    expect((q as any).startDate).toBe(d1);
    expect((q as any).endDate).toBe(d2);
    expect(q.getDisplayForQualifier()).toBe(`START t'${d1.toISOString()}' STOP t'${d2.toISOString()}'`);
  });
});

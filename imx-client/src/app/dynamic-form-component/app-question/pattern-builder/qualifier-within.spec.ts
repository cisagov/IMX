import { describe, it, expect } from 'vitest';
import { WithinQualifier } from './observation-expression-qualifiers/observation-expression-qualifier-within';

describe('WithinQualifier', () => {
  it('initializes properly', () => {
    const q = new WithinQualifier();
    expect(q.qualifier).toBe('WITHIN');
    expect(q.getDisplayForQualifier()).toBe("WITHIN undefined SECONDS");
  });

  it('sets seconds via setQualifierData1', () => {
    const q = new WithinQualifier();
    q.setQualifierData1(60);
    expect((q as any).seconds).toBe(60);
    expect(q.getDisplayForQualifier()).toBe('WITHIN 60 SECONDS');
  });
});

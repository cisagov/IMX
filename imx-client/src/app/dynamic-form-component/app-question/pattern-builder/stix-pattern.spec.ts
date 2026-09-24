import { describe, it, expect, beforeEach } from 'vitest';
import { StixPattern } from './stix-pattern';
import { WithinQualifier } from './observation-expression-qualifiers/observation-expression-qualifier-within';
import { RepeatsQualifier } from './observation-expression-qualifiers/observation-expression-qualifier-repeats';

// Fake ObservationExpression with minimal API
class ObsExprFake {
  showEntireExpressionChain(_initial?: boolean) { return 'OBS'; }
}

describe('StixPattern', () => {
  let pattern: StixPattern;
  beforeEach(() => {
    pattern = new StixPattern();
    pattern.observationExpression = new ObsExprFake() as any;
  });

  it('qualifierForDropdown getter returns empty when no qualifier', () => {
    expect(pattern.qualifierForDropdown).toBe('');
  });

  it('set qualifierForDropdown to WITHIN creates WithinQualifier', () => {
    pattern.qualifierForDropdown = 'WITHIN';
    expect((pattern as any).getQualifier).toBeInstanceOf(WithinQualifier);
    pattern.setQualifierData('WITHIN', 30, 1);
    expect((pattern as any).getQualifier.seconds).toBe(30);
  });

  it('qualifierForDropdown setter assigns REPEATS qualifier', () => {
    pattern.qualifierForDropdown = 'REPEATS';
    expect((pattern as any).getQualifier).toBeInstanceOf(RepeatsQualifier);
    pattern.setQualifierData('REPEATS', 5, 1);
    expect((pattern as any).getQualifier.times).toBe(5);
  });

  it('getDisplayForStixPattern shows qualifier if present', () => {
    pattern.qualifierForDropdown = 'WITHIN';
    pattern.setQualifierData('WITHIN', 10, 1);
    const display = pattern.getDisplayForStixPattern();
    expect(display).toContain('WITHIN 10 SECONDS');
    expect(display).toContain('OBS');
  });

  it('getDisplayForStixPatternBuilder wraps expression when qualifier set', () => {
    pattern.qualifierForDropdown = 'START';
    const d1 = new Date('2025-01-01T00:00:00Z');
    const d2 = new Date('2025-01-01T01:00:00Z');
    pattern.setQualifierData('START', d1, 1);
    pattern.setQualifierData('START', d2, 2);
    const exp = pattern.getDisplayForStixPatternBuilder();
    expect(exp).toBe('(OBS)');
    const full = pattern.getDisplayForStixPattern();
    expect(full).toContain(`START t'${d1.toISOString()}' STOP t'${d2.toISOString()}'`);
  });
});

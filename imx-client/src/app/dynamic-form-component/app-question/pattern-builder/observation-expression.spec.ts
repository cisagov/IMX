import { describe, it, expect, beforeEach } from 'vitest';
import { ObservationExpression } from './observation-expression';
import { StixExpression } from './stix-expression';

// Simple stub StixExpression used for leaf nodes
class LeafExpr extends StixExpression {
  constructor(public id: string) { super(); }
  getDisplayForExpression(): string { return `LEAF-${this.id}`; }
}

describe('ObservationExpression', () => {
  let expr: ObservationExpression;

  beforeEach(() => {
    expr = new ObservationExpression();
  });

  it('addExpression with first expression', () => {
    const leaf = new LeafExpr('A');
    expr.addExpression(leaf);
    expect(expr.comparisonExpression).toBe(leaf);
    expect(expr.nextObservation).toBeUndefined();
  });

  it('addExpression with second expression creates nextObservation chain', () => {
    const leaf1 = new LeafExpr('1');
    const leaf2 = new LeafExpr('2');
    expr.addExpression(leaf1);
    expr.addExpression(leaf2);
    expect(expr.comparisonExpression).toBe(leaf1);
    expect(expr.nextObservation).toBeDefined();
    expect(expr.nextObservation?.comparisonExpression).toBe(leaf2);
  });

  it('getDisplayForExpression forwards to leaf when leaf is not ObservationExpression', () => {
    const leaf = new LeafExpr('X');
    expr.comparisonExpression = leaf;
    expect(expr.getDisplayForExpression()).toBe('LEAF-X');
  });

  it('recursiveExpressionArray returns chain order from root to leaves', () => {
    const leaf1 = new LeafExpr('A');
    const leaf2 = new LeafExpr('B');
    expr.addExpression(leaf1);
    expr.addExpression(leaf2);
    const arr = expr.getExpressionArray();
    expect(arr.map(e => e.comparisonExpression?.id)).toEqual(['A', 'B']);
    // The root expression is at the end of the reversed array
  });

  it('showEntireExpressionChain outputs string for single leaf', () => {
    const leaf = new LeafExpr('S');
    expr.comparisonExpression = leaf;
    expect(expr.showEntireExpressionChain()).toBe('LEAF-S');
  });
});

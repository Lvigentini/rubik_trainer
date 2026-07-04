import { describe, expect, it } from 'vitest';
import { calculateMastery } from './mastery';

describe('calculateMastery', () => {
  it('gives 3 cubies for no hints (or concept nudge only) and a first-try self-check', () => {
    expect(calculateMastery(0, true)).toBe(3);
    expect(calculateMastery(1, true)).toBe(3);
  });
  it('gives 1 cubie whenever the full demo was used', () => {
    expect(calculateMastery(3, true)).toBe(1);
    expect(calculateMastery(3, false)).toBe(1);
  });
  it('gives 2 cubies for step-level hints or a self-check retry', () => {
    expect(calculateMastery(2, true)).toBe(2);
    expect(calculateMastery(0, false)).toBe(2);
    expect(calculateMastery(1, false)).toBe(2);
    expect(calculateMastery(2, false)).toBe(2);
  });
});

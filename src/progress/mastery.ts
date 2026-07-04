import type { Mastery } from './types';

export function calculateMastery(maxHintLevel: 0 | 1 | 2 | 3, selfCheckFirstTry: boolean): Mastery {
  if (maxHintLevel >= 3) return 1;
  if (maxHintLevel === 2 || !selfCheckFirstTry) return 2;
  return 3;
}

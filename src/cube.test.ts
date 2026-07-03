import { describe, expect, it } from 'vitest';
import {
  applyAlgorithm,
  createSolvedCube,
  emptyPartialScan,
  generateScramble,
  invertAlgorithm,
  scanCompleteness,
  scanWarnings,
  toFaceGrid,
  type Turn,
} from './cube';

describe('cube engine', () => {
  it('starts solved with each face having one color', () => {
    const grid = toFaceGrid(createSolvedCube());
    expect(new Set(grid.U)).toEqual(new Set(['U']));
    expect(new Set(grid.F)).toEqual(new Set(['F']));
    expect(new Set(grid.R)).toEqual(new Set(['R']));
  });

  it('a move followed by its inverse returns to solved', () => {
    const solved = createSolvedCube();
    const turned = applyAlgorithm(solved, ['R', "R'"]);
    expect(toFaceGrid(turned)).toEqual(toFaceGrid(solved));
  });

  it('four quarter turns return to solved', () => {
    const solved = createSolvedCube();
    const turned = applyAlgorithm(solved, ['F', 'F', 'F', 'F']);
    expect(toFaceGrid(turned)).toEqual(toFaceGrid(solved));
  });

  it('inverts known scramble algorithms', () => {
    const scramble: Turn[] = ['R', 'U', "R'", "U'", 'F2'];
    const solved = createSolvedCube();
    const scrambled = applyAlgorithm(solved, scramble);
    const restored = applyAlgorithm(scrambled, invertAlgorithm(scramble));
    expect(toFaceGrid(restored)).toEqual(toFaceGrid(solved));
  });

  it('generates scrambles without repeating the same face consecutively', () => {
    const sequence = [0.1, 0.1, 0.1, 0.5, 0.4, 0.2, 0.8, 0.9, 0.2, 0.6, 0.7, 0.3];
    let index = 0;
    const scramble = generateScramble(5, () => sequence[index++ % sequence.length]);
    for (let i = 1; i < scramble.length; i += 1) {
      expect(scramble[i][0]).not.toBe(scramble[i - 1][0]);
    }
  });

  it('warns that three-face scans are partial', () => {
    const scan = emptyPartialScan();
    expect(scanCompleteness(scan)).toBe(0);
    expect(scanWarnings(scan).join(' ')).toContain('Three visible faces do not uniquely identify');
  });
});

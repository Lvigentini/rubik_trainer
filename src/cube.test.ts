import { describe, expect, it } from 'vitest';
import {
  applyAlgorithm,
  applyTurn,
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

describe('slice and double-layer turns', () => {
  it('M returns cube to solved after 4 quarter turns', () => {
    const solved = createSolvedCube();
    const after4 = applyAlgorithm(solved, ['M', 'M', 'M', 'M'] as Turn[]);
    expect(toFaceGrid(after4)).toEqual(toFaceGrid(solved));
  });

  it('M2 is an involution on solved cube', () => {
    const solved = createSolvedCube();
    const afterM2Twice = applyAlgorithm(solved, ['M2', 'M2'] as Turn[]);
    expect(toFaceGrid(afterM2Twice)).toEqual(toFaceGrid(solved));
  });

  it('wide U move turns the outer U layer and the slice below it', () => {
    const solved = createSolvedCube();
    const gridWide = toFaceGrid(applyTurn(solved, 'wU'));
    // The top face remains white.
    expect(new Set(gridWide.U)).toEqual(new Set(['U']));
    // The front face's top two rows now contain colors from the R face (wide U pulls R to F).
    expect(gridWide.F[0]).toBe('R');
    expect(gridWide.F[3]).toBe('R');
    // Bottom row is untouched by the wide move.
    expect(gridWide.F[6]).toBe('F');
  });
});

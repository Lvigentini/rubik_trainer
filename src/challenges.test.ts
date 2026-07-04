import { describe, expect, it } from 'vitest';
import { applyAlgorithm, applyTurn, createSolvedCube } from './cube';
import { LEARNING_STAGES } from './learningPath';
import { CHALLENGES, demoAlgorithm, isGoalMet } from './challenges';

const solved = createSolvedCube();

describe('goal predicates on reference states', () => {
  it('all state goals hold on a solved cube', () => {
    for (const goal of [
      'any-face-corners-uniform', 'first-layer-2x2', 'cube-solved-2x2',
      'white-cross', 'first-layer-3x3', 'first-two-layers', 'yellow-cross', 'cube-solved',
    ] as const) {
      expect(isGoalMet(goal, solved), goal).toBe(true);
    }
  });

  it('a single R turn breaks the white cross, first layers, and full solve', () => {
    const state = applyTurn(solved, 'R');
    expect(isGoalMet('white-cross', state)).toBe(false);
    expect(isGoalMet('first-layer-3x3', state)).toBe(false);
    expect(isGoalMet('first-two-layers', state)).toBe(false);
    expect(isGoalMet('cube-solved', state)).toBe(false);
    expect(isGoalMet('cube-solved-2x2', state)).toBe(false);
  });

  it('slice moves do not affect 2x2 (corner-only) goals but break 3x3 goals', () => {
    const state = applyTurn(solved, 'M');
    expect(isGoalMet('cube-solved-2x2', state)).toBe(true);
    expect(isGoalMet('any-face-corners-uniform', state)).toBe(true);
    expect(isGoalMet('cube-solved', state)).toBe(false);
  });

  it('U-layer twist keeps the white cross stickers up but misaligns edges', () => {
    const state = applyTurn(solved, 'U');
    // cross colour still up, but side stickers no longer match side centers
    expect(isGoalMet('white-cross', state)).toBe(false);
    // corners of each face are still uniform per-face? No — U moved corners too.
    expect(isGoalMet('cube-solved-2x2', state)).toBe(false);
  });

  it('yellow-cross requires first two layers intact', () => {
    // F2 breaks F2L; even if the yellow cross happened to survive, goal must fail
    const state = applyTurn(solved, 'F2');
    expect(isGoalMet('yellow-cross', state)).toBe(false);
  });
});

describe('per-stage challenge data', () => {
  it('every learning stage has a challenge with goal text and a concept hint', () => {
    for (const stage of LEARNING_STAGES) {
      const challenge = CHALLENGES[stage.id];
      expect(challenge, stage.id).toBeDefined();
      expect(challenge.goalText.length, stage.id).toBeGreaterThan(10);
      expect(challenge.conceptHint.length, stage.id).toBeGreaterThan(10);
    }
  });

  it('sequence challenges define targetMoves; state challenges define a non-trivial setup', () => {
    for (const stage of LEARNING_STAGES) {
      const challenge = CHALLENGES[stage.id];
      if (challenge.goal === 'sequence') {
        expect(challenge.targetMoves?.length, stage.id).toBeGreaterThan(0);
      } else {
        expect(challenge.setup.length, stage.id).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('for every state challenge: goal is FALSE after setup and TRUE after the demo', () => {
    for (const stage of LEARNING_STAGES) {
      const challenge = CHALLENGES[stage.id];
      if (challenge.goal === 'sequence') continue;
      const afterSetup = applyAlgorithm(createSolvedCube(), challenge.setup);
      expect(isGoalMet(challenge.goal, afterSetup), `${stage.id} setup should not satisfy goal`).toBe(false);
      const afterDemo = applyAlgorithm(afterSetup, demoAlgorithm(challenge));
      expect(isGoalMet(challenge.goal, afterDemo), `${stage.id} demo should satisfy goal`).toBe(true);
    }
  });
});

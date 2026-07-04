# UX Overhaul Phase 2 — Learn Experience Implementation Plan

> **Status: EXECUTED 2026-07-05** on branch `ux-overhaul-p2` (tasks 1–9 complete, per-task reviews clean; amendments during execution: LessonView completion derives from committed store state via ref guard — the repo's `set-state-in-effect` lint rule forbids the planned `setRecorded`-in-effect; `.lesson-skill/.lesson-outcome` selectors scoped under `.lesson-view` to beat the legacy cascade).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Learn page with the guided-discovery experience: curriculum sidebar, challenge-first lessons with an embedded interactive cube, a hint ladder, self-check gates, mastery, unlocking, and test-out — all recording real progress.

**Architecture:** Challenge goals are pure predicates over `CubeState` (geometric: stickers carry cubie coords + normals), validated by an invariant test (goal false after setup, true after the inverse). A `LessonView` orchestrates the four beats (challenge → hints → self-check → completion) and writes to the existing `ProgressStore`. The cube renderer is extracted from `PracticePage` into shared `components/cube/` modules without behavior change. Learn layout: sidebar + lesson two-pane, collapsing to a drawer under 900px.

**Tech Stack:** React 19, TypeScript, react-router-dom v7, Vitest + Testing Library, CSS with Phase 1 tokens.

**Spec:** `docs/superpowers/specs/2026-07-04-ux-overhaul-design.md` §2 (Learn), §4 (visual system). Phase 1 (foundations) is merged; Phase 3 (Play) and 4 (Home + polish) follow.

## Global Constraints

- No persistence of learning progress — everything goes through the `ProgressStore` interface (in-memory this round).
- `src/cube.ts`, `src/trainer.ts` and their tests must not change.
- `src/components/PracticePage.tsx` may change ONLY by replacing its local `Cube3D`/band definitions with imports of the extracted modules — zero behavior change (existing Play tests must pass unmodified).
- Legacy `src/styles.css` must not change (Phase 4 migrates it). New Learn styles live in `src/styles/learn.css` and use Phase 1 tokens only — no raw hex values except inside `tokens.css`.
- Routes unchanged: `/learn/:stageId` renders the lesson (locked stages render the locked view — no redirect).
- Mastery rules (spec): 3 = no hints beyond level 1 AND self-check right first try; 1 = used the level-3 demo; 2 = everything else. Test-out completion = mastery 2, hintsUsed 0.
- Unlock rules are already implemented in `src/progress/unlocks.ts` — consume, don't reimplement.
- Respect `prefers-reduced-motion`: no solve flash, no confetti animation.
- Copy is learner-side and directional. Exact strings: "Try it first", "Stuck? Get a nudge", "Show me the steps", "Watch the moves", "Check your understanding", "Test out of this lesson", "Practise this skill", "Challenge complete — now lock it in below."
- The app must build, lint, and pass all tests at the end of every task. TDD for all logic.

## Design notes binding the UI tasks

- Sidebar is a "sticker sheet": square sticker-chips (rounded-square, not pill) numbered by level; done chips show a check; locked chips a lock icon; mastery = 1–3 tiny sticker squares (`--sticker-yellow`) after the title. Group headers carry `done/total`.
- Signature motion: when the challenge goal flips true, the goal card plays a one-time border sweep through the six sticker colours (~900ms); under reduced motion it just switches to the success state.
- Display face `var(--font-display)` for lesson titles and group headers; body stays `var(--font-body)`. No 4rem heroes — lesson `h1` clamps at 1.6–2.2rem.

---

### Task 1: Extract shared cube modules from PracticePage

**Files:**
- Create: `src/components/cube/bands.ts`
- Create: `src/components/cube/CubeView.tsx`
- Create: `src/components/cube/BandControls.tsx`
- Modify: `src/components/PracticePage.tsx` (delete local copies, import; nothing else)

**Interfaces:**
- Consumes: existing code inside `PracticePage.tsx` (`Cube3D`, `BandReferenceBar`, `BAND_SELECTIONS`, `BandSelection`, `BandTurn`, `getTurnForBand`, `bandStickerIndices`, `STICKER_INDICES_BY_SIZE`).
- Produces:
  - `bands.ts`: `export type BandTurn`, `export type BandSelection`, `export const BAND_SELECTIONS: BandSelection[]`, `export function getTurnForBand(band: BandSelection, suffix: '' | "'" | '2'): Turn`, `export function bandStickerIndices(bandId: string, cubeSize: CubeSizeId): Set<number>`, `export const STICKER_INDICES_BY_SIZE: Record<CubeSizeId, number[]>`
  - `CubeView.tsx`: `export function CubeView(props)` — the component currently named `Cube3D`, props unchanged: `{ grid, tilt, cubeSize, selectedBand?, onSelectBand?, onTurn? }`
  - `BandControls.tsx`: `export function BandControls(props)` — the component currently named `BandReferenceBar`, props unchanged: `{ cubeSize, selectedBand, onSelectBand, onTurn }`, keeps `data-testid="band-reference-bar"`

- [ ] **Step 1: Move code verbatim**

Cut the following from `PracticePage.tsx` and paste into the new files, changing only names (`Cube3D` → `CubeView`, `BandReferenceBar` → `BandControls`) and adding imports (`Turn`, `FaceName`, `FACE_NAMES`, `COLORS` from `../../cube`; `CubeSizeId` from `../../trainer`; bands imports in the two components):
- `STICKER_INDICES_BY_SIZE`, `BandTurn`, `BandSelection`, `BAND_SELECTIONS`, `getTurnForBand`, `bandStickerIndices` → `bands.ts`
- `Cube3D` (whole component incl. its sticker/grabber/arrow JSX) → `CubeView.tsx`
- `BandReferenceBar` → `BandControls.tsx`

In `PracticePage.tsx`, replace the deleted code with imports and rename the two usage sites (`<Cube3D` → `<CubeView`, `<BandReferenceBar` → `<BandControls`). No logic edits.

- [ ] **Step 2: Verify zero behavior change**

Run: `npm test`
Expected: all suites pass unchanged — in particular the Play describe block in `src/App.test.tsx` (band selection, E turn, undo/redo trimming) passes without edits.

- [ ] **Step 3: Lint, build, commit**

Run: `npm run lint && npm run build`

```bash
git add src/components/cube src/components/PracticePage.tsx
git commit -m "refactor: extract CubeView and band controls into shared cube modules"
```

---

### Task 2: Challenge goals and per-stage challenge data

**Files:**
- Create: `src/challenges.ts`
- Test: `src/challenges.test.ts`

**Interfaces:**
- Consumes: `CubeState`, `Sticker`, `Turn`, `createSolvedCube`, `applyAlgorithm`, `invertAlgorithm` from `src/cube.ts`; `LearningStageId` from `src/learningPath.ts`.
- Produces:
  - `export type ChallengeGoalId = 'sequence' | 'any-face-corners-uniform' | 'first-layer-2x2' | 'cube-solved-2x2' | 'white-cross' | 'first-layer-3x3' | 'first-two-layers' | 'yellow-cross' | 'cube-solved'`
  - `export type Challenge = { goal: ChallengeGoalId; goalText: string; conceptHint: string; setup: Turn[]; targetMoves?: Turn[] }` (`targetMoves` only for `goal: 'sequence'`; demo for state goals = `invertAlgorithm(setup)`)
  - `export const CHALLENGES: Record<LearningStageId, Challenge>`
  - `export function isGoalMet(goalId: Exclude<ChallengeGoalId, 'sequence'>, state: CubeState): boolean`
  - `export function demoAlgorithm(challenge: Challenge): Turn[]` (returns `invertAlgorithm(setup)`; empty for sequence goals)

- [ ] **Step 1: Write the failing tests**

```ts
// src/challenges.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/challenges.test.ts`
Expected: FAIL — module `./challenges` not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/challenges.ts
import {
  createSolvedCube,
  invertAlgorithm,
  type CubeState,
  type FaceName,
  type Sticker,
  type Turn,
} from './cube';
import type { LearningStageId } from './learningPath';

export type ChallengeGoalId =
  | 'sequence'
  | 'any-face-corners-uniform'
  | 'first-layer-2x2'
  | 'cube-solved-2x2'
  | 'white-cross'
  | 'first-layer-3x3'
  | 'first-two-layers'
  | 'yellow-cross'
  | 'cube-solved';

export type Challenge = {
  goal: ChallengeGoalId;
  goalText: string;
  conceptHint: string;
  setup: Turn[];
  targetMoves?: Turn[];
};

type Axis = 'x' | 'y' | 'z';
type Direction = { axis: Axis; sign: -1 | 1 };

const DIRECTIONS: Direction[] = [
  { axis: 'x', sign: 1 }, { axis: 'x', sign: -1 },
  { axis: 'y', sign: 1 }, { axis: 'y', sign: -1 },
  { axis: 'z', sign: 1 }, { axis: 'z', sign: -1 },
];

function normalOf(sticker: Sticker): Direction {
  if (sticker.nx !== 0) return { axis: 'x', sign: sticker.nx };
  if (sticker.ny !== 0) return { axis: 'y', sign: sticker.ny };
  return { axis: 'z', sign: sticker.nz as -1 | 1 };
}

function sameDirection(sticker: Sticker, d: Direction): boolean {
  const n = normalOf(sticker);
  return n.axis === d.axis && n.sign === d.sign;
}

function coord(sticker: Sticker, axis: Axis): number {
  return axis === 'x' ? sticker.x : axis === 'y' ? sticker.y : sticker.z;
}

function isCornerCubie(sticker: Sticker): boolean {
  return Math.abs(sticker.x) + Math.abs(sticker.y) + Math.abs(sticker.z) === 3;
}

function isEdgeCubie(sticker: Sticker): boolean {
  return Math.abs(sticker.x) + Math.abs(sticker.y) + Math.abs(sticker.z) === 2;
}

/** Stickers lying on face `d` (normal points along d). */
function faceStickers(state: CubeState, d: Direction): Sticker[] {
  return state.filter((s) => sameDirection(s, d));
}

/** The current colour of the centre sticker of face `d` (centres exist on 3x3). */
function centerColor(state: CubeState, d: Direction): FaceName {
  const center = state.find(
    (s) => sameDirection(s, d) && Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.z) === 1,
  );
  if (!center) throw new Error('cube state is missing a centre sticker');
  return center.color;
}

function cornersUniform(state: CubeState, d: Direction): boolean {
  const corners = faceStickers(state, d).filter(isCornerCubie);
  return corners.length === 4 && corners.every((s) => s.color === corners[0].color);
}

/** Corners uniform on face d AND each adjacent side's two corner stickers match each other. */
function layerSolved2x2(state: CubeState, d: Direction): boolean {
  if (!cornersUniform(state, d)) return false;
  const layerCorners = state.filter(
    (s) => isCornerCubie(s) && coord(s, d.axis) === d.sign && !sameDirection(s, d),
  );
  const bySide = new Map<string, FaceName[]>();
  for (const s of layerCorners) {
    const n = normalOf(s);
    const key = `${n.axis}${n.sign}`;
    bySide.set(key, [...(bySide.get(key) ?? []), s.color]);
  }
  return [...bySide.values()].every((colors) => colors.every((c) => c === colors[0]));
}

/** Every sticker on cubies passing `filter` matches the current centre colour of its face. */
function matchesCenters(state: CubeState, filter: (s: Sticker) => boolean): boolean {
  return state
    .filter(filter)
    .every((s) => s.color === centerColor(state, normalOf(s)));
}

const UP: Direction = { axis: 'y', sign: 1 };
const DOWN: Direction = { axis: 'y', sign: -1 };

function whiteCross(state: CubeState): boolean {
  const crossColor = centerColor(state, UP);
  const upEdges = faceStickers(state, UP).filter(isEdgeCubie);
  if (upEdges.length !== 4 || !upEdges.some(() => true)) return false;
  if (!upEdges.every((s) => s.color === crossColor)) return false;
  // side sticker of each up-layer edge cubie must match its side centre
  return matchesCenters(state, (s) => isEdgeCubie(s) && s.y === 1 && normalOf(s).axis !== 'y');
}

function firstLayer3x3(state: CubeState): boolean {
  return matchesCenters(state, (s) => s.y === 1);
}

function firstTwoLayers(state: CubeState): boolean {
  return matchesCenters(state, (s) => s.y >= 0);
}

function yellowCross(state: CubeState): boolean {
  if (!firstTwoLayers(state)) return false;
  const downColor = centerColor(state, DOWN);
  return faceStickers(state, DOWN)
    .filter(isEdgeCubie)
    .every((s) => s.color === downColor);
}

const GOALS: Record<Exclude<ChallengeGoalId, 'sequence'>, (state: CubeState) => boolean> = {
  'any-face-corners-uniform': (state) => DIRECTIONS.some((d) => cornersUniform(state, d)),
  'first-layer-2x2': (state) => DIRECTIONS.some((d) => layerSolved2x2(state, d)),
  'cube-solved-2x2': (state) => DIRECTIONS.every((d) => cornersUniform(state, d)),
  'white-cross': whiteCross,
  'first-layer-3x3': firstLayer3x3,
  'first-two-layers': firstTwoLayers,
  'yellow-cross': yellowCross,
  'cube-solved': (state) => matchesCenters(state, () => true),
};

export function isGoalMet(goalId: Exclude<ChallengeGoalId, 'sequence'>, state: CubeState): boolean {
  return GOALS[goalId](state);
}

export function demoAlgorithm(challenge: Challenge): Turn[] {
  return challenge.goal === 'sequence' ? [] : invertAlgorithm(challenge.setup);
}

export const CHALLENGES: Record<LearningStageId, Challenge> = {
  '2x2-orientation': {
    goal: 'sequence',
    goalText: 'Do these turns in order: U, R, F — then undo them: F′, R′, U′.',
    conceptHint: 'Each letter names a face seen from the front: U is the top layer, R the right, F the front. A plain letter turns it clockwise; a ′ mark turns it back.',
    setup: [],
    targetMoves: ['U', 'R', 'F', "F'", "R'", "U'"],
  },
  '2x2-first-face': {
    goal: 'any-face-corners-uniform',
    goalText: 'Get all four stickers of one colour together on a single face.',
    conceptHint: 'Pick one colour and hunt its four corners. Insert them one at a time — R U R′ drops a corner in without scattering the rest.',
    setup: ['R', 'U', "R'", 'U', 'R', 'U2', "R'", 'U2'],
  },
  '2x2-corner-insertion': {
    goal: 'first-layer-2x2',
    goalText: 'Solve one full layer: a uniform face whose side colours also line up.',
    conceptHint: 'A face can look done while its sides are shuffled. Check the side stickers of each corner — matching neighbours mean the layer is truly solved.',
    setup: ['R', "U'", 'R', 'U2', "R'", 'U', 'R', "U'", "R'"],
  },
  '2x2-last-layer-orient': {
    goal: 'cube-solved-2x2',
    goalText: 'Restore the whole cube. The bottom layer is intact — twist the top corners until every face is one colour.',
    conceptHint: 'Count the top-colour stickers facing up. Hold an oriented corner at front-right and repeat R U R′ U R U2 R′ — the bottom fixes itself.',
    setup: ['R', 'U2', "R'", "U'", 'R', "U'", "R'"],
  },
  '2x2-last-corner-permute': {
    goal: 'cube-solved-2x2',
    goalText: 'Restore the whole cube. The corners are oriented but two of them have swapped places.',
    conceptHint: 'Find two side stickers that already match and hold them at the back. R U′ L′ U R′ U′ L U swaps the two front corners.',
    setup: ["U'", "L'", 'U', 'R', "U'", 'L', 'U', "R'"],
  },
  '3x3-white-cross': {
    goal: 'white-cross',
    goalText: 'Build the white cross: four white edges up, each side colour matching its centre.',
    conceptHint: 'Solve edges one at a time. Line the edge’s side colour up with its centre first, then bring the white sticker up.',
    setup: ['F2', "R'", 'D', "L'", 'B', 'U2'],
  },
  '3x3-first-layer-corners': {
    goal: 'first-layer-3x3',
    goalText: 'Complete the first layer: white face solved and the top row of every side matching its centre.',
    conceptHint: 'Position a white corner under its slot, then use R U R′-style triggers. Only the trigger touches the cross — it comes back every time.',
    setup: ['R', 'U', "R'", 'U', 'L', "U'", "L'", "U'"],
  },
  '3x3-middle-layer-edges': {
    goal: 'first-two-layers',
    goalText: 'Finish the first two layers by inserting the middle-layer edges.',
    conceptHint: 'Find a top edge with no yellow on it. Match its front colour to a centre, then send it left or right with the insertion trigger.',
    setup: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F', 'U2'],
  },
  '3x3-yellow-cross': {
    goal: 'yellow-cross',
    goalText: 'Form the yellow cross without disturbing the two solved layers.',
    conceptHint: 'Look at the yellow face: dot, L, or line. Hold the L at back-left (line horizontal) and repeat F R U R′ U′ F′ to advance one shape at a time.',
    setup: ['F', 'R', 'U', "R'", "U'", "F'", 'U2'],
  },
  '3x3-last-layer-finish': {
    goal: 'cube-solved',
    goalText: 'Solve the whole cube: align the cross edges, place the corners, then twist them home.',
    conceptHint: 'Work in three passes — edges to their centres, corners to their slots, then R′ D′ R D on each corner until it sits flush. Keep your grip; only turn U between corners.',
    setup: ['R', "U'", 'R', 'U', 'R', 'U', 'R', "U'", "R'", "U'", 'R2', 'U'],
  },
};
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/challenges.test.ts`
Expected: PASS. If a specific stage fails the "FALSE after setup" invariant (a hand-rolled setup accidentally satisfies its goal), deepen that stage's `setup` by appending one or two more turns and re-run — the invariant test is the arbiter; note any adjustment in your report.

- [ ] **Step 5: Full suite, lint, commit**

Run: `npm test && npm run lint`

```bash
git add src/challenges.ts src/challenges.test.ts
git commit -m "feat: challenge goal predicates and per-stage challenge data"
```

---

### Task 3: Mastery calculation and next-stage selector

**Files:**
- Create: `src/progress/mastery.ts`
- Test: `src/progress/mastery.test.ts`
- Modify: `src/progress/unlocks.ts` (add `getNextStageId`)
- Modify: `src/progress/unlocks.test.ts` (add cases)

**Interfaces:**
- Consumes: `Mastery` from `./types`; `LEARNING_STAGES` ordering from `../learningPath`.
- Produces:
  - `export function calculateMastery(maxHintLevel: 0 | 1 | 2 | 3, selfCheckFirstTry: boolean): Mastery`
  - In `unlocks.ts`: `export function getNextStageId(stageId: LearningStageId): LearningStageId | undefined` (next by level order; undefined for the last stage)

- [ ] **Step 1: Write the failing tests**

```ts
// src/progress/mastery.test.ts
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
```

Add to `src/progress/unlocks.test.ts` (inside the `selectors` describe):

```ts
  it('getNextStageId walks level order and returns undefined at the end', () => {
    expect(getNextStageId('2x2-orientation')).toBe('2x2-first-face');
    expect(getNextStageId('2x2-last-corner-permute')).toBe('3x3-white-cross');
    expect(getNextStageId('3x3-last-layer-finish')).toBeUndefined();
  });
```

(import `getNextStageId` alongside the existing imports.)

- [ ] **Step 2: Run to verify failures**

Run: `npx vitest run src/progress/mastery.test.ts src/progress/unlocks.test.ts`
Expected: FAIL (missing module / missing export).

- [ ] **Step 3: Implement**

```ts
// src/progress/mastery.ts
import type { Mastery } from './types';

export function calculateMastery(maxHintLevel: 0 | 1 | 2 | 3, selfCheckFirstTry: boolean): Mastery {
  if (maxHintLevel >= 3) return 1;
  if (maxHintLevel === 2 || !selfCheckFirstTry) return 2;
  return 3;
}
```

Add to `src/progress/unlocks.ts`:

```ts
export function getNextStageId(stageId: LearningStageId): LearningStageId | undefined {
  const index = ORDERED_STAGES.findIndex((stage) => stage.id === stageId);
  return index === -1 ? undefined : ORDERED_STAGES[index + 1]?.id;
}
```

- [ ] **Step 4: Run tests, full suite, lint, commit**

Run: `npx vitest run src/progress && npm test && npm run lint`

```bash
git add src/progress/mastery.ts src/progress/mastery.test.ts src/progress/unlocks.ts src/progress/unlocks.test.ts
git commit -m "feat: mastery calculation and next-stage selector"
```

---

### Task 4: ChallengePanel — embedded cube with live goal detection

**Files:**
- Create: `src/components/learn/ChallengePanel.tsx`
- Test: `src/components/learn/ChallengePanel.test.tsx`

**Interfaces:**
- Consumes: `CubeView`, `BandControls`, `BAND_SELECTIONS`, `getTurnForBand` (Task 1); `CHALLENGES`, `isGoalMet`, `demoAlgorithm` (Task 2); `applyAlgorithm`, `applyTurn`, `createSolvedCube`, `toFaceGrid`, `formatAlgorithm` from `../../cube`; stage from `../../learningPath`.
- Produces: `export function ChallengePanel({ stage, hintLevel, onGoalMet }: { stage: LearningStage; hintLevel: 0 | 1 | 2 | 3; onGoalMet: () => void })`
  - Renders the interactive cube preset with `CHALLENGES[stage.id].setup`, the goal text, a status line, a "Reset challenge" button, and (sequence goals) a progress counter `n / total`.
  - Calls `onGoalMet()` exactly once per completion (re-armed by reset).
  - At `hintLevel === 3` shows demo controls: "Reset & watch" then "Next move" stepping through `demoAlgorithm` (state goals) or `targetMoves` (sequence). A manual move during demo hides "Next move" until reset. Container gets class `challenge-panel goal-met` when complete (solve-flash hook).

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/learn/ChallengePanel.test.tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getStageById } from '../../learningPath';
import { ChallengePanel } from './ChallengePanel';
import type { Turn } from '../../cube';

/** Click the band + arrow that performs `turn` (outer turns only). */
function performTurn(turn: Turn) {
  const bar = within(screen.getByTestId('band-reference-bar'));
  const bandLabel: Record<string, RegExp> = {
    U: /top row/i, D: /bottom row/i, L: /left column/i,
    R: /right column/i, F: /front layer/i, B: /back layer/i,
  };
  fireEvent.click(bar.getByRole('button', { name: bandLabel[turn[0]] }));
  const arrow = turn.endsWith("'")
    ? /counter-clockwise/i
    : turn.endsWith('2')
      ? /180 degrees/i
      : /turn selected layer clockwise$/i;
  fireEvent.click(bar.getByRole('button', { name: arrow }));
}

const sequenceStage = getStageById('2x2-orientation')!;

describe('ChallengePanel — sequence goal', () => {
  it('tracks progress through the target moves and fires onGoalMet once', () => {
    const onGoalMet = vi.fn();
    render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={onGoalMet} />);
    expect(screen.getByText('0 / 6')).toBeInTheDocument();
    for (const turn of ['U', 'R', 'F', "F'", "R'", "U'"] as Turn[]) performTurn(turn);
    expect(onGoalMet).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/challenge complete/i)).toBeInTheDocument();
  });

  it('a wrong move resets sequence progress', () => {
    const onGoalMet = vi.fn();
    render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={onGoalMet} />);
    performTurn('U');
    expect(screen.getByText('1 / 6')).toBeInTheDocument();
    performTurn('D');
    expect(screen.getByText('0 / 6')).toBeInTheDocument();
    expect(onGoalMet).not.toHaveBeenCalled();
  });

  it('reset clears progress and re-arms onGoalMet', () => {
    const onGoalMet = vi.fn();
    render(<ChallengePanel stage={sequenceStage} hintLevel={0} onGoalMet={onGoalMet} />);
    for (const turn of ['U', 'R', 'F', "F'", "R'", "U'"] as Turn[]) performTurn(turn);
    fireEvent.click(screen.getByRole('button', { name: /reset challenge/i }));
    expect(screen.getByText('0 / 6')).toBeInTheDocument();
    for (const turn of ['U', 'R', 'F', "F'", "R'", "U'"] as Turn[]) performTurn(turn);
    expect(onGoalMet).toHaveBeenCalledTimes(2);
  });
});

describe('ChallengePanel — state goal with demo', () => {
  const stateStage = getStageById('2x2-last-layer-orient')!;

  it('starts unsolved and completes after stepping through the whole demo at hint level 3', () => {
    const onGoalMet = vi.fn();
    render(<ChallengePanel stage={stateStage} hintLevel={3} onGoalMet={onGoalMet} />);
    expect(screen.queryByText(/challenge complete/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /reset & watch/i }));
    const next = () => screen.getByRole('button', { name: /next move/i });
    for (let i = 0; i < 7; i += 1) fireEvent.click(next()); // demo = inverse of the 7-move setup
    expect(onGoalMet).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/challenge complete/i)).toBeInTheDocument();
  });

  it('hides demo stepping after a manual move until reset', () => {
    render(<ChallengePanel stage={stateStage} hintLevel={3} onGoalMet={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /reset & watch/i }));
    performTurn('U');
    expect(screen.queryByRole('button', { name: /next move/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/learn/ChallengePanel.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// src/components/learn/ChallengePanel.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  applyAlgorithm,
  applyTurn,
  createSolvedCube,
  formatAlgorithm,
  toFaceGrid,
  type Turn,
} from '../../cube';
import { CHALLENGES, demoAlgorithm, isGoalMet } from '../../challenges';
import type { LearningStage } from '../../learningPath';
import { BAND_SELECTIONS, type BandSelection } from '../cube/bands';
import { BandControls } from '../cube/BandControls';
import { CubeView } from '../cube/CubeView';

type Props = {
  stage: LearningStage;
  hintLevel: 0 | 1 | 2 | 3;
  onGoalMet: () => void;
};

export function ChallengePanel({ stage, hintLevel, onGoalMet }: Props) {
  const challenge = CHALLENGES[stage.id];
  const isSequence = challenge.goal === 'sequence';
  const target = challenge.targetMoves ?? [];
  const demo = useMemo(
    () => (isSequence ? target : demoAlgorithm(challenge)),
    [challenge, isSequence, target],
  );

  const [cube, setCube] = useState(() => applyAlgorithm(createSolvedCube(), challenge.setup));
  const [matched, setMatched] = useState(0);
  const [selectedBand, setSelectedBand] = useState<BandSelection>(BAND_SELECTIONS[0]);
  const [demoCursor, setDemoCursor] = useState<number | null>(null);
  const firedRef = useRef(false);

  const stateGoalMet = !isSequence && isGoalMet(challenge.goal as Exclude<typeof challenge.goal, 'sequence'>, cube);
  const goalMet = isSequence ? matched === target.length && target.length > 0 : stateGoalMet;

  useEffect(() => {
    if (goalMet && !firedRef.current) {
      firedRef.current = true;
      onGoalMet();
    }
  }, [goalMet, onGoalMet]);

  function applyMove(turn: Turn, viaDemo = false) {
    setCube((current) => applyTurn(current, turn));
    if (isSequence) {
      setMatched((count) => {
        if (turn === target[count]) return count + 1;
        return turn === target[0] ? 1 : 0;
      });
    }
    if (!viaDemo) setDemoCursor(null);
  }

  function reset() {
    setCube(applyAlgorithm(createSolvedCube(), challenge.setup));
    setMatched(0);
    setDemoCursor(null);
    firedRef.current = false;
  }

  function startDemo() {
    reset();
    setDemoCursor(0);
  }

  function stepDemo() {
    if (demoCursor === null || demoCursor >= demo.length) return;
    applyMove(demo[demoCursor], true);
    setDemoCursor(demoCursor + 1);
  }

  const grid = useMemo(() => toFaceGrid(cube), [cube]);

  return (
    <section className={`challenge-panel ${goalMet ? 'goal-met' : ''}`} data-testid="challenge-panel">
      <header className="challenge-header">
        <p className="eyebrow">Try it first</p>
        <p className="challenge-goal-text">{challenge.goalText}</p>
      </header>

      <div className="challenge-cube">
        <CubeView
          grid={grid}
          tilt={{ x: -28, y: -38 }}
          cubeSize={stage.cubeSize}
          selectedBand={selectedBand}
          onSelectBand={setSelectedBand}
          onTurn={(turn) => applyMove(turn)}
        />
        <BandControls
          cubeSize={stage.cubeSize}
          selectedBand={selectedBand}
          onSelectBand={setSelectedBand}
          onTurn={(turn) => applyMove(turn)}
        />
      </div>

      <div className="challenge-status" role="status">
        {goalMet ? (
          <strong>Challenge complete — now lock it in below.</strong>
        ) : isSequence ? (
          <span>{matched} / {target.length}</span>
        ) : (
          <span>Keep going — the goal check updates after every move.</span>
        )}
      </div>

      <div className="challenge-actions">
        <button onClick={reset}>Reset challenge</button>
        {hintLevel >= 3 && (
          <>
            <button onClick={startDemo}>Reset &amp; watch</button>
            {demoCursor !== null && demoCursor < demo.length && (
              <button className="primary" onClick={stepDemo}>
                Next move ({formatAlgorithm([demo[demoCursor]])})
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests, full suite, lint, commit**

Run: `npx vitest run src/components/learn && npm test && npm run lint`

```bash
git add src/components/learn/ChallengePanel.tsx src/components/learn/ChallengePanel.test.tsx
git commit -m "feat: challenge panel with embedded cube, sequence tracking, and demo stepping"
```

---

### Task 5: Hint ladder, lesson guide, mastery badge

**Files:**
- Create: `src/components/learn/HintLadder.tsx`
- Create: `src/components/learn/LessonGuide.tsx`
- Create: `src/components/learn/MasteryBadge.tsx`
- Test: `src/components/learn/HintLadder.test.tsx`
- Modify: `src/components/LessonWorkspace.tsx` — no longer used after Task 7; do NOT modify it here (deleted in Task 7).

**Interfaces:**
- Consumes: `LearningStage`; `CHALLENGES` (concept hint); `getDiagramForStage` from `../../lessonDiagrams`; `BeforeAfterDiagram` from `../CubeDiagram`.
- Produces:
  - `export function HintLadder({ stage, hintLevel, onReveal }: { stage: LearningStage; hintLevel: 0|1|2|3; onReveal: (level: 1|2|3) => void })` — renders "Stuck? Get a nudge" (→1), then "Show me the steps" (→2), then "Watch the moves" (→3); reveals content for every level ≤ current.
  - `export function LessonGuide({ stage }: { stage: LearningStage })` — diagram + numbered steps + common mistake (the old LessonWorkspace middle, presentational only, keeps `data-testid="lesson-diagram"` via CubeDiagram).
  - `export function MasteryBadge({ mastery }: { mastery: 1|2|3 })` — renders `mastery` filled sticker squares of 3, `aria-label="Mastery x of 3"`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/learn/HintLadder.test.tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getStageById } from '../../learningPath';
import { HintLadder } from './HintLadder';

const stage = getStageById('2x2-first-face')!;

describe('HintLadder', () => {
  it('reveals levels progressively and reports each reveal', () => {
    const onReveal = vi.fn();
    const { rerender } = render(<HintLadder stage={stage} hintLevel={0} onReveal={onReveal} />);
    expect(screen.queryByText(/hunt its four corners/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /stuck\? get a nudge/i }));
    expect(onReveal).toHaveBeenCalledWith(1);

    rerender(<HintLadder stage={stage} hintLevel={1} onReveal={onReveal} />);
    expect(screen.getByText(/hunt its four corners/i)).toBeInTheDocument();
    expect(screen.queryByText(/common mistake/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show me the steps/i }));
    expect(onReveal).toHaveBeenCalledWith(2);

    rerender(<HintLadder stage={stage} hintLevel={2} onReveal={onReveal} />);
    expect(screen.getByText(/common mistake/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /watch the moves/i })).toBeInTheDocument();
  });

  it('never punishes: all reveal buttons stay enabled and hints stay visible', () => {
    render(<HintLadder stage={stage} hintLevel={3} onReveal={() => {}} />);
    expect(screen.getByText(/hunt its four corners/i)).toBeInTheDocument();
    expect(screen.getByText(/common mistake/i)).toBeInTheDocument();
    expect(screen.getByText(/watch the moves on the cube above/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**, then **Step 3: Implement**

```tsx
// src/components/learn/MasteryBadge.tsx
export function MasteryBadge({ mastery }: { mastery: 1 | 2 | 3 }) {
  return (
    <span className="mastery-badge" aria-label={`Mastery ${mastery} of 3`}>
      {[1, 2, 3].map((cubie) => (
        <span key={cubie} className={`mastery-cubie ${cubie <= mastery ? 'earned' : ''}`} />
      ))}
    </span>
  );
}
```

```tsx
// src/components/learn/LessonGuide.tsx
import type { LearningStage } from '../../learningPath';
import { getDiagramForStage } from '../../lessonDiagrams';
import { BeforeAfterDiagram } from '../CubeDiagram';

export function LessonGuide({ stage }: { stage: LearningStage }) {
  const diagram = getDiagramForStage(stage.id);
  return (
    <div className="lesson-guide">
      {diagram && <BeforeAfterDiagram before={diagram.before} after={diagram.after} />}
      <h3>Steps</h3>
      <ol>
        {stage.steps.map((step, i) => (
          <li key={i}>
            {step.instruction}
            {step.tip && <em className="step-tip"> — {step.tip}</em>}
          </li>
        ))}
      </ol>
      <aside className="lesson-mistake">
        <h3>Common mistake</h3>
        <p>{stage.commonMistake}</p>
      </aside>
    </div>
  );
}
```

```tsx
// src/components/learn/HintLadder.tsx
import { CHALLENGES } from '../../challenges';
import type { LearningStage } from '../../learningPath';
import { LessonGuide } from './LessonGuide';

type Props = {
  stage: LearningStage;
  hintLevel: 0 | 1 | 2 | 3;
  onReveal: (level: 1 | 2 | 3) => void;
};

export function HintLadder({ stage, hintLevel, onReveal }: Props) {
  const challenge = CHALLENGES[stage.id];
  return (
    <section className="hint-ladder" data-testid="hint-ladder">
      {hintLevel < 1 && (
        <button onClick={() => onReveal(1)}>Stuck? Get a nudge</button>
      )}
      {hintLevel >= 1 && (
        <div className="hint hint-nudge">
          <p>{challenge.conceptHint}</p>
          {hintLevel < 2 && <button onClick={() => onReveal(2)}>Show me the steps</button>}
        </div>
      )}
      {hintLevel >= 2 && (
        <div className="hint hint-steps">
          <LessonGuide stage={stage} />
          {hintLevel < 3 && <button onClick={() => onReveal(3)}>Watch the moves</button>}
        </div>
      )}
      {hintLevel >= 3 && (
        <p className="hint hint-demo">Watch the moves on the cube above — use “Reset &amp; watch”, then step through with “Next move”.</p>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run tests, full suite, lint, commit**

Run: `npx vitest run src/components/learn && npm test && npm run lint`

```bash
git add src/components/learn/HintLadder.tsx src/components/learn/LessonGuide.tsx src/components/learn/MasteryBadge.tsx src/components/learn/HintLadder.test.tsx
git commit -m "feat: hint ladder, lesson guide, and mastery badge components"
```

---

### Task 6: LessonView orchestration and self-check gate

**Files:**
- Create: `src/components/learn/LessonView.tsx`
- Create: `src/components/learn/CompletionCelebration.tsx`
- Modify: `src/components/SelfCheckCard.tsx` (add optional `onResult` + `allowRetry` props)
- Test: `src/components/learn/LessonView.test.tsx`

**Interfaces:**
- Consumes: `ChallengePanel` (Task 4), `HintLadder`/`MasteryBadge` (Task 5), `SelfCheckCard`, `getSelfCheckById`/`checkAnswer` from `../../selfChecks`, `getVideosForStage` + `VideoReferenceCard`, `useProgressStore`/`useProgress`, `calculateMastery` (Task 3), `getNextStageId` (Task 3).
- Produces:
  - `export function LessonView({ stage, onPractice }: { stage: LearningStage; onPractice: (stageId: string) => void })` — full lesson: header (eyebrow `Lesson {level} · {group label}`, title, skill/outcome lines), `ChallengePanel`, `HintLadder`, self-check gate ("Check your understanding"), completion (celebration + `MasteryBadge` + "Next lesson" link + "Practise this skill" button), videos.
  - Completion records `completeLesson(stage.id, calculateMastery(maxHintLevel, firstTry), maxHintLevel)` exactly once per visit when challenge done AND all self-checks passed; self-check answers record via `recordSelfCheck`.
  - Already-completed lessons show a "Completed" banner with their stored `MasteryBadge` and can be redone.
  - `SelfCheckCard` changes: `onResult?: (correct: boolean) => void` called on each answer; `allowRetry?: boolean` shows a "Try again" button after an incorrect answer that resets the card. Existing props/behavior unchanged when the new props are absent.
  - `CompletionCelebration`: renders 20 sticker-square spans with per-index colour/delay classes inside `.celebration` (CSS animates; static under reduced motion). Purely decorative, `aria-hidden`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/learn/LessonView.test.tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProgressProvider, useProgress } from '../../progress/ProgressContext';
import { getStageById } from '../../learningPath';
import { getSelfCheckById } from '../../selfChecks';
import { LessonView } from './LessonView';
import type { Turn } from '../../cube';

const stage = getStageById('2x2-orientation')!;

function performTurn(turn: Turn) {
  const bar = within(screen.getByTestId('band-reference-bar'));
  const bandLabel: Record<string, RegExp> = {
    U: /top row/i, R: /right column/i, F: /front layer/i,
  };
  fireEvent.click(bar.getByRole('button', { name: bandLabel[turn[0]] }));
  fireEvent.click(bar.getByRole('button', {
    name: turn.endsWith("'") ? /counter-clockwise/i : /turn selected layer clockwise$/i,
  }));
}

function Chip() {
  const snapshot = useProgress();
  return <output data-testid="lesson-count">{Object.keys(snapshot.lessons).length}</output>;
}

function renderLesson() {
  return render(
    <ProgressProvider>
      <MemoryRouter>
        <LessonView stage={stage} onPractice={() => {}} />
        <Chip />
      </MemoryRouter>
    </ProgressProvider>,
  );
}

function completeChallenge() {
  for (const turn of ['U', 'R', 'F', "F'", "R'", "U'"] as Turn[]) performTurn(turn);
}

function answerSelfCheckCorrectly() {
  const check = getSelfCheckById(stage.selfCheckIds[0])!;
  const correct = check.options.find((o) => check.answerIds.includes(o.id))!;
  const card = within(screen.getByTestId('self-check-card'));
  fireEvent.click(card.getByRole('button', { name: correct.label }));
}

describe('LessonView completion flow', () => {
  it('records completion with mastery 3 after hint-free challenge + first-try self-check', () => {
    renderLesson();
    expect(screen.getByTestId('lesson-count')).toHaveTextContent('0');
    completeChallenge();
    answerSelfCheckCorrectly();
    expect(screen.getByTestId('lesson-count')).toHaveTextContent('1');
    expect(screen.getByLabelText('Mastery 3 of 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /next lesson/i })).toHaveAttribute(
      'href', '/learn/2x2-first-face',
    );
  });

  it('self-check alone does not complete the lesson (challenge gate)', () => {
    renderLesson();
    answerSelfCheckCorrectly();
    expect(screen.getByTestId('lesson-count')).toHaveTextContent('0');
  });

  it('using the nudge caps nothing, but a self-check retry drops mastery to 2', () => {
    renderLesson();
    completeChallenge();
    const check = getSelfCheckById(stage.selfCheckIds[0])!;
    const wrong = check.options.find((o) => !check.answerIds.includes(o.id))!;
    const card = within(screen.getByTestId('self-check-card'));
    fireEvent.click(card.getByRole('button', { name: wrong.label }));
    fireEvent.click(card.getByRole('button', { name: /try again/i }));
    answerSelfCheckCorrectly();
    expect(screen.getByLabelText('Mastery 2 of 3')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**, then **Step 3: Implement**

`SelfCheckCard.tsx` — add props, call `onResult(isCorrect)` inside `handleSelect` after `setAnswered(true)`, and when `allowRetry && answered && !isCorrect` render `<button onClick={() => { setSelected(null); setAnswered(false); }}>Try again</button>` inside the feedback block. Nothing else changes.

```tsx
// src/components/learn/CompletionCelebration.tsx
const CELEBRATION_COLORS = ['green', 'red', 'blue', 'orange', 'yellow', 'white'] as const;

export function CompletionCelebration() {
  return (
    <div className="celebration" aria-hidden="true">
      {Array.from({ length: 20 }, (_, i) => (
        <span
          key={i}
          className={`celebration-sticker sticker-${CELEBRATION_COLORS[i % 6]} fall-${i % 5}`}
        />
      ))}
    </div>
  );
}
```

```tsx
// src/components/learn/LessonView.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LearningStage } from '../../learningPath';
import { getSelfCheckById } from '../../selfChecks';
import { getVideosForStage } from '../../videos';
import { calculateMastery } from '../../progress/mastery';
import { useProgress, useProgressStore } from '../../progress/ProgressContext';
import { getNextStageId } from '../../progress/unlocks';
import { SelfCheckCard } from '../SelfCheckCard';
import { VideoReferenceCard } from '../VideoReferenceCard';
import { ChallengePanel } from './ChallengePanel';
import { CompletionCelebration } from './CompletionCelebration';
import { HintLadder } from './HintLadder';
import { MasteryBadge } from './MasteryBadge';

const GROUP_LABELS = { '2x2-foundation': '2×2 Foundation', '3x3-beginner': '3×3 Beginner' } as const;

export function LessonView({ stage, onPractice }: { stage: LearningStage; onPractice: (stageId: string) => void }) {
  const store = useProgressStore();
  const snapshot = useProgress();
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [challengeDone, setChallengeDone] = useState(false);
  const [passedChecks, setPassedChecks] = useState<Set<string>>(new Set());
  const [missedAny, setMissedAny] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const selfChecks = stage.selfCheckIds.map(getSelfCheckById).filter(Boolean);
  const videos = getVideosForStage(stage.id);
  const existing = snapshot.lessons[stage.id];
  const nextStageId = getNextStageId(stage.id);

  function handleCheckResult(checkId: string, correct: boolean) {
    store.recordSelfCheck(stage.id, checkId, correct);
    if (!correct) {
      setMissedAny(true);
      return;
    }
    const passed = new Set(passedChecks).add(checkId);
    setPassedChecks(passed);
    if (challengeDone && passed.size === selfChecks.length && !recorded) {
      setRecorded(true);
      store.completeLesson(stage.id, calculateMastery(hintLevel, !missedAny), hintLevel);
    }
  }

  function handleGoalMet() {
    setChallengeDone(true);
    if (passedChecks.size === selfChecks.length && selfChecks.length > 0 && !recorded) {
      setRecorded(true);
      store.completeLesson(stage.id, calculateMastery(hintLevel, !missedAny), hintLevel);
    }
  }

  const justCompleted = recorded;
  const mastery = snapshot.lessons[stage.id]?.mastery;

  return (
    <article className="lesson-view">
      <header className="lesson-header">
        <p className="eyebrow">Lesson {stage.level} · {GROUP_LABELS[stage.group]}</p>
        <h1>{stage.title}</h1>
        <p className="lesson-skill">{stage.skill}</p>
        {existing && !justCompleted && (
          <p className="lesson-completed-banner">
            Completed <MasteryBadge mastery={existing.mastery} /> — redo it to raise your mastery.
          </p>
        )}
      </header>

      <ChallengePanel key={stage.id} stage={stage} hintLevel={hintLevel} onGoalMet={handleGoalMet} />
      <HintLadder stage={stage} hintLevel={hintLevel} onReveal={setHintLevel} />

      <section className="lesson-self-checks">
        <h2>Check your understanding</h2>
        {selfChecks.map((check) => (
          <SelfCheckCard
            key={check!.id}
            selfCheck={check!}
            allowRetry
            onResult={(correct) => handleCheckResult(check!.id, correct)}
          />
        ))}
      </section>

      {justCompleted && mastery && (
        <section className="lesson-complete" role="status">
          <CompletionCelebration />
          <h2>Lesson complete</h2>
          <MasteryBadge mastery={mastery} />
          <div className="lesson-complete-actions">
            {nextStageId && (
              <Link className="button-link primary" to={`/learn/${nextStageId}`}>Next lesson</Link>
            )}
            <button onClick={() => onPractice(stage.id)}>Practise this skill</button>
          </div>
        </section>
      )}

      {!justCompleted && (
        <div className="lesson-practice-cta">
          <button onClick={() => onPractice(stage.id)}>Practise this skill</button>
        </div>
      )}

      {videos.length > 0 && (
        <section className="lesson-videos">
          <h2>Video references</h2>
          <div className="video-cards">
            {videos.map((video) => <VideoReferenceCard key={video.id} video={video} />)}
          </div>
        </section>
      )}
    </article>
  );
}
```

Note on the mastery/first-try edge: `missedAny` covers all self-checks for the stage; `hintLevel` is the max reached because `onReveal` only moves upward.

- [ ] **Step 4: Run tests, full suite, lint, commit**

Run: `npx vitest run src/components/learn && npm test && npm run lint`

```bash
git add src/components/learn/LessonView.tsx src/components/learn/CompletionCelebration.tsx src/components/SelfCheckCard.tsx src/components/learn/LessonView.test.tsx
git commit -m "feat: lesson view with challenge gate, self-check gate, and completion recording"
```

---

### Task 7: Sidebar, locked view with test-out, and the new LearnPage

**Files:**
- Create: `src/components/learn/LearnSidebar.tsx`
- Create: `src/components/learn/LockedLessonView.tsx`
- Modify: `src/components/LearnPage.tsx` (full rewrite below)
- Delete: `src/components/PathwayTimeline.tsx`, `src/components/LessonWorkspace.tsx`
- Test: `src/components/learn/LearnSidebar.test.tsx`, `src/components/learn/LockedLessonView.test.tsx`

**Interfaces:**
- Consumes: `useProgress`/`useProgressStore`; `isStageCompleted`, `isStageUnlocked`, `getGroupProgress` from unlocks; `MasteryBadge`; `SelfCheckCard` (with `onResult`); `LEARNING_STAGES`, `getStagesForGroup`; lucide `Lock`, `Check`, `PanelLeft`.
- Produces:
  - `LearnSidebar({ currentStageId })` — nav (`aria-label="Curriculum"`, `data-testid="learn-sidebar"`): two groups with `done/total`, each stage a `NavLink` to `/learn/{id}` with a sticker-chip (check when done, lock icon + `aria-disabled` styling cue when locked — still clickable), title, `MasteryBadge` when completed.
  - `LockedLessonView({ stage })` — explains the prerequisite (previous incomplete stage title or "the 2×2 Foundation" for a locked 3×3 group), button "Test out of this lesson" revealing all the stage's self-checks (no hints). All correct → `completeLesson(stage.id, 2, 0)`. Any wrong answer shows "Not yet — review the earlier lessons or try again." with a reset.
  - `LearnPage({ stageId, onSelectStage, onPractice })` — same props as today (route-controlled); renders sidebar + (locked ? LockedLessonView : LessonView); mobile drawer toggle button "Curriculum".

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/learn/LearnSidebar.test.tsx
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { InMemoryProgressStore } from '../../progress/inMemoryStore';
import { ProgressProvider } from '../../progress/ProgressContext';
import { LearnSidebar } from './LearnSidebar';

function renderSidebar(store = new InMemoryProgressStore()) {
  return render(
    <ProgressProvider store={store}>
      <MemoryRouter>
        <LearnSidebar currentStageId="2x2-orientation" />
      </MemoryRouter>
    </ProgressProvider>,
  );
}

describe('LearnSidebar', () => {
  it('shows both groups with progress counts', () => {
    renderSidebar();
    const sidebar = within(screen.getByTestId('learn-sidebar'));
    expect(sidebar.getByText('2×2 Foundation')).toBeInTheDocument();
    expect(sidebar.getByText('3×3 Beginner')).toBeInTheDocument();
    expect(sidebar.getAllByText('0/5')).toHaveLength(2);
  });

  it('marks done, current, and locked stages', () => {
    const store = new InMemoryProgressStore();
    store.completeLesson('2x2-orientation', 3, 0);
    renderSidebar(store);
    const sidebar = within(screen.getByTestId('learn-sidebar'));
    const done = sidebar.getByRole('link', { name: /orientation and notation/i });
    expect(done.className).toContain('done');
    expect(within(done).getByLabelText('Mastery 3 of 3')).toBeInTheDocument();
    expect(sidebar.getByRole('link', { name: /build one complete face/i }).className).toContain('unlocked');
    expect(sidebar.getByRole('link', { name: /white cross/i }).className).toContain('locked');
  });
});
```

```tsx
// src/components/learn/LockedLessonView.test.tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { InMemoryProgressStore } from '../../progress/inMemoryStore';
import { ProgressProvider } from '../../progress/ProgressContext';
import { getStageById } from '../../learningPath';
import { getSelfCheckById } from '../../selfChecks';
import { LockedLessonView } from './LockedLessonView';

const stage = getStageById('2x2-first-face')!;

function renderLocked(store = new InMemoryProgressStore()) {
  render(
    <ProgressProvider store={store}>
      <MemoryRouter>
        <LockedLessonView stage={stage} />
      </MemoryRouter>
    </ProgressProvider>,
  );
  return store;
}

describe('LockedLessonView', () => {
  it('names the prerequisite lesson', () => {
    renderLocked();
    expect(screen.getByText(/orientation and notation/i)).toBeInTheDocument();
  });

  it('test-out completes the stage at mastery 2 when all checks pass', () => {
    const store = renderLocked();
    fireEvent.click(screen.getByRole('button', { name: /test out of this lesson/i }));
    const check = getSelfCheckById(stage.selfCheckIds[0])!;
    const correct = check.options.find((o) => check.answerIds.includes(o.id))!;
    fireEvent.click(within(screen.getByTestId('self-check-card')).getByRole('button', { name: correct.label }));
    expect(store.getSnapshot().lessons[stage.id]).toMatchObject({ mastery: 2, hintsUsed: 0 });
  });

  it('a wrong answer shows the retry message and does not complete', () => {
    const store = renderLocked();
    fireEvent.click(screen.getByRole('button', { name: /test out of this lesson/i }));
    const check = getSelfCheckById(stage.selfCheckIds[0])!;
    const wrong = check.options.find((o) => !check.answerIds.includes(o.id))!;
    fireEvent.click(within(screen.getByTestId('self-check-card')).getByRole('button', { name: wrong.label }));
    expect(screen.getByText(/not yet — review the earlier lessons or try again/i)).toBeInTheDocument();
    expect(store.getSnapshot().lessons[stage.id]).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify failures**, then **Step 3: Implement**

```tsx
// src/components/learn/LearnSidebar.tsx
import { Check, Lock } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getStagesForGroup, type LearningStage, type LearningStageId } from '../../learningPath';
import { useProgress } from '../../progress/ProgressContext';
import { getGroupProgress, isStageCompleted, isStageUnlocked } from '../../progress/unlocks';
import { MasteryBadge } from './MasteryBadge';

const GROUPS: { id: LearningStage['group']; label: string }[] = [
  { id: '2x2-foundation', label: '2×2 Foundation' },
  { id: '3x3-beginner', label: '3×3 Beginner' },
];

export function LearnSidebar({ currentStageId }: { currentStageId: LearningStageId }) {
  const snapshot = useProgress();
  return (
    <nav className="learn-sidebar" aria-label="Curriculum" data-testid="learn-sidebar">
      {GROUPS.map((group) => {
        const { done, total } = getGroupProgress(group.id, snapshot);
        return (
          <section key={group.id} className="sidebar-group">
            <header className="sidebar-group-header">
              <h3>{group.label}</h3>
              <span className="sidebar-group-progress">{done}/{total}</span>
            </header>
            <ul>
              {getStagesForGroup(group.id).map((stage) => {
                const completed = isStageCompleted(stage.id, snapshot);
                const unlocked = isStageUnlocked(stage.id, snapshot);
                const status = completed ? 'done' : unlocked ? 'unlocked' : 'locked';
                const mastery = snapshot.lessons[stage.id]?.mastery;
                return (
                  <li key={stage.id}>
                    <NavLink
                      to={`/learn/${stage.id}`}
                      className={`sidebar-stage ${status} ${stage.id === currentStageId ? 'current' : ''}`}
                    >
                      <span className="stage-chip" aria-hidden="true">
                        {completed ? <Check size={13} /> : status === 'locked' ? <Lock size={12} /> : stage.level}
                      </span>
                      <span className="stage-title">{stage.title}</span>
                      {completed && mastery && <MasteryBadge mastery={mastery} />}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
```

```tsx
// src/components/learn/LockedLessonView.tsx
import { useState } from 'react';
import { Lock } from 'lucide-react';
import { LEARNING_STAGES, type LearningStage } from '../../learningPath';
import { useProgress, useProgressStore } from '../../progress/ProgressContext';
import { isStageCompleted } from '../../progress/unlocks';
import { getSelfCheckById } from '../../selfChecks';
import { SelfCheckCard } from '../SelfCheckCard';

export function LockedLessonView({ stage }: { stage: LearningStage }) {
  const store = useProgressStore();
  const snapshot = useProgress();
  const [testingOut, setTestingOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [passed, setPassed] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState(false);

  const selfChecks = stage.selfCheckIds.map(getSelfCheckById).filter(Boolean);
  const ordered = [...LEARNING_STAGES].sort((a, b) => a.level - b.level);
  const prerequisite = ordered
    .filter((s) => s.level < stage.level)
    .reverse()
    .find((s) => !isStageCompleted(s.id, snapshot));

  function handleResult(checkId: string, correct: boolean) {
    store.recordSelfCheck(stage.id, checkId, correct);
    if (!correct) {
      setFailed(true);
      return;
    }
    const next = new Set(passed).add(checkId);
    setPassed(next);
    if (next.size === selfChecks.length) {
      store.completeLesson(stage.id, 2, 0);
    }
  }

  function retry() {
    setAttempt((n) => n + 1);
    setPassed(new Set());
    setFailed(false);
  }

  return (
    <article className="lesson-view locked-lesson">
      <header className="lesson-header">
        <p className="eyebrow"><Lock size={12} /> Locked</p>
        <h1>{stage.title}</h1>
        <p className="locked-reason">
          {prerequisite
            ? <>Complete “{prerequisite.title}” to unlock this lesson.</>
            : <>Finish the earlier lessons to unlock this one.</>}
        </p>
      </header>
      {!testingOut ? (
        <div className="locked-actions">
          <button onClick={() => setTestingOut(true)}>Test out of this lesson</button>
          <p className="locked-note">Already know this skill? Pass the self-check — no hints — to skip ahead.</p>
        </div>
      ) : (
        <section className="lesson-self-checks" key={attempt}>
          <h2>Check your understanding</h2>
          {failed && (
            <div className="testout-failed" role="status">
              <p>Not yet — review the earlier lessons or try again.</p>
              <button onClick={retry}>Try again</button>
            </div>
          )}
          {selfChecks.map((check) => (
            <SelfCheckCard
              key={`${check!.id}-${attempt}`}
              selfCheck={check!}
              onResult={(correct) => handleResult(check!.id, correct)}
            />
          ))}
        </section>
      )}
    </article>
  );
}
```

```tsx
// src/components/LearnPage.tsx (full rewrite)
import { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { LEARNING_STAGES, type LearningStageId, getStageById } from '../learningPath';
import { useProgress } from '../progress/ProgressContext';
import { isStageUnlocked } from '../progress/unlocks';
import { LearnSidebar } from './learn/LearnSidebar';
import { LessonView } from './learn/LessonView';
import { LockedLessonView } from './learn/LockedLessonView';

type Props = {
  stageId: LearningStageId;
  onSelectStage: (id: LearningStageId) => void;
  onPractice: (stageId: string) => void;
};

export function LearnPage({ stageId, onPractice }: Props) {
  const snapshot = useProgress();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const stage = getStageById(stageId) ?? LEARNING_STAGES[0];
  const unlocked = isStageUnlocked(stage.id, snapshot);

  return (
    <div className="learn-layout">
      <button
        className="curriculum-toggle"
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen((open) => !open)}
      >
        <PanelLeft size={16} /> Curriculum
      </button>
      <div className={`learn-sidebar-wrap ${drawerOpen ? 'open' : ''}`}>
        <LearnSidebar currentStageId={stage.id} />
      </div>
      <main className="learn-main">
        {unlocked
          ? <LessonView key={stage.id} stage={stage} onPractice={onPractice} />
          : <LockedLessonView key={stage.id} stage={stage} />}
      </main>
    </div>
  );
}
```

(`onSelectStage` disappears from use — sidebar links navigate directly; keep the prop in the type for `App.tsx` compatibility and prefix-underscore or destructure-and-ignore it. Then delete `src/components/PathwayTimeline.tsx` and `src/components/LessonWorkspace.tsx`; remove `onSelectStage` from `App.tsx`'s `LearnRoute` and from the `Props` type if you prefer — either way, no dangling imports.)

- [ ] **Step 4: Update App.test.tsx Learn block**

Replace the "Learn page — progressive visual pathway" describe with:

```tsx
describe('Learn page — guided discovery', () => {
  function navigateToLearn() {
    renderApp(['/learn']);
  }

  it('shows the curriculum sidebar with both groups', () => {
    navigateToLearn();
    expect(screen.getByTestId('learn-sidebar')).toBeInTheDocument();
    expect(screen.getByText(/2×2 Foundation/i)).toBeInTheDocument();
    expect(screen.getByText(/3×3 Beginner/i)).toBeInTheDocument();
  });

  it('opens on the challenge, with hints hidden until asked', () => {
    navigateToLearn();
    expect(screen.getByTestId('challenge-panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stuck\? get a nudge/i })).toBeInTheDocument();
    expect(screen.queryByText(/common mistake/i)).not.toBeInTheDocument();
  });

  it('lesson has self-check and practice CTA; no score cards or timer', () => {
    navigateToLearn();
    expect(screen.getByTestId('self-check-card')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /practise this skill/i })).toBeInTheDocument();
    expect(screen.queryByText('Completion score preview')).not.toBeInTheDocument();
    expect(screen.queryByText('Game mode')).not.toBeInTheDocument();
  });

  it('locked lessons show the locked view with test-out, not a redirect', () => {
    renderApp(['/learn/3x3-white-cross']);
    expect(screen.getByRole('button', { name: /test out of this lesson/i })).toBeInTheDocument();
  });

  it('video references remain available', () => {
    navigateToLearn();
    expect(screen.getByTestId('video-reference-card')).toBeInTheDocument();
  });
});
```

(The old assertions for `pathway-timeline`, the "Start here" panel, and `lesson-diagram` above-the-fold go away — the diagram now lives behind hint level 2.)

- [ ] **Step 5: Run tests, full suite, lint, commit**

Run: `npm test && npm run lint && npm run build`

```bash
git add -A src/components docs 2>/dev/null || true
git add src/components/learn src/components/LearnPage.tsx src/App.tsx src/App.test.tsx
git rm src/components/PathwayTimeline.tsx src/components/LessonWorkspace.tsx
git commit -m "feat: curriculum sidebar, locked lessons with test-out, guided-discovery Learn page"
```

---

### Task 8: Learn styles

**Files:**
- Create: `src/styles/learn.css`
- Modify: `src/main.tsx` (add `import './styles/learn.css';` after `base.css`)

No unit tests (CSS) — verification is build + the manual smoke check in Task 9. All values via Phase 1 tokens.

- [ ] **Step 1: Write the stylesheet**

```css
/* src/styles/learn.css — Learn layout, sidebar sticker-sheet, lesson beats. */

.learn-layout {
  display: grid;
  grid-template-columns: 264px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.curriculum-toggle { display: none; }

/* --- Sidebar: the sticker sheet --- */
.learn-sidebar {
  position: sticky;
  top: 16px;
  background: var(--surface-raised);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 14px;
  display: grid;
  gap: 18px;
}

.sidebar-group-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.sidebar-group-header h3 {
  font-family: var(--font-display);
  font-size: 0.95rem;
  margin: 0;
  color: var(--text-strong);
}

.sidebar-group-progress {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
}

.sidebar-group ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }

.sidebar-stage {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-body);
  font-weight: 600;
  font-size: 0.88rem;
  transition: background var(--duration-quick) ease;
}

.sidebar-stage:hover { background: var(--surface-sunken); }
.sidebar-stage.current { background: var(--surface-sunken); outline: 2px solid var(--color-accent); outline-offset: -2px; }
.sidebar-stage.locked { color: var(--text-muted); }

.stage-chip {
  flex: none;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  background: var(--surface-sunken);
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--text-body);
}

.sidebar-stage.done .stage-chip {
  background: var(--color-success);
  border-color: var(--color-success);
  color: var(--text-on-accent);
}

.sidebar-stage.locked .stage-chip { background: transparent; }

.stage-title { flex: 1; min-width: 0; }

/* --- Mastery cubies --- */
.mastery-badge { display: inline-flex; gap: 3px; }
.mastery-cubie {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  border: 1px solid var(--border-strong);
  background: var(--surface-sunken);
}
.mastery-cubie.earned { background: var(--sticker-yellow); border-color: var(--sticker-yellow); }

/* --- Lesson --- */
.lesson-view { display: grid; gap: 20px; }
.lesson-header h1 {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  letter-spacing: -0.02em;
  margin: 0 0 6px;
  color: var(--text-strong);
}
.lesson-skill { color: var(--text-body); margin: 0; }
.lesson-completed-banner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0 0;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
  border: 1px solid var(--border-soft);
  color: var(--text-body);
  font-size: 0.88rem;
}

/* --- Challenge panel + solve flash signature --- */
.challenge-panel {
  background: var(--surface-raised);
  border: 2px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 18px;
  display: grid;
  gap: 14px;
}

.challenge-goal-text { font-size: 1.05rem; font-weight: 600; color: var(--text-strong); margin: 0; }
.challenge-cube { display: grid; gap: 12px; justify-items: center; }
.challenge-status { min-height: 24px; color: var(--text-body); }
.challenge-panel.goal-met { border-color: var(--color-success); }
.challenge-panel.goal-met .challenge-status strong { color: var(--color-success); }
.challenge-actions { display: flex; gap: 8px; flex-wrap: wrap; }

@keyframes solve-flash {
  0% { border-color: var(--sticker-green); }
  18% { border-color: var(--sticker-red); }
  36% { border-color: var(--sticker-blue); }
  54% { border-color: var(--sticker-orange); }
  72% { border-color: var(--sticker-yellow); }
  90% { border-color: var(--sticker-white); }
  100% { border-color: var(--color-success); }
}
.challenge-panel.goal-met { animation: solve-flash 900ms ease-out 1; }

/* --- Hint ladder --- */
.hint-ladder { display: grid; gap: 10px; }
.hint {
  background: var(--surface-raised);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  color: var(--text-body);
}
.hint p { margin: 0 0 8px; }
.hint p:last-child { margin-bottom: 0; }
.lesson-guide h3 { font-family: var(--font-display); font-size: 1rem; margin: 12px 0 6px; }
.lesson-guide .lesson-mistake {
  border-left: 3px solid var(--color-warning);
  padding-left: 12px;
  margin-top: 10px;
}

/* --- Self-checks / completion --- */
.lesson-self-checks h2, .lesson-complete h2, .lesson-videos h2 {
  font-family: var(--font-display);
  font-size: 1.15rem;
  margin: 0 0 10px;
  color: var(--text-strong);
}

.lesson-complete {
  position: relative;
  overflow: hidden;
  background: var(--surface-raised);
  border: 2px solid var(--color-success);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: grid;
  gap: 10px;
  justify-items: start;
}
.lesson-complete-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.button-link {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-weight: 700;
  text-decoration: none;
  background: var(--color-accent);
  color: var(--text-on-accent);
}

/* --- Celebration (decorative) --- */
.celebration { position: absolute; inset: 0; pointer-events: none; }
.celebration-sticker {
  position: absolute;
  top: -12px;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  opacity: 0;
  animation: sticker-fall 1400ms ease-in 1 forwards;
}
.sticker-green { background: var(--sticker-green); }
.sticker-red { background: var(--sticker-red); }
.sticker-blue { background: var(--sticker-blue); }
.sticker-orange { background: var(--sticker-orange); }
.sticker-yellow { background: var(--sticker-yellow); }
.sticker-white { background: var(--sticker-white); border: 1px solid var(--border-strong); }
.fall-0 { left: 8%; animation-delay: 0ms; }
.fall-1 { left: 28%; animation-delay: 120ms; }
.fall-2 { left: 50%; animation-delay: 60ms; }
.fall-3 { left: 70%; animation-delay: 180ms; }
.fall-4 { left: 88%; animation-delay: 90ms; }
@keyframes sticker-fall {
  0% { opacity: 1; transform: translateY(0) rotate(0deg); }
  100% { opacity: 0; transform: translateY(140px) rotate(200deg); }
}

/* --- Locked lesson --- */
.locked-lesson .locked-reason { color: var(--text-body); }
.locked-actions { display: grid; gap: 8px; justify-items: start; }
.locked-note { color: var(--text-muted); font-size: 0.88rem; margin: 0; }
.testout-failed {
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  margin-bottom: 10px;
}

/* --- Responsive: drawer under 900px --- */
@media (max-width: 900px) {
  .learn-layout { grid-template-columns: 1fr; }
  .curriculum-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-self: start;
  }
  .learn-sidebar-wrap { display: none; }
  .learn-sidebar-wrap.open { display: block; }
  .learn-sidebar { position: static; }
}

@media (prefers-reduced-motion: reduce) {
  .challenge-panel.goal-met { animation: none; }
  .celebration-sticker { animation: none; opacity: 0; }
  .sidebar-stage { transition: none; }
}
```

- [ ] **Step 2: Wire the import, verify, commit**

Add `import './styles/learn.css';` in `src/main.tsx` after the `base.css` import.

Run: `npm test && npm run lint && npm run build`

```bash
git add src/styles/learn.css src/main.tsx
git commit -m "feat: learn styles — sticker-sheet sidebar, solve flash, celebration"
```

---

### Task 9: Phase verification and docs

**Files:**
- Modify: `docs/product.md` (Learn section)

- [ ] **Step 1: Full suite**

Run: `npm test && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 2: Cube engine untouched**

Run: `git diff main -- src/cube.ts src/trainer.ts src/cube.test.ts src/trainer.test.ts` *(on the feature branch; expect empty)*

- [ ] **Step 3: Manual smoke check**

`npm run dev` (background), then verify in the browser/curl: `/learn` lands on lesson 1 with sidebar; performing U R F F′ R′ U′ completes the challenge (status + flash); "Stuck?" ladder reveals nudge → steps → demo; answering the self-check completes the lesson (celebration, mastery cubies, chip increments to 1/10, lesson 2 unlocks in the sidebar); `/learn/3x3-white-cross` shows the locked view with test-out; narrow window (<900px) shows the Curriculum drawer toggle. Stop the server.

- [ ] **Step 4: Update docs/product.md**

Replace the Learn section's "Should include" list with: start-on-current-lesson via `/learn` redirect; curriculum sidebar (groups, progress, locked/done/mastery states); challenge-first lesson with embedded cube; hint ladder (nudge → steps → demo); self-check gate; completion with mastery cubies and next-lesson link; test-out on locked lessons; video references. Move "Start here panel" and "Pathway timeline" mentions to "Should not include" (replaced by the sidebar).

- [ ] **Step 5: Commit**

```bash
git add docs/product.md docs/superpowers/plans/2026-07-04-ux-overhaul-phase-2-learn.md
git commit -m "docs: product notes reflect guided-discovery Learn; phase 2 plan executed"
```

---

## Self-Review (performed at authoring time)

- **Spec coverage (phase 2 slice):** sidebar with status/mastery → Task 7; challenge-first with embedded cube + live predicate → Tasks 2/4; hint ladder levels 1–3 → Tasks 4/5; self-check gate + retry → Task 6; mastery rules + celebration → Tasks 3/6/8; unlock display + test-out at mastery 2 → Task 7; deep-linkable lessons stay (`/learn/:stageId` untouched); reduced-motion → Task 8. Deferred per spec: Play restructure (P3), Home/resume + dark toggle + legacy CSS removal (P4).
- **Placeholder scan:** clean — every code step carries full code; the one adaptive instruction (deepening a setup that accidentally meets its goal) states the exact arbiter (the invariant test).
- **Type consistency:** `ChallengePanel` props consumed by `LessonView` match Task 4's produce line; `onResult`/`allowRetry` signatures match between Tasks 6/7; `getNextStageId` defined in Task 3, consumed in Task 6; `CubeView`/`BandControls`/`bands.ts` names consistent across Tasks 1/4. `LearnPage` keeps its `Props` shape from Phase 1 (`onSelectStage` now unused — explicitly handled in Task 7).
- **Known risk, accepted:** hand-rolled challenge setups may fail the false-after-setup invariant on first run; the test pinpoints the stage and the fix rule is stated. jsdom `structuredClone` and CSS animations are inert in tests — component tests assert classes/roles, not animation frames.

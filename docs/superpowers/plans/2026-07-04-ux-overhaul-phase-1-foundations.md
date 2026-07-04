# UX Overhaul Phase 1 — Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the foundations for the UX overhaul: pinned dependencies, URL routing with a new app shell, the design-token system, and a real (in-memory) progress store with unlock logic — with the existing pages still fully working.

**Architecture:** React 19 + Vite SPA. `react-router-dom` provides URL-per-screen with redirect routes; a `ProgressStore` interface (in-memory implementation, React context + `useSyncExternalStore`) makes progress real while persistence stays a later drop-in; new CSS token files layer under the legacy `styles.css`, which keeps styling old pages until Phases 2–4 migrate them.

**Tech Stack:** React 19, TypeScript, Vite, Vitest + Testing Library, react-router-dom v7, @fontsource-variable/outfit.

**Spec:** `docs/superpowers/specs/2026-07-04-ux-overhaul-design.md`. Plans for Phases 2 (Learn), 3 (Play), 4 (Home + polish) will be written after this phase lands.

## Global Constraints

- No persistence of learning progress this round — in-memory only, behind the `ProgressStore` interface. (Device UI preferences like theme are exempt, but the theme toggle itself is Phase 4.)
- Routes exactly as specced: `/`, `/learn` (redirect to current lesson), `/learn/:stageId`, `/play` (redirect), `/play/:mode` with modes `free | coach | scan`; unknown paths redirect, never blank-screen.
- Progress schema is `version: 1` exactly as defined in the spec.
- `src/cube.ts`, `src/trainer.ts` and their tests must not change.
- All dependencies pinned with caret ranges (no `"latest"`); build tooling in `devDependencies`.
- The app must build, lint, and pass all tests at the end of every task.
- TDD: write the failing test first for all logic tasks.

---

### Task 1: Pin dependencies, move build tooling, add router + font

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (via npm, not by hand)

**Interfaces:**
- Consumes: nothing.
- Produces: `react-router-dom` and `@fontsource-variable/outfit` importable; all dep versions caret-pinned.

- [ ] **Step 1: Capture currently installed versions**

Run: `npm ls --depth=0`
Expected: a list like `react@19.x.y`, `vite@7.x.y`, etc. Note every version.

- [ ] **Step 2: Install the two new dependencies**

Run: `npm install react-router-dom @fontsource-variable/outfit`
Expected: both added to `dependencies` with caret versions in `package.json`.

- [ ] **Step 3: Rewrite package.json dependency blocks**

Replace every `"latest"` with the caret version observed in Step 1 (e.g. `"react": "^19.2.3"` — use the real numbers). Move `vite`, `typescript`, and `@vitejs/plugin-react` from `dependencies` to `devDependencies`. Resulting shape (versions illustrative — use Step 1 output):

```json
{
  "type": "module",
  "version": "0.2.0",
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 5174",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "lint": "eslint . --max-warnings=0"
  },
  "dependencies": {
    "@fontsource-variable/outfit": "^5.2.8",
    "lucide-react": "^0.525.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-router-dom": "^7.6.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.30.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.3.0",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^4.6.0",
    "eslint": "^9.30.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "jsdom": "^26.1.0",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.35.0",
    "vite": "^7.0.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 4: Sync the lockfile and verify nothing broke**

Run: `npm install && npm test && npm run lint && npm run build`
Expected: install clean; all existing test files PASS; lint clean; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: pin dependencies, move build tooling to devDependencies, add router and display font"
```

---

### Task 2: Progress store — types and in-memory implementation

**Files:**
- Create: `src/progress/types.ts`
- Create: `src/progress/inMemoryStore.ts`
- Test: `src/progress/inMemoryStore.test.ts`

**Interfaces:**
- Consumes: `LearningStageId` from `src/learningPath.ts`, `CubeSizeId` from `src/trainer.ts`.
- Produces:
  - `Mastery = 1 | 2 | 3`
  - `ProgressSnapshot` (spec schema v1), `PracticeSession`, `emptySnapshot(): ProgressSnapshot`
  - `interface ProgressStore { getSnapshot(): ProgressSnapshot; completeLesson(stageId: LearningStageId, mastery: Mastery, hintsUsed: number): void; recordSelfCheck(stageId: LearningStageId, checkId: string, correct: boolean): void; recordPracticeSession(session: PracticeSession): void; subscribe(listener: () => void): () => void }`
  - `class InMemoryProgressStore implements ProgressStore` with constructor `(now?: () => Date)`

- [ ] **Step 1: Write the types file** (no test needed — types only)

```ts
// src/progress/types.ts
import type { LearningStageId } from '../learningPath';
import type { CubeSizeId } from '../trainer';

export type Mastery = 1 | 2 | 3;

export type LessonProgress = {
  completedAt: string;
  mastery: Mastery;
  hintsUsed: number;
  attempts: number;
};

export type SelfCheckProgress = {
  attempts: number;
  lastCorrectAt?: string;
};

export type PracticeSession = {
  cubeSize: CubeSizeId;
  mode: 'free' | 'coach' | 'scan';
  moves: number;
  elapsedMs?: number;
  solved: boolean;
};

export type ProgressSnapshot = {
  version: 1;
  lessons: Partial<Record<LearningStageId, LessonProgress>>;
  selfChecks: Record<string, SelfCheckProgress>;
  practice: {
    totalSessions: number;
    totalMoves: number;
    bestTimeMsBySize: Partial<Record<CubeSizeId, number>>;
  };
  streak: { current: number; best: number; lastActiveDate: string };
};

export interface ProgressStore {
  getSnapshot(): ProgressSnapshot;
  completeLesson(stageId: LearningStageId, mastery: Mastery, hintsUsed: number): void;
  recordSelfCheck(stageId: LearningStageId, checkId: string, correct: boolean): void;
  recordPracticeSession(session: PracticeSession): void;
  subscribe(listener: () => void): () => void;
}

export function emptySnapshot(): ProgressSnapshot {
  return {
    version: 1,
    lessons: {},
    selfChecks: {},
    practice: { totalSessions: 0, totalMoves: 0, bestTimeMsBySize: {} },
    streak: { current: 0, best: 0, lastActiveDate: '' },
  };
}
```

- [ ] **Step 2: Write the failing tests**

```ts
// src/progress/inMemoryStore.test.ts
import { describe, expect, it, vi } from 'vitest';
import { InMemoryProgressStore } from './inMemoryStore';

function makeStore(startDate = '2026-07-04T10:00:00Z') {
  let current = new Date(startDate);
  const store = new InMemoryProgressStore(() => current);
  return { store, setDate: (iso: string) => { current = new Date(iso); } };
}

describe('InMemoryProgressStore — lessons', () => {
  it('starts with the empty v1 snapshot', () => {
    const { store } = makeStore();
    const snap = store.getSnapshot();
    expect(snap.version).toBe(1);
    expect(snap.lessons).toEqual({});
    expect(snap.streak).toEqual({ current: 0, best: 0, lastActiveDate: '' });
  });

  it('records lesson completion with mastery, hints, and attempts', () => {
    const { store } = makeStore();
    store.completeLesson('2x2-orientation', 2, 1);
    const lesson = store.getSnapshot().lessons['2x2-orientation'];
    expect(lesson).toMatchObject({ mastery: 2, hintsUsed: 1, attempts: 1 });
    expect(lesson?.completedAt).toBe('2026-07-04T10:00:00.000Z');
  });

  it('keeps the best mastery when a lesson is redone, and counts attempts', () => {
    const { store } = makeStore();
    store.completeLesson('2x2-orientation', 3, 0);
    store.completeLesson('2x2-orientation', 1, 3);
    const lesson = store.getSnapshot().lessons['2x2-orientation'];
    expect(lesson?.mastery).toBe(3);
    expect(lesson?.attempts).toBe(2);
  });

  it('does not mutate previously returned snapshots', () => {
    const { store } = makeStore();
    const before = store.getSnapshot();
    store.completeLesson('2x2-orientation', 3, 0);
    expect(before.lessons['2x2-orientation']).toBeUndefined();
  });
});

describe('InMemoryProgressStore — streak', () => {
  it('first activity starts the streak at 1', () => {
    const { store } = makeStore();
    store.completeLesson('2x2-orientation', 3, 0);
    expect(store.getSnapshot().streak).toMatchObject({ current: 1, best: 1, lastActiveDate: '2026-07-04' });
  });

  it('consecutive-day activity increments; same-day does not', () => {
    const { store, setDate } = makeStore();
    store.completeLesson('2x2-orientation', 3, 0);
    store.completeLesson('2x2-first-face', 3, 0); // same day
    expect(store.getSnapshot().streak.current).toBe(1);
    setDate('2026-07-05T09:00:00Z');
    store.completeLesson('2x2-corner-insertion', 3, 0);
    expect(store.getSnapshot().streak).toMatchObject({ current: 2, best: 2 });
  });

  it('a gap of one or more days resets the streak to 1 and keeps best', () => {
    const { store, setDate } = makeStore();
    store.completeLesson('2x2-orientation', 3, 0);
    setDate('2026-07-05T09:00:00Z');
    store.completeLesson('2x2-first-face', 3, 0);
    setDate('2026-07-08T09:00:00Z');
    store.completeLesson('2x2-corner-insertion', 3, 0);
    expect(store.getSnapshot().streak).toMatchObject({ current: 1, best: 2 });
  });

  it('practice sessions count as streak activity too', () => {
    const { store } = makeStore();
    store.recordPracticeSession({ cubeSize: '2x2', mode: 'free', moves: 12, solved: false });
    expect(store.getSnapshot().streak.current).toBe(1);
  });
});

describe('InMemoryProgressStore — self-checks and practice', () => {
  it('tracks self-check attempts and last correct time', () => {
    const { store } = makeStore();
    store.recordSelfCheck('2x2-orientation', '2x2-orientation-check', false);
    store.recordSelfCheck('2x2-orientation', '2x2-orientation-check', true);
    const check = store.getSnapshot().selfChecks['2x2-orientation:2x2-orientation-check'];
    expect(check?.attempts).toBe(2);
    expect(check?.lastCorrectAt).toBe('2026-07-04T10:00:00.000Z');
  });

  it('an incorrect answer never clears an earlier lastCorrectAt', () => {
    const { store } = makeStore();
    store.recordSelfCheck('2x2-orientation', '2x2-orientation-check', true);
    store.recordSelfCheck('2x2-orientation', '2x2-orientation-check', false);
    const check = store.getSnapshot().selfChecks['2x2-orientation:2x2-orientation-check'];
    expect(check?.lastCorrectAt).toBe('2026-07-04T10:00:00.000Z');
  });

  it('accumulates practice totals and keeps only the best solved time per size', () => {
    const { store } = makeStore();
    store.recordPracticeSession({ cubeSize: '2x2', mode: 'free', moves: 30, elapsedMs: 90_000, solved: true });
    store.recordPracticeSession({ cubeSize: '2x2', mode: 'coach', moves: 20, elapsedMs: 60_000, solved: true });
    store.recordPracticeSession({ cubeSize: '2x2', mode: 'free', moves: 40, elapsedMs: 50_000, solved: false });
    const practice = store.getSnapshot().practice;
    expect(practice.totalSessions).toBe(3);
    expect(practice.totalMoves).toBe(90);
    expect(practice.bestTimeMsBySize['2x2']).toBe(60_000);
  });
});

describe('InMemoryProgressStore — subscribe', () => {
  it('notifies listeners on every mutation and supports unsubscribe', () => {
    const { store } = makeStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.completeLesson('2x2-orientation', 3, 0);
    store.recordPracticeSession({ cubeSize: '2x2', mode: 'free', moves: 1, solved: false });
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.completeLesson('2x2-first-face', 3, 0);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/progress`
Expected: FAIL — `Cannot find module './inMemoryStore'` (or equivalent).

- [ ] **Step 4: Write the implementation**

```ts
// src/progress/inMemoryStore.ts
import type { LearningStageId } from '../learningPath';
import {
  emptySnapshot,
  type Mastery,
  type PracticeSession,
  type ProgressSnapshot,
  type ProgressStore,
} from './types';

const MS_PER_DAY = 86_400_000;

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayGap(fromDay: string, toDay: string): number {
  return Math.round((Date.parse(toDay) - Date.parse(fromDay)) / MS_PER_DAY);
}

export class InMemoryProgressStore implements ProgressStore {
  private snapshot: ProgressSnapshot = emptySnapshot();
  private listeners = new Set<() => void>();

  constructor(private now: () => Date = () => new Date()) {}

  getSnapshot(): ProgressSnapshot {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private update(mutate: (draft: ProgressSnapshot) => void): void {
    const draft = structuredClone(this.snapshot);
    mutate(draft);
    this.snapshot = draft;
    this.listeners.forEach((listener) => listener());
  }

  private touchStreak(draft: ProgressSnapshot): void {
    const today = isoDay(this.now());
    const last = draft.streak.lastActiveDate;
    if (last === today) return;
    draft.streak.current = last && dayGap(last, today) === 1 ? draft.streak.current + 1 : 1;
    draft.streak.best = Math.max(draft.streak.best, draft.streak.current);
    draft.streak.lastActiveDate = today;
  }

  completeLesson(stageId: LearningStageId, mastery: Mastery, hintsUsed: number): void {
    this.update((draft) => {
      const existing = draft.lessons[stageId];
      draft.lessons[stageId] = {
        completedAt: this.now().toISOString(),
        mastery: existing ? (Math.max(existing.mastery, mastery) as Mastery) : mastery,
        hintsUsed,
        attempts: (existing?.attempts ?? 0) + 1,
      };
      this.touchStreak(draft);
    });
  }

  recordSelfCheck(stageId: LearningStageId, checkId: string, correct: boolean): void {
    this.update((draft) => {
      const key = `${stageId}:${checkId}`;
      const existing = draft.selfChecks[key] ?? { attempts: 0 };
      draft.selfChecks[key] = {
        attempts: existing.attempts + 1,
        lastCorrectAt: correct ? this.now().toISOString() : existing.lastCorrectAt,
      };
    });
  }

  recordPracticeSession(session: PracticeSession): void {
    this.update((draft) => {
      draft.practice.totalSessions += 1;
      draft.practice.totalMoves += session.moves;
      if (session.solved && session.elapsedMs !== undefined) {
        const best = draft.practice.bestTimeMsBySize[session.cubeSize];
        if (best === undefined || session.elapsedMs < best) {
          draft.practice.bestTimeMsBySize[session.cubeSize] = session.elapsedMs;
        }
      }
      this.touchStreak(draft);
    });
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/progress`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add src/progress/types.ts src/progress/inMemoryStore.ts src/progress/inMemoryStore.test.ts
git commit -m "feat: progress store interface, schema v1, and in-memory implementation"
```

---

### Task 3: Unlock and selector logic

**Files:**
- Create: `src/progress/unlocks.ts`
- Test: `src/progress/unlocks.test.ts`

**Interfaces:**
- Consumes: `LEARNING_STAGES`, `getStagesForGroup`, types from `src/learningPath.ts`; `ProgressSnapshot`, `emptySnapshot` from `./types`; `InMemoryProgressStore` (test only).
- Produces (all pure functions over `ProgressSnapshot`):
  - `isStageCompleted(stageId: LearningStageId, snapshot: ProgressSnapshot): boolean`
  - `isGroupCompleted(group: LearningStage['group'], snapshot: ProgressSnapshot): boolean`
  - `isStageUnlocked(stageId: LearningStageId, snapshot: ProgressSnapshot): boolean`
  - `getCurrentStageId(snapshot: ProgressSnapshot): LearningStageId`
  - `getCompletedCount(snapshot: ProgressSnapshot): { done: number; total: number }`
  - `getGroupProgress(group: LearningStage['group'], snapshot: ProgressSnapshot): { done: number; total: number }`

- [ ] **Step 1: Write the failing tests**

```ts
// src/progress/unlocks.test.ts
import { describe, expect, it } from 'vitest';
import { InMemoryProgressStore } from './inMemoryStore';
import type { LearningStageId } from '../learningPath';
import {
  getCompletedCount,
  getCurrentStageId,
  getGroupProgress,
  isStageUnlocked,
} from './unlocks';
import { emptySnapshot } from './types';

function snapshotWithCompleted(stageIds: LearningStageId[]) {
  const store = new InMemoryProgressStore(() => new Date('2026-07-04T10:00:00Z'));
  for (const id of stageIds) store.completeLesson(id, 3, 0);
  return store.getSnapshot();
}

const ALL_2X2: LearningStageId[] = [
  '2x2-orientation',
  '2x2-first-face',
  '2x2-corner-insertion',
  '2x2-last-layer-orient',
  '2x2-last-corner-permute',
];

describe('isStageUnlocked', () => {
  it('unlocks only the first stage on a fresh snapshot', () => {
    const snap = emptySnapshot();
    expect(isStageUnlocked('2x2-orientation', snap)).toBe(true);
    expect(isStageUnlocked('2x2-first-face', snap)).toBe(false);
    expect(isStageUnlocked('3x3-white-cross', snap)).toBe(false);
  });

  it('completing a stage unlocks the next one', () => {
    const snap = snapshotWithCompleted(['2x2-orientation']);
    expect(isStageUnlocked('2x2-first-face', snap)).toBe(true);
    expect(isStageUnlocked('2x2-corner-insertion', snap)).toBe(false);
  });

  it('keeps completed stages unlocked (redoable)', () => {
    const snap = snapshotWithCompleted(['2x2-orientation']);
    expect(isStageUnlocked('2x2-orientation', snap)).toBe(true);
  });

  it('locks the 3x3 group until the whole 2x2 foundation is complete', () => {
    const partial = snapshotWithCompleted(ALL_2X2.slice(0, 4));
    expect(isStageUnlocked('3x3-white-cross', partial)).toBe(false);
    const full = snapshotWithCompleted(ALL_2X2);
    expect(isStageUnlocked('3x3-white-cross', full)).toBe(true);
  });

  it('a tested-out (completed) later stage is unlocked even if predecessors are not', () => {
    const snap = snapshotWithCompleted(['3x3-yellow-cross']);
    expect(isStageUnlocked('3x3-yellow-cross', snap)).toBe(true);
    expect(isStageUnlocked('3x3-last-layer-finish', snap)).toBe(false); // 3x3 gate still applies
  });
});

describe('selectors', () => {
  it('getCurrentStageId returns the first incomplete stage in level order', () => {
    expect(getCurrentStageId(emptySnapshot())).toBe('2x2-orientation');
    expect(getCurrentStageId(snapshotWithCompleted(['2x2-orientation']))).toBe('2x2-first-face');
    expect(getCurrentStageId(snapshotWithCompleted(['2x2-orientation', '2x2-corner-insertion'])))
      .toBe('2x2-first-face');
  });

  it('getCurrentStageId falls back to the last stage when everything is complete', () => {
    const snap = snapshotWithCompleted([...ALL_2X2,
      '3x3-white-cross', '3x3-first-layer-corners', '3x3-middle-layer-edges',
      '3x3-yellow-cross', '3x3-last-layer-finish']);
    expect(getCurrentStageId(snap)).toBe('3x3-last-layer-finish');
  });

  it('counts overall and per-group progress', () => {
    const snap = snapshotWithCompleted(['2x2-orientation', '2x2-first-face']);
    expect(getCompletedCount(snap)).toEqual({ done: 2, total: 10 });
    expect(getGroupProgress('2x2-foundation', snap)).toEqual({ done: 2, total: 5 });
    expect(getGroupProgress('3x3-beginner', snap)).toEqual({ done: 0, total: 5 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/progress/unlocks.test.ts`
Expected: FAIL — module `./unlocks` not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/progress/unlocks.ts
import {
  LEARNING_STAGES,
  getStagesForGroup,
  type LearningStage,
  type LearningStageId,
} from '../learningPath';
import type { ProgressSnapshot } from './types';

const ORDERED_STAGES = [...LEARNING_STAGES].sort((a, b) => a.level - b.level);

export function isStageCompleted(stageId: LearningStageId, snapshot: ProgressSnapshot): boolean {
  return snapshot.lessons[stageId] !== undefined;
}

export function isGroupCompleted(group: LearningStage['group'], snapshot: ProgressSnapshot): boolean {
  return getStagesForGroup(group).every((stage) => isStageCompleted(stage.id, snapshot));
}

export function isStageUnlocked(stageId: LearningStageId, snapshot: ProgressSnapshot): boolean {
  if (isStageCompleted(stageId, snapshot)) return true;
  const index = ORDERED_STAGES.findIndex((stage) => stage.id === stageId);
  if (index === -1) return false;
  const stage = ORDERED_STAGES[index];
  if (stage.group === '3x3-beginner' && !isGroupCompleted('2x2-foundation', snapshot)) return false;
  const previous = ORDERED_STAGES[index - 1];
  return previous === undefined || isStageCompleted(previous.id, snapshot);
}

export function getCurrentStageId(snapshot: ProgressSnapshot): LearningStageId {
  const firstIncomplete = ORDERED_STAGES.find((stage) => !isStageCompleted(stage.id, snapshot));
  return (firstIncomplete ?? ORDERED_STAGES[ORDERED_STAGES.length - 1]).id;
}

export function getCompletedCount(snapshot: ProgressSnapshot): { done: number; total: number } {
  const done = ORDERED_STAGES.filter((stage) => isStageCompleted(stage.id, snapshot)).length;
  return { done, total: ORDERED_STAGES.length };
}

export function getGroupProgress(
  group: LearningStage['group'],
  snapshot: ProgressSnapshot,
): { done: number; total: number } {
  const stages = getStagesForGroup(group);
  const done = stages.filter((stage) => isStageCompleted(stage.id, snapshot)).length;
  return { done, total: stages.length };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/progress/unlocks.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/progress/unlocks.ts src/progress/unlocks.test.ts
git commit -m "feat: stage unlock rules and progress selectors"
```

---

### Task 4: Progress React context and hooks

**Files:**
- Create: `src/progress/ProgressContext.tsx`
- Test: `src/progress/ProgressContext.test.tsx`

**Interfaces:**
- Consumes: `InMemoryProgressStore`, `ProgressStore`, `ProgressSnapshot` from Task 2.
- Produces:
  - `ProgressProvider({ store?, children })` — creates an `InMemoryProgressStore` if none given (test seam / future adapter swap).
  - `useProgressStore(): ProgressStore` — throws outside provider.
  - `useProgress(): ProgressSnapshot` — subscribes via `useSyncExternalStore`, re-renders on mutation.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/progress/ProgressContext.test.tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressProvider, useProgress, useProgressStore } from './ProgressContext';

function Probe() {
  const snapshot = useProgress();
  const store = useProgressStore();
  return (
    <button onClick={() => store.completeLesson('2x2-orientation', 3, 0)}>
      completed:{Object.keys(snapshot.lessons).length}
    </button>
  );
}

describe('ProgressContext', () => {
  it('provides a working store and re-renders subscribers on mutation', () => {
    render(
      <ProgressProvider>
        <Probe />
      </ProgressProvider>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('completed:0');
    fireEvent.click(button);
    expect(button).toHaveTextContent('completed:1');
  });

  it('useProgressStore throws outside the provider', () => {
    expect(() => render(<Probe />)).toThrow(/ProgressProvider/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/progress/ProgressContext.test.tsx`
Expected: FAIL — module `./ProgressContext` not found.

- [ ] **Step 3: Write the implementation**

```tsx
// src/progress/ProgressContext.tsx
import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { InMemoryProgressStore } from './inMemoryStore';
import type { ProgressSnapshot, ProgressStore } from './types';

const ProgressStoreContext = createContext<ProgressStore | null>(null);

export function ProgressProvider({ store, children }: { store?: ProgressStore; children: ReactNode }) {
  const value = useMemo(() => store ?? new InMemoryProgressStore(), [store]);
  return <ProgressStoreContext.Provider value={value}>{children}</ProgressStoreContext.Provider>;
}

export function useProgressStore(): ProgressStore {
  const store = useContext(ProgressStoreContext);
  if (!store) throw new Error('useProgressStore must be used within a ProgressProvider');
  return store;
}

export function useProgress(): ProgressSnapshot {
  const store = useProgressStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getSnapshot(),
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/progress/ProgressContext.test.tsx`
Expected: PASS (the "throws outside provider" test will print a React error boundary warning to stderr — that is expected).

- [ ] **Step 5: Commit**

```bash
git add src/progress/ProgressContext.tsx src/progress/ProgressContext.test.tsx
git commit -m "feat: progress provider and useProgress hook"
```

---

### Task 5: Design tokens and base shell styles

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`

No unit tests (CSS only) — verification is lint/build plus the shell task's component tests and a visual check in Task 6. Legacy `styles.css` is untouched; new files use new class names (`shell-*`) so nothing collides. Old pages keep their current look until Phases 2–4 migrate them onto tokens.

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties (`--sticker-*`, `--color-*`, `--surface-*`, `--border-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--font-*`, `--ease-spring`, `--duration-*`) and shell classes `.app-shell`, `.shell-topbar`, `.shell-brand`, `.shell-nav`, `.progress-chip` used by Task 6.

- [ ] **Step 1: Write the tokens file**

```css
/* src/styles/tokens.css — design tokens: playful & tactile, cube-derived accents.
   Dark palette is defined but only activates via [data-theme='dark'];
   the toggle ships in Phase 4 once all pages consume tokens. */
:root {
  /* Cube sticker palette — the brand */
  --sticker-green: #17a34a;
  --sticker-red: #dc2f2f;
  --sticker-blue: #2563eb;
  --sticker-orange: #ea6a0c;
  --sticker-yellow: #f5c518;
  --sticker-white: #f8f7f4;

  /* Semantic accents */
  --color-accent: var(--sticker-blue);
  --color-success: var(--sticker-green);
  --color-danger: var(--sticker-red);
  --color-warning: var(--sticker-orange);
  --color-highlight: var(--sticker-yellow);

  /* Warm neutral surfaces (light) */
  --surface-page: #faf9f7;
  --surface-raised: #ffffff;
  --surface-sunken: #f1efea;
  --border-strong: #d9d4ca;
  --border-soft: #e8e5de;
  --text-strong: #27221a;
  --text-body: #4c463c;
  --text-muted: #8b8478;
  --text-on-accent: #ffffff;

  /* Shape & depth — chunky, board-game tactile */
  --radius-lg: 16px;
  --radius-md: 10px;
  --radius-sm: 6px;
  --shadow-card: 0 2px 0 var(--border-strong);
  --shadow-card-raised: 0 4px 0 var(--border-strong);

  /* Type */
  --font-display: 'Outfit Variable', 'Outfit', system-ui, sans-serif;
  --font-body: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

  /* Motion */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-quick: 140ms;
  --duration-move: 260ms;
}

[data-theme='dark'] {
  --surface-page: #171512;
  --surface-raised: #211e1a;
  --surface-sunken: #1b1916;
  --border-strong: #3b362e;
  --border-soft: #2c2823;
  --text-strong: #f3efe8;
  --text-body: #cfc9be;
  --text-muted: #8f887b;
  --shadow-card: 0 2px 0 rgba(0, 0, 0, 0.5);
  --shadow-card-raised: 0 4px 0 rgba(0, 0, 0, 0.5);
}
```

- [ ] **Step 2: Write the base shell styles**

```css
/* src/styles/base.css — app shell: topbar, nav, progress chip. */
.app-shell {
  width: min(1200px, calc(100% - 32px));
  margin: 0 auto;
  padding: 16px 0 48px;
  font-family: var(--font-body);
}

.shell-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  margin-bottom: 24px;
  background: var(--surface-raised);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.shell-brand {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--text-strong);
  text-decoration: none;
  letter-spacing: -0.01em;
}

.shell-nav {
  display: flex;
  gap: 4px;
  margin-right: auto;
}

.shell-nav a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  color: var(--text-body);
  font-weight: 600;
  text-decoration: none;
  transition: background var(--duration-quick) ease, transform var(--duration-quick) var(--ease-spring);
}

.shell-nav a:hover {
  background: var(--surface-sunken);
}

.shell-nav a:active {
  transform: translateY(1px);
}

.shell-nav a.active {
  background: var(--color-accent);
  color: var(--text-on-accent);
}

.progress-chip {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--surface-sunken);
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  padding: 6px 12px;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .shell-nav a {
    transition: none;
  }
}
```

- [ ] **Step 3: Verify build still passes**

Run: `npm run build`
Expected: success (files are not imported yet; Task 6 wires them in).

- [ ] **Step 4: Commit**

```bash
git add src/styles/tokens.css src/styles/base.css
git commit -m "feat: design tokens (light+dark) and app shell base styles"
```

---

### Task 6: Router, app shell, and page adaptation

**Files:**
- Create: `src/app/AppLayout.tsx`
- Modify: `src/App.tsx` (full rewrite shown below)
- Modify: `src/main.tsx` (full rewrite shown below)
- Modify: `src/components/LearnPage.tsx` (controlled by route instead of internal state)
- Modify: `src/App.test.tsx` (router-aware; full rewrite of helpers + affected tests shown below)

**Interfaces:**
- Consumes: `ProgressProvider`, `useProgress` (Task 4); `getCurrentStageId`, `getCompletedCount` (Task 3); shell CSS classes (Task 5); existing `HomePage`, `LearnPage`, `PracticePage`.
- Produces: routes `/`, `/learn`, `/learn/:stageId`, `/play`, `/play/:mode` (+ `?skill=` on play); `AppLayout` shell with progress chip; `LearnPage` new props `{ stageId: LearningStageId; onSelectStage: (id: LearningStageId) => void; onPractice: (stageId: string) => void }`.

- [ ] **Step 1: Update App.test.tsx to the routed world (failing first)**

Replace the imports, add a render helper, replace the two `navigateTo*` helpers, and add a new "routing" describe block. Full new top of file and changed sections:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { ProgressProvider } from './progress/ProgressContext';

function renderApp(initialEntries: string[] = ['/']) {
  return render(
    <ProgressProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </ProgressProvider>,
  );
}
```

Then:
- In every existing test, replace bare `render(<App />)` with `renderApp()`.
- Replace `navigateToLearn()` body with `renderApp(['/learn'])`.
- Replace `navigateToPlay()` body with `renderApp(['/play/free'])`.
- The Play test "shows scoring in guided mode" stays (`renderApp(['/play/coach'])`).

Add this new describe block at the end:

```tsx
describe('Routing shell', () => {
  it('shows the progress chip with 0/10 skills initially', () => {
    renderApp();
    expect(screen.getByText('0/10 skills')).toBeInTheDocument();
  });

  it('navigates between sections via topbar links', () => {
    renderApp();
    fireEvent.click(screen.getByRole('link', { name: /learn/i }));
    expect(screen.getByText(/2×2 Foundation/i)).toBeInTheDocument();
  });

  it('/learn redirects to the current (first) lesson', () => {
    renderApp(['/learn']);
    expect(screen.getByRole('heading', { name: /orientation and notation/i })).toBeInTheDocument();
  });

  it('unknown lesson ids redirect to the current lesson', () => {
    renderApp(['/learn/not-a-stage']);
    expect(screen.getByRole('heading', { name: /orientation and notation/i })).toBeInTheDocument();
  });

  it('/play redirects to free mode and unknown modes redirect too', () => {
    renderApp(['/play']);
    expect(screen.getByRole('heading', { name: /practise the cube/i })).toBeInTheDocument();
    renderApp(['/play/bogus']);
    expect(screen.getAllByRole('heading', { name: /practise the cube/i }).length).toBeGreaterThan(0);
  });

  it('unknown routes redirect home', () => {
    renderApp(['/nowhere']);
    expect(screen.getByText(/agent-supported/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify the new/changed ones fail**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL (App does not accept router context yet; `link` roles don't exist).

- [ ] **Step 3: Create the AppLayout shell**

```tsx
// src/app/AppLayout.tsx
import { BookOpen, Gamepad2 } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useProgress } from '../progress/ProgressContext';
import { getCompletedCount } from '../progress/unlocks';

export function AppLayout() {
  const snapshot = useProgress();
  const { done, total } = getCompletedCount(snapshot);

  return (
    <div className="app-shell">
      <header className="shell-topbar">
        <NavLink to="/" className="shell-brand">Rubik Trainer</NavLink>
        <nav className="shell-nav" aria-label="Primary navigation">
          <NavLink to="/learn"><BookOpen size={16} /> Learn</NavLink>
          <NavLink to="/play"><Gamepad2 size={16} /> Play</NavLink>
        </nav>
        <span className="progress-chip" title="Skills completed">{done}/{total} skills</span>
      </header>
      <Outlet />
    </div>
  );
}
```

- [ ] **Step 4: Rewrite App.tsx as routes**

```tsx
// src/App.tsx
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import './styles.css';
import { AppLayout } from './app/AppLayout';
import { HomePage } from './components/HomePage';
import { LearnPage } from './components/LearnPage';
import { PracticePage } from './components/PracticePage';
import { getStageById, type LearningStageId } from './learningPath';
import { useProgress } from './progress/ProgressContext';
import { getCurrentStageId } from './progress/unlocks';

const PLAY_MODE_MAP = { free: 'practice', coach: 'guided', scan: 'scan' } as const;
type PlayModeParam = keyof typeof PLAY_MODE_MAP;

function HomeRoute() {
  const navigate = useNavigate();
  return (
    <HomePage
      onStartPathway={() => navigate('/learn')}
      onScanCoach={() => navigate('/play/scan')}
      onFreePractice={() => navigate('/play/free')}
    />
  );
}

function LearnIndexRedirect() {
  const snapshot = useProgress();
  return <Navigate to={`/learn/${getCurrentStageId(snapshot)}`} replace />;
}

function LearnRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = stageId ? getStageById(stageId as LearningStageId) : undefined;
  if (!stage) return <LearnIndexRedirect />;
  return (
    <LearnPage
      stageId={stage.id}
      onSelectStage={(id) => navigate(`/learn/${id}`)}
      onPractice={(id) => navigate(`/play/coach?skill=${id}`)}
    />
  );
}

function PlayRoute() {
  const { mode } = useParams();
  const [searchParams] = useSearchParams();
  if (!mode || !(mode in PLAY_MODE_MAP)) return <Navigate to="/play/free" replace />;
  const skill = searchParams.get('skill') ?? undefined;
  return (
    <PracticePage
      key={mode}
      initialMode={PLAY_MODE_MAP[mode as PlayModeParam]}
      skillContext={skill}
    />
  );
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomeRoute />} />
        <Route path="learn" element={<LearnIndexRedirect />} />
        <Route path="learn/:stageId" element={<LearnRoute />} />
        <Route path="play" element={<Navigate to="/play/free" replace />} />
        <Route path="play/:mode" element={<PlayRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
```

- [ ] **Step 5: Make LearnPage route-controlled**

Replace the component signature and remove internal selection state in `src/components/LearnPage.tsx`:

```tsx
import { LEARNING_STAGES, type LearningStageId, getStageById } from '../learningPath';
import { LessonWorkspace } from './LessonWorkspace';
import { PathwayTimeline } from './PathwayTimeline';

type Props = {
  stageId: LearningStageId;
  onSelectStage: (id: LearningStageId) => void;
  onPractice: (stageId: string) => void;
};

export function LearnPage({ stageId, onSelectStage, onPractice }: Props) {
  const completedStageIds: LearningStageId[] = [];
  const selectedStage = getStageById(stageId) ?? LEARNING_STAGES[0];

  return (
    <section className="page-stack">
      <div className="start-here-panel">
        <h1>Start with the 2×2 skill path</h1>
        <p>
          The 2×2 teaches corner movement without edge complexity. Once you can solve corners deliberately,
          the 3×3 becomes a layer-building problem.
        </p>
        <div className="start-here-actions">
          <button className="primary" onClick={() => onSelectStage('2x2-orientation')}>
            Begin Lesson 1: Orientation
          </button>
          <button onClick={() => onSelectStage('3x3-white-cross')}>
            Jump to 3×3 beginner path
          </button>
        </div>
      </div>

      <PathwayTimeline
        currentStageId={selectedStage.id}
        completedStageIds={completedStageIds}
        onSelectStage={onSelectStage}
      />

      <LessonWorkspace stage={selectedStage} onPractice={onPractice} />
    </section>
  );
}
```

(The hardcoded `completedStageIds` and the "start here" banner get replaced by the real sidebar + progress in Phase 2 — this task only re-plumbs navigation.)

- [ ] **Step 6: Rewrite main.tsx with providers, router, fonts, and token styles**

```tsx
// src/main.tsx
import '@fontsource-variable/outfit';
import './styles/tokens.css';
import './styles/base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProgressProvider } from './progress/ProgressContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ProgressProvider>
  </StrictMode>,
);
```

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: PASS — including the updated `App.test.tsx`. If any old assertion still clicks a nav *button*, switch it to `link` role.

- [ ] **Step 8: Lint and build**

Run: `npm run lint && npm run build`
Expected: both clean. (`styles.css` keeps `.topbar` rules that are now unused — they are deleted in Phase 4's CSS migration, not now.)

- [ ] **Step 9: Manual smoke check**

Run: `npm run dev` (background), open `http://127.0.0.1:5174/`, verify: topbar shows brand + Learn/Play links + `0/10 skills` chip; `/learn` lands on lesson 1 with URL `/learn/2x2-orientation`; browser back/forward works; `/play/scan` opens scan mode; refresh on a deep URL still renders (vite history fallback). Stop the server.

- [ ] **Step 10: Commit**

```bash
git add src/app/AppLayout.tsx src/App.tsx src/main.tsx src/components/LearnPage.tsx src/App.test.tsx
git commit -m "feat: URL routing, app shell with live progress chip, route-controlled Learn page"
```

---

### Task 7: Phase verification

**Files:** none created — verification only.

- [ ] **Step 1: Full suite**

Run: `npm test && npm run lint && npm run build`
Expected: everything green.

- [ ] **Step 2: Verify the cube engine is untouched**

Run: `git diff main -- src/cube.ts src/trainer.ts src/cube.test.ts src/trainer.test.ts` *(adjust base ref if working on a branch off main)*
Expected: empty diff.

- [ ] **Step 3: Mark phase complete in the plan doc and commit any checkbox updates**

```bash
git add docs/superpowers/plans/2026-07-04-ux-overhaul-phase-1-foundations.md
git commit -m "docs: phase 1 foundations plan executed"
```

---

## Self-Review (performed at authoring time)

- **Spec coverage (phase 1 slice):** routing/redirect rules → Task 6; progress store + schema v1 + streak rules → Task 2; unlock/test-out semantics + current-stage selector → Task 3; context/hook (`useSyncExternalStore`) → Task 4; tokens incl. dark palette + reduced-motion → Task 5; dependency housekeeping → Task 1. Deferred per spec: theme toggle, sidebar, challenges, Play decomposition, CSS migration (Phases 2–4). `vercel.json` SPA rewrite already exists — no task needed.
- **Placeholder scan:** none — all steps carry code or exact commands. Version numbers in Task 1 are explicitly "use Step 1 output".
- **Type consistency:** `ProgressStore` method signatures identical across Tasks 2/3/4/6; `LearnPage` props in Task 6 Step 5 match `LearnRoute` usage in Step 4; selector names (`getCurrentStageId`, `getCompletedCount`, `getGroupProgress`) consistent between Tasks 3 and 6.

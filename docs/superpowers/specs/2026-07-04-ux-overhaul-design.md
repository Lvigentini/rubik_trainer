# Rubik Trainer UX Overhaul — Design Spec

Date: 2026-07-04
Status: Approved design (all sections approved by Lorenzo, 2026-07-04)
Precursor: `docs/plans/2026-07-04-ux-overhaul-review-and-plan.md` (review + open questions)

## Goals

1. Intuitive UI across Home, Learn, and Play.
2. A distinctive, polished look & feel ("playful & tactile") suitable for a public product.
3. Learn restructured around guided discovery: side navigation, challenge-first lessons,
   real progress and motivation.
4. Persistence **planned** (interface + schema now, in-memory only this round; storage adapters
   in later phases).

Audience: real learners (kids and adults) — this is a shareable product, not a demo.

## Decisions (from brainstorming, 2026-07-04)

| Question | Decision |
| --- | --- |
| Audience/ambition | Polished product for real learners |
| Learn model | Guided discovery (challenge first, hint ladder, self-check gate, unlock) |
| Visual personality | Playful & tactile (cube-derived accents, chunky, springy) |
| Persistence end-state | Local-first, accounts-ready (`ProgressStore` interface, versioned schema) |
| Scope this round | Full overhaul, delivered in reviewable phases |

## 1. Information architecture & routing

Add `react-router-dom`. Routes:

- `/` — Home. First visit: one-screen explanation of the product (what guided discovery +
  scan coach are) with a single primary CTA into Learn. Returning learner: a **Resume card**
  ("Continue: Lesson 4 — Orient the last layer") as the primary element, driven by ProgressStore,
  plus secondary entries to Play modes.
- `/learn` — redirects to the learner's current lesson (first incomplete stage; falls back to
  stage 1).
- `/learn/:stageId` — a lesson. Deep-linkable. Unknown `stageId` → redirect to `/learn`.
- `/play` — redirects to `/play/free`.
- `/play/:mode` — `free` | `coach` | `scan`. Unknown mode → redirect to `/play/free`.

App shell: slim top bar with brand, Learn, Play, and a compact progress summary chip
("4/10 skills"). No version badge in the brand. The old three-CTA hero and feature-card marketing
layout are removed.

## 2. Learn — guided discovery

### Layout

Two-pane: persistent **curriculum sidebar** (left) + **lesson view** (right). On narrow
viewports (<900px) the sidebar collapses into a top drawer toggled from the lesson header.

Sidebar contents:

- Groups ("2×2 Foundation", "3×3 Beginner") with per-group progress (e.g., 3/5).
- Each lesson: status icon (done ✓ with mastery cubies / current ▸ / locked 🔒), title, level.
- Locked lessons are visible (never hidden) and show what unlocks them.
- Current route's lesson is highlighted; clicking navigates (router link).

### Lesson experience (four beats)

1. **Challenge first.** Lesson opens with a goal statement and an embedded interactive cube
   preset to a scenario (per-lesson scramble/setup). The learner is invited to try before
   reading anything. Challenge completion is detected live by a predicate on cube state.
2. **Hint ladder.** A "Stuck?" control reveals help in stages:
   - Level 1: concept nudge (one sentence).
   - Level 2: the lesson's steps + before/after diagram (current lesson content).
   - Level 3: demonstrated moves — the solution algorithm plays on the embedded cube,
     move by move, with the learner stepping through.
   Hints are never blocked or shamed; they only affect mastery.
3. **Self-check gate.** Existing self-check cards (multiple choice with per-option
   explanations) must be answered correctly to complete the lesson. Failing lets the learner
   retry after re-reading (options reshuffled).
4. **Completion & mastery.** Completing (challenge done + self-check passed) awards mastery:
   - 3 cubies: no hints (or level 1 only) + self-check right first try.
   - 2 cubies: used hints up to level 2, or needed a self-check retry.
   - 1 cubie: used the full demo (level 3).
   Completion triggers a brief sticker-confetti celebration and unlocks the next lesson.
   Mastery can be improved by redoing a lesson later.

### Progression rules

- Linear unlock within a group; the 3×3 group unlocks when the 2×2 Foundation is complete.
- **Test out:** any locked lesson offers "I know this — test out": pass its self-check
  (no hints available) to mark it complete at 2 cubies and unlock onward. Soft gating, no
  hard walls.
- Unlock logic is pure functions over progress state (`progress/unlocks.ts`), unit-tested.

### Content model additions

`learningPath.ts` stages gain a `challenge` definition:

```ts
type Challenge = {
  setup: Turn[];            // applied to a solved cube to create the scenario
  goal: ChallengeGoalId;    // references a predicate in challenges.ts
  goalText: string;         // human statement of the goal
  conceptHint: string;      // hint level 1
  demoAlgorithm?: Turn[];   // hint level 3 (falls back to inverse of setup)
};
```

`challenges.ts` implements goal predicates over cube state — e.g. `one-face-uniform`,
`first-layer-solved`, `white-cross-formed`, `top-face-uniform`, `cube-solved` — each unit-tested
against known cube states. Lesson 1 (notation) uses a "perform these turns" goal (match a
target sequence) rather than a state predicate.

## 3. Play

Three clearly differentiated modes, each with a one-line description in the mode picker:

- **Free Play** (`/play/free`): sandbox cube, scramble, reset, optional timer, move history,
  keyboard controls.
- **Solve Coach** (`/play/coach`): scramble + step-through of the known solution (inverse
  scramble), "apply next move" / "finish solve". When launched from a lesson ("Practise this
  skill"), shows the skill context and uses a scramble targeting that skill (the lesson's
  challenge setup).
- **Scan Coach** (`/play/scan`): three-face assistant in a single unified column — palette,
  face editors, completeness, and warnings together (no more split panels).

Scoring: the fake always-on "score preview" is removed. A score card appears only after a real
event — solve completed in Solve Coach, or timer stopped on a solved cube in Free Play — using
`calculateLessonScore` with actual values. Completed sessions are recorded via
`ProgressStore.recordPracticeSession`.

Component decomposition (from the 689-line `PracticePage`):

- `components/cube/CubeWorkspace.tsx` — cube 3D view, band selection, rotate controls, tilt,
  move history, keyboard handling. Shared by Play modes and (in compact form) Learn challenges.
- `components/play/FreePlayPanel.tsx`, `SolveCoachPanel.tsx`, `ScanCoachPanel.tsx`.
- `components/cube/FaceEditor.tsx` extracted as-is.

## 4. Visual design system — "playful & tactile"

- **Tokens** (`styles/tokens.css`): warm neutral surface ramp; the six cube sticker colours as
  the accent system (green = success, red = danger, orange/yellow = warning, blue = info,
  white/yellow reserved for highlights); light + dark themes via `prefers-color-scheme` with a
  manual toggle persisted per device (UI preference — allowed to use localStorage now; it is not
  learning progress).
- **Type:** friendly geometric display face for headings + readable sans for body, self-hosted;
  exact faces chosen during implementation with the frontend-design skill. No more 4rem
  marketing hero — consistent, tool-like density.
- **Shape language:** rounded-square "sticker" motif (cards, badges, sidebar status chips)
  instead of generic pills; chunky cards with visible edges and soft depth.
- **Motion:** tactile press states (buttons depress), springy CSS transitions on cube turns,
  lesson completion sticker-confetti (CSS/SVG, no library). Respect `prefers-reduced-motion`.
- **Responsive:** all layouts work to 360px; Learn sidebar collapses <900px; Play stacks
  panels vertically <1000px.
- CSS split per area (`styles/tokens.css`, `base.css`, per-page files) replacing the single
  933-line `styles.css`.

## 5. Progress & persistence

### Interface (built this round)

```ts
type Mastery = 1 | 2 | 3;

interface ProgressStore {
  getSnapshot(): ProgressSnapshot;              // for React subscription
  completeLesson(stageId: LearningStageId, mastery: Mastery, hintsUsed: number): void;
  recordSelfCheck(stageId: LearningStageId, checkId: string, correct: boolean): void;
  recordPracticeSession(session: PracticeSession): void;
  subscribe(listener: () => void): () => void;
}
```

### Schema v1 (versioned JSON)

```ts
type ProgressSnapshot = {
  version: 1;
  lessons: Record<string, { completedAt: string; mastery: Mastery; hintsUsed: number; attempts: number }>;
  selfChecks: Record<string, { attempts: number; lastCorrectAt?: string }>;
  practice: { totalSessions: number; totalMoves: number; bestTimeMsBySize: Record<string, number> };
  streak: { current: number; best: number; lastActiveDate: string };  // ISO date, day-granular
};
```

Streak rules: completing a lesson or recording a practice session counts as activity for the
day. Consecutive active days increment `current`; a gap of one or more days resets it to 1 on
the next activity. `best` is the historical maximum of `current`.

### Phases

- **Phase A (this round):** `InMemoryProgressStore` + React context/hook
  (`useProgress()` via `useSyncExternalStore`). All progress UX is real; nothing persists across
  refresh yet. The store is created at app root — swapping implementations is one line.
- **Phase B (SHIPPED 2026-07-06):** `LocalStorageProgressStore` — same interface, JSON under
  `rubik-trainer-progress`, `version` field + migration function table. Corrupt/missing/unknown-
  version data falls back to an empty snapshot, never crashes; setItem failures (quota, private
  mode) degrade silently to in-memory. Decision recorded: streak days follow the DEVICE'S LOCAL
  calendar day (changed from UTC when streaks became persistent).
- **Phase C (future):** remote adapter — auth + Postgres (e.g. Neon via Vercel Marketplace).
  Sync strategy: last-write-wins per lesson record; local remains the source while offline.
  Not designed in detail here; the interface and versioned schema are the contract it must fit.

## 6. Technical housekeeping

- Pin all dependencies (replace `"latest"`); move `vite`, `typescript`, `@vitejs/plugin-react`
  to `devDependencies`; add `react-router-dom` (pinned).
- Directory structure:
  - `src/app/` — shell, routes, theme toggle.
  - `src/components/cube/`, `src/components/learn/`, `src/components/play/`, `src/components/home/`.
  - `src/progress/` — store interface, in-memory impl, unlock logic, context/hooks.
  - Content data modules stay at `src/` root (`learningPath.ts`, `selfChecks.ts`, `videos.ts`,
    `lessonDiagrams.ts`, new `challenges.ts`).
- Cube engine (`cube.ts`, `trainer.ts`) and its tests are untouched, except `calculateLessonScore`
  callers now pass real values.
- `docs/product.md` updated to reflect the new IA after implementation.

## Error handling

- Unknown routes/stage ids/modes → redirect (never a blank screen).
- Challenge predicates are pure and total — any cube state returns true/false.
- Progress store operations are synchronous and infallible in Phase A; Phase B defines the
  corrupt-data fallback above.
- Reduced-motion users get no confetti/springs, instant state changes.

## Testing

- Keep all existing tests. Update `App.test.tsx` for the router-based shell.
- New unit tests: challenge predicates (known states), unlock/test-out logic, mastery
  calculation, in-memory store behaviour, streak day-boundary logic.
- Component tests: sidebar status rendering from progress state; lesson completion flow
  (challenge done + self-check → unlock next); Play mode panels render per route.
- Manual verification per phase with the dev server (`npm run dev`).

## Delivery phases (each reviewable)

1. **Foundations:** dependency cleanup, router + app shell, design tokens + base styles,
   progress store (in-memory) + unlock logic.
2. **Learn:** sidebar, lesson view with challenge/hint ladder/self-check gate/mastery,
   challenges content for all 10 stages.
3. **Play:** decomposition, three modes, honest scoring, unified scan layout.
4. **Home + polish:** resume card, first-visit home, dark mode toggle, motion polish,
   responsive pass, docs update.

## Out of scope this round

- Any persistent storage of learning progress (Phase B/C).
- Backend, auth, accounts.
- New curriculum content beyond challenge definitions for existing stages.
- Camera-based scanning (scan stays manual entry).

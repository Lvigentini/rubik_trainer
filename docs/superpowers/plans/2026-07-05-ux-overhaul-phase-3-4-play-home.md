# UX Overhaul Phases 3+4 — Play, Home, Theme & Legacy Retirement (Accelerated Plan)

> Accelerated execution (user-requested): bigger tasks, implementer-designed code within pinned
> interfaces, single whole-branch review at the end instead of per-task review rounds.
> Spec: `docs/superpowers/specs/2026-07-04-ux-overhaul-design.md` §1, §3, §4, §5.

**Goal:** Honest, differentiated Play modes on a decomposed PracticePage; a resume-driven Home;
dark mode; full retirement of legacy `styles.css` onto the token system; the deferred a11y and
cleanup items.

## Global Constraints

- `src/cube.ts`, `src/trainer.ts` engine logic untouched (callers may now pass real values to
  `calculateLessonScore`; its implementation stays).
- All progress writes via `ProgressStore`. Learning progress stays in-memory. The THEME preference
  is a device UI preference and MAY use localStorage (key `rubik-trainer-theme`) — explicitly
  sanctioned by the spec.
- URL is the source of truth for Play mode: the in-page mode switcher must `navigate`, not set
  local state. `?skill=` context preserved on mode switches.
- The fake always-on "Completion score preview" is removed. A score card appears ONLY after a real
  completion event (defined per mode below), computed from real values.
- Mode vocabulary unified: one exported map in `src/components/play/modes.ts`; `PracticeSession.mode`
  uses the URL vocabulary (`free | coach | scan`).
- At the end of Phase 4: `src/styles.css` is DELETED; every page styles via
  `styles/tokens.css|base.css|learn.css|play.css|home.css|components.css`; both themes legible
  everywhere; `prefers-reduced-motion` respected everywhere.
- Tests/lint/build green after every task. TDD for logic; component tests for new behavior.

## Task 1 — Play restructure (Phase 3)

**Files:** create `src/components/play/{modes.ts, CubeWorkspace.tsx, FreePlayPanel.tsx, SolveCoachPanel.tsx, ScanCoachPanel.tsx}`; rewrite `src/components/PracticePage.tsx` as a thin route-driven shell; modify `src/App.tsx` (pass mode + onModeChange that navigates, preserving `?skill=`); update `src/App.test.tsx` Play block; extend `src/components/cube/FaceEditor` extraction if still inline.

**Interfaces (pinned):**
- `modes.ts`: `export type PlayMode = 'free' | 'coach' | 'scan'`; `export const PLAY_MODES: Record<PlayMode, { label: string; description: string }>` — labels: Free Play / Solve Coach / Scan Coach, one-line learner-side descriptions.
- `CubeWorkspace` owns the cube session (state, band selection, move history + undo/redo, keyboard map, tilt, scramble/reset) and exposes via props: `cubeSize`, `onSessionEvent(event)` callbacks or a render-prop/children API — implementer's choice, but Free Play and Solve Coach must share it and Scan Coach must reuse the cube view; no duplicated session logic between panels.
- Mode picker: segmented control with the three labels + descriptions; selecting navigates to `/play/{mode}` (keeps `?skill=`).
- **Completion events (the only score/record triggers):**
  - Solve Coach: cube becomes solved (use `isGoalMet('cube-solved-2x2'|'cube-solved')` from `src/challenges.ts` by cube size) after a scramble → show score card via `calculateLessonScore` with REAL values: optimalMoves = solution length, actualMoves = user+auto moves since scramble, elapsedSeconds = timer if running else time since scramble, targetSeconds = 90 (2×2) / 180 (3×3), hintsUsed = count of auto-applied solution moves, mistakes 0, streak = current store streak. Record `recordPracticeSession({ cubeSize, mode:'coach', moves, elapsedMs, solved:true })`.
  - Free Play: timer stopped while cube solved after a scramble → record session (`solved:true`) + show a compact "Solved!" card with time + best-time comparison from the store; no lesson-score breakdown. Unsolved sessions record nothing.
  - Scan Coach: no scoring; unified SINGLE-COLUMN layout (palette, import/clear, face editors, completeness, warnings together — no split panels).
- When `?skill=` present: "Reinforcing: {stage title}" chip; Solve Coach initial scramble = that stage's `CHALLENGES[stageId].setup` instead of a random scramble.
- Keyboard listener must not fire when Learn is mounted elsewhere — it lives in CubeWorkspace (mounted only in Play).

**Tests:** mode picker navigates (URL changes, `?skill=` kept); no score panel before completion; coach completion via "finish known solve" shows score with real move count and records a session (assert via a store injected through `renderApp`-style helper or exposed provider); free-play solved+timer flow records; scan single-column renders warnings; keyboard/undo/redo tests keep passing (move/adapt existing ones).

## Task 2 — Home rewrite + play/home styles (Phases 3+4)

**Files:** rewrite `src/components/HomePage.tsx` (+ keep `ScanCoachPreview` only if reused in first-visit state); create `src/styles/play.css`, `src/styles/home.css`; modify `src/main.tsx` imports; update `src/App.test.tsx` Home block.

- Home has two states driven by `useProgress()`:
  - **First visit** (0 lessons done): one-screen explanation — display-face headline (tool voice, not marketing scale), the three-panel scan/learn/practice concept row (reuse ScanCoachPreview), single primary CTA "Start learning" → `/learn`, secondary "Free play".
  - **Returning** (≥1 done): primary **Resume card** — "Continue: Lesson {level} — {title}" → `/learn/{getCurrentStageId()}` with overall progress (N/10 + group progress) and streak (current/best) from the store; secondary tiles for Free Play / Solve Coach / Scan Coach using `PLAY_MODES` descriptions.
- `play.css` + `home.css`: tokens only, sticker-chip shape language, tactile press states, no raw hex, reduced-motion blocks. The 3-column game layout stacks <1000px; Home works to 360px.
- **Tests:** first-visit shows Start learning; after completing a lesson via store injection, Home shows the resume card pointing at the current stage; streak renders.

## Task 3 — Theme toggle + legacy retirement + deferred cleanups (Phase 4)

**Files:** create `src/app/ThemeToggle.tsx`; modify `src/app/AppLayout.tsx` (toggle in topbar), `src/styles/tokens.css` (system default via `@media (prefers-color-scheme: dark)` mirroring the `[data-theme='dark']` block, with explicit `[data-theme='light']` override), `src/styles/base.css`; create `src/styles/components.css` (shared: buttons, panels, self-check cards, video cards, scan editors, cube-stage 3D rules migrated from legacy); DELETE `src/styles.css` and its import in `App.tsx`.

- ThemeToggle: Sun/Moon icon button, cycles light/dark, sets `data-theme` on `<html>`, persists to localStorage `rubik-trainer-theme` (values 'light'|'dark'; absence = follow system), reads on startup via a tiny inline module imported first in `main.tsx` (no flash).
- Migrate every still-used rule from legacy `styles.css` onto tokens into the new files (cube 3D faces/stickers/grabbers/arrows, self-check cards incl. correct/incorrect states via `--color-success`/`--color-danger`, video cards, panels, buttons — square-ish `--radius-md`, not pills). Delete dead rules (topbar, pathway, start-here, hero, feature cards, score grid where superseded). Every page must be checked in BOTH themes.
- Deferred cleanups (from review ledger): aria-disabled + title ("Complete X to unlock") on locked sidebar chips; `aria-controls` + accessible name on the curriculum drawer; heading-level fix (sidebar group headers); consolidate group labels into `learningPath.ts` (export `GROUP_LABELS`) consumed by sidebar + LessonView; export `ORDERED_STAGES` from unlocks and use in LockedLessonView; remove whiteCross dead guard; ChallengePanel cosmetic nits; `hintsUsed` semantics — only overwrite when mastery improves (matching improve-only mastery; update store test).
- **Tests:** theme toggle flips `data-theme` and persists; locked chip a11y attributes present; store `hintsUsed` semantics test updated.

## Task 4 — Verification, docs, whole-branch review

- Full suite, lint, build; dev-server smoke of all routes in both themes; `docs/product.md` Home/Play sections updated; `README.md` refreshed if it references removed UI.
- Single whole-branch review (most capable model) with the ledger's deferred list; one fix wave; merge gate.

## Acceptance (whole phase)

Spec §1 Home behaviors, §3 Play modes/honest scoring/decomposition, §4 dark mode + tool-like density everywhere, §5 untouched (persistence remains in-memory + theme-pref exemption). No `styles.css`. No fake data anywhere in the UI.

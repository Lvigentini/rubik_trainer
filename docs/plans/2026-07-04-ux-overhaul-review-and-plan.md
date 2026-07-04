# Rubik Trainer — UX Overhaul: Review & Intermediate Plan

Date: 2026-07-04
Status: **Resolved** — all open questions answered (2026-07-04). The approved design lives in
`docs/superpowers/specs/2026-07-04-ux-overhaul-design.md`. This doc remains as the review record.

## 1. Review of the current prototype (v0.2.0)

### What's good (keep)

- **Clean data-driven core.** `learningPath.ts` (stages with skill/outcome/steps/mistake/self-checks),
  `selfChecks.ts`, `videos.ts`, `lessonDiagrams.ts` — content is separated from presentation. This
  survives any redesign.
- **Tested cube model.** `cube.ts` + `trainer.ts` with unit tests; scramble/inverse/partial-scan logic works.
- **Clear product intent.** `docs/product.md` states IA principles (Learn = understanding,
  Play = reinforcement; honest about scan limitations). The redesign should honour these.
- **Self-check cards** with explanations per option are a solid learning primitive.

### UI intuitiveness problems

1. **Learn page is a vertical dump.** "Start here" panel → horizontal two-group timeline → lesson
   workspace stacked below. Selecting a stage gives no scroll/response feedback; the lesson is below
   the fold. No side navigation, no persistent sense of "where am I in the curriculum".
2. **Progress is fake.** `LearnPage.tsx:12` hardcodes `completedStageIds = []`. The timeline's
   done/current/future states are unreachable — nothing ever completes, so the pathway never moves.
3. **Home CTAs are ambiguous.** "Start the skill pathway" / "Try scan coach" / "Free practice" —
   three doors with no explanation of what's behind them before clicking.
4. **Play page mode confusion.** Raw lowercase segmented control (`practice / guided / scan`);
   "guided" differs from "practice" only by a context label — same solution-replay panel.
5. **Misleading scoring.** `PracticePage.tsx:336` computes a "Completion score preview" from
   hardcoded inputs (hints 0, mistakes 0, streak 2) on every render — it's fiction presented as feedback.
6. **Scan mode UI is split** between a right-hand panel and a separate bottom panel (face editors
   below the fold) — one task, two disconnected places.
7. **No URLs.** Page switching is `useState`; refresh loses everything, lessons can't be deep-linked.

### Look & feel problems

- Generic AI-prototype aesthetic: Inter + indigo→sky gradient buttons + pill-everything + uniform
  white cards with soft shadows on slate. No personality; nothing says "cube".
- Marketing-scale hero type (up to 4rem) on what is actually a tool.
- Inconsistent density: huge hero vs cramped side panels; emoji-style arrows (↻ ↺) as controls.
- No dark mode; no responsive consideration below ~900px (three-column game layout).

### Learning-experience problems

- No side navigation (explicit user requirement).
- Lesson = wall of text: plain `<ol>` steps, one before/after diagram, quiz at the end.
- Zero motivation loop: no completion, no unlocking, no streaks, no "you've learned X of Y skills".
- Self-check results are discarded; "Practise this skill" is the only outcome.
- No interactivity inside lessons (the cube exists only in Play; lessons never show a live cube).

### Technical debt relevant to the redesign

- `PracticePage.tsx` is 689 lines handling three modes — needs decomposition.
- No router; no state persistence of any kind.
- `package.json`: everything `"latest"`, and build tooling (vite, typescript, plugin-react) sits in
  `dependencies`. Should be pinned and moved to `devDependencies`.
- 933-line single `styles.css` — fine for now, but a design-token pass is needed anyway.

## 2. Requirements (from user, 2026-07-04)

1. Make the UI intuitive.
2. Materially improve overall look & feel.
3. Restructure Learn: side navigation + a learning experience that motivates the user to figure
   things out (discovery-oriented, not just instructions).
4. **Plan** persistence (do not implement yet).

## 3. Open design questions (to resolve before spec)

- Audience & ambition: personal tool vs polished shareable product?
- Visual direction: what personality should it have?
- Learning model: how gamified? (completion/unlock/streaks vs lightweight progress)
- Persistence plan shape: localStorage-first vs schema designed for future accounts?
- Router adoption (URLs per lesson) in scope?

## 4. Candidate approaches (to be refined)

Sketch — final trade-offs go in the spec:

- **A. Targeted facelift** — keep IA, new design tokens, side nav in Learn, real progress state.
  Lowest effort, keeps current structure's weaknesses.
- **B. Learn-centred restructure (likely recommendation)** — app becomes curriculum-first: Learn is
  the home experience with persistent side nav, per-lesson pages with embedded interactive cube,
  completion mechanics; Play becomes the reinforcement surface; Home shrinks to a landing/resume
  screen. Persistence planned as versioned localStorage progress store behind a small interface.
- **C. Full rebuild** — new shell, router, design system, decomposed Practice, persistence
  interface + adapters. Highest effort; risks churn on working cube logic.

## 5. Persistence (plan-only, to be detailed in spec)

Direction to explore: a `ProgressStore` interface (get/set lesson completion, self-check results,
practice stats, streaks) with a versioned localStorage adapter first; schema designed so a future
remote adapter (accounts/DB) is a drop-in. No implementation in this phase beyond what the approved
design says.

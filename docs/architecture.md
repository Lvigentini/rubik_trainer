# Rubik Trainer architecture

Version: 0.2.0

## Product shape

The app is an agent-supported skills coach with three sections:

1. Home — Sell the product: agent-supported coaching, scan support, pathway entry.
2. Learn — Progressive skill pathway with visual lessons, self-checks, video references.
3. Play — Interactive cube, timer, scramble, scoring, scan assistant.

## Frontend modules

### App shell
- `src/App.tsx` — App shell + routing + shared state only.

### Pages
- `src/components/HomePage.tsx` — Hero, three-panel scan visual, feature cards.
- `src/components/LearnPage.tsx` — Start-here panel, pathway, lesson workspace.
- `src/components/PracticePage.tsx` — Play page with cube, timer, scoring.

### Learn components
- `src/components/PathwayTimeline.tsx` — Visual roadmap of stages.
- `src/components/LessonWorkspace.tsx` — Single lesson: diagram, steps, mistake, self-check, CTA.
- `src/components/SelfCheckCard.tsx` — Multiple-choice / visual-choice UI.
- `src/components/VideoReferenceCard.tsx` — External video link card.
- `src/components/CubeDiagram.tsx` — Flat-face SVG grids.

### Home components
- `src/components/ScanCoachPreview.tsx` — Three-panel scan illustration.

### Data modules
- `src/learningPath.ts` — Progressive learning stages (replaces guides.ts).
- `src/selfChecks.ts` — Self-check definitions and validation.
- `src/videos.ts` — Curated external video references.
- `src/lessonDiagrams.ts` — Encoded cube states for flat-face diagrams.
- `src/trainer.ts` — Scoring calculation (Play page only).
- `src/cube.ts` — Cube sticker model and move engine.

### Deprecated
- `src/guides.ts` — Content migrated to learningPath.ts.

## Scoring rule

Scoring belongs exclusively to Play. It depends on:
- completion, move count, timer, hint usage, mistakes, streaks

Learn explains skills. Play measures performance.

## Known product constraint

Three visible faces do not uniquely identify an arbitrary physical cube state. The scan coach provides partial-state guidance and asks for more views when needed.

## Deployment

Static Vite app deployed on Vercel. No server-side APIs. See vercel.json.

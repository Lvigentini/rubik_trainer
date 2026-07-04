# Rubik Trainer

Version: 0.1.2

Web prototype for a structured Rubik's Cube learning and practice app.

## App sections

- Home: calm front page and entry points.
- Learn: solving guides, approaches, curriculum, and reference material.
- Play: actual game/practice area with cube size, game modes, timer, scoring, scramble, and scan assistant.

## Current prototype focus

The app starts with 2×2 because the learner can focus on corner behaviour before adding 3×3 edge complexity.

Current capabilities:

- 2×2 and 3×3 selectable play surfaces.
- 3D cube UI.
- Scramble trainer with generated scrambles and inverse known-scramble guidance.
- Learning guides for 2×2, 3×3 beginner method, recognition drills, and camera-assisted solving.
- Three-face scan/manual entry for U/F/R faces.
- Game scoring and bonuses in the Play page.

Important constraint: three visible faces are not enough to uniquely reconstruct an arbitrary physical cube state. The app makes that explicit and should use three-face data for partial guidance, validation, or next-capture prompts unless the state is known from history.

## Dev docs

- `docs/architecture.md` — app structure, module ownership, cube-size/scoring design notes.
- `docs/development.md` — version policy, development log, current priorities, commit acceptance criteria.
- `docs/product.md` — product/design principles and app-section responsibilities.

## Commands

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build
```

Local dev server defaults to `http://127.0.0.1:5174`.

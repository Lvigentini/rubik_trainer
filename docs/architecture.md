# Rubik Trainer architecture

Version: 0.1.2

## Product shape

The app is split into three primary sections:

1. Home
   - First impression only.
   - No curriculum dump.
   - Entry points into Learn and Play.

2. Learn
   - Explanation and guide content.
   - Cube-solving strategies and approaches.
   - Lesson path descriptions.
   - No game scoring. Scoring belongs to active play only.

3. Play
   - Actual interactive cube/game workspace.
   - Cube size selector.
   - Game mode selector.
   - Timer, scramble, moves, scan/practice tools.
   - Scoring and bonuses shown in the context of gameplay.

## Current frontend modules

- `src/App.tsx`
  - App shell, section navigation, current prototype UI.
  - Owns transient UI state: active page, selected cube size, selected approach, selected game mode, timer, scan state, current cube.

- `src/cube.ts`
  - Cube sticker model and move engine.
  - Current engine is a 3×3 sticker-state model.
  - The 2×2 mode currently renders and scans only corner stickers while reusing the same move engine.

- `src/trainer.ts`
  - Testable trainer domain data.
  - Cube sizes, approaches, lessons, scoring calculation.

- `src/guides.ts`
  - User-facing learning/reference content.
  - This is separate from scoring and game state.

- `src/*.test.ts(x)`
  - Domain tests for cube/trainer logic.
  - UI tests for section separation and 2×2 rendering contract.

## 2×2 implementation status

Current 2×2 mode is a prototype-level representation:

- visible cube faces render four corner stickers per face
- scan mode renders four stickers per visible face
- scramble length is shorter in 2×2 mode
- move engine still uses the 3×3 sticker model internally

Needed later:

- true 2×2 cubie model or a generalized NxN model
- 2×2-specific solving algorithms
- 2×2-specific move validation and stage detection

## Scoring rule

Scoring is a gameplay feedback system, not educational copy.

It belongs in Play because it depends on:

- completion
- move count
- timer
- hint usage
- mistakes
- streaks

Learn can explain that scoring exists, but should not render live score previews or game bonus cards.

## Known product constraint

Three visible faces do not uniquely identify an arbitrary physical cube state. The app should never claim exact solving from only one U/F/R observation unless the cube state is known from prior history.

Acceptable flows:

- known scramble/history -> exact inverse solution
- six-face scan -> exact reconstruction path later
- multi-shot scan -> accumulate observations
- three-face scan -> partial guidance, validation, next capture request

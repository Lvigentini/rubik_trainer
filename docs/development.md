# Rubik Trainer development tracking

Version: 0.1.2

## Version policy

Use semantic versions in `x.x.x` form.

Every committed app change must bump at least the patch version in:

- `package.json`
- `package-lock.json`
- visible app chrome where the version is displayed

## Development log

### 0.1.0

Initial web prototype.

- Vite React TypeScript app
- 3D cube visual
- basic move engine
- scramble generation
- inverse known-scramble solving
- three-face manual scan prototype

### 0.1.1

Information architecture split.

- Home / Learn / Play sections
- cleaner home page
- learning path moved away from game surface
- Play page contains cube controls and mode selection

### 0.1.2

Guide/content and game separation correction.

- real guide content added in `src/guides.ts`
- scoring moved out of Learn and into Play
- 2×2 selected mode now renders a 2×2 visual surface
- scan mode uses 2×2 or 3×3 visible sticker counts
- architecture and development docs added under `docs/`

## Current priorities

1. Make 2×2 a real first-class game mode.
   - true 2×2 state model or generalized cube-size abstraction
   - 2×2 stage detection
   - 2×2 solve/practice modes

2. Expand guides into structured lessons.
   - notation
   - 2×2 first layer
   - 2×2 last layer orientation/permutation
   - 3×3 beginner method
   - recognition drills

3. Tie scoring to real gameplay events.
   - completed stage detection
   - actual hint usage
   - mistakes from illegal/wrong-stage moves
   - streak tracking across attempts

4. Improve scan workflow.
   - separate three-face partial scan from six-face full scan
   - prompt next cube rotation
   - validate color counts per cube size

## Acceptance criteria for future commits

Before commit:

- bump patch/minor/major version as appropriate
- run `npm run lint`
- run `npm run test`
- run `npm run build`
- browser smoke-test touched flows
- commit only after verification passes

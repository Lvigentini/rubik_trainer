---

# Rubik Trainer: Learn & Home Redesign Brief

## Executive Summary

The current app positions itself as a "quiet trainer" — a generic practice tool with text-dump guides. The actual differentiator (three-face visual scan → agent-supported diagnosis → progressive skill building) is buried in a game mode toggle. This redesign repositions the product as a **skills coach** and rebuilds Home and Learn to match.

---

## 1. Home Page: Repositioning

### Current Problems
- Hero says "Practice cube solving with structure" — generic, could be any cube app
- Primary CTA is "Start playing" — frames the product as a game
- The cube card shows stats ("Start: 2×2 / Next: 3×3 / Modes: practice · guided · scan") that mean nothing to a new user
- The scan coach — the real differentiator — is invisible from Home
- No mention of agent-supported guidance anywhere

### Redesigned Home

**Hero block:**
- Headline: "Learn the cube with an AI coach watching your progress."
- Subhead: "Start with 2×2 fundamentals to learn corners. Scan three visible faces when stuck. Build skills with guided practice, not memorized chaos."
- Primary CTA: "Start the skill pathway" → navigates to Learn, first lesson
- Secondary CTA: "Try scan coach" → navigates to Play in scan mode
- Tertiary link: "Free practice" → Play in practice mode

**Three-panel visual** (replaces the generic cube card):
1. **"Show 3 faces"** — miniature U/F/R flat face diagrams with a camera icon
2. **"Coach diagnoses"** — speech-bubble mock: "Two first-layer corners solved. Protect them, insert this corner next."
3. **"Practise the skill"** — mini cube + completion badge

This is an SVG/React illustration, not a stock image. It communicates the core loop in one glance.

**Feature cards** (3 cards below hero):
1. **Visual Scan Coach** — "Enter visible faces; the coach gives partial-state guidance and asks for more views when needed."
2. **Skills Pathway** — "Follow a sequence from orientation → first face → layers → last layer → recognition."
3. **Practice Loops** — "Every lesson ends with a short challenge and self-check so you know whether you understood it."

**What gets removed from Home:**
- Cube size selector
- Generic stats row
- "Read the guide" framing (replaced with pathway entry)
- The interactive 3D cube (save it for Play)

### Acceptance Criteria — Home
- [ ] Hero headline contains "AI coach" or "agent-supported"
- [ ] "Show three faces" / scan coach concept visible above fold
- [ ] "Skills pathway" mentioned
- [ ] Practice framed as reinforcement, not the primary promise
- [ ] No score tables, no move pad, no full lesson lists
- [ ] Three-panel visual renders as SVG/React, not external images

---

## 2. Learn Page: Overhaul

### Current Problems
- No start point. User lands on a grid of cube-size cards and approach cards — choice paralysis before any learning happens
- Guide content (`GUIDE_SECTIONS`) is four text cards with bullet-point steps — not instruction, not visual, not progressive
- No diagrams, no before/after states, no visual examples of what "solved" means
- No self-checks — no way to verify understanding before practice
- No video references
- Lesson path is a sidebar strip of chips with level/scoring metadata — meaningless to a beginner
- The "Current focus" card shows par moves, target seconds, and scoring focus — these are game metrics, not learning concepts

### Redesigned Learn

**Top "Start Here" panel:**
- Title: "Start with the 2×2 skill path"
- Why: "The 2×2 teaches corner movement without edge complexity. Once you can solve corners deliberately, the 3×3 becomes a layer-building problem."
- Three CTAs: "Begin Lesson 1: Orientation" / "Jump to 3×3 beginner path" / "I'm stuck — use Scan Coach"

**Pathway Timeline** (visual horizontal/vertical roadmap):
- Shows all stages as connected nodes, not disconnected chips
- Current stage highlighted, completed stages checked, future stages dimmed
- Grouped: **2×2 Foundation** (5 stages) → **3×3 Beginner** (5 stages) → **Improvement** (future)

**Lesson Workspace** (the main content area when a stage is selected):
Each lesson follows a rigid template:

| Section | Content |
|---------|---------|
| **Title** | e.g., "One face is not enough" |
| **What you're learning** | One-sentence skill statement |
| **Why it matters** | One-sentence motivation |
| **Diagram** | SVG flat-face or controlled 3D state — NOT a random scramble |
| **Steps** | Numbered instruction (3–5 steps max) |
| **Common mistake** | Callout box with the #1 error |
| **Mini self-check** | Multiple-choice or visual-choice question with targeted feedback |
| **Practice CTA** | "Practise this skill" → launches Play in guided mode with lesson context |
| **Video reference** | External link card (not embed) to a relevant tutorial |

**Diagram types needed (all SVG/React, data-driven):**
1. **Flat face grids** — 2×2 (4 stickers) and 3×3 (9 stickers) per face, showing solved/unsolved states
2. **Controlled 3D states** — reuse `Cube3D` component with lesson-specific state props (not arbitrary scramble)
3. **Before/after strips** — "Before → Move → After" for corner insertion, cross building, etc.
4. **Correct vs. incorrect comparisons** — side-by-side diagrams for self-checks

**Self-check design:**
- Lightweight, not punitive
- Wrong answer → shows targeted explanation, does not block progress
- Correct answer → confirmation + "Practise this skill" CTA
- Types: multiple-choice, visual-choice (pick the correct diagram), sequence ordering
- Data model in `src/selfChecks.ts`

**Video references** (supplemental, not core):
- Display as link cards with creator, title, duration, and one-line relevance note
- Attached to specific stages, not dumped in a separate tab

**What gets removed from Learn:**
- Cube size selector grid (pathway handles cube progression)
- Approach selector grid (approaches fold into pathway stages)
- Par moves, target seconds, scoring focus metadata
- The current `GUIDE_SECTIONS` card grid (replaced by lesson workspace)

### Acceptance Criteria — Learn
- [ ] Page starts with "Start here" panel
- [ ] First visible path is 2×2 foundation
- [ ] Pathway timeline shows stage progression with visual state (done/current/future)
- [ ] Each lesson has: diagram, steps, common mistake, self-check, practice CTA
- [ ] At least one self-check per lesson with correct/incorrect feedback
- [ ] At least one video reference card visible
- [ ] No score cards, no move pad, no timer
- [ ] Diagrams are data-driven SVG/React, not external image assets

---

## 3. Information Architecture

### Navigation
Keep three tabs for now (renaming Play to Practice is a future consideration):

| Tab | Purpose |
|-----|---------|
| **Home** | Sell the product: agent-supported coaching, scan support, pathway entry |
| **Learn** | Progressive skill pathway with visual lessons, self-checks, video refs |
| **Play** | Interactive cube, timer, scramble, scoring, scan assistant |

### New Data Modules

**`src/learningPath.ts`** — replaces `GUIDE_SECTIONS` as the primary learning data:
- `LearningStage` type with: id, title, cubeSize, level, skill, outcome, steps, commonMistake, selfChecks, practiceMode, videoIds
- `LearningStageId` union type for all stages
- Ordered stages: orientation → first-face → corner-insertion → last-layer-orient → last-corner-permute → white-cross → first-layer-corners → middle-layer-edges → yellow-cross → last-layer-finish → recognition-drills
- `LessonStep` type for step-by-step instruction within each stage

**`src/selfChecks.ts`** — self-check definitions and validation:
- `SelfCheck` type: id, prompt, type ('multiple-choice' | 'sequence' | 'visual-choice'), options (id, label, explanation), answerIds
- Validation helper for checking answers
- At minimum one self-check per learning stage

**`src/videos.ts`** — curated external video references:
- `VideoReference` type: id, title, creator, url, duration, recommendedForStageIds, note

**`src/lessonDiagrams.ts`** — encoded cube states for diagrams:
- Data-driven diagram definitions (face color arrays, not hardcoded DOM)

### Components to Extract from `App.tsx`

Current `App.tsx` (436 lines) owns all rendering. Split into:

| Component | Responsibility |
|-----------|---------------|
| `src/components/HomePage.tsx` | Hero, three-panel visual, feature cards |
| `src/components/LearnPage.tsx` | Start-here panel, pathway, lesson workspace |
| `src/components/PracticePage.tsx` | Current Play page (renamed internally) |
| `src/components/PathwayTimeline.tsx` | Visual roadmap of stages |
| `src/components/LessonWorkspace.tsx` | Single lesson: diagram, steps, mistake, self-check, CTA |
| `src/components/SelfCheckCard.tsx` | Multiple-choice / visual-choice UI |
| `src/components/VideoReferenceCard.tsx` | External video link card |
| `src/components/CubeDiagram.tsx` | Flat-face SVG grids and before/after strips |
| `src/components/ScanCoachPreview.tsx` | Home page three-panel scan illustration |

`App.tsx` becomes app shell + routing + shared state only.

### What Happens to Existing Modules

| Module | Fate |
|--------|------|
| `src/guides.ts` | Deprecated. Content migrates into `learningPath.ts` stages. Remove after migration. |
| `src/trainer.ts` | Kept. Scoring stays for Play page. `LESSONS` array may merge with or reference `learningPath.ts` stages. |
| `src/cube.ts` | Unchanged. |

---

## 4. Curated Video Resources

These are for supplemental reference cards, not embeds. Verified via search:

| # | Video | Creator | Use For |
|---|-------|---------|---------|
| 1 | [Learn How to Solve a 2x2 Rubik's Cube (Beginner Tutorial)](https://www.youtube.com/watch?v=GANnG5a19kg) | J Perm | 2×2 foundation stages (orientation through permutation) |
| 2 | [Learn How to Solve a Rubik's Cube in 10 Minutes (Beginner Tutorial)](https://www.youtube.com/watch?v=7Ron6MN45LY) | J Perm | 3×3 beginner method stages (cross through last layer) |
| 3 | [Rubik's Cube Last Layer — Made Simple (Beginner Tutorial)](https://www.youtube.com/watch?v=DO3c860861s) | — | Last-layer stages specifically |
| 4 | [How to Solve a Rubik's Cube (Best Method 2025)](https://www.youtube.com/watch?v=PW2J8IblczM) | — | Alternative 3×3 reference for learners who prefer a different teaching style |
| 5 | [How to Solve the Rubik's Cube FASTER with the Beginner Method](https://www.youtube.com/watch?v=vmeleO65BHc) | J Perm | Improvement path — bridging beginner to CFOP |

Store metadata in `src/videos.ts`. Link only; do not copy transcripts.

---

## 5. Phased Implementation

### Phase 1: Product Docs & Test Contract
**Files:** `docs/product.md`, `docs/architecture.md`, `docs/development.md`, `src/App.test.tsx`

Update docs to reflect the new positioning. Write failing tests that assert:
- Home contains "AI coach" / "agent-supported" language, "three faces" concept, "skills pathway"
- Learn contains "Start here", pathway stages, at least one self-check region, at least one video reference region

**AC:** Tests written and failing. Docs updated. `npm run lint` passes.

### Phase 2: Learning Data Model
**Files:** Create `src/learningPath.ts`, `src/selfChecks.ts`, `src/videos.ts`, `src/learningPath.test.ts`. Deprecate `src/guides.ts`.

Build the structured pathway data with 10+ stages, each having steps, common mistake, self-checks, practice mode, and video references.

**AC:** Every stage has ≥1 self-check and ≥1 outcome. Stage levels are ordered. Tests pass.

### Phase 3: Visual Diagram System
**Files:** Create `src/components/CubeDiagram.tsx`, `src/lessonDiagrams.ts`, tests.

SVG flat-face diagrams for 2×2 and 3×3. Correct-vs-incorrect comparison diagrams. Accessible labels.

**AC:** Renders 2×2 and 3×3 flat diagrams. Uses existing color palette. Has accessible labels. Tests pass.

### Phase 4: Self-Check UI
**Files:** Create `src/components/SelfCheckCard.tsx`, tests.

Multiple-choice UI with targeted feedback on wrong answers, confirmation + next CTA on correct.

**AC:** Renders prompt and options. Wrong → explanation. Correct → confirmation. Keyboard-accessible. Tests pass.

### Phase 5: Learn Page Rebuild
**Files:** Create `src/components/LearnPage.tsx`, `PathwayTimeline.tsx`, `LessonWorkspace.tsx`, `VideoReferenceCard.tsx`. Modify `App.tsx`, `App.test.tsx`.

Replace the current Learn rendering with the new component tree. Wire up pathway data.

**AC:** Learn starts with "Start here". Pathway shows 2×2 → 3×3 progression. Lesson workspace has diagram, steps, mistake, self-check, practice CTA. Video refs attached to stages. No score cards. Phase 1 tests pass.

### Phase 6: Home Page Repositioning
**Files:** Create `src/components/HomePage.tsx`, `ScanCoachPreview.tsx`. Modify `App.tsx`, `App.test.tsx`.

Build the new hero, three-panel visual, and feature cards.

**AC:** Hero says AI/agent-supported. Three-panel scan visual renders. Primary CTA goes to pathway. Practice is framed as reinforcement. Phase 1 tests pass.

### Phase 7: Practice Integration
**Files:** Modify/create `src/components/PracticePage.tsx`. Modify `App.tsx`, `trainer.ts`.

Practice can be launched from a learning stage with skill context. Score only shown during/after practice.

**AC:** Learn → Practice handoff works. Practice shows "Reinforcing: [skill name]". Scan mode honest about limitations.

### Phase 8: Version & Final Verification
**Files:** `package.json`, `package-lock.json`, `README.md`, `docs/development.md`

Bump to `0.2.0`. Update README to describe app as agent-supported skills coach.

**AC:** `npm run lint && npm run test && npm run build && git diff --check` all pass. Browser smoke test confirms Home and Learn are coherent.

---

## Open Decisions (Need Your Input)

1. **Scan Coach as top-level tab now, or keep in Play?** The existing plan recommends top-level. This adds a 4th nav item (Home / Learn / Scan Coach / Practice). Worth it?

2. **Embed videos or link-only?** Recommendation: link cards first. Embeds add weight and distract from native instruction. Revisit after the pathway is built.

3. **How honest about "AI coach"?** Until actual LLM/vision diagnosis exists, the scan coach is manual input with rule-based guidance. Recommendation: say "agent-supported guidance" and label scan as "prototype" — don't overstate capabilities.

---

Sources:
- [J Perm — Learn How to Solve a 2x2 Rubik's Cube (Beginner Tutorial)](https://www.youtube.com/watch?v=GANnG5a19kg)
- [J Perm — Learn How to Solve a Rubik's Cube in 10 Minutes (Beginner Tutorial)](https://www.youtube.com/watch?v=7Ron6MN45LY)
- [Rubik's Cube Last Layer — Made Simple (Beginner Tutorial)](https://www.youtube.com/watch?v=DO3c860861s)
- [How to Solve a Rubik's Cube (Best Method 2025)](https://www.youtube.com/watch?v=PW2J8IblczM)
- [How to Solve the Rubik's Cube FASTER with the Beginner Method](https://www.youtube.com/watch?v=vmeleO65BHc)

---

## 6. Vercel Deployment Requirements

This project must remain deployable on Vercel as a static Vite/React app.

### Current build shape

`package.json` already has the correct production build command:

```bash
npm run build
```

This runs:

```bash
tsc -b && vite build
```

Vite emits the deployable static site to:

```bash
dist/
```

### Implementation requirements

Add or verify:

- `vercel.json` with explicit static app settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- README deployment section:
  - Vercel project framework: Vite
  - Build command: `npm run build`
  - Output directory: `dist`
  - Install command: `npm install`

- Optional local production check:

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4173
```

### Vercel acceptance criteria

- [ ] `npm run build` passes locally.
- [ ] `dist/index.html` is generated.
- [ ] `vercel.json` exists and points to `dist`.
- [ ] SPA refresh/deep-link fallback works via rewrite to `/index.html`.
- [ ] README documents Vercel deployment settings.
- [ ] No server-only APIs are introduced in this overhaul.
- [ ] Any future camera/vision feature degrades safely in browser-only deployment.

### Architecture implication

The first overhaul should stay client-side only. Agent/vision functionality can be represented as:

- rule-based guidance from manual visible-face input
- future API boundary documented but not implemented yet
- honest UX copy: “agent-supported guidance” / “scan coach prototype” until backend vision/LLM support exists

If real image upload or LLM diagnosis is added later, it needs a separate backend/API design phase rather than being hidden inside the static Vercel frontend.


---

## Claude Code Execution Prompt

Once ready to implement, run Claude Code from `/Users/lor/_coding/rubik_trainer` with:

```bash
claude -p "Implement docs/plans/learn-home-agent-supported-overhaul.md task-by-task. Do not push. Use TDD where practical. Keep scoring out of Learn. Reposition Home around agent-supported skill building, three-face visual scan support, skills pathway, and practice as reinforcement. Rebuild Learn as a progressive visual pathway with diagrams, mini self-checks, and video reference cards. Keep the app deployable on Vercel as a static Vite app; add vercel.json and README deployment docs. Bump version to 0.2.0. Verify with npm run lint, npm run test, npm run build, git diff --check, and browser smoke tests." --allowedTools "Read,Edit,Write,Bash,WebSearch,WebFetch" --max-turns 30
```

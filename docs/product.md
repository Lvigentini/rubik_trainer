# Rubik Trainer product notes

Version: 0.2.0

## Design principles

- Agent-supported skills coach: the app helps learners build cube-solving skills progressively.
- Three-face visual scan support: enter visible faces for partial-state guidance.
- Separate explanation from practice. Learn is for understanding; Play is for reinforcement.
- Start with 2x2 because it teaches corner behaviour before 3x3 edge complexity.
- Be honest about scan uncertainty and agent capabilities.
- Practice as reinforcement, not the primary promise.

## App sections

### Home

Purpose: orient the learner — explain the product on first visit, resume progress after.

Should include:

- First visit (no lessons completed): one-screen explanation, three-panel concept visual, primary CTA "Start learning", secondary "Free play"
- Returning: resume card ("Continue: Lesson N — Title") driven by real progress, overall + group progress, streak, secondary tiles for the three Play modes

Should not include:

- Marketing-scale hero or feature cards
- Cube size selector
- Generic stats row
- Score tables
- Move pad
- Full lesson lists
- Interactive 3D cube (reserved for Play)

### Learn

Purpose: guided-discovery curriculum — figure it out first, read second, with real progress.

Should include:

- `/learn` opens the learner's current lesson (first incomplete stage); every lesson is deep-linkable at `/learn/:stageId`
- Curriculum sidebar ("sticker sheet"): groups with done/total counts, per-lesson status (done ✓ / current / locked), mastery cubies (1–3)
- Challenge-first lesson: goal statement + embedded interactive cube preset to a scenario; goal detection is live
- Hint ladder, never punished but mastery-relevant: concept nudge → steps + diagram + common mistake → watch-the-moves demo
- Self-check gate (answer correctly to complete; retry allowed)
- Completion: mastery cubies, sticker celebration, next-lesson link, practice CTA
- Locked lessons stay visible and offer "test out" (pass the self-check, no hints, mastery 2)
- Video reference cards attached to specific stages

Should not include:

- "Start here" marketing panel or pathway timeline (replaced by the sidebar)
- Score cards or score previews
- Game timer
- Move pad
- Scramble controls
- Cube size selector grid
- Approach selector grid

### Play

Purpose: practice with honest feedback. Mode lives in the URL (/play/free|coach|scan).

Should include:

- Mode picker (Free Play / Solve Coach / Scan Coach) with one-line descriptions; switching navigates
- Cube size selection, 3D cube, move controls, undo/redo, keyboard, timer, scramble/reset
- Scoring ONLY after a real completion event (coach: cube solved; free play: timer stopped on solved cube) with real values; sessions recorded to progress
- Scan Coach: single-column three-face assistant with honest limitations
- Skill context when launched from Learn ("Reinforcing: [skill name]"; coach scramble uses that lesson's challenge setup)

## Game modes

### Free Play

Sandbox: scramble, optional timer, solved-detection records the session and best time.

### Solve Coach

Step-through of the known solution (inverse scramble) with per-move assistance; real score card on completion.


### Scan Coach

Manual state-gathering assistant. Three visible faces provide partial guidance.
Honest about limitations: "agent-supported guidance" / "scan coach prototype" until backend vision/LLM support exists.

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

Purpose: sell the product — agent-supported coaching, scan support, pathway entry.

Should include:

- Hero: "Learn the cube with agent-supported guidance watching your progress."
- Three-panel scan visual (Show 3 faces / Coach diagnoses / Practise the skill)
- Skills pathway mention and CTA
- Practice framed as reinforcement (tertiary action)
- Feature cards: Visual Scan Coach, Skills Pathway, Practice Loops

Should not include:

- Cube size selector
- Generic stats row
- Score tables
- Move pad
- Full lesson lists
- Interactive 3D cube (reserved for Play)

### Learn

Purpose: progressive visual pathway with lessons, self-checks, and video references.

Should include:

- "Start here" panel pointing to 2x2 foundation
- Pathway timeline showing stage progression (done/current/future)
- Lesson workspace: diagram, steps, common mistake, self-check, practice CTA
- Video reference cards attached to specific stages
- SVG/React data-driven diagrams

Should not include:

- Score cards or score previews
- Game timer
- Move pad
- Scramble controls
- Cube size selector grid
- Approach selector grid

### Play

Purpose: actual game/practice with scoring.

Should include:

- Cube size selection
- Game mode selection
- 3D cube surface
- Move controls
- Timer
- Scramble/reset
- Scoring and bonuses
- Scan assistant when scan mode is active
- Skill context when launched from Learn ("Reinforcing: [skill name]")

## Game modes

### Practice

Free move practice with scramble and inverse-solution assistance.

### Guided

Lesson-aware coaching with skill context from the learning pathway.

### Scan

Manual state-gathering assistant. Three visible faces provide partial guidance.
Honest about limitations: "agent-supported guidance" / "scan coach prototype" until backend vision/LLM support exists.

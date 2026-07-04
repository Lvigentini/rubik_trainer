# Rubik Trainer product notes

Version: 0.1.2

## Design principles

- Beautiful, calm web design over marketing splash.
- Separate explanation from play.
- Treat the cube as the centre of the game page.
- Start with 2×2 because it teaches corner behaviour before 3×3 edge complexity.
- Be honest about scan uncertainty.

## App sections

### Home

Purpose: orientation and entry.

Should include:

- app identity
- quiet value statement
- primary action into Play
- secondary action into Learn
- visual cube presence

Should not include:

- long guides
- scoring tables
- scan warnings
- full lesson path

### Learn

Purpose: reference and learning material.

Should include:

- solving strategies
- guide content
- learning path/stages
- explanation of why 2×2 comes first
- camera/scan limitations

Should not include:

- active score previews
- game timer
- move pad
- scramble controls

### Play

Purpose: actual game/practice.

Should include:

- cube size selection
- game mode selection
- cube surface
- move controls
- timer
- scramble/reset
- scoring and bonuses
- scan assistant when scan mode is active

## Game modes

### Practice

Free move practice with scramble and inverse-solution assistance.

### Guided

Should evolve into lesson-aware coaching:

- current objective
- next strategic target
- allowed hints
- stage completion detection
- scoring only after a game/stage attempt

### Scan

Manual/camera-assist state collection.

Current state:

- U/F/R entry
- 2×2 renders 4 visible stickers per face
- 3×3 renders 9 visible stickers per face

Future state:

- six-face workflow
- multi-shot observation tracking
- computer vision color detection

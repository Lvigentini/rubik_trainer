# Rubik Trainer

Web prototype for a Rubik's Cube solve assistant.

## Prototype focus

The intended product flow is: capture the three visible cube faces, reconstruct as much of the cube as possible, and guide the user toward a solve.

Important constraint: three visible faces are not enough to uniquely reconstruct an arbitrary physical cube state. The prototype makes that explicit. It supports:

- Manipulable 3D cube UI.
- Scramble trainer with generated scrambles and inverse-solution guidance.
- Three-face scan/manual entry for U/F/R faces.
- Confidence messaging when only partial state is known.
- A path toward full-state scanning or computer-vision-assisted face capture later.

## Commands

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build
```

Local dev server defaults to `http://127.0.0.1:5174`.

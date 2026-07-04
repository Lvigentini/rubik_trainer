# Rubik Trainer

Version: 0.2.0

An agent-supported cube-solving skills coach. Start with 2×2 fundamentals, follow a progressive pathway, and use scan support when stuck.

## App sections

- Home: agent-supported learning value prop, skills pathway entry, scan-coach preview.
- Learn: progressive visual pathway with diagrams, mini self-checks, and video references.
- Play: interactive cube, timer, scramble, scoring, and scan assistant.

## Development

```bash
npm run dev      # local dev server on http://127.0.0.1:5174
npm run test     # vitest run
npm run lint     # eslint
npm run build    # production build to dist/
```

## Deployment

This app is configured for Vercel static deployment as a Vite app.

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`
- SPA fallback: `vercel.json` rewrites all paths to `index.html`

Local production preview:

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4173
```

## Planning docs

- `docs/plans/learn-home-agent-supported-overhaul.md` — current redesign plan
- `docs/architecture.md` — module architecture
- `docs/product.md` — product principles
- `docs/development.md` — dev tracking and version policy

## Stack

Vite + React + TypeScript + ESLint + Vitest.

## Video references

The app references curated YouTube tutorials for supplemental learning. See `src/videos.ts` for the full list.

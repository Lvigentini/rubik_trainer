# Phase C — Remote Persistence with Accounts (Planning Doc)

> **Status: PLANNED, not implemented.** Written 2026-07-06. Nothing in the codebase changes
> until this is approved and scheduled. Parent spec: `docs/superpowers/specs/2026-07-04-ux-overhaul-design.md` §5
> (Phase A in-memory ✅, Phase B localStorage ✅ shipped 2026-07-06).

## Goal

Signed-in learners keep their progress across devices. Anonymous learners lose nothing they
have today. The app remains a Vite SPA; the backend is the thinnest possible layer.

## Open decisions (owner: Lorenzo — recommendations marked)

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Auth provider | **Clerk** (Vercel Marketplace native, drop-in React `<SignInButton>`, JWT verification in functions, free tier) / Auth0 / Supabase Auth | **Clerk** — least friction for a Vite SPA on Vercel |
| 2 | Database | **Neon Postgres** (Marketplace serverless PG, spec's assumption) / Upstash Redis / Supabase | **Neon** — relational fits per-lesson merge; auto-provisioned env vars |
| 3 | Account model | **Optional sign-in** (anonymous = localStorage as today; sign-in adds sync; local progress merges up on first login) / required sign-in | **Optional** — no wall in front of lesson 1; consistent with guided-discovery positioning |
| 4 | Provisioning | Lorenzo clicks through Vercel Marketplace (Clerk + Neon, ~5 min) against a documented env contract / guided live session | Either; code is built against `.env.example` regardless |

## Architecture

```
Browser (Vite SPA)
  ProgressProvider
    └─ createProgressStore()
         ├─ signed out → LocalStorageProgressStore        (unchanged, Phase B)
         └─ signed in  → SyncedProgressStore
                           ├─ wraps LocalStorageProgressStore (local remains source of truth)
                           └─ background sync ⇅ /api/progress (debounced push, pull on login/focus)
Vercel Functions (/api, Fluid Compute, Node)
  GET  /api/progress   → verify Clerk JWT → SELECT snapshot
  PUT  /api/progress   → verify Clerk JWT → per-lesson merge → UPSERT
Neon Postgres
  progress(user_id text PK, snapshot jsonb, updated_at timestamptz)
```

- **The interface does the work again:** `SyncedProgressStore implements ProgressStore`; the swap
  point is the existing `createProgressStore()` factory in `src/main.tsx` (now auth-aware).
  Nothing else in the app changes.
- **Local-first:** every mutation lands in localStorage synchronously (exactly Phase B), then a
  debounced (~2s) push sends the snapshot. Offline or API failure = silent retry later; the UX
  never blocks on the network.
- **Auth UI:** Clerk `<ClerkProvider>` at the root; a compact sign-in/avatar button in the top
  bar next to the theme toggle. Signed-out state shows "Sign in to sync".

## Sync & merge semantics (the core design)

Per the spec: **last-write-wins per lesson record**, not per whole snapshot.

- `lessons`: per stage id, keep the record with the later `completedAt`; if equal, higher
  `attempts` wins. (Mastery stays improve-only in effect because both sides already enforce it.)
- `selfChecks`: per key, keep the record with more `attempts`; `lastCorrectAt` = max.
- `practice`: `totalSessions`/`totalMoves` = **max** of the two sides (not sum — both sides may
  contain the same synced history; max is idempotent and never double-counts, at the cost of
  undercounting genuinely-parallel offline play — acceptable for v1, noted).
- `streak`: keep the side with the later `lastActiveDate`; if equal dates, higher `current`.
- Merge runs **server-side** on PUT (authoritative), and client-side once on login to fold
  anonymous local progress into the account view immediately. Same pure function, unit-tested,
  shared source (`src/progress/merge.ts`) — the API function imports it too.
- Timestamps come from clients (already in the schema as ISO strings). Clock skew therefore
  affects LWW ordering; acceptable at this stakes level, noted as a known limit.

## API contract

- `GET /api/progress` → `200 { snapshot }` | `204` (no row yet) | `401`.
- `PUT /api/progress` body `{ snapshot }` → server merges with stored row → `200 { snapshot }`
  (the merged result, which the client adopts and persists locally) | `401` | `422` (fails the
  same structural validation as Phase B's loader — reuse `isValidSnapshot`).
- Auth: `Authorization: Bearer <Clerk session JWT>`; verified in the function with Clerk's
  backend SDK (`@clerk/backend`), `userId` from the token is the row key. No user table of our
  own — Clerk owns identity.
- Rate/abuse: snapshot size cap (~32 KB, generous ×10 over real size), Vercel's default
  function limits otherwise.

## Database schema (single migration file, `db/001_progress.sql`)

```sql
CREATE TABLE IF NOT EXISTS progress (
  user_id    text PRIMARY KEY,
  snapshot   jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

Snapshot stays the versioned JSON from Phase B — the existing client-side migration table keeps
owning schema evolution; the server stores opaquely and only understands the fields the merge
touches.

## Env contract (`.env.example`)

```
VITE_CLERK_PUBLISHABLE_KEY=   # Clerk dashboard → API keys (client)
CLERK_SECRET_KEY=             # Clerk (server, functions only)
DATABASE_URL=                 # Neon connection string (server, functions only)
```

Local dev: `vercel dev` (or `vite` + `vercel dev --listen` for /api) with `vercel env pull`.
Requires installing the Vercel CLI (currently not installed).

## Edge cases pinned now

1. **First sign-in with local progress:** pull remote (likely 204) → merge local into it → PUT →
   adopt merged result. Anonymous work is never lost.
2. **Sign-out:** keep the local snapshot (device keeps working anonymously); no wipe. Signing
   into a *different* account then merges the device snapshot into that account — acceptable v1
   behavior, documented; a "start fresh on account switch" prompt is a possible refinement.
3. **Two devices offline simultaneously:** per-lesson LWW on the next pushes; practice totals
   take max (see above).
4. **Corrupt remote row:** GET validation failure → treated as 204 (client pushes its state up).
5. **Clerk/network down:** app behaves exactly like Phase B; a subtle "sync paused" indicator
   near the avatar is the only UI trace.

## Delivery outline (when approved)

1. `merge.ts` + tests (pure logic, no infra needed) — can land ahead of everything.
2. `/api/progress` function + Clerk verification + Neon client (`@neondatabase/serverless`) +
   schema file; contract tests with stubbed auth/db.
3. `SyncedProgressStore` + auth-aware factory + Clerk provider/top-bar UI + sync-status hint.
4. Provisioning (Lorenzo): Marketplace → Clerk + Neon, run the SQL, `vercel env pull`, deploy.
5. Two-device verification pass + final review.

Estimated code footprint: ~600 lines + tests; no changes to Learn/Play/Home beyond the top-bar
auth button.

## Out of scope (explicitly)

- Realtime multi-device live sync (polling/refetch-on-focus only).
- Leaderboards, sharing, multi-profile households.
- Server-side analytics.
- Deleting the localStorage path — it stays as both the anonymous mode and the offline cache.

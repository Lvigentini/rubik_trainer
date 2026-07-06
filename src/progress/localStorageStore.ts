import { InMemoryProgressStore } from './inMemoryStore';
import {
  emptySnapshot,
  type Mastery,
  type PracticeSession,
  type ProgressSnapshot,
  type ProgressStore,
} from './types';
import type { LearningStageId } from '../learningPath';

export const PROGRESS_STORAGE_KEY = 'rubik-trainer-progress';
const CURRENT_VERSION = 1;

/** The subset of the Storage API we use — injectable for tests and for
 * environments where window.localStorage itself throws on access. */
export type ProgressStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Migration table: MIGRATIONS[n] upgrades a version-n snapshot to n+1.
 * Empty while the schema is at v1 — the loader walks stored.version up to
 * CURRENT_VERSION, and any gap in the table means "cannot migrate" (fresh
 * start), never a crash. */
const MIGRATIONS: Record<number, (old: Record<string, unknown>) => Record<string, unknown>> = {};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Structural sanity check on the (possibly migrated) parsed value. Lenient on
 * purpose — unknown extra fields survive, missing containers disqualify. */
function isValidSnapshot(value: Record<string, unknown>): value is Record<string, unknown> & ProgressSnapshot {
  const streak = value.streak;
  return (
    value.version === CURRENT_VERSION &&
    isRecord(value.lessons) &&
    isRecord(value.selfChecks) &&
    isRecord(value.practice) &&
    isRecord(streak) &&
    typeof streak.current === 'number' &&
    typeof streak.best === 'number' &&
    typeof streak.lastActiveDate === 'string'
  );
}

/** Parse + migrate + validate stored JSON. Returns undefined (→ empty
 * snapshot) on ANY problem: absent, corrupt JSON, unknown/future version,
 * missing migration step, structural mismatch. Never throws. */
export function loadStoredSnapshot(storage: ProgressStorage): ProgressSnapshot | undefined {
  try {
    const raw = storage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || typeof parsed.version !== 'number') return undefined;
    let current = parsed;
    while (typeof current.version === 'number' && current.version < CURRENT_VERSION) {
      const migrate = MIGRATIONS[current.version];
      if (!migrate) return undefined;
      current = migrate(current);
      if (!isRecord(current)) return undefined;
    }
    return isValidSnapshot(current) ? current : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Phase B of the persistence plan: the same ProgressStore contract, hydrated
 * from and written through to localStorage on every mutation. Storage
 * failures (quota, private browsing) degrade silently to in-memory behavior —
 * progress UX keeps working, it just won't outlive the tab.
 */
export class LocalStorageProgressStore implements ProgressStore {
  private inner: InMemoryProgressStore;

  constructor(
    private storage: ProgressStorage,
    now?: () => Date,
  ) {
    this.inner = new InMemoryProgressStore(now, loadStoredSnapshot(storage) ?? emptySnapshot());
  }

  getSnapshot(): ProgressSnapshot {
    return this.inner.getSnapshot();
  }

  subscribe(listener: () => void): () => void {
    return this.inner.subscribe(listener);
  }

  completeLesson(stageId: LearningStageId, mastery: Mastery, hintsUsed: number): void {
    this.inner.completeLesson(stageId, mastery, hintsUsed);
    this.persist();
  }

  recordSelfCheck(stageId: LearningStageId, checkId: string, correct: boolean): void {
    this.inner.recordSelfCheck(stageId, checkId, correct);
    this.persist();
  }

  recordPracticeSession(session: PracticeSession): void {
    this.inner.recordPracticeSession(session);
    this.persist();
  }

  private persist(): void {
    try {
      this.storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(this.inner.getSnapshot()));
    } catch {
      // Quota exceeded / private mode: keep serving the in-memory snapshot.
    }
  }
}

/** App entry point: durable store when localStorage is usable, silent
 * in-memory fallback when merely touching it throws (some privacy modes). */
export function createProgressStore(now?: () => Date): ProgressStore {
  try {
    return new LocalStorageProgressStore(window.localStorage, now);
  } catch {
    return new InMemoryProgressStore(now);
  }
}

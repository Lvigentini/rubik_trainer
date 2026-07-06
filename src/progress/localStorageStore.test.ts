import { describe, expect, it } from 'vitest';
import {
  LocalStorageProgressStore,
  PROGRESS_STORAGE_KEY,
  loadStoredSnapshot,
  type ProgressStorage,
} from './localStorageStore';
import { emptySnapshot } from './types';

function memoryStorage(seed?: Record<string, string>): ProgressStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(seed ?? {}));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const NOW = () => new Date('2026-07-06T12:00:00');

describe('LocalStorageProgressStore — persistence', () => {
  it('starts empty on fresh storage and persists every mutation', () => {
    const storage = memoryStorage();
    const store = new LocalStorageProgressStore(storage, NOW);
    expect(store.getSnapshot()).toEqual(emptySnapshot());

    store.completeLesson('2x2-orientation', 3, 0);
    const written = JSON.parse(storage.data.get(PROGRESS_STORAGE_KEY)!);
    expect(written.lessons['2x2-orientation']).toMatchObject({ mastery: 3, attempts: 1 });
    expect(written.version).toBe(1);

    store.recordSelfCheck('2x2-orientation', '2x2-orientation-check', true);
    store.recordPracticeSession({ cubeSize: '2x2', mode: 'free', moves: 12, elapsedMs: 40_000, solved: true });
    const finalWrite = JSON.parse(storage.data.get(PROGRESS_STORAGE_KEY)!);
    expect(finalWrite.selfChecks['2x2-orientation:2x2-orientation-check'].attempts).toBe(1);
    expect(finalWrite.practice.bestTimeMsBySize['2x2']).toBe(40_000);
  });

  it('progress survives into a new store instance (the reload case)', () => {
    const storage = memoryStorage();
    const first = new LocalStorageProgressStore(storage, NOW);
    first.completeLesson('2x2-orientation', 2, 1);
    first.completeLesson('2x2-first-face', 3, 0);

    const second = new LocalStorageProgressStore(storage, NOW);
    const snapshot = second.getSnapshot();
    expect(Object.keys(snapshot.lessons)).toHaveLength(2);
    expect(snapshot.lessons['2x2-orientation']?.mastery).toBe(2);
    expect(snapshot.streak.current).toBe(1);
  });

  it('keeps functioning in memory when setItem throws (quota/private mode)', () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    const store = new LocalStorageProgressStore(storage, NOW);
    expect(() => store.completeLesson('2x2-orientation', 3, 0)).not.toThrow();
    expect(store.getSnapshot().lessons['2x2-orientation']).toBeDefined();
  });
});

describe('loadStoredSnapshot — corrupt and foreign data never crash', () => {
  it.each([
    ['absent', undefined],
    ['corrupt JSON', '{not json'],
    ['non-object', '"hello"'],
    ['array', '[1,2,3]'],
    ['missing version', '{"lessons":{}}'],
    ['future version', JSON.stringify({ ...emptySnapshot(), version: 99 })],
    ['missing containers', '{"version":1,"lessons":{}}'],
    ['malformed streak', JSON.stringify({ ...emptySnapshot(), streak: { current: 'nope' } })],
  ])('%s → undefined (fresh start)', (_label, raw) => {
    const storage = memoryStorage(raw === undefined ? undefined : { [PROGRESS_STORAGE_KEY]: raw });
    expect(loadStoredSnapshot(storage)).toBeUndefined();
  });

  it('round-trips a valid v1 snapshot, preserving unknown extra fields', () => {
    const stored = { ...emptySnapshot(), futureField: 'kept' };
    const storage = memoryStorage({ [PROGRESS_STORAGE_KEY]: JSON.stringify(stored) });
    const loaded = loadStoredSnapshot(storage);
    expect(loaded).toMatchObject({ version: 1, futureField: 'kept' });
  });
});
